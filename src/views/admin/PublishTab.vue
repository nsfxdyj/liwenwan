<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useDataStore } from '../../stores/data';
import { DEFAULT_OWNER, DEFAULT_REPO, type PublishConfig } from '../../utils/github';

const store = useDataStore();

// 发布设置持久化在本机 localStorage（Token 仅存管理员自己的浏览器）
const CFG_KEY = 'lww_publish_config';

interface StoredCfg {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

function loadCfg(): StoredCfg {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    if (raw) return { branch: 'main', ...JSON.parse(raw) };
  } catch { /* 忽略 */ }
  return { token: '', owner: DEFAULT_OWNER, repo: DEFAULT_REPO, branch: 'main' };
}

const cfg = reactive<StoredCfg>(loadCfg());
const cfgMsg = ref('');

function saveCfg() {
  localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  cfgMsg.value = '已保存到本浏览器（不会上传到任何地方）';
}

const publishing = ref(false);
const publishMsg = ref('');
const publishError = ref('');
const runState = ref('');

function toConfig(): PublishConfig {
  return { token: cfg.token.trim(), owner: cfg.owner.trim(), repo: cfg.repo.trim(), branch: cfg.branch.trim() || 'main' };
}

async function doPublish() {
  publishError.value = '';
  publishMsg.value = '';
  runState.value = '';
  if (!cfg.token.trim()) {
    publishError.value = '请先填写 GitHub Personal Access Token';
    return;
  }
  publishing.value = true;
  try {
    saveCfg();
    const headSha = await store.publish(toConfig());
    publishMsg.value = '已提交到仓库，正在等待 Actions 构建（约 1–3 分钟）…';
    // 按本次提交的 head_sha 轮询 Actions 状态
    const run = await store.pollActions(toConfig(), headSha, (info) => {
      runState.value = `构建中：${info.status}${info.conclusion ? ' / ' + info.conclusion : ''}`;
    });
    if (run === null) {
      // Token 无 Actions 读权限：中性提示，不算失败
      runState.value = '已提交，请到 GitHub Actions 页面确认结果';
    } else {
      runState.value = run.conclusion === 'success' ? '✅ 发布成功，线上已更新' : `❌ 发布失败：${run.conclusion}（详情见 GitHub Actions）`;
    }
    publishMsg.value = '';
  } catch (e) {
    publishError.value = e instanceof Error ? e.message : '发布失败';
  } finally {
    publishing.value = false;
  }
}

const exporting = ref(false);
async function doExport() {
  exporting.value = true;
  try {
    const blob = await store.exportZip();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liwenwan-data-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <div class="card">
    <h3 class="tab-title">发布设置</h3>
    <p class="hint">
      Token 为 GitHub 细粒度 Personal Access Token（仅授予本仓库 Contents 读写权限），
      仅保存在你自己浏览器的 localStorage，不会上传到任何地方。
    </p>
    <div class="form-row">
      <label>GitHub Personal Access Token</label>
      <input v-model="cfg.token" type="password" placeholder="github_pat_…" autocomplete="off" />
    </div>
    <div class="form-row">
      <label>仓库 Owner</label>
      <input v-model="cfg.owner" type="text" />
    </div>
    <div class="form-row">
      <label>仓库名</label>
      <input v-model="cfg.repo" type="text" />
    </div>
    <div class="form-row">
      <label>分支</label>
      <input v-model="cfg.branch" type="text" />
    </div>
    <div class="btn-row">
      <button class="plain" @click="saveCfg">保存设置</button>
      <span class="ok">{{ cfgMsg }}</span>
    </div>
  </div>

  <div class="card">
    <h3 class="tab-title">保存并发布</h3>
    <p class="hint">
      将未发布的改动通过 GitHub Contents API 提交到仓库，触发 Actions 自动构建发布到 Pages（约 1–3 分钟生效）。
    </p>
    <div class="btn-row">
      <button :disabled="publishing || !store.hasUnpublished" @click="doPublish">
        {{ publishing ? '发布中…' : store.hasUnpublished ? '保存并发布' : '没有未发布的改动' }}
      </button>
    </div>
    <p v-if="store.publishLog && publishing" class="hint">{{ store.publishLog }}</p>
    <p v-if="publishMsg" class="ok">{{ publishMsg }}</p>
    <p v-if="runState" class="run-state">{{ runState }}</p>
    <p v-if="publishError" class="error">{{ publishError }}</p>
  </div>

  <div class="card">
    <h3 class="tab-title">备用：导出全部数据</h3>
    <p class="hint">
      下载包含全部 JSON 与新增图片的 zip，可手动 git push 或在 GitHub 网页上传，效果与一键发布相同。
    </p>
    <button class="plain" :disabled="exporting" @click="doExport">{{ exporting ? '打包中…' : '导出全部数据（zip）' }}</button>
  </div>
</template>

<style scoped>
.card {
  margin-bottom: 16px;
}
.tab-title {
  color: var(--pink-deep);
  margin-bottom: 10px;
}
.hint {
  font-size: 13px;
  color: var(--ink-light);
  margin-bottom: 12px;
  line-height: 1.7;
}
.ok {
  color: #4c9a6c;
  font-size: 13px;
  margin-top: 10px;
}
.error {
  color: #c0475f;
  font-size: 13px;
  margin-top: 10px;
}
.run-state {
  margin-top: 10px;
  font-weight: 700;
  color: var(--pink-deep);
}
</style>
