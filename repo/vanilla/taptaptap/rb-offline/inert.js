// rb-offline/inert.js - offline stand-in installed by environment/adaptation.patch.
// The document used to load a third-party analytics tag manager from a remote host here. The task
// runs with no network at all, so this file is the inert local replacement: it defines the same
// two globals the document's own inline snippet expects (window.dataLayer and window.gtag) and
// does nothing with them. It is HARNESS, not application code, and it is not on the tested surface.
window.dataLayer = window.dataLayer || [];
window.gtag = function gtag() { window.dataLayer.push(arguments); };
