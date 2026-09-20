import { writable, derived } from "svelte/store";
import { EMPTY } from "../game";

export const paused = writable(false);
export const moves = writable(0);
export const time = writable(0);
export const puzzle = writable([]);
export const isSolved = writable(false);
export const isFirstGame = writable(false);

export const emptyCellIndex = derived(puzzle, ($puzzle) =>
  $puzzle.indexOf(EMPTY)
);

export const minutesString = derived(time, ($time) => {
  const minutes = Math.round($time / 60);
  return String(minutes);
});

export const secondsString = derived(time, ($time) => {
  const seconds = $time % 60;
  return String(seconds);
});
