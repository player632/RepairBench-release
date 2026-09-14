/**
 * ADAPTATION FIXTURE DB (repair-bench, environment/adaptation.patch) for
 * repair-angular__angular-movie-app-01 - the frozen, offline replacement for the seed's remote
 * data layer. Installed by src/app/tmdb-mock.interceptor.ts, which is registered in app.module.ts
 * through { provide: HTTP_INTERCEPTORS, useClass: TmdbMockInterceptor, multi: true }.
 *
 * WHY THIS EXISTS. The seed's ApiService (src/app/api/api.service.ts:10-12) points every one of
 * its 20 methods at `https://api.themoviedb.org/3` with `private apiKey = ''` - an EMPTY key, so
 * the upstream app cannot answer a single request even with a network. Measured on the seed bytes
  *
 * the home route fires exactly 3 xhr (`/3/trending/movie/week`, `/3/trending/tv/week`,
 * `/3/movie/now_playing`, all with `api_key=`), all of them fail, the console collects 11 errors,
 * and <app-root> renders 10,934 B of markup whose entire innerText is 183 B - two carousel titles,
 * four "Explore All" anchors and the footer. A repair task whose observable surface is an empty
 * shell is unmeasurable, so the data is answered at the transport seam instead: the interceptor is
 * the last hop before the network and it never calls next.handle() for the TMDB root, which means
 * the browser performs ZERO network I/O for any route (proven at design time by the
 * foreignRequestCount()/performance-timeline checkpoint).
 *
  *
 * external dependencies - explicitly including REMOTE DATA - until the runtime is network-free.
 * Two registered packages do exactly this at the same seam in the same framework:
  *
 * mock.api.interceptor.ts + core/mock/fixture-db.ts) and this seat's own delivered
  *
 *
 * FIDELITY CONTRACT - this re-implements the TMDB v3 response SHAPES the seed actually reads, not
 * a stub that flattens the code path. Every field below is a field some component in this seed
 * dereferences (grepped, not guessed): results[].{id,title,name,poster_path,backdrop_path,
 * vote_average,vote_count,overview,release_date,first_air_date,number_of_seasons,media_type},
 * detail.{runtime,budget,revenue,status,genres[],spoken_languages[],episode_run_time[],seasons[],
 * number_of_episodes,last_air_date,tagline,biography,birthday,place_of_birth,known_for_department,
 * popularity}, images.{backdrops[].file_path,posters[].file_path,profiles[].file_path},
 * videos.results[].{key,site,type,name}, credits.cast[].{id,name,character,profile_path,popularity},
 * external_ids.{imdb_id,twitter_id,facebook_id,instagram_id}, tv season .episodes[].
 * {episode_number,name,air_date,overview,still_path,runtime,vote_average}, list endpoints'
 * {page,results,total_pages,total_results}. Fields the seed never reads are omitted on purpose:
 * a fixture that carries more than the app reads is a fixture that can hide a defect.
 *
 * DETERMINISM (methodology §1.6). Every value is a frozen literal. There is no Date.now(), no
 * Math.random(), no counter and no wall-clock-dependent ordering anywhere in a response body. The
 * only mutable state is the append-only REQUEST LOG kept by the interceptor, which is an
 * observation channel, never an entropy source. Two runs of the same checkpoint therefore read the
 * same bytes on any machine.
 *
 * DESIGN DELIBERATIONS THAT ARE LOAD-BEARING FOR THE CHECKPOINTS (each one exercises a distinct
 * branch of the seed's own code, so a defect in that branch is observable and no defect can hide
 * behind "the fixture never reaches it"):
 *   * vote_average spans 1 char (5, 7), 2 chars (7.4, 6.2, 8.6, 3.7, 4.4, 6.8, 8.1, 9.06) so
 *     RatingPipe's `number.toString().length <= 1` branch is taken by M4/T3 and skipped by the rest.
 *   * vote_average 0 (see M6's revenue/budget 0) and `vote_average ? ... : 'N/A'` in
 *     search/movies-info/tv-info/person give a real 'N/A' branch.
 *   * runtime 118/96/143/88/205/71 minutes exercise RuntimePipe and TimePipe across the
 *     `hours ? ... : ''` branch (88 and 71 have no hours; 205 has 3h and a 25min remainder).
 *   * release_date values include a leading-zero day ('2022-07-08') and a single-digit day
 *     ('2024-03-15' -> 15, '2026-02-13' -> 13, '2021-05-30' -> 30) plus FullDatePipe's
 *     `dateArray[2].startsWith('0')` branch via '2023-09-05'.
 *   * poster_path null on exactly one item (M6 recommendations entry / person P3) so the
 *     `*ngIf="item.imgSrc"` else-branch (the inline SVG placeholder span) is reachable.
 *   * M6 has videos.results = [] so `videoId` stays '' and the "Watch Trailer" button
 *     (*ngIf="hero.videoId") is ABSENT for that item - a presence/absence observable that does not
 *     require the seed's alert() path to fire (a native dialog would block the runner).
 *   * one video entry per media has site 'Vimeo' and one has type 'Featurette', so both halves of
 *     `vid.site === 'YouTube' && ['Trailer','Teaser','Clip'].includes(vid.type)` are exercised and
 *     the FIRST match is deterministic (the Trailer is always results[0]).
 *   * every list endpoint is page-sensitive: page 1 and page 2 return DIFFERENT items and
 *     total_pages is 2, so the infinite-scroll pages (movie-category/tv-category HostListener) have
 *     a measurable second batch and a measurable end.
 */

