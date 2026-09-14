// RepairBench environment adaptation: the OFFLINE, DETERMINISTIC dataset that stands in
// for this seed's Rust/Tauri backend database.
//
// Why this file exists: `npm run build` (the roster recipe) leaves VITE_BACKEND unset, so
// src/lib/api.ts compiles with `isWeb === false` and every one of its 62 backend calls goes
// through `invoke()` from @tauri-apps/api/core, which reads `window.__TAURI_INTERNALS__`.
// In a plain browser that global does not exist, so the app cannot load a single flight.
// rbBackend.ts installs that global; this file only supplies the bytes it answers with.
//
// Discipline (RepairBench):
//   * every value here is a literal - no Math.random(), no Date.now(), no new Date() anchor,
//     so two runs of the same tree produce byte-identical DOM;
//   * no flight carries homeLat/homeLon, which is what keeps src/components/dashboard/
//     FlightClusterMap.tsx on its `geojson.features.length === 0` branch (line 716) so the
//     MapLibre GL canvas - and therefore the whole WebGL/software-rasteriser dependency -
//     is never mounted by the view the verifier drives;
//   * identifiers are prefixed RB- / rb- so harness-authored data can never be confused with
//     seed-authored data, and so a model that hardcodes a fixture value is visible in review.

import type { Flight, OverviewStats } from '@/types';

/** Nine flights: enough to exercise pair aggregation, duplicate-name disambiguation,
 *  null-cell fallbacks ('--'), the three duration buckets and eight distinct flight days. */
