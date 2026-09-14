import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')

// [WLB instrumentation] expose the player store singleton for probes
import('./stores/player').then(({ usePlayerStore }) => {
  window.__xx_store = usePlayerStore(pinia)
})
