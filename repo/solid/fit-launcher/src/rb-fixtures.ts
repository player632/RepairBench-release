/* =============================================================================
 * RB ADAPTATION — deterministic offline fixture tables (ZERO NETWORK)
 * -----------------------------------------------------------------------------
 * Every value in this file is a FIXTURE, not app logic and not a measurement.
 * Shapes are transcribed verbatim from the seed's own generated Tauri bindings
 * (src/bindings.ts: `Game` :827, `DownloadedGame` :777, `Job` :859,
 * `JobMetadata` :860, `AggregatedStatus` :710, `GlobalStat` :855,
 * `GamehubSettings` :853, `SearchIndexEntry` :866, `DownloadState` :776,
 * `DownloadSource` :775, `FileInfo` :809, `DdlJob`, `ExecutableInfo` :805,
 * `InstallationInfo` :857), so nothing here invents a field the app does not
 * already declare.
 *
 * 🔴 NOT A TESTED SURFACE. No defect lives in this file. It is the data the
 * Rust host would have handed over; all parsing, filtering, formatting,
 * reactivity and timing under test is the seed's own code.
 *
 * DETERMINISM RULES
 *   - no Math.random(), no Date.now() in any CONTENT field, no clock-derived
 *     text: a reading taken from a fixture is a pure function of this table.
 *   - image fields are SAME-ORIGIN relative paths. They are never fetched
 *     cross-origin: `cached_download_image` (answered by rb-offline.ts) hands
 *     back a same-origin data: URI, and even on a fallback path the browser
 *     resolves them against the verifier's own origin.
 *   - `query_search_index` answers are delayed by a per-query budget that
 *     SHRINKS with query length (see rb-offline.ts). That is a transport
 *     property of the fixture desk, chosen so an uncancelled in-flight query
 *     can be observed to land out of order; it fabricates no result content.
 * ========================================================================== */

export type RbGameRow = {
  slug: string;
  title: string;
  tag: string;
  company: string;
  language: string;
  originalGb: number;
  repackGb: number;
  blurb: string;
};

/* 12 rows. Tag sets are chosen so that (every count below is recomputed from
 * THIS table by calc/predict.mjs running the seed's own extractGenres/filterGames,
 * not hand-typed):
 *   - "Strategy" matches exactly 7 rows
 *   - "Puzzle"   matches exactly 4 rows
 *   - "Action"   matches exactly 7 rows
 *   - "Strategy" OR "Puzzle"  matches exactly 9 rows, while
 *     "Strategy" AND "Puzzle" matches exactly 2 (glass-orchard, kiln-song) -
 *     that 9-vs-2 gap is what the genre quantifier face reads
 *   - every row carries >= 2 genres, so the genre picker has a real option set
 * Sizes straddle the 1024 boundaries so the two size formatters in
 * src/helpers/format.ts and src/helpers/gameFilters.ts disagree in observable,
 * reproducible ways. */
