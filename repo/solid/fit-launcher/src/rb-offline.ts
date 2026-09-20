/* =============================================================================
 * RB ADAPTATION — same-origin offline host desk (ZERO NETWORK AT RUNTIME)
 * -----------------------------------------------------------------------------
 * WHY THIS FILE EXISTS
 *   The seed is the web front end of a Tauri v2 desktop launcher. In a browser
 *   serve every one of its 95 generated host commands (src/bindings.ts) would
 *   reject, `@tauri-apps/api/core#convertFileSrc` would mint an
 *   `http://asset.localhost/...` CROSS-ORIGIN url, and two `fetch` sites
 *   (src/api/changelog/api.ts:144,:210 and
 *   src/pages/Settings-01/.../AppInfo.tsx:25) would reach api.github.com.
 *   Under the repair-bench contract the delivered app runs with
 *   allow_internet=false and every reading must be reproducible run to run, so
 *   this module — installed as the FIRST import of src/index.jsx, before
 *   `await DM.setup()` at index.jsx:12 and before render() at :14 — replaces
 *   the host transport with an in-page, same-origin answer desk.
 *
 *   WHAT IS STUBBED, exhaustively (three surfaces, nothing else):
 *   1. THE IPC DESK. `mockIPC(desk, { shouldMockEvents: true })` from the
 *      seed's own dependency @tauri-apps/api/mocks@2.9.1 replaces
 *      `window.__TAURI_INTERNALS__.invoke`, so all 95 generated commands, all
 *      `plugin:*` calls and — because shouldMockEvents is on — `listen`/`emit`
 *      /`unlisten` are answered in-page. `mockWindows("main")` supplies the
 *      metadata `getCurrentWebviewWindow()` reads (src-tauri/tauri.conf.json
 *      declares exactly one window, labelled "main", so this is transcription,
 *      not invention). Answer shapes are split by how src/bindings.ts declares
 *      them: the 71 Result-wrapped commands get `{ status: "ok", data }`, the
 *      19 raw commands and the 5 void commands get the bare value. The ONE
 *      deliberate exception is `get_install_queue_status`: bindings.ts:446
 *      wraps it, but the only caller, src/components/InstallQueue/
 *      QueueStatus.tsx:41, invokes it RAW through @tauri-apps/api/core, so the
 *      desk answers the raw `{ queue: [], active: null }` that call site reads.
 *      The event bus stays the seed's own: `emit("download::job_updated", job)`
 *      from src/rb-probe.ts is routed by mockIPC's handleEmit straight into the
 *      listeners src/api/manager/api.ts:74 registered, so the flush latch, the
 *      reconcile path and the debounce under test are the app's real code.
 *   2. THE FILE-URL CONVERTER. `__TAURI_INTERNALS__.convertFileSrc` is
 *      replaced with a same-origin `data:image/svg+xml;base64,...` generator
 *      (rb-fixtures.ts#rbCoverDataUri). The stock `mockConvertFileSrc` is NOT
 *      used: it mints `http://asset.localhost/...`, which is cross-origin and
 *      would make "zero network" unprovable. Only two call sites read it
 *      (src/App.tsx:59, src/api/theme/api.ts:205) and both merely assign a CSS
 *      background-image.
 *   3. THE FETCH DESK. `window.fetch` answers `api.github.com` from the
 *      RB_GITHUB_RELEASE fixture and REFUSES-and-COUNTS every other URL, so
 *      "zero network" is a measurable counter (`window.__rb.blockedRequests`)
 *      rather than an assumption. src/api/changelog/api.ts's own sorting /
 *      cleaning / markdown pipeline still runs over that body.
 *
 *   PLUS TWO ONE-LINE HYGIENE SEEDS, both measured off the seed's own branches:
 *   - `localStorage.setItem("version", RB_APP_VERSION)` when absent, so
 *     App.tsx:90 `if (!latestVer)` and :95 `lt(latestVer, updatedVer)` are both
 *     false and the changelog popup never opens over the graded faces.
 *   - a no-op `window.Swal` when absent. environment/adaptation.patch deletes
 *     the two cdn.jsdelivr.net references at index.html:8-9 (the @sweetalert2
 *     theme-dark stylesheet and the sweetalert2@11 bundle); the package is
 *     absent from the offline supply archive (0 hits for "sweetalert" over its
 *     22051 entries) and `rg -n "Swal" src/` returns 0 hits, so nothing in the
 *     app reads it. The no-op is installed only so that a stray dynamic
 *     `Swal.*` call can never raise, never to change a reading.
 *
 * WHAT IS DELIBERATELY *NOT* TOUCHED
 *   Every file the 12 defects land in is byte-identical to the seed:
 *   src/pages/Gamehub-01/GamehubContext.tsx, src/components/Slider-01/
 *   Slider.tsx, src/components/FilterBar/FilterBar.tsx, src/pages/Gamehub-01/
 *   Gamehub-Components-01/Newly-Added-Games-01/Newly-Added-Games.tsx,
 *   src/api/manager/api.ts, src/stores/download.ts, src/components/Topbar-01/
 *   Topbar-Components-01/Searchbar-01/Searchbar.tsx, src/pages/Discovery-01/
 *   Discovery.tsx, src/pages/Library-01/CollectionList/CollectionList.tsx,
 *   src/pages/Gamehub-01/Gamehub-Components-01/Popular-Games-01/
 *   Popular-Games.tsx, src/helpers/gameFilters.ts, src/helpers/format.ts.
 *   The desk hands back the SAME wire shapes the Rust host would have, so the
 *   filtering, formatting, memoisation, store reconciliation and debounce logic
 *   under test is the seed's own.
 *   🔴 The desk is therefore NOT a tested surface: none of the 12 defects lives
 *   in this file, in src/rb-fixtures.ts or in src/rb-probe.ts.
 *
 * DETERMINISM RULES (why the payloads look the way they do)
 *   - No Math.random(), no PRNG, no clock-derived CONTENT: every payload is a
 *     pure function of the fixture tables in src/rb-fixtures.ts.
 *   - Answering costs one macrotask (`setTimeout 0`) so the seed's real async
 *     ordering survives: `await DM.setup()` at index.jsx:12 still resolves
 *     after module evaluation, createResource still goes pending -> data, and
 *     the Suspense fallback in src/pages/Discovery-01/Discovery.tsx:91 is still
 *     reachable.
 *   - `query_search_index` answers after `max(0, 300 - 80 * query.length)` ms.
 *     That per-query budget is a TRANSPORT property of the desk, chosen so an
 *     uncancelled in-flight query can be observed to land out of order; it
 *     fabricates no result content (the answer set is rbSearchAnswer's own
 *     substring filter over a fixed 8-row index).
 * ========================================================================== */
