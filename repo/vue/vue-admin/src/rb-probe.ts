/**
 * rb-probe.ts - RepairBench measurement probe for instance repair-vue__vue-admin-01.
 *
 * Installed by environment/instrumentation.patch as the FIRST module of src/main.ts, so it is evaluated
 * before main.ts:3 `./utils/plugins` pulls in @/router -> @/store (store/index.ts:44 instantiates the whole
 * store at module-evaluation time, and store/User.ts:36-42 reads the session out of document.cookie right
 * there). That ordering is the whole point of leg (A) below.
 *
 * This file is measurement scaffolding. It is deliberately written as dependency-free, side-effect-scoped
 * JavaScript inside a TS module so that it cannot fail to bundle, cannot throw at evaluation time, and
 * cannot change any application behaviour other than the documented cookie it seeds and the persistent
 * storage it clears. It renders NOTHING and adds ZERO data-testid attributes. Every value it publishes is
 * read back through a getter that returns a STRING, because evaluation/dsl_runner.mjs compares assert
 * results loosely against string expectations.
 *
 * Legs:
 *   (A) offline session bootstrap - writes the "ModuleUser" cookie that store/User.ts:37 getCookie() reads,
 *       carrying a non-empty token and type 0. permission.ts:143 gates every route on `store.user.info.token`
 *       and :181-183 redirects to /login without it; permission.ts:37-41 keeps a route whose `meta.auth`
 *       contains the user type, and router/static.ts:154 gives the project-link route `auth: [0]`, so type 0
 *       is the ONLY value that makes the registered route set (and the 13-link sidebar census P05/P16 read)
 *       identical in every tree. The seed itself proves raw JSON is a valid cookie value here:
 *       store/User.ts:50 does `setCookie(cacheName, JSON.stringify(this.info), ...)`.
 *       The login screen is therefore never needed. It is also offline-solvable if ever wanted: login() at
 *       api/common.ts:64-98 is a documented mock (comment 模拟登录 at :65) that resolves from a setTimeout
 *       with zero network, and accepts the accounts "admin" / "normal" - F11 drives it for real.
 *   (B) state isolation - localStorage and sessionStorage are wiped at every boot and the PRE-wipe key set
 *       is recorded, so "no residue from a previous run" is a measurement (P19/P21) rather than an assumption.
 *       The application's own key set is fixed by the seed: sessionStorage ModuleLayout (store/Layout.ts:6),
 *       admin-system-logout (:8), theme-diy-style (views/example/home.vue:85), localStorage login-info
 *       (views/login.vue:9).
 *   (C) egress census - a buffered PerformanceObserver over `resource` entries plus wrappers on fetch,
 *       XMLHttpRequest.open, navigator.sendBeacon and window.open. The observer is the authoritative census:
 *       `data:` and `blob:` URLs are not network activity and are skipped, so once
 *       environment/adaptation.patch has replaced every remote media literal with one inert data URI and
 *       unhooked @iconify/vue at its single wrapper (components/Icon/index.vue:13), the cross-origin count is
 *       structurally 0. The same-origin count is the positive control that proves the observer is running at
 *       all (the bundle's own chunks, css and favicon.ico are same-origin resources).
 *   (D) boot / error scalars for the offline-contract checkpoints.
 */

var RB_VERSION = "vue-admin-rb-probe-1";
var RB_APP_KEYS = ["ModuleLayout", "admin-system-logout", "theme-diy-style", "login-info"];
var RB_COOKIE = "ModuleUser";
var RB_TOKEN = "rb-offline-session";
var RB_USER = {
	id: "rb-offline",
	name: "rb",
	type: 0,
	token: RB_TOKEN,
	avatar: "",
	account: "rb",
	password: ""
};

var rb: any = {
	version: RB_VERSION,
	bootState: "pending",
	bootError: "",
	preBootLocal: [],
	preBootSession: [],
	foreignKeys: [],
	seedState: "no",
	cookieState: "no",
	fetchCalls: 0,
	xhrCalls: 0,
	beaconCalls: 0,
	openCalls: 0,
	crossOriginFetch: 0,
	crossOriginXhr: 0,
	resourceCross: 0,
	resourceSame: 0,
	resourceOther: 0,
	observer: "false",
	scriptErrors: 0,
	resourceErrors: 0,
	rejections: 0,
	hashAtBoot: ""
};

