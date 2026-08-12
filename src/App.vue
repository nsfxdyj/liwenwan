<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useDataStore } from './stores/data';
import LoadingScreen from './components/LoadingScreen.vue';
import SiteHeader from './components/SiteHeader.vue';
import SiteFooter from './components/SiteFooter.vue';

const store = useDataStore();
const route = useRoute();

// 加载页：仅当次会话首次访问显示
const showLoading = ref(!sessionStorage.getItem('lww_loaded'));
const loadingDone = ref(false);

const isAdmin = computed(() => route.path.startsWith('/admin'));

const wallpaperStyle = computed(() => {
  const wp = store.remote.settings.wallpaper;
  return wp ? { backgroundImage: `url("${wp}")` } : {};
});

onMounted(async () => {
  await store.loadAll();
  if (store.remote.settings.site_name) {
    // 站点名可配置：同步到标题
    const title = document.title.split(' - ')[0];
    document.title = route.meta.title ? `${title} - ${store.remote.settings.site_name}` : store.remote.settings.site_name;
  }
  if (showLoading.value) {
    // 简单进度动画后进入站点
    setTimeout(() => {
      showLoading.value = false;
      loadingDone.value = true;
      sessionStorage.setItem('lww_loaded', '1');
    }, 1600);
  }
});
</script>

<template>
  <LoadingScreen v-if="showLoading" :site-name="store.remote.settings.site_name" />
  <template v-else>
    <div class="wallpaper" :style="wallpaperStyle"></div>
    <div v-if="store.loadError" class="load-error">{{ store.loadError }}</div>
    <SiteHeader v-if="!isAdmin" />
    <main :class="isAdmin ? 'admin-main' : 'site-main'">
      <router-view />
    </main>
    <SiteFooter v-if="!isAdmin" />
  </template>
</template>
