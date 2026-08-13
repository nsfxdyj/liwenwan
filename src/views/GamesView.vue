<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import MonopolyGame from '../components/MonopolyGame.vue';

type GameKey = 'bomb' | 'dice' | 'guaguale' | 'monopoly';
const active = ref<GameKey>('bomb');

/* ── 数字炸弹（10×10 格子矩阵，点击格子猜数） ── */
const bomb = ref(0);
const low = ref(1);
const high = ref(100);
const attempts = ref(0);
const lastPicked = ref(0); // 最近一次点击的数字（触发动画用）
const bombMsg = ref('');
const exploded = ref(false);

const explodeGif = `${import.meta.env.BASE_URL}uploads/bomb-explode.gif`;

function resetBomb() {
  bomb.value = Math.floor(Math.random() * 100) + 1;
  low.value = 1;
  high.value = 100;
  attempts.value = 0;
  lastPicked.value = 0;
  bombMsg.value = '炸弹已埋好（1–100），点一个格子开始猜！';
  exploded.value = false;
}
resetBomb();

interface BombCell {
  n: number;
  eliminated: boolean; // 已排除（在当前有效区间外）
  isBomb: boolean; // 爆炸后标记炸弹格
  picked: boolean; // 最近一次点击
}

const bombCells = computed<BombCell[]>(() => {
  const list: BombCell[] = [];
  for (let n = 1; n <= 100; n++) {
    list.push({
      n,
      eliminated: n < low.value || n > high.value,
      isBomb: exploded.value && n === bomb.value,
      picked: n === lastPicked.value,
    });
  }
  return list;
});

function pickCell(cell: BombCell) {
  if (exploded.value || cell.eliminated) return;
  const n = cell.n;
  attempts.value++;
  lastPicked.value = n;
  if (n === bomb.value) {
    exploded.value = true;
    bombMsg.value = '💥 砰！你踩到炸弹了！';
  } else if (n < bomb.value) {
    low.value = n + 1;
    bombMsg.value = `安全～范围缩小为 ${low.value} – ${high.value}`;
  } else {
    high.value = n - 1;
    bombMsg.value = `安全～范围缩小为 ${low.value} – ${high.value}`;
  }
}

/* ── 掷骰子 ── */
const diceCount = ref(1);
const diceResults = ref<number[]>([1]);
const rolling = ref(false);
const diceTotal = computed(() => diceResults.value.reduce((a, b) => a + b, 0));
let diceTimer: ReturnType<typeof setInterval> | null = null;

function rollDice() {
  if (rolling.value) return;
  rolling.value = true;
  let ticks = 0;
  diceTimer = setInterval(() => {
    diceResults.value = Array.from({ length: diceCount.value }, () => Math.floor(Math.random() * 6) + 1);
    ticks++;
    if (ticks >= 10) {
      if (diceTimer) clearInterval(diceTimer);
      diceTimer = null;
      rolling.value = false;
    }
  }, 80);
}

onUnmounted(() => {
  if (diceTimer) clearInterval(diceTimer);
});

const guagualeUrl = `${import.meta.env.BASE_URL}games/guaguale/index.html`;
</script>