import { mockIPC, mockWindows } from "@tauri-apps/api/mocks";
import {
  RB_ALL_JOBS,
  RB_COLLECTION_LIST,
  RB_DISCOVERY_GAMES,
  RB_DOWNLOADED_GAMES,
  RB_GAMES_TO_DOWNLOAD,
  RB_GAMEHUB_SETTINGS,
  RB_GITHUB_RELEASE,
  RB_GLOBAL_STAT,
  RB_JOB_PUSHES,
  RB_NEWLY_ADDED_GAMES,
  RB_POPULAR_GAMES,
  RB_RECENTLY_UPDATED_GAMES,
  rbCoverDataUri,
  rbHashUrl,
  rbSearchAnswer,
} from "./rb-fixtures";

export const RB_APP_VERSION = "4.2.0";

let rbAnswers = 0;
let rbBlocked = 0;
const rbBlockedUrls: string[] = [];
let rbInvokes = 0;
const rbUnknownCmds: string[] = [];

/* ---------------------------------------------------------------- Result wrap
 * src/bindings.ts wraps 71 of its 95 commands as
 *   { data: await TAURI_INVOKE(cmd, args), status: "ok" }
 * and leaves 19 raw plus 5 void. WRAPPED is that exact 71-name set, transcribed
 * from the generated file.
 *
 * THE DESK ANSWERS EVERY COMMAND WITH THE BARE PAYLOAD, the wrapped ones
 * included, because mockIPC installs `desk` AT the TAURI_INVOKE level: the
 * envelope above is built by src/bindings.ts on top of whatever the desk
 * returns. Enveloping here as well double-wraps, and the failure is not
 * cosmetic. Measured on the clean face with the envelope in place:
 *   commands.getPopularGames() resolved to
 *     { status:"ok", data:{ status:"ok", data:[ ...5 games ] } }
 *   -> GamesCacheApi.removeNSFW() returned that inner envelope instead of the
 *      array (nsfw_censorship is false, so it returns its argument untouched)
 *   -> GamehubContext.tsx:132 `[...popular(), ...newlyAdded(), ...recentlyUpdated()]`
 *      threw "popular is not a function or its return value is not iterable"
 *   -> the Gamehub resource rejected and the workspace rendered as a shell:
 *      112 DOM elements instead of 350, 13 data-testid nodes instead of 60, no
 *      rb-hero, 0 rb-slider-card, and every catalogue reading in the DSL "".
 * With the bare payload the same face renders rb-hero (Iron Vantage / 512.0 GB)
 * and 15 slider cards. WRAPPED is kept only as the census that the
 * unknown-command counter and rbOfflineStats().wrappedCommands report against. */
