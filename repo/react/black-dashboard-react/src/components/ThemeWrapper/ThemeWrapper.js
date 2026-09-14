import React, { useState, useEffect } from "react";
import { ThemeContext, themes } from "contexts/ThemeContext";

export default function ThemeContextWrapper(props) {
  const [theme, setTheme] = useState(themes.dark);

  function changeTheme(theme) {
    setTheme(theme);
  }

  // RepairBench instrumentation: live context exposure (re-assigned every render)
  window.__BD_THEME_CTX__ = { theme: theme, changeTheme: changeTheme };

  useEffect(() => {
    switch (theme) {
      case themes.light:
        document.body.classList.remove("white-content");
        break;
      case themes.dark:
      default:
        document.body.classList.add("white-content");
        break;
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme: theme, changeTheme: changeTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
}
