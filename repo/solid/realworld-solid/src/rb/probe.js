/*
 *
 * A read-only facade over objects the application already owns: the store tuple that
 * `Provider` builds in src/store/index.js ([state, actions]), the offline fixture wire
 * log that the adaptation layer publishes as window.__RB_MOCK__, the browser's own
 * localStorage, and the DOM the app renders. The probe reimplements no application
 * logic, caches nothing, and exposes no defect state: every reading below is either
 * (a) something a user can see on screen, (b) a value the app keeps in its own store,
 * or (c) a request the app itself put on the wire.
 *
 * It exists because the store tuple never leaves `Provider` - it is handed to Solid
 * context only, so a graded run has no handle on `state`/`actions` from the console.
 *
 * Two surfaces, deliberately separated:
 *   - readers  : pure, total, return a SCALAR (string | number | boolean | null).
 *                Graded assertions call only these. Arrays/objects are never returned
 *                because the runner compares scalars; list readings are exposed as a
 *                length plus a joined string.
 *   - setup    : side-effecting thin wrappers over the app's OWN published actions
 *                (login/logout/setPage/loadArticles/makeFavorite/follow/...). Test
 *                setup calls only these, so a setup step is always a user-level move
 *                and never a poke at private state.
 *
 * Readers never throw: `safe()` maps any failure to null, so a crashed app reads as a
 * missing value (still a failing assertion against the expected scalar) instead of an
 * exception that the runner would report as an unreadable actual.
 */

let HANDLE = null;

const q = (sel) => document.querySelector(sel);
const qa = (sel) => Array.prototype.slice.call(document.querySelectorAll(sel));
const txt = (el) => (el ? String(el.textContent === undefined || el.textContent === null ? "" : el.textContent).trim() : null);
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };

function safe(fn) {
  try {
    const v = fn();
    return v === undefined ? null : v;
  } catch (e) {
    return null;
  }
}

const state = () => (HANDLE ? HANDLE.state : null);
const actions = () => (HANDLE ? HANDLE.actions : null);
const mock = () => (typeof window !== "undefined" ? window.__RB_MOCK__ || null : null);
const requests = () => { const m = mock(); return m && Array.isArray(m.requests) ? m.requests : []; };

function storeArticles() {
  const s = state();
  const a = s && s.articles;
  return a && typeof a === "object" ? a : {};
}

function articleOf(slug) {
  const a = storeArticles();
  const v = a[slug];
  return v && typeof v === "object" ? v : null;
}

