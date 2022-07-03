import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import { vConsole } from 'vite-plugin-simple-vconsole';

export default defineConfig({
  resolve: { alias: { '@': '/src' } },
  plugins: [
    vue({ template: { transformAssetUrls } }),
    quasar({ sassVariables: 'src/quasar-variables.sass' }),
    vConsole({
      enable: true,
    }),
  ],
  base: './',
  build: {
    sourcemap: true,
  },
});