/** One poster/backdrop/profile/still file name per media item; the adaptation ships a same-origin
 *  placeholder SVG at /rb/t/p/<size><path> for every (size, path) pair these fixtures can produce,
 *  so no <img> in the adapted face can 404. The names are derived, never hand-listed twice. */
const POSTER = (id: number) => `/p${id}.svg`;
const BACKDROP = (id: number) => `/b${id}.svg`;
const PROFILE = (id: number) => `/pr${id}.svg`;
const STILL = (id: number, ep: number) => `/st${id}e${ep}.svg`;
const GALLERY = (id: number, n: string) => `/ps${id}${n}.svg`;

export interface AmaMovie {
  id: number; title: string; vote_average: number; vote_count: number; release_date: string;
  runtime: number; budget: number; revenue: number; status: string; overview: string; tagline: string;
  genres: { id: number; name: string }[]; languages: string[]; imdb_id: string; popularity: number;
  poster_path: string | null; backdrop_path: string | null;
}

export interface AmaTv {
  id: number; name: string; vote_average: number; vote_count: number; first_air_date: string;
  last_air_date: string; number_of_seasons: number; number_of_episodes: number; episode_run_time: number[];
  status: string; overview: string; tagline: string; genres: { id: number; name: string }[];
  languages: string[]; popularity: number; poster_path: string | null; backdrop_path: string | null;
}

export interface AmaPerson {
  id: number; name: string; known_for_department: string; birthday: string | null; deathday: string | null;
  place_of_birth: string | null; biography: string; popularity: number; profile_path: string | null;
  imdb_id: string;
}

export const MOVIES: AmaMovie[] = [
  {
    id: 101, title: 'Northern Signal', vote_average: 7.4, vote_count: 1284, release_date: '2024-03-15',
    runtime: 118, budget: 42000000, revenue: 137500000, status: 'Released',
    overview: 'A radio operator on a decommissioned Arctic relay station keeps receiving a numbers broadcast that was retired thirty years ago, and the only person who can confirm the cipher is the woman who signed the decommission order and has been living under an assumed name two hundred kilometres south of the tree line.',
    tagline: 'Every signal has a source.',
    genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Science Fiction' }],
    languages: ['en', 'ja'], imdb_id: 'tt0101010', popularity: 245.61,
    poster_path: POSTER(101), backdrop_path: BACKDROP(101),
  },
  {
    id: 102, title: 'The Quiet Ledger', vote_average: 6.2, vote_count: 318, release_date: '2023-11-02',
    runtime: 96, budget: 8000000, revenue: 2100000, status: 'Released',
    overview: 'An auditor discovers that a charity has been balancing its books by inventing donors, and the invention is so thorough that the only way to expose it is to become one of the people who never existed.',
    tagline: 'Numbers do not lie, but they do omit.',
    genres: [{ id: 18, name: 'Drama' }],
    languages: ['en'], imdb_id: 'tt0102020', popularity: 61.4,
    poster_path: POSTER(102), backdrop_path: BACKDROP(102),
  },
  {
    id: 103, title: 'Paper Lanterns', vote_average: 8.6, vote_count: 5401, release_date: '2025-01-24',
    runtime: 143, budget: 95000000, revenue: 512000000, status: 'Released',
    overview: 'Three generations of a lantern-making family prepare for the festival that pays for the whole year, and the youngest of them decides to enter a lantern that will not burn, because burning is what has been killing the river.',
    tagline: 'Light carries a debt.',
    genres: [{ id: 16, name: 'Animation' }, { id: 10751, name: 'Family' }],
    languages: ['zh', 'en'], imdb_id: 'tt0103030', popularity: 512.08,
    poster_path: POSTER(103), backdrop_path: BACKDROP(103),
  },
  {
    id: 104, title: 'Salt and Iron', vote_average: 5, vote_count: 74, release_date: '2022-07-08',
    runtime: 88, budget: 1200000, revenue: 400000, status: 'Released',
    overview: 'A salt miner and a railway foreman are forced to share a survey hut for one winter, and the map they are both drawing turns out to describe two different countries.',
    tagline: 'Two surveys, one winter.',
    genres: [{ id: 36, name: 'History' }],
    languages: ['en'], imdb_id: 'tt0104040', popularity: 12.77,
    poster_path: POSTER(104), backdrop_path: BACKDROP(104),
  },
  {
    id: 105, title: 'Ninth Hour', vote_average: 9.06, vote_count: 2233, release_date: '2026-02-13',
    runtime: 205, budget: 210000000, revenue: 980000000, status: 'Post Production',
    overview: 'A city negotiator is given nine hours to talk down a man holding the water board, and discovers in the second hour that the man is reading from the negotiator own unpublished case notes.',
    tagline: 'Nine hours is a long time to be heard.',
    genres: [{ id: 53, name: 'Thriller' }, { id: 28, name: 'Action' }],
    languages: ['en', 'fr'], imdb_id: 'tt0105050', popularity: 884.2,
    poster_path: POSTER(105), backdrop_path: BACKDROP(105),
  },
  {
    id: 106, title: 'Harbour Lights', vote_average: 3.7, vote_count: 12, release_date: '2021-05-30',
    runtime: 71, budget: 0, revenue: 0, status: 'Released',
    overview: 'A harbour master keeps the lamps lit for a ferry service that stopped running eleven years ago, because the timetable still says it will resume.',
    tagline: 'The timetable has not been told.',
    genres: [],
    languages: ['en'], imdb_id: 'tt0106060', popularity: 3.14,
    poster_path: POSTER(106), backdrop_path: BACKDROP(106),
  },
];

