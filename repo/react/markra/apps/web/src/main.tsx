import { installRbRequestFence } from "./rb-fence";
import { installRbProbe } from "./rb-probe";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App, { AppErrorBoundary, configureAppRuntime } from "@markra/app";
import "@markra/app/styles.css";
import { createWebRuntime } from "./runtime";

installRbRequestFence();
installRbProbe();

configureAppRuntime(createWebRuntime());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);