<template>
  <div>
    <h1 class="page-title">摸鱼小游戏</h1>
    <p class="page-subtitle">摸鱼小游戏合集，数据都只存在你自己的浏览器里</p>

    <div class="game-entries">
      <button :class="{ plain: active !== 'bomb' }" @click="active = 'bomb'">💣 数字炸弹</button>
      <button :class="{ plain: active !== 'dice' }" @click="active = 'dice'">🎲 掷骰子</button>
      <button :class="{ plain: active !== 'monopoly' }" @click="active = 'monopoly'">🏠 大富翁</button>
      <button :class="{ plain: active !== 'guaguale' }" @click="active = 'guaguale'">🎫 刮刮乐</button>
    </div>

    <div v-if="active === 'bomb'" class="card game-card">
      <h3 class="game-title">💣 数字炸弹</h3>
      <p class="game-msg" :class="{ boom: exploded }">{{ bombMsg }}</p>
      <p class="bomb-status">当前区间：{{ low }} – {{ high }}　|　已猜 {{ attempts }} 次</p>
      <div class="bomb-grid">
        <button
          v-for="cell in bombCells"
          :key="cell.n + '-' + cell.picked"
          :class="['bomb-cell', { eliminated: cell.eliminated, 'is-bomb': cell.isBomb, pulse: cell.picked && !exploded }]"
          :disabled="cell.eliminated || exploded"
          @click="pickCell(cell)"
        >{{ cell.isBomb ? '💣' : cell.n }}</button>
      </div>
      <div class="btn-row" style="justify-content: center; margin-top: 16px">
        <button class="plain" @click="resetBomb">重新开始</button>
      </div>

      <!-- 爆炸效果：全屏居中覆盖 -->
      <transition name="fade">
        <div v-if="exploded" class="explode-mask">
          <div class="explode-box">
            <img :src="explodeGif" alt="爆炸" class="explode-gif" />
            <p class="explode-text">用了 {{ attempts }} 次猜中炸弹！</p>
            <button @click="resetBomb">再来一局</button>
          </div>
        </div>
      </transition>
    </div>

    <div v-else-if="active === 'dice'" class="card game-card">
      <h3 class="game-title">🎲 掷骰子</h3>
      <div class="dice-options">
        <label v-for="n in [1, 2, 3]" :key="n" class="dice-opt">
          <input type="radio" :value="n" v-model.number="diceCount" /> {{ n }} 颗
        </label>
      </div>
      <div class="dice-row" :class="{ rolling }">
        <span v-for="(r, i) in diceResults" :key="i" class="die">{{ ['⚀','⚁','⚂','⚃','⚄','⚅'][r - 1] }}</span>
      </div>
      <p class="game-msg">合计：{{ diceTotal }} 点</p>
      <div class="btn-row" style="justify-content: center">
        <button :disabled="rolling" @click="rollDice">{{ rolling ? '摇动中…' : '掷！' }}</button>
      </div>
    </div>

    <div v-else-if="active === 'monopoly'" class="card game-card monopoly-card">
      <h3 class="game-title">🏠 大富翁跳格子</h3>
      <MonopolyGame />
    </div>

    <div v-else class="card game-card guaguale-card">
      <h3 class="game-title">🎫 刮刮乐</h3>
      <iframe :src="guagualeUrl" class="guaguale-frame" title="刮刮乐"></iframe>
    </div>
  </div>
</template>

<style scoped>
.game-entries {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.game-card {
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
}
.game-title {
  color: var(--pink-deep);
  margin-bottom: 14px;
}
.game-msg {
  margin-bottom: 10px;
  color: var(--ink-light);
}
.game-msg.boom {
  color: #e0506e;
  font-weight: 700;
}
.bomb-status {
  font-size: 13px;
  color: var(--ink-light);
  margin-bottom: 14px;
}
.bomb-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 6px;
  max-width: 560px;
  margin: 0 auto;
}
.bomb-cell {
  aspect-ratio: 1;
  padding: 0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(140deg, var(--pink), var(--purple));
  transition: transform 0.2s ease, opacity 0.2s ease, background 0.2s ease;
}
.bomb-cell:not(:disabled):hover {
  transform: translateY(-2px) scale(1.08);
  box-shadow: 0 4px 10px rgba(240, 98, 146, 0.35);
}
.bomb-cell.eliminated {
  background: #e9e2ec;
  color: #b6aabd;
  text-decoration: line-through;
  cursor: not-allowed;
  box-shadow: none;
}
.bomb-cell.is-bomb {
  background: linear-gradient(140deg, #ff5f6d, #c0392b);
  font-size: 16px;
  animation: boom 0.5s ease;
}
.bomb-cell.pulse {
  animation: cell-pulse 0.35s ease;
}
.explode-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(40, 16, 30, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.explode-box {
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 24px 32px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  animation: boom 0.45s ease;
}
.explode-gif {
  width: min(280px, 60vw);
  border-radius: 14px;
}
.explode-text {
  margin: 12px 0 16px;
  font-size: 18px;
  font-weight: 800;
  color: var(--pink-deep);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.dice-options {
  display: flex;
  gap: 18px;
  justify-content: center;
  margin-bottom: 14px;
}
.dice-opt {
  display: flex;
  align-items: center;
  gap: 4px;
}
.dice-opt input {
  width: auto;
}
.dice-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 12px;
}
.die {
  font-size: 56px;
  color: var(--pink-deep);
}
.rolling .die {
  animation: shake 0.08s linear infinite;
}
.guaguale-card {
  max-width: 860px;
}
.monopoly-card {
  max-width: 860px;
}
.guaguale-frame {
  width: 100%;
  height: 78vh;
  min-height: 480px;
  border: none;
  border-radius: 12px;
  background: #14060d;
}
@keyframes boom {
  0% { transform: scale(0.2); }
  60% { transform: scale(1.4); }
  100% { transform: scale(1); }
}
@keyframes cell-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.25); }
  100% { transform: scale(1); }
}
@keyframes shake {
  0% { transform: rotate(-10deg); }
  100% { transform: rotate(10deg); }
}
@media (max-width: 640px) {
  .bomb-grid {
    gap: 4px;
  }
  .bomb-cell {
    font-size: 11px;
    border-radius: 6px;
  }
}
</style>
