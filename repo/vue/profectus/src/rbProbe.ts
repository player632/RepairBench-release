/**
 * rbProbe.ts - READ-ONLY instrumentation for the repair-bench face.
 *
 * It renders nothing, writes no application state, subscribes to no event bus and starts no timer.
 * It only publishes string scalars on window (non-enumerable, so they cannot leak into a
 * for..in over window or into JSON.stringify of the app's own objects) plus two functions:
 *   window.__rbKeys()  -> JSON array of the fact names
 *   window.__rbDump()  -> JSON object of every fact, read at call time
 * Every value is a STRING: numbers are stringified at read time so a checkpoint always compares
 * text, never a live reactive object, and no fact can hold a stale reference into the game state.
 */
import { main } from "data/projEntry";
import prestige from "data/layers/prestige";
import { hotkeys } from "features/hotkey";
import { layers } from "game/layers";
import player from "game/player";
import settings from "game/settings";
import state from "game/state";
import { unref } from "vue";

const asString = (value: unknown): string => {
    if (value === undefined) return "undefined";
    if (value === null) return "null";
    try {
        return String(unref(value as never));
    } catch {
        return "ERR";
    }
};

/** The fact table. Each entry is re-read on every access, so nothing is ever latched stale. */
const facts: Record<string, () => string> = {
    points: () => asString(main.points.value),
    best: () => asString(main.best.value),
    total: () => asString(main.total.value),
    oomps: () => asString(main.oomps.value),
    prestigePoints: () => asString(prestige.points.value),
    prestigeName: () => asString(prestige.points.displayName),
    tabs: () => JSON.stringify(player.tabs),
    tabCount: () => String(player.tabs.length),
    devSpeed: () => String(player.devSpeed),
    offlineProd: () => String(player.offlineProd),
    autosave: () => String(player.autosave),
    timePlayed: () => String(Math.round(player.timePlayed)),
    playerName: () => String(player.name),
    playerId: () => String(player.id),
    showTPS: () => String(settings.showTPS),
    theme: () => String(settings.theme),
    alignUnits: () => String(settings.alignUnits),
    unthrottled: () => String(settings.unthrottled),
    showHealthWarning: () => String(settings.showHealthWarning),
    saveIds: () => JSON.stringify(settings.saves),
    saveCount: () => String(settings.saves.length),
    activeSave: () => String(settings.active),
    hotkeyKeys: () => JSON.stringify(Object.keys(hotkeys).filter(k => hotkeys[k] != null)),
    layerIds: () => JSON.stringify(Object.keys(layers)),
    errorCount: () => String(state.errors.length),
    tickWindow: () => String(state.lastTenTicks.length)
};

const target = window as unknown as Record<string, unknown>;
for (const name of Object.keys(facts)) {
    const key = `__rb${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    Object.defineProperty(target, key, {
        get: facts[name],
        enumerable: false,
        configurable: true
    });
}
Object.defineProperty(target, "__rbKeys", {
    value: () => JSON.stringify(Object.keys(facts)),
    enumerable: false,
    configurable: true
});
Object.defineProperty(target, "__rbDump", {
    value: () => {
        const out: Record<string, string> = {};
        for (const name of Object.keys(facts)) {
            try {
                out[name] = facts[name]();
            } catch (e) {
                out[name] = `THREW:${e instanceof Error ? e.message : String(e)}`;
            }
        }
        return JSON.stringify(out);
    },
    enumerable: false,
    configurable: true
});
