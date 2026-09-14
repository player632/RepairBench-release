// RepairBench offline adaptation — deterministic fixture database.
// Stands in for the remote Conduit API (https://api.realworld.io/api) so this package
// builds, serves and is measured with zero network access and zero second service.
// Determinism contract: every value is a literal or derived from a fixed-range loop.
// No Date.now(), no Math.random(), no locale-dependent formatting, no key-order churn
// ⇒ two runs over the same package produce byte-identical responses.

export const FIXED_TIMESTAMP = "2026-01-05T09:00:00.000Z";

export const SESSION_USER = {
  email: "rb-user@fixture.local",
  username: "rb-user",
  bio: "fixture session user",
  image: "",
  token: "rb-fixture-token-0001"
};

// The only credential pair the fixture accepts. Anything else returns the API-shaped
// { errors: { ... } } envelope (never a rejection) so the app's own error branch runs.
export const LOGIN_PASSWORD = "fixture-password";

export const ARTICLE_COUNT = 25;

const AUTHOR_SEEDS = [
  { username: "rb-author-alpha", bio: "fixture author alpha" },
  { username: "rb-author-beta", bio: "fixture author beta" },
  { username: "rb-author-gamma", bio: "fixture author gamma" }
];

// 🔴 Two tag vocabularies on purpose (caught before it cost a measurement leg):
// `createCommon.js:6` lowercases whatever GET /tags returns, so if the tag feed were
// already all-lowercase that call would be a no-op and the defect that removes it would
// be UNOBSERVABLE. So the feed carries mixed case (TAG_FEED) while article tagList values
// stay lowercase (ARTICLE_TAGS) — the latter because the sidebar hands the *lowercased*
// tag to Articles.byTag() in the clean state, and the fixture must still match it.
const TAG_FEED = ["Fixture", "Offline", "deterministic", "SolidJS", "conduit"];
const ARTICLE_TAGS = ["fixture", "offline", "deterministic", "solidjs", "conduit"];

const COMMENTED_SLUGS = { "rb-article-01": 4, "rb-article-02": 2 };

function pad2(n) {
  return String(n).padStart(2, "0");
}

function authorOf(i) {
  const seed = AUTHOR_SEEDS[i % AUTHOR_SEEDS.length];
  return { username: seed.username, bio: seed.bio, image: "", following: false };
}

function articleOf(i) {
  const n = pad2(i + 1);
  return {
    slug: "rb-article-" + n,
    title: "Fixture Article " + n,
    description: "Deterministic description of fixture article " + n,
    body: "Body text of fixture article " + n + ".",
    tagList: [ARTICLE_TAGS[i % ARTICLE_TAGS.length]],
    createdAt: FIXED_TIMESTAMP,
    updatedAt: FIXED_TIMESTAMP,
    favorited: false,
    favoritesCount: (i % 4) + 1,
    author: authorOf(i)
  };
}

function commentOf(slug, i) {
  return {
    id: i + 1,
    createdAt: FIXED_TIMESTAMP,
    updatedAt: FIXED_TIMESTAMP,
    body: "Fixture comment " + (i + 1) + " on " + slug,
    author: { username: SESSION_USER.username, bio: SESSION_USER.bio, image: "", following: false }
  };
}

function createDb() {
  const articles = [];
  for (let i = 0; i < ARTICLE_COUNT; i += 1) articles.push(articleOf(i));

  const comments = {};
  for (const slug of Object.keys(COMMENTED_SLUGS)) {
    const list = [];
    for (let i = 0; i < COMMENTED_SLUGS[slug]; i += 1) list.push(commentOf(slug, i));
    comments[slug] = list;
  }

  return {
    articles,
    comments,
    follows: {},          // username -> boolean
    token: null,          // session token currently handed out
    user: null,           // session user record (null until login/register)
    nextArticleNo: ARTICLE_COUNT + 1,
    nextCommentId: 9001
  };
}

// Single mutable instance. `resetDb()` restores the pristine fixture in place so a
// measurement leg can start from a known state without re-importing the module.
export const db = createDb();

export function resetDb() {
  Object.assign(db, createDb());
}

// GET /tags payload — mixed case, see the TAG_FEED note above.
export function tagList() {
  return TAG_FEED.slice();
}
