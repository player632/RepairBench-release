// [repair-bench instrumentation] attribute-only test hooks.
// This file reads no game state and writes no game state: it only puts stable data-testid
// attributes on DOM the shipped document already produces, so the verifier can address the
// canvas and the mount point without depending on markup order. It runs at parse time and again
// on DOMContentLoaded and load, because the shipped entry document builds the canvas only once
// the document is ready; every pass is idempotent and swallows its own errors.
(function () {
  function tag() {
    try {
      var zg = window.zombiegame;
      var g = zg && zg.game;
      if (g && g.canvas && g.canvas.setAttribute) {
        g.canvas.setAttribute('data-testid', 'rb-canvas');
      }
      if (document.body && document.body.setAttribute) {
        document.body.setAttribute('data-testid', 'rb-body');
      }
      var mount = document.getElementById('game');
      if (mount && mount.setAttribute) {
        mount.setAttribute('data-testid', 'rb-mount');
      }
    } catch (e) {
      // attribute-only: never disturb the page
    }
  }
  tag();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tag);
  }
  window.addEventListener('load', tag);
})();