export const RB_FLIGHTS: Flight[] = [
  {
    id: 1,
    fileName: 'rb-log-0001.txt',
    displayName: 'Harbour Line Survey',
    fileHash: 'rbhash0001',
    droneModel: 'DJI Mini 4 Pro',
    droneSerial: 'RB-DR-01',
    aircraftName: null,
    batterySerial: 'RB-BAT-01',
    cycleCount: 120,
    startTime: '2025-03-10T08:15:00Z',
    durationSecs: 754,
    totalDistance: 1832.4,
    maxAltitude: 118.5,
    maxSpeed: 14.2,
    pointCount: 1520,
    photoCount: 6,
    videoCount: 1,
    tags: [{ tag: 'survey', tagType: 'manual' }],
    notes: null,
    color: '#38bdf8',
    rcSerial: 'RB-RC-01',
    batteryLife: null,
  },
  {
    id: 2,
    fileName: 'rb-log-0002.txt',
    displayName: 'Ridge Traverse',
    fileHash: 'rbhash0002',
    droneModel: 'DJI Mini 4 Pro',
    droneSerial: 'RB-DR-02',
    aircraftName: null,
    batterySerial: 'RB-BAT-02',
    cycleCount: 88,
    startTime: '2025-03-11T16:40:00Z',
    durationSecs: 1423,
    totalDistance: 4210.9,
    maxAltitude: 205.0,
    maxSpeed: 18.6,
    pointCount: 2870,
    photoCount: 12,
    videoCount: 0,
    tags: [{ tag: 'survey', tagType: 'manual' }],
    notes: null,
    color: '#a78bfa',
    rcSerial: 'RB-RC-01',
    batteryLife: null,
  },
  {
    id: 3,
    fileName: 'rb-log-0003.txt',
    displayName: 'Quarry Volume Pass',
    fileHash: 'rbhash0003',
    droneModel: 'DJI Air 3',
    droneSerial: 'RB-DR-03',
    aircraftName: 'Air Three',
    batterySerial: 'RB-BAT-03',
    cycleCount: 210,
    startTime: '2025-03-18T11:05:00Z',
    durationSecs: 412,
    totalDistance: 906.2,
    maxAltitude: 62.3,
    maxSpeed: 9.8,
    pointCount: 840,
    photoCount: 0,
    videoCount: 0,
    tags: [],
    notes: 'second pass',
    color: '#34d399',
    rcSerial: 'RB-RC-02',
    batteryLife: null,
  },
  {
    id: 4,
    fileName: 'rb-log-0004.txt',
    displayName: 'Night Perimeter Loop',
    fileHash: 'rbhash0004',
    droneModel: 'DJI Air 3',
    droneSerial: 'RB-DR-03',
    aircraftName: 'Air Three',
    batterySerial: 'RB-BAT-01',
    cycleCount: 122,
    startTime: '2025-04-02T21:30:00Z',
    durationSecs: 2310,
    totalDistance: 6480.0,
    maxAltitude: 88.9,
    maxSpeed: 16.1,
    pointCount: 4610,
    photoCount: 3,
    videoCount: 2,
    tags: [{ tag: 'night', tagType: 'auto' }],
    notes: null,
    color: '#f472b6',
    rcSerial: 'RB-RC-02',
    batteryLife: null,
  },
  {
    id: 5,
    fileName: 'rb-log-0005.txt',
    displayName: 'Field Grid A',
    fileHash: 'rbhash0005',
    droneModel: 'Autel EVO Nano',
    droneSerial: 'RB-DR-04',
    aircraftName: null,
    batterySerial: 'RB-BAT-04',
    cycleCount: 45,
    startTime: '2025-04-09T07:00:00Z',
    durationSecs: 599,
    totalDistance: 1204.5,
    maxAltitude: null,
    maxSpeed: 11.3,
    pointCount: 1180,
    photoCount: 2,
    videoCount: 0,
    tags: [],
    notes: null,
    color: '#fbbf24',
    rcSerial: 'RB-RC-03',
    batteryLife: null,
  },
  {
    id: 6,
    fileName: 'rb-log-0006.txt',
    displayName: 'Field Grid B',
    fileHash: 'rbhash0006',
    droneModel: 'Autel EVO Nano',
    droneSerial: 'RB-DR-04',
    aircraftName: null,
    batterySerial: 'RB-BAT-04',
    cycleCount: 46,
    startTime: '2025-04-09T09:20:00Z',
    durationSecs: 601,
    totalDistance: null,
    maxAltitude: 141.2,
    maxSpeed: 12.0,
    pointCount: 1205,
    photoCount: 0,
    videoCount: 1,
    tags: [],
    notes: null,
    color: '#fbbf24',
    rcSerial: 'RB-RC-03',
    batteryLife: null,
  },
  {
    id: 7,
    fileName: 'rb-log-0007.txt',
    displayName: 'Coastline Sweep',
    fileHash: 'rbhash0007',
    droneModel: 'DJI Mini 4 Pro',
    droneSerial: 'RB-DR-01',
    aircraftName: null,
    batterySerial: 'RB-BAT-05',
    cycleCount: 310,
    startTime: '2025-04-21T14:55:00Z',
    durationSecs: 3600,
    totalDistance: 12450.75,
    maxAltitude: 76.4,
    maxSpeed: 21.7,
    pointCount: 7200,
    photoCount: 24,
    videoCount: 3,
    tags: [{ tag: 'survey', tagType: 'manual' }, { tag: 'night', tagType: 'auto' }],
    notes: null,
    color: '#38bdf8',
    rcSerial: 'RB-RC-01',
    batteryLife: null,
  },
  {
    id: 8,
    fileName: 'rb-log-0008.txt',
    displayName: 'Rooftop Inspection',
    fileHash: 'rbhash0008',
    droneModel: 'DJI Mavic 3',
    droneSerial: 'RB-DR-05',
    aircraftName: null,
    batterySerial: 'RB-BAT-06',
    cycleCount: 12,
    startTime: '2025-05-06T18:05:00Z',
    durationSecs: 121,
    totalDistance: 208.6,
    maxAltitude: 34.0,
    maxSpeed: 5.4,
    pointCount: 240,
    photoCount: 9,
    videoCount: 0,
    tags: [],
    notes: null,
    color: '#94a3b8',
    rcSerial: null,
    batteryLife: null,
  },
  {
    id: 9,
    fileName: 'rb-log-0009.txt',
    displayName: 'Test Bench Hover',
    fileHash: 'rbhash0009',
    droneModel: 'DJI Mavic 3',
    droneSerial: 'RB-DR-05',
    aircraftName: null,
    batterySerial: null,
    cycleCount: null,
    startTime: '2025-05-14T12:00:00Z',
    durationSecs: null,
    totalDistance: null,
    maxAltitude: null,
    maxSpeed: null,
    pointCount: 60,
    photoCount: 0,
    videoCount: 0,
    tags: [],
    notes: 'no telemetry',
    color: '#94a3b8',
    rcSerial: null,
    batteryLife: null,
  },
];

