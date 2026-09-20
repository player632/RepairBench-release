/**
 * rb-probe.ts - read-only observation bridge for the RepairBench design face of
 * this SvelteKit app. Published on window.__pf by src/routes/+layout.ts (one added
 * import line, no markup and no template change anywhere in the tree).
 *
 * Discipline (mirrors the delivered report-editor probe):
 *  - READ ONLY. It calls the app's own exported pure functions with literal
 *    arguments and reads the DOM/location/web-storage. It never writes app state,
 *    never dispatches events, never navigates, never touches the network and adds
 *    0 data-testid attributes (the vocabulary scan in repair_bench/tools/scans.mjs
 *    derives its term list from exactly that promise).
 *  - EVERY getter degrades to a sentinel instead of throwing: '-' for strings,
 *    -1 for numbers, 'none' for null/undefined. A checkpoint can therefore only
 *    fail on a measured value, never on a broken bridge - which is what keeps a
 *    serve/build geometry error visible as an all-red face instead of a false green.
 *  - Runes compatible by construction: this is a plain .ts module (the project's
 *    svelte.config.js forces runes mode on every non-node_modules file, so the old
 *    `export let` component syntax would not compile here). No component is defined.
 *  - The build version stamp (kit.version.name, injected from PUBLIC_APP_VERSION) is
 *    deliberately NOT exposed as a readable string: shouldReloadSelf() compares
 *    against it internally and returns a boolean only, so no checkpoint can measure
 *    the environment instead of the source.
 */
import { tapAction, isOnDeviceKiosk } from '$lib/slideNav';
import { arrayMove, moveUp, moveDown, moveToStart, moveToEnd } from '$lib/reorder';
import { toSeconds, formatDuration, DURATION_STOPS } from '$lib/duration';
import { loginRedirectTarget } from '$lib/auth';
import { REPO_URL, DOCS_URL, MANUAL_URL } from '$lib/links';
import { CROP_RATIOS, getCropRatio } from '$lib/uploadPrefs';
import { shouldReload } from '$lib/versionReload.svelte';
import { version as buildVersion } from '$app/environment';
import { signalLevel, isWPA3Only, networkTile } from '$lib/wifi';
import { formatSensorValue, isSensorStale, timezoneOffsetLabel } from '$lib/helpers';
import {
	overlayShift,
	overlayShiftPair,
	SHIFT_X_REM,
	SHIFT_Y_REM
} from '../routes/kiosk/components/overlayShift';
import { weatherIconFor, METEOCONS } from '../routes/kiosk/components/weather-icons';
import { sectionFromDetail } from '../routes/admin/settings/validate';

const PROBE_VERSION = 'rb-probe/picture-frame/1';
const STR_SENTINEL = '-';
const NUM_SENTINEL = -1;
const NULL_SENTINEL = 'none';

function str(fn: () => unknown): string {
	try {
		const v = fn();
		return typeof v === 'string' ? v : STR_SENTINEL;
	} catch {
		return STR_SENTINEL;
	}
}

function strOrNull(fn: () => unknown): string {
	try {
		const v = fn();
		if (v === null || v === undefined) return NULL_SENTINEL;
		return typeof v === 'string' ? v : STR_SENTINEL;
	} catch {
		return STR_SENTINEL;
	}
}

function num(fn: () => unknown): number {
	try {
		const v = fn();
		return typeof v === 'number' && Number.isFinite(v) ? v : NUM_SENTINEL;
	} catch {
		return NUM_SENTINEL;
	}
}

function bool(fn: () => unknown): boolean | string {
	try {
		const v = fn();
		return v === true || v === false ? v : STR_SENTINEL;
	} catch {
		return STR_SENTINEL;
	}
}

function list(csv: string): string[] {
	return typeof csv === 'string' && csv.length ? csv.split(',') : [];
}

