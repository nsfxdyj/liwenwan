<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDataStore, type MonopolyCell, type MonopolyCharacter, type MonopolyData } from '../../stores/data';
import { compressImage } from '../../utils/image';

const store = useDataStore();

const monopoly = computed<MonopolyData>(() => store.draft.monopoly);
const cells = computed<MonopolyCell[]>(() => monopoly.value.cells ?? []);
const characters = computed<MonopolyCharacter[]>(() => monopoly.value.characters ?? []);

function commit(next: MonopolyData) {
  store.updateDraft('monopoly', next);
}

/* ── 规则文案 ── */
const rulesText = ref(monopoly.value.rules ?? '');
const rulesMsg = ref('');
function saveRules() {
  commit({ ...monopoly.value, rules: rulesText.value });
  rulesMsg.value = '已保存到草稿';
}

/* ── 格子 CRUD ── */
const cellEdit = ref<MonopolyCell | null>(null);
const cellIsNew = ref(false);
const cellError = ref('');

function startAddCell() {
  cellEdit.value = { id: `c-${Date.now()}`, label: '', image: '' };
  cellIsNew.value = true;
  cellError.value = '';
}
function startEditCell(c: MonopolyCell) {
  cellEdit.value = JSON.parse(JSON.stringify(c));
  cellIsNew.value = false;
  cellError.value = '';
}
function saveCell() {
  cellError.value = '';
  if (!cellEdit.value!.label.trim()) {
    cellError.value = '格子文案必填';
    return;
  }
  cellEdit.value!.label = cellEdit.value!.label.trim();
  const list = [...cells.value];
  if (cellIsNew.value) list.push(cellEdit.value!);
  else {
    const i = list.findIndex((x) => x.id === cellEdit.value!.id);
    if (i >= 0) list[i] = cellEdit.value!;
  }
  commit({ ...monopoly.value, cells: list });
  cellEdit.value = null;
}
function removeCell(c: MonopolyCell) {
  if (!confirm(`确定删除格子「${c.label}」吗？`)) return;
  commit({ ...monopoly.value, cells: cells.value.filter((x) => x.id !== c.id) });
}
function moveCell(i: number, dir: -1 | 1) {
  const list = [...cells.value];
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  commit({ ...monopoly.value, cells: list });
}

/* ── 角色 CRUD ── */
const charEdit = ref<MonopolyCharacter | null>(null);
const charIsNew = ref(false);
const charError = ref('');

function startAddChar() {
  charEdit.value = { id: `ch-${Date.now()}`, name: '', image: '' };
  charIsNew.value = true;
  charError.value = '';
}
function startEditChar(c: MonopolyCharacter) {
  charEdit.value = JSON.parse(JSON.stringify(c));
  charIsNew.value = false;
  charError.value = '';
}
function saveChar() {
  charError.value = '';
  if (!charEdit.value!.name.trim()) {
    charError.value = '角色名必填';
    return;
  }
  charEdit.value!.name = charEdit.value!.name.trim();
  const list = [...characters.value];
  if (charIsNew.value) list.push(charEdit.value!);
  else {
    const i = list.findIndex((x) => x.id === charEdit.value!.id);
    if (i >= 0) list[i] = charEdit.value!;
  }
  commit({ ...monopoly.value, characters: list });
  charEdit.value = null;
}
function removeChar(c: MonopolyCharacter) {
  if (!confirm(`确定删除角色「${c.name}」吗？`)) return;
  commit({ ...monopoly.value, characters: characters.value.filter((x) => x.id !== c.id) });
}

/* ── 图片上传（≤300KB） ── */
const imgError = ref('');
async function onPick(target: 'cell' | 'char', ev: Event) {
  imgError.value = '';
  const file = (ev.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    const { dataUrl } = await compressImage(file, 300 * 1024);
    if (target === 'cell') cellEdit.value!.image = dataUrl;
    else charEdit.value!.image = dataUrl;
  } catch (e) {
    imgError.value = e instanceof Error ? e.message : '图片处理失败';
  }
  (ev.target as HTMLInputElement).value = '';
}
</script>

