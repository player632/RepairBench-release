/**
 * KLE (keyboard-layout-editor.com) JSON importer.
 *
 * Parses KLE serialized format into eletypes-kbd/1 layout.
 * Based on the KLE serialized data format spec by ijprest.
 *
 * KLE format: array of rows, each row is an array of items.
 * - String item → key label (emits a key at current position)
 * - Object item → modifies current key state (x, y, w, h, color, etc.)
 * - First element can be metadata object (name, author, etc.)
 *
 * After each key: x advances by width, w/h reset to 1.
 * After each row: y advances by 1, x resets to rotation origin.
 */

import { createPreset } from "../schema/boardLayout";

/**
 * Parse KLE JSON rows into an array of key objects with absolute positions.
 * @param {Array} rows — KLE serialized rows
 * @returns {{ meta: Object, keys: Array<{x,y,w,h,label,color}> }}
 */
function parseKleRows(rows) {
  if (!Array.isArray(rows)) throw new Error("KLE data must be an array");

  const meta = { name: "KLE Import", author: "" };
  const keys = [];

  // Current key state — carries forward between items
  let cx = 0, cy = 0;
  let cw = 1, ch = 1;
  let rx = 0, ry = 0, ra = 0; // rotation
  let color = "#cccccc";
  let isDecal = false;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];

    // First element can be keyboard metadata
    if (!Array.isArray(row) && typeof row === "object" && r === 0) {
      if (row.name) meta.name = row.name;
      if (row.author) meta.author = row.author;
      continue;
    }

    if (!Array.isArray(row)) continue;

    for (let k = 0; k < row.length; k++) {
      const item = row[k];

      if (typeof item === "string") {
        if (isDecal) {
          // Decal key — skip it, just advance position and reset
          cx += cw;
          cw = 1;
          ch = 1;
          isDecal = false;
          continue;
        }

        // This is a key — emit it
        const labels = item.split("\n");
        keys.push({
          x: cx,
          y: cy,
          w: cw,
          h: ch,
          label: labels[0] || "",
          color,
          rotation: ra !== 0 ? { angle: ra, x: rx, y: ry } : null,
        });

        // Advance x, reset per-key properties
        cx += cw;
        cw = 1;
        ch = 1;
      } else if (typeof item === "object") {
        // Modifier — update current state
        if (item.d) {
          // Decal flag: if dimensions are large (background decoration),
          // skip entirely without consuming the next string.
          // If dimensions are normal key-sized, mark next string as decal.
          const dw = item.w || cw;
          const dh = item.h || ch;
          if (dw > 4 || dh > 4) {
            // Background decoration — skip, don't touch current state
            continue;
          }
          isDecal = true;
        }
        if (item.r != null) ra = item.r;
        if (item.rx != null) { rx = item.rx; cx = rx; }
        if (item.ry != null) { ry = item.ry; cy = ry; }
        if (item.x) cx += item.x;
        if (item.y) cy += item.y;
        if (!item.d || isDecal) {
          if (item.w) cw = item.w;
          if (item.h) ch = item.h;
        }
        if (item.c) color = item.c;
      }
    }

    // End of row — advance y, reset x
    cy++;
    cx = rx;
  }

  return { meta, keys };
}

/**
 * Guess the key kind from the label and position.
 */
function guessKind(label, w) {
  const l = label.toLowerCase();
  if (!label) return "alpha";
  // Function keys
  if (/^f\d+$/i.test(l)) return "fn";
  // Navigation
  if (["ins", "del", "home", "end", "pgup", "pgdn", "prtsc", "scrlk", "pause", "insert", "delete", "print"].some(n => l.includes(n))) return "nav";
  // Arrows
  if (["↑", "↓", "←", "→", "up", "down", "left", "right"].includes(l)) return "arrow";
  // Modifiers
  if (w > 1.25 || ["shift", "ctrl", "alt", "win", "meta", "cmd", "opt", "fn", "menu", "caps", "tab", "backspace", "bksp", "bs"].some(n => l.includes(n))) return "mod";
  // Enter
  if (["enter", "return", "↵"].some(n => l.includes(n))) return "accent";
  // Escape
  if (l === "esc" || l === "escape") return "accent";
  // Single char = alpha
  if (label.length <= 2) return "alpha";
  return "alpha";
}

