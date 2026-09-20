// RepairBench measurement probe (instrumentation only - see src/rb-probe.ts). Imported FIRST, above every
// application module, so it is evaluated before ./utils/plugins below, which is the module that pulls in
// @/router -> @/router/permission -> @/store. That ordering is load-bearing: store/index.ts:44 does
// `const store = new ModuleStore()` at module-evaluation time, store/User.ts:29 calls init() from its
// constructor and store/User.ts:37 reads the session out of the "ModuleUser" COOKIE, so the probe has to
// write document.cookie before that runs. router/permission.ts:143 then gates every route on
// `store.user.info.token` and :181-183 redirects to /login without it, and permission.ts:37-41 keeps a
// route only when `meta.auth` includes the user type - router/static.ts:154 gives the project-link route
// `auth: [0]`, so the probe seeds type 0, the ONLY value that makes the registered route set (and the
// 13-link sidebar census P05/P15/P16 read) identical in every state. The probe also installs the
// cross-origin egress census and the boot / residue / error scalars that tests/dsl.json reads. It renders
// nothing, adds no element, no class, no id, no data-testid and no selector of its own, holds no constant
// or expectation belonging to any defect, and never writes application state other than the documented
// session cookie and the boot-time storage wipe it declares.
import "./rb-probe";
import { createApp } from "vue";
import App from "./App.vue";
import { registerPlugins } from "./utils/plugins";

import "./styles/index.scss";
import "./styles/tailwind.css";

const app = createApp(App);

registerPlugins(app);

app.mount("#app");
