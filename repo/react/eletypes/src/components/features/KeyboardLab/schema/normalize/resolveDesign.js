/**
 * Design document resolver — the composition engine.
 *
 * Takes a design doc + asset resolver, resolves all references,
 * applies overrides, and produces a NormalizedKeyboard.
 */

import { normalizeKeyboard } from "./normalize";

/**
 * Resolve a design document into a fully normalized keyboard.
 *
 * @param {import('../types/design').DesignDocument} design
 * @param {(assetRef: string) => Promise<Object>} resolver
 * @returns {Promise<import('../types/normalized').NormalizedKeyboard>}
 */
export async function resolveDesign(design, resolver) {
  const refs = design.refs || design.assets || {};

  // 1. Resolve all asset references
  const layout = await resolver(refs.layout);
  const keycap = refs.keycap ? await resolver(refs.keycap) : null;
  const legend = refs.legend ? await resolver(refs.legend) : null;
  const visual = refs.visual ? await resolver(refs.visual) : null;
  const shell = refs.shell ? await resolver(refs.shell) : null;

  // 2. Apply design-level overrides
  const overrides = design.overrides || {};

  const mergedVisual = visual && overrides.visual
    ? { ...visual, colors: { ...visual.colors, ...overrides.visual } }
    : visual;

  const mergedLegend = legend && overrides.legend
    ? { ...legend, style: { ...legend.style, ...overrides.legend } }
    : legend;

  // 3. Apply per-key overrides to the layout
  let resolvedLayout = layout;
  if (overrides.keys && Object.keys(overrides.keys).length > 0) {
    const keys = (layout.layout?.keys || []).map((key) => {
      const keyOverride = overrides.keys[key.id];
      if (!keyOverride) return key;
      return { ...key, ...keyOverride };
    });
    resolvedLayout = {
      ...layout,
      layout: { ...layout.layout, keys },
    };
  }

  // 4. Normalize
  const normalized = normalizeKeyboard(resolvedLayout, keycap, mergedVisual);

  // 5. Attach shell and legend to the result
  normalized.shell = shell;
  normalized.legend = mergedLegend;

  return normalized;
}

/**
 * Create a design document from the current editor state.
 *
 * Produces an eletypes-design/1 doc with refs and overrides.
 * Opacity is a sibling of visual (not nested inside it).
 */
export function designFromSelections({
  name = "Untitled Design",
  layoutRef,
  keycapRef,
  legendRef,
  shellRef,
  caseProfileRef,
  renderStyleRef,
  renderStyleKeycapRef,
  renderStyleCaseRef,
  colorOverrides,
  opacityOverrides,
  legendOverrides,
  renderStyleOverrides,
  renderStyleKeycapOverrides,
  renderStyleCaseOverrides,
  keyOverrides,
}) {
  const now = new Date().toISOString();
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36);

  const design = {
    schema: "eletypes-design/1",
    id,
    meta: {
      name,
      revision: 1,
      createdAt: now,
      updatedAt: now,
    },
    refs: {
      layout: layoutRef,
    },
  };

  if (keycapRef) design.refs.keycap = keycapRef;
  if (legendRef) design.refs.legend = legendRef;
  if (shellRef) design.refs.shell = shellRef;
  if (caseProfileRef) design.refs.caseProfile = caseProfileRef;
  // renderStyle is a normal ref at the same flat level. Omit when it's the
  // implicit default (renderStyle/default@1 ≡ plain PBR) to keep the JSON tidy.
  if (renderStyleRef && renderStyleRef !== "renderStyle/default@1") design.refs.renderStyle = renderStyleRef;
  // Scope-specific renderStyle — stays at the same flat level as the global
  // one. Omit when empty/null (falls back to the global ref at resolve time).
  if (renderStyleKeycapRef) design.refs.renderStyleKeycap = renderStyleKeycapRef;
  if (renderStyleCaseRef) design.refs.renderStyleCase = renderStyleCaseRef;

  const overrides = {};

  // Visual: colors only (no opacity nested here)
  if (colorOverrides) {
    const { opacity, ...colors } = colorOverrides;
    if (Object.keys(colors).length > 0) overrides.visual = colors;
  }

  // Opacity: sibling of visual
  if (opacityOverrides) overrides.opacity = opacityOverrides;

  if (legendOverrides && Object.keys(legendOverrides).length > 0) overrides.legend = legendOverrides;
  if (renderStyleOverrides && Object.keys(renderStyleOverrides).length > 0) overrides.renderStyle = renderStyleOverrides;
  if (renderStyleKeycapOverrides && Object.keys(renderStyleKeycapOverrides).length > 0) overrides.renderStyleKeycap = renderStyleKeycapOverrides;
  if (renderStyleCaseOverrides && Object.keys(renderStyleCaseOverrides).length > 0) overrides.renderStyleCase = renderStyleCaseOverrides;
  if (keyOverrides && Object.keys(keyOverrides).length > 0) overrides.keys = keyOverrides;

  if (Object.keys(overrides).length > 0) design.overrides = overrides;

  return design;
}