const WRAPPED = new Set<string>([
  "add_downloaded_game", "add_game_to_collection", "aria2_global_stat",
  "cached_download_image", "change_dns_settings", "change_download_settings",
  "change_gamehub_settings", "change_installation_settings",
  "check_dominant_color_vec", "clear_all_cache", "clear_game_cache",
  "clear_image_cache", "config_change_only_path", "create_collection",
  "credentials_exists", "credentials_get", "credentials_list",
  "credentials_remove", "credentials_status", "credentials_store",
  "debrid_add_torrent", "debrid_check_cache", "debrid_delete_torrent",
  "debrid_get_download_link", "debrid_get_download_links",
  "debrid_get_torrent_info", "debrid_get_torrent_status",
  "decrypt_torrent_from_paste", "delete_game_folder_recursively",
  "dm_add_ddl_job", "dm_add_torrent_job", "dm_all_jobs", "dm_clean_job",
  "dm_extract_and_install", "dm_load_from_disk", "dm_pause", "dm_remove",
  "dm_resume", "dm_run_automate_setup_install", "dm_save_now",
  "folder_exclusion", "folder_exclusion_cleanup", "get_discovery_games",
  "get_downloaded_game", "get_download_settings", "get_game_comments",
  "get_games_images", "get_install_queue_status", "get_newly_added_games",
  "get_popular_games", "get_recently_updated_games", "get_singular_game_info",
  "get_singular_game_local", "get_torrent_hash", "import_cookies",
  "import_cookies_file", "list_torrent_files", "magnet_to_file",
  "open_logs_directory", "query_search_index", "rebuild_search_index",
  "reclaim_space", "remove_collection", "remove_downloaded_game",
  "remove_game_from_collection", "remove_game_to_download",
  "reset_dns_settings", "reset_gamehub_settings", "reset_installation_settings",
  "set_capacity", "update_downloaded_game_executable_info",
]);

/* Census only, now that the desk adds no envelope of its own: commands a raw
 * `invoke` call site reaches without going through the generated wrapper
 * (QueueStatus.tsx:41 is the single member today). Kept so the unknown-command
 * counter below still classifies all 95 names, and so a future raw call site is
 * a one-line addition rather than a shape bug. */
const RAW_OVERRIDE = new Set<string>(["get_install_queue_status"]);

const delay = (ms: number) => new Promise<void>((r) => { setTimeout(r, ms); });

/* The search desk's per-query budget: shorter queries take LONGER, so when the
 * debounce's clearTimeout is missing and three queries are in flight at once,
 * the widest one lands last and the rendered list identifies it unambiguously. */
const searchDelay = (q: string) => Math.max(0, 300 - 80 * q.length);

