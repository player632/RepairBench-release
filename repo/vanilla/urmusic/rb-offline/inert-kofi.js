/* Offline stand-in shipped by the task harness (rb-offline/inert-kofi.js).
 * Replaces the remote Ko-fi donation-widget script that the upstream entry document used to load
 * (its retired URL is recorded in the harness build sidecar, not here, so the served face keeps
 * zero external host literals). index.html calls
 * kofiwidget2.init(...)/kofiwidget2.draw() from an inline script, so the global must exist or that
 * inline block throws a ReferenceError. Both members are inert: the donation button simply is not
 * drawn. Nothing else in the tree reads kofiwidget2.
 */
;(function () {
  "use strict";
  var noop = function () {};
  window.kofiwidget2 = { init: noop, draw: noop };
}());
