/**
 * Built-in legend style presets.
 * Font sizes tuned for distanceFactor=0.9 in 3D space.
 */

export const LEGEND_PRESETS = {
  "gmk-classic": {
    schema: "eletypes-legend/1",
    id: "gmk-classic",
    meta: { name: "GMK" },
    style: {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: 28,
      fontWeight: 700,
      color: "#d0d0d0",
      position: "center",
      letterSpacing: 0.04,
      uppercase: true,
    },
  },
  "minimalist": {
    schema: "eletypes-legend/1",
    id: "minimalist",
    meta: { name: "Minimal" },
    style: {
      fontFamily: "Helvetica Neue, Arial, sans-serif",
      fontSize: 22,
      fontWeight: 400,
      color: "#888888",
      position: "center",
      letterSpacing: 0.02,
      uppercase: false,
    },
  },
  "retro": {
    schema: "eletypes-legend/1",
    id: "retro",
    meta: { name: "Retro" },
    style: {
      fontFamily: "Courier New, Courier, monospace",
      fontSize: 26,
      fontWeight: 700,
      color: "#e0d8c0",
      position: "center",
      letterSpacing: 0.06,
      uppercase: true,
    },
  },
  "top-print": {
    schema: "eletypes-legend/1",
    id: "top-print",
    meta: { name: "Top Print" },
    style: {
      fontFamily: "Helvetica Neue, Arial, sans-serif",
      fontSize: 20,
      fontWeight: 600,
      color: "#aaaaaa",
      position: "top-left",
      letterSpacing: 0.01,
      uppercase: false,
    },
  },
  "cyber": {
    schema: "eletypes-legend/1",
    id: "cyber",
    meta: { name: "Cyber" },
    style: {
      fontFamily: "Tomorrow, Consolas, monospace",
      fontSize: 24,
      fontWeight: 600,
      color: "#00ffaa",
      position: "center",
      letterSpacing: 0.08,
      uppercase: true,
    },
  },
  "blank": {
    schema: "eletypes-legend/1",
    id: "blank",
    meta: { name: "Blank" },
    style: {
      fontFamily: "sans-serif",
      fontSize: 0,
      fontWeight: 400,
      color: "transparent",
      position: "center",
      uppercase: false,
    },
  },
};

export const listLegendPresets = () =>
  Object.values(LEGEND_PRESETS).map((p) => ({ id: p.id, name: p.meta.name }));

export const getLegendPreset = (id) => LEGEND_PRESETS[id] || LEGEND_PRESETS["gmk-classic"];
