const randomIntFromRange = (min, max, rng) => {
  const rand = rng ? rng() : Math.random();
  const minNorm = Math.ceil(min);
  const maxNorm = Math.floor(max);
  const idx = Math.floor(rand * (maxNorm - minNorm + 1) + minNorm);
  return idx;
};

export { randomIntFromRange };
