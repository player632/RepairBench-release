#!/usr/bin/env node
// tests/mock_api.mjs - offline mock backend for repair-angular__angular-example-app-01.
// Serves the nestjs-example-app + pokeapi surface on 127.0.0.1 with deterministic
// fixtures. Login/register reset the world state. Tokens are typed: access tokens
// start with MOCK_ACCESS., refresh tokens with MOCK_REFRESH.; presenting the wrong
// type yields 401 + internalCode per the app interceptor semantics.
// Usage: node mock_api.mjs --port 8931
import http from "node:http";

const args = {};
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i] === "--port") args.port = process.argv[i + 1];
}
const PORT = Number(args.port || 8931);

// ---------------------------------------------------------------- fixtures
const POKEMON_BY_KEY = {};
function definePokemon(id, name, order, height, weight) {
  const mon = {
    id,
    name,
    order,
    height,
    weight,
    base_experience: 60 + id,
    sprites: {
      front_default: "http://127.0.0.1:" + PORT + "/assets/sprites/" + id + ".png",
      front_shiny: "http://127.0.0.1:" + PORT + "/assets/sprites/" + id + "-shiny.png",
    },
  };
  POKEMON_BY_KEY[String(id)] = mon;
  POKEMON_BY_KEY[name] = mon;
}
definePokemon(1, "bulbasaur", 1, 7, 69);
definePokemon(4, "charmander", 5, 6, 85);
definePokemon(7, "squirtle", 10, 5, 90);
definePokemon(25, "pikachu", 35, 4, 60);

const TRAINER_CREDENTIALS = { email: "trainer@example.com", password: "Pikachu1!" };
const ACCESS_PREFIX = "MOCK_ACCESS.";
const REFRESH_PREFIX = "MOCK_REFRESH.";

let world = null;
let tokenCounter = 0;

function freshWorld(userOverrides) {
  const now = new Date().toISOString();
  return {
    user: Object.assign(
      {
        id: "user-trainer-1",
        createdAt: now,
        updatedAt: now,
        email: TRAINER_CREDENTIALS.email,
        name: "Ash",
        language: "en-US",
        favouritePokemonId: 25,
        caughtPokemonIds: [1, 4, 7],
      },
      userOverrides || {},
    ),
    accessTokens: new Set(),
    refreshTokens: new Set(),
    retiredAccessTokens: new Set(),
    retiredRefreshTokens: new Set(),
  };
}

function issueTokens() {
  tokenCounter += 1;
  const accessToken = ACCESS_PREFIX + String(tokenCounter);
  const refreshToken = REFRESH_PREFIX + String(tokenCounter);
  world.accessTokens.add(accessToken);
  world.refreshTokens.add(refreshToken);
  return { accessToken, refreshToken };
}

function resetWorld(userOverrides) {
  world = freshWorld(userOverrides);
  return issueTokens();
}
resetWorld();

// ---------------------------------------------------------------- helpers
function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
  });
  res.end(payload);
}

