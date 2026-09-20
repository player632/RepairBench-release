// RepairBench instrumentation: this import must stay first so the probe's observing wrappers
// install before any application module is evaluated.
import { rbInstallFixture } from './rb-probe'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(pinia)
// RepairBench: install the fixed single-planet fixture before the router guard reads the store.
rbInstallFixture()
app.use(router)

app.mount('#app')