export const TV: AmaTv[] = [
  {
    id: 201, name: 'Deep Field', vote_average: 8.1, vote_count: 990, first_air_date: '2023-09-10',
    last_air_date: '2026-06-01', number_of_seasons: 3, number_of_episodes: 24, episode_run_time: [52],
    status: 'Returning Series',
    overview: 'An observatory crew chasing the faintest objects in the sky keeps finding a light that moves against the parallax, and the director of the institute would rather lose the telescope than admit what the plate archive already shows.',
    tagline: 'Look long enough and it looks back.',
    genres: [{ id: 18, name: 'Drama' }, { id: 9648, name: 'Mystery' }],
    languages: ['en'], popularity: 180.23, poster_path: POSTER(201), backdrop_path: BACKDROP(201),
  },
  {
    id: 202, name: 'Static Bloom', vote_average: 6.8, vote_count: 233, first_air_date: '2024-12-01',
    last_air_date: '2025-02-16', number_of_seasons: 1, number_of_episodes: 8, episode_run_time: [41],
    status: 'Ended',
    overview: 'A community radio station runs a plant-growth experiment on air for eight weeks and the town starts organising its week around a show nobody is paid to make.',
    tagline: 'Broadcast, then grow.',
    genres: [{ id: 35, name: 'Comedy' }],
    languages: ['en'], popularity: 44.9, poster_path: POSTER(202), backdrop_path: BACKDROP(202),
  },
  {
    id: 203, name: 'The Long Noon', vote_average: 7, vote_count: 45, first_air_date: '2019-04-05',
    last_air_date: '2024-08-30', number_of_seasons: 5, number_of_episodes: 50, episode_run_time: [46, 48],
    status: 'Canceled',
    overview: 'A border-town sheriff inherits a case file her predecessor kept in his own house, and the file is longer than the town has residents.',
    tagline: 'Noon lasts longer here.',
    genres: [{ id: 80, name: 'Crime' }, { id: 18, name: 'Drama' }],
    languages: ['en', 'es'], popularity: 27.02, poster_path: POSTER(203), backdrop_path: BACKDROP(203),
  },
  {
    id: 204, name: 'Copper Wire', vote_average: 4.4, vote_count: 9, first_air_date: '2025-10-11',
    last_air_date: '2025-11-22', number_of_seasons: 2, number_of_episodes: 12, episode_run_time: [30],
    status: 'In Production',
    overview: 'Two rival electrical contractors are forced to share one trench, one crane and one very patient inspector.',
    tagline: 'Shared trench, shared blame.',
    genres: [{ id: 10759, name: 'Action & Adventure' }],
    languages: ['en'], popularity: 8.4, poster_path: POSTER(204), backdrop_path: BACKDROP(204),
  },
];

export const PERSONS: AmaPerson[] = [
  {
    id: 301, name: 'Ines Marchetti', known_for_department: 'Acting', birthday: '1978-04-02', deathday: null,
    place_of_birth: 'Trieste, Italy',
    biography: 'Ines Marchetti trained as a marine surveyor before her first screen role, and still does her own water work; she has twice declined the part that would have made her a household name, saying that the part wanted a face that could be forgotten in a crowd.',
    popularity: 88.41, profile_path: PROFILE(301), imdb_id: 'nm0301010',
  },
  {
    id: 302, name: 'Dov Abramson', known_for_department: 'Directing', birthday: '1965-11-19', deathday: null,
    place_of_birth: 'Haifa, Israel',
    biography: 'Dov Abramson shot his first three features on expired stock and has never used a second camera; his crews are small enough to eat together, which he credits for the fact that nobody has ever left one of his sets mid-shoot.',
    popularity: 34.07, profile_path: PROFILE(302), imdb_id: 'nm0302020',
  },
  {
    id: 303, name: 'Kai Nakamura', known_for_department: 'Writing', birthday: '1990-01-07', deathday: null,
    place_of_birth: null,
    biography: 'Kai Nakamura writes in ledgers rather than software and delivers scripts as typed pages, a habit two production offices have tried to change and none has succeeded in changing.',
    popularity: 5.5, profile_path: null, imdb_id: 'nm0303030',
  },
];

