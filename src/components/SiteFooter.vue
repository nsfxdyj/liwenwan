<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDataStore } from '../stores/data';

const store = useDataStore();
const showContacts = ref(false);

const icp = computed(() => store.remote.settings.icp_no?.trim());
const contacts = computed(() => store.remote.settings.contacts ?? []);
</script>

<template>
  <footer class="site-footer">
    <p class="copyright">
      本站仅供交流学习，站内相关图片、音频、视频、模型版权归黧温婉所有。本站点的开设、关闭和内容设置以黧温婉本人意愿为准。
    </p>
    <p class="footer-links">
      <a href="javascript:;" @click="showContacts = !showContacts">联系我们</a>
      <a v-if="icp" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">{{ icp }}</a>
    </p>
    <div v-if="showContacts" class="contacts">
      <span v-for="(c, i) in contacts" :key="i" class="contact-item">{{ c.type }}：{{ c.value }}</span>
      <span v-if="contacts.length === 0" class="contact-item">暂无联系方式</span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  text-align: center;
  padding: 26px 16px 34px;
  color: var(--ink-light);
  font-size: 13px;
}
.copyright {
  max-width: 720px;
  margin: 0 auto 8px;
  line-height: 1.7;
}
.footer-links {
  display: flex;
  justify-content: center;
  gap: 18px;
}
.contacts {
  margin: 12px auto 0;
  display: inline-flex;
  flex-direction: column;
  gap: 6px;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 12px 20px;
  box-shadow: var(--shadow);
}
</style>
