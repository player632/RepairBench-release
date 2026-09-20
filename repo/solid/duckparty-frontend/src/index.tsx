/* @refresh reload */

import "./rb-offline";
import { QueryClientProvider } from "@tanstack/solid-query";
import { render } from "solid-js/web";
import App from "./App.tsx";
import { queryClient } from "./api/query-client.ts";
import { loadAnalytics } from "./helpers";
import "./styles/global.css";
import "./rb-probe";

loadAnalytics();

const root = document.getElementById("root");

if (root) {
  render(
    () => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ),
    root,
  );
}
