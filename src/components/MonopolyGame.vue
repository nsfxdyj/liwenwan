<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useDataStore, type MonopolyCell } from '../stores/data';

const store = useDataStore();

const board = computed(() => store.remote.monopoly);
const cells = computed<MonopolyCell[]>(() => board.value.cells ?? []);
const characters = computed(() => board.value.characters ?? []);

/* ── 棋盘配色：普通格子按索引循环，起点/终点固定色 ── */
const NORMAL_COLORS = [
  'rgba(255, 183, 178, 0.55)',
  'rgba(181, 234, 215, 0.55)',
  'rgba(199, 206, 234, 0.55)',
  'rgba(255, 223, 186, 0.55)',
  'rgba(226, 240, 203, 0.55)',
  'rgba(250, 227, 209, 0.55)',
];
const START_COLOR = 'rgba(255, 215, 0, 0.55)';
const END_COLOR = 'rgba(240, 98, 146, 0.55)';

function cellColor(index: number): string {
  const total = cells.value.length;
  if (index === 0) return START_COLOR;
  if (total > 1 && index === total - 1) return END_COLOR;
  return NORMAL_COLORS[index % NORMAL_COLORS.length];
}

/* ── 进度持久化：每个角色独立 {charId: {cell, lap}} ── */
const STORAGE_KEY = 'lww_monopoly_v1';

type Progress = Record<string, { cell: number; lap: number }>;

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Progress;
  } catch {
    /* 忽略损坏数据 */
  }
  return {};
}

const progress = ref<Progress>(loadProgress());
const currentCharId = ref('');

// 数据异步就绪后默认选中第一个角色；当前角色被管理员删除时自愈重选
watch(
  characters,
  (cs) => {
    if (!cs.length) return;
    if (!cs.some((c) => c.id === currentCharId.value)) currentCharId.value = cs[0].id;
  },
  { immediate: true },
);

const currentChar = computed(() => characters.value.find((c) => c.id === currentCharId.value) ?? null);
const pos = computed(() => {
  const total = cells.value.length;
  const cell = progress.value[currentCharId.value]?.cell ?? 0;
  return total ? Math.min(cell, total - 1) : 0;
});
const lap = computed(() => progress.value[currentCharId.value]?.lap ?? 1);

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress.value));
}

function selectChar(id: string) {
  if (rolling.value || stepping.value) return;
  currentCharId.value = id;
}

function resetProgress() {
  if (!currentCharId.value || rolling.value || stepping.value) return;
  progress.value = { ...progress.value, [currentCharId.value]: { cell: 0, lap: 1 } };
  saveProgress();
}

/* ── 棋盘几何：绕 w×h 矩形一圈，顺时针从左上「起点」开始 ── */
const geom = computed(() => {
  const n = cells.value.length;
  if (!n) return { w: 0, h: 0, positions: [] as { row: number; col: number }[] };
  const w = Math.max(4, Math.ceil(n / 4) + 1);
  const h = w;
  const positions: { row: number; col: number }[] = [];
  for (let x = 1; x <= w; x++) positions.push({ row: 1, col: x });
  for (let y = 2; y <= h; y++) positions.push({ row: y, col: w });
  for (let x = w - 1; x >= 1; x--) positions.push({ row: h, col: x });
  for (let y = h - 1; y >= 2; y--) positions.push({ row: y, col: 1 });
  return { w, h, positions };
});

/* ── 掷骰子与逐格跳动 ── */
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const rolling = ref(false);
const stepping = ref(false);
const diceFace = ref(1);
const reward = ref<MonopolyCell | null>(null);

let diceTimer: ReturnType<typeof setInterval> | null = null;
let stepTimer: ReturnType<typeof setInterval> | null = null;

function roll() {
  if (rolling.value || stepping.value || !cells.value.length || !currentCharId.value) return;
  rolling.value = true;
  const final = 1 + Math.floor(Math.random() * 6);
  let ticks = 0;
  diceTimer = setInterval(() => {
    diceFace.value = 1 + Math.floor(Math.random() * 6);
    if (++ticks >= 10) {
      if (diceTimer) clearInterval(diceTimer);
      diceTimer = null;
      diceFace.value = final;
      rolling.value = false;
      moveSteps(final);
    }
  }, 80);
}

function moveSteps(steps: number) {
  stepping.value = true;
  let remaining = steps;
  stepTimer = setInterval(() => {
    const total = cells.value.length;
    let { cell, lap: l } = progress.value[currentCharId.value] ?? { cell: 0, lap: 1 };
    cell += 1;
    if (cell === total - 1) l += 1; // 经过/到达终点，圈数 +1
    if (cell >= total) cell = 0; // 闭合循环
    progress.value = { ...progress.value, [currentCharId.value]: { cell, lap: l } };
    if (--remaining <= 0) {
      if (stepTimer) clearInterval(stepTimer);
      stepTimer = null;
      stepping.value = false;
      saveProgress();
      reward.value = cells.value[cell] ?? null;
    }
  }, 260);
}

onUnmounted(() => {
  if (diceTimer) clearInterval(diceTimer);
  if (stepTimer) clearInterval(stepTimer);
});
</script>

