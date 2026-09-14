import { Buffer } from "buffer";
import FloatingVue, { vTooltip } from "floating-vue";
import * as Vue from "vue";
import { createStore } from "vuex";
import { createI18n } from "vue-i18n";
import BitMappery from "./bitmappery.vue";
import store from "./store";
// RepairBench instrumentation bridge (environment/instrumentation.patch)
import { installProbe } from "./probe";

FloatingVue.options.themes.tooltip.delay.show = 500;
import "floating-vue/dist/style.css"; // required for tooltips

// required for psd.js
globalThis.Buffer = Buffer;

// Create VueI18n instance
const i18n = createI18n({
    legacy: false,
});

const app = Vue.createApp( BitMappery );
const vuexStore = createStore( store );
app.use( vuexStore );
app.use( i18n );
app.directive( "tooltip", vTooltip );
app.mount( "#app" );

// RepairBench instrumentation: publish the live store and install the probe bridge
// (window.__BMPQ__ pure-read scalar snapshot / window.__BMPX__ setup-only command
// surface / window.__BMPF__ frozen setup measurements). Not part of the product.
installProbe( vuexStore, app );
