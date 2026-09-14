/**
 * Built-in keycap profile presets.
 */

/** Cherry MX — sculpted, cylindrical dish */
export const CHERRY_PROFILE = {
  schema: "eletypes-cap/1",
  id: "cherry-profile",
  meta: { name: "Cherry", author: "eletypes" },
  profile: {
    id: "cherry",
    name: "Cherry MX",
    uniform: false,
    rows: {
      0: { topAngle: -6,  height: 1.0,  depth: 0.04 },
      1: { topAngle: -3,  height: 0.95, depth: 0.04 },
      2: { topAngle: 0,   height: 0.90, depth: 0.05 },
      3: { topAngle: 5,   height: 0.88, depth: 0.05 },
      4: { topAngle: 9,   height: 0.92, depth: 0.04 },
      5: { topAngle: 5,   height: 0.90, depth: 0.03 },
    },
    defaultCap: {
      topWidth: 0.85,
      topDepth: 0.85,
      height: 0.38,
      cornerRadius: 0.06,
      dishType: "cylindrical",
      dishDepth: 0.05,
    },
  },
  caps: {
    "cherry-homing": {
      id: "cherry-homing",
      name: "Cherry Homing Bar",
      type: "procedural",
      geometry: { topWidth: 0.82, topDepth: 0.82, height: 0.38, cornerRadius: 0.06, dishType: "cylindrical", dishDepth: 0.08 },
      tags: ["homing"],
    },
  },
};

/** SA — tall sculpted, spherical dish */
export const SA_PROFILE = {
  schema: "eletypes-cap/1",
  id: "sa-profile",
  meta: { name: "SA", author: "eletypes" },
  profile: {
    id: "sa",
    name: "SA",
    uniform: false,
    rows: {
      0: { topAngle: -12, height: 1.2,  depth: 0.06 },
      1: { topAngle: -8,  height: 1.15, depth: 0.06 },
      2: { topAngle: -3,  height: 1.1,  depth: 0.07 },
      3: { topAngle: 5,   height: 1.05, depth: 0.07 },
      4: { topAngle: 10,  height: 1.1,  depth: 0.06 },
      5: { topAngle: 5,   height: 1.05, depth: 0.05 },
    },
    defaultCap: {
      topWidth: 0.78,
      topDepth: 0.78,
      height: 0.52,
      cornerRadius: 0.07,
      dishType: "spherical",
      dishDepth: 0.07,
    },
  },
};

/** DSA — uniform, spherical dish, low profile */
export const DSA_PROFILE = {
  schema: "eletypes-cap/1",
  id: "dsa-profile",
  meta: { name: "DSA", author: "eletypes" },
  profile: {
    id: "dsa",
    name: "DSA",
    uniform: true,
    defaultCap: {
      topWidth: 0.80,
      topDepth: 0.80,
      height: 0.32,
      cornerRadius: 0.06,
      dishType: "spherical",
      dishDepth: 0.04,
    },
  },
};

/** XDA — uniform, flat-ish, wide top */
export const XDA_PROFILE = {
  schema: "eletypes-cap/1",
  id: "xda-profile",
  meta: { name: "XDA", author: "eletypes" },
  profile: {
    id: "xda",
    name: "XDA",
    uniform: true,
    defaultCap: {
      topWidth: 0.88,
      topDepth: 0.88,
      height: 0.35,
      cornerRadius: 0.08,
      dishType: "spherical",
      dishDepth: 0.02,
    },
  },
};

