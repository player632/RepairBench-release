/**
 * Normalized Render Model — output of the normalization pipeline.
 *
 * This is what 2D and 3D renderers actually consume.
 * Produced by merging layout + keycap + visual. Never persisted.
 *
 * @typedef {Object} NormalizedKeyboard
 * @property {import('./layout').BoardSpec} board
 * @property {NormalizedKey[]} keys
 *
 * @typedef {Object} NormalizedKey
 * @property {string} id
 * @property {string} keyName
 * @property {string} label
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 * @property {number} r
 * @property {import('./layout').KeyKind} kind
 * @property {string} [cluster]
 * @property {ResolvedCap} cap
 * @property {string} color          — Resolved key color
 * @property {string} legendColor    — Resolved legend color
 * @property {import('./visual').MaterialSpec} [material]
 *
 * @typedef {Object} ResolvedCap
 * @property {"procedural"|"mesh"} type
 * @property {string} profileFamily       — Which profile produced this
 * @property {import('./keycap').CapGeometry} [geometry]  — Procedural
 * @property {import('./keycap').RowSculpt} [sculpt]     — Row-specific sculpting
 * @property {import('./keycap').MeshReference} [mesh]   — Mesh-backed
 */

// Marker — this file defines types only (JSDoc), no runtime exports needed.
export {};
