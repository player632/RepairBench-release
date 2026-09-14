import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { MockDb } from '../mock/fixture-db';
import { JwtService } from '../auth/services/jwt.service';

/**
 * Offline fixture mock (adaptation A1). Replaces apiInterceptor at the head of
 * the interceptor chain: the service layer keeps its relative URLs and the
 * token/error interceptors stay untouched, but requests are short-circuited
 * here with deterministic synchronous responses (of(new HttpResponse(...))).
 *
 * Error responses mirror the normalized shape produced by errorInterceptor
 * ({ errors: {...}, status }) so components and the auth state machine see
 * exactly the same contract as before the adaptation.
 */

function fail(status: number, errors: Record<string, string[]>) {
  return throwError(() => ({ errors, status }));
}

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  const db = MockDb.instance;
  const token = inject(JwtService).getToken();
  const viewer = db.userByToken(token);
  const url = req.url;
  const method = req.method;

  const parts = url.split('/').filter(Boolean);

  // ---- auth endpoints -------------------------------------------------
  if (url === '/users/login' && method === 'POST') {
    const body = req.body as { user?: { email?: string; password?: string } };
    const found = body.user ? db.userByEmail(String(body.user.email || '')) : null;
    if (found && found.password === String(body.user!.password || '')) {
      return of(new HttpResponse({ status: 200, body: { user: db.serializeUser(found) } }));
    }
    return fail(422, { 'email or password': ['is invalid'] });
  }

  if (url === '/users' && method === 'POST') {
    const body = req.body as { user?: { username?: string; email?: string; password?: string } };
    const username = String(body.user?.username || '');
    const email = String(body.user?.email || '');
    const errors: Record<string, string[]> = {};
    if (db.userByUsername(username)) errors['username'] = ['has already been taken'];
    if (db.userByEmail(email)) errors['email'] = ['has already been taken'];
    if (Object.keys(errors).length > 0) return fail(422, errors);
    db.users.push({
      username,
      email,
      password: String(body.user?.password || ''),
      token: 'mock-token-' + username,
      bio: null,
      image: null,
      follows: [],
      favorites: [],
    });
    return of(new HttpResponse({ status: 200, body: { user: db.serializeUser(db.userByUsername(username)!) } }));
  }

  if (url === '/user' && method === 'GET') {
    if (token === 'mock-token-flaky') {
      if (!db.flakyServedOnce) {
        db.flakyServedOnce = true;
        return fail(503, { service: ['is unavailable'] });
      }
      const flakyUser = db.userByUsername('wlb-user')!;
      return of(new HttpResponse({ status: 200, body: { user: db.serializeUser(flakyUser) } }));
    }
    if (!viewer) return fail(401, { user: ['is unauthorized'] });
    return of(new HttpResponse({ status: 200, body: { user: db.serializeUser(viewer) } }));
  }

  if (url === '/user' && method === 'PUT') {
    if (!viewer) return fail(401, { user: ['is unauthorized'] });
    const body = req.body as { user?: Record<string, unknown> };
    const payload = body.user || {};
    const nextUsername = payload["username"] ? String(payload["username"]) : viewer.username;
    const existing = db.userByUsername(nextUsername);
    if (existing && existing.username !== viewer.username) {
      return fail(422, { username: ['has already been taken'] });
    }
    const nextEmail = payload["email"] ? String(payload["email"]) : viewer.email;
    const emailOwner = db.userByEmail(nextEmail);
    if (emailOwner && emailOwner.username !== viewer.username) {
      return fail(422, { email: ['has already been taken'] });
    }
    viewer.username = nextUsername;
    viewer.email = nextEmail;
    if (payload["bio"] !== undefined) viewer.bio = payload["bio"] === null || payload["bio"] === '' ? null : String(payload["bio"]);
    if (payload["image"] !== undefined) viewer.image = payload["image"] === null || payload["image"] === '' ? null : String(payload["image"]);
    if (payload["password"]) viewer.password = String(payload["password"]);
    return of(new HttpResponse({ status: 200, body: { user: db.serializeUser(viewer) } }));
  }

  // ---- tags ------------------------------------------------------------
  if (url === '/tags' && method === 'GET') {
    return of(new HttpResponse({ status: 200, body: { tags: [...db.tags] } }));
  }

  // ---- articles ---------------------------------------------------------
  if (url === '/articles' && method === 'GET') {
    const filters = {
      tag: req.params.get('tag') || undefined,
      author: req.params.get('author') || undefined,
      favorited: req.params.get('favorited') || undefined,
    };
    const all = db.queryArticles(filters, viewer);
    const limit = Number(req.params.get('limit') || 20);
    const offset = Number(req.params.get('offset') || 0);
    return of(
      new HttpResponse({
        status: 200,
        body: { articles: all.slice(offset, offset + limit), articlesCount: all.length },
      }),
    );
  }

  if (url === '/articles/feed' && method === 'GET') {
    const all = db.feedArticles(viewer);
    const limit = Number(req.params.get('limit') || 20);
    const offset = Number(req.params.get('offset') || 0);
    return of(
      new HttpResponse({
        status: 200,
        body: { articles: all.slice(offset, offset + limit), articlesCount: all.length },
      }),
    );
  }

  if (url === '/articles' && method === 'POST') {
    if (!viewer) return fail(401, { user: ['is unauthorized'] });
    const body = req.body as { article?: Record<string, unknown> };
    const payload = body.article || {};
    const slug = db.nextSlug(String(payload["title"] || ''));
    db.articles.unshift({
      slug,
      title: String(payload["title"] || ''),
      description: String(payload["description"] || ''),
      body: String(payload["body"] || ''),
      tagList: Array.isArray(payload["tagList"]) ? (payload["tagList"] as string[]) : [],
      createdAt: db.fixedNow(),
      updatedAt: db.fixedNow(),
      authorUsername: viewer.username,
      favoritesCount: 0,
    });
    return of(new HttpResponse({ status: 200, body: { article: db.serializeArticle(db.articleBySlug(slug)!, viewer) } }));
  }

  if (parts[0] === 'articles' && parts.length >= 2) {
    const slug = parts[1];

    if (parts.length === 2 && method === 'GET') {
      const record = db.articleBySlug(slug);
      if (!record) return fail(404, { article: ['was not found'] });
      return of(new HttpResponse({ status: 200, body: { article: db.serializeArticle(record, viewer) } }));
    }

    if (parts.length === 2 && method === 'PUT') {
      const record = db.articleBySlug(slug);
      if (!record) return fail(404, { article: ['was not found'] });
      const body = req.body as { article?: Record<string, unknown> };
      const payload = body.article || {};
      if (payload["title"] !== undefined) record.title = String(payload["title"]);
      if (payload["description"] !== undefined) record.description = String(payload["description"]);
      if (payload["body"] !== undefined) record.body = String(payload["body"]);
      if (payload["tagList"] !== undefined && Array.isArray(payload["tagList"])) record.tagList = payload["tagList"] as string[];
      record.updatedAt = db.fixedNow();
      return of(new HttpResponse({ status: 200, body: { article: db.serializeArticle(record, viewer) } }));
    }

    if (parts.length === 2 && method === 'DELETE') {
      const index = db.articles.findIndex(a => a.slug === slug);
      if (index < 0) return fail(404, { article: ['was not found'] });
      db.articles.splice(index, 1);
      return of(new HttpResponse({ status: 200, body: null }));
    }

    if (parts.length === 3 && parts[2] === 'favorite') {
      if (!viewer) return fail(401, { user: ['is unauthorized'] });
      const record = db.articleBySlug(slug);
      if (!record) return fail(404, { article: ['was not found'] });
      if (method === 'POST') {
        if (!viewer.favorites.includes(slug)) {
          viewer.favorites.push(slug);
          record.favoritesCount += 1;
        }
        return of(new HttpResponse({ status: 200, body: { article: db.serializeArticle(record, viewer) } }));
      }
      if (method === 'DELETE') {
        const idx = viewer.favorites.indexOf(slug);
        if (idx >= 0) {
          viewer.favorites.splice(idx, 1);
          record.favoritesCount = Math.max(0, record.favoritesCount - 1);
        }
        return of(new HttpResponse({ status: 200, body: null }));
      }
    }

    if (parts.length === 3 && parts[2] === 'comments') {
      if (method === 'GET') {
        const list = db.comments
          .filter(c => c.articleSlug === slug)
          .map(c => db.serializeComment(c, viewer));
        return of(new HttpResponse({ status: 200, body: { comments: list } }));
      }
      if (method === 'POST') {
        if (!viewer) return fail(401, { user: ['is unauthorized'] });
        const body = req.body as { comment?: { body?: string } };
        const record = db.addComment(slug, String(body.comment?.body || ''), viewer.username);
        return of(new HttpResponse({ status: 200, body: { comment: db.serializeComment(record, viewer) } }));
      }
    }

    if (parts.length === 4 && parts[2] === 'comments' && method === 'DELETE') {
      const commentId = parts[3];
      const index = db.comments.findIndex(c => c.articleSlug === slug && c.id === commentId);
      if (index < 0) return fail(404, { comment: ['was not found'] });
      db.comments.splice(index, 1);
      return of(new HttpResponse({ status: 200, body: null }));
    }
  }

  // ---- profiles ----------------------------------------------------------
  if (parts[0] === 'profiles' && parts.length >= 2) {
    const username = parts[1];

    if (parts.length === 2 && method === 'GET') {
      const profile = db.profile(username, viewer);
      if (!profile) return fail(404, { profile: ['was not found'] });
      return of(new HttpResponse({ status: 200, body: { profile } }));
    }

    if (parts.length === 3 && parts[2] === 'follow') {
      if (!viewer) return fail(401, { user: ['is unauthorized'] });
      const profile = db.profile(username, viewer);
      if (!profile) return fail(404, { profile: ['was not found'] });
      if (method === 'POST') {
        if (!viewer.follows.includes(username)) viewer.follows.push(username);
      } else if (method === 'DELETE') {
        const idx = viewer.follows.indexOf(username);
        if (idx >= 0) viewer.follows.splice(idx, 1);
      }
      return of(new HttpResponse({ status: 200, body: { profile: db.profile(username, viewer) } }));
    }
  }

  return fail(404, { endpoint: ['was not found'] });
};
