import { defineStore } from 'pinia';
import JSZip from 'jszip';
import { isDataUrl } from '../utils/image';
import {
  commitFiles,
  getLatestRun,
  textToBase64,
  type ActionRunInfo,
  type PublishConfig,
  type RepoFile,
} from '../utils/github';

export interface Settings {
  site_name: string;
  logo: string;
  wallpaper: string;
  welcome_lines: string[];
  home_popup: { content: string; enabled: boolean };
  gift_notice: string;
  contacts: { type: string; value: string }[];
  icp_no: string;
}

export interface NewsItem { id: string; title: string; content: string; created_at: string; updated_at: string }
export interface GiftItem { id: string; title: string; image: string; description: string; month: string; status: 'on' | 'off'; sort: number }
export interface SongItem { id: string; name: string; artist: string; note: string }
export interface EventItem { id: string; title: string; event_at: string; description: string }
export interface BirthdayItem { id: string; nickname: string; birthday: string }
export interface VideoItem { id: string; bvid: string; title: string; cover: string; description: string; category: string; created_at: string }
export interface HonorItem { id: string; nickname: string; level: string; on_board: boolean; note: string }

export const DATA_FILES = [
  'settings',
  'news',
  'gifts',
  'songs',
  'events',
  'birthdays',
  'videos',
  'guard_honor',
] as const;

export type DataKey = (typeof DATA_FILES)[number];

const DATA_LABELS: Record<DataKey, string> = {
  settings: '站点设置',
  news: '动态',
  gifts: '舰礼',
  songs: '歌单',
  events: '活动',
  birthdays: '生日墙',
  videos: '视频',
  guard_honor: '感谢名单',
};

export function dataLabel(key: DataKey): string {
  return DATA_LABELS[key];
}

const DEFAULT_SETTINGS: Settings = {
  site_name: '黧温婉粉丝站',
  logo: '',
  wallpaper: '',
  welcome_lines: [],
  home_popup: { content: '', enabled: false },
  gift_notice: '',
  contacts: [],
  icp_no: '',
};

type DraftState = {
  settings: Settings;
  news: NewsItem[];
  gifts: GiftItem[];
  songs: SongItem[];
  events: EventItem[];
  birthdays: BirthdayItem[];
  videos: VideoItem[];
  guard_honor: HonorItem[];
};

function emptyDraft(): DraftState {
  return {
    settings: { ...DEFAULT_SETTINGS },
    news: [],
    gifts: [],
    songs: [],
    events: [],
    birthdays: [],
    videos: [],
    guard_honor: [],
  };
}

const LAST_PUBLISH_KEY = 'lww_last_publish';

