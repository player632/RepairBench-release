/**
 * Shell Schema Types — "eletypes-shell/1"
 *
 * Defines keyboard case/shell geometry and identity.
 * Separate from layout — same layout can pair with different shells.
 *
 * @typedef {Object} ShellPreset
 * @property {"eletypes-shell/1"} schema
 * @property {string} id
 * @property {{name:string, author?:string, description?:string}} meta
 * @property {CaseSpec} case
 * @property {PlateSpec} plate
 * @property {ShellModule[]} [modules]
 *
 * @typedef {Object} CaseSpec
 * @property {number} paddingTop
 * @property {number} paddingBottom
 * @property {number} paddingLeft
 * @property {number} paddingRight
 * @property {number} cornerRadius
 * @property {number} height
 * @property {number} [tilt]
 *
 * @typedef {Object} PlateSpec
 * @property {number} inset
 * @property {number} height
 * @property {string} color
 *
 * @typedef {Object} ShellModule
 * @property {string} type        — "knob"|"led-bar"|"badge"
 * @property {string} position    — "top-right"|"bottom-center" etc.
 */

export const SHELL_SCHEMA_VERSION = "eletypes-shell/1";
