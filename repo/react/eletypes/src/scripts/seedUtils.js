import seedrandom from "seedrandom";

export const createRng = (seed) => {
  return seed ? seedrandom(seed) : Math.random;
};

export const generateSeed = () => {
  return Math.random().toString(36).substring(2, 10);
};
