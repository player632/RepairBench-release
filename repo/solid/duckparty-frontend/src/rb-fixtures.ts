/**
 * rb-fixtures.ts - the offline data desk for the RepairBench face of
 * omidnikrah/duckparty-frontend.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The seed is a pure client for a remote Go backend (`.env.example` points
 * VITE_API_URL / VITE_WS_URL at localhost:4030) plus three cross-origin bytes in
 * index.html (fonts.googleapis.com preconnect x2 + the Modak/Carter One
 * stylesheet), an umami beacon (src/helpers/analytics.helper.ts, live in every
 * `vite build` because it is gated on import.meta.env.PROD), a GitHub star
 * counter that calls api.github.com, and a WebSocket that reconnects five times.
 * The grading environment has allow_internet=false, so without a desk the app
 * boots into an empty yard: /party renders NOTHING because
 * src/pages/Party/index.tsx:110 gates the whole canvas behind
 * `!getDucks.isError && !getDucks.isLoading`.
 *
 * This module is DATA ONLY. It holds no routing, no assertion and no knowledge
 * of any defect; the request desk that serves it lives in rb-offline.ts and the
 * read-only observation bridge lives in rb-probe.ts (instrumentation).
 *
 * 🔴 THE DESK IS NOT THE SURFACE UNDER TEST. All twelve defects injected by
 * environment/mutation.patch land in the app's own modules (hooks, helpers,
 * stores, canvas hooks, pages, components); rb-fixtures.ts and rb-offline.ts
 * carry none, and the gold patch restores every one of them.
 */

