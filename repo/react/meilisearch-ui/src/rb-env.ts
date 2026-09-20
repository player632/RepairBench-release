/**
 * RepairBench offline adaptation for `meilisearch-ui`
 * (instance `repair-react__meilisearch-ui-01`).
 *
 * WHY THIS FILE EXISTS. The seed is a Meilisearch admin console: every screen is
 * driven by HTTP calls to a user-supplied Meilisearch server, and the build bakes
 * the parent repository's `git rev-parse HEAD` into the bundle. Neither is
 * available (or deterministic) inside a grading lane, so this module is imported
 * FIRST from `src/main.tsx` and does exactly three things:
 *
 *   1. freezes the wall clock at RB_EPOCH_MS,
 *   2. seeds a deterministic instance list into the zustand persist storage,
 *   3. replaces `window.fetch` with a total, in-page fixture router for the
 *      Meilisearch REST API.
 *
 * It contains NO application logic, adds and removes NO dependency, and changes
 * NO build setting. `meilisearch@0.49.0` has zero dependencies and resolves its
 * transport as `const fetchFn = this.httpClient ? this.httpClient : fetch`
 * (node_modules/meilisearch/src/http-requests.ts:180), i.e. it reads the GLOBAL
 * `fetch` binding at call time, so a single assignment covers all 24 SDK call
 * sites in src/. The router never falls through to the real network: an
 * unrecognised request is answered from the same in-page tables and recorded in
 * `window.__rbEnv.misses`, so "zero external requests" is a measured property of
 * the delivered artifact rather than a hope.
 *
 * Determinism notes that are load-bearing for the checkpoints:
 *   - `new Date()` / `Date.now()` are frozen, so dayjs `fromNow()` / `format()`
 *     outputs (TimeAgo, CountUp, key timestamps) are stable scalars.
 *   - `Date` is subclassed, not replaced by a function, so `x instanceof Date`
 *     and `new Date(null) === epoch 0` keep their native semantics - the SDK's
 *     `Task` constructor wraps a server-side `null` timestamp into `new Date(0)`
 *     and `src/utils/task.ts` normalises it back; both halves stay intact.
 *   - the store is seeded only when the key is ABSENT, so in-checkpoint writes
 *     (language switch, add/edit instance, key deletion) persist and remain
 *     observable, while a fresh browser context always starts from the same seed.
 */

/* ------------------------------------------------------------------ *
 * 1. wall-clock freeze
 * ------------------------------------------------------------------ */

/** 2025-01-01T00:00:00.000Z - the frozen "now" for every delivered state. */
export const RB_EPOCH_MS = 1735689600000;

const NativeDate = globalThis.Date;

class RBFrozenDate extends NativeDate {
	constructor(...args: unknown[]) {
		if (args.length === 0) {
			super(RB_EPOCH_MS);
		} else {
			// spread keeps the native arity, so new Date(y, m, d, ...) and
			// new Date(value) / new Date(null) behave exactly as before.
			super(...(args as ConstructorParameters<typeof NativeDate>));
		}
	}

	static now(): number {
		return RB_EPOCH_MS;
	}
}

Object.defineProperty(globalThis, "Date", {
	value: RBFrozenDate,
	writable: true,
	configurable: true,
});

/* ------------------------------------------------------------------ *
 * 2. deterministic seed state (zustand persist + i18next caches)
 * ------------------------------------------------------------------ */

const RB_STORE_KEY = "meilisearch-ui-store";
/** must match src/store/index.ts persist({ name, version }) */
const RB_STORE_VERSION = 5;

