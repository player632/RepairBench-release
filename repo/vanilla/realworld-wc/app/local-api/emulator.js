// In-browser emulator for the RealWorld API subset used by this app.
// Contract parity with the original Http wrapper:
//   - handle() resolves a Response-like object {status, json()} ;
//   - auth is validated from the Authorization header ('Token ' + token),
//     exactly as the wrapper sends it;
//   - protected endpoints answer 401 {errors:{authorization:['is required']}}
//     when the token is missing or unknown.
// The emulator is defect-neutral: all injected defects live in original files.

import { store } from "./store";
import { nextSeq, timestampFor } from "./clock";

function slugify(title) {
    return String(title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function respond(status, body) {
    return {
        status: status,
        json: function () {
            return Promise.resolve(body);
        }
    };
}

const UNAUTHORIZED = { errors: { authorization: ["is required"] } };

function parsePath(rawPath) {
    let pathText = String(rawPath || "");
    if (pathText.charAt(0) === "/") {
        pathText = pathText.substring(1);
    }
    const query = {};
    const qIndex = pathText.indexOf("?");
    if (qIndex !== -1) {
        const queryText = pathText.substring(qIndex + 1);
        pathText = pathText.substring(0, qIndex);
        queryText.split("&").forEach(pair => {
            if (!pair) return;
            const eq = pair.indexOf("=");
            const key = eq === -1 ? pair : pair.substring(0, eq);
            const value = eq === -1 ? "" : decodeURIComponent(pair.substring(eq + 1));
            query[key] = value;
        });
    }
    return {
        segments: pathText.split("/").filter(s => s.length > 0),
        query: query
    };
}

function userByToken(headers) {
    const header = headers && headers["Authorization"] ? String(headers["Authorization"]) : "";
    if (header.indexOf("Token ") !== 0) {
        return null;
    }
    const token = header.substring(6);
    return store.db.users.find(u => u.token === token) || null;
}

function findUser(username) {
    return store.db.users.find(u => u.username === username) || null;
}

function profilePayload(user, viewer) {
    return {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following: viewer ? viewer.following.indexOf(user.username) !== -1 : false
    };
}

function userPayload(user) {
    return {
        email: user.email,
        token: user.token,
        username: user.username,
        bio: user.bio,
        image: user.image
    };
}

function articlePayload(article, viewer) {
    const author = findUser(article.authorUsername);
    return {
        slug: article.slug,
        title: article.title,
        description: article.description,
        body: article.body,
        tagList: article.tagList.slice(),
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        favorited: viewer ? viewer.favorites.indexOf(article.slug) !== -1 : false,
        favoritesCount: article.favoritesCount,
        author: profilePayload(author, viewer)
    };
}

function commentPayload(comment, viewer) {
    const author = findUser(comment.authorUsername);
    return {
        id: comment.id,
        createdAt: comment.createdAt,
        updatedAt: comment.createdAt,
        body: comment.body,
        author: profilePayload(author, viewer)
    };
}

function queryArticles(query, viewer, extraFilter) {
    let list = store.db.articles.filter(a => !extraFilter || extraFilter(a));
    list.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const articlesCount = list.length;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const offset = query.offset ? parseInt(query.offset, 10) : 0;
    list = list.slice(offset, offset + limit);
    return {
        articles: list.map(a => articlePayload(a, viewer)),
        articlesCount: articlesCount
    };
}

function handle(method, rawPath, rawBody, headers) {
    const parsed = parsePath(rawPath);
    const seg = parsed.segments;
    const query = parsed.query;
    const viewer = userByToken(headers);

    let parsedBody = null;
    if (rawBody) {
        try {
            parsedBody = JSON.parse(rawBody);
        } catch (e) {
            parsedBody = null;
        }
    }

    // ---------------- articles ----------------
    if (seg[0] === "articles") {
        // GET /articles/feed (authenticated)
        if (seg.length === 2 && seg[1] === "feed" && method === "GET") {
            if (!viewer) return Promise.resolve(respond(401, UNAUTHORIZED));
            const followed = viewer.following;
            return Promise.resolve(respond(200, queryArticles(query, viewer,
                a => followed.indexOf(a.authorUsername) !== -1)));
        }

        // GET /articles?limit&offset[&tag][&author][&favorited] (public)
        if (seg.length === 1 && method === "GET") {
            let filter = null;
            if (query.tag) {
                filter = a => a.tagList.indexOf(query.tag) !== -1;
            } else if (query.author) {
                filter = a => a.authorUsername === query.author;
            } else if (query.favorited) {
                const favoriter = findUser(query.favorited);
                const favoritedSlugs = favoriter ? favoriter.favorites : [];
                filter = a => favoritedSlugs.indexOf(a.slug) !== -1;
            }
            return Promise.resolve(respond(200, queryArticles(query, viewer, filter)));
        }

        // POST /articles (authenticated)
        if (seg.length === 1 && method === "POST") {
            if (!viewer) return Promise.resolve(respond(401, UNAUTHORIZED));
            const data = (parsedBody && parsedBody.article) || {};
            const seq = nextSeq();
            const now = timestampFor(seq);
            const article = {
                slug: slugify(data.title) + "-wlb" + seq,
                title: data.title,
                description: data.description,
                body: data.body,
                authorUsername: viewer.username,
                tagList: data.tagList || [],
                createdAt: now,
                updatedAt: now,
                favoritesCount: 0
            };
            store.db.articles.unshift(article);
            store.persist();
            return Promise.resolve(respond(200, { article: articlePayload(article, viewer) }));
        }

        const slug = seg[1];
        const article = store.db.articles.find(a => a.slug === slug);

        // GET/PUT /articles/:slug
        if (seg.length === 2) {
            if (method === "GET") {
                if (!article) return Promise.resolve(respond(404, { errors: { article: ["not found"] } }));
                return Promise.resolve(respond(200, { article: articlePayload(article, viewer) }));
            }
            if (method === "PUT") {
                if (!viewer) return Promise.resolve(respond(401, UNAUTHORIZED));
                if (!article || article.authorUsername !== viewer.username) {
                    return Promise.resolve(respond(403, { errors: { article: ["forbidden"] } }));
                }
                const data = (parsedBody && parsedBody.article) || {};
                if (data.title !== undefined) article.title = data.title;
                if (data.description !== undefined) article.description = data.description;
                if (data.body !== undefined) article.body = data.body;
                if (data.tagList !== undefined) article.tagList = data.tagList;
                article.updatedAt = timestampFor(nextSeq());
                store.persist();
                return Promise.resolve(respond(200, { article: articlePayload(article, viewer) }));
            }
        }

        // POST/DELETE /articles/:slug/favorite (authenticated)
        if (seg.length === 3 && seg[2] === "favorite") {
            if (!viewer) return Promise.resolve(respond(401, UNAUTHORIZED));
            if (!article) return Promise.resolve(respond(404, { errors: { article: ["not found"] } }));
            const idx = viewer.favorites.indexOf(slug);
            if (method === "POST") {
                if (idx === -1) {
                    viewer.favorites.push(slug);
                    article.favoritesCount += 1;
                }
            } else if (method === "DELETE") {
                if (idx !== -1) {
                    viewer.favorites.splice(idx, 1);
                    article.favoritesCount -= 1;
                }
            }
            store.persist();
            return Promise.resolve(respond(200, { article: articlePayload(article, viewer) }));
        }

        // GET/POST /articles/:slug/comments
        if (seg.length === 3 && seg[2] === "comments") {
            if (method === "GET") {
                const comments = store.db.comments
                    .filter(c => c.articleSlug === slug)
                    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
                    .map(c => commentPayload(c, viewer));
                return Promise.resolve(respond(200, { comments: comments }));
            }
            if (method === "POST") {
                if (!viewer) return Promise.resolve(respond(401, UNAUTHORIZED));
                const data = (parsedBody && parsedBody.comment) || {};
                const seq = nextSeq();
                const comment = {
                    id: 1000 + seq,
                    articleSlug: slug,
                    body: data.body,
                    authorUsername: viewer.username,
                    createdAt: timestampFor(seq)
                };
                store.db.comments.push(comment);
                store.persist();
                return Promise.resolve(respond(200, { comment: commentPayload(comment, viewer) }));
            }
        }
    }

    // ---------------- tags ----------------
    if (seg.length === 1 && seg[0] === "tags" && method === "GET") {
        const tagSet = {};
        store.db.articles.forEach(a => {
            a.tagList.forEach(t => {
                tagSet[t] = true;
            });
        });
        return Promise.resolve(respond(200, { tags: Object.keys(tagSet).sort() }));
    }

    // ---------------- users ----------------
    if (seg.length === 1 && seg[0] === "users" && method === "POST") {
        const data = (parsedBody && parsedBody.user) || {};
        const errors = {};
        if (store.db.users.some(u => u.username === data.username)) {
            errors.username = ["has already been taken"];
        }
        if (store.db.users.some(u => u.email === data.email)) {
            errors.email = ["has already been taken"];
        }
        if (Object.keys(errors).length > 0) {
            return Promise.resolve(respond(422, { errors: errors }));
        }
        const user = {
            username: data.username,
            email: data.email,
            password: data.password,
            token: "wlb-token-" + data.username,
            bio: "",
            image: "",
            following: [],
            favorites: []
        };
        store.db.users.push(user);
        store.persist();
        return Promise.resolve(respond(200, { user: userPayload(user) }));
    }

    if (seg.length === 2 && seg[0] === "users" && seg[1] === "login" && method === "POST") {
        const data = (parsedBody && parsedBody.user) || {};
        const user = store.db.users.find(u => u.email === data.email && u.password === data.password);
        if (!user) {
            return Promise.resolve(respond(401, { errors: { "email or password": ["is invalid"] } }));
        }
        return Promise.resolve(respond(200, { user: userPayload(user) }));
    }

    // ---------------- current user ----------------
    if (seg.length === 1 && seg[0] === "user") {
        if (!viewer) return Promise.resolve(respond(401, UNAUTHORIZED));
        if (method === "GET") {
            return Promise.resolve(respond(200, { user: userPayload(viewer) }));
        }
        if (method === "PUT") {
            const data = (parsedBody && parsedBody.user) || {};
            if (data.email !== undefined) viewer.email = data.email;
            if (data.username !== undefined) viewer.username = data.username;
            if (data.bio !== undefined) viewer.bio = data.bio;
            if (data.image !== undefined) viewer.image = data.image;
            if (data.password) viewer.password = data.password;
            store.persist();
            return Promise.resolve(respond(200, { user: userPayload(viewer) }));
        }
    }

    // ---------------- profiles ----------------
    if (seg.length === 2 && seg[0] === "profiles" && method === "GET") {
        const user = findUser(seg[1]);
        if (!user) return Promise.resolve(respond(404, { errors: { profile: ["not found"] } }));
        return Promise.resolve(respond(200, { profile: profilePayload(user, viewer) }));
    }

    if (seg.length === 3 && seg[0] === "profiles" && seg[2] === "follow") {
        if (!viewer) return Promise.resolve(respond(401, UNAUTHORIZED));
        const user = findUser(seg[1]);
        if (!user) return Promise.resolve(respond(404, { errors: { profile: ["not found"] } }));
        const idx = viewer.following.indexOf(user.username);
        if (method === "POST") {
            if (idx === -1) viewer.following.push(user.username);
        } else if (method === "DELETE") {
            if (idx !== -1) viewer.following.splice(idx, 1);
        }
        store.persist();
        return Promise.resolve(respond(200, { profile: profilePayload(user, viewer) }));
    }

    return Promise.resolve(respond(404, { errors: { route: ["not found"] } }));
}

export const LocalApi = {
    handle: handle
};