function rbHostOf(u: any): string {
	try {
		var s = typeof u === "string" ? u : (u && (u.url || u.href)) || "";
		if (!/^[a-z][a-z0-9+.-]*:/i.test(s) && s.charAt(0) !== "/") { s = "/" + s; }
		var h = new URL(s, location.href).host;
		return String(h || "");
	} catch (e) {
		return "";
	}
}

function rbIsForeign(u: any): boolean {
	var h = rbHostOf(u);
	return !!h && h !== location.host;
}

try {
	// ---- (B) residue census BEFORE anything is cleared or seeded ----
	try { rb.preBootLocal = Object.keys(window.localStorage); } catch (e) { rb.preBootLocal = []; }
	try { rb.preBootSession = Object.keys(window.sessionStorage); } catch (e) { rb.preBootSession = []; }
	rb.foreignKeys = rb.preBootLocal.concat(rb.preBootSession).filter(function (k: string) { return RB_APP_KEYS.indexOf(k) === -1; });
	try { window.localStorage.clear(); } catch (e) { /* private mode: nothing to clear */ }
	try { window.sessionStorage.clear(); } catch (e) { /* ditto */ }

	// ---- (A) offline session ----
	rb.hashAtBoot = String(location.hash || "");
	var had = "";
	try {
		var parts = ("; " + document.cookie).split("; " + RB_COOKIE + "=");
		if (parts.length >= 2) { had = String(parts.pop() || "").split(";").shift() || ""; }
	} catch (e) { had = ""; }
	var hadToken = false;
	try { hadToken = !!(had && JSON.parse(had) && JSON.parse(had).token); } catch (e) { hadToken = false; }
	try {
		document.cookie = RB_COOKIE + "=" + JSON.stringify(RB_USER) + "; path=/";
		rb.cookieState = "written";
		rb.seedState = hadToken ? "present" : "yes";
	} catch (e) {
		rb.cookieState = "blocked:" + String((e && (e as any).message) || e).slice(0, 60);
		rb.seedState = "no";
	}

	// ---- (C) egress census: resource timing is the authoritative channel ----
	try {
		if (typeof PerformanceObserver === "function") {
			var po = new PerformanceObserver(function (list: any) {
				var es = list.getEntries() || [];
				for (var i = 0; i < es.length; i++) {
					var n = String(es[i].name || "");
					if (!n) { continue; }
					if (!/^https?:/i.test(n)) { rb.resourceOther++; continue; }
					var h = rbHostOf(n);
					if (h && h !== location.host) { rb.resourceCross++; } else { rb.resourceSame++; }
				}
			});
			po.observe({ type: "resource", buffered: true });
			rb.observer = "true";
		} else {
			rb.observer = "unsupported";
		}
	} catch (e) {
		rb.observer = "threw:" + String((e && (e as any).message) || e).slice(0, 60);
	}

	try {
		if (typeof window.fetch === "function") {
			var origFetch = window.fetch;
			(window as any).fetch = function (input: any, init: any) {
				rb.fetchCalls++;
				if (rbIsForeign(input)) { rb.crossOriginFetch++; }
				return origFetch.apply(this, arguments as any);
			};
		}
	} catch (e) { /* wrapper is best-effort; the observer above is the authority */ }

	try {
		var XP: any = (window as any).XMLHttpRequest && (window as any).XMLHttpRequest.prototype;
		if (XP && typeof XP.open === "function") {
			var origOpen = XP.open;
			XP.open = function (method: any, url: any) {
				rb.xhrCalls++;
				if (rbIsForeign(url)) { rb.crossOriginXhr++; }
				return origOpen.apply(this, arguments);
			};
		}
	} catch (e) { /* ditto */ }

	try {
		var nav: any = (window as any).navigator;
		if (nav && typeof nav.sendBeacon === "function") {
			var origBeacon = nav.sendBeacon;
			nav.sendBeacon = function (url: any) {
				rb.beaconCalls++;
				return origBeacon.apply(this, arguments as any);
			};
		}
	} catch (e) { /* ditto */ }

	try {
		if (typeof window.open === "function") {
			var origOpenWin = window.open;
			window.open = function () {
				rb.openCalls++;
				return origOpenWin.apply(this, arguments as any);
			};
		}
	} catch (e) { /* ditto */ }

	// ---- (D) error / rejection scalars ----
	window.addEventListener("error", function (ev: any) {
		if (ev && typeof ev.message === "string" && ev.message) { rb.scriptErrors++; } else { rb.resourceErrors++; }
	}, true);
	window.addEventListener("unhandledrejection", function () { rb.rejections++; });

	rb.bootState = "ok";
} catch (e) {
	rb.bootState = "threw";
	rb.bootError = String((e && (e as any).message) || e).slice(0, 120);
}

