// rb-inert-analytics.js - inert stand-in for the third-party analytics script the seed loads from
// https://reasonable.pabue.workers.dev/js/script.js in src/routes/__layout.svelte (emitted when !dev,
// i.e. exactly in the built face). environment/adaptation.patch repoints that <script src> here.
// This file deliberately does NOTHING: no request, no global, no listener, no storage write, no DOM
// node. It exists so the element, its defer attribute and its data-domain attribute all stay in the
// document - only the transport is neutralised. Nothing in this face scores analytics.
