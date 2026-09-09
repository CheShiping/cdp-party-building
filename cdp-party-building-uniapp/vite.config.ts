import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import path from 'path';

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      // H5 开发态代理：后端不支持 CORS，浏览器端请求走同源代理转发
      '/apituwen': { target: 'https://szdj.cdszxjc.com', changeOrigin: true, secure: true },
      '/apiliuyan': { target: 'https://szdj.cdszxjc.com', changeOrigin: true, secure: true },
      '/apiuser': { target: 'https://szdj.cdszxjc.com', changeOrigin: true, secure: true },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/styles/variables.scss";',
      },
    },
  },
});
