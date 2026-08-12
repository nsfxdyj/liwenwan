<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '../stores/data';
import { formatDateTimeBJ, parseBJ } from '../utils/time';

const store = useDataStore();

const list = computed(() =>
  [...store.remote.news].sort((a, b) => parseBJ(b.created_at).getTime() - parseBJ(a.created_at).getTime()),
);
</script>

<template>
  <div>
    <h1 class="page-title">动态</h1>
    <p class="page-subtitle">主播的最新公告与小情报</p>

    <div class="timeline">
      <div v-for="item in list" :key="item.id" class="timeline-item">
        <div class="dot"></div>
        <div class="card news-card">
          <div class="news-head">
            <h3 class="news-title">{{ item.title }}</h3>
            <time class="news-time">{{ formatDateTimeBJ(item.created_at) }}</time>
          </div>
          <p class="news-content">{{ item.content }}</p>
        </div>
      </div>
      <p v-if="list.length === 0" class="empty">暂无动态，敬请期待～</p>
    </div>

    <div class="more-wrap">
      <a
        class="more-btn"
        href="https://space.bilibili.com/3546677879244804"
        target="_blank"
        rel="noopener"
      >查看更多（前往主播B站空间）</a>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  position: relative;
  margin: 10px 0 0 8px;
  padding-left: 22px;
  border-left: 2px dashed var(--pink-light);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.timeline-item {
  position: relative;
}
.dot {
  position: absolute;
  left: -30px;
  top: 26px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(120deg, var(--pink), var(--purple));
  box-shadow: 0 0 0 4px #ffe3ee;
}
.news-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}
.news-title {
  color: var(--pink-deep);
  font-size: 17px;
}
.news-time {
  color: var(--ink-light);
  font-size: 13px;
  white-space: nowrap;
}
.news-content {
  margin-top: 8px;
  line-height: 1.8;
  white-space: pre-wrap;
}
.empty {
  text-align: center;
  color: var(--ink-light);
  padding: 30px 0;
}
.more-wrap {
  text-align: center;
  margin-top: 26px;
}
.more-btn {
  display: inline-block;
  padding: 10px 26px;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(120deg, var(--pink), var(--purple));
}
</style>
