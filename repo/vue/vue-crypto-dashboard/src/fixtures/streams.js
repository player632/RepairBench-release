// Deterministic offline ticker streams (adaptation: replaces wss://stream.binance.com).
// Each stream = array of Binance 24hrTicker payloads, replayed at a 500ms tick by
// services/ws.js; a fresh subscription receives the first message immediately.
// When a sequence is exhausted the last message repeats (plateau).
//
// Fixture contract (defects.md):
// - BTCUSDT: 25 rising ticks 60000.50 -> 60012.50 step 0.50, then plateau 60012.50
// - ETHUSDT: alternating +-0.5% around 3000 (even ticks carry the negative percent)
// - XRPUSDT: constant 0.7500 (direction-assert reference, no phase rotation)
// - remaining defaults + ADABNB: constant streams; unknown names -> generic constant

const EVENT_TIME = 1750000000000;

function msg(symbol, price, extra) {
  const base = {
    e: '24hrTicker',
    E: EVENT_TIME,
    s: symbol.toUpperCase(),
    c: String(price),
    P: '0.00',
    p: '0.0000',
    h: String(price),
    l: String(price),
    o: String(price),
    q: '1000.00'
  };
  return Object.assign(base, extra || {});
}

function constant(symbol, price, extra) {
  return [msg(symbol, price, extra)];
}

const btcusdt = [];
for (let i = 0; i < 25; i += 1) {
  const price = (60000.5 + i * 0.5).toFixed(2);
  btcusdt.push(msg('BTCUSDT', price, {
    P: '2.50',
    p: '1500.50',
    h: '60500.00',
    l: '58000.00',
    o: '58500.00',
    q: '12345.67'
  }));
}

const ethusdt = [];
for (let i = 1; i <= 200; i += 1) {
  const negative = i % 2 === 0;
  ethusdt.push(msg('ETHUSDT', negative ? '2985.00' : '3015.00', {
    P: negative ? '-0.50' : '0.50',
    p: negative ? '-15.00' : '15.00',
    h: '3015.00',
    l: '2985.00',
    o: '3000.00',
    q: '5000.00'
  }));
}

const streams = {
  'btcusdt@ticker': btcusdt,
  'ethusdt@ticker': ethusdt,
  'xrpusdt@ticker': constant('XRPUSDT', '0.7500', { h: '0.7500', l: '0.7500', o: '0.7500', q: '123456.78' }),
  'dogebtc@ticker': constant('DOGEBTC', '0.0000125', { q: '888888.00' }),
  'ethbtc@ticker': constant('ETHBTC', '0.0500', { q: '7777.00' }),
  'wrxbtc@ticker': constant('WRXBTC', '0.0000300', { q: '66666.00' }),
  'tfuelbtc@ticker': constant('TFUELBTC', '0.0000090', { q: '55555.00' }),
  'dotbnb@ticker': constant('DOTBNB', '0.0120', { q: '4444.00' }),
  'atabnb@ticker': constant('ATABNB', '0.00080', { q: '3333.00' }),
  'maticbnb@ticker': constant('MATICBNB', '0.00150', { q: '2222.00' }),
  'btcgbp@ticker': constant('BTCGBP', '47000.00', { q: '111.00' }),
  'shibeur@ticker': constant('SHIBEUR', '0.0000200', { q: '99999.00' }),
  'adabnb@ticker': constant('ADABNB', '0.00450', { q: '1212.00' })
};

const generic = constant('UNKNOWN', '1.0000');

export function getStream(streamName) {
  return streams[streamName] || generic;
}

export const TICK_PERIOD_MS = 500;
