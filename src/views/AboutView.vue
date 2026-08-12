<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '../stores/data';

const store = useDataStore();
const contacts = computed(() => store.remote.settings.contacts ?? []);
</script>

<template>
  <div>
    <h1 class="page-title">关于本站</h1>
    <p class="page-subtitle">一个由粉丝用爱发电的小站</p>

    <div class="card about-card">
      <h3 class="about-title">🦊 站点说明</h3>
      <p>
        本站是 B站主播「黧温婉」的非官方粉丝站，由粉丝自发维护，用于整理直播动态、舰礼信息、歌单、活动日历与精彩片段。
      </p>
      <p class="about-links">
        <a href="https://space.bilibili.com/3546677879244804" target="_blank" rel="noopener">主播B站空间</a>
        <a href="https://live.bilibili.com/1820903035" target="_blank" rel="noopener">直播间</a>
      </p>
    </div>

    <div class="card about-card">
      <h3 class="about-title">📜 版权声明</h3>
      <p>
        本站仅供交流学习，站内相关图片、音频、视频、模型版权归黧温婉所有。本站点的开设、关闭和内容设置以黧温婉本人意愿为准。
      </p>
    </div>

    <div class="card about-card">
      <h3 class="about-title">🔒 安全声明</h3>
      <p>
        本站为纯静态网站，没有后端与数据库，不收集访客任何信息，全站无需注册登录即可浏览。
        站点内容的发布依赖 GitHub 仓库写权限，仅 3 名管理员各自持有发布凭据。
        小游戏中产生的数据（如刮刮乐记录）仅保存在您自己浏览器的本地存储中。
      </p>
    </div>

    <div class="card about-card">
      <h3 class="about-title">💌 联系我们</h3>
      <div class="contact-btns">
        <span v-for="(c, i) in contacts" :key="i" class="contact-btn">{{ c.type }}：{{ c.value }}</span>
        <p v-if="contacts.length === 0" class="empty">暂无联系方式</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-card {
  margin-bottom: 16px;
  line-height: 1.9;
}
.about-title {
  color: var(--pink-deep);
  margin-bottom: 8px;
}
.about-links {
  margin-top: 10px;
  display: flex;
  gap: 16px;
}
.contact-btns {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.contact-btn {
  background: var(--pink-light);
  color: var(--pink-deep);
  border-radius: 999px;
  padding: 8px 18px;
  font-size: 14px;
}
.empty {
  color: var(--ink-light);
}
</style>
