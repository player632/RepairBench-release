import App from "./components/App.svelte";
import { mountBridge } from "./instrumentation";

const app = new App({
  target: document.body
});

mountBridge();

export default app;
