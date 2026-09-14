// RepairBench offline adaptation — in-package replacement for `fetch(API_ROOT + url)`.
// Same call contract as the upstream agent: it is awaited, it resolves to the API
// envelope ({ articles, articlesCount } / { article } / { user } / { tags } /
// { comments } / { profile }), and failures come back as DATA ({ errors: {...} })
// rather than rejections — matching the upstream `catch` in createAgent.send(), which
// returns the caught value instead of rethrowing. Changing that shape would change
// application behaviour, which the adaptation layer must not do.
//
// Every request is appended to `requestLog` so measurement can assert on the wire
// (query string, method, body, Authorization header) instead of guessing from the DOM.

import { db, resetDb, tagList, SESSION_USER, LOGIN_PASSWORD, FIXED_TIMESTAMP } from "./fixtureDb.js";

export const requestLog = [];

if (typeof window !== "undefined" && !window.__RB_MOCK__) {
  window.__RB_MOCK__ = { requests: requestLog, db, resetDb };
}

function parseQuery(qs) {
  const out = {};
  if (!qs) return out;
  for (const part of qs.split("&")) {
    if (!part) continue;
    const eq = part.indexOf("=");
    const rawK = eq < 0 ? part : part.slice(0, eq);
    const rawV = eq < 0 ? "" : part.slice(eq + 1);
    out[decodeURIComponent(rawK)] = decodeURIComponent(rawV.replace(/\+/g, " "));
  }
  return out;
}

