// RepairBench offline fixture backend (`rb-fixture`).
// truck-tools is a Tauri v2 DESKTOP app: every byte of data it shows comes from a Rust host reached
// through `invoke()` (@tauri-apps/api/core). Served as a static bundle in a plain browser there is no
// host, so without this file the app rejects on mount and renders an empty shell. This module is the
// deterministic, in-repo replacement for that host: a fixed save-game corpus plus an in-memory state
// object that the `set_*` commands mutate, so a write made through the UI is readable again the same
// way the real app reads back a decrypted `game.sii`.
// Fabricated data follows the delivered in-repo-fixture precedent (`rb-` prefixed, fixed counts, one
// session corpus, no clock and no randomness). It is reset by a page load because it lives in module
// scope and is never persisted to localStorage/sessionStorage/cookie/IndexedDB.
/* eslint-disable @typescript-eslint/no-explicit-any */

export const RB_DOCS_DIR = "/rb-docs";
export const RB_ETS2_DIR = "Euro Truck Simulator 2";
export const RB_ATS_DIR = "American Truck Simulator";
export const RB_AVATAR_URL = "/tauri.svg";

interface RbProfileDir {
	id: string;
	name: string;
	hex: string;
	dir: string;
}
interface RbSave {
	id: string;
	name: string;
	dir: string;
}
interface RbTruck {
	brand_name: string;
	truck_id: string;
	truck_number: number;
}
interface RbTrailer {
	brand_name: string;
	trailer_id: string;
	trailer_number: number;
}

const profilesDir = (game: string): string =>
	`${RB_DOCS_DIR}/${game === "ats" ? RB_ATS_DIR : RB_ETS2_DIR}/profiles`;

const PROFILE_DIRS: Record<string, RbProfileDir[]> = {
	ets2: [
		{ id: "rb-p-ets2-01", name: "RB Hauler Nord", hex: "rb-hex-ets2-01", dir: "" },
		{ id: "rb-p-ets2-02", name: "RB Hauler Sud", hex: "rb-hex-ets2-02", dir: "" },
		{ id: "rb-p-ets2-03", name: "RB Empty Yard", hex: "rb-hex-ets2-03", dir: "" },
	],
	ats: [
		{ id: "rb-p-ats-01", name: "RB Rig Pacific", hex: "rb-hex-ats-01", dir: "" },
		{ id: "rb-p-ats-02", name: "RB Rig Atlantic", hex: "rb-hex-ats-02", dir: "" },
	],
};
for (const g of Object.keys(PROFILE_DIRS)) {
	for (const p of PROFILE_DIRS[g]) p.dir = `${profilesDir(g)}/${p.id}`;
}

// rb-p-ets2-03 has ZERO saves on purpose: readProfileNames() drops a profile whose save count is 0
// (src/utils/fileEdit.ts:141), so the fixture pins that filtering rule instead of leaving it untested.
const SAVES_COUNT: Record<string, number> = {
	"rb-p-ets2-01": 3,
	"rb-p-ets2-02": 1,
	"rb-p-ets2-03": 0,
	"rb-p-ats-01": 2,
	"rb-p-ats-02": 1,
};

const SAVES: Record<string, RbSave[]> = {
	"rb-p-ets2-01": [
		{ id: "rb-save-e1a", name: "RB Leipzig to Berlin", dir: "" },
		{ id: "rb-save-e1b", name: "RB Lyon to Milano", dir: "" },
		// This save is the fixture's designated FAILURE save: its truck list cannot be read and it
		// cannot be decrypted, so both error branches of the UI are reachable deterministically.
		{ id: "rb-save-e1c", name: "RB Corrupt Yard", dir: "" },
	],
	"rb-p-ets2-02": [{ id: "rb-save-e2a", name: "RB Oslo to Goteborg", dir: "" }],
	"rb-p-ats-01": [
		{ id: "rb-save-a1a", name: "RB Phoenix to Tucson", dir: "" },
		{ id: "rb-save-a1b", name: "RB Reno to Sacramento", dir: "" },
	],
	"rb-p-ats-02": [{ id: "rb-save-a2a", name: "RB Dallas to Waco", dir: "" }],
};
for (const pid of Object.keys(SAVES)) {
	for (const s of SAVES[pid]) s.dir = `${PROFILE_DIRS[pid.startsWith("rb-p-ets2") ? "ets2" : "ats"].find((p) => p.id === pid)!.dir}/saves/${s.id}`;
}

