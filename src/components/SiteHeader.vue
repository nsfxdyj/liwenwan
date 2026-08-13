<script setup lang="ts">
import { ref } from 'vue';

const menuOpen = ref(false);

const navs = [
  { to: '/', label: '主页' },
  { to: '/news', label: '动态' },
  { to: '/gifts', label: '舰礼' },
  { to: '/songs', label: '歌单' },
  { to: '/calendar', label: '日历' },
  { to: '/videos', label: '视频' },
  { to: '/points', label: '积分' },
  { to: '/games', label: '游戏' },
  { to: '/about', label: '关于' },
];
</script>

<template>
  <header class="site-header">
    <button class="menu-toggle plain" @click="menuOpen = !menuOpen">菜单</button>
    <nav :class="['site-nav', { open: menuOpen }]">
      <router-link
        v-for="n in navs"
        :key="n.to"
        :to="n.to"
        class="nav-link"
        active-class="active"
        exact-active-class="active"
        @click="menuOpen = false"
      >{{ n.label }}</router-link>
    </nav>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 12px rgba(240, 98, 146, 0.12);
}
.site-nav {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}
.nav-link {
  padding: 6px 14px;
  border-radius: 999px;
  color: var(--ink);
  font-size: 15px;
}
.nav-link:hover {
  background: var(--pink-light);
}
.nav-link.active {
  background: linear-gradient(120deg, var(--pink), var(--purple));
  color: #fff;
}
.menu-toggle {
  display: none;
  padding: 6px 14px;
}
@media (max-width: 760px) {
  .site-header {
    justify-content: flex-end;
  }
  .menu-toggle {
    display: block;
  }
  .site-nav {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.97);
    padding: 10px;
    box-shadow: 0 8px 20px rgba(240, 98, 146, 0.15);
  }
  .site-nav.open {
    display: flex;
  }
}
</style>
