// Deterministic fixture database for the local API emulator (adaptation-owned).
// All dates are 08:00Z so calendar dates stay stable for timezone offsets in
// [-8h, +15h] (grading host runs UTC+8). Fresh browser contexts always boot
// from these fixtures (see store.js).

const MARKDOWN_BODY = [
    "# Heading One",
    "",
    "Body paragraph with **bold** text and a [link](#local-anchor).",
    "",
    "- alpha item",
    "- beta item"
].join("\n");

const USERS = [
    {
        username: "wlb-alice",
        email: "alice@wlb.local",
        password: "alice-pass-1",
        token: "wlb-token-alice",
        bio: "Fixture author one.",
        image: "",
        following: ["wlb-bob"],
        favorites: ["wlb-art-02"]
    },
    {
        username: "wlb-bob",
        email: "bob@wlb.local",
        password: "bob-pass-2",
        token: "wlb-token-bob",
        bio: "Fixture author two.",
        image: "",
        following: [],
        favorites: ["wlb-art-01"]
    }
];

// tag slots by (NN mod 5): 1->alpha 2->beta 3->gamma 4->delta 0->epsilon
const TAG_BY_SLOT = {
    1: "wlb-alpha",
    2: "wlb-beta",
    3: "wlb-gamma",
    4: "wlb-delta",
    0: "wlb-epsilon"
};

const FIRST_ARTICLE_MS = Date.UTC(2026, 1, 20, 8, 0, 0); // 2026-02-20T08:00:00Z
const DAY_MS = 86400000;

const ARTICLES = [];
for (let nn = 1; nn <= 20; nn += 1) {
    const padded = nn < 10 ? "0" + nn : String(nn);
    const created = new Date(FIRST_ARTICLE_MS - (nn - 1) * DAY_MS).toISOString();
    ARTICLES.push({
        slug: "wlb-art-" + padded,
        title: "Fixture Article " + padded,
        description: "Description of fixture article " + padded + ".",
        body: nn === 1 ? MARKDOWN_BODY : "Body of fixture article " + padded + ".",
        authorUsername: nn % 2 === 1 ? "wlb-alice" : "wlb-bob",
        tagList: [TAG_BY_SLOT[nn % 5]],
        createdAt: created,
        updatedAt: created,
        favoritesCount: nn === 1 || nn === 2 ? 1 : 0
    });
}

const COMMENTS = [
    {
        id: 101,
        articleSlug: "wlb-art-01",
        body: "Seed comment B",
        authorUsername: "wlb-alice",
        createdAt: "2026-02-19T08:00:00.000Z"
    },
    {
        id: 102,
        articleSlug: "wlb-art-01",
        body: "Seed comment C",
        authorUsername: "wlb-bob",
        createdAt: "2026-02-17T08:00:00.000Z"
    },
    {
        id: 103,
        articleSlug: "wlb-art-02",
        body: "Seed comment A",
        authorUsername: "wlb-bob",
        createdAt: "2026-02-18T08:00:00.000Z"
    }
];

export const FIXTURES = {
    users: USERS,
    articles: ARTICLES,
    comments: COMMENTS
};