export const RB_FAILURE_SAVE_ID = "rb-save-e1c";

const TRUCKS: RbTruck[] = [
	{ brand_name: "Scania", truck_id: "scania.s_2016", truck_number: 0 },
	{ brand_name: "Volvo", truck_id: "volvo.fh16", truck_number: 1 },
	{ brand_name: "MAN", truck_id: "man.tgx_2020", truck_number: 2 },
];
const TRAILERS: RbTrailer[] = [
	{ brand_name: "Schmitz", trailer_id: "rb-trailer-01", trailer_number: 0 },
	{ brand_name: "Krone", trailer_id: "rb-trailer-02", trailer_number: 1 },
];

const MODELS_ETS2: Record<string, any[]> = {
	scania: [
		{
			brand: "scania",
			model: "Scania S",
			engines: [
				{ name: "RB 13L 500", cv: "500", nm: "2500", code: "rb_eng_s500" },
				{ name: "RB 13L 580", cv: "580", nm: "2700", code: "rb_eng_s580" },
			],
			transmissions: [
				{ name: "RB GRS905", speeds: "12", retarder: true, ratio: "3.08", code: "rb_trs_s12" },
				{ name: "RB GRS875", speeds: "14", retarder: false, ratio: "2.59", code: "rb_trs_s14" },
			],
		},
	],
	volvo: [
		{
			brand: "volvo",
			model: "Volvo FH3",
			engines: [{ name: "RB D13K 460", cv: "460", nm: "2300", code: "rb_eng_v460" }],
			transmissions: [{ name: "RB I-Shift", speeds: "12", retarder: true, ratio: "2.85", code: "rb_trs_v12" }],
		},
	],
	man: [
		{
			brand: "man",
			model: "MAN TGX 2020",
			engines: [{ name: "RB D38 640", cv: "640", nm: "3000", code: "rb_eng_m640" }],
			transmissions: [{ name: "RB TipMatic", speeds: "16", retarder: true, ratio: "3.36", code: "rb_trs_m16" }],
		},
	],
};
const MODELS_ATS: Record<string, any[]> = {
	kenworth: [
		{
			brand: "kenworth",
			model: "Kenworth W900",
			engines: [{ name: "RB C15 625", cv: "625", nm: "2800", code: "rb_eng_k625" }],
			transmissions: [{ name: "RB 18-Speed", speeds: "18", retarder: false, ratio: "3.70", code: "rb_trs_k18" }],
		},
	],
	peterbilt: [
		{
			brand: "peterbilt",
			model: "Peterbilt 389",
			engines: [{ name: "RB X15 605", cv: "605", nm: "2750", code: "rb_eng_p605" }],
			transmissions: [{ name: "RB 13-Speed", speeds: "13", retarder: false, ratio: "3.55", code: "rb_trs_p13" }],
		},
	],
};

// ---------------------------------------------------------------- mutable state
export interface RbState {
	money: string;
	experience: string;
	garageStatus: string;
	citiesVisited: boolean;
	dealersDiscovered: boolean;
	skills: Record<string, string>;
	developer: boolean;
	consoleEnabled: boolean;
	convoy: boolean;
	theme: string;
	documentDir: string | null;
	currentTruckId: string;
	currentTrailerId: string | null;
	trucks: RbTruck[];
	trailers: RbTrailer[];
	truckEngine: string;
	truckTransmission: string;
	truckKm: string;
	truckFuel: string;
	trailerChassisMass: string;
	trailerBodyMass: string;
	cargoMass: string;
	licensePlateTruck: string;
	licensePlateTruckBg: string;
	licensePlateTruckText: string;
	licensePlateTruckMargin: boolean;
	licensePlateTrailer: string;
	licensePlateTrailerBg: string;
	licensePlateTrailerText: string;
	licensePlateTrailerMargin: boolean;
	profileName: string;
	playerPosition: string;
	playerRotation: string;
	repairsTruck: number;
	repairsAllTrucks: number;
	repairsTrailer: number;
	repairsAllTrailers: number;
	unlockedTrailers: number;
	backupCount: number;
	cloneCount: number;
	copyConfigCount: number;
	calls: Record<string, number>;
	shellOpens: string[];
	explorerOpens: string[];
	/** Last argument object the UI handed each host command, keyed by command name. The verifier
	 *  reads it to assert WHAT REACHED THE HOST (value and target directory), not merely that a
	 *  call happened - which is the only way an argument transposition or a stale cross-profile
	 *  write target is observable at all. */
	lastArgs: Record<string, Record<string, any>>;
}