/**
 * Three instances, deliberately with NON-CONTIGUOUS ids (1, 3 and 7): the store's
 * `addInstance` derives the next id with `maxBy(instances, "id").id + 1`, which
 * only differs from `instances.length + 1` when the id set has a hole. Instance 3
 * carries no apiKey so the "no master key" branch of `validateKeysRouteAvailable`
 * is reachable too. Hosts use the reserved `.invalid` TLD - they can never
 * resolve, which makes any accidental network fall-through a hard, visible error
 * instead of a flaky one.
 *
 *
 * observation face for the defect at src/hooks/useMeiliClient.ts:39. Its world
 * answers `GET /stats` with HTTP 503 (see RB_DOWN_HOSTS in section 3 below), so
 * in the clean tree `await conn.getStats()` rejects, connect() lands in its catch
 * branch, toasts `instance:connection_failed` and redirects to BASE_URL; the
 * mutant awaits the bare function reference, resolves immediately, and stays on
 * /ins/7 rendering with a dead client. Without a failing world BOTH arms succeed
 * (every unknown host falls back to rbEmptyWorld()), i.e. the defect would be
 * unobservable. Deterministic: a 503 returned by the in-page router, no delay,
 * no race, no real network (.invalid is reserved and can never resolve).
 *
 * The ids stay NON-CONTIGUOUS (1, 3, 7) on purpose - the hole is what makes
 * `addInstance`'s `maxBy(instances, "id").id + 1` differ from
 * `instances.length + 1`, which the D10 checkpoint depends on.
 */
const RB_SEED_INSTANCES = [
	{
		id: 1,
		name: "rb-primary",
		host: "http://rb-meili-one.invalid",
		apiKey: "rbMasterKey0123456789abcdefghijklmnop",
		updatedTime: "2024-12-29T00:00:00.000Z",
	},
	{
		id: 3,
		name: "rb-secondary",
		host: "http://rb-meili-three.invalid",
		updatedTime: "2024-12-31T00:00:00.000Z",
	},
	{
		id: 7,
		name: "rb-down",
		host: "http://rb-meili-down.invalid",
		updatedTime: "2024-12-28T00:00:00Z",
	},
];

try {
	if (
		typeof localStorage !== "undefined" &&
		localStorage.getItem(RB_STORE_KEY) === null
	) {
		localStorage.setItem(
			RB_STORE_KEY,
			JSON.stringify({
				state: { instances: RB_SEED_INSTANCES, language: "en" },
				version: RB_STORE_VERSION,
			}),
		);
	}
} catch {
	// storage disabled (private mode / sandbox): the app still boots, with an
	// empty instance list, exactly as it would for a first-time visitor.
}

/* ------------------------------------------------------------------ *
 * 3. total in-page fixture router for the Meilisearch REST API
 * ------------------------------------------------------------------ */

interface RbIndex {
	uid: string;
	primaryKey: string;
	createdAt: string;
	updatedAt: string;
	numberOfDocuments: number;
	isIndexing: boolean;
	fieldDistribution: Record<string, number>;
}

interface RbTask {
	uid: number;
	indexUid: string | null;
	status: string;
	type: string;
	batchUid: number | null;
	canceledBy: number | null;
	details: Record<string, number> | null;
	error: null;
	duration: string | null;
	startedAt: string | null;
	enqueuedAt: string;
	finishedAt: string | null;
}

interface RbKey {
	uid: string;
	name: string;
	description: string;
	key: string;
	createdAt: string;
	updatedAt: string;
	expiresAt: string | null;
	indexes: string[];
	actions: string[];
}

interface RbWorld {
	pkgVersion: string;
	commitSha: string;
	commitDate: string;
	databaseSize: number;
	lastUpdate: string;
	indexes: RbIndex[];
	tasks: RbTask[];
	keys: RbKey[];
	documents: Record<string, Record<string, unknown>[]>;
	settings: Record<string, unknown>;
}

const rbTask = (
	uid: number,
	indexUid: string | null,
	status: string,
	type: string,
	enqueuedAt: string,
	startedAt: string | null,
	finishedAt: string | null,
	duration: string | null,
	details: Record<string, number> | null,
): RbTask => ({
	uid,
	indexUid,
	status,
	type,
	batchUid: uid,
	canceledBy: null,
	details,
	error: null,
	duration,
	startedAt,
	enqueuedAt,
	finishedAt,
});

