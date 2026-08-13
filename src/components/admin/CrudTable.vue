<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useDataStore, type DataKey } from '../../stores/data';
import { compressImage } from '../../utils/image';
import { parseBJ } from '../../utils/time';

export interface Field {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'month' | 'datetime' | 'image' | 'checkbox';
  options?: string[];
  placeholder?: string;
  maxlength?: number;
  imageMax?: number; // 图片大小上限（字节）
  hideInTable?: boolean;
  // 新增时的默认值
  default?: () => unknown;
}

const props = defineProps<{
  title: string;
  dataKey: DataKey;
  fields: Field[];
  batchImport?: boolean; // 歌单批量粘贴导入
}>();

const store = useDataStore();
const items = computed<any[]>(() => (store.draft as any)[props.dataKey] ?? []);

function nowStr(): string {
  // 北京时间 YYYY-MM-DD HH:mm:ss
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

const editing = ref<any | null>(null); // 正在编辑的条目（含新增）
const isNew = ref(false);
const error = ref('');

function startAdd() {
  const obj: any = { id: `id-${Date.now()}-${Math.floor(Math.random() * 1000)}` };
  for (const f of props.fields) {
    if (f.default) obj[f.key] = f.default();
    else if (f.type === 'number') obj[f.key] = 0;
    else if (f.type === 'checkbox') obj[f.key] = false;
    else if (f.type === 'datetime') obj[f.key] = nowStr();
    else obj[f.key] = '';
  }
  editing.value = obj;
  isNew.value = true;
  error.value = '';
}

function startEdit(item: any) {
  editing.value = JSON.parse(JSON.stringify(item));
  isNew.value = false;
  error.value = '';
}

function cancelEdit() {
  editing.value = null;
  error.value = '';
}

function save() {
  // 保存前按数据类型校验关键字段
  error.value = '';
  if (props.dataKey === 'points') {
    const uid = String(editing.value.uid ?? '').trim();
    if (!uid) {
      error.value = 'UID 必填';
      return;
    }
    if (!/^\d+$/.test(uid)) {
      error.value = 'UID 必须为纯数字';
      return;
    }
    const raw = editing.value.points;
    if (raw === '' || raw === null || raw === undefined) {
      error.value = '积分必填';
      return;
    }
    const p = Number(raw);
    if (!Number.isInteger(p) || p < 0) {
      error.value = '积分必须为非负整数';
      return;
    }
    editing.value.uid = uid;
    editing.value.points = p;
  }
  if (props.dataKey === 'events') {
    const t = parseBJ(String(editing.value.event_at ?? ''));
    if (isNaN(t.getTime())) {
      error.value = '活动时间格式不正确，应为 YYYY-MM-DD HH:mm:ss';
      return;
    }
  }
  if (props.dataKey === 'gifts') {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(editing.value.month ?? '').trim())) {
      error.value = '月份格式不正确，应为 YYYY-MM（如 2026-08）';
      return;
    }
    editing.value.month = editing.value.month.trim();
  }
  // 动态保存时自动刷新 updated_at 为当前北京时间
  if (props.dataKey === 'news') {
    editing.value.updated_at = nowStr();
  }
  const list = [...items.value];
  if (isNew.value) list.push(editing.value);
  else {
    const i = list.findIndex((x) => x.id === editing.value.id);
    if (i >= 0) list[i] = editing.value;
  }
  (store.updateDraft as any)(props.dataKey, list);
  editing.value = null;
}

function remove(item: any) {
  if (!confirm(`确定删除「${item.title ?? item.name ?? item.nickname ?? item.id}」吗？`)) return;
  (store.updateDraft as any)(props.dataKey, items.value.filter((x) => x.id !== item.id));
}

function toggle(item: any, key: string) {
  const list = items.value.map((x) => (x.id === item.id ? { ...x, [key]: x[key] === 'on' ? 'off' : 'on' } : x));
  (store.updateDraft as any)(props.dataKey, list);
}

// 图片上传：浏览器端压缩为 dataURL 暂存，发布时提交到仓库
const uploadError = ref('');
async function onPickImage(f: Field, ev: Event) {
  uploadError.value = '';
  const file = (ev.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    const { dataUrl } = await compressImage(file, f.imageMax ?? 300 * 1024);
    editing.value[f.key] = dataUrl;
  } catch (e) {
    uploadError.value = e instanceof Error ? e.message : '图片处理失败';
  }
  (ev.target as HTMLInputElement).value = '';
}

// 批量粘贴导入（歌单）：每行「歌名-歌手-备注」
const showBatch = ref(false);
const batchText = ref('');
const batchMsg = ref('');

