/**
 * RepairBench instrumentation probe for black-dashboard-react.
 * Installs the window.__BD__ bridge (live reads only - every getter fetches
 * fresh state on call, nothing is snapshotted, and DSL checkpoints must
 * re-read window.__BD__ on every access). The ThemeContextWrapper and
 * BackgroundColorContextWrapper components re-assign window.__BD_THEME_CTX__
 * and window.__BD_BG_CTX__ on every render; Dashboard chart components
 * register their chart.js instances, and the charts() getter returns only
 * instances whose canvas is still mounted.
 */
(function () {
  "use strict";

  var charts = [];

  window.__BD__ = {
    ready: true,
    route: function () {
      return window.location.pathname;
    },
    bgColor: function () {
      return window.__BD_BG_CTX__ ? window.__BD_BG_CTX__.color : null;
    },
    changeBgColor: function (color) {
      if (!window.__BD_BG_CTX__) return false;
      window.__BD_BG_CTX__.changeColor(color);
      return true;
    },
    theme: function () {
      return window.__BD_THEME_CTX__ ? window.__BD_THEME_CTX__.theme : null;
    },
    changeTheme: function (theme) {
      if (!window.__BD_THEME_CTX__) return false;
      window.__BD_THEME_CTX__.changeTheme(theme);
      return true;
    },
    registerChart: function (inst) {
      if (inst && charts.indexOf(inst) === -1) charts.push(inst);
      return true;
    },
    charts: function () {
      return charts.filter(function (c) {
        return c && c.canvas && document.contains(c.canvas);
      });
    },
  };
})();