export const RB_GAME_ROWS: RbGameRow[] = [
  { slug: "alpha-tide",     title: "Alpha Tide",                        tag: "Action, Adventure, Strategy",   company: "Northwind Interactive", language: "English, French",  originalGb: 42.5, repackGb: 18.25, blurb: "A coastal smuggling saga told across three decades of tide tables." },
  { slug: "brine-hollow",   title: "Brine Hollow",                      tag: "Action, Horror",                company: "Northwind Interactive", language: "English",          originalGb: 12,   repackGb: 5.5,   blurb: "Descend into a flooded mine whose crews never surfaced." },
  { slug: "cardinal-drift", title: "Cardinal Drift (Deluxe Edition)",   tag: "Racing, Action, Strategy",      company: "Veloce Works",          language: "English, Italian", originalGb: 61,   repackGb: 27.75, blurb: "Street circuits, tuned engines and a championship that never ends." },
  { slug: "dune-signal",    title: "Dune Signal",                       tag: "Strategy, Simulation",          company: "Kessel Runtime",        language: "English, German",  originalGb: 8.4,  repackGb: 3.125, blurb: "Build a relay network across a desert that keeps moving." },
  { slug: "ember-fall",     title: "Ember Fall",                        tag: "Action, Puzzle",                company: "Kessel Runtime",        language: "English, Spanish", originalGb: 25,   repackGb: 11,    blurb: "Burn the archive before the archive burns you." },
  { slug: "ferrous-light",  title: "Ferrous Light",                     tag: "Puzzle, Indie",                 company: "Anvil Nine",            language: "English",          originalGb: 1.5,  repackGb: 0.6875, blurb: "Fold iron into lenses and read the sky through them." },
  { slug: "glass-orchard",  title: "Glass Orchard",                     tag: "Simulation, Strategy, Puzzle",  company: "Anvil Nine",            language: "English, Japanese", originalGb: 14.2, repackGb: 6.25,  blurb: "Tend a greenhouse of blown glass and stubborn roots." },
  { slug: "halcyon-pit",    title: "Halcyon Pit",                       tag: "Action, Adventure",             company: "Veloce Works",          language: "English",          originalGb: 33.75, repackGb: 15.5, blurb: "A quiet mining town, a very loud cavern." },
  { slug: "iron-vantage",   title: "Iron Vantage",                      tag: "Strategy, Action",              company: "Meridian Forge",        language: "English, Russian", originalGb: 1024, repackGb: 512,   blurb: "Command a fortress that can only see downhill." },
  { slug: "juniper-run",    title: "Juniper Run",                       tag: "Racing, Indie",                 company: "Meridian Forge",        language: "English",          originalGb: 4,    repackGb: 1.75,  blurb: "Forest rally stages, one handbrake, no regrets." },
  { slug: "kiln-song",      title: "Kiln Song",                         tag: "Puzzle, Indie, Strategy",       company: "Anvil Nine",            language: "English, Korean",  originalGb: 2.25, repackGb: 1.0625, blurb: "Fire pottery to the pitch it sings at." },
  { slug: "larch-bloom",    title: "Larch Bloom",                       tag: "Action, Strategy, Simulation",  company: "Northwind Interactive", language: "English, French",  originalGb: 57.375, repackGb: 24.5, blurb: "A slow apocalypse and the people who plant through it." },
];

const detailsOf = (r: RbGameRow): string =>
  [
    `Genres/Tags: ${r.tag}`,
    `Companies: ${r.company}`,
    `Languages: ${r.language}`,
    `Original Size: ${r.originalGb} GB`,
    `Repack Size: ${r.repackGb} GB`,
  ].join("\n");

/* A `Game` exactly as src/bindings.ts:827 declares it. */
export const rbGame = (r: RbGameRow) => ({
  title: r.title,
  img: `covers/${r.slug}.svg`,
  details: detailsOf(r),
  features: `- Repacked from official release\n- No ripped audio\n- Setup time under two minutes`,
  description: `${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb} ${r.blurb}`,
  gameplay_features: "- Single player\n- Controller support",
  included_dlcs: "",
  magnetlink: `magnet:?xt=urn:btih:rb${r.slug.replace(/-/g, "")}`,
  href: `https://invalid.example.test/repacks/${r.slug}`,
  tag: r.tag,
  secondary_images: [`covers/${r.slug}-shot.svg`],
});

export type RbGame = ReturnType<typeof rbGame>;

const rows = (...slugs: string[]): RbGame[] =>
  slugs
    .map((s) => RB_GAME_ROWS.find((r) => r.slug === s))
    .filter((r): r is RbGameRow => Boolean(r))
    .map(rbGame);

export const RB_POPULAR_GAMES: RbGame[] = rows(
  "iron-vantage", "cardinal-drift", "alpha-tide", "glass-orchard", "larch-bloom"
);
export const RB_NEWLY_ADDED_GAMES: RbGame[] = rows(
  "alpha-tide", "brine-hollow", "cardinal-drift", "dune-signal",
  "ember-fall", "ferrous-light", "glass-orchard", "halcyon-pit"
);
export const RB_RECENTLY_UPDATED_GAMES: RbGame[] = rows(
  "cardinal-drift", "dune-signal", "ember-fall", "iron-vantage",
  "juniper-run", "kiln-song", "larch-bloom"
);
export const RB_DISCOVERY_GAMES: RbGame[] = RB_GAME_ROWS.map(rbGame);

/* `GamehubSettings` — src/bindings.ts:853. */
export const RB_GAMEHUB_SETTINGS = {
  nsfw_censorship: false,
  auto_get_colors_popular_games: false,
  close_to_tray: false,
  game_page_allow_comments: false,
};

/* `GlobalStat` — src/bindings.ts:855. The Downloads page prints downloadSpeed
 * and uploadSpeed through src/helpers/format.ts#formatSpeed and numActive raw. */
export const RB_GLOBAL_STAT = {
  downloadSpeed: 5 * 1024 * 1024 + 256 * 1024,
  uploadSpeed: 384 * 1024,
  numActive: 2,
  numWaiting: 1,
  numStopped: 0,
  numStoppedTotal: 0,
};

