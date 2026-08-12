<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useDataStore, type EventItem } from '../stores/data';
import { formatDateTimeBJ, nowBJ, parseBJ, remainMs } from '../utils/time';

const store = useDataStore();

// 北京时间"今天"，每分钟刷新，避免挂页跨天不更新
const today = ref(nowBJ());
const dayTimer = setInterval(() => {
  today.value = nowBJ();
}, 60000);

const viewYear = ref(today.value.year);
const viewMonth = ref(today.value.month); // 1-12

function prevMonth() {
  if (viewMonth.value === 1) { viewYear.value--; viewMonth.value = 12; }
  else viewMonth.value--;
}
function nextMonth() {
  if (viewMonth.value === 12) { viewYear.value++; viewMonth.value = 1; }
  else viewMonth.value++;
}
function backToday() {
  viewYear.value = today.value.year;
  viewMonth.value = today.value.month;
}

interface CellDay {
  day: number;
  events: EventItem[];
  isToday: boolean;
}

const cells = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value - 1, 1);
  const daysInMonth = new Date(viewYear.value, viewMonth.value, 0).getDate();
  const leading = first.getDay(); // 周日开头
  const mm = String(viewMonth.value).padStart(2, '0');
  const list: (CellDay | null)[] = [];
  for (let i = 0; i < leading; i++) list.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dd = String(d).padStart(2, '0');
    const dateStr = `${viewYear.value}-${mm}-${dd}`;
    list.push({
      day: d,
      events: store.remote.events.filter((e) => {
        const t = parseBJ(e.event_at);
        return !isNaN(t.getTime()) && dateStr === bjDateStr(t);
      }),
      isToday: d === today.value.day && viewMonth.value === today.value.month && viewYear.value === today.value.year,
    });
  }
  return list;
});

function bjDateStr(d: Date): string {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

// 近期活动（未结束，按时间升序，取前 5 个）
const upcoming = computed(() =>
  store.remote.events
    .filter((e) => remainMs(e.event_at) > 0)
    .sort((a, b) => parseBJ(a.event_at).getTime() - parseBJ(b.event_at).getTime())
    .slice(0, 5),
);

// 下一个活动倒计时
const nextEvent = computed(() => upcoming.value[0] ?? null);
const countdown = ref('');
let timer: ReturnType<typeof setInterval> | null = null;

function tick() {
  if (!nextEvent.value) { countdown.value = ''; return; }
  const ms = remainMs(nextEvent.value.event_at);
  if (ms <= 0) { countdown.value = '已开始'; return; }
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  countdown.value = `${d} 天 ${h} 时 ${m} 分 ${s} 秒`;
}

onMounted(() => {
  tick();
  timer = setInterval(tick, 1000);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
  clearInterval(dayTimer);
});

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
</script>

<template>
  <div>
    <h1 class="page-title">日历</h1>
    <p class="page-subtitle">活动安排一目了然</p>

    <div class="calendar-layout">
      <div class="card cal-card">
        <div class="cal-head">
          <button class="plain" @click="prevMonth">‹</button>
          <span class="cal-title">{{ viewYear }} 年 {{ viewMonth }} 月</span>
          <button class="plain" @click="nextMonth">›</button>
          <button class="plain today-btn" @click="backToday">今天</button>
        </div>
        <div class="cal-grid cal-week">
          <span v-for="w in weekDays" :key="w">{{ w }}</span>
        </div>
        <div class="cal-grid">
          <div v-for="(cell, i) in cells" :key="i" :class="['cal-cell', { empty: !cell, today: cell?.isToday }]">
            <template v-if="cell">
              <span class="cal-day">{{ cell.day }}</span>
              <span v-for="e in cell.events" :key="'e' + e.id" class="mark event" :title="e.title">📌{{ e.title }}</span>
            </template>
          </div>
        </div>
      </div>

      <aside class="side">
        <div v-if="nextEvent" class="card side-card countdown-card">
          <h3 class="side-title">⏳ 下一活动</h3>
          <p class="next-title">{{ nextEvent.title }}</p>
          <p class="next-time">{{ formatDateTimeBJ(nextEvent.event_at) }}</p>
          <p class="countdown">{{ countdown }}</p>
        </div>

        <div class="card side-card">
          <h3 class="side-title">📌 近期活动</h3>
          <p v-if="upcoming.length === 0" class="side-empty">近期暂无活动安排</p>
          <div v-for="e in upcoming" :key="e.id" class="event-item">
            <p class="event-title">{{ e.title }}</p>
            <p class="event-time">{{ formatDateTimeBJ(e.event_at) }}</p>
            <p v-if="e.description" class="event-desc">{{ e.description }}</p>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.calendar-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 16px;
  align-items: start;
}
.cal-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.cal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--pink-deep);
}
.today-btn {
  margin-left: auto;
  padding: 6px 14px;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.cal-week span {
  text-align: center;
  font-size: 13px;
  color: var(--ink-light);
  padding: 6px 0;
}
.cal-cell {
  min-height: 78px;
  border-radius: 10px;
  background: rgba(255, 214, 231, 0.25);
  padding: 4px 6px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cal-cell.empty {
  background: transparent;
}
.cal-cell.today {
  outline: 2px solid var(--pink);
  background: #fff0f6;
}
.cal-day {
  font-weight: 700;
  color: var(--ink);
}
.mark {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 6px;
  padding: 1px 4px;
}
.mark.event {
  background: var(--purple-light);
  color: #7a5aa8;
}
.side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.side-title {
  color: var(--pink-deep);
  font-size: 16px;
  margin-bottom: 10px;
}
.side-empty {
  color: var(--ink-light);
  font-size: 13px;
}
.countdown-card {
  background: linear-gradient(140deg, #fff, var(--purple-light));
}
.next-title {
  font-weight: 700;
  margin-bottom: 4px;
}
.next-time {
  font-size: 13px;
  color: var(--ink-light);
}
.countdown {
  margin-top: 8px;
  font-size: 20px;
  font-weight: 800;
  color: var(--pink-deep);
}
.event-item {
  padding: 8px 0;
  border-bottom: 1px dashed var(--pink-light);
}
.event-item:last-child {
  border-bottom: none;
}
.event-title {
  font-weight: 600;
  font-size: 14px;
}
.event-time {
  font-size: 12px;
  color: var(--ink-light);
}
.event-desc {
  font-size: 13px;
  color: var(--ink-light);
  margin-top: 4px;
  white-space: pre-wrap;
}
@media (max-width: 860px) {
  .calendar-layout {
    grid-template-columns: 1fr;
  }
  .cal-cell {
    min-height: 60px;
  }
}
</style>
