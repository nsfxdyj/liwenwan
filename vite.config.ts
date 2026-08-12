import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// 项目页站点 nsfxdyj.github.io/liwenwan/，部署在 /liwenwan/ 子路径
export default defineConfig({
  base: '/liwenwan/',
  plugins: [vue()],
});