// Fixed literal states so networkTile() can be read without a backend: the frame's
// own WiFi state is a server payload, and the bridge must not fetch one.
const TILE_SPECS: Record<string, unknown> = {
	none: null,
	ethernet: { mode: 'ethernet', ip: '10.0.0.9', ssid: '', ap_ssid: '' },
	ap: { mode: 'ap', ip: '', ssid: '', ap_ssid: 'FrameHotspot' },
	connected: { mode: 'connected', ip: '10.0.0.5', ssid: 'HomeNet', ap_ssid: '' },
	connecting: { mode: 'connecting', ip: '', ssid: '', ap_ssid: '' },
	disconnected: { mode: 'disconnected', ip: '', ssid: '', ap_ssid: '' }
};

function minuteDate(minute: number): Date {
	const m = Number.isFinite(minute) ? Math.trunc(minute) : 0;
	return new Date(2026, 0, 1, 10, m, 0, 0);
}

const bridge = {
	probeVersion: PROBE_VERSION,

	// --- slideshow tap routing (src/lib/slideNav.ts) ---
	tapAction: (zone: string, busy: boolean, screenOff: boolean): string =>
		strOrNull(() =>
			tapAction(zone === 'left' ? 'left' : 'right', { busy: busy === true, screenOff: screenOff === true })
		),
	onDeviceKiosk: (hostname: string): boolean | string => bool(() => isOnDeviceKiosk(String(hostname))),

	// --- manual ordering (src/lib/reorder.ts) ---
	moveJoin: (csv: string, kind: string, index: number): string =>
		str(() => {
			const items = list(csv);
			const i = Number(index);
			const out =
				kind === 'down'
					? moveDown(items, i)
					: kind === 'start'
						? moveToStart(items, i)
						: kind === 'end'
							? moveToEnd(items, i)
							: moveUp(items, i);
			return out.join(',');
		}),
	arrayMoveJoin: (csv: string, from: number, to: number): string =>
		str(() => arrayMove(list(csv), Number(from), Number(to)).join(',')),
	arrayMoveLen: (csv: string, from: number, to: number): number =>
		num(() => arrayMove(list(csv), Number(from), Number(to)).length),

	// --- Go-style durations (src/lib/duration.ts) ---
	toSeconds: (d: string): number => num(() => toSeconds(String(d))),
	formatDuration: (d: string, zero: string): string =>
		str(() => formatDuration(String(d), String(zero))),
	stops: (field: string): string =>
		str(() => (DURATION_STOPS as Record<string, string[]>)[String(field)].join(',')),
	stopsLen: (field: string): number =>
		num(() => (DURATION_STOPS as Record<string, string[]>)[String(field)].length),
	stopAt: (field: string, i: number): string =>
		str(() => (DURATION_STOPS as Record<string, string[]>)[String(field)][Number(i)] ?? ''),

	// --- 401 routing decision (src/lib/auth.ts) ---
	redirectTarget: (status: number, url: string, pathname: string, search: string): string =>
		strOrNull(() =>
			loginRedirectTarget({ status: Number(status), url: String(url) }, String(pathname), String(search))
		),

	// --- canonical outbound links (src/lib/links.ts) ---
	repoUrl: (): string => str(() => REPO_URL),
	docsUrl: (): string => str(() => DOCS_URL),
	manualUrl: (): string => str(() => MANUAL_URL),
	manualTail: (): boolean | string => bool(() => MANUAL_URL.endsWith('/manual/dashboard/')),
	manualDiffersFromDocs: (): boolean | string => bool(() => MANUAL_URL !== DOCS_URL),

	// --- cropper preference (src/lib/uploadPrefs.ts) ---
	cropIds: (): string => str(() => CROP_RATIOS.map((r) => r.id).join(',')),
	cropLen: (): number => num(() => CROP_RATIOS.length),
	cropDefaultId: (): string => str(() => getCropRatio().id),
	cropShape: (id: string): string =>
		str(() => {
			const r = CROP_RATIOS.find((x) => x.id === String(id));
			return r ? r.w + 'x' + r.h : STR_SENTINEL;
		}),

	// --- bundle/backend version gate (src/lib/versionReload.svelte.ts) ---
	shouldReload: (backend: string, last: number, now: number): boolean | string =>
		bool(() => shouldReload(String(backend), Number(last), Number(now))),
	shouldReloadSelf: (last: number, now: number): boolean | string =>
		bool(() => shouldReload(buildVersion, Number(last), Number(now))),

	// --- OLED overlay orbit (src/routes/kiosk/components/overlayShift.ts) ---
	overlayXY: (minute: number): string =>
		str(() => {
			const p = overlayShift(minuteDate(Number(minute)));
			return p.x + '|' + p.y;
		}),
	overlayPair: (minute: number, rootPx: number, portrait: boolean): string =>
		str(() => {
			const p = overlayShiftPair(minuteDate(Number(minute)), Number(rootPx), portrait === true);
			return p.lead + '|' + p.trail;
		}),
	shiftAmps: (): string => str(() => SHIFT_X_REM + '|' + SHIFT_Y_REM),

	// --- weather icon map (src/routes/kiosk/components/weather-icons.ts) ---
	iconEq: (a: string, b: string): boolean | string =>
		bool(() => weatherIconFor(String(a)) === weatherIconFor(String(b))),
	iconKeyCount: (): number => num(() => Object.keys(METEOCONS).length),

	// --- network readings (src/lib/wifi.ts) ---
	signalLevel: (v: number): number => num(() => signalLevel(Number(v))),
	wpa3Only: (sec: string): boolean | string => bool(() => isWPA3Only(String(sec))),
	tile: (spec: string): string =>
		str(() => {
			const t = networkTile(TILE_SPECS[String(spec)] as never);
			return [t.label, t.value, t.sub ?? NULL_SENTINEL, t.icon, t.tone].join('|');
		}),

	// --- settings 422 routing (src/routes/admin/settings/validate.ts) ---
	section: (detail: string): string => strOrNull(() => sectionFromDetail(String(detail))),

	// --- sensor + zone formatting (src/lib/helpers.ts) ---
	sensorValue: (kind: string, value: number): string =>
		str(() => formatSensorValue(String(kind), Number(value))),
	staleUndef: (): boolean | string => bool(() => isSensorStale(undefined)),
	tzLabel: (zone: string): string => str(() => timezoneOffsetLabel(String(zone))),

	// --- read-only DOM / location / storage census ---
	domText: (sel: string): string =>
		str(() => {
			const el = document.querySelector(String(sel));
			return el && typeof el.textContent === 'string' ? el.textContent.trim() : STR_SENTINEL;
		}),
	domAttr: (sel: string, attr: string): string =>
		strOrNull(() => {
			const el = document.querySelector(String(sel));
			return el ? el.getAttribute(String(attr)) : STR_SENTINEL;
		}),
	domCount: (sel: string): number => num(() => document.querySelectorAll(String(sel)).length),
	theme: (): string => strOrNull(() => document.documentElement.getAttribute('data-theme')),
	pathname: (): string => str(() => location.pathname),
	search: (): string => str(() => location.search),
	localGet: (key: string): string => strOrNull(() => localStorage.getItem(String(key))),
	sessionGet: (key: string): string => strOrNull(() => sessionStorage.getItem(String(key)))
};

export type RbProbe = typeof bridge;

declare global {
	interface Window {
		__pf?: RbProbe;
	}
}

if (typeof window !== 'undefined') {
	try {
		Object.defineProperty(window, '__pf', {
			value: Object.freeze(bridge),
			writable: false,
			configurable: true
		});
	} catch {
		// A second mount (HMR) can hit the non-writable descriptor; the first
		// publication already stands, so there is nothing to repair here.
	}
}

export {};
