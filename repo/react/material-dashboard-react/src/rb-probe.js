/**
 * RepairBench instrumentation probe for material-dashboard-react.
 * Installs the window.__MDR__ bridge (live reads only - every getter fetches
 * fresh state on call, nothing is snapshotted, and DSL checkpoints must
 * re-read window.__MDR__ on every access). The context provider re-assigns
 * window.__MDR_CTX__/__MDR_DISPATCH__ on every render; chart components
 * register their chart.js instances, and the charts() getter returns only
 * instances whose canvas is still mounted.
 */
(function () {
  "use strict";

  var charts = [];

  window.__MDR__ = {
    ready: true,
    route: function () {
      return window.location.pathname;
    },
    controller: function () {
      return window.__MDR_CTX__ || null;
    },
    dispatch: function (action) {
      if (!window.__MDR_DISPATCH__) return false;
      window.__MDR_DISPATCH__(action);
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
