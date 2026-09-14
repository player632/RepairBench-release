/*
ADAPTATION (repair-bench, environment/adaptation.patch) - same-origin deterministic
loopback reflector, plus the one pinned entropy source this seed needs.

WHY THIS FILE EXISTS. Every world in this playground is mounted through krestianstvo's
<Selo>, and <Selo> -> initRootSelo -> ReflectorClient.connect -> createWS(url) opens a
WebSocket to a reflector server (config.json's defaultReflectorHost, ws://localhost:3001,
overridable per URL with ?r=). Nothing the user can do reaches the model without that
socket: sendExtMsg only writes storeVT.extMsg, VirtualTime's sendExtMsg turns that into
data.send, and data.send does exactly one thing - data.socket.send(JSON). The action is
never invoked locally; it comes back from the reflector as a message with origin
"reflector", is queued by data.insert, is released by the next chronic tick, and only then
does data.receive -> storeVT.reflectorMsg -> createLocalStore's init effect ->
callActionNode run it. Virtual time itself is also reflector-driven: data.time only
advances on a chronic (action-less) message, so with no socket there is no tick, no
storeNode.tick, no "ticking" stepping and no preInitialize (stateSynced is set by
dispatchApp on a reflector createNode whose parameters[1] === "application").

So an offline verifier would see a page that renders its first frame and then never
responds to anything. This module replaces ONLY the transport with an in-page loopback -
same origin by construction, because no socket is ever opened and no byte leaves the
document. Every line of the seed's own protocol path stays in place and still runs:
connect() still builds the same URL, createWS() still calls `new WebSocket(url)`, makeWS
still wraps send() and still queues pre-open writes, createWSState still tracks
readyState through the same open/close listeners, createEventSignal still turns "message"
events into a signal, ReflectorClient.message() still JSON.parses event.data and still
stamps origin:"reflector", and VirtualTime still queues, ticks, dispatches and receives.
The loopback answers with the three session-bootstrap messages the seed's own dispatchApp
keys on, then with one chronic tick per interval, and it echoes every client message back
as a reflector message - which is what a single-client reflector session does.

DETERMINISM. Two knobs, both declared here and nowhere else:
  TICK_MS   real milliseconds between virtual-time ticks (the client's own cadence choice)
  TICK_STEP virtual-time units per tick, so storeNode.tick is 0,1,2,3,... and Info.jsx's
            "Virtual Time" reading is an integer, not a wall-clock fraction.
Bootstrap messages carry virtual times 0, 1 and 2 and are handed over one per tick, and
echoed client messages are likewise handed over one per tick, so that no dispatch loop
ever writes storeVT.reflectorMsg twice (a second write in the same loop could be coalesced
before the observing effect flushes, which would silently drop a user action).

ENTROPY. The seed reads the platform PRNG in exactly two places that reach the DOM:
krestianstvo's shortRandomIDInView() (Math.random().toString(36).substr(2,9), the id and
display name of every node created by demo4's "New Counter") and this playground's own
Objects/Utils.js clientRandomColor(). Both are pinned here by replacing Math.random with a
seeded mulberry32 stream, so those readings are byte-identical across runs, machines and
browser contexts (each checkpoint starts a fresh context, hence a fresh stream). Nothing
else is touched: no threshold, no increment, no call site, no argument order.
The per-selo Alea PRNG is NOT pinned and cannot be from this side of the library boundary -
initSelo seeds it with `+new Date` inside krestianstvo's own module. No asserted reading in
this task derives from it; the two places it reaches (Simple.jsx's background colour and
CodeMirror.jsx's remote-cursor colour) are asserted structurally, never by value.
*/

const TICK_MS = 120;
const TICK_STEP = 1;
const PRNG_SEED = 0x9e3779b9;

const nativeWebSocket = globalThis.WebSocket;

let prngState = PRNG_SEED;