// ---- published surface: EVERY getter returns a STRING ----
function rbNum(n: any): string { return String(Number(n) || 0); }

(window as any).__rb = {
	/** probe build literal; must equal the version this face declares */
	version: function (): string { return String(rb.version); },
	/** "ok" unless the probe itself threw during boot */
	boot: function (): string { return String(rb.bootState); },
	/** the boot error message, empty when boot === "ok" */
	bootError: function (): string { return String(rb.bootError || ""); },
	/** "yes" = the probe seeded the offline session, "present" = a session cookie was already there */
	seeded: function (): string { return String(rb.seedState); },
	/** "written" when the ModuleUser cookie assignment succeeded */
	cookieSeeded: function (): string { return String(rb.cookieState === "written" ? "true" : "false"); },
	/** "none", or "foreign:<keys>" for every boot-time storage key the application does not own */
	foreignResidue: function (): string { return rb.foreignKeys.length ? "foreign:" + rb.foreignKeys.join(",") : "none"; },
	/** how many storage keys existed at boot, before the probe cleared anything */
	bootKeys: function (): string { return rbNum(rb.preBootLocal.length + rb.preBootSession.length); },
	/** live storage key count (localStorage + sessionStorage) */
	storageKeyCount: function (): string {
		var n = 0;
		try { n += window.localStorage.length; } catch (e) { /* ignore */ }
		try { n += window.sessionStorage.length; } catch (e) { /* ignore */ }
		return rbNum(n);
	},
	/** cross-origin resource entries seen by the buffered PerformanceObserver */
	crossOrigin: function (): string { return rbNum(rb.resourceCross); },
	/** same-origin resource entries - the positive control that proves the observer is running */
	sameOrigin: function (): string { return rbNum(rb.resourceSame); },
	/** "true" once at least one same-origin resource has been observed */
	sameOriginPresent: function (): string { return String(rb.resourceSame > 0 ? "true" : "false"); },
	/** non-network resource entries (data:/blob:), counted so the census adds up */
	otherResources: function (): string { return rbNum(rb.resourceOther); },
	/** total resource entries seen */
	resourceCount: function (): string { return rbNum(rb.resourceCross + rb.resourceSame + rb.resourceOther); },
	/** "true" when the PerformanceObserver registered */
	observerActive: function (): string { return String(rb.observer === "true" ? "true" : "false"); },
	/** observer registration detail, for diagnosing a false "false" */
	observerState: function (): string { return String(rb.observer); },
	fetchCalls: function (): string { return rbNum(rb.fetchCalls); },
	xhrCalls: function (): string { return rbNum(rb.xhrCalls); },
	beaconCalls: function (): string { return rbNum(rb.beaconCalls); },
	windowOpenCalls: function (): string { return rbNum(rb.openCalls); },
	/** cross-origin ATTEMPTS through the wrapped transports (0 once the adaptation has landed) */
	crossOriginAttempts: function (): string { return rbNum(rb.crossOriginFetch + rb.crossOriginXhr); },
	/** uncaught exceptions (events carrying a message) */
	errors: function (): string { return rbNum(rb.scriptErrors); },
	/** resource load failures (error events with no message) - 0 because every remote literal is a data URI */
	resourceErrors: function (): string { return rbNum(rb.resourceErrors); },
	rejections: function (): string { return rbNum(rb.rejections); },
	/** location.hash as seen at probe evaluation time */
	hashAtBoot: function (): string { return String(rb.hashAtBoot || ""); },
	/** the number of getters this probe publishes, so a truncated probe cannot pass silently */
	getterCount: function (): string {
		var n = 0;
		var api = (window as any).__rb;
		for (var k in api) { if (typeof api[k] === "function") { n++; } }
		return rbNum(n);
	}
};
