// RepairBench offline data plane. ADAPTATION ONLY: it is not part of the application, it changes no
// application logic and it fabricates no data. It replaces the axios transport of the one http instance
// the seed already builds in src/api/index.ts with a replay of the mock expectations the seed ITSELF
// records in src/assets/mock/apifox/geeker.mock-expectations.json, matched by the same rules Apifox
// documents for "expectations": every condition must hold (type "header" reads a request header, type
// "body" reads a request body field, comparator "eq" compares as text), the first matching expectation
// wins, and a conditionless expectation is therefore the fallback.
//
// Why this is needed at all: .env.production sets VITE_API_URL to
// "https://m1.apifoxmock.com/m1/2573367-1654163-8288883", so an unmodified production build fetches the
// menu list and the button permissions from the public internet. A repair verifier has to be offline and
// reproducible, and the recorded expectations ARE the seed's own answers - measured read-only by this seat:
// the "admin 菜单" body is field-for-field identical to src/assets/json/authMenuList.json (71 nodes, 0
// value differences; one node carries its meta keys in a different ORDER only) and the "admin 按钮" body is
// byte-identical to src/assets/json/authButtonList.json. Replaying them keeps the data plane the seed ships
// without inventing a single field.
//
// Scope: only the four /geeker/* endpoints the seed calls (src/api/modules/login.ts). Anything else
// resolves to HTTP 404 with an explicit offline marker body, so an unexpected call stays LOUD instead of
// being silently satisfied. No timer, no random source and no clock reading is used anywhere here, so the
// response for a given request is the same on every run.
import type { AxiosAdapter } from "axios";

import expectations from "@/assets/mock/apifox/geeker.mock-expectations.json";

type RbCondition = { type: string; paramName: string; comparator: string; value: unknown };
type RbExpectation = { name: string; conditions: RbCondition[]; body: unknown };

const TABLE = expectations as unknown as Record<string, RbExpectation[]>;

// url suffix -> expectations key. Every seed url is PORT1 + path with PORT1 = "/geeker"
// (src/api/config/servicePort.ts:2) and axios prefixes VITE_API_URL, so the suffix is the stable part.
const ROUTES: [string, string][] = [
  ["/geeker/login", "login"],
  ["/geeker/menu/list", "menu/list"],
  ["/geeker/auth/buttons", "auth/buttons"],
  ["/geeker/logout", "logout"]
];

const routeKey = (url: string): string | null => {
  const path = String(url || "").split("?")[0];
  for (const [suffix, key] of ROUTES) if (path.endsWith(suffix)) return key;
  return null;
};

// Request headers, normalised to a lower-cased plain map. axios >= 1 hands the adapter an AxiosHeaders
// instance (it has .get); older shapes and the unit-test path hand a plain object.
const headersOf = (config: any): Record<string, string> => {
  const out: Record<string, string> = {};
  const h = config && config.headers;
  if (!h) return out;
  if (typeof h.get === "function") {
    for (const k of ["x-access-token", "content-type", "accept"]) {
      const v = h.get(k);
      if (v !== undefined && v !== null) out[k.toLowerCase()] = String(v);
    }
    if (typeof h.toJSON === "function") {
      const j = h.toJSON();
      for (const k of Object.keys(j || {})) out[k.toLowerCase()] = String((j as any)[k]);
    }
    return out;
  }
  for (const k of Object.keys(h)) out[k.toLowerCase()] = String((h as any)[k]);
  return out;
};

// Request body, normalised to a plain object. By the time an adapter runs, axios has already applied
// transformRequest, so a JSON post arrives as a string.
const bodyOf = (config: any): Record<string, unknown> => {
  const d = config && config.data;
  if (d === undefined || d === null) return {};
  if (typeof d === "string") {
    try {
      const parsed = JSON.parse(d);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  if (typeof d === "object") return d as Record<string, unknown>;
  return {};
};

const holds = (c: RbCondition, headers: Record<string, string>, body: Record<string, unknown>): boolean => {
  const name = String(c.paramName || "");
  const actual = c.type === "header" ? headers[name.toLowerCase()] : body[name];
  if (String(c.comparator || "eq") !== "eq") return false;
  if (actual === undefined || actual === null) return false;
  return String(actual) === String(c.value);
};

const respond = (config: any, status: number, data: unknown): any => ({
  data,
  status,
  statusText: status === 200 ? "OK" : "Not Found",
  headers: { "content-type": "application/json" },
  config,
  request: { __rbOfflineReplay: true }
});

/**
 * The offline adapter. Wired into the seed's single axios instance in src/api/index.ts; nothing else in
 * the application changes, so the response interceptor, the cancel helper and the loading mask all keep
 * running exactly as they do online.
 */
export const offlineApiAdapter: AxiosAdapter = async (config: any): Promise<any> => {
  const key = routeKey(String(config.url || ""));
  if (!key) {
    return respond(config, 404, {
      code: 404,
      data: null,
      msg: "RepairBench offline adapter: no recorded expectation for " + String(config.url || "")
    });
  }
  const list = TABLE[key];
  if (!Array.isArray(list) || !list.length) {
    return respond(config, 404, { code: 404, data: null, msg: "RepairBench offline adapter: " + key + " has no recorded expectation" });
  }
  const headers = headersOf(config);
  const body = bodyOf(config);
  let fallback: RbExpectation | null = null;
  for (const e of list) {
    const cs = Array.isArray(e.conditions) ? e.conditions : [];
    if (!cs.length) {
      if (!fallback) fallback = e;
      continue;
    }
    if (cs.every(c => holds(c, headers, body))) return respond(config, 200, e.body);
  }
  if (fallback) return respond(config, 200, fallback.body);
  return respond(config, 404, { code: 404, data: null, msg: "RepairBench offline adapter: no expectation matched for " + key });
};

