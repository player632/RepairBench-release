/**
 * Offline InnerTube corpus for the browser-served build.
 *
 * WHY THIS FILE EXISTS. Upstream YTubic is a Tauri desktop app: every byte of
 * catalogue data reaches it through `@tauri-apps/plugin-http`, whose `fetch`
 * is a Rust-side client and therefore rejects in a plain browser tab. The
 * served artifact is graded with `allow_internet = false`, so a resolving
 * transport is not an option either. `environment/adaptation.patch` repoints
 * the single transport chokepoint (`innertubePost` in
 * `src/lib/innertube/shared.ts`, which every `rawBrowse` / `rawSearch` /
 * `rawNext` / continuation helper bottoms out in) at this module, so the whole
 * data layer answers from a fixed in-tree corpus with ZERO runtime network.
 *
 * WHERE THE SHAPES COME FROM. Nothing here was captured from the network and
 * no new data source was invented. Every renderer key, nesting level and
 * endpoint field is the shape this repository's OWN parsers read - see
 * `mapShelfWrapper` / `mapTwoRowItem` / `mapResponsiveListItem` /
 * `mapTopResultCard` / `extractCardAction` - and the same shapes the seed's
 * own unit specs build (`src/lib/innertube/search.test.ts`'s `row()` helper,
 * `shared.test.ts`, `playlist.test.ts`, `continuations.test.ts`). The content
 * (titles, ids, durations, counts) is authored here, is fixed, and carries the
 * `rb` / `rbvid` / `rbart` prefix convention used by the offline-fixture
 * precedent packages.
 *
 * DETERMINISM CONTRACT.
 *  - No `Date.now()`, no `Math.random()`, no locale-sensitive formatting.
 *  - Every entity carries in-tree thumbnails under `/rb-art/*`, so the
 *    `i.ytimg.com` synthesis fallback in `mapResponsiveListItem` (which fires
 *    only when `thumbnails.length === 0`) can never hand the browser an
 *    off-origin `<img src>`.
 *  - Art is declared at 140/320/640 px square and 240x135 / 480x270 wide.
 *    Both matter: `mapTwoRowItem` decides song-vs-video from the thumbnail
 *    aspect ratio (`> 1.4`), and `isYtPlaceholder` in `thumbnail.tsx` treats
 *    anything at or below 120x90 as YouTube's 404 stand-in and demotes it -
 *    so the smallest variant is 140 px, comfortably above that threshold.
 */
import type { YtNode } from "@/lib/innertube/shared";

/** In-tree artwork. `public/rb-art/` is copied verbatim into `dist/` by vite. */
const SQ = [
  { url: "/rb-art/sq-140.svg", width: 140, height: 140 },
  { url: "/rb-art/sq-320.svg", width: 320, height: 320 },
  { url: "/rb-art/sq-640.svg", width: 640, height: 640 },
];
/** 480/270 = 1.778 > 1.4, which is what makes `mapTwoRowItem` call it a video. */
const WIDE = [
  { url: "/rb-art/wd-240.svg", width: 240, height: 135 },
  { url: "/rb-art/wd-480.svg", width: 480, height: 270 },
];

function thumbs(kind: "sq" | "wide"): YtNode {
  return { thumbnails: kind === "sq" ? [...SQ] : [...WIDE] };
}

function runs(text: string, endpoint?: YtNode): YtNode {
  const run: YtNode = { text };
  if (endpoint) run.navigationEndpoint = endpoint;
  return { runs: [run] };
}

function watch(videoId: string): YtNode {
  return { watchEndpoint: { videoId } };
}

function browse(browseId: string, pageType: string): YtNode {
  return {
    browseEndpoint: {
      browseId,
      browseEndpointContextSupportedConfigs: {
        browseEndpointContextMusicConfig: { pageType },
      },
    },
  };
}

/** A `musicTwoRowItemRenderer`: the card shape home-feed carousels ship. */
function twoRow(o: {
  title: string;
  subtitle: string;
  id: string;
  pageType?: string;
  art?: "sq" | "wide";
}): YtNode {
  const endpoint = o.pageType
    ? browse(o.id, o.pageType)
    : watch(o.id);
  return {
    musicTwoRowItemRenderer: {
      title: runs(o.title),
      subtitle: runs(o.subtitle),
      navigationEndpoint: endpoint,
      thumbnailRenderer: {
        musicThumbnailRenderer: { thumbnail: thumbs(o.art ?? "sq") },
      },
    },
  };
}