export const useDataStore = defineStore('data', {
  state: () => ({
    loaded: false,
    loadError: '',
    // 线上（已发布）数据的快照，前台页面读这里
    remote: emptyDraft() as DraftState,
    // 后台编辑草稿
    draft: emptyDraft() as DraftState,
    dirty: new Set<DataKey>(),
    publishing: false,
    publishLog: '',
    lastPublish: JSON.parse(localStorage.getItem(LAST_PUBLISH_KEY) ?? 'null') as
      | { time: string; result: string }
      | null,
  }),
  getters: {
    hasUnpublished: (s) => s.dirty.size > 0,
  },
  actions: {
    async loadAll(force = false) {
      if (this.loaded && !force) return;
      try {
        const base = import.meta.env.BASE_URL;
        const entries = await Promise.all(
          DATA_FILES.map(async (key) => {
            const res = await fetch(`${base}data/${key}.json`, { cache: 'no-store' });
            if (!res.ok) throw new Error(`${key}.json 加载失败（${res.status}）`);
            return [key, await res.json()] as const;
          }),
        );
        const data = emptyDraft();
        for (const [key, value] of entries) {
          if (key === 'settings') data.settings = { ...DEFAULT_SETTINGS, ...(value as object) };
          else (data as Record<string, unknown>)[key] = value;
        }
        this.remote = data;
        // 站点名缓存到 localStorage，供路由标题在 store 初始化前读取（避免循环依赖）
        localStorage.setItem('lww_site_name', data.settings.site_name || '');
        // 草稿仅在未编辑过时同步，避免覆盖未发布改动
        if (this.dirty.size === 0) this.draft = JSON.parse(JSON.stringify(data));
        this.loaded = true;
        this.loadError = '';
      } catch (e) {
        this.loadError = e instanceof Error ? e.message : '数据加载失败';
      }
    },

    updateDraft<K extends DataKey>(key: K, value: DraftState[K]) {
      this.draft[key] = value;
      this.dirty.add(key);
    },

    discardDraft() {
      this.draft = JSON.parse(JSON.stringify(this.remote));
      this.dirty.clear();
    },

    // 把草稿中的 dataURL 图片抽出来生成待上传文件，JSON 里替换为 uploads/ 路径
    async buildPublishFiles(): Promise<RepoFile[]> {
      const files: RepoFile[] = [];
      const stamp = Date.now();
      let imgIndex = 0;

      const keys = this.dirty.size > 0 ? Array.from(this.dirty) : [];
      for (const key of keys) {
        let json = JSON.stringify(this.draft[key], null, 2);
        // 扫描 dataURL 图片
        const matches = Array.from(json.matchAll(/data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)/g));
        for (const m of matches) {
          const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
          const name = `upload-${stamp}-${imgIndex++}.${ext}`;
          files.push({
            path: `public/uploads/${name}`,
            base64: m[2],
            message: `chore: 上传图片 ${name}`,
          });
          json = json.split(m[0]).join(`uploads/${name}`);
        }
        files.push({
          path: `public/data/${key}.json`,
          base64: textToBase64(json + '\n'),
          message: `content: 更新${DATA_LABELS[key]}（${key}.json）`,
        });
      }
      return files;
    },

    async publish(cfg: PublishConfig): Promise<string> {
      if (this.dirty.size === 0) throw new Error('没有未发布的改动');
      this.publishing = true;
      this.publishLog = '正在提交到 GitHub…';
      try {
        const files = await this.buildPublishFiles();
        const headSha = await commitFiles(cfg, files, (done, total, path) => {
          this.publishLog = `正在提交 ${done}/${total}：${path || '完成'}`;
        });
        this.remote = JSON.parse(JSON.stringify(this.draft));
        this.dirty.clear();
        this.lastPublish = { time: new Date().toISOString(), result: '已提交，等待构建' };
        localStorage.setItem(LAST_PUBLISH_KEY, JSON.stringify(this.lastPublish));
        return headSha;
      } finally {
        this.publishing = false;
      }
    },

    // 轮询本次发布（按 headSha 匹配）对应的 Actions run；返回 null 表示无法自动确认（403 降级）
    async pollActions(
      cfg: PublishConfig,
      headSha: string,
      onUpdate: (info: ActionRunInfo) => void,
    ): Promise<ActionRunInfo | null> {
      const started = Date.now();
      // 最多轮询 5 分钟
      while (Date.now() - started < 5 * 60 * 1000) {
        let run: ActionRunInfo | null;
        try {
          run = await getLatestRun(cfg, headSha);
        } catch (e) {
          // Token 未授予 Actions 读权限（403）时降级为中性提示，不报红错
          if (e instanceof Error && e.message.includes('403')) {
            this.lastPublish = {
              time: new Date().toISOString(),
              result: '已提交，请到 GitHub Actions 页面确认结果',
            };
            localStorage.setItem(LAST_PUBLISH_KEY, JSON.stringify(this.lastPublish));
            return null;
          }
          throw e;
        }
        if (run) {
          onUpdate(run);
          if (run.status === 'completed') {
            this.lastPublish = {
              time: new Date().toISOString(),
              result: run.conclusion === 'success' ? '发布成功' : `发布失败（${run.conclusion ?? '未知'}）`,
            };
            localStorage.setItem(LAST_PUBLISH_KEY, JSON.stringify(this.lastPublish));
            return run;
          }
        }
        await new Promise((r) => setTimeout(r, 15000));
      }
      throw new Error('等待构建超时，请稍后到 GitHub Actions 页面查看');
    },

    // 备用：导出全部数据（草稿态 JSON + 其中 dataURL 图片还原为文件）
    async exportZip(): Promise<Blob> {
      const zip = new JSZip();
      const dataDir = zip.folder('data');
      const uploadsDir = zip.folder('uploads');
      const stamp = Date.now();
      let imgIndex = 0;

      for (const key of DATA_FILES) {
        let json = JSON.stringify(this.draft[key], null, 2);
        const matches = Array.from(json.matchAll(/data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)/g));
        for (const m of matches) {
          const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
          const name = `upload-${stamp}-${imgIndex++}.${ext}`;
          uploadsDir?.file(name, m[2], { base64: true });
          json = json.split(m[0]).join(`uploads/${name}`);
        }
        dataDir?.file(`${key}.json`, json + '\n');
      }
      zip.file(
        '使用说明.txt',
        '将 data/ 下全部 JSON 覆盖到仓库 public/data/，将 uploads/ 下图片复制到仓库 public/uploads/，提交并推送即可。\n',
      );
      return zip.generateAsync({ type: 'blob' });
    },
  },
});
