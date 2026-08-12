<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

defineProps<{ siteName: string }>();

// 加载动画素材（透明底 gif）
const loadingGif = `${import.meta.env.BASE_URL}uploads/loading.gif`;

const progress = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  timer = setInterval(() => {
    progress.value = Math.min(100, progress.value + 8);
    if (progress.value >= 100 && timer) clearInterval(timer);
  }, 100);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="loading-screen">
    <img :src="loadingGif" alt="加载中" class="loading-gif" />
    <div class="loading-title">{{ siteName || '黧温婉粉丝站' }}</div>
    <div class="loading-bar">
      <div class="loading-bar-inner" :style="{ width: progress + '%' }"></div>
    </div>
    <div class="loading-text">正在加载小窝，请稍候… {{ progress }}%</div>
  </div>
</template>

<style scoped>
.loading-screen {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  background: linear-gradient(160deg, #fff0f6, #f3e9ff);
}
.loading-gif {
  width: 160px;
  height: 160px;
  object-fit: contain;
}
.loading-title {
  font-size: 26px;
  font-weight: 800;
  background: linear-gradient(120deg, #f06292, #c9a7eb);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.loading-bar {
  width: min(320px, 70vw);
  height: 10px;
  border-radius: 999px;
  background: #ffe3ee;
  overflow: hidden;
}
.loading-bar-inner {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #ff8fb8, #c9a7eb);
  transition: width 0.1s linear;
}
.loading-text {
  color: #9a86a0;
  font-size: 14px;
}
</style>