/**
 * `get_overview_stats` payload.
 *
 * 🔴 Deliberately NOT self-consistent with RB_FLIGHTS: the Rust backend counts every row in
 * the database (including the three archived imports below), while src/components/dashboard/
 * Overview.tsx recomputes every card it renders from the `flights` prop it is handed
 * (`filteredStats`, Overview.tsx:95-278) and only ever reads `stats.maxDistanceFromHomeM`
 * and `stats.topDistanceFlights` off this object. So totalFlights 12 here next to 9 loaded
 * flights is the seed's intended two-layer shape, not a bug - it is registered as decoy
 * symptom 1 in meta.json and guarded by a P2P checkpoint.
 */
export const RB_OVERVIEW: OverviewStats = {
  totalFlights: 12,
  totalDistanceM: 41288.5,
  totalDurationSecs: 15233,
  totalPoints: 20985,
  totalPhotos: 88,
  totalVideos: 11,
  maxAltitudeM: 244.8,
  maxDistanceFromHomeM: 0,
  batteriesUsed: [],
  dronesUsed: [],
  flightsByDate: [],
  topFlights: [],
  topDistanceFlights: [],
  batteryHealthPoints: [],
};

/** `list_profiles` — one unlocked profile so the InitializationOverlay auth wall never shows. */
export const RB_PROFILES: { name: string; hasPassword: boolean }[] = [
  { name: 'default', hasPassword: false },
];

/** `get_battery_pairs` — raw pair tokens, exactly the wire shape src/lib/api.ts:428 returns.
 *  Token 2 is a deliberate AMBIGUOUS chain (RB-BAT-03 wants RB-BAT-02, which token 1 already
 *  claimed): buildBatteryPairIndex must keep the first valid mapping and drop token 2.
 *  Token 3 is a self-pair and token 4 has a non-serial-like left side; both must be rejected. */
export const RB_BATTERY_PAIRS: string[] = [
  'RB-BAT-01:RB-BAT-02',
  'RB-BAT-03:RB-BAT-02',
  'RB-BAT-05:RB-BAT-05',
  'XX:RB-BAT-06',
];

/** `get_equipment_names` — the [[serial, name], ...] tuple shape src/lib/api.ts:476 decodes.
 *  The battery name carries the seed's decommissioned marker "[X]" (utils.ts isDecommissioned),
 *  and the aircraft name is the server-side rename that must WIN over any stale
 *  localStorage `droneNameMap` left behind by loadEquipmentNames' documented merge. */
export const RB_EQUIPMENT_NAMES: [Array<[string, string]>, Array<[string, string]>] = [
  [['RB-BAT-05', 'Coast Pack [X]']],
  [['RB-DR-03', 'Survey Hawk']],
];

/** `get_all_tags`. */
export const RB_ALL_TAGS: string[] = ['night', 'survey'];

/** `get_setting_value` backing store (empty: every setting falls back to its seed default). */
export const RB_SETTINGS: Record<string, string> = {};

/** Deterministic answers for the runtime hosts measured in RECON §3.1. Keyed by hostname. */
export const RB_NET_FIXTURES: Record<string, { status: number; type: string; body: string }> = {
  'api.github.com': {
    status: 200,
    type: 'application/json',
    body: JSON.stringify({ tag_name: 'v0.0.0-rb', name: 'RB pinned release', html_url: 'https://example.invalid/rb' }),
  },
  'archive-api.open-meteo.com': {
    status: 200,
    type: 'application/json',
    body: JSON.stringify({ latitude: 0, longitude: 0, hourly: { time: [], temperature_2m: [], wind_speed_10m: [] } }),
  },
  'nominatim.openstreetmap.org': {
    status: 200,
    type: 'application/json',
    body: JSON.stringify([{ display_name: 'RB Reverse Geocode Fixture', lat: '0', lon: '0' }]),
  },
};

/** Minimal valid MapLibre style: no sources, no layers, no glyphs, no sprite - so a style
 *  request can never cascade into tile / glyph / sprite fetches. */
export const RB_EMPTY_MAP_STYLE = JSON.stringify({ version: 8, name: 'rb-empty', sources: {}, layers: [] });

/** 1x1 transparent PNG, base64 - answers every raster tile request without a network. */
export const RB_BLANK_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/** Hosts whose requests are pure presentation and must never reach the network. */
export const RB_MAP_HOSTS: string[] = [
  'basemaps.cartocdn.com',
  'tiles.basemaps.cartocdn.com',
  'services.arcgisonline.com',
  'tile.opentopomap.org',
  'tile.openstreetmap.org',
  'demotiles.maplibre.org',
];
