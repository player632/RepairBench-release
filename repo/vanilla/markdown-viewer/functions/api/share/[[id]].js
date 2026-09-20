const SHARE_TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_CONTENT_CHARS = 8000000;
const SHARE_ID_LENGTH = 10;
const SHARE_DELETE_TOKEN_BYTES = 18;
const SHARE_ID_PATTERN = /^[a-z2-9]{6,20}$/;
const SHARE_ID_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const ALLOWED_ORIGINS = new Set([
  "https://markdownviewer.pages.dev",
  "null"
]);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;

  if (/^https:\/\/[a-z0-9-]+\.markdownviewer\.pages\.dev$/i.test(origin)) {
    return true;
  }

  return /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin);
}

function applyCorsHeaders(headers, request) {
  const origin = request.headers.get("Origin") || "";
  headers.set("Vary", "Origin");
  if (isAllowedOrigin(origin) && origin) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
}

function applySecurityHeaders(headers) {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "accelerometer=(), autoplay=(), browsing-topics=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), publickey-credentials-get=(), usb=(), xr-spatial-tracking=()");
  headers.set("Cross-Origin-Resource-Policy", "same-site");
}

function jsonResponse(body, init, request) {
  const headers = new Headers(init && init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  applySecurityHeaders(headers);
  if (request) applyCorsHeaders(headers, request);

  return new Response(JSON.stringify(body), {
    status: init && init.status ? init.status : 200,
    headers
  });
}

function emptyResponse(init, request) {
  const headers = new Headers(init && init.headers);
  headers.set("Cache-Control", "no-store");
  applySecurityHeaders(headers);
  if (request) applyCorsHeaders(headers, request);

  return new Response(null, {
    status: init && init.status ? init.status : 204,
    headers
  });
}

function getShareId(params) {
  const raw = params && params.id;
  if (Array.isArray(raw)) return raw.join("/");
  return typeof raw === "string" ? raw : "";
}

function generateShareId(length = SHARE_ID_LENGTH) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let id = "";
  for (let i = 0; i < bytes.length; i += 1) {
    id += SHARE_ID_ALPHABET[bytes[i] % SHARE_ID_ALPHABET.length];
  }
  return id;
}

function generateShareDeleteToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(SHARE_DELETE_TOKEN_BYTES));
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hashDeleteToken(token) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(token || "")));
  let binary = "";
  const bytes = new Uint8Array(digest);
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createUniqueShareId(kv) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = generateShareId();
    const existing = await kv.get(id);
    if (!existing) return id;
  }
  throw new Error("Unable to allocate share id");
}

function sanitizeMode(mode) {
  return mode === "edit" ? "edit" : "view";
}

function sanitizeTitle(title) {
  return String(title || "").trim().replace(/\s+/g, " ").slice(0, 120);
}

export async function onRequest({ request, env, params }) {
  if (!isAllowedOrigin(request.headers.get("Origin") || "")) {
    return jsonResponse({ error: "origin not allowed" }, { status: 403 }, request);
  }

  if (request.method === "OPTIONS") {
    return emptyResponse({ status: 204 }, request);
  }

  if (!env || !env.SHARE_KV) {
    return jsonResponse({ error: "SHARE_KV binding is not configured" }, { status: 503 }, request);
  }

  const id = getShareId(params);

  if (request.method === "POST" && !id) {
    let body;
    try {
      body = await request.json();
    } catch (_) {
      return jsonResponse({ error: "invalid json" }, { status: 400 }, request);
    }

    const content = body && body.content;
    if (typeof content !== "string" || content.length === 0) {
      return jsonResponse({ error: "content required" }, { status: 400 }, request);
    }
    if (content.length > MAX_CONTENT_CHARS) {
      return jsonResponse({ error: "content too large" }, { status: 413 }, request);
    }

    const shareId = await createUniqueShareId(env.SHARE_KV);
    const deleteToken = generateShareDeleteToken();
    const record = {
      content,
      mode: sanitizeMode(body.mode),
      title: sanitizeTitle(body.title),
      createdAt: Date.now(),
      size: content.length,
      deleteTokenHash: await hashDeleteToken(deleteToken)
    };

    await env.SHARE_KV.put(shareId, JSON.stringify(record), {
      expirationTtl: SHARE_TTL_SECONDS
    });

    return jsonResponse({
      id: shareId,
      deleteToken,
      expiresIn: SHARE_TTL_SECONDS
    }, { status: 201 }, request);
  }

  if (request.method === "DELETE" && id) {
    if (!SHARE_ID_PATTERN.test(id)) {
      return jsonResponse({ error: "invalid id" }, { status: 400 }, request);
    }

    let body;
    try {
      body = await request.json();
    } catch (_) {
      return jsonResponse({ error: "invalid json" }, { status: 400 }, request);
    }

    const providedToken = body && typeof body.deleteToken === "string" ? body.deleteToken : "";
    if (!providedToken || providedToken.length > 128) {
      return jsonResponse({ error: "delete token required" }, { status: 400 }, request);
    }

    const raw = await env.SHARE_KV.get(id);
    if (!raw) {
      return jsonResponse({ error: "not found" }, { status: 404 }, request);
    }

    let record;
    try {
      record = JSON.parse(raw);
    } catch (_) {
      return jsonResponse({ error: "invalid record" }, { status: 500 }, request);
    }

    if (!record.deleteTokenHash || record.deleteTokenHash !== await hashDeleteToken(providedToken)) {
      return jsonResponse({ error: "not found" }, { status: 404 }, request);
    }

    await env.SHARE_KV.delete(id);
    return jsonResponse({ deleted: true }, {}, request);
  }

  if (request.method === "GET" && id) {
    if (!SHARE_ID_PATTERN.test(id)) {
      return jsonResponse({ error: "invalid id" }, { status: 400 }, request);
    }

    const raw = await env.SHARE_KV.get(id);
    if (!raw) {
      return jsonResponse({ error: "not found" }, { status: 404 }, request);
    }

    let record;
    try {
      record = JSON.parse(raw);
    } catch (_) {
      return jsonResponse({ error: "invalid record" }, { status: 500 }, request);
    }

    return jsonResponse({
      content: record.content || "",
      mode: sanitizeMode(record.mode),
      title: sanitizeTitle(record.title),
      createdAt: record.createdAt || null,
      size: record.size || (record.content ? record.content.length : 0)
    }, {}, request);
  }

  return jsonResponse({ error: "not found" }, { status: 404 }, request);
}
