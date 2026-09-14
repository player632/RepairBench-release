import { ENGLISH_MODE, CHINESE_MODE } from "../constants/Constants";

export const CUSTOM_WORDS_KEY = "custom-word-lists";
export const CUSTOM_WORDS_ACTIVE_KEY = "custom-word-list-active";
export const CUSTOM_WORDS_PREFIX = "custom_words__";

export const CUSTOM_WORDS_MAX_TEXT = 20000;

// Mechanical-keyboard themed sample text. Used as one-click "fill with
// example" content in the editor — placeholder text isn't selectable, so a
// button that inserts this gives users a real starting point they can edit.
export const SAMPLE_WORDS_EN = `mechanical keyboard switch keycap layout hotswap
linear tactile clicky silent lube film foam
plate gasket stabilizer profile cherry topre
hhkb qmk via pcb gateron kailh akko
backlight rgb tenkeyless compact ergonomic custom`;

export const SAMPLE_WORDS_ZH = `机械键盘
客制化
轴体
键帽
配列
热插拔
线性轴
段落轴
静音
润轴
卫星轴
定位板
樱桃轴
茶轴
红轴
青轴
银轴
静电容
键位
凯华
佳达隆
阿米洛
杜伽
段落感
触底
键程
键盘膜
蓝牙
三模`;

export const loadCustomWordLists = () => {
  try {
    const raw = window.localStorage.getItem(CUSTOM_WORDS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
};

export const saveCustomWordLists = (lists) => {
  window.localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(lists));
};

export const getActiveCustomListId = () => {
  try {
    const raw = window.localStorage.getItem(CUSTOM_WORDS_ACTIVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

export const setActiveCustomListId = (id) => {
  if (id == null) {
    window.localStorage.removeItem(CUSTOM_WORDS_ACTIVE_KEY);
  } else {
    window.localStorage.setItem(CUSTOM_WORDS_ACTIVE_KEY, JSON.stringify(id));
  }
};

const genId = () =>
  CUSTOM_WORDS_PREFIX +
  Date.now().toString(36) +
  Math.random().toString(36).slice(2, 8);

export const newCustomWordList = ({ name = "", language = ENGLISH_MODE, text = "" } = {}) => ({
  id: genId(),
  name,
  language,
  text,
  resolved: null,
});

const isAsciiToken = (s) => /^[\x20-\x7e]+$/.test(s);

// pinyin-pro is lazy-loaded so it never costs anything on initial page load —
// only users opening the Chinese custom-words editor pay the ~50KB.
let _pinyinModulePromise = null;
const loadPinyinModule = () => {
  if (!_pinyinModulePromise) {
    _pinyinModulePromise = import("pinyin-pro");
  }
  return _pinyinModulePromise;
};

// Keep letters + digits. Digits are intentionally preserved so:
//   1. Pinyin override with tone numbers ("ni3hao3") types as written
//   2. Mixed-content entries ("60配列", "87键") keep the leading digits
//      when pinyin-pro passes them through unchanged.
// Everything else (punctuation, whitespace from pinyin-pro's separator) is
// stripped so the user types a clean ascii run.
const sanitizePinyin = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

// Parse one Chinese line into {key, val}. Used both during editor live-preview
// and at runtime when older saved lists need a fallback parse.
//
// "<hanzi> <pinyin>" (whitespace separated) — explicit override. The user's
//   pinyin wins, regardless of what pinyin-pro would generate.
// "<hanzi>" — auto mode: pinyin needs to be filled in by the editor via
//   pinyin-pro. The parser returns {key: hanzi, val: ""} so callers can detect
//   the missing pinyin and fill it in async.
// "<pinyin>" (ASCII only) — pinyin without hanzi hint above.
const parseChineseLine = (line) => {
  const parts = line.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length >= 2) {
    const hanzi = parts[0];
    const pinyin = sanitizePinyin(parts.slice(1).join(""));
    if (!pinyin) return null;
    return { key: hanzi, val: pinyin };
  }
  const only = parts[0];
  if (isAsciiToken(only)) {
    return { key: "", val: only };
  }
  // hanzi-only: editor must supply pinyin asynchronously.
  return { key: only, val: "" };
};

// Synchronously resolve a list to [{key, val}]. For Chinese, prefer the
// pre-resolved array (filled in by the editor at save time); fall back to
// line-by-line parsing for plain-text formats.
export const parseCustomWordsText = (record) => {
  if (!record) return [];
  const { text, language, resolved } = record;
  if (language === CHINESE_MODE) {
    if (Array.isArray(resolved) && resolved.length > 0) return resolved;
    if (typeof text !== "string" || !text.trim()) return [];
    return text
      .split(/\r?\n/)
      .map(parseChineseLine)
      .filter((e) => e && e.val); // drop hanzi-only entries with no pinyin yet
  }
  // English: whitespace-split, drop empty.
  if (typeof text !== "string") return [];
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => ({ key: w, val: w }));
};

// Async — returns [{key, val}] for Chinese text using pinyin-pro for any
// hanzi-only lines. Explicit "<hanzi> <pinyin>" overrides are preserved.
// This is what the editor calls on every change.
export const resolveChineseText = async (text) => {
  if (typeof text !== "string" || !text.trim()) return [];
  const parsedLines = text
    .split(/\r?\n/)
    .map((line) => ({ line, parsed: parseChineseLine(line) }))
    .filter((x) => x.parsed);

  const needsPinyin = parsedLines.filter((x) => x.parsed.key && !x.parsed.val);
  if (needsPinyin.length === 0) {
    return parsedLines.map((x) => x.parsed);
  }

  const { pinyin } = await loadPinyinModule();
  return parsedLines.map(({ parsed }) => {
    if (parsed.key && !parsed.val) {
      const py = sanitizePinyin(
        pinyin(parsed.key, { toneType: "none", separator: "", type: "string" })
      );
      return { key: parsed.key, val: py };
    }
    return parsed;
  });
};

// Generate `count` words from the parsed list, preserving the user's typed
// order. The list loops back to entry 0 when exhausted so timed tests still
// run indefinitely. The `rng` arg is accepted but unused — order is fixed
// by the list itself, so seed/challenge-link reproducibility is automatic.
// eslint-disable-next-line no-unused-vars
export const customWordsGenerator = (parsed, count, rng) => {
  if (!Array.isArray(parsed) || parsed.length === 0) return [];
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(parsed[i % parsed.length]);
  }
  return out;
};

export const resolveActiveCustomList = (lists, activeId) => {
  if (!activeId || !Array.isArray(lists)) return null;
  return lists.find((l) => l.id === activeId) || null;
};

// ---------------------------------------------------------------------------
// Import / export
//
// File format: { format: "eletypes-word-lists", version: 1, lists: [...] }.
// Each list keeps name/language/text/resolved — we drop ids on export so two
// users sharing the same file don't end up with the same internal id. Import
// regenerates ids and de-dupes names against the user's existing lists.

const EXPORT_FORMAT = "eletypes-word-lists";
const EXPORT_VERSION = 1;

export const serializeWordListsForExport = (lists) => {
  const arr = Array.isArray(lists) ? lists : [lists];
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    lists: arr.map(({ name, language, text, resolved }) => ({
      name,
      language,
      text,
      resolved: resolved || null,
    })),
  };
};

