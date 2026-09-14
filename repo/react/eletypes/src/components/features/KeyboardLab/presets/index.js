/**
 * Preset registry — single entry point for layout and shell lookups.
 */

import generic75 from "./generic75";
import cyberboard75 from "./cyberboard75";
import layout60 from "./layout60";
import layout65 from "./layout65";
import layoutTKL from "./layoutTKL";
import layoutFullSize from "./layoutFullSize";
import layoutHHKB from "./layoutHHKB";
import { DEFAULT_SHELL } from "../schema/shellProfile";

const PRESETS = {
  "generic-75-ansi": { layout: generic75, shell: DEFAULT_SHELL },
  "cyberboard-75-ansi": { layout: cyberboard75, shell: DEFAULT_SHELL },
  "60-ansi": { layout: layout60, shell: DEFAULT_SHELL },
  "65-ansi": { layout: layout65, shell: DEFAULT_SHELL },
  "tkl-ansi": { layout: layoutTKL, shell: DEFAULT_SHELL },
  "full-ansi": { layout: layoutFullSize, shell: DEFAULT_SHELL },
  "hhkb-60-ansi": { layout: layoutHHKB, shell: DEFAULT_SHELL },
};

/** Get a preset by id. Returns { layout, shell }. */
export const getPreset = (id) => {
  const preset = PRESETS[id];
  if (!preset) throw new Error(`Unknown preset: "${id}"`);
  return preset;
};

/** List all available presets. */
export const listPresets = () =>
  Object.entries(PRESETS).map(([id, { layout }]) => ({
    id,
    name: layout.meta.name,
    layoutType: layout.meta.layoutType,
  }));

/** Get just the shell profile by id. */
export const getShell = (id) => {
  const preset = PRESETS[id];
  return preset ? preset.shell : DEFAULT_SHELL;
};

/** Register a custom preset at runtime (for user-created layouts). */
export const registerPreset = (id, layout, shell = DEFAULT_SHELL) => {
  PRESETS[id] = { layout, shell };
};