const nextDeterministicRandom = () => {
    prngState = (prngState + 0x6d2b79f5) | 0;

    let t = Math.imul(prngState ^ (prngState >>> 15), 1 | prngState);

    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const monikerFromUrl = (url) => {
    const m = /[?&]moniker=([^&]*)/.exec(String(url || ''));
    return m ? decodeURIComponent(m[1]) : '';
};

const stats = {
    sockets: 0,
    opens: 0,
    closes: 0,
    ticks: 0,
    bootstrap: 0,
    clientSends: 0,
    echoes: 0,
    realSockets: 0
};

const sockets = [];

class LoopbackReflectorSocket {

    constructor(url, protocols) {
        this.url = String(url || '');
        this.protocol = Array.isArray(protocols) ? (protocols[0] || '') : (protocols || '');
        this.readyState = 0;
        this.bufferedAmount = 0;
        this.extensions = '';
        this.binaryType = 'blob';
        this.onopen = null;
        this.onmessage = null;
        this.onerror = null;
        this.onclose = null;
        this._listeners = {};
        this._outbox = [];
        this._virtualTime = -1;
        this._timer = null;
        this._closed = false;
        this._moniker = monikerFromUrl(this.url);
        stats.sockets += 1;
        sockets.push(this);
        setTimeout(() => this._open(), 0);
    }

    addEventListener(type, handler) {
        if (typeof handler !== 'function') return;
        if (!this._listeners[type]) this._listeners[type] = [];
        this._listeners[type].push(handler);
    }

    removeEventListener(type, handler) {
        const list = this._listeners[type];
        if (list) this._listeners[type] = list.filter((f) => f !== handler);
    }

    dispatchEvent(ev) {
        if (ev && ev.type) this._emit(ev.type, ev);
        return true;
    }

    _emit(type, ev) {
        const handler = this['on' + type];
        if (typeof handler === 'function') handler.call(this, ev);
        const list = this._listeners[type];
        if (list) for (const fn of list.slice()) fn.call(this, ev);
    }

    _deliver(fields) {
        if (this._closed) return;
        this._emit('message', {
            type: 'message',
            data: JSON.stringify(fields),
            origin: 'loopback',
            target: this
        });
    }

    _open() {
        if (this._closed) return;
        this.readyState = 1;
        stats.opens += 1;
        // Session bootstrap: the three reflector messages the seed's own dispatchApp keys on.
        // `node` is null on all three, which is what routes them to dispatchApp instead of to
        // a node action; parameters[0] === 'proxy/clients.vwf' resets storeNode.clients,
        // parameters[1] === 'application' flips storeVT.stateSynced (which is what releases
        // preInitialize -> initialized -> the ticking step effect), and createChild pushes this
        // client's own moniker into storeNode.clients so the avatar list and Info.jsx's
        // "Clients" panel have a member.
        this._outbox.push(
            { time: 0, node: null, action: 'createNode', member: null, parameters: ['proxy/clients.vwf', 'proxy/clients.vwf', 'clients'], bootstrap: true },
            { time: 1, node: null, action: 'createNode', member: null, parameters: ['index.vwf', 'application', 'application'], bootstrap: true },
            { time: 2, node: null, action: 'createChild', member: null, parameters: ['proxy/clients.vwf', this._moniker], bootstrap: true }
        );
        this._emit('open', { type: 'open', target: this });
        this._timer = setInterval(() => this._tick(), TICK_MS);
    }

    _tick() {
        if (this._closed) return;
        this._virtualTime += TICK_STEP;
        const out = this._outbox.shift();
        if (out) {
            const bootstrap = !!out.bootstrap;
            delete out.bootstrap;
            if (bootstrap) stats.bootstrap += 1; else stats.echoes += 1;
            this._deliver({ ...out, time: Math.min(out.time, this._virtualTime) });
        }
        // The chronic tick goes over in its OWN macrotask: two message events delivered inside
        // one synchronous block would be two writes to createEventSignal's signal, and only the
        // last one is guaranteed to reach ReflectorClient.message().
        setTimeout(() => {
            if (this._closed) return;
            stats.ticks += 1;
            this._deliver({ time: this._virtualTime });
        }, 0);
    }

    send(data) {
        if (this._closed || this.readyState !== 1) return;
        let fields = null;
        try { fields = JSON.parse(String(data)); } catch (e) { return; }
        if (!fields || typeof fields !== 'object') return;
        stats.clientSends += 1;
        if (!fields.action) return;
        this._outbox.push(fields);
    }

    close(code, reason) {
        if (this._closed) return;
        this._closed = true;
        this.readyState = 2;
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
        stats.closes += 1;
        this._emit('close', {
            type: 'close',
            code: code === undefined ? 1000 : code,
            reason: reason || '',
            wasClean: true,
            target: this
        });
        this.readyState = 3;
    }

}

LoopbackReflectorSocket.CONNECTING = 0;
LoopbackReflectorSocket.OPEN = 1;
LoopbackReflectorSocket.CLOSING = 2;
LoopbackReflectorSocket.CLOSED = 3;

export function installLoopbackReflector() {
    if (globalThis.__rbLoopback && globalThis.__rbLoopback.installed) return globalThis.__rbLoopback;
    Math.random = nextDeterministicRandom;
    globalThis.WebSocket = LoopbackReflectorSocket;
    globalThis.__rbLoopback = {
        installed: true,
        transport: 'in-page-loopback',
        TICK_MS: TICK_MS,
        TICK_STEP: TICK_STEP,
        PRNG_SEED: PRNG_SEED,
        stats: stats,
        sockets: sockets,
        nativeWebSocketPresent: typeof nativeWebSocket === 'function',
        realSocketsOpened: () => stats.realSockets
    };
    return globalThis.__rbLoopback;
}

export default installLoopbackReflector;