export interface RbOwner {
  id: number;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface RbAppearance {
  skin?: string | null;
  accessories?: string[];
}

/** Field-for-field `src/api/generated/schemas/duckResponse.ts`. */
export interface RbDuck {
  appearance?: RbAppearance;
  created_at: string;
  dislikes_count: number;
  id: number;
  image: string;
  likes_count: number;
  name: string;
  owner: RbOwner;
  owner_id: number;
  rank: number;
  updated_at: string;
}

/** Field-for-field `src/api/generated/schemas/userResponse.ts`. */
export interface RbUser {
  CreatedAt: string;
  ID: number;
  UpdatedAt: string;
  display_name: string;
  email?: string;
}

/** Field-for-field `src/api/generated/schemas/authenticateResponse.ts`. */
export interface RbAuthenticateResponse {
  token: string;
  user: RbUser;
}

// ---------------------------------------------------------------------------
// constants the checkpoints read back through window.__rb
// ---------------------------------------------------------------------------

export const RB_SIGNED_IN_USER_ID = 42;
export const RB_SIGNED_IN_DISPLAY_NAME = "Quackmaster";
export const RB_ANON_TOKEN = "rb-anonymous-token-0001";
export const RB_OTP_TOKEN = "rb-otp-token-0002";
/** Any non-empty code is accepted; this one is what the probe seeds. */
export const RB_OTP = "424242";
export const RB_GITHUB_STARS = 1234;
export const RB_OTP_SENT_MESSAGE = "OTP sent to your email";
export const RB_DELETE_MESSAGE = "Duck deleted";
export const RB_UNAUTHORIZED = "Unauthorized";

/**
 * `created_at` is computed RELATIVE TO PAGE LOAD, never baked as a literal
 * timestamp: src/helpers/date.helper.ts formats it through
 * Intl.RelativeTimeFormat, so a frozen date would silently drift from
 * "3 days ago" to "4 days ago" as the corpus ages and the F07 witness would
 * decay into a false red. Duck 1 is the Birthday witness (3 days).
 */
const DAY_MS = 86_400_000;

const isoDaysAgo = (days: number): string =>
  new Date(Date.now() - days * DAY_MS).toISOString();

interface RbSeedRow {
  id: number;
  name: string;
  skin: string;
  ownerId: number;
  ownerName: string;
  daysAgo: number;
  likes: number;
  dislikes: number;
  rank: number;
}

const SEED_ROWS: RbSeedRow[] = [
  { id: 1, name: "Waddles", skin: "giraffe", ownerId: 101, ownerName: "Pond Pilot", daysAgo: 3, likes: 128, dislikes: 7, rank: 1 },
  { id: 2, name: "Sir Quacks", skin: "superman", ownerId: 102, ownerName: "Bread Baron", daysAgo: 5, likes: 96, dislikes: 12, rank: 2 },
  { id: 3, name: "Bread", skin: "barbie", ownerId: 103, ownerName: "Marsh Marshal", daysAgo: 11, likes: 74, dislikes: 3, rank: 3 },
  { id: 4, name: "Colonel Feathers", skin: "astronaut", ownerId: 104, ownerName: "Nestor", daysAgo: 40, likes: 51, dislikes: 20, rank: 4 },
  { id: 5, name: "Puddles", skin: "pirate", ownerId: 105, ownerName: "Quackula", daysAgo: 2, likes: 33, dislikes: 2, rank: 5 },
  { id: 6, name: "Duck Norris", skin: "artiste", ownerId: 106, ownerName: "Featherstone", daysAgo: 90, likes: 12, dislikes: 1, rank: 6 },
];

const skinImage = (skin: string): string => `/skins/original/${skin}.png`;

const ownerOf = (row: RbSeedRow): RbOwner => ({
  id: row.ownerId,
  display_name: row.ownerName,
  created_at: isoDaysAgo(row.daysAgo + 30),
  updated_at: isoDaysAgo(row.daysAgo),
});

const duckOf = (row: RbSeedRow): RbDuck => ({
  id: row.id,
  name: row.name,
  image: skinImage(row.skin),
  owner_id: row.ownerId,
  owner: ownerOf(row),
  created_at: isoDaysAgo(row.daysAgo),
  updated_at: isoDaysAgo(row.daysAgo),
  likes_count: row.likes,
  dislikes_count: row.dislikes,
  rank: row.rank,
  appearance: { skin: row.skin, accessories: [] },
});

/** A fresh copy on every call: the desk mutates its own list (POST/DELETE). */
export const rbDucks = (): RbDuck[] => SEED_ROWS.map(duckOf);

/** `GET /leaderboard` - the yard ordered by rank, top five only. */
export const rbLeaderboard = (): RbDuck[] =>
  rbDucks()
    .filter((duck) => duck.rank > 0 && duck.rank <= 5)
    .sort((a, b) => a.rank - b.rank);

/** `GET /user/:userId/ducks`. */
export const rbUserDucks = (userId: number, all: RbDuck[]): RbDuck[] =>
  all.filter((duck) => duck.owner_id === userId);

export const rbSignedInUser = (email?: string): RbUser => ({
  ID: RB_SIGNED_IN_USER_ID,
  CreatedAt: isoDaysAgo(120),
  UpdatedAt: isoDaysAgo(1),
  display_name: RB_SIGNED_IN_DISPLAY_NAME,
  ...(email ? { email } : {}),
});

/**
 * The identity `window.__rbHost.seedAuth()` writes into localStorage before a
 * reload. `email` is deliberately ABSENT: src/pages/Party/index.tsx:98-107
 * shows the "wanna save this duck with your email?" nudge exactly when the
 * signed-in user has no email, and src/helpers/auth.helper.ts:20-23 round-trips
 * this object through USER_DATA_KEY unchanged.
 */
export const rbStoredUser = (): RbUser => rbSignedInUser();

/** A newly created duck, as `POST /duck` would echo it back. */
export const rbCreatedDuck = (
  id: number,
  name: string,
  appearance: RbAppearance,
): RbDuck => ({
  id,
  name,
  image: `/skins/original/${String(appearance.skin ?? "giraffe").replace(/_/g, "-")}.png`,
  owner_id: RB_SIGNED_IN_USER_ID,
  owner: {
    id: RB_SIGNED_IN_USER_ID,
    display_name: RB_SIGNED_IN_DISPLAY_NAME,
    created_at: isoDaysAgo(120),
    updated_at: isoDaysAgo(0),
  },
  created_at: isoDaysAgo(0),
  updated_at: isoDaysAgo(0),
  likes_count: 0,
  dislikes_count: 0,
  rank: 0,
  appearance,
});

/** `https://api.github.com/repos/omidnikrah/duckparty-frontend` (stars badge). */
export const rbGithubRepo = (): { stargazers_count: number; name: string } => ({
  stargazers_count: RB_GITHUB_STARS,
  name: "duckparty-frontend",
});
