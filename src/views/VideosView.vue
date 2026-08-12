<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDataStore } from '../stores/data';
import { parseBJ } from '../utils/time';

const store = useDataStore();

const CATEGORIES = ['全部', '回忆', '录屏', '黑历史'];
const PAGE_SIZE = 9;

const category = ref('全部');
const page = ref(1);

const sorted = computed(() =>
  [...store.remote.videos].sort((a, b) => parseBJ(b.created_at).getTime() - parseBJ(a.created_at).getTime()),
);

const filtered = computed(() =>
  category.value === '全部' ? sorted.value : sorted.value.filter((v) => v.category === category.value),
);

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)));

const paged = computed(() => {
  const p = Math.min(page.value, pageCount.value);
  return filtered.value.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
});

function setCategory(c: string) {
  category.value = c;
  page.value = 1;
}

function videoUrl(bvid: string): string {
  return `https://www.bilibili.com/video/${encodeURIComponent(bvid)}`;
}
</script>

<template>
  <div>
    <h1 class="page-title">精彩内容</h1>
    <p class="page-subtitle">管理员精选的B站视频，点击卡片跳转观看</p>

    <div class="filters">
      <button
        v-for="c in CATEGORIES"
        :key="c"
        :class="{ plain: category !== c }"
        @click="setCategory(c)"
      >{{ c }}</button>
    </div>

    <div class="video-grid">
      <a
        v-for="v in paged"
        :key="v.id"
        :href="videoUrl(v.bvid)"
        target="_blank"
        rel="noopener"
        class="card video-card"
      >
        <img v-if="v.cover" :src="v.cover" :alt="v.title" class="video-cover" />
        <div v-else class="video-cover video-cover-placeholder">🎬</div>
        <div class="video-body">
          <span class="tag">{{ v.category }}</span>
          <h3 class="video-title">{{ v.title }}</h3>
          <p class="video-desc">{{ v.description }}</p>
        </div>
      </a>
      <p v-if="paged.length === 0" class="empty">该分类下暂无视频</p>
    </div>

    <div v-if="pageCount > 1" class="pager">
      <button class="plain" :disabled="page <= 1" @click="page--">上一页</button>
      <span class="page-info">{{ page }} / {{ pageCount }}</span>
      <button class="plain" :disabled="page >= pageCount" @click="page++">下一页</button>
    </div>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
.video-card {
  padding: 0;
  overflow: hidden;
  color: var(--ink);
  transition: transform 0.15s ease;
}
.video-card:hover {
  transform: translateY(-4px);
}
.video-cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
}
.video-cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  background: linear-gradient(140deg, var(--pink-light), var(--purple-light));
}
.video-body {
  padding: 14px 16px 18px;
}
.video-title {
  margin: 8px 0 6px;
  font-size: 16px;
  color: var(--pink-deep);
}
.video-desc {
  font-size: 13px;
  color: var(--ink-light);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.empty {
  color: var(--ink-light);
  grid-column: 1 / -1;
  text-align: center;
  padding: 24px 0;
}
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 22px;
}
.page-info {
  color: var(--ink-light);
  font-size: 14px;
}
</style>
