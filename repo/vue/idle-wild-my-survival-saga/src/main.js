import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import pinia from './stores'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

app.use(ElementPlus)
app.use(pinia)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.mount('#app')

// [WLB instrumentation] expose the game store singleton for state probes
import('./stores/gameStore').then(({ useGameStore }) => {
  window.__idle_store = useGameStore(pinia)
})
// [WLB instrumentation] achievements list for condition probes
import('./plugins/achievements').then(({ achievements }) => {
  window.__idle_achievements = achievements
})
