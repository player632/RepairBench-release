// Offline determinism layer for the WLB repair-bench verifier.
//
// WHY THIS FILE EXISTS. The seed's whole data plane is a Firebase Realtime Database socket
// (src/components/app.component.tsx:100 `onValue(ref(getDatabase(), 'loofi-music/'), ...)`) plus an
// in-place Fisher-Yates shuffle driven by `Math.random()` (:104-111). Offline that is fatal, not
// merely degraded: `initializeApp({apiKey: undefined, ...})` followed by `getDatabase()` throws
// "Can't determine Firebase Database URL" inside the mount effect, so nothing renders at all. This
// module therefore keeps the SEVEN firebase entry points the app imports, with the same call shapes
// and the same return-value usage, and backs them with a bundled 24-track playlist. The shuffle call
// site, its loop shape and its (biased) index/randIndex draw order are left EXACTLY as shipped in
// app.component.tsx - only the entropy source changes, from `Math.random()` to `fixtureRandom()`, a
// seeded mulberry32 stream. That keeps the "shuffled playlist" contract intact while making the
// post-shuffle order a pure function of (fixture order, seed), which is what lets the verifier assert
// on concrete song titles.
//
// TWO INDEPENDENT GENERATORS ON PURPOSE. src/App.tsx:20 draws 79 opacity values for decorative
// backdrop divs. If those draws shared one stream with the 24 playlist draws, anything that shifted
// the effect ordering would silently re-permute the playlist. `decorRandom()` is a separate instance
// with a separate seed, so the playlist permutation cannot be perturbed by the decoration.
//
// NO APPLICATION LOGIC IS CHANGED HERE. This file only supplies data and entropy.

export interface FixtureTrack {
    title: string;
    author: string;
    image: string;
    audio: string;
}

export interface FixtureSnapshot {
    val: () => any;
}

export interface FixtureRef {
    path: string;
}

const PRNG_SEED_PLAYLIST = 20260909;
const PRNG_SEED_DECOR = 20260910;

