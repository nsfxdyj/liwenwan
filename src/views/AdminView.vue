<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import CrudTable, { type Field } from '../components/admin/CrudTable.vue';
import DashboardTab from './admin/DashboardTab.vue';
import SettingsTab from './admin/SettingsTab.vue';
import PublishTab from './admin/PublishTab.vue';

const auth = useAuthStore();
const router = useRouter();

// ── 登录表单 ──
const username = ref('');
const password = ref('');
const loginError = ref('');
const logging = ref(false);

async function doLogin() {
  loginError.value = '';
  logging.value = true;
  try {
    const err = await auth.login(username.value.trim(), password.value);
    if (err) loginError.value = err;
  } finally {
    logging.value = false;
    password.value = '';
  }
}

// ── 后台标签页 ──
type TabKey =
  | 'dashboard' | 'settings' | 'news' | 'gifts' | 'songs'
  | 'events' | 'birthdays' | 'videos' | 'honor' | 'publish';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'dashboard', label: '仪表盘' },
  { key: 'settings', label: '站点设置' },
  { key: 'news', label: '动态管理' },
  { key: 'gifts', label: '舰礼管理' },
  { key: 'songs', label: '歌单管理' },
  { key: 'events', label: '活动管理' },
  { key: 'birthdays', label: '生日墙管理' },
  { key: 'videos', label: '视频管理' },
  { key: 'honor', label: '感谢名单' },
  { key: 'publish', label: '发布' },
];
const activeTab = ref<TabKey>('dashboard');

const newsFields: Field[] = [
  { key: 'title', label: '标题', type: 'text' },
  { key: 'content', label: '内容', type: 'textarea', hideInTable: true },
  { key: 'created_at', label: '发布时间', type: 'datetime' },
  { key: 'updated_at', label: '更新时间', type: 'datetime', hideInTable: true },
];

const giftFields: Field[] = [
  { key: 'title', label: '名称', type: 'text' },
  { key: 'image', label: '图片', type: 'image', hideInTable: true },
  { key: 'description', label: '说明', type: 'textarea', hideInTable: true },
  { key: 'month', label: '月份', type: 'month' },
  { key: 'status', label: '状态', type: 'select', options: ['on', 'off'], default: () => 'on' },
  { key: 'sort', label: '排序', type: 'number' },
];

const songFields: Field[] = [
  { key: 'name', label: '歌名', type: 'text' },
  { key: 'artist', label: '歌手', type: 'text' },
  { key: 'note', label: '备注', type: 'text' },
];

const eventFields: Field[] = [
  { key: 'title', label: '活动名', type: 'text' },
  { key: 'event_at', label: '时间', type: 'datetime', placeholder: 'YYYY-MM-DD HH:mm:ss' },
  { key: 'description', label: '说明', type: 'textarea', hideInTable: true },
];

const birthdayFields: Field[] = [
  { key: 'nickname', label: '昵称', type: 'text' },
  { key: 'birthday', label: '生日（MM-DD）', type: 'text', placeholder: '如 08-12' },
];

const videoFields: Field[] = [
  { key: 'bvid', label: 'BV号', type: 'text', placeholder: '如 BV1xx411c7mD' },
  { key: 'title', label: '标题', type: 'text' },
  { key: 'category', label: '分类', type: 'select', options: ['回忆', '录屏', '黑历史'], default: () => '回忆' },
  { key: 'cover', label: '封面图片链接', type: 'text', placeholder: '从B站视频页复制图片地址粘贴', hideInTable: true },
  { key: 'description', label: '说明（≤200字）', type: 'textarea', maxlength: 200, hideInTable: true },
  { key: 'created_at', label: '添加时间', type: 'datetime' },
];

const honorFields: Field[] = [
  { key: 'nickname', label: '昵称', type: 'text' },
  { key: 'level', label: '等级', type: 'select', options: ['总督', '提督', '舰长'], default: () => '舰长' },
  { key: 'on_board', label: '是否在船', type: 'checkbox' },
  { key: 'note', label: '备注', type: 'text' },
];
</script>

