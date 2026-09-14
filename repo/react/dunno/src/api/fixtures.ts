// Local fixture data source replacing the TMDB API (offline adaptation).
// Deterministic by design: fixed pools, fixed delays, rotating randomizer
// candidates. No Math.random(), no network.

export interface FixtureTitle {
  id: number;
  media_type: 'tv' | 'movie';
  name: string;
  title: string;
  poster_path: string;
  backdrop_path: string;
}

const tvPoster = (id: number) => `/p${((id - 101) % 12) + 1}.png`;
const moviePoster = (id: number) => `/p${((id - 201) % 12) + 1}.png`;
const backdrop = (id: number) => `/b${(id % 3) + 1}.png`;
const profile = (id: number) => `/a${((id - 901) % 5) + 1}.png`;

export const TV_POOL: FixtureTitle[] = [
  { id: 101, media_type: 'tv', name: 'Star Harbor', title: '', poster_path: tvPoster(101), backdrop_path: backdrop(101) },
  { id: 102, media_type: 'tv', name: 'Neon Tide', title: '', poster_path: tvPoster(102), backdrop_path: backdrop(102) },
  { id: 103, media_type: 'tv', name: 'The Long Winter', title: '', poster_path: tvPoster(103), backdrop_path: backdrop(103) },
  { id: 104, media_type: 'tv', name: 'Crimson Coast', title: '', poster_path: tvPoster(104), backdrop_path: backdrop(104) },
  { id: 105, media_type: 'tv', name: 'Paper Cities', title: '', poster_path: tvPoster(105), backdrop_path: backdrop(105) },
  { id: 106, media_type: 'tv', name: 'Signal Lost', title: '', poster_path: tvPoster(106), backdrop_path: backdrop(106) },
  { id: 107, media_type: 'tv', name: 'Falling Star', title: '', poster_path: tvPoster(107), backdrop_path: backdrop(107) },
  { id: 108, media_type: 'tv', name: 'Salt & Silver', title: '', poster_path: tvPoster(108), backdrop_path: backdrop(108) },
  { id: 109, media_type: 'tv', name: 'Night Ledger', title: '', poster_path: tvPoster(109), backdrop_path: backdrop(109) },
  { id: 110, media_type: 'tv', name: 'The Vineyard Wars', title: '', poster_path: tvPoster(110), backdrop_path: backdrop(110) },
  { id: 111, media_type: 'tv', name: 'Starlight Rescue', title: '', poster_path: tvPoster(111), backdrop_path: backdrop(111) },
  { id: 112, media_type: 'tv', name: 'Frozen Meridian', title: '', poster_path: tvPoster(112), backdrop_path: backdrop(112) },
];

export const MOVIE_POOL: FixtureTitle[] = [
  { id: 201, media_type: 'movie', name: '', title: 'Midnight Freight', poster_path: moviePoster(201), backdrop_path: backdrop(201) },
  { id: 202, media_type: 'movie', name: '', title: 'Ash Garden', poster_path: moviePoster(202), backdrop_path: backdrop(202) },
  { id: 203, media_type: 'movie', name: '', title: 'The Glass Divide', poster_path: moviePoster(203), backdrop_path: backdrop(203) },
  { id: 204, media_type: 'movie', name: '', title: 'Rising Star', poster_path: moviePoster(204), backdrop_path: backdrop(204) },
  { id: 205, media_type: 'movie', name: '', title: 'Quiet Thunder', poster_path: moviePoster(205), backdrop_path: backdrop(205) },
  { id: 206, media_type: 'movie', name: '', title: 'Copper Dawn', poster_path: moviePoster(206), backdrop_path: backdrop(206) },
  { id: 207, media_type: 'movie', name: '', title: 'Starlight Diner', poster_path: moviePoster(207), backdrop_path: backdrop(207) },
  { id: 208, media_type: 'movie', name: '', title: 'Cabin Abroad', poster_path: moviePoster(208), backdrop_path: backdrop(208) },
  { id: 209, media_type: 'movie', name: '', title: 'Abstract City', poster_path: moviePoster(209), backdrop_path: backdrop(209) },
  { id: 210, media_type: 'movie', name: '', title: 'Velvet Circuit', poster_path: moviePoster(210), backdrop_path: backdrop(210) },
  { id: 211, media_type: 'movie', name: '', title: 'The Cartographer', poster_path: moviePoster(211), backdrop_path: backdrop(211) },
  { id: 212, media_type: 'movie', name: '', title: 'Low Tide Crossing', poster_path: moviePoster(212), backdrop_path: backdrop(212) },
];

