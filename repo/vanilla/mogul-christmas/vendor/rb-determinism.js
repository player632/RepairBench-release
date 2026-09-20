// rb-determinism.js - added by environment/adaptation.patch (RepairBench graded face).
// Pins the wall clock to a FIXED non-holiday instant so the two date-gated banners in this seed
// (scripts/christmasday.js:4 -> Dec 25, scripts/newyears.js:4 -> Jan 1) take the same branch on every
// run date instead of flipping if the package happens to be scored on a holiday. Installed as the first
// script in <head>, before scripts/christmasday.js and scripts/newyears.js can read the clock.
// new Date(value), new Date(y,m,d,...), Date.parse and Date.UTC are passed through untouched - only the
// no-argument "now" and Date.now() are frozen. Math.random is deliberately NOT pinned: both of this seed's
// random sites (index.js:258, you-may-like/random-song.js:45) have no DOM footprint.
(function () {
  var FIXED_NOW = 1718452800000; // 2024-06-15T12:00:00.000Z
  var RealDate = Date;
  function PatchedDate() {
    if (!(this instanceof PatchedDate)) return new RealDate(FIXED_NOW).toString();
    if (arguments.length === 0) return new RealDate(FIXED_NOW);
    var args = [null].concat(Array.prototype.slice.call(arguments));
    return new (Function.prototype.bind.apply(RealDate, args))();
  }
  PatchedDate.prototype = RealDate.prototype;
  PatchedDate.now = function () { return FIXED_NOW; };
  PatchedDate.parse = RealDate.parse.bind(RealDate);
  PatchedDate.UTC = RealDate.UTC.bind(RealDate);
  try { PatchedDate.prototype.constructor = PatchedDate; } catch (e) {}
  if (typeof window !== "undefined") window.Date = PatchedDate;
  if (typeof globalThis !== "undefined") globalThis.Date = PatchedDate;
})();
