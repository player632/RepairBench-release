/*
 * rb-pad-driver.js - offline verification fixture: a synthetic Gamepad API.
 *
 * The harness that verifies this tree runs in a browser with no physical
 * controller attached, and `navigator.getGamepads()` there always returns four
 * nulls, so nothing in the input pipeline would ever run. This fixture replaces
 * that one read-only browser entry point with a driven one and publishes a small
 * command surface so a verification run can connect a pad, move an axis and
 * press a button.
 *
 * Two semantics of the real Gamepad API are reproduced deliberately, because the
 * application depends on both:
 *
 *   1. every call to `navigator.getGamepads()` hands back a FRESH SNAPSHOT of
 *      each pad (new object, copied axes/buttons), never the live object;
 *   2. `timestamp` only moves when the pad's state actually moved.
 *
 * The fixture therefore keeps its own live pads internally and deep-copies them
 * on the way out, advancing `timestamp` by a fixed 1000 per state change. It
 * never reads `performance.now()` or `Date.now()`, so nothing it produces
 * depends on wall-clock time and a run is reproducible frame for frame.
 *
 * This file touches `navigator` and `window` only. It does not modify, wrap or
 * observe any application file, and it holds no opinion about how the
 * application interprets the snapshots it is handed.
 */
(function () {
  'use strict';

  var ID = {
    /* Chrome's literal id string for a standard XInput pad: the vendor/product
       branch of the id parser wins, so this pad is identified as 045e028e. */
    XBOX: 'Xbox 360 Controller (XInput STANDARD GAMEPAD Vendor: 045e Product: 028e)',
    /* no vendor/product pair but an XInput token: the standard-gamepad branch. */
    XINPUT: 'RB Pad (XInput)',
    /* neither: the parser's fallback branch. */
    DINPUT: 'RB DInput Controller?',
    /* a vendor id that has its own mapping table entry (joystick class). */
    JOYSTICK: 'RB Joystick (Vendor: 0f30 Product: 0001)',
    /* a vendor id with no mapping table entry at all. */
    UNKNOWN: 'RB Mystery Pad (Vendor: 1234 Product: abcd)'
  };

  var S = {
    pads: new Map(),
    ts: 0,
    gets: 0,
    fires: { connected: 0, disconnected: 0 },
    errs: [],
    log: [],
    stage: 'boot'
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('error', function (e) {
      S.errs.push({
        stage: S.stage,
        msg: String(e.message || '').slice(0, 240),
        file: String(e.filename || '').split('/').slice(-2).join('/'),
        line: e.lineno
      });
    });
  }

  function mkPad(index, o) {
    o = o || {};
    var nAxes = typeof o.axes === 'number' ? o.axes : 4;
    var nButtons = typeof o.buttons === 'number' ? o.buttons : 17;
    var axes = new Array(nAxes).fill(0);
    if (Array.isArray(o.axes)) { axes = o.axes.slice(); }
    var buttons = [];
    for (var i = 0; i < nButtons; i++) { buttons.push({ pressed: false, touched: false, value: 0 }); }
    return {
      id: o.id !== undefined ? o.id : ID.XBOX,
      index: index,
      connected: true,
      mapping: o.mapping || 'standard',
      timestamp: S.ts,
      axes: axes,
      buttons: buttons
    };
  }

  /* fresh snapshot per call - see the header comment */
  function snap(p) {
    return {
      id: p.id,
      index: p.index,
      connected: p.connected,
      mapping: p.mapping,
      timestamp: p.timestamp,
      axes: p.axes.slice(),
      buttons: p.buttons.map(function (b) { return { pressed: b.pressed, touched: b.touched, value: b.value }; })
    };
  }

  function list() {
    S.gets++;
    var a = [null, null, null, null];
    S.pads.forEach(function (p, i) { a[i] = snap(p); });
    return a;
  }

  try {
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: function () { return list(); } });
  } catch (e) {
    S.log.push('defineProperty_failed:' + String(e.message || e).slice(0, 120));
  }

  function fire(type, pad) {
    var ev;
    try {
      ev = new GamepadEvent(type, { gamepad: pad });
    } catch (e) {
      ev = new Event(type);
      try { Object.defineProperty(ev, 'gamepad', { value: pad }); }
      catch (e2) { S.log.push('event_gamepad_failed:' + String(e2.message || e2).slice(0, 120)); }
    }
    S.fires[type === 'gamepadconnected' ? 'connected' : 'disconnected']++;
    window.dispatchEvent(ev);
  }

  function bump(p) { S.ts += 1000; p.timestamp = S.ts; }

  window.__rbPad = {
    ids: ID,
    stage: 'boot',
    setStage: function (n) { S.stage = n; this.stage = n; return n; },
    connect: function (index, o) {
      var p = mkPad(index, o);
      S.pads.set(index, p);
      bump(p);
      fire('gamepadconnected', snap(p));
      return { index: index, id: p.id, axes: p.axes.length, buttons: p.buttons.length, ts: p.timestamp };
    },
    disconnect: function (index) {
      var p = S.pads.get(index);
      if (!p) { return false; }
      p.connected = false;
      bump(p);
      fire('gamepaddisconnected', snap(p));
      S.pads.delete(index);
      return true;
    },
    press: function (index, bi, value) {
      var p = S.pads.get(index);
      if (!p || !p.buttons[bi]) { return false; }
      var v = value === undefined ? 1 : value;
      p.buttons[bi].value = v;
      p.buttons[bi].pressed = v > 0;
      p.buttons[bi].touched = v > 0;
      bump(p);
      return p.timestamp;
    },
    release: function (index, bi) { return this.press(index, bi, 0); },
    axis: function (index, ai, value) {
      var p = S.pads.get(index);
      if (!p || p.axes[ai] === undefined) { return false; }
      p.axes[ai] = value;
      bump(p);
      return p.timestamp;
    },
    /* one call = one state change carrying several inputs, like a real frame */
    frame: function (index, axesObj, buttonsObj) {
      var p = S.pads.get(index);
      if (!p) { return false; }
      Object.keys(axesObj || {}).forEach(function (k) { p.axes[Number(k)] = axesObj[k]; });
      Object.keys(buttonsObj || {}).forEach(function (k) {
        var v = buttonsObj[k];
        if (!p.buttons[Number(k)]) { return; }
        p.buttons[Number(k)].value = v;
        p.buttons[Number(k)].pressed = v > 0;
        p.buttons[Number(k)].touched = v > 0;
      });
      bump(p);
      return p.timestamp;
    },
    padCount: function () { return S.pads.size; },
    errors: function () { return S.errs.slice(); },
    errorCount: function () { return S.errs.length; },
    snapshot: function () {
      return {
        ts: S.ts,
        gets: S.gets,
        connected: Array.from(S.pads.keys()).sort().join(','),
        connectedCount: S.pads.size,
        fires: S.fires.connected + '/' + S.fires.disconnected,
        log: S.log.slice().join('|'),
        errCount: S.errs.length
      };
    }
  };
})();
