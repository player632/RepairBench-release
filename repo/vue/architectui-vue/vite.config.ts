import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // OFFLINE ADAPTATION (repair-bench): upstream ships base "/architectui-vue-free/" for the GitHub-Pages
  // deployment, which makes every emitted asset URL absolute under that prefix. The benchmark serves the
  // build output directory at the origin root, so the page would 404 on its own bundle, preloads and CSS.
  // A root base keeps the emitted module graph identical in shape while resolving against the served origin.
  base: '/',

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      vue: 'vue/dist/vue.esm-bundler.js'
    }
  },

  server: {
    port: 8087,
    open: false,
    host: 'localhost'
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue-router') || id.includes('pinia') || /node_modules\/vue\//.test(id)) {
              return 'vendor'
            }
            if (id.includes('bootstrap-vue-next') || id.includes('/bootstrap/')) {
              return 'bootstrap'
            }
            if (id.includes('chart.js') || id.includes('vue-chartjs')) {
              return 'charts'
            }
            if (id.includes('@fortawesome')) {
              return 'icons'
            }
          }
        }
      }
    }
  },

  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: [
          'legacy-js-api',
          'import',
          'global-builtin',
          'mixed-decls',
          'color-functions',
          'slash-div',
          'if-function'
        ]
      }
    }
  },

  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'bootstrap',
      'bootstrap-vue-next',
      'chart.js',
      'vue-chartjs',
      '@fortawesome/fontawesome-svg-core',
      '@fortawesome/free-solid-svg-icons',
      '@fortawesome/vue-fontawesome'
    ]
  },

  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
  }
})
