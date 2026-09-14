import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({

  define: {

    __isProduction__: process.env.NODE_ENV === 'production'

  },

  plugins: [
    vue()
  ],

  resolve: {

    alias: {

      find: /^three$/,
      
      replacement: path.resolve(__dirname, 'node_modules/three')

    }

  },

  base: './',

  build: {

    outDir: 'docs',

  },

  server: {

    port: 3002,

    open: true,

    host: '0.0.0.0'

  }

})
