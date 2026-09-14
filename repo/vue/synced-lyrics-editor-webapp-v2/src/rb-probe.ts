/**
 * RepairBench instrumentation probe - read-only measurement surface for the
 * synced-lyrics editor. Added by environment/instrumentation.patch together
 * with a single `import './rb-probe'` line in src/main.ts; it touches NO
 * application logic and contains NO copy of any logic under test (it never
 * re-implements the LRC parser: every value below is read back from the seed's
 * own singleton `window.app.lyric` or from the live DOM).
 *
 * Two globals are published:
 *
 *   window.__LR__()      a READ-ONLY snapshot, recomputed on every call (it is a
 *                        function, not a cached object). ES module imports are
 *                        hoisted and run before `createApp(...).mount('#app')`,
 *                        so nothing may be captured at module-initialisation
 *                        time: every accessor below resolves `window.app` lazily
 *                        at the moment it is called.
 *   window.__LR_CMD__    a command surface that drives the SEED'S OWN public API
 *                        (parse / add / addAfter / addBefore / update / remove /
 *                        addTag / reset). Every command is addressed BY INDEX and
 *                        resolves the index to `_cachedKeys[i]` internally, so no
 *                        line id - which is `${Date.now()}_${increment}` and
 *                        therefore different on every leg - ever has to appear in
 *                        a grading assertion.
 *
 * Safety contract (identical to the painter/luckysheet probes): every accessor
 * and every command is try/catch wrapped and returns a sentinel (`null`, `'ERR'`
 * or `false`) instead of throwing, and a missing handle yields `{found:false}`
 * style `null` rather than an exception. A broken state therefore surfaces as a
 * FAILED ASSERTION (behaviour evidence) and never as a page crash or a runner
 * error, which is what keeps the red set honest in the injected state.
 */

const W = window as unknown as Record<string, any>

/** sentinel for "this accessor could not produce a value" */
const ERR = 'ERR'

// ---- module-level command bookkeeping (read back through the snapshot) ----
let lastCmdOk = true
let lastCmdError: string | null = null
let rememberedId: string | null = null
let pageErrorCount = 0
let errorHooksInstalled = false
let lastUrlPath: string | null = null
let lastUrlStatus: number | null = null
let lastUrlError: string | null = null

/** Lazy handle on the seed's own parser singleton. Never cached. */
function lyric(): any {
	try {
		const app = W.app
		if (!app) return null
		return app.lyric || null
	} catch {
		return null
	}
}

/** Lazy handle on the seed's own music-service singleton. */
function player(): any {
	try {
		const app = W.app
		if (!app) return null
		return app.player || null
	} catch {
		return null
	}
}

/** Resolve an index to the seed's own cached key array (index-based addressing). */
function keyAt(index: number): string | null {
	try {
		const l = lyric()
		if (!l) return null
		const keys = l._cachedKeys
		if (!Array.isArray(keys)) return null
		const k = keys[index]
		return typeof k === 'string' ? k : null
	} catch {
		return null
	}
}

function normalise(value: any): any {
	return value === undefined ? null : value
}

/** Wrap an accessor so it can never throw: `fallback` is the sentinel. */
function safe(fallback: any, fn: () => any): any {
	try {
		const v = fn()
		return v === undefined ? fallback : v
	} catch {
		return fallback
	}
}

/** window.onerror + unhandledrejection counters (idempotent). */
function installErrorHooks() {
	if (errorHooksInstalled) return
	errorHooksInstalled = true
	try {
		const previous = W.onerror
		W.onerror = function (...args: any[]) {
			pageErrorCount++
			if (typeof previous === 'function') return previous.apply(W, args)
			return false
		}
	} catch {
		/* sentinel: the counter simply stays at 0 */
	}
	try {
		window.addEventListener('unhandledrejection', () => {
			pageErrorCount++
		})
	} catch {
		/* sentinel */
	}
}

// Installed at import time so that boot-time errors are counted too; the
// `capturePageErrors()` command below re-runs it (idempotent) and reports the
// current count, so a checkpoint can also arm it explicitly.
installErrorHooks()

