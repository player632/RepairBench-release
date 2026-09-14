/**
 * KeyboardLab translation hook.
 *
 * Uses the global locale from LocaleContext but reads from
 * KeyboardLab's own translation file (separate from main app).
 */

import { useCallback } from "react";
import { useLocale } from "../../../../context/LocaleContext";
import { labTranslations } from "./labTranslations";

/**
 * @returns {(key: string, ...args: any[]) => string} Translation function
 */
export function useLabTranslation() {
  const { locale } = useLocale();

  const tLab = useCallback(
    (key, ...args) => {
      let str =
        labTranslations[locale]?.[key] ||
        labTranslations["en"]?.[key] ||
        key;
      args.forEach((arg, i) => {
        str = str.replace(`{${i}}`, arg);
      });
      return str;
    },
    [locale]
  );

  return tLab;
}