<template>
  <div class="card">
    <h3 class="tab-title">大富翁设置</h3>

    <div class="form-row">
      <label>棋盘中央规则文字</label>
      <textarea v-model="rulesText" rows="2"></textarea>
      <div class="btn-row" style="margin-top: 8px">
        <button @click="saveRules">保存规则</button>
        <span class="ok">{{ rulesMsg }}</span>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="crud-head">
      <h3 class="tab-title">棋盘格子（{{ cells.length }} 格，按顺序绕棋盘一圈；最后一格视为终点，经过/到达时圈数 +1）</h3>
      <button @click="startAddCell">+ 新增格子</button>
    </div>

    <div v-if="cellEdit" class="edit-box">
      <div class="form-row">
        <label>格子文案（必填）</label>
        <input v-model="cellEdit.label" type="text" />
      </div>
      <div class="form-row">
        <label>格子图片（可选，≤300KB）</label>
        <img v-if="cellEdit.image" :src="cellEdit.image" class="preview" alt="预览" />
        <input type="file" accept="image/jpeg,image/png,image/webp" @change="onPick('cell', $event)" />
        <p v-if="cellEdit.image" class="hint"><a href="javascript:;" @click="cellEdit.image = ''">移除图片</a></p>
      </div>
      <p v-if="cellError" class="error">{{ cellError }}</p>
      <div class="btn-row">
        <button @click="saveCell">保存</button>
        <button class="plain" @click="cellEdit = null">取消</button>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>#</th><th>文案</th><th>图片</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="(c, i) in cells" :key="c.id">
            <td>{{ i + 1 }}</td>
            <td class="cell-label">{{ c.label }}</td>
            <td>{{ c.image ? '已设置' : '—' }}</td>
            <td class="ops">
              <button class="plain" :disabled="i === 0" @click="moveCell(i, -1)">↑</button>
              <button class="plain" :disabled="i === cells.length - 1" @click="moveCell(i, 1)">↓</button>
              <button class="plain" @click="startEditCell(c)">编辑</button>
              <button class="danger" @click="removeCell(c)">删除</button>
            </td>
          </tr>
          <tr v-if="cells.length === 0"><td colspan="4" class="empty">暂无格子</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="card">
    <div class="crud-head">
      <h3 class="tab-title">角色（{{ characters.length }} 个）</h3>
      <button @click="startAddChar">+ 新增角色</button>
    </div>

    <div v-if="charEdit" class="edit-box">
      <div class="form-row">
        <label>角色名（必填）</label>
        <input v-model="charEdit.name" type="text" />
      </div>
      <div class="form-row">
        <label>角色头像（≤300KB，用作棋子）</label>
        <img v-if="charEdit.image" :src="charEdit.image" class="preview" alt="预览" />
        <input type="file" accept="image/jpeg,image/png,image/webp" @change="onPick('char', $event)" />
        <p v-if="charEdit.image" class="hint"><a href="javascript:;" @click="charEdit.image = ''">移除图片</a></p>
      </div>
      <p v-if="charError" class="error">{{ charError }}</p>
      <p v-if="imgError" class="error">{{ imgError }}</p>
      <div class="btn-row">
        <button @click="saveChar">保存</button>
        <button class="plain" @click="charEdit = null">取消</button>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>头像</th><th>角色名</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="c in characters" :key="c.id">
            <td><img v-if="c.image" :src="c.image" :alt="c.name" class="char-thumb" /><span v-else>—</span></td>
            <td>{{ c.name }}</td>
            <td class="ops">
              <button class="plain" @click="startEditChar(c)">编辑</button>
              <button class="danger" @click="removeChar(c)">删除</button>
            </td>
          </tr>
          <tr v-if="characters.length === 0"><td colspan="3" class="empty">暂无角色</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.card {
  margin-bottom: 16px;
}
.tab-title {
  color: var(--pink-deep);
  font-size: 17px;
}
.crud-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.edit-box {
  background: rgba(255, 214, 231, 0.2);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 14px;
}
.preview {
  max-width: 120px;
  border-radius: 10px;
  display: block;
  margin-bottom: 8px;
}
.hint {
  font-size: 12px;
  color: var(--ink-light);
}
.error {
  font-size: 13px;
  color: #c0475f;
}
.ok {
  color: #4c9a6c;
  font-size: 13px;
}
.cell-label {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ops {
  white-space: nowrap;
}
.ops button {
  padding: 4px 10px;
  font-size: 13px;
  margin-right: 6px;
}
.char-thumb {
  width: 40px;
  height: 40px;
  object-fit: contain;
}
.empty {
  text-align: center;
  color: var(--ink-light);
  padding: 18px 0;
}
</style>
