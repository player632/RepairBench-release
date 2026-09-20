// RepairBench measurement probe (instrumentation only - see src/rb-probe.ts). Imported FIRST, above
// every application module, so the storage reset, the service-worker cleanup and the four request
// wrappers are installed before any module body runs - in particular before src/i18n/index.ts:89
// executes its top-level await changeLocale(...), whose :73 fetch(url) is the same-origin request the
// zero-egress sentinel counts as its positive control. The probe renders nothing, adds no testid and
// never touches application state.
import './rb-probe';
import App from './app/App.vue';
import { i18n } from './i18n';
import { router } from './router';
import { vTooltip } from '@directives/v-tooltip/vTooltip';
import { createLogger } from '@utils/logger/logger.ts';
import { registerSW } from 'virtual:pwa-register';
import { createApp } from 'vue';
import './styles/index.scss';

createApp(App).directive('tooltip', vTooltip).use(i18n).use(router).mount('#app');

// Print info and register service worker
const logger = createLogger('app');

logger.info(`Ocular build on the ${new Date(import.meta.env.OCULAR_BUILD_DATE).toLocaleString()}`);

if (!import.meta.env.OCULAR_GENESIS_HOST) {
  logger.info('No backend configured, running in offline mode');
}

logger.info("Like what you're seeing? Consider giving it a star on https://github.com/simonwep/ocular!");

registerSW({
  onOfflineReady: () => logger.success('App available offline'),
  onNeedRefresh: () => logger.info('App updated, need to refresh...'),
  onRegisteredSW: () => logger.success('Service worker registered'),
  onRegisterError: (e) => logger.error('Failed to register service-worker', e)
});
