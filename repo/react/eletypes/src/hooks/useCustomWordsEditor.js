import { useState } from "react";
import {
  loadCustomWordLists,
  saveCustomWordLists,
  getActiveCustomListId,
  setActiveCustomListId,
  newCustomWordList,
  SAMPLE_WORDS_EN,
} from "../scripts/customWords";
import { ENGLISH_MODE } from "../constants/Constants";

// Mirrors useCustomThemeEditor but for word lists. Unlike themes, word lists
// don't drive any live preview — activation is a discrete switch on TypeBox
// — so this hook is simpler: no themeBeforeEdit/throttling.
const useCustomWordsEditor = () => {
  const [customWordLists, setCustomWordLists] = useState(() => loadCustomWordLists());
  const [activeListId, setActiveListIdState] = useState(() => getActiveCustomListId());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("new"); // "new" | "edit"
  const [draft, setDraft] = useState(null);

  const openEditorForNew = () => {
    setEditorMode("new");
    // Pre-fill with the language-appropriate sample so the user has a
    // working starting point — beats staring at an empty textarea and
    // wondering what to type. Defaults to English here; switching language
    // in the editor replaces the text with the matching sample.
    setDraft({
      ...newCustomWordList({ language: ENGLISH_MODE, text: SAMPLE_WORDS_EN }),
    });
    setEditorOpen(true);
  };

  const openEditorForId = (id) => {
    const target = customWordLists.find((l) => l.id === id);
    if (!target) return;
    setEditorMode("edit");
    setDraft({ ...target });
    setEditorOpen(true);
  };

  const activateList = (id) => {
    setActiveListIdState(id);
    setActiveCustomListId(id);
  };

  const deactivateList = () => {
    setActiveListIdState(null);
    setActiveCustomListId(null);
  };

  const deleteCustomListById = (id) => {
    const next = customWordLists.filter((l) => l.id !== id);
    setCustomWordLists(next);
    saveCustomWordLists(next);
    if (activeListId === id) deactivateList();
  };

  const handleEditorChange = (next) => setDraft(next);

  const handleEditorSave = (finalList) => {
    const item = finalList || draft;
    if (!item) return;
    const next =
      editorMode === "edit"
        ? customWordLists.map((l) => (l.id === item.id ? item : l))
        : [...customWordLists, item];
    setCustomWordLists(next);
    saveCustomWordLists(next);
    // On create, activate immediately so the test reflects the new list.
    if (editorMode === "new") activateList(item.id);
    setEditorOpen(false);
    setDraft(null);
  };

  const handleEditorCancel = () => {
    setEditorOpen(false);
    setDraft(null);
  };

  const handleEditorDelete = () => {
    if (!draft) return;
    const next = customWordLists.filter((l) => l.id !== draft.id);
    setCustomWordLists(next);
    saveCustomWordLists(next);
    if (activeListId === draft.id) deactivateList();
    setEditorOpen(false);
    setDraft(null);
  };

  // Append imported lists to the existing collection. Callers are expected to
  // have already de-duped names against `customWordLists` via
  // parseImportedWordListsJson, so we just merge + persist + activate the
  // first imported list so the user sees it working immediately.
  const importLists = (imported) => {
    if (!Array.isArray(imported) || imported.length === 0) return null;
    const next = [...customWordLists, ...imported];
    setCustomWordLists(next);
    saveCustomWordLists(next);
    const firstId = imported[0].id;
    activateList(firstId);
    return imported;
  };

  return {
    customWordLists,
    activeListId,
    editorOpen,
    editorMode,
    draft,
    openEditorForNew,
    openEditorForId,
    activateList,
    deactivateList,
    deleteCustomListById,
    handleEditorChange,
    handleEditorSave,
    handleEditorCancel,
    handleEditorDelete,
    importLists,
  };
};

export default useCustomWordsEditor;