function bearerToken(req) {
  const header = req.headers["authorization"] || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

// Returns null when the token is a valid session access token, otherwise the
// 401 body required by the authentication interceptor.
function accessGate(req) {
  const token = bearerToken(req);
  if (!token) return { internalCode: 3000, message: "Access token not found" };
  if (world.accessTokens.has(token)) return null;
  if (token.startsWith(REFRESH_PREFIX)) {
    return { internalCode: 3000, message: "Access token not found" };
  }
  if (world.retiredAccessTokens.has(token)) {
    return { internalCode: 3002, message: "Access token expired" };
  }
  return { internalCode: 3000, message: "Access token not found" };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error("body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

import zlib from "node:zlib";

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i += 1) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

// 16x16 solid gray PNG, generated at runtime (no binary fixture files).
function makePng16() {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(16, 0);
  ihdr.writeUInt32BE(16, 4);
  ihdr[8] = 8;
  ihdr[9] = 0;
  const rows = [];
  for (let y = 0; y < 16; y += 1) {
    const row = Buffer.alloc(1 + 16);
    row.fill(0x88, 1);
    rows.push(row);
  }
  const idat = zlib.deflateSync(Buffer.concat(rows));
  return Buffer.concat([signature, pngChunk("IHDR", ihdr), pngChunk("IDAT", idat), pngChunk("IEND", Buffer.alloc(0))]);
}
const PNG_16 = makePng16();

function serveSprite(res) {
  res.writeHead(200, {
    "content-type": "image/png",
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
  });
  res.end(PNG_16);
}

// ---------------------------------------------------------------- routes
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  const path = url.pathname;
  const started = Date.now();
  const log = (status) => console.log("[mock] " + req.method + " " + path + " -> " + status + " (" + (Date.now() - started) + "ms)");

  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
        "access-control-allow-headers": "Content-Type,Authorization,Accept-Language",
        "access-control-max-age": "86400",
      });
      res.end();
      log(204);
      return;
    }

    if (path === "/__healthz") {
      sendJson(res, 200, { ok: true });
      log(200);
      return;
    }

    if (req.method === "POST" && path === "/v1/authentication/login") {
      const body = await readBody(req);
      const email = String(body.email || "").toLowerCase();
      if (email === TRAINER_CREDENTIALS.email && body.password === TRAINER_CREDENTIALS.password) {
        const tokens = resetWorld();
        sendJson(res, 200, { ok: true, data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: world.user } });
        log(200);
      } else {
        sendJson(res, 401, { internalCode: 2002, message: "Invalid credentials" });
        log(401);
      }
      return;
    }

    if (req.method === "POST" && path === "/v1/authentication") {
      const body = await readBody(req);
      const tokens = resetWorld({
        email: String(body.email || "").toLowerCase().trim(),
        name: String(body.name || "Trainer"),
        favouritePokemonId: Number(body.favouritePokemonId) || 25,
      });
      sendJson(res, 201, { ok: true, data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: world.user } });
      log(201);
      return;
    }

    if (req.method === "POST" && path === "/v1/authentication/token/refresh") {
      const body = await readBody(req);
      const token = String(body.refreshToken || "");
      if (token.startsWith(ACCESS_PREFIX)) {
        sendJson(res, 401, { internalCode: 3001, message: "Refresh token not found" });
        log(401);
        return;
      }
      if (world.refreshTokens.has(token)) {
        world.refreshTokens.delete(token);
        world.retiredRefreshTokens.add(token);
        for (const accessToken of world.accessTokens) world.retiredAccessTokens.add(accessToken);
        world.accessTokens.clear();
        const tokens = issueTokens();
        sendJson(res, 200, { ok: true, data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken } });
        log(200);
        return;
      }
      if (world.retiredRefreshTokens.has(token)) {
        sendJson(res, 401, { internalCode: 3003, message: "Refresh token expired" });
        log(401);
        return;
      }
      sendJson(res, 401, { internalCode: 3001, message: "Refresh token not found" });
      log(401);
      return;
    }

    if (path.startsWith("/v1/user")) {
      const denied = accessGate(req);
      if (denied) {
        sendJson(res, 401, denied);
        log(401);
        return;
      }
      if (req.method === "GET" && path === "/v1/user") {
        sendJson(res, 200, { ok: true, data: { user: world.user } });
        log(200);
        return;
      }
      if (req.method === "PATCH" && path === "/v1/user") {
        const body = await readBody(req);
        if (typeof body.name === "string" && body.name.trim()) world.user.name = body.name.trim();
        if (typeof body.language === "string" && body.language) world.user.language = body.language;
        world.user.updatedAt = new Date().toISOString();
        sendJson(res, 200, { ok: true, data: { user: world.user } });
        log(200);
        return;
      }
      if (req.method === "POST" && path === "/v1/user/pokemon/catch") {
        const body = await readBody(req);
        const pokemonId = Number(body.pokemonId);
        if (Number.isFinite(pokemonId) && !world.user.caughtPokemonIds.includes(pokemonId)) {
          world.user.caughtPokemonIds.push(pokemonId);
        }
        world.user.updatedAt = new Date().toISOString();
        sendJson(res, 200, { ok: true, data: { user: world.user } });
        log(200);
        return;
      }
    }

    if (req.method === "GET" && path === "/v1/pokemon/last-updated") {
      sendJson(res, 200, { ok: true, data: { pokemonIds: ["1", "4", "7", "25"] } });
      log(200);
      return;
    }

    if (req.method === "GET" && path === "/v1/analytics/realtime-users") {
      sendJson(res, 200, { activeUsers: 42 });
      log(200);
      return;
    }

    if (req.method === "GET" && path.startsWith("/api/v2/pokemon/")) {
      const key = decodeURIComponent(path.slice("/api/v2/pokemon/".length)).toLowerCase();
      const mon = POKEMON_BY_KEY[key];
      if (mon) {
        sendJson(res, 200, mon);
        log(200);
      } else {
        sendJson(res, 404, { error: "Not Found" });
        log(404);
      }
      return;
    }

    if (req.method === "GET" && path.startsWith("/assets/sprites/")) {
      serveSprite(res);
      log(200);
      return;
    }

    sendJson(res, 404, { error: "not found" });
    log(404);
  } catch (error) {
    sendJson(res, 500, { error: String(error && error.message || error) });
    log(500);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("[mock] listening on http://127.0.0.1:" + PORT);
});
