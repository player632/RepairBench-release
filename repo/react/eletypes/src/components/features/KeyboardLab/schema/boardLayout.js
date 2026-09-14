/**
 * Eletypes Keyboard Layout Schema — "eletypes-kbd/1"
 * See SCHEMA_SPEC.md for full documentation.
 */

export const SCHEMA_VERSION = "eletypes-kbd/1";

// ─── Enums ───

const FORM_FACTORS = new Set(["40%", "60%", "65%", "75%", "TKL", "full", "1800", "Alice", "split"]);
const LAYOUT_STAGGERS = new Set(["row-staggered", "ortholinear", "columnar", "split", "ergonomic"]);
const STANDARDS = new Set(["ANSI", "ISO", "JIS"]);
const KEY_KINDS = new Set(["alpha", "mod", "accent", "fn", "nav", "arrow"]);

// ─── Validation ───

export const validatePreset = (preset) => {
  const errors = [];
  if (!preset) return { valid: false, errors: ["Preset is null/undefined"] };

  if (preset.schema !== SCHEMA_VERSION) {
    errors.push(`Expected schema "${SCHEMA_VERSION}", got "${preset.schema}"`);
  }

  if (!preset.meta?.name) errors.push("Missing meta.name");

  if (!preset.board) {
    errors.push("Missing board");
  } else {
    if (!preset.board.id) errors.push("Missing board.id");
    if (!FORM_FACTORS.has(preset.board.formFactor)) errors.push(`Invalid board.formFactor: "${preset.board.formFactor}"`);
    if (!LAYOUT_STAGGERS.has(preset.board.layoutStagger)) errors.push(`Invalid board.layoutStagger: "${preset.board.layoutStagger}"`);
    if (!STANDARDS.has(preset.board.standard)) errors.push(`Invalid board.standard: "${preset.board.standard}"`);
    if (typeof preset.board.width !== "number") errors.push("Missing board.width");
    if (typeof preset.board.height !== "number") errors.push("Missing board.height");
  }

  if (!preset.layout?.keys?.length) {
    errors.push("Missing or empty layout.keys");
  } else {
    const ids = new Set();
    preset.layout.keys.forEach((key, i) => {
      const t = `Key[${i}]`;
      if (!key.id) errors.push(`${t}: missing id`);
      if (ids.has(key.id)) errors.push(`${t}: duplicate id "${key.id}"`);
      ids.add(key.id);
      if (!key.keyName) errors.push(`${t}: missing keyName`);
      if (typeof key.label !== "string") errors.push(`${t}: missing label`);
      if (typeof key.x !== "number") errors.push(`${t}: missing x`);
      if (typeof key.y !== "number") errors.push(`${t}: missing y`);
      if (typeof key.w !== "number" || key.w <= 0) errors.push(`${t}: invalid w`);
      if (key.kind && !KEY_KINDS.has(key.kind)) errors.push(`${t}: invalid kind "${key.kind}"`);
    });
  }

  return { valid: errors.length === 0, errors };
};

// ─── Factory ───

/**
 * Create a well-formed preset. Only stores non-default optional values (no noisy nulls).
 */
export const createPreset = ({
  name,
  boardId,
  author,
  version = "1.0",
  description,
  formFactor = "75%",
  layoutStagger = "row-staggered",
  standard = "ANSI",
  keyboardType,
  unitSize,
  casePreset,
  modules,
  keys = [],
  visual,
}) => {
  // Normalize keys — only include optional fields when non-default
  const normalizedKeys = keys.map((k) => {
    const key = {
      id: k.id,
      keyName: k.keyName || k.id,
      label: k.label ?? "",
      x: k.x,
      y: k.y,
      w: k.w,
    };
    if (k.h != null && k.h !== 1) key.h = k.h;
    if (k.r != null && k.r !== 0) key.r = k.r;
    if (k.rx != null) key.rx = k.rx;
    if (k.ry != null) key.ry = k.ry;
    if (k.kind && k.kind !== "alpha") key.kind = k.kind;
    if (k.cluster) key.cluster = k.cluster;
    if (k.profile != null) key.profile = k.profile;
    return key;
  });

  // Auto-compute board dimensions
  let width = 0, height = 0;
  for (const k of normalizedKeys) {
    width = Math.max(width, k.x + k.w);
    height = Math.max(height, k.y + (k.h || 1));
  }

  const preset = {
    schema: SCHEMA_VERSION,
    meta: { name },
    board: {
      id: boardId || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      formFactor,
      layoutStagger,
      standard,
      width,
      height,
    },
    layout: { keys: normalizedKeys },
  };

  // Only include optional fields when present
  if (author) preset.meta.author = author;
  if (version) preset.meta.version = version;
  if (description) preset.meta.description = description;
  if (keyboardType) preset.board.keyboardType = keyboardType;
  if (unitSize && unitSize !== 19.05) preset.board.unitSize = unitSize;
  if (casePreset) preset.board.casePreset = casePreset;
  if (modules?.length) preset.board.modules = modules;
  if (visual) preset.visual = visual;

  return preset;
};

// ─── Migration from old format ───

export const migrateFromDraft = (old) => {
  if (old?.schema === SCHEMA_VERSION) return old; // Already V1

  return {
    schema: SCHEMA_VERSION,
    meta: { ...old?.meta },
    board: {
      id: old?.board?.id || old?.meta?.name?.toLowerCase().replace(/\s+/g, "-") || "migrated",
      formFactor: old?.board?.layoutType || old?.board?.formFactor || "75%",
      layoutStagger: old?.board?.layoutStagger || "row-staggered",
      standard: old?.board?.standard || "ANSI",
      width: old?.board?.width || 0,
      height: old?.board?.height || 0,
      ...(old?.board?.keyboardType && { keyboardType: old.board.keyboardType }),
      ...(old?.board?.unit && { unitSize: old.board.unit }),
      ...(old?.board?.unitSize && { unitSize: old.board.unitSize }),
      ...(old?.board?.casePreset && { casePreset: old.board.casePreset }),
      ...(old?.board?.modules?.length && { modules: old.board.modules }),
    },
    layout: {
      keys: (old?.layout?.keys || []).map((k) => {
        const key = { id: k.id, keyName: k.keyName || k.id, label: k.label ?? "", x: k.x, y: k.y, w: k.w };
        if (k.h && k.h !== 1) key.h = k.h;
        if (k.r && k.r !== 0) key.r = k.r;
        if (k.kind && k.kind !== "alpha") key.kind = k.kind;
        if (k.cluster) key.cluster = k.cluster;
        if (k.profile != null) key.profile = k.profile;
        return key;
      }),
    },
    ...(old?.visual && { visual: old.visual }),
  };
};
