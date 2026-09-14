// Deterministic offline klines (adaptation: replaces data-api.binance.vision REST).
// Row shape = Binance klines: [openTime, open, high, low, close, volume, closeTime].
// Point counts are per (symbol, interval); first closes differ across symbols so the
// stale-chart probe can tell cached datasets apart.

const LENGTHS = {
  BTCUSDT: { '1d': 60, '1h': 30, '1w': 12, '1M': 24 },
  ETHUSDT: { '1d': 45 }
};
const BASE = { BTCUSDT: 60000, ETHUSDT: 3000 };
const DEFAULT_LENGTH = 15;
const DEFAULT_BASE = 100;
const STEP_MS = { '1h': 3600000, '1d': 86400000, '1w': 604800000, '1M': 2592000000 };
const OPEN_TIME_BASE = 1740000000000;

function rows(symbol, interval) {
  const sym = String(symbol || '').toUpperCase();
  const len = (LENGTHS[sym] && LENGTHS[sym][interval]) || DEFAULT_LENGTH;
  const base = BASE[sym] || DEFAULT_BASE;
  const step = base / 100;
  const stepMs = STEP_MS[interval] || 86400000;
  const out = [];
  for (let i = 0; i < len; i += 1) {
    const open = base + i * step;
    const close = open + step;
    const high = close + step / 2;
    const low = open - step / 2;
    const volume = 1000 + i * 7;
    out.push([
      OPEN_TIME_BASE + i * stepMs,
      String(open),
      String(high),
      String(low),
      String(close),
      String(volume),
      OPEN_TIME_BASE + (i + 1) * stepMs - 1
    ]);
  }
  return out;
}

export function fetchKlines(symbol, interval) {
  return Promise.resolve(rows(symbol, interval));
}
