/**
 * rb-probe.js - RepairBench measurement probe for instance repair-vue__admin_vue3_vite-01.
 *
 * Installed by environment/instrumentation.patch as the FIRST module of src/main.js, so it is
 * evaluated before ./store (main.js:3) and before ./permission (main.js:8). That ordering is the
 * whole point of leg (A) below.
 *
 * This file is measurement scaffolding. It is deliberately written in dependency-free ES5-style
 * JavaScript inside an ES module so that it cannot fail to bundle, cannot throw at evaluation time,
 * and cannot change any application behaviour other than the two documented localStorage keys it
 * seeds. Every value it publishes is read back through a getter that returns a STRING, because
 * evaluation/dsl_runner.mjs compares assert results loosely against string expectations.
 *
 * Legs:
 *   (A) offline session bootstrap - seeds localStorage.token and localStorage.userInfo before
 *       src/store/modules/user.js:13 (`token: getItem(TOKEN) || ""`) is evaluated, so the router
 *       guard at src/permission.js:25 (`if (store.getters.token)`) admits the run and :29-40 goes
 *       on to register the private routes from the baked-in mock permission payload. The seed's
 *       captcha/login screen is therefore never needed and never touched; src/mock/index.js:19-30
 *       hands the captcha back in clear text and :33-48 accepts any credentials, so the interactive
 *       route would also have been offline-solvable - it is documented, not used, because a
 *       Math.random()-derived captcha is not reproducible across runs.
 *   (B) egress census - a buffered PerformanceObserver over `resource` entries plus wrappers on
 *       fetch / XMLHttpRequest.open / navigator.sendBeacon / window.open. The observer is the
 *       authoritative census: `data:` and `blob:` URLs are not network activity and are skipped, so
 *       once environment/adaptation.patch has replaced every remote media URL with an inert data URI
 *       the cross-origin count is structurally 0. The same-origin count is the positive control that
 *       proves the observer is actually running (the bundle's own chunks are same-origin resources).
 *       Note that mockjs intercepts XHR inside the browser, so the mock's /Index/* and /adminAuth/*
 *       calls legitimately produce NO resource entries at all - that is expected and is why the
 *       positive control counts static assets rather than API calls.
 *   (C) boot / residue / error scalars for the offline-contract checkpoints.
 *
 * The avatar literal below ships as an inert-avatar TOKEN (the double-underscored placeholder on the
 * avatar: line below), which face/gen_all.mjs substitutes with ledger.INERT_DATA_URI - the same derived 1x1
 * transparent GIF89a (43 bytes) that environment/adaptation.patch uses for every remote image - so the seeded
 * userInfo can never introduce an egress the census would then have to explain. Shipping a token rather than a
 * pasted base64 string is what keeps that single-sourced: gen_all.mjs throws unless the substitution happens
 * exactly once and the result re-decodes to 43 GIF89a bytes.
 *
 * The probe never writes any localStorage key outside the application's own key set
 * (src/constant/index.js:18,20,22,26,28,32), and it publishes the pre-seed key census so that
 * claim is checkable rather than asserted.
 */

var RB_APP_KEYS = ["token", "userInfo", "timeStamp", "language", "mainColor", "tagsView"];
var RB_TOKEN = "rb-offline-session";
var RB_USERINFO = {
	id: "1",
	admin_nick_name: "程序员三千",
	avatar: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
	sys_token: RB_TOKEN
};

var rb = {
	version: "admin-vue3-vite-rb-probe-1",
	bootState: "pending",
	bootError: "",
	preSeedKeys: [],
	foreignKeys: [],
	seeded: "no",
	crossOrigin: 0,
	sameOrigin: 0,
	crossOriginSamples: [],
	wrappedFetchCalls: 0,
	wrappedXhrCrossOrigin: 0,
	beaconCalls: 0,
	windowOpenCalls: 0,
	observerActive: "no",
	uncaughtErrors: 0,
	unhandledRejections: 0,
	errorSamples: []
};

function rbSafe(fn, fallback) {
	try {
		return fn();
	} catch (e) {
		return fallback;
	}
}

function rbStore() {
	return rbSafe(function () { return window.localStorage; }, null);
}

function rbIsNetworkUrl(u) {
	return typeof u === "string" && /^https?:/i.test(u);
}

function rbIsCrossOrigin(u) {
	return rbSafe(function () {
		if (!rbIsNetworkUrl(u)) return false;
		return new URL(u, window.location.href).origin !== window.location.origin;
	}, false);
}

function rbSample(u) {
	if (rb.crossOriginSamples.length < 20) {
		rb.crossOriginSamples.push(String(u).slice(0, 240));
	}
}

function rbCountResource(u) {
	if (!rbIsNetworkUrl(u)) return; // data:, blob:, about: and relative-to-nothing are not egress
	if (rbIsCrossOrigin(u)) {
		rb.crossOrigin += 1;
		rbSample(u);
	} else {
		rb.sameOrigin += 1;
	}
}

// ------------------------------------------------------------------ (C) boot census, then (A) seed
rbSafe(function () {
	var store = rbStore();
	if (!store) { rb.bootError = "localStorage-unavailable"; return; }
	rb.preSeedKeys = Object.keys(store);
	rb.foreignKeys = rb.preSeedKeys.filter(function (k) { return RB_APP_KEYS.indexOf(k) === -1; });

	// Seed only when absent so that a checkpoint which deliberately empties storage and reloads gets
	// a clean, reproducible session, while a checkpoint which inspects post-logout residue is never
	// re-seeded (no reload happens during logout, so this code does not run again there).
	if (!store.getItem("token")) {
		store.setItem("token", RB_TOKEN);
		store.setItem("userInfo", JSON.stringify(RB_USERINFO));
		rb.seeded = "yes";
	} else {
		rb.seeded = "present";
	}
	rb.bootState = "ok";
});

