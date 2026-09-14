import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// RepairBench instrumentation: the read-only probe publisher.
import { publishRbProbe } from "./rbProbe";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// RepairBench instrumentation: publish window.__rb exactly once, after the first render
// is scheduled. The probe only reads what the app itself rendered.
publishRbProbe();