const rbSettings = (
	filterable: string[],
	searchable: string[],
	sortable: string[],
): Record<string, unknown> => ({
	displayedAttributes: ["*"],
	searchableAttributes: searchable,
	filterableAttributes: filterable,
	sortableAttributes: sortable,
	rankingRules: [
		"words",
		"typo",
		"proximity",
		"attribute",
		"exactness",
	],
	stopWords: [],
	synonyms: {},
	distinctAttribute: null,
	typoTolerance: {
		enabled: true,
		minWordSizeForTypos: { oneTypo: 5, twoTypos: 9 },
		disableOnWords: [],
		disableOnAttributes: [],
	},
	pagination: { maxTotalHits: 1000 },
	faceting: { maxValuesPerFacet: 100, sortFacetValuesBy: { "*": "alpha" } },
});

/** mutable: the key-deletion checkpoint needs the list to actually shrink. */
const rbWorlds: Record<string, RbWorld> = {
	"rb-meili-one.invalid": {
		pkgVersion: "rb-1.0.0",
		commitSha: "rbcommitsha0000000000000000000000000001",
		commitDate: "2024-12-01T00:00:00Z",
		databaseSize: 10485760,
		lastUpdate: "2024-12-30T00:00:00Z",
		indexes: [
			{
				uid: "movies",
				primaryKey: "id",
				createdAt: "2024-11-01T00:00:00Z",
				updatedAt: "2024-12-20T00:00:00Z",
				numberOfDocuments: 1234,
				isIndexing: false,
				fieldDistribution: { id: 1234, title: 1234, overview: 1200, genre: 1180 },
			},
			{
				uid: "rb_games",
				primaryKey: "id",
				createdAt: "2024-11-02T00:00:00Z",
				updatedAt: "2024-12-21T00:00:00Z",
				numberOfDocuments: 7,
				isIndexing: true,
				fieldDistribution: { id: 7, name: 7 },
			},
		],
		tasks: [
			// three enqueued documentAddition tasks on `movies`: the per-index
			// pending-task badge on the index list is derived by COUNTING these,
			// so the correct badge reads 3.
			rbTask(101, "movies", "enqueued", "documentAdditionOrUpdate", "2024-12-31T23:59:30Z", null, null, null, { receivedDocuments: 10, indexedDocuments: 0 }),
			rbTask(102, "movies", "enqueued", "documentAdditionOrUpdate", "2024-12-31T23:59:00Z", null, null, null, { receivedDocuments: 20, indexedDocuments: 0 }),
			rbTask(103, "movies", "enqueued", "documentAdditionOrUpdate", "2024-12-31T23:58:00Z", null, null, null, { receivedDocuments: 30, indexedDocuments: 0 }),
			// startedAt is exactly 10 days before RB_EPOCH_MS: the rendered
			// "10 days ago" is a wall-clock-freeze sentinel.
			rbTask(90, "movies", "succeeded", "indexCreation", "2024-12-21T23:59:59Z", "2024-12-22T00:00:00Z", "2024-12-22T00:00:01Z", "PT1S", null),
			rbTask(91, "rb_games", "failed", "documentAdditionOrUpdate", "2024-12-21T09:59:59Z", "2024-12-21T10:00:00Z", "2024-12-21T10:00:02Z", "PT2S", { receivedDocuments: 5, indexedDocuments: 0 }),
			rbTask(92, "rb_games", "succeeded", "settingsUpdate", "2024-12-20T09:59:59Z", "2024-12-20T10:00:00Z", "2024-12-20T10:00:01Z", "PT1S", null),
		],
		keys: [
			{ uid: "rbkeyuid0001", name: "rb-default-search", description: "rb fixture key 1", key: "aaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666", createdAt: "2024-11-01T00:00:00Z", updatedAt: "2024-12-01T00:00:00Z", expiresAt: null, indexes: ["*"], actions: ["*"] },
			{ uid: "rbkeyuid0002", name: "rb-default-admin", description: "rb fixture key 2", key: "gggg7777hhhh8888iiii9999jjjj0000kkkk1111llll2222", createdAt: "2024-11-02T00:00:00Z", updatedAt: "2024-12-02T00:00:00Z", expiresAt: null, indexes: ["*"], actions: ["*"] },
			{ uid: "rbkeyuid0003", name: "rb-search-only", description: "rb fixture key 3", key: "mmmm3333nnnn4444oooo5555pppp6666qqqq7777rrrr8888", createdAt: "2024-11-03T00:00:00Z", updatedAt: "2024-12-03T00:00:00Z", expiresAt: "2030-01-01T00:00:00Z", indexes: ["movies"], actions: ["search"] },
		],
		documents: {
			movies: [
				// RepairBench: `overview` on movies[0]/[1] is the observation face for
				// isValidImgUrl (src/utils/text.ts:89). The URLs are SAME-ORIGIN on purpose -
				// an external host would make the browser attempt a real network fetch and
				// break the "zero external requests" property this module guarantees. The
				// path intentionally 404s: the checkpoints assert on the render BRANCH
				// (image wrapper vs truncated text), never on a successful decode.
				{ id: 1, title: "rb fixture movie one", overview: location.origin + "/rb-assets/poster-one.png", genre: "rb" },
				{ id: 2, title: "rb fixture movie two", overview: location.origin + "/rb-assets/notes-two.txt", genre: "rb" },
				{ id: 3, title: "rb fixture movie three", overview: "rb", genre: "rb" },
			],
			rb_games: [
				{ id: 1, name: "rb fixture game one" },
				{ id: 2, name: "rb fixture game two" },
			],
		},
		settings: facetingShim(),
	},
	"rb-meili-three.invalid": {
		pkgVersion: "rb-3.0.0",
		commitSha: "rbcommitsha0000000000000000000000000003",
		commitDate: "2024-12-03T00:00:00Z",
		databaseSize: 20480,
		lastUpdate: "2024-12-31T00:00:00Z",
		indexes: [
			{
				uid: "books",
				primaryKey: "id",
				createdAt: "2024-11-05T00:00:00Z",
				updatedAt: "2024-12-25T00:00:00Z",
				numberOfDocuments: 42,
				isIndexing: false,
				fieldDistribution: { id: 42, title: 42 },
			},
		],
		tasks: [],
		keys: [],
		documents: { books: [{ id: 1, title: "rb fixture book one" }] },
		settings: facetingShim(),
	},
};

