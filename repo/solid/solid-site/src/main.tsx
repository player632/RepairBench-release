import { render } from 'solid-js/web';
import './assets/main.css';

// import { registerSW } from 'virtual:pwa-register';
import { installNetFence } from './rbNetFence';
import './rb-probe';
import { App } from './App';

// repair-bench adaptation (environment/adaptation.patch): install the same-origin request fence
// BEFORE the application renders, so no module of the app can reach a cross-origin endpoint. See
// src/rbNetFence.ts for the full ledger of what it covers and why each channel is redirected
// rather than blocked.
installNetFence();

render(() => <App />, document.getElementById('app')!);

// Register service worker
// registerSW({ onOfflineReady() {} });
