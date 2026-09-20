// The repair-bench fixture is imported FIRST so its seeded RNG, frozen clock and
// storage presets are installed before any application module is evaluated.
import "./rb-env";
import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import Game from "./Game";

ReactDOM.render(
  <React.StrictMode>
    <Game />
  </React.StrictMode>,
  document.getElementById("root")
);