function facetingShim(): Record<string, unknown> {
	return rbSettings(["genre", "id"], ["title", "overview"], ["id"]);
}

/**
 * Any host that is not in the table still gets a well-formed, EMPTY world. The
 * add-instance checkpoint connects to a brand new host, and `throwOnError: true`
 * on the QueryClient (src/main.tsx:20) turns a single missing fixture into an
 * error-boundary redirect, so the router must be total rather than exact.
 */
const rbEmptyWorld = (): RbWorld => ({
	pkgVersion: "rb-0.0.0",
	commitSha: "rbcommitsha0000000000000000000000000000",
	commitDate: "2024-12-01T00:00:00Z",
	databaseSize: 0,
	lastUpdate: "2024-12-30T00:00:00Z",
	indexes: [],
	tasks: [],
	keys: [],
	documents: {},
	settings: facetingShim(),
});

const rbWorldOf = (host: string): RbWorld => {
	if (!Object.prototype.hasOwnProperty.call(rbWorlds, host)) {
		rbWorlds[host] = rbEmptyWorld();
	}
	return rbWorlds[host];
};

interface RbEnv {
	epoch: number;
	requests: string[];
	misses: string[];
	worlds: Record<string, RbWorld>;
}

const rbEnv: RbEnv = {
	epoch: RB_EPOCH_MS,
	requests: [],
	misses: [],
	worlds: rbWorlds,
};

// Exposed so a checkpoint can prove the interceptor is actually in the request
// path (non-vacuity) instead of trusting a silent success.
(globalThis as unknown as Record<string, unknown>).__rbEnv = rbEnv;

const rbEnqueued = (
	taskUid: number,
	indexUid: string | null,
	type: string,
	details: Record<string, number> | null = null,
) => ({
	taskUid,
	indexUid,
	status: "enqueued",
	type,
	details,
	canceledBy: null,
	error: null,
	duration: null,
	startedAt: null,
	enqueuedAt: "2025-01-01T00:00:00.000Z",
	finishedAt: null,
});