export const exportWordListsToJsonString = (lists) =>
  JSON.stringify(serializeWordListsForExport(lists), null, 2);

const dedupeName = (name, existingNames) => {
  if (!existingNames.includes(name)) return name;
  let i = 2;
  while (existingNames.includes(`${name} (${i})`)) i++;
  return `${name} (${i})`;
};

// Parse a JSON string from an exported file. Throws on malformed input so the
// caller can show a friendly message. Returns an array of new list records
// with fresh ids and de-duped names.
export const parseImportedWordListsJson = (jsonString, existingLists = []) => {
  let data;
  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error("invalid_json");
  }
  // Two accepted shapes:
  //   1. { format, version, lists: [...] } (wrapped)
  //   2. raw array of records (legacy / hand-edited)
  const rawLists = Array.isArray(data)
    ? data
    : Array.isArray(data?.lists)
    ? data.lists
    : null;
  if (!rawLists) throw new Error("unknown_format");

  if (!Array.isArray(data) && data.format && data.format !== EXPORT_FORMAT) {
    throw new Error("unknown_format");
  }

  const existingNames = existingLists.map((l) => l.name);
  const out = [];
  for (const raw of rawLists) {
    if (!raw || typeof raw !== "object") continue;
    const language = raw.language === CHINESE_MODE ? CHINESE_MODE : ENGLISH_MODE;
    const text = typeof raw.text === "string" ? raw.text : "";
    const name = dedupeName(
      (typeof raw.name === "string" && raw.name.trim()) || "Imported list",
      [...existingNames, ...out.map((l) => l.name)]
    );
    const item = newCustomWordList({ name, language, text });
    if (Array.isArray(raw.resolved)) item.resolved = raw.resolved;
    out.push(item);
  }
  if (out.length === 0) throw new Error("no_lists");
  return out;
};

// Trigger a browser download for the given JSON string. Lives here rather
// than inline in the UI so it can be reused (e.g., single-list and bulk
// export both go through the same path).
export const downloadJsonFile = (filename, jsonString) => {
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const sanitizeFilename = (s) =>
  (s || "wordlist").replace(/[^\w一-龥-]+/g, "_").slice(0, 60);

export const buildExportFilename = (lists) => {
  const arr = Array.isArray(lists) ? lists : [lists];
  if (arr.length === 1) {
    return `eletypes-wordlist-${sanitizeFilename(arr[0].name)}.json`;
  }
  return `eletypes-wordlists-${arr.length}.json`;
};