function deskAnswer(cmd: string, args: Record<string, unknown>): unknown {
  switch (cmd) {
    /* ---- game catalogue (Gamehub rails + Discovery grid) ---- */
    case "get_popular_games": return RB_POPULAR_GAMES;
    case "get_newly_added_games": return RB_NEWLY_ADDED_GAMES;
    case "get_recently_updated_games": return RB_RECENTLY_UPDATED_GAMES;
    case "get_discovery_games": return RB_DISCOVERY_GAMES;
    case "get_singular_game_local":
    case "get_singular_game_info":
      return RB_DISCOVERY_GAMES[0];

    /* ---- download manager ---- */
    case "dm_all_jobs": return RB_ALL_JOBS;
    case "aria2_global_stat": return RB_GLOBAL_STAT;

    /* ---- search index ---- */
    case "query_search_index": return rbSearchAnswer(String(args.query ?? ""));

    /* ---- image cache ---- */
    case "cached_download_image": return rbCoverDataUri(String(args.imageUrl ?? ""));
    case "get_games_images": return [rbCoverDataUri(String(args.gameLink ?? ""))];
    case "check_dominant_color_vec": return { r: 40, g: 60, b: 90 };

    /* ---- library ---- */
    case "get_collection_list": return RB_COLLECTION_LIST;
    case "get_downloaded_games": return RB_DOWNLOADED_GAMES;
    case "get_games_to_download": return RB_GAMES_TO_DOWNLOAD;
    case "get_downloaded_game": return RB_DOWNLOADED_GAMES[0];

    /* ---- url hashing (bindings.ts:511, RAW) ---- */
    case "hash_url": return rbHashUrl(String(args.url ?? ""));

    /* ---- settings ---- */
    case "get_gamehub_settings": return RB_GAMEHUB_SETTINGS;
    case "get_download_settings": return {
      general: { folder_exclusion_cleanup: false },
      bittorrent: {},
      network: {},
      transfer_limits: {},
    };
    case "get_dns_settings": return { enabled: false, servers: [] };
    case "get_installation_settings": return {
      install_path: "/rb/games",
      download_path: "/rb/downloads",
    };
    case "get_used_space": return 0;
    case "is_controller_running": return false;

    /* ---- install queue (QueueStatus.tsx:41 reads this RAW) ---- */
    case "get_install_queue_status": return { queue: [], active: null };

    /* ---- the 10 commands src/bindings.ts declares RAW (`return await
     * TAURI_INVOKE(...)` with no { data, status } wrapper). They were reachable
     * only through the `default: return null` branch below, which answered four
     * of them with the wrong SHAPE (an array-typed command answered null). Each
     * is now answered with the type its own bindings.ts signature declares, and
     * each is listed in RAW_DECLARED so the unknown-command counter stays a real
     * signal over all 95 commands instead of firing on these. Signature lines:
     *   :235 debridListProviders()            : Promise<DebridProviderInfo[]>
     *   :342 executableInfoDiscovery(..)      : Promise<ExecutableInfo | null>
     *   :345 extractFuckingfastDdl(..)        : Promise<DirectLink[]>
     *   :353 findGameExecutable(..)           : Promise<string | null>
     *   :379 getDatahosterLinks(..)           : Promise<string[] | null>
     *   :393 getDnsSettingsPath()             : Promise<string>
     *   :426 getGamehubSettingsPath()         : Promise<string>
     *   :443 getInstallationSettingsPath()    : Promise<string>
     *   :478 getSearchIndexPathCmd()          : Promise<string>
     *   :687 transformLegacyDownload(..)      : Promise<DownloadedGame[]>   */
    case "debrid_list_providers": return [];
    case "executable_info_discovery": return null;
    case "extract_fuckingfast_ddl": return [];
    case "find_game_executable": return null;
    case "get_datahoster_links": return [];
    case "get_dns_settings_path": return "/rb/appdata/dns_settings.json";
    case "get_gamehub_settings_path": return "/rb/appdata/gamehub_settings.json";
    case "get_installation_settings_path": return "/rb/appdata/installation_settings.json";
    case "get_search_index_path_cmd": return "/rb/appdata/search_index.db";
    case "transform_legacy_download": return [];

    default:
      /* Every mutating command in this app is a fire-and-forget that the caller
       * only inspects through `result.status === "ok"`. Answering null keeps
       * those branches on their success path (e.g. CollectionList.tsx:58) while
       * writing nothing, so a local removal stays local and re-readable. */
      return null;
  }
}