// Same numeric id as a tv title on purpose: exercises the title cache key
// contract (media type must be part of the key).
export const MOVIE_101: FixtureTitle = {
  id: 101,
  media_type: 'movie',
  name: '',
  title: 'Origins of the Harbor',
  poster_path: '/p10.png',
  backdrop_path: '/b3.png',
};

export const ALL_TITLES: FixtureTitle[] = [
  ...TV_POOL,
  MOVIE_101,
  ...MOVIE_POOL,
];

export interface FixturePerson {
  id: number;
  name: string;
}

export const PERSONS: FixturePerson[] = [
  { id: 901, name: 'Starr Marsh' },
  { id: 902, name: 'Dario Fen' },
  { id: 903, name: 'Iris Kova' },
  { id: 904, name: 'Miles Turner' },
  { id: 905, name: 'Ana Reyes' },
];

export const profilePath = profile;

export interface FixturePersonTitle {
  id: number;
  name: string;
  title: string;
  media_type: string;
  poster_path: string;
}

export const PERSON_DETAILS: {
  [personId: string]: { name: string; titles: FixturePersonTitle[] };
} = {
  '901': {
    name: 'Starr Marsh',
    titles: [
      { id: 101, name: 'Star Harbor', title: '', media_type: 'tv', poster_path: tvPoster(101) },
      { id: 207, name: '', title: 'Starlight Diner', media_type: 'movie', poster_path: moviePoster(207) },
      { id: 103, name: 'The Long Winter', title: '', media_type: 'tv', poster_path: tvPoster(103) },
    ],
  },
  '902': {
    name: 'Dario Fen',
    titles: [
      { id: 102, name: 'Neon Tide', title: '', media_type: 'tv', poster_path: tvPoster(102) },
      { id: 203, name: '', title: 'The Glass Divide', media_type: 'movie', poster_path: moviePoster(203) },
    ],
  },
  '903': {
    name: 'Iris Kova',
    titles: [
      { id: 105, name: 'Paper Cities', title: '', media_type: 'tv', poster_path: tvPoster(105) },
      { id: 205, name: '', title: 'Quiet Thunder', media_type: 'movie', poster_path: moviePoster(205) },
      { id: 112, name: 'Frozen Meridian', title: '', media_type: 'tv', poster_path: tvPoster(112) },
    ],
  },
  '904': {
    name: 'Miles Turner',
    titles: [
      { id: 101, name: 'Star Harbor', title: '', media_type: 'tv', poster_path: tvPoster(101) },
      { id: 106, name: 'Signal Lost', title: '', media_type: 'tv', poster_path: tvPoster(106) },
    ],
  },
  '905': {
    name: 'Ana Reyes',
    titles: [
      { id: 201, name: '', title: 'Midnight Freight', media_type: 'movie', poster_path: moviePoster(201) },
      { id: 104, name: 'Crimson Coast', title: '', media_type: 'tv', poster_path: tvPoster(104) },
      { id: 209, name: '', title: 'Abstract City', media_type: 'movie', poster_path: moviePoster(209) },
    ],
  },
};