function mulberry32(seed: number): () => number {
    let a = seed | 0;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export const fixtureRandom: () => number = mulberry32(PRNG_SEED_PLAYLIST);
export const decorRandom: () => number = mulberry32(PRNG_SEED_DECOR);

// The 24 tracks in their PRE-shuffle (stored) order. app.component.tsx:104-111 permutes this array
// with the seeded stream above, and the resulting POST-shuffle order is what the home grid renders.
// The pre-shuffle order was solved offline so that, after that exact permutation, index 0 is the
// seed's own hardcoded default song ('Underwater' / 'LiQWYD', app.component.tsx:52-53) and index 1 is
// a DIFFERENT song ('Rainy Window' / 'Aso') - index 1 is the track the queue's Next button and the
// continue-previous-session restore both have to land on, so it must be distinguishable from the
// hardcoded fallback. Titles/authors are [A-Za-z0-9 ] only on purpose: home.component.tsx:108-110 and
// search.component.tsx:115-118 build DOM ids with `(title + author).replace(/\s/g, '-')` and
// `document.getElementById` is an observation channel, so an id needing CSS escaping would be a
// self-inflicted flake.
const FIXTURE_TRACKS: Array<[string, string]> = [
    ['Late Shift', 'Sling Dilly'],
    ['Quiet Hours', 'Kupla'],
    ['Nightfall Loop', 'Arbour'],
    ['Slow Train', 'Ikson'],
    ['Static Bloom', 'Hanz'],
    ['Soft Static', 'No Spirit'],
    ['Rainy Window', 'Aso'],
    ['Faded Photos', 'Kainbeats'],
    ['Long Way Home', 'Lofi Coffee'],
    ['Amber Light', 'Arbour'],
    ['Warm Static', 'Mavros'],
    ['Dust And Gold', 'Nymano'],
    ['Blue Hour', 'Yasper'],
    ['Paper Planes', 'Roa'],
    ['Underwater', 'LiQWYD'],
    ['Cassette Sky', 'Birocratic'],
    ['Rooftop Dawn', 'Troglow'],
    ['Night Bus', 'Philanthrope'],
    ['Cobblestone', 'Ezzy'],
    ['Harbour Lights', 'Dimensional'],
    ['Morning Chill', 'Hanz'],
    ['Slow Tide', 'Kainbeats'],
    ['Glass Rain', 'Alex'],
    ['Empty Station', 'Middle School'],
];

// ONE real same-origin audio file, distinguished per track by query string.
// `serve_static.mjs:27` splits the request URL on "?" before resolving, so every track gets the same
// bytes under a distinct URL - which is exactly what app.component.tsx:152
// (`a.audio === song.audio.getAttribute('src')`) needs in order to tell "the same track was clicked
// again" from "a different track was clicked". A `blob:` URL would also produce distinct strings but
// would NOT survive the page reload that the continue-previous-session checkpoint asserts through,
// so a real file under public/ (copied verbatim into build/ by react-scripts) is the only shape that
// holds across every checkpoint. public/media/track.wav is 8000 Hz / 16-bit / mono / 4 s = 64,044 B,
// sha256_16 96e6af7352a32d6a: long enough for the media element to report a whole-number duration,
// short enough to decode instantly and keep every checkpoint inside its bounded poll.
const fixtureAudioUrl = (index: number): string =>
    `/media/track.wav?t=${String(index + 1).padStart(2, '0')}`;

// Artwork: the two PNGs that already ship in public/ (so they are copied into build/ by the build and
// need no new bytes), alternated so adjacent cards are visually distinguishable.
const fixtureImageUrl = (index: number): string =>
    index % 2 === 0 ? '/logo192.png' : '/logo512.png';

// The default song's own artwork/audio. app.component.tsx:52-58 hardcodes 'Underwater' / 'LiQWYD' as
// the fallback when there is no stored session; `?t=00` is deliberately OUTSIDE the per-track range
// 01..24 so "still on the hardcoded default" is never confusable with "playing track N".
export const FIXTURE_DEFAULT_IMAGE = '/logo192.png';
export const FIXTURE_DEFAULT_AUDIO = '/media/track.wav?t=00';

export const LOOFI_MUSIC: FixtureTrack[] = FIXTURE_TRACKS.map(
    (pair: [string, string], index: number): FixtureTrack => ({
        title: pair[0],
        author: pair[1],
        image: fixtureImageUrl(index),
        audio: fixtureAudioUrl(index),
    })
);

const DATABASE_PATH_PLAYLIST = 'loofi-music/';
const DATABASE_PATH_CONNECTED = '.info/connected';

export function initializeApp(config: Record<string, unknown>): { name: string } {
    // The seed passes four `process.env.REACT_APP_*` values, all of which inline to `undefined` in a
    // production build. Accepting and ignoring them keeps the call site byte-identical.
    void config;
    return { name: 'loofi-offline-fixture' };
}

export function getDatabase(): { name: string } {
    return { name: 'loofi-offline-fixture-database' };
}

export function getFirestore(): { name: string } {
    return { name: 'loofi-offline-fixture-firestore' };
}

export function ref(database: unknown, path: string): FixtureRef {
    void database;
    return { path };
}

export function collection(firestore: unknown, name: string): { name: string } {
    void firestore;
    return { name };
}

export function addDoc(
    target: unknown,
    data: Record<string, unknown>
): Promise<{ id: string }> {
    // app.component.tsx:120-131 installs `window.onerror` and posts every uncaught error to Firestore.
    // That path MUST stay live and MUST stay harmless: one of the injected defects produces a
    // TypeError inside a click handler, and the intended observable is "the button silently does
    // nothing", not "the page crashes". Resolving instead of rejecting also keeps an unhandled
    // rejection out of the run.
    void target;
    void data;
    return Promise.resolve({ id: 'loofi-offline-fixture-log' });
}

export function onValue(
    target: FixtureRef,
    callback: (snapshot: FixtureSnapshot) => void
): () => void {
    // Synchronous delivery on purpose: the seed subscribes inside its mount effect, so a synchronous
    // callback lets `setData` land in the same commit and removes any network-shaped wait from every
    // checkpoint. A fresh deep copy per subscription is required because app.component.tsx:104-111
    // permutes the array IN PLACE - handing out the module-level array would let the first subscriber
    // reorder the fixture for every later page load.
    const value: unknown =
        target.path === DATABASE_PATH_CONNECTED
            ? true // always "connected": the offline Snackbar must never open
            : target.path === DATABASE_PATH_PLAYLIST
            ? LOOFI_MUSIC.map((track: FixtureTrack): FixtureTrack => ({ ...track }))
            : null;
    callback({ val: (): any => value });
    return (): void => undefined;
}