async function desk(cmd: string, args: Record<string, unknown>): Promise<unknown> {
  rbInvokes += 1;

  /* ---- Tauri plugin surface ---- */
  if (cmd.startsWith("plugin:")) {
    switch (cmd) {
      case "plugin:app|version": return RB_APP_VERSION;
      case "plugin:app|name": return "FitLauncher";
      case "plugin:app|tauri_version": return "2.9.1";
      case "plugin:app|identifier": return "test.rb.fitlauncher";
      case "plugin:updater|check": return null;
      case "plugin:dialog|message":
      case "plugin:dialog|open":
      case "plugin:dialog|save": return null;
      case "plugin:dialog|ask":
      case "plugin:dialog|confirm": return false;
      case "plugin:notification|is_permission_granted": return false;
      case "plugin:notification|request_permission": return "denied";
      case "plugin:store|load":
      case "plugin:store|get_store": return 1;
      case "plugin:store|get": return [null, false];
      case "plugin:store|has": return false;
      case "plugin:store|keys": return [];
      case "plugin:store|values": return [];
      case "plugin:store|entries": return [];
      case "plugin:store|length": return 0;
      case "plugin:fs|exists": return false;
      case "plugin:fs|read_dir": return [];
      case "plugin:fs|read_text_file": return "";
      case "plugin:path|resolve_directory": return "/rb/appdata";
      case "plugin:path|join": {
        const parts = Array.isArray(args.paths) ? args.paths : [args.path ?? args.dir ?? ""];
        return String(parts.filter(Boolean).join("/")).replace(/\/+/g, "/");
      }
      case "plugin:path|dirname": {
        const p = String(args.path ?? "");
        return p.slice(0, p.lastIndexOf("/")) || "/";
      }
      case "plugin:path|basename": {
        const p = String(args.path ?? "");
        const ext = args.ext ? String(args.ext) : "";
        const base = p.slice(p.lastIndexOf("/") + 1);
        return ext && base.endsWith(ext) ? base.slice(0, -ext.length) : base;
      }
      case "plugin:path|extname": {
        const p = String(args.path ?? "");
        const i = p.lastIndexOf(".");
        return i < 0 ? "" : p.slice(i);
      }
      case "plugin:path|is_absolute": return String(args.path ?? "").startsWith("/");
      case "plugin:path|normalize": return String(args.path ?? "");
      case "plugin:window|inner_size":
      case "plugin:webview|webview_size": return { width: 1280, height: 900 };
      case "plugin:window|inner_position":
      case "plugin:webview|webview_position": return { x: 0, y: 0 };
      case "plugin:window|outer_size": return { width: 1280, height: 900 };
      case "plugin:window|scale_factor": return 1;
      case "plugin:window|get_all_windows":
      case "plugin:webview|get_all_webviews": return [{ label: "main" }];
      default:
        /* every plugin:window|is_*, plugin:fs|write/mkdir/remove, plugin:shell|*,
         * plugin:process|*, plugin:store|set/save/... : inert, same answer the
         * host gives when there is nothing to report. */
        return cmd.startsWith("plugin:window|is_") || cmd.startsWith("plugin:webview|is_") ? false : null;
    }
  }

  /* ---- the search desk's out-of-order budget is a transport property ---- */
  if (cmd === "query_search_index") await delay(searchDelay(String(args.query ?? "")));
  else await delay(0);

  const data = deskAnswer(cmd, args);
  if (!WRAPPED.has(cmd) && !RAW_OVERRIDE.has(cmd) && !KNOWN_VOID.has(cmd) && !RAW_DECLARED.has(cmd)) {
    if (rbUnknownCmds.length < 20 && !rbUnknownCmds.includes(cmd)) rbUnknownCmds.push(cmd);
  }
  return data;
}

/* The 5 commands src/bindings.ts declares as `await TAURI_INVOKE(...)` with no
 * return value. Listed so the unknown-command counter stays a real signal. */
const KNOWN_VOID = new Set<string>([
  "close_splashscreen", "open_devtools", "quit_app", "start_executable",
  "stop_get_games_images",
]);

/* Every command src/bindings.ts declares RAW - i.e. `return await
 * TAURI_INVOKE(...)` with NO `Result<T, E>` wrapper, so the caller reads the
 * bare value and a `{ status, data }` envelope would be wrong. Answered
 * explicitly in deskAnswer above; listed here so the unknown-command counter
 * covers all 95 commands bindings.ts can invoke and stays a real signal.
 * COVERAGE PROOF (mechanical, re-runnable at design time, 0 network):
 *   bindings.ts `TAURI_INVOKE("<cmd>"` distinct cmd      = 95
 *   WRAPPED(71) + KNOWN_VOID(5) + RAW_OVERRIDE(1) + RAW_DECLARED(19), deduped
 *   for get_install_queue_status which is BOTH wrapped at bindings.ts:446 and
 *   invoked raw at QueueStatus.tsx:41                    = 95
 *   set difference bindings\desk                         = 0
 * Signature lines for the 19 below: :235 debridListProviders, :342
 * executableInfoDiscovery, :345 extractFuckingfastDdl, :353 findGameExecutable,
 * :372 getCollectionList, :379 getDatahosterLinks, :390 getDnsSettings,
 * :393 getDnsSettingsPath, :404 getDownloadedGames, :423 getGamehubSettings,
 * :426 getGamehubSettingsPath, :437 getGamesToDownload, :440
 * getInstallationSettings, :443 getInstallationSettingsPath, :478
 * getSearchIndexPathCmd, :505 getUsedSpace, :511 hashUrl, :550
 * isControllerRunning, :687 transformLegacyDownload. */
