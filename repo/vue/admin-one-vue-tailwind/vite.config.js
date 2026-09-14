import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // OFFLINE ADAPTATION (repair-bench): upstream ships base "/admin-one-vue-tailwind/" for the
  // GitHub-Pages deployment, which makes every emitted asset URL absolute under that prefix. The
  // benchmark serves dist/ at the origin root, so the page would 404 on its own bundle and script.
  // A relative base keeps the emitted module graph byte-identical in shape while resolving against
  // whatever path serves it (the router is createWebHashHistory, so no history-base coupling).
  base: "./",
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