// ------------------------------------------------------------------ (B) egress census
rbSafe(function () {
	if (typeof PerformanceObserver !== "function") return;
	var po = new PerformanceObserver(function (list) {
		rbSafe(function () {
			var entries = list.getEntries();
			for (var i = 0; i < entries.length; i++) rbCountResource(entries[i] && entries[i].name);
		}, null);
	});
	// buffered:true so the assets that were already fetched before this module ran are still counted
	po.observe({ type: "resource", buffered: true });
	rb.observerActive = "yes";
});

rbSafe(function () {
	if (typeof window.fetch !== "function") return;
	var originalFetch = window.fetch;
	window.fetch = function (input) {
		rb.wrappedFetchCalls += 1;
		rbSafe(function () {
			var u = typeof input === "string" ? input : (input && input.url);
			if (rbIsCrossOrigin(u)) { rb.crossOrigin += 1; rbSample(u); }
		}, null);
		return originalFetch.apply(this, arguments);
	};
});

rbSafe(function () {
	if (!window.XMLHttpRequest || !window.XMLHttpRequest.prototype) return;
	var originalOpen = window.XMLHttpRequest.prototype.open;
	window.XMLHttpRequest.prototype.open = function (method, url) {
		rbSafe(function () {
			if (rbIsCrossOrigin(url)) { rb.wrappedXhrCrossOrigin += 1; rb.crossOrigin += 1; rbSample(url); }
		}, null);
		return originalOpen.apply(this, arguments);
	};
});

rbSafe(function () {
	if (!window.navigator || typeof window.navigator.sendBeacon !== "function") return;
	var originalBeacon = window.navigator.sendBeacon;
	window.navigator.sendBeacon = function (url) {
		rb.beaconCalls += 1;
		rbSafe(function () { if (rbIsCrossOrigin(url)) { rb.crossOrigin += 1; rbSample(url); } }, null);
		return originalBeacon.apply(this, arguments);
	};
});

rbSafe(function () {
	if (typeof window.open !== "function") return;
	var originalOpen = window.open;
	window.open = function (url) {
		rb.windowOpenCalls += 1;
		rbSafe(function () { if (rbIsCrossOrigin(url)) { rb.crossOrigin += 1; rbSample(url); } }, null);
		return originalOpen.apply(this, arguments);
	};
});

// ------------------------------------------------------------------ (C) error census
// capture:false on purpose - element/media resource load failures fire non-bubbling `error` events
// that would otherwise be counted as application faults. Only genuinely uncaught JavaScript is
// counted here, which is what the offline-contract checkpoints care about.
rbSafe(function () {
	window.addEventListener("error", function (ev) {
		rb.uncaughtErrors += 1;
		if (rb.errorSamples.length < 10) rb.errorSamples.push(String((ev && ev.message) || "error").slice(0, 200));
	});
	window.addEventListener("unhandledrejection", function (ev) {
		rb.unhandledRejections += 1;
		if (rb.errorSamples.length < 10) {
			rb.errorSamples.push("rejection:" + String((ev && ev.reason) || "").slice(0, 180));
		}
	});
});

// ------------------------------------------------------------------ string-only public surface
rbSafe(function () {
	Object.defineProperty(window, "__rb", {
		configurable: true,
		enumerable: false,
		value: {
			version: function () { return String(rb.version); },
			boot: function () { return String(rb.bootState); },
			bootError: function () { return String(rb.bootError || "none"); },
			seeded: function () { return String(rb.seeded); },
			// keys present at boot that the application itself does not own
			foreignResidue: function () {
				return rb.foreignKeys.length ? rb.foreignKeys.join(",") : "none";
			},
			bootKeys: function () { return rb.preSeedKeys.length ? rb.preSeedKeys.join(",") : "none"; },
			crossOrigin: function () { return String(rb.crossOrigin); },
			sameOrigin: function () { return String(rb.sameOrigin); },
			sameOriginPresent: function () { return rb.sameOrigin > 0 ? "true" : "false"; },
			crossOriginSamples: function () {
				return rb.crossOriginSamples.length ? rb.crossOriginSamples.join(" | ") : "none";
			},
			observerActive: function () { return String(rb.observerActive); },
			wrappedFetchCalls: function () { return String(rb.wrappedFetchCalls); },
			wrappedXhrCrossOrigin: function () { return String(rb.wrappedXhrCrossOrigin); },
			beaconCalls: function () { return String(rb.beaconCalls); },
			windowOpenCalls: function () { return String(rb.windowOpenCalls); },
			errors: function () { return String(rb.uncaughtErrors); },
			rejections: function () { return String(rb.unhandledRejections); },
			errorSamples: function () {
				return rb.errorSamples.length ? rb.errorSamples.join(" | ") : "none";
			},
			// the app's own storage keys right now (used by the logout-residue checkpoint family)
			storageKeys: function () {
				return rbSafe(function () {
					var k = Object.keys(window.localStorage);
					return k.length ? k.join(",") : "none";
				}, "unavailable");
			},
			storageKeyCount: function () {
				return rbSafe(function () { return String(Object.keys(window.localStorage).length); }, "-1");
			}
		}
	});
});

export default rb;