const RAW_DECLARED = new Set<string>([
  "debrid_list_providers", "executable_info_discovery", "extract_fuckingfast_ddl",
  "find_game_executable", "get_datahoster_links", "get_dns_settings_path",
  "get_gamehub_settings_path", "get_installation_settings_path",
  "get_search_index_path_cmd", "transform_legacy_download",
  "get_collection_list", "get_dns_settings", "get_downloaded_games",
  "get_gamehub_settings", "get_games_to_download", "get_installation_settings",
  "get_used_space", "hash_url", "is_controller_running",
]);

/* --------------------------------------------------------------- fetch desk */
const RB_FETCH_HOSTS = ["api.github.com"];

if (typeof window !== "undefined") {
  const rbFetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let raw = "";
    try {
      raw = typeof input === "string" ? input : input instanceof URL ? input.href : (input && (input as Request).url) || "";
    } catch { raw = ""; }
    let u: URL;
    try { u = new URL(raw, window.location.href); }
    catch {
      rbBlocked += 1; rbBlockedUrls.push(raw);
      throw new TypeError("RB_OFFLINE_BLOCKED (unparseable url): " + raw);
    }
    if (!RB_FETCH_HOSTS.includes(u.hostname)) {
      /* Fail loud, never silently: any request the app tries to make that is
       * not the one fixture endpoint is refused and counted, so the DSL can
       * prove "zero network" from inside the page. */
      rbBlocked += 1; rbBlockedUrls.push(u.href);
      throw new TypeError("RB_OFFLINE_BLOCKED: " + u.href);
    }
    rbAnswers += 1;
    await delay(0);
    if (init && init.signal && init.signal.aborted) {
      const e = new Error("Aborted"); e.name = "AbortError"; throw e;
    }
    return new Response(JSON.stringify(RB_GITHUB_RELEASE), {
      status: 200, statusText: "OK",
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  window.fetch = rbFetch;

  /* ---- host metadata + same-origin file-url converter ---- */
  mockWindows("main");
  mockIPC(desk, { shouldMockEvents: true });
  (window as any).__TAURI_INTERNALS__.convertFileSrc = (filePath: string) => rbCoverDataUri(String(filePath ?? ""));

  /* ---- hygiene seed 1: suppress the changelog popup (App.tsx:87-100) ---- */
  try {
    if (window.localStorage.getItem("version") === null) {
      window.localStorage.setItem("version", RB_APP_VERSION);
    }
  } catch { /* a context with storage disabled simply never opens the popup */ }

  /* ---- hygiene seed 2: no-op Swal (the CDN bundle index.html:9 used to load;
   *      0 call sites in src/, so this can never move a reading) ---- */
  if (typeof (window as any).Swal === "undefined") {
    const noop = () => Promise.resolve({ isConfirmed: false, isDenied: false, isDismissed: true });
    (window as any).Swal = {
      fire: noop, mixin: () => (window as any).Swal, close: () => undefined,
      isVisible: () => false, getQueueStep: () => null, clickConfirm: () => undefined,
      clickCancel: () => undefined, clickDeny: () => undefined,
    };
  }
}

/* Read-only counters, consumed by src/rb-probe.ts. Nothing here mutates the app. */
export function rbOfflineStats() {
  return {
    answers: rbAnswers,
    blocked: rbBlocked,
    blockedUrls: rbBlockedUrls.slice(0, 20).join("|"),
    fetchHosts: RB_FETCH_HOSTS.join(","),
    invokes: rbInvokes,
    unknownCmds: rbUnknownCmds.slice(0, 20).join(","),
    wrappedCommands: WRAPPED.size,
    rawDeclaredCommands: RAW_DECLARED.size,
    rawOverrideCommands: [...RAW_OVERRIDE].join(","),
    pushKeys: Object.keys(RB_JOB_PUSHES).join(","),
    appVersion: RB_APP_VERSION,
  };
}
