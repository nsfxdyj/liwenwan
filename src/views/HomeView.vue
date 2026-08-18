<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useDataStore } from '../stores/data';
import { nowBJ } from '../utils/time';

const store = useDataStore();

const settings = computed(() => store.remote.settings);
const lines = computed(() => settings.value.welcome_lines.filter((l) => l.trim()));
const currentLine = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

// 主页公告弹窗（今日不再提示记 localStorage）
const POPUP_KEY = 'lww_popup_mute';
const showPopup = ref(false);

// 北京时间日期串
function todayStr(): string {
  const { year, month, day } = nowBJ();
  return `${year}-${month}-${day}`;
}

function startRotation() {
  if (timer || lines.value.length <= 1) return;
  timer = setInterval(() => {
    currentLine.value = (currentLine.value + 1) % lines.value.length;
  }, 4000);
}

function checkPopup() {
  const popup = settings.value.home_popup;
  if (popup?.enabled && popup.content) {
    if (localStorage.getItem(POPUP_KEY) !== todayStr()) showPopup.value = true;
  }
}

// 数据就绪（fetch 完成）后再启动轮播与弹窗判断；immediate 兼容已就绪的场景
const stop = watch(
  () => store.loaded,
  (loaded) => {
    if (!loaded) return;
    startRotation();
    checkPopup();
    stop(); // 只初始化一次
  },
  { immediate: true },
);

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const muteToday = ref(false);
function closePopup() {
  if (muteToday.value) localStorage.setItem(POPUP_KEY, todayStr());
  showPopup.value = false;
}

const navIconBase = `${import.meta.env.BASE_URL}uploads/nav`;
const entries = [
  { to: '/news', icon: `${navIconBase}/news.webp`, label: '动态', desc: '主播最新公告' },
  { to: '/gifts', icon: `${navIconBase}/gifts.webp`, label: '舰礼', desc: '每月上舰回馈' },
  { to: '/songs', icon: `${navIconBase}/songs.webp`, label: '歌单', desc: '点歌台开张啦' },
  { to: '/calendar', icon: `${navIconBase}/calendar.webp`, label: '日历', desc: '活动安排' },
  { to: '/videos', icon: `${navIconBase}/videos.webp`, label: '视频', desc: '精彩片段回顾' },
  { to: '/points', icon: `${navIconBase}/points.webp`, label: '积分', desc: '笨狐黧积分榜' },
  { to: '/games', icon: `${navIconBase}/games.webp`, label: '游戏', desc: '摸鱼小游戏' },
  { to: '/about', icon: `${navIconBase}/about.webp`, label: '关于', desc: '关于本站' },
];
</script>

<template>
  <div class="home">
    <section class="hero card">
      <img v-if="settings.home_deco" :src="settings.home_deco" alt="装饰图" class="hero-deco" />
      <div v-else class="hero-deco hero-deco-emoji">🦊</div>
      <h1 class="hero-title">{{ settings.site_name || '黧温婉粉丝站' }}</h1>
      <transition name="fade" mode="out-in">
        <p v-if="lines.length" :key="currentLine" class="hero-line">{{ lines[currentLine] }}</p>
        <p v-else class="hero-line">欢迎回家，笨狐黧～</p>
      </transition>
    </section>

    <section class="nav-grid">
      <router-link v-for="e in entries" :key="e.to" :to="e.to" class="nav-card card">
        <img class="nav-icon" :src="e.icon" :alt="e.label" loading="lazy" />
        <span class="nav-label">{{ e.label }}</span>
        <span class="nav-desc">{{ e.desc }}</span>
      </router-link>
    </section>

    <transition name="fade">
      <div v-if="showPopup" class="popup-mask" @click.self="closePopup">
        <div class="popup card">
          <h3 class="popup-title">📢 站点公告</h3>
          <p class="popup-content">{{ settings.home_popup.content }}</p>
          <label class="popup-mute">
            <input type="checkbox" v-model="muteToday" /> 今日不再提示
          </label>
          <div class="btn-row" style="justify-content: center">
            <button @click="closePopup">知道啦</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  text-align: center;
  padding: 56px 20px 48px;
  overflow: hidden;
}
.hero-deco {
  position: absolute;
  top: 16px;
  right: 22px;
  width: 120px;
  animation: float 3s ease-in-out infinite;
}
.hero-deco-emoji {
  width: auto;
  font-size: 52px;
}
.hero-title {
  font-size: 44px;
  font-weight: 800;
  background: linear-gradient(120deg, var(--pink-deep), var(--purple));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 16px;
}
.hero-line {
  font-size: 18px;
  color: var(--ink-light);
  min-height: 27px;
}
.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 14px;
  margin-top: 20px;
}
.nav-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 22px 12px;
  color: var(--ink);
  transition: transform 0.15s ease;
}
.nav-card:hover {
  transform: translateY(-4px);
}
.nav-icon {
  width: 72px;
  height: 72px;
  object-fit: contain;
  border-radius: 14px;
}
.nav-label {
  font-size: 17px;
  font-weight: 700;
  color: var(--pink-deep);
}
.nav-desc {
  font-size: 12px;
  color: var(--ink-light);
}
.popup-mask {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(90, 74, 94, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.popup {
  max-width: 420px;
  width: 100%;
  text-align: center;
}
.popup-title {
  color: var(--pink-deep);
  margin-bottom: 12px;
}
.popup-content {
  line-height: 1.8;
  margin-bottom: 14px;
  white-space: pre-wrap;
  text-align: left;
}
.popup-mute {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ink-light);
  margin-bottom: 16px;
}
.popup-mute input {
  width: auto;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
@media (max-width: 640px) {
  .hero-title {
    font-size: 30px;
  }
  .hero-deco {
    width: 72px;
  }
  .hero-deco-emoji {
    width: auto;
    font-size: 36px;
  }
}
</style>
