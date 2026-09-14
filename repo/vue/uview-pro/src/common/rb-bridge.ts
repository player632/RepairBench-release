// RB INSTRUMENTATION (repair-bench) - read-only observation bridge.
// Published ONCE per area, fail-close on every getter, writes NO application state and registers NO
// listener. window.__rb is installed non-writable and non-configurable so a repair cannot repoint it,
// and each area is sealed the first time it is published so a second publisher is a no-op (returns
// false) rather than a silent overwrite. Every getter swallows its own error and yields null, so a
// checkpoint degrades to a false observation instead of throwing (dsl_runner aborts a checkpoint on the
// first thrown assertion, which would surface as a weak `setup_failure` red).
const RB_KEY = '__rb';
const published: Record<string, boolean> = {};

export function rbPublish(area: string, getters: Record<string, () => unknown>): boolean {
    try {
        if (typeof window === 'undefined') return false;
        const w = window as any;
        if (!w[RB_KEY] || typeof w[RB_KEY] !== 'object') {
            Object.defineProperty(w, RB_KEY, {
                value: {},
                writable: false,
                configurable: false,
                enumerable: true
            });
        }
        if (published[area]) return false;
        published[area] = true;
        const facade: Record<string, unknown> = {};
        for (const k of Object.keys(getters)) {
            const fn = getters[k];
            Object.defineProperty(facade, k, {
                enumerable: true,
                configurable: false,
                get() {
                    try {
                        const v = fn();
                        return v === undefined ? null : v;
                    } catch (e) {
                        return null;
                    }
                }
            });
        }
        Object.defineProperty(w[RB_KEY], area, {
            value: facade,
            writable: false,
            configurable: false,
            enumerable: true
        });
        return true;
    } catch (e) {
        return false;
    }
}

// Read-only storage peek. uni.getStorageSync returns '' for a missing key on H5, which is normalised to
// null so a checkpoint can distinguish 'absent' from 'present but empty'.
export function rbStorage(key: string): unknown {
    try {
        if (typeof uni === 'undefined') return null;
        const v = (uni as any).getStorageSync(key);
        return v === '' || v === undefined ? null : v;
    } catch (e) {
        return null;
    }
}

// Deep-freeze-free JSON-safe snapshot helper: getters must hand back plain data, not live refs, so a
// checkpoint can never be satisfied by a reactive proxy that changes under it.
export function rbPlain(v: unknown): unknown {
    try {
        return v === undefined ? null : JSON.parse(JSON.stringify(v));
    } catch (e) {
        return null;
    }
}
