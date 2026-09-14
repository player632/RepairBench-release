/**
 * Case Profile Schema — "eletypes-caseProfile/1"
 *
 * Defines the case cross-section profile (2D points) and mount settings
 * (offset, fit, scale, extrusion width) as a reusable asset.
 *
 * Named "caseProfile" (not "profile") to avoid collision with keycap profile.
 *
 * @typedef {Object} CaseProfileAsset
 * @property {"eletypes-caseProfile/1"} schema
 * @property {string} id
 * @property {{name:string, author?:string}} meta
 * @property {CaseProfile} caseProfile
 * @property {MountSettings} mount
 *
 * @typedef {Object} CaseProfile
 * @property {Array<{x:number, y:number, d?:number}>} points — Cross-section polygon
 * @property {number[]} mountEdge — [fromIndex, toIndex] edge where keys mount
 * @property {ColoredEdge[]} [coloredEdges] — Accent-colored edges on the case
 *
 * @typedef {Object} ColoredEdge
 * @property {number} from       — Start point index
 * @property {number} to         — End point index
 * @property {string} color      — Hex color for this edge strip
 * @property {number} [emissive] — Emissive intensity 0-1 (default 0.5, LED-strip glow)
 *
 * @typedef {Object} MountSettings
 * @property {{x:number, y:number, z:number}} [offset] — Keycap group position offset
 * @property {number} [fit]          — 0-1.5, proportion of mount edge keys occupy
 * @property {number} [caseScale]    — Overall case size multiplier
 * @property {number} [extrudeWidth] — Case width multiplier (symmetric)
 */

export const CASE_PROFILE_SCHEMA_VERSION = "eletypes-caseProfile/1";