const rbListParam = (sp: URLSearchParams, name: string): string[] => {
	const raw = sp.get(name);
	if (raw === null || raw === "") return [];
	// toQueryParams (meilisearch http-requests.ts:22) joins arrays with ",";
	// accept repeated params too so the fixture is not coupled to that detail.
	const out: string[] = [];
	for (const part of raw.split(",")) {
		const v = part.trim();
		if (v) out.push(v);
	}
	for (const v of sp.getAll(name)) {
		for (const part of v.split(",")) {
			const t = part.trim();
			if (t && !out.includes(t)) out.push(t);
		}
	}
	return out;
};

const rbIntParam = (sp: URLSearchParams, name: string, dflt: number): number => {
	const raw = sp.get(name);
	if (raw === null || raw === "") return dflt;
	const n = Number.parseInt(raw, 10);
	return Number.isFinite(n) ? n : dflt;
};

const rbMatches = (values: string[], filter: string[]): boolean => {
	if (!filter.length) return true;
	return values.some((v) => filter.includes(v));
};

/**
 * Hosts whose instance-level `GET /stats` must FAIL, and the failure shape.
 * Only used by the useMeiliClient connection self-check face (D18). Everything
 * else about these hosts is the ordinary empty world, so a mutant that sails
 * past the self-check still gets deterministic answers for every later request
 * instead of a hang or an error-boundary redirect.
 */
const RB_DOWN_HOSTS: ReadonlySet<string> = new Set(["rb-meili-down.invalid"]);

const rbStatsFailure = (host: string): { status: number; body: unknown } | null =>
	RB_DOWN_HOSTS.has(host)
		? {
				status: 503,
				body: {
					message: "rb fixture: this world answers GET /stats with 503 on purpose",
					code: "internal",
					type: "internal",
					link: null,
				},
			}
		: null;

