import React, { useState } from "react";
import {
  BackgroundColorContext,
  backgroundColors,
} from "contexts/BackgroundColorContext";

export default function BackgroundColorWrapper(props) {
  const [color, setColor] = useState(backgroundColors.blue);

  function changeColor(color) {
    setColor(backgroundColors.blue);
  }

  // RepairBench instrumentation: live context exposure (re-assigned every render)
  window.__BD_BG_CTX__ = { color: color, changeColor: changeColor };

  return (
    <BackgroundColorContext.Provider
      value={{ color: color, changeColor: changeColor }}
    >
      {props.children}
    </BackgroundColorContext.Provider>
  );
}