const initialState = (): RbState => ({
	money: "70000000",
	experience: "120",
	garageStatus: "small",
	citiesVisited: false,
	dealersDiscovered: false,
	skills: { adrBin: "0", longDist: "0", heavy: "0", fragile: "0", urgent: "0", mechanical: "0" },
	developer: false,
	consoleEnabled: false,
	convoy: false,
	theme: "dark",
	documentDir: null,
	currentTruckId: "scania.s_2016",
	currentTrailerId: null,
	trucks: TRUCKS.map((t) => ({ ...t })),
	trailers: TRAILERS.map((t) => ({ ...t })),
	truckEngine: "rb_eng_s500",
	truckTransmission: "rb_trs_s12",
	truckKm: "150000",
	truckFuel: "1",
	trailerChassisMass: "3000",
	trailerBodyMass: "1000",
	cargoMass: "20000",
	licensePlateTruck: "RB-TRUCK",
	licensePlateTruckBg: "#bf2222",
	licensePlateTruckText: "#ffffff",
	licensePlateTruckMargin: false,
	licensePlateTrailer: "RB-TRAILER",
	licensePlateTrailerBg: "#bf2222",
	licensePlateTrailerText: "#ffffff",
	licensePlateTrailerMargin: false,
	profileName: "RB Hauler Nord",
	playerPosition: "rb-loc-default",
	playerRotation: "rb-rot-default",
	repairsTruck: 0,
	repairsAllTrucks: 0,
	repairsTrailer: 0,
	repairsAllTrailers: 0,
	unlockedTrailers: 0,
	backupCount: 0,
	cloneCount: 0,
	copyConfigCount: 0,
	calls: {},
	shellOpens: [],
	explorerOpens: [],
	lastArgs: {},
});

export const rbState: RbState = initialState();

// The plugin-store equivalent: an in-memory map, deliberately NOT backed by localStorage so a page
// load always starts from the same empty settings file and no residue can leak between checkpoints.
const rbStore: Map<string, any> = new Map();

const isFailureSave = (dirSave: unknown): boolean =>
	typeof dirSave === "string" && dirSave.indexOf(RB_FAILURE_SAVE_ID) >= 0;

const ok = (extra?: Record<string, any>) => ({ res: true, ...(extra || {}) });

/** Deterministic, sorted snapshot of the plugin-store equivalent. Keys are inserted in whatever
 *  order the app happens to write them, so they are sorted here: two runs of the same state must
 *  produce the same string. Values are JSON-encoded so an object (the saved license-plate list)
 *  still round-trips into one scalar. */
export const rbStoreEntries = (): string =>
	Array.from(rbStore.keys())
		.sort()
		.map((k) => k + "=" + JSON.stringify(rbStore.get(k)))
		.join("|");

export const rbReset = (): void => {
	Object.assign(rbState, initialState());
	rbStore.clear();
};