/** Route one API call. Returns null when the path is not a Meilisearch route. */
const rbRoute = (
	method: string,
	url: URL,
	bodyText: string,
): { status: number; body: unknown; noBody?: boolean } | null => {
	const world = rbWorldOf(url.hostname);
	const seg = url.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
	const sp = url.searchParams;
	const key = `${method} /${seg.join("/")}`;

	// ---- instance level ----
	if (seg.length === 0) {
		return null;
	}
	if (seg[0] === "health") {
		return { status: 200, body: { status: "available" } };
	}
	if (seg[0] === "version") {
		return {
			status: 200,
			body: {
				commitSha: world.commitSha,
				commitDate: world.commitDate,
				pkgVersion: world.pkgVersion,
			},
		};
	}
	if (seg[0] === "stats") {
		const down = rbStatsFailure(url.hostname);
		if (down) {
			return down;
		}
		// OLD (<= 0.49 / Meilisearch 1.x) stats shape: `indexes` is a MAP keyed by
		// uid carrying numberOfDocuments / isIndexing / fieldDistribution. That is
		// exactly what src/components/biz/IndexList.tsx:48 consumes.
		const indexes: Record<string, unknown> = {};
		for (const ix of world.indexes) {
			indexes[ix.uid] = {
				numberOfDocuments: ix.numberOfDocuments,
				isIndexing: ix.isIndexing,
				fieldDistribution: ix.fieldDistribution,
			};
		}
		return {
			status: 200,
			body: {
				databaseSize: world.databaseSize,
				lastUpdate: world.lastUpdate,
				indexes,
			},
		};
	}

	// ---- tasks ----
	if (seg[0] === "tasks" && seg.length === 1 && method === "GET") {
		const fIndex = rbListParam(sp, "indexUids");
		const fStatus = rbListParam(sp, "statuses");
		const fType = rbListParam(sp, "types");
		const fUids = rbListParam(sp, "uids").map((x) => Number.parseInt(x, 10));
		const filtered = world.tasks
			.filter((t) => rbMatches([String(t.indexUid)], fIndex))
			.filter((t) => rbMatches([t.status], fStatus))
			.filter((t) => rbMatches([t.type], fType))
			.filter((t) => (fUids.length ? fUids.includes(t.uid) : true))
			.slice()
			.sort((a, b) => b.uid - a.uid);
		const limit = rbIntParam(sp, "limit", 20);
		const from = rbIntParam(sp, "from", 0);
		const page = filtered.slice(from, from + limit);
		return {
			status: 200,
			body: {
				results: page,
				limit,
				from: filtered.length ? from : null,
				next: from + limit < filtered.length ? from + limit : null,
				total: filtered.length,
			},
		};
	}
	if (seg[0] === "tasks" && seg.length === 2 && method === "GET") {
		const uid = Number.parseInt(seg[1], 10);
		const found = world.tasks.find((t) => t.uid === uid);
		return found
			? { status: 200, body: found }
			: { status: 404, body: { message: "rb task not found", code: "task_not_found", type: "invalid_request", link: null } };
	}
	if (seg[0] === "tasks" && seg[1] === "cancel" && method === "POST") {
		return { status: 200, body: rbEnqueued(900, null, "taskCancelation") };
	}
	if (seg[0] === "tasks" && seg[1] === "delete" && method === "POST") {
		return { status: 200, body: rbEnqueued(901, null, "taskDeletion") };
	}
	if (seg[0] === "batches") {
		return { status: 200, body: { results: [], limit: 20, from: null, next: null, total: 0 } };
	}
	if (seg[0] === "dumps" && method === "POST") {
		return { status: 200, body: rbEnqueued(902, null, "dumpCreation") };
	}
	if (seg[0] === "snapshots" && method === "POST") {
		return { status: 200, body: rbEnqueued(903, null, "snapshotCreation") };
	}
	if (seg[0] === "swap-indexes" && method === "POST") {
		return { status: 200, body: rbEnqueued(904, null, "indexSwap") };
	}

	// ---- keys ----
	if (seg[0] === "keys" && seg.length === 1) {
		if (method === "GET") {
			const limit = rbIntParam(sp, "limit", 20);
			const offset = rbIntParam(sp, "offset", 0);
			return {
				status: 200,
				body: {
					results: world.keys.slice(offset, offset + limit),
					offset,
					limit,
					total: world.keys.length,
				},
			};
		}
		if (method === "POST") {
			let payload: Record<string, unknown> = {};
			try {
				payload = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : {};
			} catch {
				payload = {};
			}
			const created: RbKey = {
				uid: String(payload.uid || `rbkeyuid${String(world.keys.length + 10).padStart(4, "0")}`),
				name: String(payload.name || "rb-created-key"),
				description: String(payload.description || ""),
				key: `ssss${String(world.keys.length)}333tttt4444uuuu5555vvvv6666wwww7777xxxx8888`,
				createdAt: "2025-01-01T00:00:00Z",
				updatedAt: "2025-01-01T00:00:00Z",
				expiresAt: (payload.expiresAt as string | null) ?? null,
				indexes: (payload.indexes as string[]) ?? [],
				actions: (payload.actions as string[]) ?? [],
			};
			world.keys = [...world.keys, created];
			return { status: 201, body: created };
		}
	}
	if (seg[0] === "keys" && seg.length === 2) {
		const uid = seg[1];
		if (method === "GET") {
			const found = world.keys.find((k) => k.uid === uid || k.key === uid);
			return found
				? { status: 200, body: found }
				: { status: 404, body: { message: "rb key not found", code: "api_key_not_found", type: "invalid_request", link: null } };
		}
		if (method === "PATCH" || method === "PUT") {
			let payload: Record<string, unknown> = {};
			try {
				payload = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : {};
			} catch {
				payload = {};
			}
			world.keys = world.keys.map((k) =>
				k.uid === uid || k.key === uid
					? { ...k, ...payload, updatedAt: "2025-01-01T00:00:00Z" } as RbKey
					: k,
			);
			const updated = world.keys.find((k) => k.uid === uid || k.key === uid);
			return { status: 200, body: updated ?? null };
		}
		if (method === "DELETE") {
			const before = world.keys.length;
			world.keys = world.keys.filter((k) => !(k.uid === uid || k.key === uid));
			if (world.keys.length === before) {
				return { status: 404, body: { message: "rb key not found", code: "api_key_not_found", type: "invalid_request", link: null } };
			}
			// Meilisearch answers 204 with an empty body; http-requests.ts:161
			// tolerates that ("" -> undefined) and keys.tsx only chains .finally().
			return { status: 204, body: null, noBody: true };
		}
	}

	// ---- indexes ----
	if (seg[0] === "indexes" && seg.length === 1) {
		if (method === "GET") {
			const limit = rbIntParam(sp, "limit", 20);
			const offset = rbIntParam(sp, "offset", 0);
			const rows = world.indexes.slice(offset, offset + limit).map((ix) => ({
				uid: ix.uid,
				primaryKey: ix.primaryKey,
				createdAt: ix.createdAt,
				updatedAt: ix.updatedAt,
			}));
			return { status: 200, body: { results: rows, offset, limit, total: world.indexes.length } };
		}
		if (method === "POST") {
			let payload: Record<string, unknown> = {};
			try {
				payload = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : {};
			} catch {
				payload = {};
			}
			const uid = String(payload.uid || "rb_created");
			world.indexes = [
				...world.indexes,
				{
					uid,
					primaryKey: String(payload.primaryKey || "id"),
					createdAt: "2025-01-01T00:00:00Z",
					updatedAt: "2025-01-01T00:00:00Z",
					numberOfDocuments: 0,
					isIndexing: false,
					fieldDistribution: {},
				},
			];
			return { status: 200, body: rbEnqueued(910, uid, "indexCreation") };
		}
	}
	if (seg[0] === "indexes" && seg.length >= 2) {
		const uid = seg[1];
		const ix = world.indexes.find((x) => x.uid === uid);
		const rest = seg.slice(2).join("/");

		if (seg.length === 2) {
			if (method === "GET") {
				return ix
					? { status: 200, body: { uid: ix.uid, primaryKey: ix.primaryKey, createdAt: ix.createdAt, updatedAt: ix.updatedAt } }
					: { status: 404, body: { message: "rb index not found", code: "index_not_found", type: "invalid_request", link: null } };
			}
			if (method === "PATCH" || method === "PUT") {
				let payload: Record<string, unknown> = {};
				try {
					payload = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : {};
				} catch {
					payload = {};
				}
				world.indexes = world.indexes.map((x) =>
					x.uid === uid ? { ...x, primaryKey: String(payload.primaryKey ?? x.primaryKey), updatedAt: "2025-01-01T00:00:00Z" } : x,
				);
				return { status: 200, body: rbEnqueued(911, uid, "indexUpdate") };
			}
			if (method === "DELETE") {
				world.indexes = world.indexes.filter((x) => x.uid !== uid);
				return { status: 200, body: rbEnqueued(912, uid, "indexDeletion") };
			}
		}

		if (!ix) {
			return { status: 404, body: { message: "rb index not found", code: "index_not_found", type: "invalid_request", link: null } };
		}

		if (rest === "stats" && method === "GET") {
			return { status: 200, body: { numberOfDocuments: ix.numberOfDocuments, isIndexing: ix.isIndexing, fieldDistribution: ix.fieldDistribution } };
		}
		if (rest === "settings" && method === "GET") {
			return { status: 200, body: world.settings };
		}
		if (rest === "settings" && (method === "PATCH" || method === "PUT")) {
			return { status: 200, body: rbEnqueued(913, uid, "settingsUpdate") };
		}
		if (rest.startsWith("settings/") && (method === "DELETE" || method === "PATCH" || method === "PUT")) {
			return { status: 200, body: rbEnqueued(914, uid, "settingsUpdate") };
		}
		if (rest === "search") {
			let payload: Record<string, unknown> = {};
			try {
				payload = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : {};
			} catch {
				payload = {};
			}
			const q = String(payload.q ?? sp.get("q") ?? "");
			const docs = world.documents[uid] || [];
			const hits = q
				? docs.filter((d) => JSON.stringify(d).toLowerCase().includes(q.toLowerCase()))
				: docs;
			return {
				status: 200,
				body: {
					hits,
					offset: 0,
					limit: Number(payload.limit ?? 20),
					estimatedTotalHits: hits.length,
					processingTimeMs: 1,
					query: q,
					exhaustiveTotalHits: false,
				},
			};
		}
		if (rest === "documents/fetch" && method === "POST") {
			const docs = world.documents[uid] || [];
			return { status: 200, body: { results: docs, offset: 0, limit: 20, total: docs.length } };
		}
		if (rest === "documents" && method === "GET") {
			const docs = world.documents[uid] || [];
			const limit = rbIntParam(sp, "limit", 20);
			const offset = rbIntParam(sp, "offset", 0);
			return { status: 200, body: { results: docs.slice(offset, offset + limit), offset, limit, total: docs.length } };
		}
		if (rest === "documents" && (method === "POST" || method === "PUT")) {
			return { status: 200, body: rbEnqueued(915, uid, "documentAdditionOrUpdate", { receivedDocuments: 1, indexedDocuments: 0 }) };
		}
		if (rest === "documents" && method === "DELETE") {
			return { status: 200, body: rbEnqueued(916, uid, "documentDeletion", { deletedDocuments: 0, remainingDocuments: 0 }) };
		}
		if (rest.startsWith("documents/") && method === "DELETE") {
			return { status: 200, body: rbEnqueued(917, uid, "documentDeletion", { deletedDocuments: 1, remainingDocuments: 0 }) };
		}
		if (rest.startsWith("documents/") && method === "GET") {
			const docs = world.documents[uid] || [];
			return { status: 200, body: docs[0] ?? {} };
		}
		if (rest === "stats/search" || rest === "stats/typo-tolerance" || rest === "stats/pagination" || rest === "stats/documents-fields") {
			return { status: 200, body: {} };
		}
	}

	return null;
};