/** OEM — sculpted, cylindrical dish, taller than Cherry */
export const OEM_PROFILE = {
  schema: "eletypes-cap/1",
  id: "oem-profile",
  meta: { name: "OEM", author: "eletypes" },
  profile: {
    id: "oem",
    name: "OEM",
    uniform: false,
    rows: {
      0: { topAngle: -8,  height: 1.1,  depth: 0.04 },
      1: { topAngle: -4,  height: 1.05, depth: 0.04 },
      2: { topAngle: 0,   height: 1.0,  depth: 0.05 },
      3: { topAngle: 5,   height: 0.95, depth: 0.05 },
      4: { topAngle: 9,   height: 1.0,  depth: 0.04 },
      5: { topAngle: 5,   height: 0.95, depth: 0.03 },
    },
    defaultCap: {
      topWidth: 0.82,
      topDepth: 0.82,
      height: 0.42,
      cornerRadius: 0.06,
      dishType: "cylindrical",
      dishDepth: 0.04,
    },
  },
};

/** MT3 — tall sculpted, deep spherical dish, aggressive row angles */
export const MT3_PROFILE = {
  schema: "eletypes-cap/1",
  id: "mt3-profile",
  meta: { name: "MT3", author: "eletypes" },
  profile: {
    id: "mt3",
    name: "MT3",
    uniform: false,
    rows: {
      0: { topAngle: -14, height: 1.3,  depth: 0.09 },
      1: { topAngle: -9,  height: 1.2,  depth: 0.09 },
      2: { topAngle: -4,  height: 1.1,  depth: 0.10 },
      3: { topAngle: 6,   height: 1.05, depth: 0.10 },
      4: { topAngle: 12,  height: 1.15, depth: 0.09 },
      5: { topAngle: 6,   height: 1.05, depth: 0.07 },
    },
    defaultCap: {
      topWidth: 0.75,
      topDepth: 0.75,
      height: 0.55,
      cornerRadius: 0.07,
      dishType: "spherical",
      dishDepth: 0.10,
    },
  },
};

/** KAT — medium sculpted, spherical dish, smoother SA */
export const KAT_PROFILE = {
  schema: "eletypes-cap/1",
  id: "kat-profile",
  meta: { name: "KAT", author: "eletypes" },
  profile: {
    id: "kat",
    name: "KAT",
    uniform: false,
    rows: {
      0: { topAngle: -10, height: 1.1,  depth: 0.05 },
      1: { topAngle: -6,  height: 1.05, depth: 0.05 },
      2: { topAngle: -2,  height: 1.0,  depth: 0.06 },
      3: { topAngle: 4,   height: 0.95, depth: 0.06 },
      4: { topAngle: 8,   height: 1.0,  depth: 0.05 },
      5: { topAngle: 4,   height: 0.95, depth: 0.04 },
    },
    defaultCap: {
      topWidth: 0.80,
      topDepth: 0.80,
      height: 0.46,
      cornerRadius: 0.07,
      dishType: "spherical",
      dishDepth: 0.06,
    },
  },
};

/** Low-profile — ultra-short, flat, uniform (Kailh Choc / Keychron low-profile) */
export const LOW_PROFILE = {
  schema: "eletypes-cap/1",
  id: "low-profile",
  meta: { name: "Low Profile", author: "eletypes" },
  profile: {
    id: "low",
    name: "Low Profile",
    uniform: true,
    defaultCap: {
      topWidth: 0.90,
      topDepth: 0.90,
      height: 0.22,
      cornerRadius: 0.04,
      dishType: "flat",
      dishDepth: 0.01,
    },
  },
};

/** All keycap presets */
export const KEYCAP_PRESETS = {
  "cherry-profile": CHERRY_PROFILE,
  "oem-profile": OEM_PROFILE,
  "sa-profile": SA_PROFILE,
  "mt3-profile": MT3_PROFILE,
  "kat-profile": KAT_PROFILE,
  "dsa-profile": DSA_PROFILE,
  "xda-profile": XDA_PROFILE,
  "low-profile": LOW_PROFILE,
};

export const listKeycapPresets = () =>
  Object.values(KEYCAP_PRESETS).map((p) => ({ id: p.id, name: p.meta.name }));

export const getKeycapPreset = (id) => KEYCAP_PRESETS[id] || CHERRY_PROFILE;
