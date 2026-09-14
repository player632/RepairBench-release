import { FIXTURES } from "./fixtures";

const STORAGE_KEY = "wlb-db-v1";

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function hydrate() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch (e) {
        // corrupted storage falls back to fixtures
    }
    return clone(FIXTURES);
}

class Store {
    constructor() {
        this.db = hydrate();
        // Boot-time write-back: the DB key must exist from a fresh guest boot
        // onward (state-isolation checkpoints assert the exact key set).
        this.persist();
    }

    persist() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    }
}

export const store = new Store();