<template>
  <!-- 未登录：管理员登录框 + 返回首页 -->
  <div v-if="!auth.isLoggedIn" class="login-wrap">
    <div class="card login-card">
      <h2 class="login-title">管理后台</h2>
      <p class="login-hint">本站为粉丝站，仅站点管理员可登录。普通访客请返回首页。</p>
      <div class="form-row">
        <label>用户名</label>
        <input v-model="username" type="text" autocomplete="off" @keyup.enter="doLogin" />
      </div>
      <div class="form-row">
        <label>密码</label>
        <input v-model="password" type="password" autocomplete="off" @keyup.enter="doLogin" />
      </div>
      <p v-if="loginError" class="error">{{ loginError }}</p>
      <div class="btn-row" style="justify-content: center">
        <button :disabled="logging" @click="doLogin">{{ logging ? '登录中…' : '登录' }}</button>
        <button class="plain" @click="router.push('/')">返回首页</button>
      </div>
    </div>
  </div>

  <!-- 已登录：后台界面 -->
  <div v-else class="admin-wrap">
    <header class="admin-header">
      <span class="admin-brand">🦊 黧温婉粉丝站 · 管理后台</span>
      <div class="btn-row">
        <span class="admin-user">{{ auth.username }}</span>
        <button class="plain" @click="router.push('/')">查看站点</button>
        <button class="danger" @click="auth.logout()">退出登录</button>
      </div>
    </header>

    <nav class="admin-tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        :class="['tab-btn', { active: activeTab === t.key }]"
        @click="activeTab = t.key"
      >{{ t.label }}</button>
    </nav>

    <main class="admin-content">
      <DashboardTab v-if="activeTab === 'dashboard'" />
      <SettingsTab v-else-if="activeTab === 'settings'" />
      <CrudTable v-else-if="activeTab === 'news'" title="动态" data-key="news" :fields="newsFields" />
      <CrudTable v-else-if="activeTab === 'gifts'" title="舰礼" data-key="gifts" :fields="giftFields" />
      <CrudTable v-else-if="activeTab === 'songs'" title="歌单" data-key="songs" :fields="songFields" batch-import />
      <CrudTable v-else-if="activeTab === 'events'" title="活动" data-key="events" :fields="eventFields" />
      <CrudTable v-else-if="activeTab === 'birthdays'" title="生日墙" data-key="birthdays" :fields="birthdayFields" />
      <CrudTable v-else-if="activeTab === 'videos'" title="视频" data-key="videos" :fields="videoFields" />
      <CrudTable v-else-if="activeTab === 'honor'" title="大航海感谢名单" data-key="guard_honor" :fields="honorFields" />
      <PublishTab v-else />
    </main>
  </div>
</template>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.login-card {
  width: 100%;
  max-width: 380px;
}
.login-title {
  text-align: center;
  color: var(--pink-deep);
  margin-bottom: 8px;
}
.login-hint {
  text-align: center;
  font-size: 13px;
  color: var(--ink-light);
  margin-bottom: 18px;
}
.error {
  color: #c0475f;
  font-size: 13px;
  margin-bottom: 12px;
  text-align: center;
}
.admin-wrap {
  min-height: 100vh;
  background: linear-gradient(160deg, #fff0f6, #f6efff);
}
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 12px rgba(240, 98, 146, 0.12);
}
.admin-brand {
  font-weight: 800;
  color: var(--pink-deep);
}
.admin-user {
  font-size: 13px;
  color: var(--ink-light);
}
.admin-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 12px 20px 0;
  max-width: 1080px;
  margin: 0 auto;
}
.tab-btn {
  background: #fff;
  color: var(--ink);
  border: 1px solid var(--pink-light);
  padding: 6px 14px;
  font-size: 13px;
}
.tab-btn.active {
  background: linear-gradient(120deg, var(--pink), var(--purple));
  color: #fff;
  border-color: transparent;
}
.admin-content {
  max-width: 1080px;
  margin: 0 auto;
  padding: 16px 20px 60px;
}
</style>