function doBatchImport() {
  const lines = batchText.value.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) { batchMsg.value = '请先粘贴内容'; return; }
  const list = [...items.value];
  let ok = 0;
  for (const line of lines) {
    const parts = line.split('-');
    const name = (parts.shift() ?? '').trim();
    if (!name) continue;
    const artist = (parts.shift() ?? '').trim();
    const note = parts.join('-').trim();
    list.push({ id: `id-${Date.now()}-${ok}-${Math.floor(Math.random() * 1000)}`, name, artist, note });
    ok++;
  }
  (store.updateDraft as any)(props.dataKey, list);
  batchMsg.value = `已导入 ${ok} 条`;
  batchText.value = '';
}

const tableFields = computed(() => props.fields.filter((f) => !f.hideInTable));

function cellText(item: any, f: Field): string {
  const v = item[f.key];
  if (f.type === 'checkbox') return v ? '是' : '否';
  if (f.type === 'image') return v ? '已设置图片' : '未设置';
  if (f.key === 'status') return v === 'on' ? '上架中' : '已下架';
  return String(v ?? '');
}
</script>

<template>
  <div class="card crud">
    <div class="crud-head">
      <h3 class="crud-title">{{ title }}（{{ items.length }} 条）</h3>
      <div class="btn-row">
        <button v-if="batchImport" class="plain" @click="showBatch = !showBatch">批量导入</button>
        <button @click="startAdd">+ 新增</button>
      </div>
    </div>

    <div v-if="showBatch" class="batch-box">
      <p class="hint">每行一条，格式：歌名-歌手-备注（备注可省略）</p>
      <textarea v-model="batchText" rows="6" placeholder="恋爱循环-花泽香菜-经典萌曲"></textarea>
      <div class="btn-row" style="margin-top: 8px">
        <button @click="doBatchImport">导入</button>
        <span class="hint">{{ batchMsg }}</span>
      </div>
    </div>

    <div v-if="editing" class="edit-box">
      <h4 class="edit-title">{{ isNew ? '新增' : '编辑' }}</h4>
      <div v-for="f in fields" :key="f.key" class="form-row">
        <label>{{ f.label }}</label>
        <textarea v-if="f.type === 'textarea'" v-model="editing[f.key]" rows="3" :maxlength="f.maxlength" :placeholder="f.placeholder"></textarea>
        <select v-else-if="f.type === 'select'" v-model="editing[f.key]">
          <option v-for="o in f.options" :key="o" :value="o">{{ o === 'on' ? '上架' : o === 'off' ? '下架' : o }}</option>
        </select>
        <input v-else-if="f.type === 'number'" type="number" v-model.number="editing[f.key]" />
        <input v-else-if="f.type === 'month'" type="month" v-model="editing[f.key]" />
        <label v-else-if="f.type === 'checkbox'" class="check-label">
          <input type="checkbox" v-model="editing[f.key]" /> 是
        </label>
        <div v-else-if="f.type === 'image'" class="image-field">
          <img v-if="editing[f.key]" :src="editing[f.key]" class="preview" alt="预览" />
          <input type="file" accept="image/jpeg,image/png,image/webp" @change="onPickImage(f, $event)" />
          <p class="hint">jpg/png/webp，自动压缩至 {{ Math.round((f.imageMax ?? 307200) / 1024) }}KB 内</p>
          <p v-if="editing[f.key]" class="hint">
            <a href="javascript:;" @click="editing[f.key] = ''">移除图片</a>
          </p>
          <p v-if="uploadError" class="error">{{ uploadError }}</p>
        </div>
        <input v-else type="text" v-model="editing[f.key]" :placeholder="f.placeholder" :maxlength="f.maxlength" />
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <div class="btn-row">
        <button @click="save">保存</button>
        <button class="plain" @click="cancelEdit">取消</button>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th v-for="f in tableFields" :key="f.key">{{ f.label }}</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td v-for="f in tableFields" :key="f.key" class="cell">{{ cellText(item, f) }}</td>
            <td class="ops">
              <button v-if="dataKey === 'gifts'" class="plain" @click="toggle(item, 'status')">
                {{ item.status === 'on' ? '下架' : '上架' }}
              </button>
              <button class="plain" @click="startEdit(item)">编辑</button>
              <button class="danger" @click="remove(item)">删除</button>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td :colspan="tableFields.length + 1" class="empty">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.crud {
  margin-bottom: 16px;
}
.crud-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.crud-title {
  color: var(--pink-deep);
  font-size: 17px;
}
.batch-box,
.edit-box {
  background: rgba(255, 214, 231, 0.2);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 14px;
}
.edit-title {
  color: var(--pink-deep);
  margin-bottom: 10px;
}
.hint {
  font-size: 12px;
  color: var(--ink-light);
}
.error {
  font-size: 13px;
  color: #c0475f;
}
.check-label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.check-label input {
  width: auto;
}
.image-field .preview {
  max-width: 200px;
  border-radius: 10px;
  display: block;
  margin-bottom: 8px;
}
.cell {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ops {
  white-space: nowrap;
}
.ops button {
  padding: 4px 12px;
  font-size: 13px;
  margin-right: 6px;
}
.empty {
  text-align: center;
  color: var(--ink-light);
  padding: 18px 0;
}
</style>
