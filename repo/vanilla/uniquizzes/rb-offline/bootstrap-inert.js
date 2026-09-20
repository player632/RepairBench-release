// rb-offline/bootstrap-inert.js - offline stand-in installed by environment/adaptation.patch.
// The document used to load a remote component-library script from here. The page's own grading function ends by
// constructing one modal object out of that library's single global namespace and calling show() on it, so with no
// network the constructor lookup would throw and the grade would never be written to the page. This file is the
// inert local replacement: it defines the same global namespace with a constructor whose methods do nothing.
// It is HARNESS, not application code, it is not on the tested surface, and it deliberately carries no behaviour:
// the page writes its results into the document BEFORE it constructs the modal, so a no-op modal is enough.
window.bootstrap = window.bootstrap || {};
window.bootstrap.Modal = function Modal() { };
window.bootstrap.Modal.prototype.show = function show() { };
window.bootstrap.Modal.prototype.hide = function hide() { };
window.bootstrap.Modal.prototype.dispose = function dispose() { };
