/* Offline stand-in shipped by the task harness (rb-offline/inert-sc.js).
 * Replaces the remote SoundCloud streaming-SDK script that the upstream entry document used to
 * load, so the tree runs with no network at all. The retired URL is deliberately NOT quoted here:
 * tests/run.sh greps the whole served face for external host literals and fails closed on any hit,
 * so the exact value lives in the harness build sidecar instead
 *
 * index.js's load handler calls initApps() -> initSoundCloud(), which
 * dereferences SC unconditionally; without a stand-in that throws and aborts boot before
 * loadPreset()/loop(). This stub satisfies exactly the two members the tree touches
 * (SC.initialize, SC.resolve) and resolves nothing: streaming a track is out of scope offline.
 */
;(function () {
  "use strict";
  var noop = function () {};
  window.SC = {
    initialize: noop,
    resolve: function () { return { then: noop }; }
  };
}());
