// RepairBench measurement probe (instrumentation only - see src/rb-probe.ts). Imported FIRST, above
// every application module, so the storage reset, the service-worker/cache cleanup, the four request
// wrappers and the window error listeners are all installed before any module body runs. That ordering
// is load-bearing twice on this seed: src/store/canvas.ts:14 imports "@/worker?worker" and :90
// constructs that worker inside initOffScreenCanvas (reached from Canvas.vue:31-38 onMounted), and all
// seven useLocalStorage call sites read at component-setup time - so the probe sees the worker's
// subresource load and every checkpoint starts from the seed's own defaults, never from residue.
// The probe renders nothing, adds no data-testid and never touches application state.
import "./rb-probe";
import { createPinia } from "pinia";
import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.mount("#app");
