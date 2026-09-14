/**
 * Local design persistence — localStorage adapter.
 *
 * Storage format: eletypes-design-bundle/1
 *
 * {
 *   schema: "eletypes-design-bundle/1",
 *   savedAt: "2026-04-17T09:45:24.124Z",
 *   design: {
 *     schema: "eletypes-design/1",
 *     id, meta, refs, overrides
 *   },
 *   embeddedAssets: {
 *     layout, keycap, legend, shell, caseProfile
 *   }
 * }
 *
 * Read-time migration handles two legacy formats:
 * - v0a: raw design doc stored directly (schema: "eletypes-design/1" at root)
 * - v0b: intermediate bundle { design, assets, profile, meta }
 */

const PREFIX = "eletypes-design-";

// ─── Migration ───

/**
 * Migrate any legacy format to eletypes-design-bundle/1.
 * Called on every load — idempotent, never throws.
 */
function migrateToBundle(raw) {
  // Already current format
  if (raw.schema === "eletypes-design-bundle/1") return raw;

  // v0b: intermediate bundle { design: {...}, assets: {...}, profile: {...} }
  if (raw.design?.schema === "eletypes-design/1") {
    const design = migrateDesignDoc(raw.design);
    const embeddedAssets = { ...raw.assets };
    if (raw.profile) embeddedAssets.caseProfile = raw.profile;
    return {
      schema: "eletypes-design-bundle/1",
      savedAt: raw.meta?.updated || new Date().toISOString(),
      design,
      embeddedAssets,
    };
  }

  // v0a: raw design doc stored directly
  if (raw.schema === "eletypes-design/1") {
    return {
      schema: "eletypes-design-bundle/1",
      savedAt: new Date().toISOString(),
      design: migrateDesignDoc(raw),
      embeddedAssets: {},
    };
  }

  // Unknown — wrap minimally
  return {
    schema: "eletypes-design-bundle/1",
    savedAt: new Date().toISOString(),
    design: raw,
    embeddedAssets: {},
  };
}

/**
 * Migrate a design doc's internals:
 * - assets → refs
 * - profile → caseProfile
 * - opacity promoted out of visual
 * - meta.version → meta.revision, created → createdAt, etc.
 */
function migrateDesignDoc(doc) {
  const d = { ...doc };

  // assets → refs
  if (d.assets && !d.refs) {
    d.refs = { ...d.assets };
    delete d.assets;
  }

  // refs.profile → refs.caseProfile
  if (d.refs?.profile) {
    d.refs.caseProfile = d.refs.profile.replace(/^profile\//, "caseProfile/");
    delete d.refs.profile;
  }

  // Promote opacity out of overrides.visual
  if (d.overrides?.visual?.opacity) {
    d.overrides.opacity = d.overrides.visual.opacity;
    const { opacity, ...visualRest } = d.overrides.visual;
    d.overrides.visual = visualRest;
  }

  // Remove inline caseProfile/mount from overrides (now in embeddedAssets)
  // Keep them if no caseProfile ref (inline mode)
  if (d.refs?.caseProfile) {
    delete d.overrides?.caseProfile;
    delete d.overrides?.mount;
  }

  // Normalize meta
  if (d.meta) {
    if (d.meta.version && !d.meta.revision) {
      d.meta.revision = parseInt(d.meta.version) || 1;
      delete d.meta.version;
    }
    if (d.meta.created && !d.meta.createdAt) {
      d.meta.createdAt = d.meta.created;
      delete d.meta.created;
    }
    if (!d.meta.updatedAt) {
      d.meta.updatedAt = d.meta.createdAt || new Date().toISOString();
    }
  }

  return d;
}

// ─── Public API ───

/**
 * Save a design bundle to localStorage.
 * @param {Object} bundle — { design, embeddedAssets }
 */
export function saveDesign(bundle) {
  const id = bundle.design?.id;
  if (!id) throw new Error("Design must have an id");

  // Ensure proper bundle envelope
  const data = {
    schema: "eletypes-design-bundle/1",
    savedAt: new Date().toISOString(),
    design: {
      ...bundle.design,
      meta: {
        ...bundle.design.meta,
        updatedAt: new Date().toISOString(),
        revision: (bundle.design.meta?.revision || 0) + 1,
      },
    },
    embeddedAssets: bundle.embeddedAssets || {},
  };

  localStorage.setItem(PREFIX + id, JSON.stringify(data));
}

/**
 * Load a design bundle by id. Migrates legacy formats on read.
 * @param {string} id
 * @returns {import('../types/design').DesignBundle|null}
 */
export function loadDesign(id) {
  try {
    const raw = localStorage.getItem(PREFIX + id);
    if (!raw) return null;
    return migrateToBundle(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * List all saved designs.
 * @returns {Array<{id: string, name: string, updated: string}>}
 */
export function listDesigns() {
  const designs = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(PREFIX)) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        // Handle all formats for listing
        const design = data.design || data;
        const name = design.meta?.name || design.id || key;
        const id = design.id;
        const updated = data.savedAt || data.meta?.updated || design.meta?.updatedAt || "";
        if (id) designs.push({ id, name, updated });
      } catch {
        // Skip corrupt entries
      }
    }
  }
  return designs.sort((a, b) => (b.updated || "").localeCompare(a.updated || ""));
}

/**
 * Delete a design by id.
 * @param {string} id
 */
export function deleteDesign(id) {
  localStorage.removeItem(PREFIX + id);
}

/**
 * Export a design bundle as formatted JSON string.
 * @param {Object} bundle
 * @returns {string}
 */
export function exportDesignJSON(bundle) {
  return JSON.stringify({
    schema: "eletypes-design-bundle/1",
    savedAt: new Date().toISOString(),
    design: bundle.design,
    embeddedAssets: bundle.embeddedAssets || {},
  }, null, 2);
}

/**
 * Import a design bundle from JSON string.
 * Accepts both bundle format and legacy raw design docs.
 * @param {string} json
 * @returns {import('../types/design').DesignBundle}
 * @throws {Error} If invalid
 */
export function importDesignJSON(json) {
  const data = JSON.parse(json);
  return migrateToBundle(data);
}
