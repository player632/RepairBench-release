import React, { createContext, useContext, useState, useCallback } from "react";
import { translations } from "../translations/translations";

const LocaleContext = createContext();

export const LocaleProvider = ({ children }) => {
  const [locale, setLocaleState] = useState(() => {
    return localStorage.getItem("ui-locale") || "en";
  });

  const setLocale = useCallback((newLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem("ui-locale", newLocale);
  }, []);

  const t = useCallback(
    (key, ...args) => {
      let str =
        translations[locale]?.[key] || translations["en"]?.[key] || key;
      args.forEach((arg, i) => {
        str = str.replace(`{${i}}`, arg);
      });
      return str;
    },
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => useContext(LocaleContext);
