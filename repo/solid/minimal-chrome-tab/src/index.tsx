// INSTRUMENTATION (repair-bench, environment/instrumentation.patch): the observation
// bridge is imported FIRST so its MutationObserver is armed on #app before the app boots
// and can freeze the mount fade's inline transition at the instant it is written.
import '@/rb-probe'
import '@/index.css'
import '@/boot/localize-html'
import '@/boot/app'
