import { createApp } from 'vue'

import App from './App.vue'
import { setupPlugins } from './plugins'
import { installRbProbe } from './rbProbe'

import '@/assets/index.css'
import '@/assets/scrollbar.css'
import '@/assets/themes.css'
import '@/assets/chart-theme.css'
import 'vue-sonner/style.css' // vue sonner style

import '@/utils/env'

// RepairBench instrumentation (environment/instrumentation.patch): publish the read-only observation
// probe as window.__rb BEFORE the app mounts, so a checkpoint's bounded ready-gate can never observe a
// half-mounted tree and a boot-time crash is visible as boot.ready() === '0' rather than as a timeout.
// rbProbe.ts imports nothing at all (0 new npm imports - this seed's pnpm layout is isolated) and adds
// 0 data-testid attributes.
installRbProbe()

function bootstrap() {
  const app = createApp(App)

  setupPlugins(app)

  app.mount('#app')
}

bootstrap()