/**
 * Map a KLE key label to a KeyboardEvent.code.
 */
const LABEL_TO_CODE = {
  "esc": "Escape", "escape": "Escape",
  "`": "Backquote", "~": "Backquote",
  "1": "Digit1", "2": "Digit2", "3": "Digit3", "4": "Digit4", "5": "Digit5",
  "6": "Digit6", "7": "Digit7", "8": "Digit8", "9": "Digit9", "0": "Digit0",
  "-": "Minus", "=": "Equal", "+": "Equal",
  "backspace": "Backspace", "bksp": "Backspace", "bs": "Backspace", "back": "Backspace",
  "tab": "Tab",
  "q": "KeyQ", "w": "KeyW", "e": "KeyE", "r": "KeyR", "t": "KeyT",
  "y": "KeyY", "u": "KeyU", "i": "KeyI", "o": "KeyO", "p": "KeyP",
  "[": "BracketLeft", "]": "BracketRight", "{": "BracketLeft", "}": "BracketRight",
  "\\": "Backslash", "|": "Backslash",
  "caps lock": "CapsLock", "caps": "CapsLock", "capslock": "CapsLock",
  "a": "KeyA", "s": "KeyS", "d": "KeyD", "f": "KeyF", "g": "KeyG",
  "h": "KeyH", "j": "KeyJ", "k": "KeyK", "l": "KeyL",
  ";": "Semicolon", "'": "Quote", "\"": "Quote",
  "enter": "Enter", "return": "Enter", "↵": "Enter",
  "shift": "ShiftLeft", "lshift": "ShiftLeft", "rshift": "ShiftRight",
  "z": "KeyZ", "x": "KeyX", "c": "KeyC", "v": "KeyV", "b": "KeyB",
  "n": "KeyN", "m": "KeyM",
  ",": "Comma", ".": "Period", "/": "Slash", "?": "Slash",
  "ctrl": "ControlLeft", "lctrl": "ControlLeft", "rctrl": "ControlRight", "control": "ControlLeft",
  "win": "MetaLeft", "meta": "MetaLeft", "cmd": "MetaLeft", "super": "MetaLeft",
  "alt": "AltLeft", "lalt": "AltLeft", "ralt": "AltRight", "opt": "AltLeft",
  "space": "Space", "": "Space",
  "menu": "ContextMenu", "app": "ContextMenu", "fn": "Fn",
  "↑": "ArrowUp", "↓": "ArrowDown", "←": "ArrowLeft", "→": "ArrowRight",
  "up": "ArrowUp", "down": "ArrowDown", "left": "ArrowLeft", "right": "ArrowRight",
  "ins": "Insert", "insert": "Insert",
  "del": "Delete", "delete": "Delete",
  "home": "Home", "end": "End",
  "pgup": "PageUp", "page up": "PageUp", "pgdn": "PageDown", "page down": "PageDown",
  "prtsc": "PrintScreen", "print": "PrintScreen",
  "scrlk": "ScrollLock", "scroll lock": "ScrollLock",
  "pause": "Pause", "break": "Pause",
  "num lock": "NumLock", "numlock": "NumLock",
};

function labelToCode(label) {
  return LABEL_TO_CODE[label.toLowerCase()] || "";
}

/**
 * Parse a KLE input string into a rows array.
 *
 * KLE has two authoring surfaces:
 *   1. The "Download JSON" export — a valid JSON file shaped like [[...rows...]].
 *      It is often pretty-printed, so the outer `[` is followed by whitespace, not `[`.
 *   2. The "Raw data" tab — NOT valid JSON: no outer brackets, unquoted property keys
 *      like {w:1.5}, and authors sometimes paste literal newlines inside labels.
 *
 * Strategy: try standard JSON first (covers the whole download-file case and any
 * already-valid pasted JSON regardless of formatting), then fall back to the
 * repair path only when strict parsing fails.
 */
