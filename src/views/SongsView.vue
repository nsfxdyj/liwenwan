<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDataStore } from '../stores/data';

const store = useDataStore();
const keyword = ref('');

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return store.remote.songs;
  return store.remote.songs.filter(
    (s) =>
      (s.name ?? '').toLowerCase().includes(kw) ||
      (s.artist ?? '').toLowerCase().includes(kw) ||
      (s.note ?? '').toLowerCase().includes(kw),
  );
});
</script>

<template>
  <div>
    <h1 class="page-title">黧温婉の点歌台</h1>
    <p class="page-subtitle">欢迎直播间点播，慎点，小心耳朵！心动盲点一首</p>

    <div class="card">
      <input v-model="keyword" class="search" placeholder="搜索歌名 / 歌手 / 备注…" />
      <p class="count">共 {{ filtered.length }} 首</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>歌名</th><th>歌手</th><th>备注</th></tr>
          </thead>
          <tbody>
            <tr v-for="(s, i) in filtered" :key="s.id">
              <td>{{ i + 1 }}</td>
              <td>{{ s.name }}</td>
              <td>{{ s.artist }}</td>
              <td>{{ s.note }}</td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="4" class="empty">没有找到相关歌曲，换首歌试试？</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search {
  margin-bottom: 10px;
}
.count {
  font-size: 13px;
  color: var(--ink-light);
  margin-bottom: 8px;
}
.empty {
  text-align: center;
  color: var(--ink-light);
  padding: 20px 0;
}
</style>
