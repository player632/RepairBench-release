/**
 * Keycap Schema Types — "eletypes-cap/1"
 *
 * Defines profile families, row sculpting, cap variants, and mesh references.
 * Decoupled from the layout schema — layout keys reference caps via `capRef`.
 *
 * @typedef {"cylindrical"|"spherical"|"flat"|"saddle"} DishType
 *
 * @typedef {Object} KeycapPreset
 * @property {"eletypes-cap/1"} schema
 * @property {string} id
 * @property {{name:string, author?:string, version?:string, description?:string}} meta
 * @property {ProfileFamily} profile
 * @property {Object<string, CapDefinition>} [caps] — Named cap definitions, keyed by cap id
 *
 * @typedef {Object} ProfileFamily
 * @property {string} id            — "cherry"|"sa"|"dsa"|"xda"|"oem"|"mt3"|"low-profile"
 * @property {string} name          — Display name
 * @property {boolean} uniform      — true = all rows same shape (DSA, XDA)
 * @property {Object<number, RowSculpt>} [rows] — Row index → sculpt params (sculpted profiles only)
 * @property {CapGeometry} defaultCap
 *
 * @typedef {Object} RowSculpt
 * @property {number} topAngle      — Degrees: top surface tilt (negative = toward user)
 * @property {number} height        — Relative cap height (1.0 = standard)
 * @property {number} depth         — Dish depth (0 = flat)
 *
 * @typedef {Object} CapDefinition
 * @property {string} id
 * @property {string} name
 * @property {"procedural"|"mesh"} type
 * @property {CapGeometry} [geometry]   — For procedural caps
 * @property {MeshReference} [mesh]     — For mesh-backed caps
 * @property {number[]} [fitSizes]      — Which key widths this cap fits
 * @property {string[]} [tags]
 *
 * @typedef {Object} CapGeometry
 * @property {number} topWidth       — Top surface width ratio (0.85 = tapered)
 * @property {number} topDepth       — Top surface depth ratio
 * @property {number} height         — Cap height in key-units
 * @property {number} cornerRadius   — Bevel radius
 * @property {DishType} dishType
 * @property {number} dishDepth      — Scoop depth (0 = flat)
 *
 * @typedef {Object} MeshReference
 * @property {"glb"|"obj"|"stl"} format
 * @property {string} url
 * @property {number} [scale]                   — Default 1.0
 * @property {[number,number,number]} [rotationOffset]
 * @property {[number,number,number]} [originOffset]
 */

export const KEYCAP_SCHEMA_VERSION = "eletypes-cap/1";

// ─── Built-in profile family IDs ───
export const PROFILE_IDS = ["cherry", "oem", "sa", "dsa", "xda", "mt3", "low-profile"];
