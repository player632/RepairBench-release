// probe.js - verification harness bridge (instrumentation only; no gameplay effect).
// window.__SBQ__()      : pure-read snapshot (scalars only), safe to poll
// window.__SBX__        : command surface, called from test setup only (side effects)
// window.__SB_STATS__   : natural-spawn counter (fixture spawns are excluded)
// window.__SB_FROZEN__  : snapshots frozen during setup (time-sensitive values)
// window.__SB_PROBE__   : last entity handed to the harness
(() => {
    const stats = { created: {}, hold: false };
    window.__SB_STATS__ = stats;
    window.__SB_FROZEN__ = {};
    window.__SB_PROBE__ = null;

    const SPAWN_KINDS = ['Enemy', 'Meteorite', 'Friend', 'Fuel', 'Star'];

    if (typeof Play === 'function' && Play.prototype.factory) {
        const factory = Play.prototype.factory;
        Play.prototype.factory = function (elem) {
            const o = factory.call(this, elem);
            if (!stats.hold) {
                const name = (elem && elem.name) || 'anonymous';
                stats.created[name] = (stats.created[name] || 0) + 1;
            }
            return o;
        };
    }

    const el = (sel) => document.querySelector(sel);
    const txt = (sel) => { const n = el(sel); return n ? n.textContent.trim() : null; };
    const hasCls = (sel, c) => { const n = el(sel); return n ? n.classList.contains(c) : null; };
    const styleOf = (sel, prop) => { const n = el(sel); return n ? (n.style[prop] || null) : null; };

    const play = () => {
        const g = window.__SB__;
        return g && g.scenes ? g.scenes.play : null;
    };

    const ink = (sc) => {
        const p = window.__SB_PROBE__;
        if (!sc || !sc.ctx || !sc.canvas || !p) return null;
        const box = 40;
        const cw = sc.canvas.width;
        const ch = sc.canvas.height;
        let x = Math.round(p.x + p.w / 2 - box / 2);
        let y = Math.round(p.y + p.h / 2 - box / 2);
        if (x + box <= 0 || y + box <= 0 || x >= cw || y >= ch) return 0;
        x = Math.max(0, Math.min(x, cw - box));
        y = Math.max(0, Math.min(y, ch - box));
        try {
            const d = sc.ctx.getImageData(x, y, box, box).data;
            let m = 0;
            for (let i = 3; i < d.length; i += 4) { if (d[i] > m) m = d[i]; }
            return m;
        } catch (e) {
            return null;
        }
    };

    const read = (withFrozen) => {
        const out = {};
        try {
            const g = window.__SB__;
            const scenes = g && g.scenes;
            const sc = scenes && scenes.play;
            const data = (g && g.data) || {};
            const names = ['start', 'play', 'over', 'rank'];
            const active = scenes
                ? names.filter(k => scenes[k] && scenes[k].el && scenes[k].el.classList.contains('action'))
                : [];
            out.ready = !!(g && scenes && sc && sc.player);
            out.scene = active.length === 1 ? active[0] : (active.length ? active.join('+') : 'none');
            out.activeScenes = active.length;
            out.time = data.time === undefined ? null : data.time;
            out.fuel = data.fuel === undefined ? null : data.fuel;
            out.score = data.score === undefined ? null : data.score;
            out.shoot = data.shoot === undefined ? null : data.shoot;
            out.dataEnd = data.end === undefined ? null : !!data.end;
            out.dataName = data.name === undefined ? null : String(data.name);
            out.hudTime = txt('#time');
            out.hudFuel = txt('#fuel');
            out.hudScore = txt('#score');
            out.hudShoot = txt('#shoot');
            out.overTime = txt('#over .time');
            out.overScore = txt('#over .score');
            out.overShoot = txt('#over .shoot');
            out.pauseActive = hasCls('#game-pause-btn', 'active');
            out.muteActive = hasCls('#game-mute-btn', 'active');
            out.logoPlay = hasCls('#logo', 'play-status');
            out.startDisabled = el('#start-btn') ? el('#start-btn').hasAttribute('disabled') : null;
            const startLabelEl = document.querySelector('#start-btn p:nth-child(1)');
            out.startLabelShown = startLabelEl ? (window.getComputedStyle(startLabelEl).display !== 'none') : null;
            out.submitDisabled = el('#submit-btn') ? el('#submit-btn').hasAttribute('disabled') : null;
            out.nameValue = el('#name') ? el('#name').value : null;
            out.pauseFlag = sc ? !!sc.pauseFlag : null;
            out.muteFlag = sc ? !!sc.muteFlag : null;
            out.fontVal = (typeof config !== 'undefined' && config.game && config.game.fontSize) ? config.game.fontSize.val : null;
            out.infoFontSize = styleOf('.content .header .info', 'fontSize');
            out.appW = styleOf('#app', 'width');
            out.appH = styleOf('#app', 'height');
            out.canvasW = sc && sc.canvas ? sc.canvas.width : null;
            out.canvasH = sc && sc.canvas ? sc.canvas.height : null;
            const p = sc && sc.player;
            out.playerX = p ? p.x : null;
            out.playerY = p ? p.y : null;
            out.playerW = p ? p.w : null;
            out.playerH = p ? p.h : null;
            out.playerRun = p ? !!p.run : null;
            out.bullets = sc && sc.playerBullets ? sc.playerBullets.length : null;
            out.enemyBullets = sc && sc.enemyBullets ? sc.enemyBullets.length : null;
            const b0 = sc && sc.playerBullets ? sc.playerBullets[sc.playerBullets.length - 1] : null;
            out.bullet0X = b0 ? b0.x : null;
            out.bullet0Y = b0 ? b0.y : null;
            out.bullet0Gap = (b0 && p) ? b0.x - p.x : null;
            out.hostiles = sc && sc.enemys ? sc.enemys.arr.length : null;
            out.friends = sc && sc.friends ? sc.friends.arr.length : null;
            out.fuels = sc && sc.fuels ? sc.fuels.arr.length : null;
            out.stars = sc && sc.stars ? sc.stars.arr.length : null;
            out.spawnTotal = SPAWN_KINDS.reduce((s, k) => s + (stats.created[k] || 0), 0);
            const rankRowEls = document.querySelectorAll('#rank tbody tr');
            out.rankRows = rankRowEls.length;
            const board = [];
            for (let i = 0; i < rankRowEls.length; i++) {
                const cells = rankRowEls[i].children;
                board.push((cells[1] ? cells[1].textContent.trim() : '') + ':' + (cells[2] ? cells[2].textContent.trim() : ''));
            }
            out.rankBoard = board.join(',');
            const pr = window.__SB_PROBE__;
            out.probeKind = pr && pr.constructor ? pr.constructor.name : null;
            out.probeX = pr ? pr.x : null;
            out.probeY = pr ? pr.y : null;
            out.probeW = pr ? pr.w : null;
            out.probeRun = pr ? !!pr.run : null;
            out.probeLife = pr ? pr.life : null;
            out.probeIsDeath = pr ? !!pr.isDeath : null;
            out.probeInk = ink(sc);
        } catch (e) {
            out.error = String((e && e.message) || e);
        }
        if (withFrozen) out.frozen = window.__SB_FROZEN__;
        return out;
    };

    window.__SBQ__ = () => read(true);

    window.__SBX__ = {
        seedRandom(v) {
            const x = v === undefined ? 0.5 : v;
            Math.random = () => x;
            return true;
        },
        snap(key) {
            window.__SB_FROZEN__[key] = read(false);
            return true;
        },
        resetFrozen() {
            window.__SB_FROZEN__ = {};
            return true;
        },
        clearStorage() {
            try { localStorage.clear(); sessionStorage.clear(); } catch (e) { /* ignore */ }
            return true;
        },
        async waitBridge(ms) {
            const limit = ms || 20000;
            const t0 = Date.now();
            for (;;) {
                if (window.__SB__ && window.__SBQ__ && window.__SBX__) return true;
                if (Date.now() - t0 > limit) throw new Error('bridge not ready');
                await new Promise(r => setTimeout(r, 50));
            }
        },
        async waitScene(name, ms) {
            const limit = ms || 25000;
            const t0 = Date.now();
            for (;;) {
                const s = read(false);
                if (s.scene === name) {
                    window.__SB_FROZEN__['entered_' + name] = s;
                    return true;
                }
                if (Date.now() - t0 > limit) {
                    throw new Error('scene "' + name + '" not reached (scene=' + s.scene + ', err=' + (s.error || 'none') + ')');
                }
                await new Promise(r => setTimeout(r, 60));
            }
        },
        gotoOver() { window.__SB__.over(); return true; },
        gotoRank() { window.__SB__.rank(); return true; },
        gotoStart() { window.__SB__.start(); return true; },
        quiet() {
            const sc = play();
            if (!sc) throw new Error('play scene missing');
            ['enemys', 'meteorites', 'friends', 'fuels', 'stars'].forEach(k => {
                const g = sc[k];
                if (!g) return;
                g.arr.length = 0;
                if (g.cooldown) g.cooldown.cooldown = 1e9;
            });
            sc.playerBullets.length = 0;
            sc.enemyBullets.length = 0;
            return true;
        },
        setFuel(n) {
            window.__SB__.data.fuel = n;
            const sc = play();
            if (sc && sc.player) sc.updateFuel(0);
            return n;
        },
        setScore(n) {
            window.__SB__.data.score = n;
            const sc = play();
            if (sc && sc.player) sc.updateScore(0);
            return n;
        },
        // Deterministic SINGLE award: drive the scene's real updateScore/updateFuel
        // production path (and therefore the real incrementAnimation) exactly once.
        // Parking an entity on the player instead would re-trigger the ungated
        // playerCollision callback on every frame until the death animation ends, so
        // the award count would be frame-rate/load dependent. Setup-only side effect.
        awardScore(n) {
            const sc = play();
            if (!sc || !sc.player) throw new Error('play scene missing');
            sc.updateScore(n);
            return n;
        },
        awardFuel(n) {
            const sc = play();
            if (!sc || !sc.player) throw new Error('play scene missing');
            sc.updateFuel(n);
            return n;
        },
        setTime(n) {
            window.__SB__.data.time = n;
            const sc = play();
            if (sc && sc.player) sc.updateTime();
            return n;
        },
        setData(obj) {
            const data = window.__SB__.data;
            Object.keys(obj || {}).forEach(k => { data[k] = obj[k]; });
            return true;
        },
        player(x, y) {
            const sc = play();
            if (!sc || !sc.player) throw new Error('player missing');
            if (x !== undefined && x !== null) sc.player.x = x;
            if (y !== undefined && y !== null) sc.player.y = y;
            return true;
        },
        place(kind, x, y, opts) {
            opts = opts || {};
            const sc = play();
            if (!sc) throw new Error('play scene missing');
            const cls = { enemy: Enemy, meteorite: Meteorite, friend: Friend, fuel: Fuel, star: Star }[kind];
            if (!cls) throw new Error('unknown kind: ' + kind);
            const group = kind === 'friend' ? 'friends'
                : kind === 'fuel' ? 'fuels'
                : kind === 'star' ? 'stars'
                : 'enemys';
            stats.hold = true;
            let o;
            try { o = sc.factory(cls); } finally { stats.hold = false; }
            o.x = x;
            o.y = y;
            if (opts.speed !== undefined) o.speed = opts.speed;
            if (opts.life !== undefined) o.life = opts.life;
            if (opts.inert !== false) {
                o.canFire = false;
                if (o.bulletCooldown) o.bulletCooldown.cooldown = 1e9;
            }
            sc[group].arr.push(o);
            window.__SB_PROBE__ = o;
            return sc[group].arr.length;
        },
        spawnNow(group) {
            const sc = play();
            if (!sc) throw new Error('play scene missing');
            const g = sc[group];
            if (!g) throw new Error('unknown group: ' + group);
            if (g.cooldown) g.cooldown.cooldown = 0;
            const before = g.arr.length;
            sc.append(g);
            if (g.arr.length === before) return 0;
            window.__SB_PROBE__ = g.arr[g.arr.length - 1];
            return 1;
        },
        fireNow() {
            const sc = play();
            if (!sc || !sc.player) throw new Error('player missing');
            const p = sc.player;
            p.canFire = true;
            p.fire();
            const b = sc.playerBullets[sc.playerBullets.length - 1];
            window.__SB_FROZEN__.lastShotGap = b ? b.x - p.x : null;
            window.__SB_FROZEN__.lastShotY = b ? b.y - p.y : null;
            window.__SB_FROZEN__.lastShotCount = sc.playerBullets.length;
            return sc.playerBullets.length;
        },
        keyDown(k) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
            return true;
        },
        keyUp(k) {
            window.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true, cancelable: true }));
            return true;
        },
        typeName(v) {
            const n = el('#name');
            if (!n) throw new Error('name input missing');
            n.value = v;
            n.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        },
        clickSel(sel) {
            const n = el(sel);
            if (!n) throw new Error('element missing: ' + sel);
            n.click();
            return true;
        },
        fontClicks(sel, times) {
            const n = el(sel);
            if (!n) throw new Error('element missing: ' + sel);
            for (let i = 0; i < times; i++) n.click();
            return true;
        },
        seedRank(rows) {
            localStorage.setItem('gameData', JSON.stringify({ data: rows }));
            return rows.length;
        },
    };
})();
