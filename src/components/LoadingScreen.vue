<script setup lang="ts">
import { onMounted, ref } from 'vue';

defineProps<{ logo: string; siteName: string }>();

const progress = ref(0);
onMounted(() => {
  const timer = setInterval(() => {
    progress.value = Math.min(100, progress.value + 8);
    if (progress.value >= 100) clearInterval(timer);
  }, 100);
});
</script>

<template>
  <div class="loading-screen">
    <img v-if="logo" :src="logo" alt="LOGO" class="loading-logo" />
    <div v-else class="loading-logo loading-logo-text">🦊</div>
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
.loading-logo {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 8px 30px rgba(240, 98, 146, 0.3);
  animation: bounce 1.2s ease infinite;
}
.loading-logo-text {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52px;
  background: #fff;
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
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
