// RepairBench instrumentation probe (environment/instrumentation.patch).
//
// This file is ADDED by the harness; it is not part of the application and it
// contains no expectation, no timer, no counter and no random value. It exists
// because the game renders into a single <canvas>-backed ROT.Display and its own
// DOM is one empty <div id="game"> (index.html:11), so a checker needs one
// declared place to ask "did the boot finish?" without touching application
// logic.
//
// Contract, deliberately narrow:
//   * window.__RB__() is RECOMPUTED ON EVERY CALL and strictly READ-ONLY: it
//     reads the seed's own singletons (window.Main, Main.entities, Main._log,
//     window.localStorage) and never writes to any of them.
//   * every field is safe-wrapped, so a half-booted or broken state is reported
//     as the sentinel string "__rb_probe_error__" for that field instead of
//     throwing. A dead probe therefore surfaces as a FAILED ASSERTION (behaviour
//     evidence) and never as a page crash or a runner setup_failure.
//   * it hangs off NOTHING the twelve injected defects touch: this is a new file
//     plus one <script> tag, so it stays valid before and after any repair.
//
// The authoritative measurement surface remains the application's own public
// singleton `window.Main` (scripts/main.js:7, a classic script, so it is a real
// global): every fail-to-pass checkpoint reads Main.* directly.
(function () {
    'use strict';

    var ERR = '__rb_probe_error__';

    // Read one value out of the live game state; never let a probe crash the page.
    function safe(fn) {
        try {
            var v = fn();
            return v === undefined ? null : v;
        } catch (e) {
            return ERR;
        }
    }

    function ent(name) {
        return window.Main && window.Main.getEntity ? window.Main.getEntity(name) : null;
    }

    window.__RB_VERSION__ = '1';

    window.__RB__ = function () {
        var pc = safe(function () { return ent('pc'); });
        var dungeon = safe(function () { return ent('dungeon'); });
        var screen = safe(function () { return window.Main.screens.getCurrentName(); });

        return {
            version: window.__RB_VERSION__,

            // Boot completed: the in-game screen was entered and it produced both
            // a player character and a dungeon. This is what the readiness poll in
            // tests/dsl.json waits for.
            ready: !!(pc && pc !== ERR && dungeon && dungeon !== ERR
                && screen === 'main'),

            appVersion: safe(function () { return window.Main.getVersion(); }),
            screen: screen,
            mode: safe(function () { return window.Main.screens.getCurrentMode(); }),

            // Web Storage residue: the keys left behind after a boot, so a
            // checkpoint can prove no state leaked in from an earlier run.
            storageKeys: safe(function () {
                return Object.keys(window.localStorage).slice().sort().join(',');
            }),

            // The generation log the seed itself keeps (scripts/main.js:37-44).
            logSeedPrinted: safe(function () { return window.Main._log.seedPrinted; }),
            logFloor: safe(function () { return window.Main._log.floor; }),
            logCycle: safe(function () { return window.Main._log.cycle; }),

            // Cheap shape census, so a checkpoint can tell "booted" from "booted
            // into an empty dungeon" without reading a canvas pixel.
            pcX: safe(function () { return pc.Position.getX(); }),
            pcY: safe(function () { return pc.Position.getY(); }),
            entityCount: safe(function () { return window.Main.entities.size; }),
            npcCount: safe(function () { return ent('npc') ? ent('npc').size : null; }),
            dungeonWidth: safe(function () { return dungeon.Dungeon.getWidth(); }),
            dungeonHeight: safe(function () { return dungeon.Dungeon.getHeight(); })
        };
    };
})();
