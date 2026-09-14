// Offline adaptation: same exported signatures and caching semantics as the
// original TMDB client, backed by local fixtures instead of fetch().
import {
  GetList,
  GetPerson,
  GetGenres,
  GetRandomTitle,
  GetTitles,
  GetTitle,
  ListTitle,
  Titles,
} from '@/types/tmdb';
import {
  TV_POOL,
  MOVIE_POOL,
  MOVIE_101,
  ALL_TITLES,
  PERSONS,
  PERSON_DETAILS,
  GENRES,
  RANDOM_CANDIDATES,
  DELAY_MS,
  searchDelay,
  getTitleDetail,
  profilePath,
  FixtureTitle,
} from './fixtures';

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const toListTitle = (fixture: FixtureTitle): ListTitle => ({
  id: fixture.id,
  name: fixture.name,
  title: fixture.title,
  poster_path: fixture.poster_path,
});

export const getList: GetList = async (category, mediaType, page, id?) => {
  const key = `${mediaType}_${category}_${page}_${id}`;
  const index = `${category}_${mediaType}`;

  if (sessionStorage.getItem(key)) {
    const { results, totalPages } = JSON.parse(sessionStorage.getItem(key)!);
    return {
      key: index,
      results,
      totalPages,
    };
  }

  await wait(DELAY_MS.list);

  const pool = mediaType === 'tv' ? TV_POOL : MOVIE_POOL;
  const rotation = (category.charCodeAt(0) + (id || 0)) % pool.length;
  const rotated = [...pool.slice(rotation), ...pool.slice(0, rotation)];

  let results: ListTitle[];
  let totalPages: number;
  if (id) {
    totalPages = 1;
    results = page === 1 ? rotated.slice(0, 3).map(toListTitle) : [];
  } else {
    totalPages = 3;
    results =
      page === 1
        ? rotated.slice(0, 6).map(toListTitle)
        : page === 2
        ? rotated.slice(6, 12).map(toListTitle)
        : [];
  }

  sessionStorage.setItem(key, JSON.stringify({ results, totalPages }));

  return {
    key: index,
    results,
    totalPages,
  };
};

export const getPerson: GetPerson = async (personId) => {
  const key = `person_${personId}`;

  if (sessionStorage.getItem(key)) {
    return JSON.parse(sessionStorage.getItem(key)!);
  }

  await wait(DELAY_MS.person);

  const person = PERSON_DETAILS[personId] || { name: 'Unknown Person', titles: [] };

  sessionStorage.setItem(key, JSON.stringify(person));

  return { name: person.name, titles: person.titles };
};

export const getGenres: GetGenres = async () => {
  await wait(DELAY_MS.genres);
  return { tv: GENRES.tv, movie: GENRES.movie };
};

const randomCounters: { [mediaType: string]: number } = {};

export const getRandomTitle: GetRandomTitle = async (mediaType) => {
  await wait(DELAY_MS.random);

  const candidates = RANDOM_CANDIDATES[mediaType] || [];
  const counter = randomCounters[mediaType] || 0;
  randomCounters[mediaType] = counter + 1;

  const id = candidates[counter % candidates.length];
  const fixture = ALL_TITLES.find((t) => t.id === id)!;

  return {
    id: fixture.id,
    name: fixture.name,
    title: fixture.title,
    poster_path: fixture.poster_path,
    backdrop_path: fixture.backdrop_path,
  };
};

export const getTitles: GetTitles = async (value) => {
  await wait(searchDelay(value));

  const query = value.toLowerCase();
  const titles: Titles[] = [];

  for (const fixture of ALL_TITLES) {
    const haystack = `${fixture.name} ${fixture.title}`.toLowerCase();
    if (haystack.includes(query)) {
      titles.push({
        id: fixture.id,
        name: fixture.name,
        media_type: fixture.media_type,
        original_title: fixture.title || fixture.name,
        poster_path: fixture.poster_path,
        title: fixture.title,
      });
    }
  }

  for (const person of PERSONS) {
    if (person.name.toLowerCase().includes(query)) {
      titles.push({
        id: person.id,
        name: person.name,
        media_type: 'person',
        original_title: '',
        profile_path: profilePath(person.id),
      });
    }
  }

  return titles;
};

export const getTitle: GetTitle = async (mediaType, titleId) => {
  const key = `${titleId}`;
  if (localStorage.getItem(key)) {
    return JSON.parse(localStorage.getItem(key)!);
  }

  await wait(DELAY_MS.title);

  const detail = getTitleDetail(mediaType, titleId);
  const payload = {
    title: detail.title,
    cast: detail.cast,
    results: detail.results,
  };

  localStorage.setItem(key, JSON.stringify(payload));
  return payload;
};
