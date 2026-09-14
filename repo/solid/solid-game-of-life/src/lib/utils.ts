import clsx, { ClassValue } from "clsx";
import { range } from "rambda";
import { twMerge } from "tailwind-merge";

import type { Grid } from "./types";

/**
 * Tailwind CSS classnames combiner
 * @param inputs
 * @returns Tailwind CSS classnames
 *
 * @example
 * ```ts
 * import { cn } from "@axelarjs/ui";
 *
 * const className = cn("text-red-500", "bg-blue-500");
 * // className = "text-red-500 bg-blue-500"
 * ```
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const createGrid = (size: number): Grid =>
  range(0, size)
    .map(() => ({ state: () => false, toggle: () => {} }))
    .map((_x, _i, row) => row.slice());

/**
 * ADAPTATION (repair-bench, environment/adaptation.patch) - deterministic entropy source.
 *
 * The seed drew its boot grid and every "Randomize" press from the platform's nondeterministic
 * entropy source, so no reading of the randomised grid was reproducible. mulberry32 replaces
 * ONLY that entropy source: the >= 0.8 threshold, the ~20% density, the lazy per-cell closure,
 * the grid shape and both call sites are untouched, so the sequence of grids is byte-identical
 * across runs, machines and browser contexts (each checkpoint starts a fresh context, hence a
 * fresh stream).
 *
 * The stream is consumed only when a randomised cell's state() is read, which happens exactly
 * once per cell inside App.tsx's withToggles (1600 draws at boot, 1600 per Randomize press).
 * Reset / step / previous / pause wrap already-materialised cells and draw nothing, so they
 * never shift the stream.
 */
let randomStreamState = 0x9e3779b9;

const nextDeterministicRandom = () => {
  randomStreamState = (randomStreamState + 0x6d2b79f5) | 0;

  let t = Math.imul(randomStreamState ^ (randomStreamState >>> 15), 1 | randomStreamState);

  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const createRandomGrid = (size: number): Grid =>
  createGrid(size).map((row) =>
    row.map(() => ({
      state: () => nextDeterministicRandom() >= 0.2,
      toggle: () => {},
    })),
  );

export const truncate = <T>(length: number, xs: T[]) => {
  return xs.length > length ? xs.slice(0, length) : xs;
};
