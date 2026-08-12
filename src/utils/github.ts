// GitHub Contents API + Actions 状态轮询（后台「保存并发布」用）
// Token 仅存放在管理员本人浏览器的 localStorage，不写入代码、不上传任何地方。

export interface PublishConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export const DEFAULT_OWNER = 'nsfxdyj';
export const DEFAULT_REPO = 'liwenwan';

function apiBase(cfg: PublishConfig) {
  return `https://api.github.com/repos/${cfg.owner}/${cfg.repo}`;
}

async function ghFetch(cfg: PublishConfig, url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.headers ?? {}),
    },
  });
  return res;
}

// 取文件当前 sha（不存在返回 undefined）
async function getFileSha(cfg: PublishConfig, path: string): Promise<string | undefined> {
  const res = await ghFetch(
    cfg,
    `${apiBase(cfg)}/contents/${encodeURI(path)}?ref=${encodeURIComponent(cfg.branch)}`,
  );
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`获取 ${path} 状态失败（${res.status}）`);
  const data = await res.json();
  return data.sha as string | undefined;
}

export interface RepoFile {
  path: string; // 仓库内路径，如 public/data/news.json
  base64: string; // 文件内容的 base64
  message: string; // commit message
}

// 逐个文件提交（每文件一个 commit，逻辑简单可靠）
// 返回最后一个 commit 的 sha，供 Actions 轮询按 head_sha 精确匹配
export async function commitFiles(
  cfg: PublishConfig,
  files: RepoFile[],
  onProgress?: (done: number, total: number, path: string) => void,
): Promise<string> {
  let lastCommitSha = '';
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    onProgress?.(i, files.length, f.path);
    lastCommitSha = await putWithRetry(cfg, f);
  }
  onProgress?.(files.length, files.length, '');
  return lastCommitSha;
}

// PUT 单个文件；遇 409/422（多为 sha 冲突）重新获取 sha 自动重试至多 2 次
async function putWithRetry(cfg: PublishConfig, f: RepoFile): Promise<string> {
  const MAX_RETRY = 2;
  for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
    const sha = await getFileSha(cfg, f.path);
    const res = await ghFetch(cfg, `${apiBase(cfg)}/contents/${encodeURI(f.path)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: f.message,
        content: f.base64,
        branch: cfg.branch,
        ...(sha ? { sha } : {}),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return (data.commit?.sha as string) ?? '';
    }
    if ((res.status === 409 || res.status === 422) && attempt < MAX_RETRY) {
      continue; // 重新获取 sha 后重试
    }
    const text = await res.text();
    throw new Error(`提交 ${f.path} 失败（${res.status}）：${text.slice(0, 200)}`);
  }
  throw new Error(`提交 ${f.path} 失败：重试次数用尽`);
}

export interface ActionRunInfo {
  status: string; // queued / in_progress / completed
  conclusion: string | null; // success / failure / ...
  html_url: string;
  created_at: string;
  head_sha: string;
}

// 查询 workflow run：传入 headSha 时精确匹配本次发布的 run（避免误报旧 run 的结果）；
// 未匹配到返回 null（视为尚未开始）；Token 无 Actions 权限（403）时抛出带 403 标记的错误
export async function getLatestRun(cfg: PublishConfig, headSha?: string): Promise<ActionRunInfo | null> {
  const res = await ghFetch(
    cfg,
    `${apiBase(cfg)}/actions/runs?per_page=10&branch=${encodeURIComponent(cfg.branch)}`,
  );
  if (res.status === 403) throw new Error('查询 Actions 状态失败（403）');
  if (!res.ok) throw new Error(`查询 Actions 状态失败（${res.status}）`);
  const data = await res.json();
  const runs: any[] = data.workflow_runs ?? [];
  const run = headSha ? runs.find((r) => r.head_sha === headSha) : runs[0];
  if (!run) return null;
  return {
    status: run.status,
    conclusion: run.conclusion,
    html_url: run.html_url,
    created_at: run.created_at,
    head_sha: run.head_sha,
  };
}

export function textToBase64(text: string): string {
  // UTF-8 安全 base64
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