/** Run a command, record ok/error, never throw. */
function command(name: string, fn: () => any): any {
	try {
		const l = lyric()
		if (!l) {
			lastCmdOk = false
			lastCmdError = name + ': no lyric handle (window.app.lyric missing)'
			return null
		}
		const out = fn(l)
		lastCmdOk = true
		lastCmdError = null
		return out === undefined ? null : out
	} catch (e: any) {
		lastCmdOk = false
		lastCmdError = name + ': ' + String((e && e.message) || e).slice(0, 200)
		return null
	}
}

/** The read-only snapshot. Recomputed on every call. */
function snapshot(): any {
	const l = lyric()

	// -- parser state scalars --
	const ready = safe(false, () => !!(W.app && W.app.lyric))
	const version = safe(null, () => normalise(W.app ? W.app.version : null))
	const versionString = safe(ERR, () => String(W.app ? W.app.version_string : ERR))
	const length = safe(null, () => (l ? normalise(l.length) : null))
	const linesCount = safe(null, () => (l ? Object.keys(l.lines || {}).length : null))
	const cachedKeysLen = safe(null, () => (l && Array.isArray(l._cachedKeys) ? l._cachedKeys.length : null))
	const tagsCount = safe(null, () => (l ? Object.keys(l.tags || {}).length : null))

	const snap: Record<string, any> = {
		found: !!l,
		ready,
		version,
		version_string: versionString,
		length,
		linesCount,
		cachedKeysLen,
		tagsCount,
		hasPlayer: safe(false, () => !!player()),
		hasClipboard: safe(false, () => !!(W.app && W.app.clipboard)),
		lastCmdOk,
		lastCmdError,
		pageErrors: pageErrorCount,
		rememberedId,

		// -- tags --
		tag: (k: string) =>
			safe(null, () => {
				const t = l && l.tags ? l.tags : null
				if (!t) return null
				return Object.prototype.hasOwnProperty.call(t, k) ? normalise(t[k]) : null
			}),
		tagKeysSorted: () => safe(ERR, () => (l ? Object.keys(l.tags || {}).sort().join(',') : ERR)),

		// -- index-addressed line views --
		timeAt: (i: number) =>
			safe(null, () => {
				const k = keyAt(i)
				if (k === null) return null
				const line = l.lines[k]
				return line ? normalise(line.time) : null
			}),
		dataAt: (i: number) =>
			safe(null, () => {
				const k = keyAt(i)
				if (k === null) return null
				const line = l.lines[k]
				return line ? normalise(line.data) : null
			}),
		idAt: (i: number) => safe(null, () => keyAt(i)),
		cachedTimeAt: (i: number) =>
			safe(null, () => (l && Array.isArray(l._cachedTime) ? normalise(l._cachedTime[i]) : null)),

		// -- cache / model consistency invariants --
		cacheMatchesLines: () =>
			safe(false, () => {
				if (!l) return false
				const keys = Array.isArray(l._cachedKeys) ? l._cachedKeys : null
				const times = Array.isArray(l._cachedTime) ? l._cachedTime : null
				const lines = l.lines || {}
				if (!keys || !times) return false
				const modelKeys = Object.keys(lines)
				if (keys.length !== modelKeys.length || times.length !== keys.length) return false
				const seen: Record<string, number> = {}
				for (let i = 0; i < keys.length; i++) {
					const k = keys[i]
					if (typeof k !== 'string') return false
					if (seen[k]) return false
					seen[k] = 1
					if (modelKeys[i] !== k) return false
					const line = lines[k]
					if (!line) return false
					if (line.time !== times[i]) return false
				}
				return true
			}),
		idsUnique: () =>
			safe(false, () => {
				if (!l) return false
				const keys = Array.isArray(l._cachedKeys) ? l._cachedKeys : []
				const lines = l.lines || {}
				const modelKeys = Object.keys(lines)
				if (keys.length !== modelKeys.length) return false
				const seen: Record<string, number> = {}
				for (let i = 0; i < keys.length; i++) {
					const k = keys[i]
					if (typeof k !== 'string' || seen[k]) return false
					seen[k] = 1
					if (!Object.prototype.hasOwnProperty.call(lines, k)) return false
				}
				return true
			}),

		// -- serialisation views --
		stringify: () => safe(ERR, () => (l ? String(l.stringify()) : ERR)),
		stringifyLen: () =>
			safe(null, () => {
				if (!l) return null
				const s = String(l.stringify())
				return s === '' ? 0 : s.split('\n').length
			}),
		stringifyLine: (i: number) =>
			safe(null, () => {
				if (!l) return null
				const s = String(l.stringify())
				if (s === '') return null
				const rows = s.split('\n')
				return i >= 0 && i < rows.length ? rows[i] : null
			}),
		stringifyCharLen: () => safe(null, () => (l ? String(l.stringify()).length : null)),
		rawJson: () => safe(ERR, () => (l ? String(l.getJSON()) : ERR)),
		jsonLen: () => safe(null, () => (l ? String(l.getJSON()).length : null)),

		// -- time conversion (instance method + the seed's own static) --
		tts: (t: number) => safe(ERR, () => (l ? normalise(l.timeToString(t)) : ERR)),
		tts3: (t: number) => safe(ERR, () => (l ? normalise(l.timeToString(t, 3)) : ERR)),
		tti: (s: string) =>
			safe(null, () => {
				if (!l || !l.constructor || typeof l.constructor.timeToInt !== 'function') return null
				return normalise(l.constructor.timeToInt(s))
			}),

		// -- lookup / current-line views --
		findIndex: (ts: number) => safe(null, () => (l ? normalise(l.findIndex(ts)) : null)),
		currentData: (ts: number) =>
			safe(null, () => {
				if (!l) return null
				const c = l.currentLine(ts)
				return c ? normalise(c.data) : null
			}),
		currentTime: (ts: number) =>
			safe(null, () => {
				if (!l) return null
				const c = l.currentLine(ts)
				return c ? normalise(c.time) : null
			}),
		idFromIndex: (i: number) => safe(null, () => (l ? normalise(l.getIdFromIndex(i)) : null)),
		indexFromId: (id: string) => safe(null, () => (l ? normalise(l.getIndexFromId(id)) : null)),
		hasId: (id: string) => safe(false, () => (l ? l.has(id) === true : false)),
		lastId: () => rememberedId,

		// -- the seed's own EMPTY_LINE contract --
		emptyLineTime: () => safe(null, () => (l ? normalise(l.EMPTY_LINE.time) : null)),
		emptyLineData: () => safe(ERR, () => (l ? normalise(l.EMPTY_LINE.data) : ERR)),

		// -- page-error counter --
		pageErrorCount: () => safe(null, () => pageErrorCount),

		// -- DOM views (no locator is ever needed by a checkpoint) --
		domTitle: () => safe(ERR, () => String(document.title)),
		domButtons: () => safe(null, () => document.querySelectorAll('button').length),
		domLinks: () => safe(null, () => document.querySelectorAll('a').length),
		domSvg: () => safe(null, () => document.querySelectorAll('svg').length),
		domAppChildren: () =>
			safe(null, () => {
				const el = document.getElementById('app')
				return el ? el.childElementCount : null
			}),
		domBodyTextLen: () => safe(null, () => (document.body ? document.body.innerText.length : null)),
		domBodyHasText: (s: string) =>
			safe(false, () => {
				if (!document.body) return false
				const raw = document.body.innerText || ''
				if (raw.indexOf(s) >= 0) return true
				return raw.replace(/\s+/g, ' ').indexOf(String(s).replace(/\s+/g, ' ')) >= 0
			}),
		externalStylesheetLinks: () =>
			safe(null, () => {
				const nodes = document.querySelectorAll('link[href]')
				let n = 0
				for (let i = 0; i < nodes.length; i++) {
					const href = String(nodes[i].getAttribute('href') || '')
					if (href.indexOf('fonts.googleapis') >= 0 || href.indexOf('fonts.gstatic') >= 0) n++
				}
				return n
			}),
		gtagLiteralPresent: () =>
			safe(false, () => {
				if (!document.body) return false
				return String(document.body.innerText || '').indexOf('%VITE_GTAG%') >= 0
			}),

		// -- state-isolation residue views (storage / URL) --
		lsLen: () => safe(null, () => window.localStorage.length),
		ssLen: () => safe(null, () => window.sessionStorage.length),
		cookieLen: () => safe(null, () => String(document.cookie || '').length),
		locPath: () => safe(ERR, () => String(window.location.pathname)),
		locHash: () => safe(ERR, () => String(window.location.hash)),

		// -- same-origin probe result (armed by __LR_CMD__.probeUrl) --
		urlPath: () => lastUrlPath,
		urlStatus: () => lastUrlStatus,
		urlError: () => lastUrlError,
	}

	return snap
}

