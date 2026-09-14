import { rbNote, rbProbe } from "../probe";

type Args = Record<string, unknown> | undefined;
type Impl = (args: Args) => unknown;

/**
 * Every `invoke` command name the seed's `src/` actually calls, measured by
 * scanning the tree for `invoke(<...>)("<name>"` (45 distinct names across 27
 * files - the census is recorded in the design receipt). Each answers with the
 * benign empty value of the shape its single call site reads, so that:
 *
 *  - nothing on the mount path ever rejects (a rejection inside
 *    `innertubePost`'s `authHeaders()` or `useYtdlpSetup()` would surface as an
 *    unhandled error and blank the page - the failure mode that made the
 *    sibling `markpad` seat read `rej: transformCallback` on all seven states);
 *  - the app boots signed-out, with no accounts, no cache, no yt-dlp and no
 *    Last.fm/Discord integration, which is the deterministic posture every
 *    checkpoint is written against;
 *  - `get_auth_context` returns an EMPTY cookie, so `authHeaders()` short
 *    circuits to `{}` and `crypto.subtle` is never touched.
 *
 * A command name that is not in the table resolves `null` and is recorded in
 * `window.__rb.unknown` rather than rejecting, so an unmodelled call site can
 * never turn into an infrastructure red.
 */
const TABLE: Record<string, Impl> = {
  // ---- auth / accounts -------------------------------------------------
  is_logged_in: () => false,
  get_auth_context: () => ({ cookie: "", pageId: null }),
  merge_response_cookies: () => false,
  clear_cookies: () => null,
  start_login: () => null,
  list_accounts: () => [],
  get_active_account_id: () => null,
  switch_account: () => null,
  remove_account: () => null,
  update_account_meta: () => null,
  set_account_channel: () => null,

  // ---- cover art / cache ----------------------------------------------
  // Echoes the URL it was handed. `cacheCoverToDisk()` only runs when
  // `getHighResVariant()` produced an upgrade, which it never does for the
  // in-tree `/rb-art/*.svg` corpus, so this is a belt-and-braces guard that
  // keeps `resolvedUpgraded` on-origin if a future code path does reach it.
  cache_cover: (args) => (args && typeof args.url === "string" ? args.url : ""),
  download_cover: () => "",
  cover_cache_stats: () => ({ count: 0, bytes: 0 }),
  list_cache: () => [],
  delete_cache_entries: () => ({ deleted: 0, freedBytes: 0 }),
  clear_cover_cache: () => null,
  get_cache_dir: () => "/rb-offline-cache",
  set_cache_dir: () => null,
  pick_cache_folder: () => null,
  set_cache_meta: () => null,

  // ---- streaming / playback -------------------------------------------
  get_stream_base_url: () => null,
  resolve_stream_ytdlp: () => null,
  ensure_ytdlp: () => null,
  media_update: () => null,
  media_clear: () => null,
  notify_track: () => null,

  // ---- integrations ----------------------------------------------------
  lastfm_is_configured: () => false,
  lastfm_begin_auth: () => ({ token: "", authUrl: "" }),
  lastfm_poll_session: () => ({ approved: false }),
  lastfm_user_info: () => null,
  lastfm_scrobble: () => null,
  lastfm_update_now_playing: () => null,
  lastfm_love: () => null,
  lastfm_flush: () => null,
  discord_set_enabled: () => null,
  discord_update: () => null,
  discord_clear: () => null,

  // ---- windows / app lifecycle -----------------------------------------
  open_player_window: () => null,
  close_player_window: () => null,
  focus_main_window: () => null,
  quit_app: () => null,
  autostart_is_enabled: () => false,
  autostart_set: () => null,
  set_close_behavior: () => null,
};

export async function invoke<T>(cmd: string, args?: Args): Promise<T> {
  const probe = rbProbe();
  rbNote(probe.cmds, cmd);
  const impl = TABLE[cmd];
  if (!impl) {
    rbNote(probe.unknown, cmd);
    return null as T;
  }
  return impl(args) as T;
}

/** The offline shim never converts a callback id, but callers may import it. */
export function convertFileSrc(filePath: string): string {
  return filePath;
}
