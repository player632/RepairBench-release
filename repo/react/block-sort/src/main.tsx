import React from "react";
import ReactDOM from "react-dom/client";

import "./ios-screen-height-patch";

import { App } from "./App";
import { installRbProbe } from "./rbProbe";

import "./index.css";
import "./icons.css";

/*
 * RepairBench instrumentation: publish the strictly read-only window.__rb probe bridge before the
 * app mounts. The bridge only reads; it dispatches no event, mutates no state and creates no DOM.
 */
installRbProbe();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