export const GENRES_MOVIE = [
  { id: 28, name: 'Action' }, { id: 18, name: 'Drama' }, { id: 16, name: 'Animation' },
  { id: 36, name: 'History' }, { id: 53, name: 'Thriller' }, { id: 878, name: 'Science Fiction' },
  { id: 10751, name: 'Family' },
];
export const GENRES_TV = [
  { id: 18, name: 'Drama' }, { id: 9648, name: 'Mystery' }, { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' }, { id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 10759, name: 'Action & Adventure' },
];

/** Video keys are frozen literals; they appear in the same-origin embed/thumbnail URLs the
 *  adaptation rewrites to, so they are part of the observable surface, not internal plumbing. */
const VIDEO_KEY = (id: number, kind: string) => `rb${kind}${id}`;

function videosFor(id: number): any {
  if (id === 106) return { id, results: [] };
  const kind = id >= 200 ? 'tv' : 'movie';
  return {
    id,
    results: [
      { id: `${id}v1`, name: 'Official Trailer', key: VIDEO_KEY(id, 'trailer'), site: 'YouTube', size: 1080, type: 'Trailer', official: true, iso_639_1: 'en', iso_3166_1: 'US', published_at: '2024-01-09T17:00:00.000Z' },
      { id: `${id}v2`, name: 'Teaser', key: VIDEO_KEY(id, 'teaser'), site: 'YouTube', size: 1080, type: 'Teaser', official: true, iso_639_1: 'en', iso_3166_1: 'US', published_at: '2023-11-20T09:30:00.000Z' },
      { id: `${id}v3`, name: 'Making Of', key: VIDEO_KEY(id, 'clip'), site: 'YouTube', size: 720, type: 'Clip', official: false, iso_639_1: 'en', iso_3166_1: 'US', published_at: '2024-02-02T12:00:00.000Z' },
      { id: `${id}v4`, name: 'Cast Interview', key: VIDEO_KEY(id, 'feature'), site: 'YouTube', size: 1080, type: 'Featurette', official: false, iso_639_1: 'en', iso_3166_1: 'US', published_at: '2024-02-14T15:45:00.000Z' },
      { id: `${id}v5`, name: 'Festival Trailer', key: VIDEO_KEY(id, 'fest'), site: 'Vimeo', size: 1080, type: 'Trailer', official: false, iso_639_1: 'en', iso_3166_1: 'US', published_at: '2023-10-01T08:00:00.000Z' },
    ],
  };
}

function imagesFor(id: number): any {
  return {
    id,
    backdrops: [
      { aspect_ratio: 1.778, height: 1080, width: 1920, file_path: BACKDROP(id), iso_639_1: null, vote_average: 5.312, vote_count: 1 },
      { aspect_ratio: 1.778, height: 720, width: 1280, file_path: `/bx${id}.svg`, iso_639_1: null, vote_average: 5.106, vote_count: 2 },
    ],
    posters: [
      { aspect_ratio: 0.667, height: 1500, width: 1000, file_path: GALLERY(id, 'a'), iso_639_1: 'en', vote_average: 5.384, vote_count: 3 },
      { aspect_ratio: 0.667, height: 1500, width: 1000, file_path: GALLERY(id, 'b'), iso_639_1: null, vote_average: 5.18, vote_count: 4 },
      { aspect_ratio: 0.667, height: 1500, width: 1000, file_path: GALLERY(id, 'c'), iso_639_1: 'fr', vote_average: 5.252, vote_count: 5 },
    ],
  };
}

const CAST_BY_MEDIA: { [id: number]: { id: number; character: string; order: number }[] } = {
  101: [{ id: 301, character: 'Cmdr. Vera Salas', order: 0 }, { id: 302, character: 'Director', order: 1 }, { id: 303, character: 'Screenplay', order: 2 }],
  102: [{ id: 302, character: 'Director', order: 0 }, { id: 301, character: 'Hedda Lomax', order: 1 }],
  103: [{ id: 301, character: 'Grandmother Luo (voice)', order: 0 }, { id: 303, character: 'Story', order: 1 }],
  104: [{ id: 303, character: 'Writer', order: 0 }],
  105: [{ id: 301, character: 'Det. Adaeze Okonkwo', order: 0 }, { id: 302, character: 'Director', order: 1 }],
  106: [{ id: 302, character: 'Director', order: 0 }],
  201: [{ id: 301, character: 'Dr. Ilse Brandt', order: 0 }, { id: 303, character: 'Writer', order: 1 }],
  202: [{ id: 303, character: 'Creator', order: 0 }],
  203: [{ id: 302, character: 'Director', order: 0 }, { id: 301, character: 'Sheriff Marisol Reyes', order: 1 }],
  204: [{ id: 301, character: 'Inspector Wen', order: 0 }],
};

function creditsFor(id: number): any {
  const rows = CAST_BY_MEDIA[id] || [];
  return {
    id,
    cast: rows.map((r) => {
      const p = PERSONS.find((x) => x.id === r.id)!;
      return {
        adult: false, gender: 1, id: p.id, known_for_department: p.known_for_department, name: p.name,
        original_name: p.name, popularity: p.popularity, profile_path: p.profile_path,
        cast_id: r.order, character: r.character, credit_order: r.order,
        credit_id: `${id}c${r.order}`,
      };
    }),
    crew: [],
  };
}

/** external_ids carries the SAME imdb_id the detail endpoint carries, because media.component.html
 *  renders both on one screen and a fixture that disagreed with itself would be a fake observable. */
function externalIdsFor(id: number, kind: 'movie' | 'tv' | 'person'): any {
  const own = kind === 'movie' ? (byId(MOVIES, id) as AmaMovie | undefined)?.imdb_id
    : kind === 'person' ? (byId(PERSONS, id) as AmaPerson | undefined)?.imdb_id
    : undefined;
  const imdb_id = own || (kind === 'tv' ? `tt0${id}0${id % 10}` : `tt0${id}0${id % 10}`);
  const base = { id, imdb_id, freebase_mid: null, freebase_id: null, tvdb_id: kind === 'tv' ? 400000 + id : null, tvrage_id: null, wikidata_id: `Q${id}` };
  if (id === 106) return { ...base, facebook_id: null, instagram_id: null, twitter_id: null };
  return { ...base, facebook_id: `rb${id}`, instagram_id: `rb${id}`, twitter_id: `rb${id}` };
}

const LANG_NAMES: { [k: string]: string } = { en: 'English', ja: 'Japanese', zh: 'Chinese', fr: 'French', es: 'Spanish' };

function movieDetail(m: AmaMovie): any {
  return {
    adult: false, backdrop_path: m.backdrop_path, belongs_to_collection: null, budget: m.budget,
    genres: m.genres, homepage: null, id: m.id, imdb_id: m.imdb_id, original_language: m.languages[0] || 'en',
    original_title: m.title, overview: m.overview, popularity: m.popularity, poster_path: m.poster_path,
    production_companies: [{ id: 9001, logo_path: null, name: 'Ridgeline Pictures', origin_country: 'US' }],
    production_countries: [{ iso_3166_1: 'US', name: 'United States of America' }],
    release_date: m.release_date, revenue: m.revenue, runtime: m.runtime,
    spoken_languages: m.languages.map((c) => ({ english_name: LANG_NAMES[c] || c, iso_639_1: c, name: LANG_NAMES[c] || c })),
    status: m.status, tagline: m.tagline, title: m.title, video: false,
    vote_average: m.vote_average, vote_count: m.vote_count,
  };
}

function tvDetail(t: AmaTv): any {
  return {
    adult: false, backdrop_path: t.backdrop_path, created_by: [{ id: 302, credit_id: `${t.id}cr0`, gender: 1, name: 'Dov Abramson', original_name: 'Dov Abramson', profile_path: PROFILE(302) }],
    episode_run_time: t.episode_run_time, first_air_date: t.first_air_date, genres: t.genres, homepage: null,
    id: t.id, in_production: t.status === 'In Production', languages: t.languages, last_air_date: t.last_air_date,
    last_episode_to_air: { id: t.id * 100 + t.number_of_episodes, name: 'Finale', overview: 'The last hour.', air_date: t.last_air_date, episode_number: t.number_of_episodes, production_code: '', runtime: t.episode_run_time[0], season_number: t.number_of_seasons, show_id: t.id, still_path: STILL(t.id, t.number_of_episodes), vote_average: t.vote_average, vote_count: t.vote_count },
    name: t.name, next_episode_to_air: null, networks: [{ id: 4, logo_path: null, name: 'Meridian', origin_country: 'US' }],
    number_of_episodes: t.number_of_episodes, number_of_seasons: t.number_of_seasons, origin_country: ['US'],
    original_language: t.languages[0] || 'en', original_name: t.name, overview: t.overview, popularity: t.popularity,
    poster_path: t.poster_path, seasons: Array.from({ length: t.number_of_seasons }, (_, i) => ({
      air_date: t.first_air_date, episode_count: Math.ceil(t.number_of_episodes / t.number_of_seasons), id: t.id * 10 + i + 1,
      name: `Season ${i + 1}`, overview: `Season ${i + 1} of ${t.name}.`, poster_path: t.poster_path, season_number: i + 1, vote_average: t.vote_average,
    })),
    spoken_languages: t.languages.map((c) => ({ english_name: LANG_NAMES[c] || c, iso_639_1: c, name: LANG_NAMES[c] || c })),
    status: t.status, tagline: t.tagline, type: 'Scripted', vote_average: t.vote_average, vote_count: t.vote_count,
  };
}

function personDetail(p: AmaPerson): any {
  return {
    adult: false, also_known_as: [], biography: p.biography, birthday: p.birthday, deathday: p.deathday,
    gender: 1, homepage: null, id: p.id, imdb_id: p.imdb_id, known_for_department: p.known_for_department,
    name: p.name, place_of_birth: p.place_of_birth, popularity: p.popularity, profile_path: p.profile_path,
  };
}

function listItemMovie(m: AmaMovie, media_type?: string): any {
  const base: any = {
    adult: false, backdrop_path: m.backdrop_path, genre_ids: m.genres.map((g) => g.id), id: m.id,
    original_language: m.languages[0] || 'en', original_title: m.title, overview: m.overview,
    popularity: m.popularity, poster_path: m.poster_path, release_date: m.release_date, title: m.title,
    video: false, vote_average: m.vote_average, vote_count: m.vote_count,
  };
  if (media_type) base.media_type = media_type;
  return base;
}
function listItemTv(t: AmaTv, media_type?: string): any {
  const base: any = {
    adult: false, backdrop_path: t.backdrop_path, genre_ids: t.genres.map((g) => g.id), id: t.id,
    origin_country: ['US'], original_language: t.languages[0] || 'en', original_name: t.name, overview: t.overview,
    popularity: t.popularity, poster_path: t.poster_path, first_air_date: t.first_air_date, name: t.name,
    vote_average: t.vote_average, vote_count: t.vote_count, number_of_seasons: t.number_of_seasons,
  };
  if (media_type) base.media_type = media_type;
  return base;
}
function listItemPerson(p: AmaPerson, media_type?: string): any {
  const base: any = {
    adult: false, gender: 1, id: p.id, known_for_department: p.known_for_department, name: p.name,
    original_name: p.name, popularity: p.popularity, profile_path: p.profile_path,
    known_for: [listItemMovie(MOVIES[0], 'movie'), listItemTv(TV[0], 'tv')],
  };
  if (media_type) base.media_type = media_type;
  return base;
}

const page = (results: any[], page_n: number, total_pages: number) => ({
  page: page_n, results, total_pages, total_results: results.length * total_pages,
});

/** CATEGORY TABLES - frozen, page-sensitive, and deliberately NOT the same order as the detail
 *  table, so a defect that swaps a category or a sort direction is observable. */
const CAT_MOVIE: { [cat: string]: number[][] } = {
  now_playing: [[105, 101, 103], [102, 104, 106]],
  popular: [[103, 105, 101], [102, 106, 104]],
  upcoming: [[105, 103], [101]],
  top_rated: [[105, 103, 101], [104, 102, 106]],
};
const CAT_TV: { [cat: string]: number[][] } = {
  airing_today: [[201, 204], [202]],
  on_the_air: [[201, 202], [203]],
  popular: [[201, 203, 202], [204]],
  top_rated: [[201, 203], [202, 204]],
};
const TRENDING_MOVIE: number[][] = [[103, 101, 105, 102], [104, 106]];
const TRENDING_TV: number[][] = [[201, 202, 203], [204]];
const DISCOVER_TV: number[][] = [[204, 203, 202, 201], [201]];
const RECOMMENDS: { [id: number]: number[] } = {
  101: [105, 102, 104], 102: [104, 101], 103: [101, 105], 104: [106], 105: [101, 103], 106: [104],
  201: [203, 202], 202: [204], 203: [201], 204: [202],
};

const byId = (arr: { id: number }[], id: number) => arr.find((x) => x.id === id);

function seasonFor(id: number, season: number): any {
  const t = byId(TV, id) as AmaTv | undefined;
  if (!t) return null;
  // TMDB 404s an out-of-range season; clamping it would silently invent a season the show does not
  // have, and tv-info drives the season picker from `seasons[]`, so the range is observable.
  if (!(season >= 1 && season <= t.number_of_seasons)) return null;
  const n = season;
  const count = n === t.number_of_seasons ? t.number_of_episodes - (n - 1) * 3 : 3;
  return {
    _id: `${id}s${n}`, air_date: t.first_air_date, id: id * 10 + n, name: `Season ${n}`,
    overview: `Season ${n} of ${t.name}.`, poster_path: t.poster_path, season_number: n,
    vote_average: t.vote_average,
    episodes: Array.from({ length: count }, (_, i) => ({
      air_date: t.first_air_date, episode_number: i + 1, id: id * 1000 + n * 10 + i + 1,
      name: `${t.name} ${n}x${i + 1}`, overview: `Episode ${i + 1} of season ${n}.`, production_code: '',
      runtime: t.episode_run_time[0], season_number: n, show_id: id, still_path: STILL(id, i + 1),
      vote_average: t.vote_average, vote_count: t.vote_count,
    })),
  };
}

function searchResults(query: string): any[] {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const hits: any[] = [];
  for (const m of MOVIES) {
    if (m.title.toLowerCase().includes(q) || m.overview.toLowerCase().includes(q)) hits.push(listItemMovie(m, 'movie'));
  }
  for (const t of TV) {
    if (t.name.toLowerCase().includes(q) || t.overview.toLowerCase().includes(q)) hits.push(listItemTv(t, 'tv'));
  }
  for (const p of PERSONS) {
    if (p.name.toLowerCase().includes(q)) hits.push(listItemPerson(p, 'person'));
  }
  return hits;
}

export interface AmaResolution { status: number; body: any; matched: string }

/** resolveTmdb - the whole of the seed's remote surface, answered from frozen literals.
 *  `pathname` is the URL path after the TMDB root (e.g. `/3/movie/101`), `params` the query. */
export function resolveTmdb(pathname: string, params: URLSearchParams): AmaResolution {
  const p = pathname.replace(/^\/3/, '');
  const pg = Math.max(1, Number(params.get('page') || '1') || 1);
  const pick = (table: number[][], page_n: number) => (page_n <= table.length ? table[page_n - 1] : []);
  let m: any;
  if (/^\/trending\/(movie|tv)\/week$/.test(p)) {
    const media = p.split('/')[2];
    const ids = pick(media === 'movie' ? TRENDING_MOVIE : TRENDING_TV, pg);
    const results = ids.map((id) => (media === 'movie' ? listItemMovie(byId(MOVIES, id) as AmaMovie, 'movie') : listItemTv(byId(TV, id) as AmaTv, 'tv')));
    return { status: 200, body: page(results, pg, media === 'movie' ? TRENDING_MOVIE.length : TRENDING_TV.length), matched: `trending:${media}` };
  }
  if ((m = p.match(/^\/(movie|tv)\/(now_playing|popular|upcoming|top_rated|airing_today|on_the_air)$/))) {
    const media = m[1], cat = m[2];
    const table = media === 'movie' ? CAT_MOVIE[cat] : CAT_TV[cat];
    if (!table) return { status: 404, body: { status_code: 34, status_message: 'The resource you requested could not be found.' }, matched: `category:unknown:${cat}` };
    const ids = pick(table, pg);
    const results = ids.map((id) => (media === 'movie' ? listItemMovie(byId(MOVIES, id) as AmaMovie) : listItemTv(byId(TV, id) as AmaTv)));
    return { status: 200, body: page(results, pg, table.length), matched: `category:${media}:${cat}` };
  }
  if ((m = p.match(/^\/discover\/(movie|tv)$/))) {
    const table = m[1] === 'tv' ? DISCOVER_TV : TRENDING_MOVIE;
    const ids = pick(table, pg);
    const results = ids.map((id) => (m[1] === 'tv' ? listItemTv(byId(TV, id) as AmaTv) : listItemMovie(byId(MOVIES, id) as AmaMovie)));
    return { status: 200, body: page(results, pg, table.length), matched: `discover:${m[1]}` };
  }
  if ((m = p.match(/^\/genre\/(movie|tv)\/list$/))) {
    return { status: 200, body: { genres: m[1] === 'movie' ? GENRES_MOVIE : GENRES_TV }, matched: `genrelist:${m[1]}` };
  }
  if ((m = p.match(/^\/genre\/(\d+)\/(movie|tv)$/))) {
    const gid = Number(m[1]);
    const pool = m[2] === 'movie' ? MOVIES.filter((x) => x.genres.some((g) => g.id === gid)) : TV.filter((x) => x.genres.some((g) => g.id === gid));
    const results = pool.map((x: any) => (m[2] === 'movie' ? listItemMovie(x) : listItemTv(x)));
    return { status: 200, body: page(results, 1, 1), matched: `bygenre:${m[2]}:${gid}` };
  }
  if ((m = p.match(/^\/search\/multi$/))) {
    const results = searchResults(params.get('query') || '');
    return { status: 200, body: page(results, 1, 1), matched: `search:${(params.get('query') || '').toLowerCase()}` };
  }
  if ((m = p.match(/^\/movie\/(\d+)$/))) {
    const x = byId(MOVIES, Number(m[1])) as AmaMovie | undefined;
    return x ? { status: 200, body: movieDetail(x), matched: `movie:${x.id}` } : { status: 404, body: { status_code: 34, status_message: 'The resource you requested could not be found.' }, matched: `movie:missing:${m[1]}` };
  }
  if ((m = p.match(/^\/tv\/(\d+)$/))) {
    const x = byId(TV, Number(m[1])) as AmaTv | undefined;
    return x ? { status: 200, body: tvDetail(x), matched: `tv:${x.id}` } : { status: 404, body: { status_code: 34, status_message: 'The resource you requested could not be found.' }, matched: `tv:missing:${m[1]}` };
  }
  if ((m = p.match(/^\/tv\/(\d+)\/season\/(\d+)$/))) {
    const s = seasonFor(Number(m[1]), Number(m[2]));
    return s ? { status: 200, body: s, matched: `season:${m[1]}:${m[2]}` } : { status: 404, body: { status_code: 34, status_message: 'The resource you requested could not be found.' }, matched: `season:missing:${m[1]}` };
  }
  if ((m = p.match(/^\/(movie|tv)\/(\d+)\/external_ids$/))) {
    return { status: 200, body: externalIdsFor(Number(m[2]), m[1] as 'movie' | 'tv'), matched: `external:${m[1]}:${m[2]}` };
  }
  if ((m = p.match(/^\/person\/(\d+)\/external_ids$/))) {
    return { status: 200, body: externalIdsFor(Number(m[1]), 'person'), matched: `external:person:${m[1]}` };
  }
  if ((m = p.match(/^\/(movie|tv)\/(\d+)\/videos$/))) {
    return { status: 200, body: videosFor(Number(m[2])), matched: `videos:${m[1]}:${m[2]}` };
  }
  if ((m = p.match(/^\/(movie|tv)\/(\d+)\/images$/))) {
    return { status: 200, body: imagesFor(Number(m[2])), matched: `images:${m[1]}:${m[2]}` };
  }
  if ((m = p.match(/^\/(movie|tv)\/(\d+)\/credits$/))) {
    return { status: 200, body: creditsFor(Number(m[2])), matched: `credits:${m[1]}:${m[2]}` };
  }
  if ((m = p.match(/^\/(movie|tv)\/(\d+)\/recommendations$/))) {
    const ids = RECOMMENDS[Number(m[2])] || [];
    const results = ids.map((id) => {
      if (m[1] === 'movie') { const x = byId(MOVIES, id) as AmaMovie; return listItemMovie(x); }
      return listItemTv(byId(TV, id) as AmaTv);
    });
    return { status: 200, body: page(results, 1, 1), matched: `recommendations:${m[1]}:${m[2]}` };
  }
  if ((m = p.match(/^\/person\/(\d+)\/movie_credits$/))) {
    const pid = Number(m[1]);
    // TMDB's /movie_credits returns MOVIE credits only; person.component.ts#getKnowFor builds
    // `link: /movie/${item.id}` and reads `item.title` for every row, so a tv row here would be a
    // shape the real API never sends and the component never handles.
    const rows = Object.keys(CAST_BY_MEDIA).map(Number).filter((mid) => mid < 200 && (CAST_BY_MEDIA[mid] || []).some((r) => r.id === pid));
    const cast = rows.map((mid) => {
      const x = byId(MOVIES, mid) as AmaMovie | undefined;
      const r = (CAST_BY_MEDIA[mid] || []).find((z) => z.id === pid)!;
      return { ...listItemMovie(x as AmaMovie), character: r.character, credit_id: `${mid}c${r.order}`, order: r.order };
    });
    return { status: 200, body: { cast, crew: [], id: pid }, matched: `moviecredits:${pid}` };
  }
  if ((m = p.match(/^\/person\/(\d+)\/images$/))) {
    const pid = Number(m[1]);
    const x = byId(PERSONS, pid) as AmaPerson | undefined;
    if (!x) return { status: 404, body: { status_code: 34, status_message: 'The resource you requested could not be found.' }, matched: `personimages:missing:${pid}` };
    return {
      status: 200,
      body: { id: pid, profiles: x.profile_path ? [
        { aspect_ratio: 0.667, height: 1500, width: 1000, file_path: x.profile_path, iso_639_1: null, vote_average: 5.312, vote_count: 1 },
        { aspect_ratio: 0.667, height: 1200, width: 800, file_path: `/px${pid}.svg`, iso_639_1: null, vote_average: 5.18, vote_count: 2 },
      ] : [] },
      matched: `personimages:${pid}`,
    };
  }
  if ((m = p.match(/^\/person\/(\d+)$/))) {
    const x = byId(PERSONS, Number(m[1])) as AmaPerson | undefined;
    return x ? { status: 200, body: personDetail(x), matched: `person:${x.id}` } : { status: 404, body: { status_code: 34, status_message: 'The resource you requested could not be found.' }, matched: `person:missing:${m[1]}` };
  }
  return { status: 404, body: { status_code: 34, status_message: 'The resource you requested could not be found.' }, matched: `unrouted:${p}` };
}

/** Every same-origin asset the adapted face can request, DERIVED from the fixtures so the two can
 *  never drift apart. `tmdb` paths are spliced behind one of the four TMDB size prefixes the seed's
 *  own templates use (measured: grep -o over src gave exactly w370_and_h556_bestv2 x18, w342 x2,
 *  original x2, w533_and_h300_bestv2 x2), so every (prefix, path) pair is shipped; `vi` paths are
 *  the video thumbnails, which the adaptation rewrites to /rb/vi/<key>.svg with no size prefix. */
export function allAssetPaths(): { tmdb: string[]; vi: string[] } {
  const out = new Set<string>();
  const vi = new Set<string>();
  const add = (v: string | null | undefined) => { if (v) out.add(v); };
  for (const m of MOVIES) { add(m.poster_path); add(m.backdrop_path); }
  for (const t of TV) { add(t.poster_path); add(t.backdrop_path); }
  for (const p of PERSONS) { add(p.profile_path); out.add(`/px${p.id}.svg`); }
  for (const id of [...MOVIES.map((x) => x.id), ...TV.map((x) => x.id)]) {
    const im = imagesFor(id);
    im.backdrops.forEach((b: any) => add(b.file_path));
    im.posters.forEach((b: any) => add(b.file_path));
    const t = byId(TV, id) as AmaTv | undefined;
    if (t) {
      add(STILL(id, t.number_of_episodes));
      for (let n = 1; n <= t.number_of_seasons; n++) {
        const ss = seasonFor(id, n);
        if (ss) ss.episodes.forEach((e: any) => add(e.still_path));
      }
    }
  }
  for (const id of [...MOVIES.map((x) => x.id), ...TV.map((x) => x.id)]) {
    if (id === 106) continue;
    ['trailer', 'teaser', 'clip', 'feature', 'fest'].forEach((k) => vi.add(`/vi/${VIDEO_KEY(id, k)}.svg`));
  }
  return { tmdb: [...out].sort(), vi: [...vi].sort() };
}

export const IMAGE_SIZE_PREFIXES = ['w370_and_h556_bestv2', 'w342', 'original', 'w533_and_h300_bestv2'];
