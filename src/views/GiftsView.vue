<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { useDataStore, type GiftItem } from '../stores/data';
import { currentMonthBJ } from '../utils/time';

const store = useDataStore();

// 北京时间当前月份，每分钟刷新，避免挂页跨月不更新
const monthNow = ref(currentMonthBJ());
const monthTimer = setInterval(() => {
  monthNow.value = currentMonthBJ();
}, 60000);
onUnmounted(() => clearInterval(monthTimer));

const onGifts = computed(() => store.remote.gifts.filter((g) => g.status === 'on'));

const currentGifts = computed(() =>
  onGifts.value.filter((g) => g.month === monthNow.value).sort((a, b) => a.sort - b.sort),
);

// 往期舰礼：按 YYYY-MM 分组降序
const pastGroups = computed(() => {
  const groups = new Map<string, GiftItem[]>();
  for (const g of onGifts.value) {
    if (g.month === monthNow.value) continue;
    if (!groups.has(g.month)) groups.set(g.month, []);
    groups.get(g.month)!.push(g);
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, items]) => ({ month, items: items.sort((a, b) => a.sort - b.sort) }));
});
</script>

<template>
  <div>
    <h1 class="page-title">欢迎光临黧温婉の礼品店</h1>
    <p v-if="store.remote.settings.gift_notice" class="notice card">
      📢 {{ store.remote.settings.gift_notice }}
    </p>

    <h2 class="section-title">🎁 当月舰礼</h2>
    <div class="gift-grid">
      <div v-for="g in currentGifts" :key="g.id" class="card gift-card">
        <img v-if="g.image" :src="g.image" :alt="g.title" class="gift-img" />
        <div v-else class="gift-img gift-img-placeholder">🎀</div>
        <h3 class="gift-title">{{ g.title }}</h3>
        <p class="gift-desc">{{ g.description }}</p>
      </div>
      <p v-if="currentGifts.length === 0" class="empty">本月舰礼筹备中，敬请期待～</p>
    </div>

    <template v-if="pastGroups.length">
      <h2 class="section-title">🗂️ 往期舰礼</h2>
      <div v-for="group in pastGroups" :key="group.month" class="past-group">
        <h3 class="past-month">{{ group.month }}</h3>
        <div class="gift-grid">
          <div v-for="g in group.items" :key="g.id" class="card gift-card">
            <img v-if="g.image" :src="g.image" :alt="g.title" class="gift-img" />
            <div v-else class="gift-img gift-img-placeholder">🎀</div>
            <h3 class="gift-title">{{ g.title }}</h3>
            <p class="gift-desc">{{ g.description }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.notice {
  max-width: 720px;
  margin: 0 auto 24px;
  text-align: center;
  color: var(--ink-light);
  font-size: 14px;
}
.section-title {
  color: var(--pink-deep);
  margin: 26px 0 14px;
  font-size: 22px;
}
.gift-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.gift-card {
  text-align: center;
}
.gift-img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 12px;
}
.gift-img-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  background: linear-gradient(140deg, var(--pink-light), var(--purple-light));
}
.gift-title {
  margin: 12px 0 6px;
  color: var(--pink-deep);
  font-size: 16px;
}
.gift-desc {
  font-size: 13px;
  color: var(--ink-light);
  line-height: 1.7;
}
.past-group {
  margin-bottom: 10px;
}
.past-month {
  color: var(--purple);
  margin: 16px 0 10px;
  font-size: 16px;
}
.empty {
  color: var(--ink-light);
  padding: 16px 0;
}
</style>
