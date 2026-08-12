<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useDataStore } from '../../stores/data';
import { compressImage } from '../../utils/image';

const store = useDataStore();

// 直接编辑草稿的副本，保存时写回 store
const form = reactive(JSON.parse(JSON.stringify(store.draft.settings)) as typeof store.draft.settings & {
  welcomeText?: string;
});
// 欢迎语在界面上按行编辑
form.welcomeText = (form.welcome_lines ?? []).join('\n');

const msg = ref('');
const imgError = ref('');

async function onPick(field: 'logo' | 'wallpaper' | 'home_deco', ev: Event) {
  imgError.value = '';
  const file = (ev.target as HTMLInputElement).files?.[0];
  if (!file) return;
  // 壁纸类 ≤800KB，其余 ≤300KB
  const max = field === 'wallpaper' ? 800 * 1024 : 300 * 1024;
  try {
    const { dataUrl } = await compressImage(file, max);
    form[field] = dataUrl;
  } catch (e) {
    imgError.value = e instanceof Error ? e.message : '图片处理失败';
  }
  (ev.target as HTMLInputElement).value = '';
}

function addContact() {
  form.contacts.push({ type: '', value: '' });
}
function removeContact(i: number) {
  form.contacts.splice(i, 1);
}

function save() {
  const settings = JSON.parse(JSON.stringify(form));
  settings.welcome_lines = String(form.welcomeText ?? '')
    .split('\n')
    .map((l: string) => l.trim())
    .filter(Boolean);
  delete settings.welcomeText;
  store.updateDraft('settings', settings);
  msg.value = '已保存到草稿，记得去「发布」页提交上线';
}

const contacts = computed(() => form.contacts);
</script>

<template>
  <div class="card">
    <h3 class="tab-title">站点设置</h3>

    <div class="form-row">
      <label>站点名称</label>
      <input v-model="form.site_name" type="text" />
    </div>

    <div class="form-row">
      <label>LOGO（≤300KB，jpg/png/webp）</label>
      <img v-if="form.logo" :src="form.logo" class="preview logo" alt="LOGO" />
      <input type="file" accept="image/jpeg,image/png,image/webp" @change="onPick('logo', $event)" />
    </div>

    <div class="form-row">
      <label>壁纸（≤800KB，jpg/png/webp）</label>
      <img v-if="form.wallpaper" :src="form.wallpaper" class="preview" alt="壁纸" />
      <input type="file" accept="image/jpeg,image/png,image/webp" @change="onPick('wallpaper', $event)" />
      <p v-if="form.wallpaper" class="hint"><a href="javascript:;" @click="form.wallpaper = ''">移除壁纸（恢复默认渐变背景）</a></p>
    </div>

    <div class="form-row">
      <label>主页装饰图（≤300KB，jpg/png/webp，显示在主页大标题右侧）</label>
      <img v-if="form.home_deco" :src="form.home_deco" class="preview deco" alt="主页装饰图" />
      <input type="file" accept="image/jpeg,image/png,image/webp" @change="onPick('home_deco', $event)" />
      <p v-if="form.home_deco" class="hint"><a href="javascript:;" @click="form.home_deco = ''">移除装饰图（恢复默认图标）</a></p>
    </div>
    <p v-if="imgError" class="error">{{ imgError }}</p>

    <div class="form-row">
      <label>轮播欢迎语（每行一条，4 秒切换）</label>
      <textarea v-model="form.welcomeText" rows="4"></textarea>
    </div>

    <div class="form-row">
      <label>主页公告内容</label>
      <textarea v-model="form.home_popup.content" rows="3"></textarea>
    </div>
    <div class="form-row">
      <label class="check-label">
        <input type="checkbox" v-model="form.home_popup.enabled" /> 启用主页公告弹窗
      </label>
    </div>

    <div class="form-row">
      <label>舰礼公告</label>
      <textarea v-model="form.gift_notice" rows="2"></textarea>
    </div>

    <div class="form-row">
      <label>联系方式</label>
      <div v-for="(c, i) in contacts" :key="i" class="contact-row">
        <input v-model="c.type" placeholder="类型（如 QQ群）" class="contact-type" />
        <input v-model="c.value" placeholder="内容（如群号）" />
        <button class="danger" @click="removeContact(i)">删</button>
      </div>
      <button class="plain" @click="addContact">+ 添加联系方式</button>
    </div>

    <div class="form-row">
      <label>备案号（境内部署时填写；留空则页脚不显示）</label>
      <input v-model="form.icp_no" type="text" placeholder="如：京ICP备XXXXXXXX号" />
    </div>

    <div class="btn-row">
      <button @click="save">保存到草稿</button>
      <span class="ok">{{ msg }}</span>
    </div>
  </div>
</template>

<style scoped>
.tab-title {
  color: var(--pink-deep);
  margin-bottom: 16px;
}
.preview {
  max-width: 200px;
  border-radius: 10px;
  display: block;
  margin-bottom: 8px;
}
.preview.logo {
  max-width: 160px;
  height: auto;
  object-fit: contain;
}
.contact-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.contact-type {
  max-width: 140px;
}
.check-label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.check-label input {
  width: auto;
}
.hint {
  font-size: 12px;
  margin-top: 4px;
}
.error {
  color: #c0475f;
  font-size: 13px;
  margin-bottom: 10px;
}
.ok {
  color: #4c9a6c;
  font-size: 13px;
}
</style>