const rbJsonResponse = (body: unknown, status: number): Response =>
	new Response(status === 204 ? null : JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});

const rbInstallFetchInterceptor = (): void => {
	const patched = (input: unknown, init?: RequestInit): Promise<Response> => {
		let raw = "";
		let method = String((init && init.method) || "GET").toUpperCase();
		let bodyText = "";
		try {
			if (typeof input === "string") {
				raw = input;
			} else if (input && typeof (input as Request).url === "string") {
				raw = (input as Request).url;
				if (!init || !init.method) method = String((input as Request).method || method).toUpperCase();
			} else {
				raw = String(input);
			}
			if (init && typeof init.body === "string") bodyText = init.body;
		} catch {
			raw = "";
		}

		let url: URL;
		try {
			url = new URL(raw, globalThis.location ? globalThis.location.href : "http://rb-local.invalid/");
		} catch {
			url = new URL("http://rb-unparsable.invalid/");
		}

		const record = `${method} ${url.origin}${url.pathname}${url.search}`;
		rbEnv.requests.push(record);

		const routed = rbRoute(method, url, bodyText);
		if (routed) {
			return Promise.resolve(rbJsonResponse(routed.body, routed.status));
		}

		// Never fall through to the real network: an unrouted call is answered
		// in-page (HTTP 200, empty Meilisearch-shaped envelope) AND recorded, so
		// a missing fixture shows up as a measured miss instead of a hang, a
		// CORS failure or a silent redirect to the error boundary.
		rbEnv.misses.push(record);
		return Promise.resolve(
			rbJsonResponse(
				{
					rbFixtureMiss: true,
					method,
					host: url.hostname,
					pathname: url.pathname,
					search: url.search,
					results: [],
					total: 0,
					limit: 20,
					offset: 0,
					from: null,
					next: null,
				},
				200,
			),
		);
	};

	Object.defineProperty(globalThis, "fetch", {
		value: patched,
		writable: true,
		configurable: true,
	});
	if (typeof globalThis.window !== "undefined") {
		Object.defineProperty(globalThis.window, "fetch", {
			value: patched,
			writable: true,
			configurable: true,
		});
	}
};

rbInstallFetchInterceptor();
