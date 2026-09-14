(() => {
    let waveTable = new Int8Array(new ArrayBuffer(0));
    let drums = [];

    class Song {
        /**
         * @param {ArrayBuffer} data 
         */
        constructor(data) {
            const view = new DataView(data);
            let p = 0;

            // Org-
            const org1 = view.getUint32(p, true); p += 4;
            if (org1 != 0x2d67724f) {
                throw "Invalid magic.";
            }

            const orgVersion = view.getUint16(p, true); p += 2;
            if (orgVersion != 0x3230) {
                throw "Invalid version.";
            }

            this.wait = view.getUint16(p, true); p += 2;
            this.meas = [view.getUint8(p + 1, true), view.getUint8(p, true)]; p += 2;
            this.start = view.getInt32(p, true); p += 4;
            this.end = view.getInt32(p, true); p += 4;

            this.instruments = [];

            for (let i = 0; i < 16; i++) {
                const freq = view.getInt16(p, true); p += 2;
                const wave = view.getUint8(p + 1, true);
                const pipi = view.getUint8(p, true); p += 2;
                const notes = view.getUint16(p, true); p += 2;

                this.instruments[i] = { freq, wave, pipi, notes };
            }

            this.tracks = [];
            for (let i = 0; i < 16; i++) {
                const track = [];
                track.length = this.instruments[i].notes;

                for (let j = 0; j < this.instruments[i].notes; j++)
                    track[j] = { pos: 0, key: 0, len: 0, vol: 0, pan: 0 };

                for (let j = 0; j < this.instruments[i].notes; j++) {
                    track[j].pos = view.getInt32(p, true); p += 4;
                }

                for (let j = 0; j < this.instruments[i].notes; j++) {
                    track[j].key = view.getUint8(p, true); p++;
                }

                for (let j = 0; j < this.instruments[i].notes; j++) {
                    track[j].len = view.getUint8(p, true); p++;
                }

                for (let j = 0; j < this.instruments[i].notes; j++) {
                    track[j].vol = view.getUint8(p, true); p++;
                }

                for (let j = 0; j < this.instruments[i].notes; j++) {
                    track[j].pan = view.getUint8(p, true); p++;
                }

                this.tracks[i] = track;
            }
        }
    }

    const freqTable = [261, 278, 294, 311, 329, 349, 371, 391, 414, 440, 466, 494];
    const panTable = [0, 43, 86, 129, 172, 215, 256, 297, 340, 383, 426, 469, 512];
    const advTable = [1, 1, 2, 2, 4, 8, 16, 32];
    const octTable = [32, 64, 64, 128, 128, 128, 128, 128];

    class Organya {
        /**
         * @param {ArrayBuffer} data 
         */
        constructor(data) {
            this.song = new Song(data);
            this.node = null;
            this.onUpdate = null;
            this.t = 0;
            this.playPos = 0;
            this.samplesPerTick = 0;
            this.samplesThisTick = 0;
            this.state = [];
            for (let i = 0; i < 16; i++) {
                this.state[i] = {
                    t: 0,
                    key: 0,
                    frequency: 0,
                    octave: 0,
                    pan: 0.0,
                    vol: 1.0,
                    vol_log: 1.0,
                    length: 0,
                    num_loops: 0,
                    playing: false,
                    looping: false,
                };
            }
        }

        /**
         * @param {Float32Array} leftBuffer 
         * @param {Float32Array} rightBuffer
         */
        synth(leftBuffer, rightBuffer) {
            for (let sample = 0; sample < leftBuffer.length; sample++) {
                if (this.samplesThisTick == 0) this.update();

                leftBuffer[sample] = 0;
                rightBuffer[sample] = 0;

                for (let i = 0; i < 16; i++) {
                    const trackState = this.state[i];
                    if (trackState.playing) {
                        const samples = (i < 8) ? 256 : drums[i - 8].samples;

                        trackState.t += (trackState.frequency / this.sampleRate) * advTable[trackState.octave];

                        if ((trackState.t | 0) >= samples) {
                            if (trackState.looping && trackState.num_loops != 1) {
                                trackState.t %= samples;
                                if (trackState.num_loops != 1)
                                    trackState.num_loops -= 1;

                            } else {
                                trackState.t = 0;
                                trackState.playing = false;
                                continue;
                            }
                        }

                        const t = trackState.t & ~(advTable[trackState.octave] - 1);
                        let pos = t % samples;
                        let pos2 = !this.looping && t == samples ?
                            pos
                            : ((trackState.t + advTable[trackState.octave]) & ~(advTable[trackState.octave] - 1)) % samples;
                        const s1 = i < 8
                            ? (waveTable[256 * this.song.instruments[i].wave + pos] / 256)
                            : (((waveTable[drums[i - 8].filePos + pos] & 0xff) - 0x80) / 256);
                        const s2 = i < 8
                            ? (waveTable[256 * this.song.instruments[i].wave + pos2] / 256)
                            : (((waveTable[drums[i - 8].filePos + pos2] & 0xff) - 0x80) / 256);
                        const fract = (trackState.t - pos) / advTable[trackState.octave];

                        // perform linear interpolation
                        let s = s1 + (s2 - s1) * fract;

                        s *= trackState.vol_log;

                        const pan = (panTable[trackState.pan] - 256) * 10;
                        let left = 1, right = 1;

                        if (pan < 0) {
                            right = Math.pow(10, pan / 2000);
                        } else if (pan > 0) {
                            left = Math.pow(10, -pan / 2000);
                        }

                        leftBuffer[sample] += s * left;
                        rightBuffer[sample] += s * right;
                    }
                }

                if (this.samplesThisTick++ == this.samplesPerTick) {
                    this.playPos += 1;
                    this.samplesThisTick = 0;

                    if (this.playPos == this.song.end) {
                        this.playPos = 0;
                    }
                }
            }
        }

        update() {
            if (this.onUpdate) this.onUpdate(this);

            for (let track = 0; track < 8; track++) {
                const note = this.song.tracks[track].find((n) => n.pos == this.playPos); // TODO: this feels inefficient
                const trackState = this.state[track];
                if (note) {
                    if (note.key != 255) {
                        const octave = ((note.key / 12) | 0);
                        const key = note.key % 12;

                        if (trackState.key == 255) {
                            trackState.key = note.key;

                            trackState.frequency = freqTable[key] * octTable[octave] + (this.song.instruments[track].freq - 1000);
                            if (this.song.instruments[track].pipi != 0 && !trackState.playing) {
                                trackState.num_loops = ((octave + 1) * 4);
                            }
                        } else if (trackState.key != note.key) {
                            trackState.key = note.key;
                            trackState.frequency = freqTable[key] * octTable[octave] + (this.song.instruments[track].freq - 1000);
                        }

                        if (this.song.instruments[track].pipi != 0 && !trackState.playing) {
                            trackState.num_loops = ((octave + 1) * 4);
                        }

                        trackState.octave = octave;
                        trackState.playing = true;
                        trackState.looping = true;
                        trackState.length = note.len;
                    }

                    if (trackState.key != 255) {
                        if (note.vol != 255) {
                            trackState.vol = note.vol;
                            trackState.vol_log = Math.pow(10, ((note.vol - 255) * 4) / 2000);
                        }
                        if (note.pan != 255) trackState.pan = note.pan;
                    }
                }

                if (trackState.length != 0) {
                    if (trackState.key != 255) {
                        if (this.song.instruments[track].pipi == 0)
                            trackState.looping = false;

                        trackState.playing = false;
                        trackState.key = 255;
                    }
                } else {
                    trackState.length--;
                }
            }

            for (let track = 8; track < 16; track++) {
                const note = this.song.tracks[track].find((n) => n.pos == this.playPos);
                const trackState = this.state[track];
                if (!note) continue;

                if (note.key != 255) {
                    trackState.frequency = note.key * 800 + 100;
                    trackState.t = 0;
                    trackState.playing = true;
                }

                if (note.vol != 255) {
                    trackState.vol = note.vol;
                    trackState.vol_log = Math.pow(10, ((note.vol - 255) * 8) / 2000);
                }
                if (note.pan != 255) trackState.pan = note.pan;
            }
        }

        stop() {
            this.node.disconnect();
            this.ctx.close();
        }

        play() {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.sampleRate = this.ctx.sampleRate;
            this.samplesPerTick = (this.sampleRate / 1000) * this.song.wait | 0;
            this.samplesThisTick = 0;

            this.node = this.ctx.createScriptProcessor(8192, 0, 2);
            this.node.onaudioprocess = (e) => this.synth(e.outputBuffer.getChannelData(0), e.outputBuffer.getChannelData(1));
            this.node.connect(this.ctx.destination);
        }
    }

    window.initOrganya = async () => {
        if (window.Organya) return;

        console.log("Initializing Organya...");
        const res = await fetch("wavetable.bin");
        const buf = await res.arrayBuffer();
        const view = new DataView(buf);
        waveTable = new Int8Array(buf);

        for (let i = 256 * 100; i < waveTable.length - 4; i++) {
            if (view.getUint32(i, true) == 0x45564157) {
                i += 4;
                const riffId = view.getUint32(i, true); i += 4;
                const riffLen = view.getUint32(i, true); i += 4;
                if (riffId != 0x20746d66) {
                    console.error("Invalid RIFF chunk ID");
                    continue;
                }

                const startPos = i;
                const aFormat = view.getUint16(i, true); i += 2;
                if (aFormat != 1) {
                    console.error("Invalid audio format");
                    i = startPos + riffLen;
                    continue;
                }

                const channels = view.getUint16(i, true); i += 2;
                if (channels != 1) {
                    console.error("Only 1 channel files are supported");
                    i = startPos + riffLen;
                    continue;
                }

                const samples = view.getUint32(i, true); i += 10; // skip rate + padding
                const bits = view.getUint16(i, true); i += 2;
                const wavData = view.getUint32(i, true); i += 4;
                const wavLen = view.getUint32(i, true); i += 4;

                if (wavData != 0x61746164) {
                    i = startPos + riffLen;
                    continue;
                }

                drums.push({ filePos: i, bits, channels, samples: wavLen });
                i += wavLen;
            }
        }

        window.Organya = Organya;
    };

    // ---- repair-bench instrumentation: read-only verification facade, ENGINE half ----
    // Additive probe block. It deletes 0 seed statements and edits 0 seed logic line: the
    // classes, the constant tables and the loader above are byte-identical to the seed.
    // Two groups of handles live here and they are kept apart on purpose:
    //   rig*  - drivers. They construct THIS BLOCK'S OWN probe objects (a probe player built
    //           from an in-page byte fixture, never the page's own instance) and hand them the
    //           inputs a direct drive needs (a sample rate and a tick length). They are called
    //           from a checkpoint's setup only, and every reading they take is frozen into
    //           rbFrozen at that moment, because asserts are polled and must stay pure reads.
    //   every other handle - a pure read returning one scalar (string, number, boolean, null).
    // Nothing here writes to a page-owned object, to the document, to a storage object or to
    // the network. The only application entry point it calls is the seed's own local loader
    // window.initOrganya(), which reads the shipped wavetable file from the same origin and is
    // idempotent; it is awaited once per page through a memoised promise.
    {
        const RB_TICK_SAMPLES = 8;
        const rb = (typeof window.__rb_org === "object" && window.__rb_org) ? window.__rb_org : {};
        const rbFrozen = {};
        let rbEng = null;
        let rbFixture = null;
        let rbInitPromise = null;
        let rbUiSquare = null;
        let rbUiLiveSized = null;
        let rbUiSquareCanvas = null;

        const rbR4 = (v) => (typeof v === "number" && isFinite(v) ? Math.round(v * 10000) / 10000 : null);
        const rbDef = (name, fallback, fn) => {
            Object.defineProperty(rb, name, {
                value: function () {
                    try {
                        const v = fn.apply(null, arguments);
                        return v === undefined ? fallback : v;
                    } catch (e) { return fallback; }
                },
                writable: false, enumerable: false, configurable: false
            });
        };

        // --- the byte fixture: a whole song image built in page, so every engine reading is
        //     reproducible from constants and no checkpoint depends on a shipped song file ---
        const RB_SPEC = {
            wait: 250, meas: [6, 3], start: 4, end: 10,
            inst: [
                { freq: 1000, wave: 2, pipi: 0, notes: [{ pos: 4, key: 24, len: 3, vol: 200, pan: 6 }, { pos: 6, key: 26, len: 2, vol: 255, pan: 255 }, { pos: 8, key: 255, len: 0, vol: 180, pan: 3 }] },
                { freq: 1050, wave: 5, pipi: 1, notes: [{ pos: 4, key: 12, len: 1, vol: 255, pan: 255 }] },
                { freq: 980, wave: 0, pipi: 0, notes: [] },
                { freq: 1000, wave: 1, pipi: 0, notes: [] },
                { freq: 1000, wave: 1, pipi: 0, notes: [] },
                { freq: 1000, wave: 1, pipi: 0, notes: [] },
                { freq: 1000, wave: 1, pipi: 0, notes: [] },
                { freq: 1000, wave: 1, pipi: 0, notes: [] },
                { freq: 1000, wave: 0, pipi: 0, notes: [{ pos: 4, key: 5, len: 0, vol: 220, pan: 6 }] },
                { freq: 1000, wave: 0, pipi: 0, notes: [] },
                { freq: 1000, wave: 0, pipi: 0, notes: [] },
                { freq: 1000, wave: 0, pipi: 0, notes: [] },
                { freq: 1000, wave: 0, pipi: 0, notes: [] },
                { freq: 1000, wave: 0, pipi: 0, notes: [] },
                { freq: 1000, wave: 0, pipi: 0, notes: [] },
                { freq: 1000, wave: 0, pipi: 0, notes: [] }
            ]
        };
        const rbBuildFixture = () => {
            let n = 4 + 2 + 2 + 2 + 4 + 4 + 16 * 6;
            for (const it of RB_SPEC.inst) n += it.notes.length * 8;
            const buf = new ArrayBuffer(n);
            const v = new DataView(buf);
            let p = 0;
            v.setUint32(p, 0x2d67724f, true); p += 4;
            v.setUint16(p, 0x3230, true); p += 2;
            v.setUint16(p, RB_SPEC.wait, true); p += 2;
            v.setUint8(p, RB_SPEC.meas[0]); p += 1;
            v.setUint8(p, RB_SPEC.meas[1]); p += 1;
            v.setInt32(p, RB_SPEC.start, true); p += 4;
            v.setInt32(p, RB_SPEC.end, true); p += 4;
            for (const it of RB_SPEC.inst) {
                v.setInt16(p, it.freq, true); p += 2;
                v.setUint8(p, it.wave); p += 1;
                v.setUint8(p, it.pipi); p += 1;
                v.setUint16(p, it.notes.length, true); p += 2;
            }
            // the image is TRACK-MAJOR: for each track the parser walks five field runs in
            // order (every position, then every key, then every length, then every volume,
            // then every pan) before it moves to the next track.
            for (const it of RB_SPEC.inst) {
                for (const nt of it.notes) { v.setInt32(p, nt.pos, true); p += 4; }
                for (const nt of it.notes) { v.setUint8(p, nt.key); p += 1; }
                for (const nt of it.notes) { v.setUint8(p, nt.len); p += 1; }
                for (const nt of it.notes) { v.setUint8(p, nt.vol); p += 1; }
                for (const nt of it.notes) { v.setUint8(p, nt.pan); p += 1; }
            }
            return buf;
        };

        const rbInit = () => {
            if (!rbInitPromise) {
                rbInitPromise = Promise.resolve()
                    .then(() => window.initOrganya())
                    .then(() => true)
                    .catch((e) => { rbInitPromise = null; rbFrozen.initError = String((e && e.message) || e); return false; });
            }
            return rbInitPromise;
        };

        // --- rig drivers (setup only) ---
        Object.defineProperty(rb, "rigPrepare", {
            value: async function () {
                try {
                    const okInit = await rbInit();
                    if (!rbFixture) rbFixture = rbBuildFixture();
                    rbEng = new Organya(rbFixture);
                    rbEng.sampleRate = 44100;
                    rbEng.samplesPerTick = RB_TICK_SAMPLES;
                    rbFrozen.fixtureBytes = rbFixture.byteLength;
                    rbFrozen.initOk = okInit === true;
                    rbFrozen.waveTableLen = waveTable.length;
                    rbFrozen.drumCount = drums.length;
                    rbFrozen.drum0Samples = drums.length ? drums[0].samples : null;
                    return true;
                } catch (e) { rbFrozen.prepareError = String((e && e.message) || e); return false; }
            }, writable: false, enumerable: false, configurable: false
        });
        rbDef("rigSetPlayPos", -1, (pos) => { if (!rbEng) return -1; rbEng.playPos = pos | 0; rbEng.samplesThisTick = 0; return rbEng.playPos; });
        rbDef("rigUpdate", -1, () => { if (!rbEng) return -1; rbEng.update(); return 1; });
        rbDef("rigWalk", -1, (from, to) => {
            if (!rbEng) return -1;
            let n = 0;
            for (let pos = from | 0; pos <= (to | 0); pos++) { rbEng.playPos = pos; rbEng.samplesThisTick = 0; rbEng.update(); n++; }
            return n;
        });
        rbDef("rigTick", -1, (n) => {
            if (!rbEng) return -1;
            let done = 0;
            for (let i = 0; i < (n | 0); i++) {
                const L = new Float32Array(RB_TICK_SAMPLES), R = new Float32Array(RB_TICK_SAMPLES);
                rbEng.synth(L, R);
                rbFrozen.lastLeft0 = rbR4(L[0]); rbFrozen.lastRight0 = rbR4(R[0]);
                rbFrozen.lastLeftFinite = isFinite(L[R.length - 1]);
                done++;
            }
            rbFrozen.tickCalls = done;
            return done;
        });
        rbDef("rigMarkPhase", "", (name) => {
            if (!rbEng) return "";
            const k = String(name);
            rbFrozen["phasePlayPos_" + k] = rbEng.playPos;
            rbFrozen["phaseStt_" + k] = rbEng.samplesThisTick;
            rbFrozen["phaseAtOrAfterStart_" + k] = rbEng.playPos >= rbEng.song.start;
            rbFrozen["phaseNames"] = (rbFrozen.phaseNames || "") + (rbFrozen.phaseNames ? "|" : "") + k;
            return k;
        });
        rbDef("frozenPhasePlayPos", null, (name) => { const v = rbFrozen["phasePlayPos_" + String(name)]; return v === undefined ? null : v; });
        rbDef("frozenPhaseStt", null, (name) => { const v = rbFrozen["phaseStt_" + String(name)]; return v === undefined ? null : v; });
        rbDef("frozenPhaseAtOrAfterStart", null, (name) => { const v = rbFrozen["phaseAtOrAfterStart_" + String(name)]; return v === undefined ? null : v; });
        rbDef("frozenPhaseNames", "", () => String(rbFrozen.phaseNames || ""));
        rbDef("rigResetEngine", false, () => {
            if (!rbFixture) return false;
            rbEng = new Organya(rbFixture);
            rbEng.sampleRate = 44100;
            rbEng.samplesPerTick = RB_TICK_SAMPLES;
            return true;
        });
        rbDef("rigUiSquare", -1, (size) => {
            if (typeof window.OrganyaUI !== "function") return -1;
            rbUiSquareCanvas = document.createElement("canvas");
            rbUiSquareCanvas.width = size | 0;
            rbUiSquareCanvas.height = size | 0;
            rbUiSquare = new window.OrganyaUI(rbUiSquareCanvas);
            rbFrozen.squareInitScroll = rbUiSquare.scrollY;
            rbFrozen.squareCanvasW = rbUiSquareCanvas.width;
            rbFrozen.squareCanvasH = rbUiSquareCanvas.height;
            return 1;
        });
        rbDef("rigUiWheelSquare", null, (dy) => {
            if (!rbUiSquare) return null;
            const before = rbUiSquare.scrollY;
            rbUiSquareCanvas.dispatchEvent(new WheelEvent("wheel", { deltaY: Number(dy) }));
            rbUiSquare.draw();
            rbFrozen.squareWheelBefore = before;
            rbFrozen.squareWheelAfter = rbUiSquare.scrollY;
            return rbUiSquare.scrollY;
        });
        rbDef("rigUiLiveSized", -1, () => {
            if (typeof window.OrganyaUI !== "function") return -1;
            const live = document.getElementById("org-canvas");
            if (!live) return -1;
            const c = document.createElement("canvas");
            c.width = live.width; c.height = live.height;
            rbUiLiveSized = new window.OrganyaUI(c);
            rbFrozen.liveSizedInitScroll = rbUiLiveSized.scrollY;
            rbFrozen.liveSizedCanvasW = c.width;
            rbFrozen.liveSizedCanvasH = c.height;
            return 1;
        });
        rbDef("rigSetOrganya", false, () => {
            if (!rbUiSquare || !rbEng) return false;
            rbUiSquare.setOrganya(rbEng);
            rbFrozen.handoverSame = rbUiSquare.organya === rbEng;
            rbFrozen.engineOnUpdateIsFn = typeof rbEng.onUpdate === "function";
            return true;
        });
        rbDef("rigCallbackProbe", null, () => {
            if (!rbUiSquare || !rbEng) return null;
            rbUiSquare.requested = false;
            rbUiSquare.onUpdate();
            const requestedBefore = rbUiSquare.requested;
            rbEng.update();
            rbFrozen.cbRequestedBefore = requestedBefore;
            rbFrozen.cbRequestedAfter = rbUiSquare.requested;
            return rbUiSquare.requested;
        });
        Object.defineProperty(rb, "rigFetchSelected", {
            value: async function () {
                try {
                    const el = document.getElementById("songs");
                    const val = el.options[el.selectedIndex].value;
                    const res = await fetch(val);
                    rbFrozen.selectedValue = val;
                    rbFrozen.selectedFetchOk = res.ok === true;
                    rbFrozen.selectedFetchStatus = res.status | 0;
                    return res.ok === true;
                } catch (e) { rbFrozen.selectedFetchError = String((e && e.message) || e); rbFrozen.selectedFetchOk = false; return false; }
            }, writable: false, enumerable: false, configurable: false
        });

        // --- pure reads: frozen rig scalars ---
        rbDef("frozenInitOk", null, () => rbFrozen.initOk === undefined ? null : rbFrozen.initOk);
        rbDef("frozenPrepareOk", true, () => rbEng !== null);
        rbDef("frozenFixtureBytes", -1, () => rbFrozen.fixtureBytes);
        rbDef("frozenWaveTableLen", -1, () => rbFrozen.waveTableLen);
        rbDef("frozenDrumCount", -1, () => rbFrozen.drumCount);
        rbDef("frozenDrum0Samples", -1, () => rbFrozen.drum0Samples);
        rbDef("frozenTickCalls", -1, () => rbFrozen.tickCalls);
        rbDef("frozenLastLeft0", null, () => rbFrozen.lastLeft0 === undefined ? null : rbFrozen.lastLeft0);
        rbDef("frozenLastLeftFinite", null, () => rbFrozen.lastLeftFinite === undefined ? null : rbFrozen.lastLeftFinite);
        rbDef("frozenSquareInitScroll", null, () => rbFrozen.squareInitScroll === undefined ? null : rbFrozen.squareInitScroll);
        rbDef("frozenSquareCanvasW", -1, () => rbFrozen.squareCanvasW);
        rbDef("frozenSquareCanvasH", -1, () => rbFrozen.squareCanvasH);
        rbDef("frozenSquareWheelBefore", null, () => rbFrozen.squareWheelBefore === undefined ? null : rbFrozen.squareWheelBefore);
        rbDef("frozenSquareWheelAfter", null, () => rbFrozen.squareWheelAfter === undefined ? null : rbFrozen.squareWheelAfter);
        rbDef("squareWheelAfterIsBelowInit", null, () => (rbFrozen.squareWheelAfter === undefined || rbFrozen.squareInitScroll === undefined) ? null : rbFrozen.squareWheelAfter < rbFrozen.squareInitScroll);
        rbDef("frozenLiveSizedInitScroll", null, () => rbFrozen.liveSizedInitScroll === undefined ? null : rbFrozen.liveSizedInitScroll);
        rbDef("frozenHandoverSame", null, () => rbFrozen.handoverSame === undefined ? null : rbFrozen.handoverSame);
        rbDef("frozenEngineOnUpdateIsFn", null, () => rbFrozen.engineOnUpdateIsFn === undefined ? null : rbFrozen.engineOnUpdateIsFn);
        rbDef("frozenCbRequestedBefore", null, () => rbFrozen.cbRequestedBefore === undefined ? null : rbFrozen.cbRequestedBefore);
        rbDef("frozenCbRequestedAfter", null, () => rbFrozen.cbRequestedAfter === undefined ? null : rbFrozen.cbRequestedAfter);
        rbDef("frozenSelectedFetchOk", null, () => rbFrozen.selectedFetchOk === undefined ? null : rbFrozen.selectedFetchOk);
        rbDef("frozenSelectedFetchStatus", -1, () => rbFrozen.selectedFetchStatus);
        rbDef("frozenSelectedValue", "", () => rbFrozen.selectedValue === undefined ? "" : rbFrozen.selectedValue);
        rbDef("frozenErrorText", "", () => String(rbFrozen.prepareError || rbFrozen.initError || rbFrozen.selectedFetchError || ""));

        // --- pure reads: module-private loader results ---
        rbDef("waveTableLen", -1, () => waveTable.length);
        rbDef("drumCount", -1, () => drums.length);
        rbDef("drumSamplesAt", -1, (i) => (drums[i | 0] ? drums[i | 0].samples : -1));
        rbDef("drumBitsAt", -1, (i) => (drums[i | 0] ? drums[i | 0].bits : -1));

        // --- pure reads: the probe player's song image ---
        rbDef("songWait", -1, () => rbEng.song.wait);
        rbDef("songMeas0", -1, () => rbEng.song.meas[0]);
        rbDef("songMeas1", -1, () => rbEng.song.meas[1]);
        rbDef("songMeasLen", -1, () => rbEng.song.meas.length);
        rbDef("songStart", -1, () => rbEng.song.start);
        rbDef("songEnd", -1, () => rbEng.song.end);
        rbDef("instFreq", -1, (i) => rbEng.song.instruments[i | 0].freq);
        rbDef("instWave", -1, (i) => rbEng.song.instruments[i | 0].wave);
        rbDef("instPipi", -1, (i) => rbEng.song.instruments[i | 0].pipi);
        rbDef("instNotes", -1, (i) => rbEng.song.instruments[i | 0].notes);
        rbDef("instCount", -1, () => rbEng.song.instruments.length);
        rbDef("trackCount", -1, () => rbEng.song.tracks.length);
        rbDef("trackLen", -1, (t) => rbEng.song.tracks[t | 0].length);
        rbDef("notePos", -1, (t, j) => rbEng.song.tracks[t | 0][j | 0].pos);
        rbDef("noteKey", -1, (t, j) => rbEng.song.tracks[t | 0][j | 0].key);
        rbDef("noteLen", -1, (t, j) => rbEng.song.tracks[t | 0][j | 0].len);
        rbDef("noteVol", -1, (t, j) => rbEng.song.tracks[t | 0][j | 0].vol);
        rbDef("notePan", -1, (t, j) => rbEng.song.tracks[t | 0][j | 0].pan);

        // --- pure reads: the probe player's transport + per-track state ---
        rbDef("playPos", -1, () => rbEng.playPos);
        rbDef("samplesThisTick", -1, () => rbEng.samplesThisTick);
        rbDef("samplesPerTick", -1, () => rbEng.samplesPerTick);
        rbDef("engineSampleRate", -1, () => rbEng.sampleRate);
        rbDef("engineNodeIsNull", null, () => rbEng.node === null);
        rbDef("playPosIsAtOrAfterSongStart", null, () => rbEng.playPos >= rbEng.song.start);
        rbDef("playPosIsBeforeSongEnd", null, () => rbEng.playPos < rbEng.song.end);
        rbDef("playPosIsZero", null, () => rbEng.playPos === 0);
        rbDef("playPosEqualsSongStart", null, () => rbEng.playPos === rbEng.song.start);
        rbDef("stateCount", -1, () => rbEng.state.length);
        rbDef("stTR", null, (t) => rbR4(rbEng.state[t | 0].t));
        rbDef("stKey", -1, (t) => rbEng.state[t | 0].key);
        rbDef("stFrequency", -1, (t) => rbEng.state[t | 0].frequency);
        rbDef("stOctave", -1, (t) => rbEng.state[t | 0].octave);
        rbDef("stPan", -1, (t) => rbEng.state[t | 0].pan);
        rbDef("stVol", null, (t) => rbR4(rbEng.state[t | 0].vol));
        rbDef("stVolLog", null, (t) => rbR4(rbEng.state[t | 0].vol_log));
        rbDef("stLength", -1, (t) => rbEng.state[t | 0].length);
        rbDef("stNumLoops", -1, (t) => rbEng.state[t | 0].num_loops);
        rbDef("stPlaying", null, (t) => rbEng.state[t | 0].playing === true);
        rbDef("stLooping", null, (t) => rbEng.state[t | 0].looping === true);
        rbDef("stKeyIsSentinel", null, (t) => rbEng.state[t | 0].key === 255);
        rbDef("stFreqIsPositive", null, (t) => rbEng.state[t | 0].frequency > 0);

        // --- facade self-integrity (anti-cheat sentinels) ---
        rbDef("facadeHandleCount", -1, () => Object.getOwnPropertyNames(rb).length);
        rbDef("facadeWritableCount", -1, () => Object.getOwnPropertyNames(rb).filter((k) => Object.getOwnPropertyDescriptor(rb, k).writable !== false).length);
        rbDef("facadeNonFunctionCount", -1, () => Object.getOwnPropertyNames(rb).filter((k) => typeof Object.getOwnPropertyDescriptor(rb, k).value !== "function").length);
        rbDef("facadeConfigurableCount", -1, () => Object.getOwnPropertyNames(rb).filter((k) => Object.getOwnPropertyDescriptor(rb, k).configurable !== false).length);

        if (!window.__rb_org) Object.defineProperty(window, "__rb_org", { value: rb, writable: false, enumerable: false, configurable: false });
    }
})();