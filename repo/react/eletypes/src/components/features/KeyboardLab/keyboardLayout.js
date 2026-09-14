/**
 * DEPRECATED — backwards compatibility shim.
 * Import from presets/index.js or schema/derive.js instead.
 */

import generic75 from "./presets/generic75";
import { computeBounds, buildKeyIndex, buildCodeMap, isAccentKey, extractKeys } from "./schema/derive";

const keys = extractKeys(generic75);
export const KEYBOARD_LAYOUT = keys;
export const LAYOUT_BOUNDS = computeBounds(keys);
export const KEY_INDEX_MAP = buildKeyIndex(keys);
export const CODE_TO_NAME = buildCodeMap(keys);
export { isAccentKey };
