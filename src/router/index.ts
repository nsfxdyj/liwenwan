import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  // hash 模式：静态托管下刷新/直达子路由不 404
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue'), meta: { title: '主页' } },
    { path: '/news', name: 'news', component: () => import('../views/NewsView.vue'), meta: { title: '动态' } },
    { path: '/gifts', name: 'gifts', component: () => import('../views/GiftsView.vue'), meta: { title: '舰礼' } },
    { path: '/songs', name: 'songs', component: () => import('../views/SongsView.vue'), meta: { title: '歌单' } },
    { path: '/calendar', name: 'calendar', component: () => import('../views/CalendarView.vue'), meta: { title: '日历' } },
    { path: '/videos', name: 'videos', component: () => import('../views/VideosView.vue'), meta: { title: '视频' } },
    { path: '/games', name: 'games', component: () => import('../views/GamesView.vue'), meta: { title: '游戏' } },
    { path: '/about', name: 'about', component: () => import('../views/AboutView.vue'), meta: { title: '关于' } },
    { path: '/admin', name: 'admin', component: () => import('../views/AdminView.vue'), meta: { title: '管理后台' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.afterEach((to) => {
  // site_name 由数据层加载 settings.json 后写入 localStorage，避免对 store 的循环依赖
  const base = localStorage.getItem('lww_site_name') || '黧温婉粉丝站';
  document.title = to.meta.title ? `${String(to.meta.title)} - ${base}` : base;
});

export default router;