const jobGame = rbGame(RB_GAME_ROWS[0]);
const jobGameB = rbGame(RB_GAME_ROWS[1]);

/* `Job` — src/bindings.ts:859 / `JobMetadata` :860 / `AggregatedStatus` :710.
 * job-alpha starts WITH a status, job-beta starts with status null so the
 * Downloads page's torrent/direct badge counters have something to move on. */
export const RB_ALL_JOBS = [
  {
    id: "job-alpha",
    metadata: {
      game_title: jobGame.title,
      target_path: "/rb/downloads/alpha-tide",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    game: jobGame,
    job_path: "/rb/downloads/alpha-tide",
    source: "Torrent",
    gids: ["rbgid0001"],
    ddl: null,
    torrent: { torrent_bytes: [], file_indices: [0], torrent_files: [], info_hash: "rbhash0001", magnet: jobGame.magnetlink },
    state: "active",
    status: {
      total_length: 18 * 1024 * 1024 * 1024,
      completed_length: 4 * 1024 * 1024 * 1024 + 512 * 1024 * 1024,
      download_speed: 2 * 1024 * 1024,
      upload_speed: 128 * 1024,
      per_file: {},
      state: "active",
      progress_percentage: 25.0,
    },
  },
  {
    id: "job-beta",
    metadata: {
      game_title: jobGameB.title,
      target_path: "/rb/downloads/brine-hollow",
      created_at: "2026-01-02T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
    },
    game: jobGameB,
    job_path: "/rb/downloads/brine-hollow",
    source: "Ddl",
    gids: ["rbgid0002"],
    ddl: {
      files: [
        { url: "https://invalid.example.test/dl/part1", filename: "setup.bin", size: 512 },
        { url: "https://invalid.example.test/dl/part2", filename: "setup-1.bin", size: 6 * 1024 * 1024 * 1024 },
      ],
    },
    torrent: null,
    state: "active",
    status: null,
  },
];

/* A THIRD job that only ever arrives over the event bus, never from
 * dm_all_jobs. It is what makes the flush-latch face observable: a job that
 * shows up in a LATER batch has to be carried by a second scheduled flush. */
const jobGameC = rbGame(RB_GAME_ROWS[2]);

export const RB_JOB_GAMMA = {
  id: "job-gamma",
  metadata: {
    game_title: jobGameC.title,
    target_path: "/rb/downloads/cardinal-drift",
    created_at: "2026-01-03T00:00:00Z",
    updated_at: "2026-01-03T00:00:00Z",
  },
  game: jobGameC,
  job_path: "/rb/downloads/cardinal-drift",
  source: "Torrent",
  gids: ["rbgid0003"],
  ddl: null,
  torrent: { torrent_bytes: [], file_indices: [0], torrent_files: [], info_hash: "rbhash0003", magnet: jobGameC.magnetlink },
  state: "active",
  status: {
    total_length: 27 * 1024 * 1024 * 1024,
    completed_length: 1024 * 1024 * 1024,
    download_speed: 1024 * 1024,
    upload_speed: 0,
    per_file: {},
    state: "active",
    progress_percentage: 3.7,
  },
};

/* Two successive host pushes for job-alpha. The second one flips `state` to
 * "complete", which is what the Downloads row's store-driven probe attribute
 * reads, and it is the transition that the flush latch and the store write
 * path each have to carry. */
export const rbJobUpdate = (progressPercentage: number, state: string) => ({
  ...RB_ALL_JOBS[0],
  state,
  status: {
    ...RB_ALL_JOBS[0].status,
    completed_length: Math.round((progressPercentage / 100) * 18 * 1024 * 1024 * 1024),
    progress_percentage: progressPercentage,
    state,
  },
});

/* Named host pushes. The DSL never inlines a payload: it names one of these
 * keys and rb-probe.ts emits it through @tauri-apps/api/event#emit, which
 * mockIPC({ shouldMockEvents: true }) routes to the app own listeners. */
export const RB_JOB_PUSHES: Record<string, unknown> = {
  "alpha-30": rbJobUpdate(30, "active"),
  "alpha-complete": rbJobUpdate(100, "complete"),
  gamma: RB_JOB_GAMMA,
};

/* `SearchIndexEntry` — src/bindings.ts:866. MEASURED against this table by
 * calc/predict.mjs: query "a" answers 7, "al" answers 5, "alp" answers 2 — a
 * strictly shrinking set, so whichever answer lands LAST is unambiguously
 * identifiable from the rendered list (the debounce face types a, l, p and the
 * uncancelled in-flight "a" answer is the one that lands last). */
const RB_SEARCH_INDEX: { title: string; slug: string }[] = [
  { title: "Alpha Tide", slug: "alpha-tide" },
  { title: "Alpine Ascent", slug: "alpine-ascent" },
  { title: "Altar of Ash", slug: "altar-of-ash" },
  { title: "Amber Circuit", slug: "amber-circuit" },
  { title: "Astral Ferry", slug: "astral-ferry" },
  { title: "Atlas Bloom", slug: "atlas-bloom" },
  { title: "Brine Hollow", slug: "brine-hollow" },
  { title: "Cardinal Drift", slug: "cardinal-drift" },
];

export const rbSearchAnswer = (query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return RB_SEARCH_INDEX.filter((e) => e.title.toLowerCase().includes(q)).map((e) => ({
    slug: e.slug,
    title: e.title,
    href: `https://invalid.example.test/repacks/${e.slug}`,
  }));
};

/* Deterministic stand-in for the Rust url hasher: same string in, same number
 * out, always in the safe-integer range. */
export const rbHashUrl = (url: string): number => {
  let h = 2166136261;
  for (let i = 0; i < url.length; i += 1) {
    h ^= url.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % 1000000007;
};

/* `DownloadedGame` — src/bindings.ts:777 (Library page). */
export const RB_DOWNLOADED_GAMES = [
  {
    ...rbGame(RB_GAME_ROWS[0]),
    executable_info: {
      executable_path: "/rb/games/alpha-tide/AlphaTide",
      executable_last_opened_date: "2026-02-03T18:00:00Z",
      executable_play_time: 90,
      executable_installed_date: "2026-01-04T09:30:00Z",
      executable_disk_size: 18 * 1024 * 1024 * 1024,
    },
    installation_info: {
      output_folder: "/rb/games/alpha-tide",
      download_folder: "/rb/downloads/alpha-tide",
      file_list: ["setup.bin"],
    },
  },
  {
    ...rbGame(RB_GAME_ROWS[4]),
    executable_info: {
      executable_path: "/rb/games/ember-fall/EmberFall",
      executable_last_opened_date: null,
      executable_play_time: 0,
      executable_installed_date: "2026-02-11T09:30:00Z",
      executable_disk_size: 11 * 1024 * 1024 * 1024,
    },
    installation_info: {
      output_folder: "/rb/games/ember-fall",
      download_folder: "/rb/downloads/ember-fall",
      file_list: ["setup.bin"],
    },
  },
];

export const RB_GAMES_TO_DOWNLOAD: RbGame[] = rows("kiln-song");

/* `GameCollection` — src/bindings.ts (get_collection_list, RAW / not Result
 * wrapped). ONE custom collection with TWO games. The Library page renders one
 * CollectionList per entry, and the collapse/expand re-read face needs a
 * collection whose local removal can be observed to come back. */
export const RB_COLLECTION_LIST = [
  {
    name: "winter_backlog",
    games_list: rows("glass-orchard", "halcyon-pit"),
  },
];

/* The GitHub release the changelog popup asks for. Answered SAME-ORIGIN by the
 * fetch desk in rb-offline.ts; the sorting / cleaning / markdown pipeline in
 * src/api/changelog/api.ts stays the seed's own and still runs over it. */
export const RB_GITHUB_RELEASE = {
  tag_name: "v4.2.0",
  name: "Fit Launcher 4.2.0",
  published_at: "2026-03-04T00:00:00Z",
  html_url: "https://invalid.example.test/release",
  body: [
    "## What changed",
    "",
    "- feat: discovery pager keeps its place across filters",
    "- fix: download row repaints on every host push",
    "- chore: dependency bump",
    "- refactor: genre picker selection model",
    "",
    "<!-- a comment the cleaner is supposed to strip -->",
    "See the assets to download this release and verify the checksum.",
  ].join("\n"),
};

/* A 1x1 same-origin SVG data URI, hue picked from the input string so two
 * different covers never render identically. Pure function, no clock, no PRNG. */
export const rbCoverDataUri = (src: string): string => {
  let h = 0;
  for (let i = 0; i < src.length; i += 1) h = (h * 31 + src.charCodeAt(i)) % 360;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">` +
    `<rect width="8" height="8" fill="hsl(${h},45%,35%)"/></svg>`;
  let bin = "";
  for (let i = 0; i < svg.length; i += 1) bin += String.fromCharCode(svg.charCodeAt(i));
  return "data:image/svg+xml;base64," + btoa(bin);
};
