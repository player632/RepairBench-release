/**
 * 60% ANSI layout preset — "eletypes-kbd/1" format.
 * 61 keys. No F-row, no nav cluster, no arrows.
 * Standard Poker / Anne Pro / GH60 style.
 */

import { createPreset } from "../schema/boardLayout";

const R1 = 0, R2 = 1, R3 = 2, R4 = 3, R5 = 4;

export default createPreset({
  name: "60% ANSI",
  boardId: "60-ansi",
  formFactor: "60%",
  layoutStagger: "row-staggered",
  standard: "ANSI",
  keyboardType: "mechanical",
  description: "Standard 60% ANSI layout — Poker / Anne Pro style",
  keys: [
    // ══ Row 1: Number row ══
    { id: "Backquote",  keyName: "Backquote",  label: "`",    x: 0,   y: R1, w: 1,    kind: "alpha" },
    { id: "Digit1",     keyName: "Digit1",     label: "1",    x: 1,   y: R1, w: 1,    kind: "alpha" },
    { id: "Digit2",     keyName: "Digit2",     label: "2",    x: 2,   y: R1, w: 1,    kind: "alpha" },
    { id: "Digit3",     keyName: "Digit3",     label: "3",    x: 3,   y: R1, w: 1,    kind: "alpha" },
    { id: "Digit4",     keyName: "Digit4",     label: "4",    x: 4,   y: R1, w: 1,    kind: "alpha" },
    { id: "Digit5",     keyName: "Digit5",     label: "5",    x: 5,   y: R1, w: 1,    kind: "alpha" },
    { id: "Digit6",     keyName: "Digit6",     label: "6",    x: 6,   y: R1, w: 1,    kind: "alpha" },
    { id: "Digit7",     keyName: "Digit7",     label: "7",    x: 7,   y: R1, w: 1,    kind: "alpha" },
    { id: "Digit8",     keyName: "Digit8",     label: "8",    x: 8,   y: R1, w: 1,    kind: "alpha" },
    { id: "Digit9",     keyName: "Digit9",     label: "9",    x: 9,   y: R1, w: 1,    kind: "alpha" },
    { id: "Digit0",     keyName: "Digit0",     label: "0",    x: 10,  y: R1, w: 1,    kind: "alpha" },
    { id: "Minus",      keyName: "Minus",      label: "-",    x: 11,  y: R1, w: 1,    kind: "alpha" },
    { id: "Equal",      keyName: "Equal",      label: "=",    x: 12,  y: R1, w: 1,    kind: "alpha" },
    { id: "Backspace",  keyName: "Backspace",  label: "Bksp", x: 13,  y: R1, w: 2,    kind: "mod"   },

    // ══ Row 2: QWERTY row ══
    { id: "Tab",        keyName: "Tab",        label: "Tab",  x: 0,   y: R2, w: 1.5,  kind: "mod"   },
    { id: "KeyQ",       keyName: "KeyQ",       label: "Q",    x: 1.5, y: R2, w: 1,    kind: "alpha" },
    { id: "KeyW",       keyName: "KeyW",       label: "W",    x: 2.5, y: R2, w: 1,    kind: "alpha" },
    { id: "KeyE",       keyName: "KeyE",       label: "E",    x: 3.5, y: R2, w: 1,    kind: "alpha" },
    { id: "KeyR",       keyName: "KeyR",       label: "R",    x: 4.5, y: R2, w: 1,    kind: "alpha" },
    { id: "KeyT",       keyName: "KeyT",       label: "T",    x: 5.5, y: R2, w: 1,    kind: "alpha" },
    { id: "KeyY",       keyName: "KeyY",       label: "Y",    x: 6.5, y: R2, w: 1,    kind: "alpha" },
    { id: "KeyU",       keyName: "KeyU",       label: "U",    x: 7.5, y: R2, w: 1,    kind: "alpha" },
    { id: "KeyI",       keyName: "KeyI",       label: "I",    x: 8.5, y: R2, w: 1,    kind: "alpha" },
    { id: "KeyO",       keyName: "KeyO",       label: "O",    x: 9.5, y: R2, w: 1,    kind: "alpha" },
    { id: "KeyP",       keyName: "KeyP",       label: "P",    x: 10.5,y: R2, w: 1,    kind: "alpha" },
    { id: "BracketLeft",keyName: "BracketLeft",label: "[",    x: 11.5,y: R2, w: 1,    kind: "alpha" },
    { id: "BracketRight",keyName:"BracketRight",label: "]",   x: 12.5,y: R2, w: 1,    kind: "alpha" },
    { id: "Backslash",  keyName: "Backslash",  label: "\\",   x: 13.5,y: R2, w: 1.5,  kind: "alpha" },

    // ══ Row 3: Home row ══
    { id: "CapsLock",   keyName: "CapsLock",   label: "Caps", x: 0,   y: R3, w: 1.75, kind: "mod"   },
    { id: "KeyA",       keyName: "KeyA",       label: "A",    x: 1.75,y: R3, w: 1,    kind: "alpha" },
    { id: "KeyS",       keyName: "KeyS",       label: "S",    x: 2.75,y: R3, w: 1,    kind: "alpha" },
    { id: "KeyD",       keyName: "KeyD",       label: "D",    x: 3.75,y: R3, w: 1,    kind: "alpha" },
    { id: "KeyF",       keyName: "KeyF",       label: "F",    x: 4.75,y: R3, w: 1,    kind: "alpha" },
    { id: "KeyG",       keyName: "KeyG",       label: "G",    x: 5.75,y: R3, w: 1,    kind: "alpha" },
    { id: "KeyH",       keyName: "KeyH",       label: "H",    x: 6.75,y: R3, w: 1,    kind: "alpha" },
    { id: "KeyJ",       keyName: "KeyJ",       label: "J",    x: 7.75,y: R3, w: 1,    kind: "alpha" },
    { id: "KeyK",       keyName: "KeyK",       label: "K",    x: 8.75,y: R3, w: 1,    kind: "alpha" },
    { id: "KeyL",       keyName: "KeyL",       label: "L",    x: 9.75,y: R3, w: 1,    kind: "alpha" },
    { id: "Semicolon",  keyName: "Semicolon",  label: ";",    x: 10.75,y: R3, w: 1,   kind: "alpha" },
    { id: "Quote",      keyName: "Quote",      label: "'",    x: 11.75,y: R3, w: 1,   kind: "alpha" },
    { id: "Enter",      keyName: "Enter",      label: "Enter",x: 12.75,y: R3, w: 2.25,kind: "accent" },

    // ══ Row 4: Bottom alpha row ══
    { id: "ShiftLeft",  keyName: "ShiftLeft",  label: "Shift",x: 0,   y: R4, w: 2.25, kind: "mod"   },
    { id: "KeyZ",       keyName: "KeyZ",       label: "Z",    x: 2.25,y: R4, w: 1,    kind: "alpha" },
    { id: "KeyX",       keyName: "KeyX",       label: "X",    x: 3.25,y: R4, w: 1,    kind: "alpha" },
    { id: "KeyC",       keyName: "KeyC",       label: "C",    x: 4.25,y: R4, w: 1,    kind: "alpha" },
    { id: "KeyV",       keyName: "KeyV",       label: "V",    x: 5.25,y: R4, w: 1,    kind: "alpha" },
    { id: "KeyB",       keyName: "KeyB",       label: "B",    x: 6.25,y: R4, w: 1,    kind: "alpha" },
    { id: "KeyN",       keyName: "KeyN",       label: "N",    x: 7.25,y: R4, w: 1,    kind: "alpha" },
    { id: "KeyM",       keyName: "KeyM",       label: "M",    x: 8.25,y: R4, w: 1,    kind: "alpha" },
    { id: "Comma",      keyName: "Comma",      label: ",",    x: 9.25,y: R4, w: 1,    kind: "alpha" },
    { id: "Period",     keyName: "Period",     label: ".",    x: 10.25,y: R4, w: 1,    kind: "alpha" },
    { id: "Slash",      keyName: "Slash",      label: "/",    x: 11.25,y: R4, w: 1,    kind: "alpha" },
    { id: "ShiftRight", keyName: "ShiftRight", label: "Shift",x: 12.25,y: R4, w: 2.75,kind: "mod"   },

    // ══ Row 5: Bottom modifiers ══
    { id: "ControlLeft", keyName: "ControlLeft", label: "Ctrl", x: 0,    y: R5, w: 1.25, kind: "mod" },
    { id: "MetaLeft",    keyName: "MetaLeft",    label: "Win",  x: 1.25, y: R5, w: 1.25, kind: "mod" },
    { id: "AltLeft",     keyName: "AltLeft",     label: "Alt",  x: 2.5,  y: R5, w: 1.25, kind: "mod" },
    { id: "Space",       keyName: "Space",       label: "",     x: 3.75, y: R5, w: 6.25, kind: "alpha" },
    { id: "AltRight",    keyName: "AltRight",    label: "Alt",  x: 10,   y: R5, w: 1.25, kind: "mod" },
    { id: "MetaRight",   keyName: "MetaRight",   label: "Win",  x: 11.25,y: R5, w: 1.25, kind: "mod" },
    { id: "ContextMenu", keyName: "ContextMenu", label: "Menu", x: 12.5, y: R5, w: 1.25, kind: "mod" },
    { id: "ControlRight",keyName: "ControlRight",label: "Ctrl", x: 13.75,y: R5, w: 1.25, kind: "mod" },
  ],
});
