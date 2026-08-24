<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDataStore } from '../stores/data';

const store = useDataStore();

type SortKey = 'uid' | 'nickname' | 'points';
const sortKey = ref<SortKey>('uid');
const sortAsc = ref(true); // 默认按 UID 升序

const sorted = computed(() => {
  const list = [...store.remote.points];
  list.sort((a, b) => {
    const ka = a[sortKey.value] ?? '';
    const kb = b[sortKey.value] ?? '';
    const sa = String(ka);
    const sb = String(kb);
    const numeric =
      (typeof ka === 'number' && typeof kb === 'number') || (/^\d+$/.test(sa) && /^\d+$/.test(sb));
    const cmp = numeric ? Number(ka) - Number(kb) : sa.localeCompare(sb, 'zh-CN');
    return sortAsc.value ? cmp : -cmp;
  });
  return list;
});

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortKey.value = key;
    sortAsc.value = key !== 'points'; // 积分默认降序，其余默认升序
  }
}

function arrow(key: SortKey): string {
  if (sortKey.value !== key) return '';
  return sortAsc.value ? ' ▲' : ' ▼';
}
</script>

<template>
  <div>
    <h1 class="page-title">笨狐黧积分榜</h1>
    <p class="page-subtitle">点击表头可按该列排序</p>

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="sortable" @click="toggleSort('uid')">UID{{ arrow('uid') }}</th>
              <th class="sortable" @click="toggleSort('nickname')">昵称{{ arrow('nickname') }}</th>
              <th class="sortable" @click="toggleSort('points')">积分{{ arrow('points') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in sorted" :key="p.id">
              <td>{{ p.uid }}</td>
              <td>{{ p.nickname }}</td>
              <td class="points-cell">{{ p.points }}</td>
            </tr>
            <tr v-if="sorted.length === 0">
              <td colspan="3" class="empty">暂无积分数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sortable {
  cursor: pointer;
  user-select: none;
}
.sortable:hover {
  color: var(--pink);
}
.points-cell {
  font-weight: 700;
  color: var(--pink-deep);
}
.empty {
  text-align: center;
  color: var(--ink-light);
  padding: 20px 0;
}
</style>