function parseKleString(raw) {
  const trimmed = raw.trim();

  // Path 1 — standard JSON. Works for downloaded files (pretty-printed or not)
  // and any already-valid pasted content.
  try {
    return JSON.parse(trimmed);
  } catch { /* fall through to repair */ }

  // Path 2 — "Raw data" tab content. Needs outer brackets, key quoting,
  // and literal-newline escaping inside strings.
  let repaired = trimmed.startsWith("[") ? trimmed : "[" + trimmed + "]";
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z_]\w*)\s*:/g, '$1"$2":');
  repaired = escapeNewlinesInStrings(repaired);
  repaired = repaired.replace(/,(\s*[\]}])/g, "$1");

  try {
    return JSON.parse(repaired);
  } catch (err) {
    throw new Error(`Invalid KLE data: ${err.message}`);
  }
}

function escapeNewlinesInStrings(src) {
  let out = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (escaped) { out += ch; escaped = false; continue; }
    if (ch === "\\") { out += ch; escaped = true; continue; }
    if (ch === '"') { inString = !inString; out += ch; continue; }
    if (inString && ch === "\n") { out += "\\n"; continue; }
    if (inString && ch === "\r") continue;
    out += ch;
  }
  return out;
}

/**
 * Convert KLE JSON into an eletypes-kbd/1 layout preset.
 *
 * @param {string|Array} kleData — KLE JSON string or parsed array
 * @returns {Object} eletypes-kbd/1 layout preset
 */
export function importKleLayout(kleData) {
  let rows;
  if (typeof kleData === "string") {
    rows = parseKleString(kleData);
  } else {
    rows = kleData;
  }

  const { meta, keys: kleKeys } = parseKleRows(rows);

  if (kleKeys.length === 0) {
    throw new Error("No keys found. Make sure this is valid KLE data.");
  }
  if (kleKeys.length < 10) {
    throw new Error(`Only ${kleKeys.length} keys found — this doesn't look like a complete keyboard layout.`);
  }

  // Sanity check: keys should have reasonable positions
  const hasValidPositions = kleKeys.every(k =>
    typeof k.x === "number" && typeof k.y === "number" &&
    k.x >= 0 && k.y >= 0 && k.x < 30 && k.y < 15
  );
  if (!hasValidPositions) {
    throw new Error("Key positions out of range. The data may not be valid KLE format.");
  }

  // Detect form factor from key count
  const keyCount = kleKeys.length;
  let formFactor = "75%";
  if (keyCount <= 50) formFactor = "40%";
  else if (keyCount <= 63) formFactor = "60%";
  else if (keyCount <= 70) formFactor = "65%";
  else if (keyCount <= 85) formFactor = "75%";
  else if (keyCount <= 90) formFactor = "TKL";
  else formFactor = "full";

  // Track seen codes to avoid duplicates
  const seenCodes = new Set();

  const keys = kleKeys.map((k, i) => {
    const label = k.label || "";
    const code = labelToCode(label);

    // Generate unique ID
    let id = code || `Key_${i}`;
    if (seenCodes.has(id)) {
      // Duplicate — append index (e.g. second Shift becomes ShiftRight)
      if (id === "ShiftLeft") id = "ShiftRight";
      else if (id === "ControlLeft") id = "ControlRight";
      else if (id === "AltLeft") id = "AltRight";
      else if (id === "MetaLeft") id = "MetaRight";
      else id = `${id}_${i}`;
    }
    seenCodes.add(id);

    return {
      id,
      keyName: id,
      label: label || (k.w >= 6 ? "" : label), // Space key gets empty label
      x: k.x,
      y: k.y,
      w: k.w,
      ...(k.h > 1 ? { h: k.h } : {}),
      kind: guessKind(label, k.w),
      ...(code ? { code } : {}),
    };
  });

  return createPreset({
    name: meta.name || "KLE Import",
    boardId: "kle-import-" + Date.now().toString(36),
    formFactor,
    layoutStagger: "row-staggered",
    standard: "ANSI",
    keyboardType: "mechanical",
    description: `Imported from KLE${meta.author ? ` by ${meta.author}` : ""}`,
    keys,
  });
}
