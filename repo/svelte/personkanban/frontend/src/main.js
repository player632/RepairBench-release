import SvelteKanban from './SvelteKanban.svelte';
import { mount } from "svelte";

// [waveB build-gate shim] minimal Wails runtime stub (no-op window ops)
window.runtime = window.runtime || new Proxy({}, { get: () => async () => {} });

const app = mount(SvelteKanban, {
  target: document.body,
  props: {
  }
});

export default app;