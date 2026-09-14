import { createApp } from 'vue';
import App from './App.vue';
import { bootstrap } from './cool';
import { request } from './cool/service/request';
import { rbAdapter, rbBackendState } from './cool/service/__rb_backend';
import { installRbProbe } from './rbProbe';

// --- harness adaptation (AD-3): swap the axios transport for the offline fixture backend (AD-1) ---
// Nothing in src/cool/service/request.ts changes, so its interceptors - the token-refresh queue, the
// {code,data,message} envelope unwrap, the 401/403/500/502 routing - all still run for real. This is
// installed here rather than inside request.ts so that no application module carries harness code, and
// it runs before bootstrap(app) because that is where src/modules/base/config.ts:82-87 fires the first
// requests. The random plane is pinned separately by AD-2 in index.html, which must precede module
// evaluation and therefore cannot live here.
request.defaults.adapter = rbAdapter;
// One harness global, read-only: the fixture's own call/miss ledger. It exists so a checkpoint can
// prove the offline data plane actually answered (structural sentinel), never to carry application
// state. No defect and no assertion about seed behaviour is routed through it.
(window as any).__rbBackend = rbBackendState;

// --- harness instrumentation (IN-2): publish the read-only probe bridge exactly once ---
// Installed BEFORE bootstrap(app) so the first readiness poll of the very first checkpoint can already see
// it. src/rbProbe.ts only reads (DOM text/attributes, computed CSS, localStorage, location) and returns
// scalars; it writes no application state, dispatches no event and is imported by no application module,
// so this statement plus that one file are the entire instrumentation surface on the boot path. Reverting
// both restores the adapted tree byte for byte (design_lint C14 / gate G4).
installRbProbe();

const app = createApp(App);

// 启动
bootstrap(app)
	.then(() => {
		app.mount('#app');
	})
	.catch(err => {
		console.error('COOL-ADMIN 启动失败', err);
	});
