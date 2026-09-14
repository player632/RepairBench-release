import './rbBackend';
import { installRbErrorTap, publishRbProbe } from './rbProbe';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { isWebMode } from '@/lib/api';
import App from './App';
import './index.css';
import './styles/mobile.css';
import './i18n';

// RepairBench instrumentation: tap window errors BEFORE the first render so a boot-time crash
// is recorded instead of being swallowed by the seed's own AppErrorBoundary.
installRbErrorTap();

// Attach Tauri console logger only in Tauri mode
if (!isWebMode()) {
  import('@tauri-apps/plugin-log')
    .then(({ attachConsole }) => attachConsole())
    .catch((error) => {
      console.warn('Log plugin unavailable:', error);
    });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// RepairBench instrumentation: publish the read-only probe object exactly once.
publishRbProbe();
