/* @refresh reload */
/* RB ADAPTATION: the offline host desk is imported FIRST so its module side
   effect runs before ./App is evaluated, before `await DM.setup()` below and
   before render(). After that point every @tauri-apps/api invoke/listen/emit,
   every convertFileSrc and every window.fetch this app performs is answered
   in-page and same-origin. src/rb-offline.ts carries the exhaustive list of
   the three stubbed surfaces and the two hygiene seeds. */
import "./rb-offline";
import "./rb-probe";
import { render } from "solid-js/web";
import "./styles.css";
import App from "./App";
import { DM } from "./api/manager/api";

let savedTheme = localStorage.getItem("theme") || "blue-cyan";

// Apply the saved theme to the document element
document.documentElement.setAttribute("data-theme", savedTheme);

await DM.setup();

render(() => <App />, document.getElementById("root"));