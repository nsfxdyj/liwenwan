<script setup lang="ts">
import { computed, ref } from 'vue';

type GameKey = 'bomb' | 'dice' | 'guaguale';
const active = ref<GameKey>('bomb');

/* ── 数字炸弹 ── */
const bomb = ref(0);
const low = ref(1);
const high = ref(100);
const guess = ref('');
const bombMsg = ref('');
const exploded = ref(false);

function resetBomb() {
  bomb.value = Math.floor(Math.random() * 100) + 1;
  low.value = 1;
  high.value = 100;
  guess.value = '';
  bombMsg.value = '炸弹已埋好（1–100），开始猜吧！';
  exploded.value = false;
}
resetBomb();

function submitGuess() {
  if (exploded.value) return;
  const n = Number(guess.value);
  if (!Number.isInteger(n) || n < low.value || n > high.value) {
    bombMsg.value = `请输入 ${low.value} 到 ${high.value} 之间的整数`;
    return;
  }
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
  guess.value = '';
}

/* ── 掷骰子 ── */
const diceCount = ref(1);
const diceResults = ref<number[]>([1]);
const rolling = ref(false);
const diceTotal = computed(() => diceResults.value.reduce((a, b) => a + b, 0));

function rollDice() {
  if (rolling.value) return;
  rolling.value = true;
  let ticks = 0;
  const timer = setInterval(() => {
    diceResults.value = Array.from({ length: diceCount.value }, () => Math.floor(Math.random() * 6) + 1);
    ticks++;
    if (ticks >= 10) {
      clearInterval(timer);
      rolling.value = false;
    }
  }, 80);
}

const guagualeUrl = `${import.meta.env.BASE_URL}games/guaguale/index.html`;
</script>

<template>
  <div>
    <h1 class="page-title">摸鱼小游戏</h1>
    <p class="page-subtitle">三个小游戏，数据都只存在你自己的浏览器里</p>

    <div class="game-entries">
      <button :class="{ plain: active !== 'bomb' }" @click="active = 'bomb'">💣 数字炸弹</button>
      <button :class="{ plain: active !== 'dice' }" @click="active = 'dice'">🎲 掷骰子</button>
      <button :class="{ plain: active !== 'guaguale' }" @click="active = 'guaguale'">🎫 刮刮乐</button>
    </div>

    <div v-if="active === 'bomb'" class="card game-card">
      <h3 class="game-title">💣 数字炸弹</h3>
      <p class="game-msg" :class="{ boom: exploded }">{{ bombMsg }}</p>
      <div v-if="exploded" class="explode">💥</div>
      <div class="btn-row" style="justify-content: center">
        <template v-if="!exploded">
          <input
            v-model="guess"
            type="number"
            class="guess-input"
            :placeholder="`${low} - ${high}`"
            @keyup.enter="submitGuess"
          />
          <button @click="submitGuess">猜！</button>
        </template>
        <button v-else @click="resetBomb">再来一局</button>
      </div>
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
  margin-bottom: 14px;
  color: var(--ink-light);
}
.game-msg.boom {
  color: #e0506e;
  font-weight: 700;
}
.explode {
  font-size: 64px;
  animation: boom 0.5s ease;
  margin-bottom: 10px;
}
.guess-input {
  max-width: 160px;
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
@keyframes shake {
  0% { transform: rotate(-10deg); }
  100% { transform: rotate(10deg); }
}
</style>
