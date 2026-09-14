/**
 * Built-in shell presets — formalized as eletypes-shell/1 documents.
 */

import { SHELL_SCHEMA_VERSION } from "./types/shell";

/** Standard — balanced bezels, rounded corners, fits any layout */
export const DEFAULT_SHELL = {
  schema: SHELL_SCHEMA_VERSION,
  id: "standard",
  meta: { name: "Standard" },
  case: {
    paddingTop: 0.4,
    paddingBottom: 0.4,
    paddingLeft: 0.4,
    paddingRight: 0.4,
    cornerRadius: 0.08,
    height: 0.25,
    tilt: 0,
  },
  plate: {
    inset: 0.3,
    height: 0.02,
    color: "#0a0a0c",
  },
};

/** Slim — minimal bezels, tight fit */
export const SLIM_SHELL = {
  schema: SHELL_SCHEMA_VERSION,
  id: "slim",
  meta: { name: "Slim" },
  case: {
    paddingTop: 0.2,
    paddingBottom: 0.2,
    paddingLeft: 0.2,
    paddingRight: 0.2,
    cornerRadius: 0.04,
    height: 0.2,
    tilt: 0,
  },
  plate: {
    inset: 0.15,
    height: 0.02,
    color: "#0a0a0c",
  },
};

/** Wide Bezel — generous bezels, premium feel */
export const WIDE_BEZEL_SHELL = {
  schema: SHELL_SCHEMA_VERSION,
  id: "wide-bezel",
  meta: { name: "Wide Bezel" },
  case: {
    paddingTop: 0.8,
    paddingBottom: 0.6,
    paddingLeft: 0.6,
    paddingRight: 0.6,
    cornerRadius: 0.12,
    height: 0.3,
    tilt: 0,
  },
  plate: {
    inset: 0.4,
    height: 0.02,
    color: "#0a0a0c",
  },
};

/** Angular — sharp corners, industrial look */
export const ANGULAR_SHELL = {
  schema: SHELL_SCHEMA_VERSION,
  id: "angular",
  meta: { name: "Angular" },
  case: {
    paddingTop: 0.5,
    paddingBottom: 0.4,
    paddingLeft: 0.45,
    paddingRight: 0.45,
    cornerRadius: 0.02,
    height: 0.3,
    tilt: 0,
  },
  plate: {
    inset: 0.3,
    height: 0.02,
    color: "#0a0a0c",
  },
};

/** Top-heavy — extra top bezel for branding/display area */
export const TOP_HEAVY_SHELL = {
  schema: SHELL_SCHEMA_VERSION,
  id: "top-heavy",
  meta: { name: "Top Heavy" },
  case: {
    paddingTop: 1.5,
    paddingBottom: 0.4,
    paddingLeft: 0.45,
    paddingRight: 0.45,
    cornerRadius: 0.06,
    height: 0.3,
    tilt: 0,
  },
  plate: {
    inset: 0.35,
    height: 0.02,
    color: "#0a0a0c",
  },
};