/**
 * A `musicResponsiveListItemRenderer`: the row shape shelves, search filter
 * tabs and playlist/album track lists ship.
 *
 * `durationText` lands in `fixedColumns[0]`, which is where
 * `mapResponsiveListItem` reads it from before falling back to the last
 * subtitle run. Durations are chosen so that each one is touched by exactly
 * one of the two `formatDuration` rules under test (see the defect ledger):
 * `Math.floor(seconds / 60)` only disagrees with `Math.round` when
 * `seconds % 60 >= 30`, and dropping `.padStart(2, "0")` only changes the
 * string when `seconds % 60 < 10`.
 */
function row(o: {
  title: string;
  id: string;
  artist: string;
  artistId: string;
  album: string;
  albumId: string;
  durationText: string;
  explicit?: boolean;
  pageType?: string;
  art?: "sq" | "wide";
}): YtNode {
  // 🔴 The FIRST subtitle run is the row's TYPE token ("Song • …", "Artist •
  // …"). `subtitleToken()` in `src/lib/innertube/search.ts` reads
  // `flexColumns[1].…runs[0].text` and looks it up in `TOKEN_TO_GROUP`; a row
  // whose subtitle starts with the artist name instead is classified as
  // `undefined` and `classifyAllRow()` drops it, so the whole "all" tab would
  // come up empty. Empty parts are filtered so an artist/album/playlist row
  // (which carries no artist or album run) does not leave a trailing bullet.
  const typeToken = o.pageType
    ? o.pageType === "MUSIC_PAGE_TYPE_ARTIST"
      ? "Artist"
      : o.pageType === "MUSIC_PAGE_TYPE_ALBUM"
        ? "Album"
        : "Playlist"
    : o.art === "wide"
      ? "Video"
      : "Song";
  const artistRun = o.artist
    ? runs(o.artist, browse(o.artistId, "MUSIC_PAGE_TYPE_ARTIST"))
    : null;
  const albumRun = o.album
    ? runs(o.album, browse(o.albumId, "MUSIC_PAGE_TYPE_ALBUM"))
    : null;
  const subtitleRuns: YtNode[] = [];
  for (const part of [{ text: typeToken }, artistRun, albumRun]) {
    if (!part) continue;
    if (subtitleRuns.length) subtitleRuns.push({ text: " • " });
    subtitleRuns.push(part);
  }

  const mrli: YtNode = {
    flexColumns: [
      {
        musicResponsiveListItemFlexColumnRenderer: {
          text: runs(o.title, o.pageType ? browse(o.id, o.pageType) : watch(o.id)),
        },
      },
      {
        musicResponsiveListItemFlexColumnRenderer: {
          text: { runs: subtitleRuns },
        },
      },
    ],
    thumbnail: { musicThumbnailRenderer: { thumbnail: thumbs(o.art ?? "sq") } },
  };
  if (o.durationText) {
    mrli.fixedColumns = [
      {
        musicResponsiveListItemFixedColumnRenderer: {
          text: runs(o.durationText),
        },
      },
    ];
  }
  if (!o.pageType) {
    mrli.navigationEndpoint = watch(o.id);
  }
  if (o.explicit) {
    mrli.badges = [
      {
        musicInlineBadgeRenderer: {
          icon: { iconType: "EXPLICIT" },
          accessibilityData: {
            accessibilityData: { label: "Explicit lyrics" },
          },
        },
      },
    ];
  }
  return { musicResponsiveListItemRenderer: mrli };
}

function carousel(title: string, items: YtNode[]): YtNode {
  return {
    musicCarouselShelfRenderer: {
      header: {
        musicCarouselShelfBasicHeaderRenderer: { title: runs(title) },
      },
      contents: items,
    },
  };
}

function shelf(title: string, items: YtNode[]): YtNode {
  return { musicShelfRenderer: { title: runs(title), contents: items } };
}

// ---------------------------------------------------------------------------
// Home feed (`browse` with browseId `FEmusic_home`)
// ---------------------------------------------------------------------------