export const rbInvoke = (cmd: string, args: any): Promise<any> => {
	rbState.calls[cmd] = (rbState.calls[cmd] || 0) + 1;
	const a = (args || {}) as Record<string, any>;
	rbState.lastArgs[cmd] = { ...a };

	switch (cmd) {
		// ------------------------------------------------ @tauri-apps/api/path
		case "plugin:path|resolve_directory":
			return Promise.resolve(RB_DOCS_DIR);
		case "plugin:path|join":
			return Promise.resolve((a.paths as string[]).join("/"));

		// ------------------------------------------------ @tauri-apps/plugin-os
		case "plugin:os|locale":
			return Promise.resolve("en-US");

		// ------------------------------------------------ @tauri-apps/plugin-fs
		case "plugin:fs|exists": {
			const p = String(a.path || "");
			// Exactly one profile ships an avatar; every other profile falls back to the icon branch.
			return Promise.resolve(
				p.endsWith("/online_avatar.png") && p.indexOf("rb-p-ets2-01") >= 0
			);
		}

		// --------------------------------------------- @tauri-apps/plugin-store
		case "plugin:store|load":
			return Promise.resolve(1);
		case "plugin:store|get_store":
			return Promise.resolve(1);
		case "plugin:store|get":
			return Promise.resolve([rbStore.get(a.key), rbStore.has(a.key)] as any);
		case "plugin:store|set":
			rbStore.set(a.key, a.value);
			return Promise.resolve(null);
		case "plugin:store|has":
			return Promise.resolve(rbStore.has(a.key));
		case "plugin:store|delete":
			return Promise.resolve(rbStore.delete(a.key));
		case "plugin:store|save":
		case "plugin:store|clear":
		case "plugin:store|reset":
		case "plugin:store|reload":
			if (cmd === "plugin:store|clear" || cmd === "plugin:store|reset") rbStore.clear();
			return Promise.resolve(null);

		// --------------------------------------------- @tauri-apps/plugin-shell
		case "plugin:shell|open":
			rbState.shellOpens.push(String(a.path || ""));
			return Promise.resolve(null);
		case "plugin:shell|execute":
			rbState.explorerOpens.push(String(a.program || ""));
			return Promise.resolve({ code: 0, signal: null, stdout: "", stderr: "" });

		// -------------------------------------------- @tauri-apps/plugin-dialog
		case "plugin:dialog|open":
			return Promise.resolve(`${RB_DOCS_DIR}/RB Selected Folder`);
		case "plugin:dialog|save":
			return Promise.resolve("/rb-backup/RB Profile Backup.zip");
		case "plugin:dialog|message":
			return Promise.resolve(null);

		// ------------------------------------------ @tauri-apps/plugin-updater
		// null == "no update available", so the updater modal never opens and no download is ever
		// attempted (the real endpoint cdn.siberiancoffe.dev is never contacted).
		case "plugin:updater|check":
			return Promise.resolve(null);

		// ------------------------------------------ @tauri-apps/plugin-process
		case "plugin:process|restart":
		case "plugin:process|exit":
			return Promise.resolve(null);

		// ---------------------------------------------- @tauri-apps/api/event
		case "plugin:event|listen":
		case "plugin:event|unlisten":
		case "plugin:event|emit":
			return Promise.resolve(1);

		// =================================================== app (Rust) commands
		case "get_list_dir_profile": {
			const dir = String(a.dirProfile || "");
			const game = dir.indexOf(RB_ATS_DIR) >= 0 ? "ats" : "ets2";
			return Promise.resolve(ok({ profiles: PROFILE_DIRS[game].map((p) => ({ ...p })) }));
		}
		case "get_save_game_count": {
			const dir = String(a.dirSave || "");
			const id = dir.split("/").pop() || "";
			return Promise.resolve(ok({ saves: SAVES_COUNT[id] || 0 }));
		}
		case "get_save_game_name": {
			const dir = String(a.dirSave || "");
			const id = dir.split("/").pop() || "";
			return Promise.resolve(ok({ save_games: (SAVES[id] || []).map((s) => ({ ...s })) }));
		}
		case "get_save_list_trucks":
			if (isFailureSave(a.dirSave)) return Promise.resolve({ res: false, current_truck_id: "", trucks: [] });
			return Promise.resolve(ok({ current_truck_id: rbState.currentTruckId, trucks: rbState.trucks.map((t) => ({ ...t })) }));
		case "get_save_list_trailers":
			if (isFailureSave(a.dirSave)) return Promise.resolve({ res: false, current_trailer_id: null, trailers: [] });
			return Promise.resolve(ok({ current_trailer_id: rbState.currentTrailerId, trailers: rbState.trailers.map((t) => ({ ...t })) }));
		case "get_brand_models_ets2":
			return Promise.resolve(ok({ models: MODELS_ETS2[String(a.brand || "")] || [] }));
		case "get_brand_models_ats":
			return Promise.resolve(ok({ models: MODELS_ATS[String(a.brand || "")] || [] }));
		case "get_os_theme":
			return Promise.resolve(ok({ theme: rbState.theme }));
		case "get_developer_game_status":
			return Promise.resolve(ok({ developer: rbState.developer, console: rbState.consoleEnabled, active_max_convoy_mode: rbState.convoy }));
		case "get_save_player_camera":
			return Promise.resolve(ok({ location: rbState.playerPosition, rotation: rbState.playerRotation }));

		case "decrypt_to_save":
			return Promise.resolve({ res: !isFailureSave(a.dirSave) });

		case "set_profile_money":
			rbState.money = String(a.money);
			return Promise.resolve(ok());
		case "set_profile_experience":
			rbState.experience = String(a.experience);
			return Promise.resolve(ok());
		case "set_any_garage_status":
			rbState.garageStatus = String(a.status);
			return Promise.resolve(ok());
		case "set_cities_visited":
			rbState.citiesVisited = true;
			return Promise.resolve(ok());
		case "set_dealerships_discovered":
			rbState.dealersDiscovered = true;
			return Promise.resolve(ok());
		case "set_profile_experience_skills":
			for (const k of Object.keys(rbState.skills)) {
				if (a[k] !== undefined) rbState.skills[k] = String(a[k]);
			}
			return Promise.resolve(ok());
		case "set_developer_game_status":
			rbState.developer = !!a.statusDeveloper;
			rbState.consoleEnabled = !!a.statusDeveloper;
			return Promise.resolve(ok());
		case "set_convoy_size":
			rbState.convoy = !!a.convoyStatus;
			return Promise.resolve(ok());
		case "set_new_profile_name":
			rbState.profileName = String(a.newProfileName || "");
			return Promise.resolve(ok());
		case "set_truck_km":
			rbState.truckKm = String(a.km !== undefined ? a.km : a.truckKm);
			return Promise.resolve(ok());
		case "fill_fuel_truck":
			rbState.truckFuel = String(a.fuel);
			return Promise.resolve(ok());
		case "fill_any_trucks_fuel":
			rbState.truckFuel = String(a.fuel);
			return Promise.resolve(ok());
		case "set_infinite_fuel":
			rbState.truckFuel = String(a.fuelLevel);
			return Promise.resolve(ok());
		case "set_truck_engine_def":
			rbState.truckEngine = String(a.engineCode);
			return Promise.resolve(ok());
		case "set_truck_transmissions_def":
			rbState.truckTransmission = String(a.transmissionsCode);
			return Promise.resolve(ok());
		case "set_license_plate_truck":
			rbState.licensePlateTruck = String(a.licensePlate);
			rbState.licensePlateTruckBg = String(a.bgPlateColor);
			rbState.licensePlateTruckText = String(a.textPlateColor);
			rbState.licensePlateTruckMargin = !!a.colorMargin;
			return Promise.resolve(ok());
		case "set_license_plate_trailer":
			rbState.licensePlateTrailer = String(a.licensePlate);
			rbState.licensePlateTrailerBg = String(a.bgPlateColor);
			rbState.licensePlateTrailerText = String(a.textPlateColor);
			rbState.licensePlateTrailerMargin = !!a.colorMargin;
			return Promise.resolve(ok());
		case "set_player_truck":
			rbState.currentTruckId = String(a.replaceTruckId);
			return Promise.resolve(ok());
		case "set_player_trailer":
			rbState.currentTrailerId = String(a.replaceTrailerId);
			return Promise.resolve(ok());
		case "set_player_position":
			rbState.playerPosition = String(a.location);
			rbState.playerRotation = String(a.rotation);
			return Promise.resolve(ok());
		case "set_cargo_mass_def_trailers":
			rbState.trailerChassisMass = String(a.chassisMass);
			rbState.trailerBodyMass = String(a.bodyMass);
			return Promise.resolve(ok());
		case "set_cargo_mass_trailers_and_slave":
			rbState.cargoMass = String(a.cargoMass);
			return Promise.resolve(ok());
		case "set_unlock_current_trailers":
			rbState.unlockedTrailers += 1;
			return Promise.resolve(ok());
		case "repait_truck":
			rbState.repairsTruck += 1;
			return Promise.resolve(ok());
		case "repait_all_trucks":
			rbState.repairsAllTrucks += 1;
			return Promise.resolve(ok());
		case "repair_trailer":
			rbState.repairsTrailer += 1;
			return Promise.resolve(ok());
		case "repair_all_trailers":
			rbState.repairsAllTrailers += 1;
			return Promise.resolve(ok());
		case "set_remove_truck_badge":
			return Promise.resolve(ok());
		case "backup_profile":
			rbState.backupCount += 1;
			return Promise.resolve(ok());
		case "copy_profile":
			rbState.cloneCount += 1;
			return Promise.resolve(ok());
		case "copy_controls_config":
			rbState.copyConfigCount += 1;
			return Promise.resolve(ok());

		default:
			// Fail closed and loudly: an unhandled command must surface as a rejection so the probe
			// counts it, never as a silent undefined that a checkpoint could read as green.
			return Promise.reject(new Error("rb-fixture: unhandled host command '" + cmd + "'"));
	}
};
