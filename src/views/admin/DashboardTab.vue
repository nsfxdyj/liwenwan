<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore, dataLabel, type DataKey } from '../../stores/data';
import { formatDateTimeBJ } from '../../utils/time';

const store = useDataStore();

const keys: DataKey[] = ['news', 'gifts', 'songs', 'events', 'videos', 'points'];

const counts = computed(() =>
  keys.map((k) => ({ key: k, label: dataLabel(k), count: ((store.draft[k] as unknown[]) ?? []).length })),
);

const dirtyLabels = computed(() => Array.from(store.dirty).map((k) => dataLabel(k)));

const lastPublishText = computed(() => {
  if (!store.lastPublish) return '从未发布';
  return `${formatDateTimeBJ(store.lastPublish.time)}　${store.lastPublish.result}`;
});
</script>

<template>
  <div class="card">
    <h3 class="tab-title">仪表盘</h3>

    <div class="stat-grid">
      <div v-for="c in counts" :key="c.key" class="stat">
        <div class="stat-num">{{ c.count }}</div>
        <div class="stat-label">{{ c.label }}</div>
      </div>
    </div>

    <div class="publish-state">
      <h4 class="sub-title">发布状态</h4>
      <p>上次发布：{{ lastPublishText }}</p>
      <p v-if="store.hasUnpublished" class="dirty">
        有未发布改动：{{ dirtyLabels.join('、') }}（请到「发布」页提交）
      </p>
      <p v-else class="clean">当前没有未发布的改动</p>
      <div class="btn-row" style="margin-top: 10px">
        <button v-if="store.hasUnpublished" class="danger" @click="store.discardDraft()">放弃全部未发布改动</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-title {
  color: var(--pink-deep);
  margin-bottom: 16px;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.stat {
  background: linear-gradient(140deg, var(--pink-light), var(--purple-light));
  border-radius: 14px;
  text-align: center;
  padding: 16px 8px;
}
.stat-num {
  font-size: 26px;
  font-weight: 800;
  color: var(--pink-deep);
}
.stat-label {
  font-size: 13px;
  color: var(--ink);
  margin-top: 4px;
}
.sub-title {
  color: var(--pink-deep);
  margin-bottom: 8px;
}
.publish-state p {
  margin-bottom: 6px;
  font-size: 14px;
}
.dirty {
  color: #c07a2a;
}
.clean {
  color: #4c9a6c;
}
</style>