function normRoute(route) {
  return String(route === null || route === undefined ? "" : route).replace(/^#?\/?/, "");
}

function reqMatches(rec, method, pathPrefix) {
  if (!rec) return false;
  if (method && String(rec.method).toLowerCase() !== String(method).toLowerCase()) return false;
  if (pathPrefix && String(rec.path).indexOf(String(pathPrefix)) !== 0) return false;
  return true;
}

function matchingRequests(method, pathPrefix) {
  return requests().filter((r) => reqMatches(r, method, pathPrefix));
}

export function installRbProbe(handle) {
  HANDLE = handle || null;
  const w = window;
  w.__RB__ = {
    probe: "realworld-solid-rb-probe/1",

    /* ---------------- readiness ---------------- */
    installed: () => !!HANDLE,
    hasStore: () => !!(HANDLE && HANDLE.state),
    hasActions: () => !!(HANDLE && HANDLE.actions),
    hasMock: () => !!mock(),
    actionNamesJoined: () => safe(() => Object.keys(actions() || {}).sort().join(",")),

    /* ---------------- store readings (scalars) ---------------- */
    appName: () => safe(() => { const s = state(); return s && s.appName === undefined ? null : String(s.appName); }),
    token: () => safe(() => { const s = state(); const t = s && s.token; return t === undefined || t === null ? null : String(t); }),
    tokenIsSet: () => safe(() => { const s = state(); return !!(s && s.token); }),
    currentUserUsername: () => safe(() => { const s = state(); const u = s && s.currentUser; return u && u.username ? String(u.username) : null; }),
    currentUserIsSet: () => safe(() => { const s = state(); return !!(s && s.currentUser); }),
    page: () => safe(() => num(state() && state().page)),
    totalPagesCount: () => safe(() => num(state() && state().totalPagesCount)),
    articlesInStore: () => safe(() => Object.keys(storeArticles()).length),
    articleSlugsJoined: () => safe(() => Object.keys(storeArticles()).sort().join(",")),
    articleHas: (slug) => safe(() => !!articleOf(slug)),
    articleTitle: (slug) => safe(() => { const a = articleOf(slug); return a && a.title ? String(a.title) : null; }),
    articleFavoritesCount: (slug) => safe(() => { const a = articleOf(slug); return a ? num(a.favoritesCount) : null; }),
    articleFavorited: (slug) => safe(() => { const a = articleOf(slug); return a ? !!a.favorited : null; }),
    articleAuthor: (slug) => safe(() => { const a = articleOf(slug); return a && a.author && a.author.username ? String(a.author.username) : null; }),
    articleTagListJoined: (slug) => safe(() => { const a = articleOf(slug); return a && Array.isArray(a.tagList) ? a.tagList.join(",") : null; }),
    tagsCount: () => safe(() => { const s = state(); const t = s && s.tags; return Array.isArray(t) ? t.length : null; }),
    tagsJoined: () => safe(() => { const s = state(); const t = s && s.tags; return Array.isArray(t) ? t.join(",") : null; }),
    profileUsername: () => safe(() => { const s = state(); const p = s && s.profile; return p && p.username ? String(p.username) : null; }),
    profileFollowing: () => safe(() => { const s = state(); const p = s && s.profile; return p ? !!p.following : null; }),
    commentsCount: () => safe(() => { const s = state(); const c = s && s.comments; return Array.isArray(c) ? c.length : null; }),
    commentIdAt: (i) => safe(() => { const s = state(); const c = s && s.comments; return Array.isArray(c) && c[Number(i)] ? num(c[Number(i)].id) : null; }),
    commentIdsJoined: () => safe(() => { const s = state(); const c = s && s.comments; return Array.isArray(c) ? c.map((x) => (x && x.id === undefined ? "" : String(x.id))).join(",") : null; }),
    articleSlugInStore: () => safe(() => { const s = state(); return s && s.articleSlug ? String(s.articleSlug) : null; }),

    /* ---------------- fixture wire log (scalars) ---------------- */
    reqCount: () => safe(() => requests().length),
    reqCountFor: (method, pathPrefix) => safe(() => matchingRequests(method, pathPrefix).length),
    reqMethodAt: (i) => safe(() => { const r = requests()[Number(i)]; return r ? String(r.method) : null; }),
    reqPathAt: (i) => safe(() => { const r = requests()[Number(i)]; return r ? String(r.path) : null; }),
    reqUrlAt: (i) => safe(() => { const r = requests()[Number(i)]; return r ? String(r.url) : null; }),
    reqOffsetAt: (i) => safe(() => { const r = requests()[Number(i)]; return r ? num(r.offset) : null; }),
    reqLimitAt: (i) => safe(() => { const r = requests()[Number(i)]; return r ? num(r.limit) : null; }),
    reqHasAuthAt: (i) => safe(() => { const r = requests()[Number(i)]; return r ? !!r.auth : null; }),
    lastReqPath: () => safe(() => { const rs = requests(); const r = rs[rs.length - 1]; return r ? String(r.path) : null; }),
    lastReqUrl: () => safe(() => { const rs = requests(); const r = rs[rs.length - 1]; return r ? String(r.url) : null; }),
    lastReqOffset: () => safe(() => { const rs = requests(); const r = rs[rs.length - 1]; return r ? num(r.offset) : null; }),
    lastReqLimit: () => safe(() => { const rs = requests(); const r = rs[rs.length - 1]; return r ? num(r.limit) : null; }),
    offsetsJoinedFor: (method, pathPrefix) => safe(() => matchingRequests(method, pathPrefix).map((r) => String(r.offset)).join(",")),
    limitsJoinedFor: (method, pathPrefix) => safe(() => matchingRequests(method, pathPrefix).map((r) => String(r.limit)).join(",")),
    urlsJoinedFor: (method, pathPrefix) => safe(() => matchingRequests(method, pathPrefix).map((r) => String(r.url)).join("|")),
    mockArticleCount: () => safe(() => { const m = mock(); return m && m.db && Array.isArray(m.db.articles) ? m.db.articles.length : null; }),
    mockFavoriteCountOf: (slug) => safe(() => {
      const m = mock();
      if (!m || !m.db || !Array.isArray(m.db.articles)) return null;
      for (const a of m.db.articles) if (a.slug === String(slug)) return num(a.favoritesCount);
      return null;
    }),
    mockFavoritedOf: (slug) => safe(() => {
      const m = mock();
      if (!m || !m.db || !Array.isArray(m.db.articles)) return null;
      for (const a of m.db.articles) if (a.slug === String(slug)) return !!a.favorited;
      return null;
    }),
    mockFollowsOf: (username) => safe(() => { const m = mock(); return m && m.db && m.db.follows ? !!m.db.follows[String(username)] : null; }),
    mockTokenIsSet: () => safe(() => { const m = mock(); return !!(m && m.db && m.db.token); }),

    /* ---------------- DOM readings (scalars) ---------------- */
    previewCount: () => safe(() => qa(".article-preview").length),
    previewTitleAt: (i) => safe(() => txt(qa(".article-preview h1")[Number(i)])),
    previewTitlesJoined: () => safe(() => qa(".article-preview h1").map((el) => txt(el)).join("|")),
    previewDescriptionAt: (i) => safe(() => txt(qa(".article-preview p")[Number(i)])),
    previewAuthorAt: (i) => safe(() => txt(qa(".article-preview .author")[Number(i)])),
    previewFavoriteButtonCount: () => safe(() => qa(".article-preview .article-meta button").length),
    previewFavoriteCountAt: (i) => safe(() => num(txt(qa(".article-preview .article-meta button")[Number(i)]))),
    previewFavoriteCountsJoined: () => safe(() => qa(".article-preview .article-meta button").map((el) => String(num(txt(el)))).join(",")),
    previewFavoriteClassAt: (i) => safe(() => { const el = qa(".article-preview .article-meta button")[Number(i)]; return el ? String(el.className) : null; }),
    previewTagPillCount: () => safe(() => qa(".article-preview .tag-list .tag-pill").length),
    previewTagTextsJoined: () => safe(() => qa(".article-preview .tag-list .tag-pill").map((el) => txt(el)).join(",")),
    paginationItemCount: () => safe(() => qa(".pagination .page-item").length),
    paginationTextsJoined: () => safe(() => qa(".pagination .page-item .page-link").map((el) => txt(el)).join(",")),
    activePageItemCount: () => safe(() => qa(".pagination .page-item.active").length),
    activePageItemText: () => safe(() => txt(q(".pagination .page-item.active .page-link"))),
    sidebarTagCount: () => safe(() => qa(".sidebar .tag-list .tag-pill").length),
    sidebarTagTextAt: (i) => safe(() => txt(qa(".sidebar .tag-list .tag-pill")[Number(i)])),
    sidebarTagsJoined: () => safe(() => qa(".sidebar .tag-list .tag-pill").map((el) => txt(el)).join(",")),
    navItemCount: () => safe(() => qa(".navbar .nav-item").length),
    navTextsJoined: () => safe(() => qa(".navbar .nav-link").map((el) => txt(el)).join("|")),
    navHasText: (needle) => safe(() => qa(".navbar .nav-link").some((el) => String(txt(el)).indexOf(String(needle)) >= 0)),
    navBrandText: () => safe(() => txt(q(".navbar .navbar-brand"))),
    bannerTitleText: () => safe(() => txt(q(".banner h1"))),
    bannerSubtextText: () => safe(() => txt(q(".banner p"))),
    feedTabCount: () => safe(() => qa(".feed-toggle .nav-link").length),
    feedTabTextsJoined: () => safe(() => qa(".feed-toggle .nav-link").map((el) => txt(el)).join("|")),
    activeFeedTabText: () => safe(() => txt(q(".feed-toggle .nav-link.active"))),
    articlePageTitleText: () => safe(() => txt(q(".article-page .article-content h1, .article-page h1"))),
    articlePageTagCount: () => safe(() => qa(".article-page .tag-list .tag-pill, .article-page .tag-default").length),
    commentCardCount: () => safe(() => qa(".card").length),
    errorMessagesCount: () => safe(() => qa(".error-messages li").length),
    errorMessagesJoined: () => safe(() => qa(".error-messages li").map((el) => txt(el)).join("|")),
    bodyTextHas: (needle) => safe(() => String(document.body.textContent || "").indexOf(String(needle)) >= 0),
    hashValue: () => safe(() => String(window.location.hash)),
    routeLocation: () => safe(() => String(window.location.hash).slice(2)),

    /* ---------------- localStorage readings (scalars) ---------------- */
    lsGet: (key) => safe(() => { const v = window.localStorage.getItem(String(key)); return v === null ? null : String(v); }),
    lsHas: (key) => safe(() => window.localStorage.getItem(String(key)) !== null),
    lsCount: () => safe(() => window.localStorage.length),
    lsKeysJoined: () => safe(() => { const out = []; for (let i = 0; i < window.localStorage.length; i += 1) out.push(window.localStorage.key(i)); return out.sort().join(","); }),

    /* ---------------- setup surface (SIDE-EFFECTING; dsl `setup` only) ---------------- */
    goto: (route) => { window.location.hash = "#/" + normRoute(route); return String(window.location.hash); },
    resetMock: () => { const m = mock(); if (m && typeof m.resetDb === "function") m.resetDb(); return !!m; },
    resetWire: () => { const rs = requests(); rs.length = 0; return rs.length; },
    lsClear: () => { window.localStorage.clear(); return window.localStorage.length; },
    lsSet: (key, value) => { window.localStorage.setItem(String(key), String(value)); return String(window.localStorage.getItem(String(key))); },
    login: (email, password) => { const a = actions(); return a && a.login ? a.login(String(email), String(password)) : Promise.resolve(null); },
    logout: () => { const a = actions(); if (a && a.logout) a.logout(); return !!a; },
    pullUser: () => { const a = actions(); if (a && a.pullUser) a.pullUser(); return !!a; },
    setPage: (n) => { const a = actions(); if (a && a.setPage) a.setPage(Number(n)); return num(n); },
    loadArticles: (predicateJson) => { const a = actions(); const pred = predicateJson ? JSON.parse(String(predicateJson)) : {}; if (a && a.loadArticles) a.loadArticles(pred); return JSON.stringify(pred); },
    loadArticle: (slug) => { const a = actions(); if (a && a.loadArticle) a.loadArticle(String(slug)); return String(slug); },
    loadProfile: (username) => { const a = actions(); if (a && a.loadProfile) a.loadProfile(String(username)); return String(username); },
    loadComments: (slug, reload) => { const a = actions(); if (a && a.loadComments) a.loadComments(String(slug), !!reload); return String(slug); },
    makeFavorite: (slug) => { const a = actions(); return a && a.makeFavorite ? a.makeFavorite(String(slug)) : Promise.resolve(null); },
    unmakeFavorite: (slug) => { const a = actions(); return a && a.unmakeFavorite ? a.unmakeFavorite(String(slug)) : Promise.resolve(null); },
    follow: () => { const a = actions(); return a && a.follow ? a.follow() : Promise.resolve(null); },
    unfollow: () => { const a = actions(); return a && a.unfollow ? a.unfollow() : Promise.resolve(null); },
    setToken: (token) => { const a = actions(); if (a && a.setToken) a.setToken(String(token)); return String(token); }
  };
  return w.__RB__;
}

export function rbProbeInstalled() {
  return !!(typeof window !== "undefined" && window.__RB__ && HANDLE);
}
