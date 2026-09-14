/* @refresh reload */
import { Router } from "@solidjs/router";
import { createReaction, createSignal, onMount } from 'solid-js';
import { render } from 'solid-js/web';
import { initGlobalConfig } from "krestianstvo";

import './index.css';
import Root from './Web/Root';
import 'virtual:uno.css'

import configFile from './config.json?raw'

// repair-bench adaptation (environment/adaptation.patch).
// The seed's own reflector address comes from src/playground/config.json ("ws://localhost:3001") and every
// <Selo> opens a REAL WebSocket to it from inside the krestianstvo library, so a plain browser face shows a
// dead app: nothing in this seed executes an action locally. VirtualTime only advances on a chronic message
// with no action, and an action only runs when it comes back as a reflector message, so without a reflector
// there is no tick, no count and no interaction at all. This installs a same-origin, in-page LOOPBACK
// reflector (src/playground/rbReflector.js) that replaces globalThis.WebSocket before the library can reach
// for it. It never opens a real socket, so the runtime face has zero network egress (ruling G3: a
// runtime-fetched external resource is neutralised). The application's own code path is preserved verbatim:
// ReflectorClient still constructs a WebSocket, still sends and still receives JSON messages - the only
// change is who answers. Installed BEFORE initGlobalConfig so the replacement is in place before any module
// of the library runs.
import { installLoopbackReflector } from './rbReflector'
installLoopbackReflector()

const [config, setConfig] = initGlobalConfig(JSON.parse(configFile))
/// DEV Mode ///
import 'solid-devtools'
import { attachDevtoolsOverlay } from '@solid-devtools/overlay'

if (config.devMode)
    attachDevtoolsOverlay({
        defaultOpen: false, // or alwaysOpen
        noPadding: true,
    })
///



// repair-bench instrumentation (environment/instrumentation.patch).
// Publishes window.__KP__, the read-only measurement bridge, and installs the error / unhandledrejection /
// console.error traps. Deliberately placed AFTER the adaptation's installLoopbackReflector() and immediately
// BEFORE render(): every boot side effect this seed has - <Selo> -> initRootSelo -> ReflectorClient.connect,
// the three session-bootstrap reflector messages, preInitialize -> initialized -> the ticking step effect -
// happens during or after render(), so the traps are listening before any of it. Keeping the two hooks in
// different parts of this file also keeps environment/adaptation.patch and environment/instrumentation.patch
// as two non-overlapping hunks, so the forward chain applies cleanly in either reading order.
import { installRbProbe } from './rbProbe'
installRbProbe()

render(() => (
    <Router>
        <Root config={config} setConfig={setConfig} />
    </Router>
), document.getElementById('root'));
