import { useState } from "react";
import {
  loadCustomThemes,
  saveCustomThemes,
  isCustomTheme,
  newThemeFrom,
} from "../style/customThemes";
import { defaultTheme } from "../style/theme";

/**
 * Encapsulates the custom-theme editor lifecycle so any page that has a `theme`
 * setter can drop in the editor.
 *
 * @param {object} args
 * @param {object} args.theme              — currently active theme
 * @param {(t: object) => void} args.setTheme  — set active theme (also drives live preview)
 */
const useCustomThemeEditor = ({ theme, setTheme }) => {
  const [customThemes, setCustomThemes] = useState(() => loadCustomThemes());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("new"); // "new" | "edit"
  const [themeBeforeEdit, setThemeBeforeEdit] = useState(null);

  const openEditorForNew = () => {
    setThemeBeforeEdit(theme);
    setEditorMode("new");
    setTheme(newThemeFrom(theme, ""));
    setEditorOpen(true);
  };

  const openEditorForCurrent = () => {
    if (!isCustomTheme(theme)) return;
    setThemeBeforeEdit(theme);
    setEditorMode("edit");
    setEditorOpen(true);
  };

  // Open the editor for a specific custom theme by id. Activates that theme
  // first so live preview reflects it.
  const openEditorForId = (id) => {
    const target = customThemes.find((t) => t.id === id);
    if (!target) return;
    setThemeBeforeEdit(theme);
    setTheme(target);
    window.localStorage.setItem("theme", JSON.stringify(target));
    setEditorMode("edit");
    setEditorOpen(true);
  };

  // Activate a theme without entering the editor.
  const activateTheme = (next) => {
    setTheme(next);
    window.localStorage.setItem("theme", JSON.stringify(next));
  };

  // Delete by id without opening the editor. If deleting the active theme,
  // fall back to the default theme.
  const deleteCustomThemeById = (id) => {
    const next = customThemes.filter((t) => t.id !== id);
    setCustomThemes(next);
    saveCustomThemes(next);
    if (theme && theme.id === id) {
      setTheme(defaultTheme);
      window.localStorage.setItem("theme", JSON.stringify(defaultTheme));
    }
  };

  const handleEditorChange = (next) => setTheme(next);

  // `finalTheme` comes from the editor's local state — authoritative, since
  // upstream propagation is throttled and the parent's `theme` may still be
  // catching up at save time.
  const handleEditorSave = (finalTheme) => {
    const t = finalTheme || theme;
    const next =
      editorMode === "edit"
        ? customThemes.map((ct) => (ct.id === t.id ? t : ct))
        : [...customThemes, t];
    setCustomThemes(next);
    saveCustomThemes(next);
    setTheme(t);
    window.localStorage.setItem("theme", JSON.stringify(t));
    setThemeBeforeEdit(null);
    setEditorOpen(false);
  };

  const handleEditorCancel = () => {
    if (themeBeforeEdit) setTheme(themeBeforeEdit);
    setThemeBeforeEdit(null);
    setEditorOpen(false);
  };

  const handleEditorDelete = () => {
    const next = customThemes.filter((t) => t.id !== theme.id);
    setCustomThemes(next);
    saveCustomThemes(next);
    const fallback =
      themeBeforeEdit && themeBeforeEdit.id !== theme.id ? themeBeforeEdit : defaultTheme;
    setTheme(fallback);
    window.localStorage.setItem("theme", JSON.stringify(fallback));
    setThemeBeforeEdit(null);
    setEditorOpen(false);
  };

  return {
    customThemes,
    editorOpen,
    editorMode,
    openEditorForNew,
    openEditorForCurrent,
    openEditorForId,
    activateTheme,
    deleteCustomThemeById,
    handleEditorChange,
    handleEditorSave,
    handleEditorCancel,
    handleEditorDelete,
  };
};

export default useCustomThemeEditor;