<template>
  <div class="monopoly">
    <aside class="char-list">
      <div
        v-for="c in characters"
        :key="c.id"
        :class="['char-item', { active: c.id === currentCharId }]"
        @click="selectChar(c.id)"
      >
        <img v-if="c.image" :src="c.image" :alt="c.name" class="char-img" />
        <span v-else class="char-img char-img-placeholder">🦊</span>
        <span class="char-name">{{ c.name }}</span>
      </div>
    </aside>

    <div v-if="cells.length" class="board" :style="{ gridTemplateColumns: `repeat(${geom.w}, 1fr)` }">
      <div
        v-for="(cell, i) in cells"
        :key="cell.id"
        :class="['m-cell', { current: i === pos }]"
        :style="{
          gridRow: geom.positions[i].row,
          gridColumn: geom.positions[i].col,
          backgroundColor: cellColor(i),
        }"
      >
        <img v-if="cell.image" :src="cell.image" :alt="cell.label" class="m-cell-img" />
        <span class="m-cell-label">{{ cell.label }}</span>
        <img
          v-if="i === pos && currentChar?.image"
          :key="pos"
          :src="currentChar.image"
          alt="棋子"
          class="piece"
        />
      </div>
      <div class="board-center" :style="{ gridRow: `2 / ${geom.h}`, gridColumn: `2 / ${geom.w}` }">
        <p class="rules">{{ board.rules }}</p>
        <div class="dice-face" :class="{ rolling }">{{ DICE_FACES[diceFace - 1] }}</div>
        <button :disabled="rolling || stepping" @click="roll">
          {{ rolling ? '摇动中…' : stepping ? '跳动中…' : '掷骰子' }}
        </button>
        <p class="m-status">第 {{ lap }} 圈 · 第 {{ pos + 1 }} 格</p>
        <button class="plain reset-btn" @click="resetProgress">重置当前角色进度</button>
      </div>
    </div>
    <p v-else class="m-empty">棋盘还没有格子，请管理员到后台「大富翁设置」中添加。</p>

    <transition name="fade">
      <div v-if="reward" class="reward-mask" @click.self="reward = null">
        <div class="reward-box">
          <p class="reward-title">🎁 {{ reward.label }}</p>
          <img v-if="reward.image" :src="reward.image" :alt="reward.label" class="reward-img" />
          <button @click="reward = null">收下！</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.monopoly {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.char-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}
.char-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px;
  border-radius: 14px;
  background: rgba(255, 214, 231, 0.35);
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.char-item:hover {
  transform: translateY(-2px);
}
.char-item.active {
  border-color: var(--pink);
  background: #fff0f6;
}
.char-img {
  width: 56px;
  height: 56px;
  object-fit: contain;
}
.char-img-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
}
.char-name {
  font-size: 13px;
  color: var(--ink);
}
.board {
  flex: 1;
  display: grid;
  gap: 6px;
  min-width: 0;
}
.m-cell {
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  background: rgba(255, 214, 231, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 3px;
  overflow: hidden;
}
.m-cell.current {
  outline: 2px solid var(--pink);
  box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.6);
}
.m-cell-img {
  width: 60%;
  height: 55%;
  object-fit: contain;
}
.m-cell-label {
  font-size: 11px;
  line-height: 1.25;
  text-align: center;
  color: var(--ink);
  word-break: break-all;
}
.piece {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 40%;
  height: 40%;
  object-fit: contain;
  animation: hop 0.26s ease;
  filter: drop-shadow(0 2px 3px rgba(240, 98, 146, 0.4));
}
.board-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 14px;
  background: linear-gradient(140deg, rgba(255, 240, 246, 0.9), rgba(239, 228, 251, 0.9));
  padding: 14px;
  text-align: center;
}
.rules {
  font-size: 16px;
  font-weight: 700;
  color: var(--pink-deep);
  white-space: pre-wrap;
}
.dice-face {
  font-size: 52px;
  color: var(--pink-deep);
  line-height: 1;
}
.dice-face.rolling {
  animation: shake 0.08s linear infinite;
}
.m-status {
  font-size: 13px;
  color: var(--ink-light);
}
.reset-btn {
  padding: 4px 12px;
  font-size: 12px;
}
.m-empty {
  flex: 1;
  text-align: center;
  color: var(--ink-light);
  padding: 40px 0;
}
.reward-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(90, 74, 94, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.reward-box {
  background: rgba(255, 255, 255, 0.97);
  border-radius: 20px;
  padding: 26px 32px;
  text-align: center;
  box-shadow: 0 12px 40px rgba(240, 98, 146, 0.35);
  animation: pop 0.35s ease;
  max-width: 340px;
}
.reward-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--pink-deep);
  margin-bottom: 14px;
}
.reward-img {
  max-width: 200px;
  border-radius: 12px;
  display: block;
  margin: 0 auto 14px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@keyframes hop {
  0% { transform: translateY(-10px) scale(1.15); }
  100% { transform: translateY(0) scale(1); }
}
@keyframes pop {
  0% { transform: scale(0.6); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes shake {
  0% { transform: rotate(-10deg); }
  100% { transform: rotate(10deg); }
}
@media (max-width: 760px) {
  .monopoly {
    flex-direction: column;
  }
  .char-list {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .char-img {
    width: 44px;
    height: 44px;
  }
  .m-cell-label {
    font-size: 9px;
  }
  .board {
    gap: 4px;
  }
  .dice-face {
    font-size: 40px;
  }
  .rules {
    font-size: 14px;
  }
}
</style>