function clone(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function publicUser(user) {
  if (!user) return null;
  return { email: user.email, username: user.username, bio: user.bio || "", image: user.image || "" };
}

function userWithToken(user) {
  const base = publicUser(user) || publicUser(SESSION_USER);
  return Object.assign({}, base, { token: db.token || SESSION_USER.token });
}

function findArticle(slug) {
  for (const a of db.articles) if (a.slug === slug) return a;
  return null;
}

function profileOf(username) {
  let bio = "fixture profile";
  for (const a of db.articles) {
    if (a.author.username === username) { bio = a.author.bio; break; }
  }
  if (username === SESSION_USER.username) bio = SESSION_USER.bio;
  return { username, bio, image: "", following: !!db.follows[username] };
}

function selectArticles(query) {
  let list = db.articles.slice();
  if (query.author) list = list.filter((a) => a.author.username === query.author);
  if (query.tag) list = list.filter((a) => a.tagList.indexOf(query.tag) >= 0);
  if (query.favorited) list = list.filter((a) => a.favorited);
  return list;
}

function pageOf(list, query) {
  const limit = query.limit === undefined ? list.length : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  const safeLimit = Number.isFinite(limit) && limit >= 0 ? limit : list.length;
  const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;
  return list.slice(safeOffset, safeOffset + safeLimit);
}

function route(method, seg, query, body, authed) {
  const head = seg[0];

  if (head === "user" || head === "users") {
    if (method === "get" && head === "user") {
      if (!authed) return { user: null };
      return { user: userWithToken(db.user || SESSION_USER) };
    }
    if (method === "post" && head === "users" && seg[1] === "login") {
      const incoming = (body && body.user) || {};
      if (incoming.email === SESSION_USER.email && incoming.password === LOGIN_PASSWORD) {
        db.token = SESSION_USER.token;
        db.user = publicUser(SESSION_USER);
        return { user: userWithToken(db.user) };
      }
      return { errors: { "email or password": ["is invalid"] } };
    }
    if (method === "post" && head === "users") {
      const incoming = (body && body.user) || {};
      const errors = {};
      if (!incoming.username) errors.username = ["can't be blank"];
      if (!incoming.email) errors.email = ["can't be blank"];
      if (!incoming.password) errors.password = ["can't be blank"];
      if (Object.keys(errors).length) return { errors };
      db.token = SESSION_USER.token;
      db.user = { email: incoming.email, username: incoming.username, bio: incoming.bio || "", image: incoming.image || "" };
      return { user: userWithToken(db.user) };
    }
    if (method === "put" && head === "user") {
      const incoming = (body && body.user) || {};
      db.user = Object.assign({}, publicUser(SESSION_USER), db.user || {}, incoming);
      return { user: userWithToken(db.user) };
    }
    return { errors: { route: ["fixture mock has no handler for " + method + " /" + seg.join("/")] } };
  }

  if (head === "tags" && method === "get") return { tags: tagList() };

  if (head === "profiles") {
    const username = decodeURIComponent(seg[1] || "");
    if (method === "get" && seg.length === 2) return { profile: profileOf(username) };
    if (seg[2] === "follow") {
      if (method === "post") { db.follows[username] = true; return { profile: profileOf(username) }; }
      if (method === "delete") { db.follows[username] = false; return { profile: profileOf(username) }; }
    }
    return { errors: { route: ["fixture mock has no handler for " + method + " /" + seg.join("/")] } };
  }

  if (head === "articles") {
    if (seg.length === 1) {
      if (method === "get") {
        const list = selectArticles(query);
        return { articles: clone(pageOf(list, query)), articlesCount: list.length };
      }
      if (method === "post") {
        const incoming = (body && body.article) || {};
        const errors = {};
        if (!incoming.title) errors.title = ["can't be blank"];
        if (!incoming.description) errors.description = ["can't be blank"];
        if (!incoming.body) errors.body = ["can't be blank"];
        if (Object.keys(errors).length) return { errors };
        const n = String(db.nextArticleNo).padStart(2, "0");
        db.nextArticleNo += 1;
        const author = db.user ? publicUser(db.user) : publicUser(SESSION_USER);
        const created = {
          slug: "rb-created-" + n,
          title: incoming.title,
          description: incoming.description,
          body: incoming.body,
          tagList: Array.isArray(incoming.tagList) ? incoming.tagList.slice() : [],
          createdAt: FIXED_TIMESTAMP,
          updatedAt: FIXED_TIMESTAMP,
          favorited: false,
          favoritesCount: 0,
          author: { username: author.username, bio: author.bio, image: author.image, following: false }
        };
        db.articles.unshift(created);
        return { article: clone(created) };
      }
      return { errors: { route: ["fixture mock has no handler for " + method + " /" + seg.join("/")] } };
    }

    if (seg[1] === "feed" && method === "get") {
      const list = db.articles.filter((a) => a.author.username !== SESSION_USER.username);
      return { articles: clone(pageOf(list, query)), articlesCount: list.length };
    }

    const slug = decodeURIComponent(seg[1] || "");

    if (seg.length === 2) {
      if (method === "get") {
        const article = findArticle(slug);
        if (!article) return { errors: { slug: ["not found"] } };
        return { article: clone(article) };
      }
      if (method === "put") {
        const article = findArticle(slug);
        if (!article) return { errors: { slug: ["not found"] } };
        const incoming = (body && body.article) || {};
        for (const key of ["title", "description", "body"]) {
          if (typeof incoming[key] === "string") article[key] = incoming[key];
        }
        if (Array.isArray(incoming.tagList)) article.tagList = incoming.tagList.slice();
        article.updatedAt = FIXED_TIMESTAMP;
        return { article: clone(article) };
      }
      if (method === "delete") {
        const idx = db.articles.findIndex((a) => a.slug === slug);
        if (idx >= 0) db.articles.splice(idx, 1);
        return {};
      }
    }

    if (seg[2] === "favorite") {
      const article = findArticle(slug);
      if (!article) return { errors: { slug: ["not found"] } };
      if (method === "post" && !article.favorited) {
        article.favorited = true;
        article.favoritesCount += 1;
      } else if (method === "delete" && article.favorited) {
        article.favorited = false;
        article.favoritesCount -= 1;
      }
      return { article: clone(article) };
    }

    if (seg[2] === "comments") {
      if (!db.comments[slug]) db.comments[slug] = [];
      const list = db.comments[slug];
      if (method === "get" && seg.length === 3) return { comments: clone(list) };
      if (method === "post" && seg.length === 3) {
        const incoming = (body && body.comment) || {};
        if (!incoming.body) return { errors: { body: ["can't be blank"] } };
        const author = db.user ? publicUser(db.user) : publicUser(SESSION_USER);
        const created = {
          id: db.nextCommentId,
          createdAt: FIXED_TIMESTAMP,
          updatedAt: FIXED_TIMESTAMP,
          body: incoming.body,
          author: { username: author.username, bio: author.bio, image: author.image, following: false }
        };
        db.nextCommentId += 1;
        list.unshift(created);
        return { comment: clone(created) };
      }
      if (method === "delete" && seg.length === 4) {
        const id = Number(seg[3]);
        const idx = list.findIndex((c) => c.id === id);
        if (idx >= 0) list.splice(idx, 1);
        return {};
      }
    }
  }

  return { errors: { route: ["fixture mock has no handler for " + method + " /" + seg.join("/")] } };
}

// Resolves on a microtask, like `await fetch(...).then(r => r.json())` did, so the
// ordering the stores were written against (queueMicrotask / createResource) is kept.
export function mockSend(method, url, data, headers) {
  const full = String(url);
  const qIndex = full.indexOf("?");
  const rawPath = qIndex < 0 ? full : full.slice(0, qIndex);
  const query = parseQuery(qIndex < 0 ? "" : full.slice(qIndex + 1));
  const normalizedMethod = String(method).toLowerCase();
  const auth = (headers && (headers.Authorization || headers.authorization)) || null;
  // 🔴 The session flag is an ARGUMENT, never a query key: `get /user` carries no query
  //    string of its own, and smuggling `__auth` through `query` both polluted the wire
  //    log (instrumentation reads it) and was deleted before routing (so the session was
  //    invisible). Both were caught by probe_mock.mjs before this file went into a patch.
  const authed = !!auth;

  requestLog.push({
    seq: requestLog.length,
    method: normalizedMethod,
    url: full,
    path: rawPath,
    query: Object.assign({}, query),
    limit: query.limit === undefined ? null : Number(query.limit),
    offset: query.offset === undefined ? null : Number(query.offset),
    body: clone(data),
    auth
  });

  const seg = rawPath.split("/").filter(Boolean);
  return Promise.resolve(route(normalizedMethod, seg, query, clone(data), authed));
}