/**
 * Five carousels in a FIXED feed order. Two of them share the title
 * "rb Because You Listened" on purpose: the home route keys a shelf's identity
 * on its title (`arrangeTitles` in `src/lib/store/home-sections.ts` de-dupes
 * titles, so both shelves land on one rank), which makes the feed-order
 * tie-break in `src/routes/index.tsx` the only thing that decides which of the
 * two paints first.
 *
 * Exactly ONE item in the whole feed carries 16:9 art ("rb Harbour Lights"),
 * so the song-vs-video decision in `mapTwoRowItem` has an unambiguous reading
 * on the page: 1 wide card against 16 square ones.
 *
 * No `continuationItemRenderer` and no `sectionListRenderer.continuations`
 * are supplied, so `extractInitialPage` returns `nextCursor === undefined`,
 * `hasNextPage` is false and the IntersectionObserver sentinel is never
 * rendered - the feed cannot page itself into a second, unmodelled response.
 */
export const RB_HOME: YtNode = {
  responseContext: { visitorData: "rb-visitor-0001" },
  contents: {
    singleColumnBrowseResultsRenderer: {
      tabs: [
        {
          tabRenderer: {
            content: {
              sectionListRenderer: {
                contents: [
                  carousel("rb Recently Played", [
                    twoRow({ title: "rb Cedar Lane", subtitle: "Song • rb Ivo Marlow", id: "rbvid101" }),
                    twoRow({ title: "rb Paper Lanterns", subtitle: "Song • rb June Hallow", id: "rbvid102" }),
                    twoRow({ title: "rb Slow Ferry", subtitle: "Song • rb Ivo Marlow", id: "rbvid103" }),
                    twoRow({ title: "rb Amber Static", subtitle: "Song • rb The Longwave", id: "rbvid104" }),
                  ]),
                  carousel("rb Mixed For You", [
                    twoRow({
                      title: "rb Harbour Lights (Live)",
                      subtitle: "Video • rb June Hallow",
                      id: "rbvid201",
                      art: "wide",
                    }),
                    twoRow({ title: "rb Glass Arcade", subtitle: "Song • rb The Longwave", id: "rbvid202" }),
                    twoRow({ title: "rb Northbound", subtitle: "Song • rb Ivo Marlow", id: "rbvid203" }),
                    twoRow({ title: "rb Tide Chart", subtitle: "Song • rb June Hallow", id: "rbvid204" }),
                  ]),
                  carousel("rb Because You Listened", [
                    twoRow({
                      title: "rb Salt And Signal",
                      subtitle: "Album • rb Ivo Marlow",
                      id: "rbalb301",
                      pageType: "MUSIC_PAGE_TYPE_ALBUM",
                    }),
                    twoRow({
                      title: "rb Low Orbit Hymns",
                      subtitle: "Album • rb The Longwave",
                      id: "rbalb302",
                      pageType: "MUSIC_PAGE_TYPE_ALBUM",
                    }),
                    twoRow({
                      title: "rb Nightbus Tapes",
                      subtitle: "Album • rb June Hallow",
                      id: "rbalb303",
                      pageType: "MUSIC_PAGE_TYPE_ALBUM",
                    }),
                  ]),
                  carousel("rb Because You Listened", [
                    twoRow({
                      title: "rb Deep Focus",
                      subtitle: "Playlist • rb",
                      id: "rbpl401",
                      pageType: "MUSIC_PAGE_TYPE_PLAYLIST",
                    }),
                    twoRow({
                      title: "rb Long Way Home",
                      subtitle: "Playlist • rb",
                      id: "rbpl402",
                      pageType: "MUSIC_PAGE_TYPE_PLAYLIST",
                    }),
                    twoRow({
                      title: "rb Cold Open",
                      subtitle: "Playlist • rb",
                      id: "rbpl403",
                      pageType: "MUSIC_PAGE_TYPE_PLAYLIST",
                    }),
                  ]),
                  carousel("rb New Releases", [
                    twoRow({
                      title: "rb Static Garden",
                      subtitle: "Album • rb Ivo Marlow",
                      id: "rbalb501",
                      pageType: "MUSIC_PAGE_TYPE_ALBUM",
                    }),
                    twoRow({
                      title: "rb Harbour Sessions",
                      subtitle: "Album • rb June Hallow",
                      id: "rbalb502",
                      pageType: "MUSIC_PAGE_TYPE_ALBUM",
                    }),
                    twoRow({
                      title: "rb Field Recorder",
                      subtitle: "Album • rb The Longwave",
                      id: "rbalb503",
                      pageType: "MUSIC_PAGE_TYPE_ALBUM",
                    }),
                  ]),
                ],
              },
            },
          },
        },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * The promoted entity on the "all" tab: an ARTIST card whose only primary
 * action signal is the button's text ("Shuffle") - it carries no
 * `icon.iconType`. `extractCardAction` reads the two signals with `||`
 * precisely because either one shows up alone in the wild, so this fixture
 * exercises the text-only half of that rule.
 */
const RB_HERO_ID = "rbart001";
const RB_HERO_TITLE = "rb Aurora Field";

const RB_TOP_RESULT: YtNode = {
  musicCardShelfRenderer: {
    title: runs(RB_HERO_TITLE),
    subtitle: runs("Artist • 1.2M monthly audience"),
    thumbnail: { musicThumbnailRenderer: { thumbnail: thumbs("sq") } },
    onTap: browse(RB_HERO_ID, "MUSIC_PAGE_TYPE_ARTIST"),
    buttons: [
      {
        buttonRenderer: {
          text: runs("Shuffle"),
          command: { watchPlaylistEndpoint: { playlistId: "rbRADIO001" } },
        },
      },
    ],
  },
};

/** Six songs. Durations are 212 / 185 / 250 / 191 / 205 / 268 seconds. */
const RB_SONGS: YtNode[] = [
  row({ title: "rb Night Ferry", id: "rbsng01", artist: "rb Ivo Marlow", artistId: "rbart011", album: "rb Salt And Signal", albumId: "rbalb301", durationText: "3:32", explicit: true }),
  row({ title: "rb Cold Harbour", id: "rbsng02", artist: "rb June Hallow", artistId: "rbart012", album: "rb Harbour Sessions", albumId: "rbalb502", durationText: "3:05" }),
  row({ title: "rb Signal Fire", id: "rbsng03", artist: "rb The Longwave", artistId: "rbart013", album: "rb Low Orbit Hymns", albumId: "rbalb302", durationText: "4:10" }),
  row({ title: "rb Quiet Motor", id: "rbsng04", artist: "rb Ivo Marlow", artistId: "rbart011", album: "rb Nightbus Tapes", albumId: "rbalb303", durationText: "3:11" }),
  row({ title: "rb Lantern Row", id: "rbsng05", artist: "rb June Hallow", artistId: "rbart012", album: "rb Static Garden", albumId: "rbalb501", durationText: "3:25" }),
  row({ title: "rb Long Exposure", id: "rbsng06", artist: "rb The Longwave", artistId: "rbart013", album: "rb Field Recorder", albumId: "rbalb503", durationText: "4:28" }),
];

/**
 * Six artists, and the FIRST of them is the promoted hero entity. The "all"
 * tab drops the hero from its own section (`topKey` in `AllResults`), so this
 * section reads five cards rather than six - the de-duplication is observable
 * as a count without any interaction.
 */
const RB_ARTISTS: YtNode[] = [
  row({ title: RB_HERO_TITLE, id: RB_HERO_ID, artist: "", artistId: "", album: "", albumId: "", durationText: "", pageType: "MUSIC_PAGE_TYPE_ARTIST" }),
  row({ title: "rb Ivo Marlow", id: "rbart011", artist: "", artistId: "", album: "", albumId: "", durationText: "", pageType: "MUSIC_PAGE_TYPE_ARTIST" }),
  row({ title: "rb June Hallow", id: "rbart012", artist: "", artistId: "", album: "", albumId: "", durationText: "", pageType: "MUSIC_PAGE_TYPE_ARTIST" }),
  row({ title: "rb The Longwave", id: "rbart013", artist: "", artistId: "", album: "", albumId: "", durationText: "", pageType: "MUSIC_PAGE_TYPE_ARTIST" }),
  row({ title: "rb Cassette Choir", id: "rbart014", artist: "", artistId: "", album: "", albumId: "", durationText: "", pageType: "MUSIC_PAGE_TYPE_ARTIST" }),
  row({ title: "rb Marlow Twins", id: "rbart015", artist: "", artistId: "", album: "", albumId: "", durationText: "", pageType: "MUSIC_PAGE_TYPE_ARTIST" }),
];

const RB_ALBUMS: YtNode[] = [
  row({ title: "rb Salt And Signal", id: "rbalb301", artist: "rb Ivo Marlow", artistId: "rbart011", album: "", albumId: "", durationText: "", pageType: "MUSIC_PAGE_TYPE_ALBUM" }),
  row({ title: "rb Low Orbit Hymns", id: "rbalb302", artist: "rb The Longwave", artistId: "rbart013", album: "", albumId: "", durationText: "", pageType: "MUSIC_PAGE_TYPE_ALBUM" }),
  row({ title: "rb Nightbus Tapes", id: "rbalb303", artist: "rb June Hallow", artistId: "rbart012", album: "", albumId: "", durationText: "", pageType: "MUSIC_PAGE_TYPE_ALBUM" }),
  row({ title: "rb Static Garden", id: "rbalb501", artist: "rb Ivo Marlow", artistId: "rbart011", album: "", albumId: "", durationText: "", pageType: "MUSIC_PAGE_TYPE_ALBUM" }),
];

/**
 * Four videos. On the `videos` filter tab `buildFilterShelves` re-kinds every
 * row from the mapper's default "song" to "video", which is what turns the
 * card art from `aspect-square` into `aspect-video`.
 */
const RB_VIDEOS: YtNode[] = [
  row({ title: "rb Harbour Lights (Live)", id: "rbvid201", artist: "rb June Hallow", artistId: "rbart012", album: "", albumId: "", durationText: "5:12", art: "wide" }),
  row({ title: "rb Cedar Lane (Session)", id: "rbvid101", artist: "rb Ivo Marlow", artistId: "rbart011", album: "", albumId: "", durationText: "3:48", art: "wide" }),
  row({ title: "rb Glass Arcade (Visual)", id: "rbvid202", artist: "rb The Longwave", artistId: "rbart013", album: "", albumId: "", durationText: "4:02", art: "wide" }),
  row({ title: "rb Northbound (Clip)", id: "rbvid203", artist: "rb Ivo Marlow", artistId: "rbart011", album: "", albumId: "", durationText: "3:19", art: "wide" }),
];

const RB_PLAYLISTS: YtNode[] = [
  row({ title: "rb Deep Focus", id: "rbpl401", artist: "rb", artistId: "rbart014", album: "", albumId: "", durationText: "", pageType: "MUSIC_PAGE_TYPE_PLAYLIST" }),
  row({ title: "rb Long Way Home", id: "rbpl402", artist: "rb", artistId: "rbart015", album: "", albumId: "", durationText: "", pageType: "MUSIC_PAGE_TYPE_PLAYLIST" }),
  row({ title: "rb Cold Open", id: "rbpl403", artist: "rb", artistId: "rbart014", album: "", albumId: "", durationText: "", pageType: "MUSIC_PAGE_TYPE_PLAYLIST" }),
  row({ title: "rb Night Drive", id: "rbpl404", artist: "rb", artistId: "rbart015", album: "", albumId: "", durationText: "", pageType: "MUSIC_PAGE_TYPE_PLAYLIST" }),
];

function filterShelf(title: string, items: YtNode[]): YtNode {
  return {
    contents: { sectionListRenderer: { contents: [shelf(title, items)] } },
    responseContext: { visitorData: "rb-visitor-0001" },
  };
}

/** The `SEARCH_FILTERS` pageParameter strings, verbatim from `search.ts`. */
const PARAM_SONGS = "EgWKAQIIAWoQEAkQBRAKEAMQBBAQEBUQEQ==";
const PARAM_VIDEOS = "EgWKAQIQAWoQEAkQBRAKEAMQBBAQEBUQEQ==";
const PARAM_ALBUMS = "EgWKAQIYAWoQEAkQBRAKEAMQBBAQEBUQEQ==";
const PARAM_ARTISTS = "EgWKAQIgAWoQEAkQBRAKEAMQBBAQEBUQEQ==";
const PARAM_PLAYLISTS = "EgWKAQIoAWoQEAkQBRAKEAMQBBAQEBUQEQ==";

/**
 * The "all" tab response: the hero card plus one `itemSectionRenderer` per
 * result type. The flat rows feed `buildAllResults`'s buckets, which
 * `AllResults` keeps as the instant-first-paint fallback behind the five
 * enrichment queries.
 */
/**
 * 🔴 ONE tab on purpose. `sectionsFromResponse()` reads
 * `contents.tabbedSearchResultsRenderer.tabs[0]`; with a single entry the
 * off-by-one in the delivered state (`tabs[1]`) resolves to `undefined` and
 * the `?? json?.contents?.sectionListRenderer?.contents ?? []` fallback also
 * misses (an "all" search carries no top-level sectionListRenderer), so the
 * "all" response yields ZERO sections: no top-result card and no first-paint
 * shelves. The five per-type enrichment queries are deliberately NOT affected:
 * `filterShelf()` below returns a bare `contents.sectionListRenderer` with no
 * `tabbedSearchResultsRenderer` at all, exactly as a dedicated filter tab
 * does, so they take the fallback branch and still resolve. That asymmetry is
 * what makes D01 a MASKER rather than a total blackout - see
 * meta.json.conditional_pairs.
 */
const RB_SEARCH_ALL: YtNode = {
  responseContext: { visitorData: "rb-visitor-0001" },
  contents: {
    tabbedSearchResultsRenderer: {
      tabs: [
        {
          tabRenderer: {
            content: {
              sectionListRenderer: {
                contents: [
                  RB_TOP_RESULT,
                  { itemSectionRenderer: { contents: RB_SONGS } },
                  { itemSectionRenderer: { contents: RB_ARTISTS } },
                  { itemSectionRenderer: { contents: RB_ALBUMS } },
                  { itemSectionRenderer: { contents: RB_VIDEOS } },
                  { itemSectionRenderer: { contents: RB_PLAYLISTS } },
                ],
              },
            },
          },
        },
      ],
    },
  },
};

/** An InnerTube answer that carries no rows at all (used for unmodelled ids). */
const RB_EMPTY_BROWSE: YtNode = {
  responseContext: { visitorData: "rb-visitor-0001" },
  contents: {
    singleColumnBrowseResultsRenderer: {
      tabs: [
        { tabRenderer: { content: { sectionListRenderer: { contents: [] } } } },
      ],
    },
  },
};

const RB_EMPTY_SEARCH: YtNode = {
  responseContext: { visitorData: "rb-visitor-0001" },
  contents: { sectionListRenderer: { contents: [] } },
};

/**
 * Route one InnerTube POST to its corpus entry.
 *
 * `endpoint` is the path segment `innertubePost` was called with ("browse",
 * "search", "next", ... possibly carrying `?ctoken=...`), and `body` is the
 * caller's payload BEFORE `context` is merged in, so `browseId` / `query` /
 * `params` / `continuation` are all readable here.
 */
export function rbRoute(endpoint: string, body: YtNode): YtNode {
  const base = endpoint.split("?")[0];

  if (base === "search") {
    const params = typeof body.params === "string" ? body.params : undefined;
    if (params === undefined) return RB_SEARCH_ALL;
    if (params === PARAM_SONGS) return filterShelf("Songs", RB_SONGS);
    if (params === PARAM_ARTISTS) return filterShelf("Artists", RB_ARTISTS);
    if (params === PARAM_ALBUMS) return filterShelf("Albums & singles", RB_ALBUMS);
    if (params === PARAM_VIDEOS) return filterShelf("Videos", RB_VIDEOS);
    if (params === PARAM_PLAYLISTS)
      return filterShelf("Community playlists", RB_PLAYLISTS);
    return RB_EMPTY_SEARCH;
  }

  if (base === "browse") {
    if (body.browseId === "FEmusic_home") return RB_HOME;
    return RB_EMPTY_BROWSE;
  }

  // /next (radio + autoplay queues) and everything else: a well-formed answer
  // with nothing in it, so callers take their normal empty path instead of an
  // exception path.
  return RB_EMPTY_SEARCH;
}

/** Answer for `getAccountSwitcherEndpoint` (`src/lib/innertube/channels.ts`). */
export const RB_ACCOUNT_SWITCHER: YtNode = { actions: [] };

/** Answer for the iTunes cover-art lookup (`src/lib/cover-art.ts`). */
export const RB_ITUNES: YtNode = { resultCount: 0, results: [] };

/** Answer for every lyrics provider (LRCLIB / Genius / Musixmatch / YTM). */
export const RB_LYRICS_EMPTY: YtNode = [];