export const GENRES = {
  tv: [
    { id: 18, name: 'Drama' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
  ],
  movie: [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
  ],
};

// Deterministic per-mediaType rotation (replaces Math.random()).
export const RANDOM_CANDIDATES: { [mediaType: string]: number[] } = {
  tv: [102, 103],
  movie: [201, 202],
};

// Fixed latency table (ms). The search entries for 'ab'/'abc' are tuned so
// that overlapping debounce timers resolve in a deterministic order.
export const DELAY_MS = {
  list: 150,
  title: 200,
  person: 150,
  genres: 100,
  random: 200,
  auth: 50,
  searchDefault: 250,
};

export const searchDelay = (value: string): number => {
  const table: { [key: string]: number } = { ab: 1200, abc: 300 };
  return table[value] !== undefined ? table[value] : DELAY_MS.searchDefault;
};

// --- title detail fixtures -------------------------------------------------

const OVERVIEW_STAR_HARBOR =
  'In a near-future harbor city where cargo drones outnumber people, customs officer Mara Venn discovers that the manifest of a decommissioned freighter lists passengers who never existed. Each name she traces leads to a missing-person file sealed by the same judge, and every witness she interviews disappears before morning. As the tide brings in another ghost ship, Mara must decide whether the harbor is smuggling people out, or replacing them with something that only looks human.';

const OVERVIEW_NEON_TIDE =
  'Two detectives work the neon strip of a coastal city where every club hides a ledger and every ledger hides a body. When a singer they both protect goes missing, their cases collide.';

const OVERVIEW_ORIGINS =
  'Decades before the harbor became a city, a single lighthouse keeper logged every ship that passed. The ledger she left behind is the only proof that any of them existed at all.';

const OVERVIEW_FREIGHT =
  'A long-haul driver accepts one last job: move a sealed container across the country without stopping, asking, or looking inside. The miles are easy. The silence is not.';

const OVERVIEW_GENERIC =
  'Behind the scenes of a story everyone thinks they know, the people who made it tell it differently. Archives, interviews and the odd missing reel shape what finally reaches the screen.';

export interface FixtureCastMember {
  id: number;
  name: string;
  profile_path: string;
  credit_id: number;
}

export interface FixtureTitleDetail {
  title: {
    title: string;
    name: string;
    backdrop_path: string;
    poster_path: string;
    overview: string;
    vote_average: number;
  };
  cast: FixtureCastMember[];
  results: { key: string }[];
}

const castMember = (personId: number, creditId: number): FixtureCastMember => {
  const person = PERSONS.find((p) => p.id === personId)!;
  return {
    id: person.id,
    name: person.name,
    profile_path: profile(person.id),
    credit_id: creditId,
  };
};

const FEATURED_DETAILS: { [key: string]: FixtureTitleDetail } = {
  tv_101: {
    title: {
      title: '',
      name: 'Star Harbor',
      backdrop_path: backdrop(101),
      poster_path: tvPoster(101),
      overview: OVERVIEW_STAR_HARBOR,
      vote_average: 8.4,
    },
    cast: [
      castMember(901, 5001),
      castMember(902, 5002),
      castMember(903, 5003),
      castMember(904, 5004),
      castMember(905, 5005),
    ],
    results: [],
  },
  tv_102: {
    title: {
      title: '',
      name: 'Neon Tide',
      backdrop_path: backdrop(102),
      poster_path: tvPoster(102),
      overview: OVERVIEW_NEON_TIDE,
      vote_average: 7.9,
    },
    cast: [castMember(902, 5101), castMember(903, 5102)],
    results: [],
  },
  movie_101: {
    title: {
      title: 'Origins of the Harbor',
      name: '',
      backdrop_path: '/b3.png',
      poster_path: '/p10.png',
      overview: OVERVIEW_ORIGINS,
      vote_average: 7.1,
    },
    cast: [castMember(904, 5201)],
    results: [],
  },
  movie_201: {
    title: {
      title: 'Midnight Freight',
      name: '',
      backdrop_path: backdrop(201),
      poster_path: moviePoster(201),
      overview: OVERVIEW_FREIGHT,
      vote_average: 6.8,
    },
    cast: [castMember(905, 5301), castMember(901, 5302)],
    results: [],
  },
};

export const getTitleDetail = (
  mediaType: string,
  titleId: string
): FixtureTitleDetail => {
  const featured = FEATURED_DETAILS[`${mediaType}_${titleId}`];
  if (featured) return featured;

  const id = Number(titleId);
  const fixture = ALL_TITLES.find((t) => t.media_type === mediaType && t.id === id);
  const name = mediaType === 'tv' ? fixture?.name ?? '' : '';
  const title = mediaType === 'movie' ? fixture?.title ?? '' : '';
  const rating = Math.round((5 + (id % 40) / 10) * 10) / 10;
  const personId = PERSONS[id % PERSONS.length].id;

  return {
    title: {
      title,
      name,
      backdrop_path: fixture ? fixture.backdrop_path : backdrop(id),
      poster_path: fixture ? fixture.poster_path : `/p${(id % 12) + 1}.png`,
      overview: OVERVIEW_GENERIC,
      vote_average: rating,
    },
    cast: [castMember(personId, 6000 + id)],
    results: [],
  };
};