/** The command surface: index-addressed, side effects live here and only here. */
const commands: Record<string, any> = {
	parse: (text: string) => command('parse', (l) => l.parse(String(text))),
	resetNow: () => command('resetNow', (l) => l.reset(true)),
	addLine: (data: string, time?: number) =>
		command('addLine', (l) => (typeof time === 'number' ? l.add({ data: String(data), time }) : l.add({ data: String(data) }))),
	addAfterIndex: (i: number, data: string, time?: number) =>
		command('addAfterIndex', (l) => {
			const k = keyAt(i)
			if (k === null) throw new Error('no line at index ' + i)
			return l.addAfter(k, typeof time === 'number' ? { data: String(data), time } : { data: String(data) })
		}),
	addBeforeIndex: (i: number, data: string, time?: number) =>
		command('addBeforeIndex', (l) => {
			const k = keyAt(i)
			if (k === null) throw new Error('no line at index ' + i)
			return l.addBefore(k, typeof time === 'number' ? { data: String(data), time } : { data: String(data) })
		}),
	updateDataIndex: (i: number, data: string) =>
		command('updateDataIndex', (l) => {
			const k = keyAt(i)
			if (k === null) throw new Error('no line at index ' + i)
			return l.update(k, { data: String(data) })
		}),
	updateTimeIndex: (i: number, time: number) =>
		command('updateTimeIndex', (l) => {
			const k = keyAt(i)
			if (k === null) throw new Error('no line at index ' + i)
			return l.update(k, { time: Number(time) })
		}),
	removeIndex: (i: number) =>
		command('removeIndex', (l) => {
			const k = keyAt(i)
			if (k === null) throw new Error('no line at index ' + i)
			return l.remove(k)
		}),
	removeLast: () =>
		command('removeLast', (l) => {
			const keys = Array.isArray(l._cachedKeys) ? l._cachedKeys : []
			const k = keys.length ? keys[keys.length - 1] : null
			if (typeof k !== 'string') throw new Error('no last line')
			return l.remove(k)
		}),
	addTagNow: (k: string, v: string) => command('addTagNow', (l) => l.addTag(String(k), String(v))),
	rememberLastId: () =>
		command('rememberLastId', (l) => {
			const keys = Array.isArray(l._cachedKeys) ? l._cachedKeys : []
			const k = keys.length ? keys[keys.length - 1] : null
			if (typeof k !== 'string') throw new Error('no last line to remember')
			rememberedId = k
			return k
		}),
	lastId: () => rememberedId,
	capturePageErrors: () => {
		installErrorHooks()
		return pageErrorCount
	},
	resetPageErrors: () => {
		pageErrorCount = 0
		return pageErrorCount
	},
	/** Same-origin fetch used by the i18n-availability guard; stores the status. */
	probeUrl: async (p: string) => {
		lastUrlPath = String(p)
		lastUrlStatus = null
		lastUrlError = null
		try {
			const res = await fetch(String(p), { cache: 'no-store' })
			lastUrlStatus = res.status
		} catch (e: any) {
			lastUrlStatus = null
			lastUrlError = String((e && e.message) || e).slice(0, 200)
		}
		lastCmdOk = lastUrlStatus !== null
		lastCmdError = lastUrlStatus === null ? 'probeUrl: ' + lastUrlError : null
		return lastUrlStatus
	},
}

try {
	W.__LR__ = snapshot
	W.__LR_CMD__ = commands
} catch {
	/* the probe must never break the application */
}

export {}
