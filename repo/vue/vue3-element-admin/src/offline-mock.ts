/**
 * 离线 Mock 服务（adaptation）
 *
 * 生产构建在完全离线（无后端、无网络）环境下运行时，把种子自带的
 * mock/*.mock.ts 数据层挂进浏览器内：
 *   1. 替换 axios 默认 adapter：命中规则的请求直接以 mock 数据应答，
 *      未命中的请求返回 404 信封（不再发出任何真实网络请求）；
 *   2. 包装 window.fetch：为 SSE 连接（/api/v1/sse/connect）提供一个
 *      永久保活的 text/event-stream 响应（仅发送注释帧，不下发事件），
 *      使 useSse 进入 CONNECTED 且不再触发重连风暴。
 * mock 数据与 dev 模式完全同源（同一批规则文件），仅去除 dev 插件依赖。
 */
import axios from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import type { MockContext, MockRule } from "../mock/base";

import appMocks from "../mock/app.mock";
import authMocks from "../mock/auth.mock";
import codegenMocks from "../mock/codegen.mock";
import configMocks from "../mock/config.mock";
import deptMocks from "../mock/dept.mock";
import dictMocks from "../mock/dict.mock";
import fileMocks from "../mock/file.mock";
import logMocks from "../mock/log.mock";
import menuMocks from "../mock/menu.mock";
import noticeMocks from "../mock/notice.mock";
import roleMocks from "../mock/role.mock";
import tenantMocks from "../mock/tenant.mock";
import tenantPlanMocks from "../mock/tenant-plan.mock";
import userMocks from "../mock/user.mock";

const allRules: MockRule[] = [
  ...appMocks,
  ...authMocks,
  ...codegenMocks,
  ...configMocks,
  ...deptMocks,
  ...dictMocks,
  ...fileMocks,
  ...logMocks,
  ...menuMocks,
  ...noticeMocks,
  ...roleMocks,
  ...tenantMocks,
  ...tenantPlanMocks,
  ...userMocks,
];

/** 将 URL 模式拆成段 */
const splitPath = (path: string): string[] =>
  path.split("/").filter((segment) => segment.length > 0);

/** 匹配单条规则，返回路径参数；不匹配返回 null */
function matchRule(ruleUrl: string, segments: string[]): Record<string, string> | null {
  const patternSegments = splitPath(ruleUrl);
  if (patternSegments.length !== segments.length) {
    return null;
  }
  const params: Record<string, string> = {};
  for (let i = 0; i < patternSegments.length; i++) {
    const patternSegment = patternSegments[i];
    if (patternSegment.startsWith(":")) {
      params[patternSegment.slice(1)] = decodeURIComponent(segments[i]);
    } else if (patternSegment !== segments[i]) {
      return null;
    }
  }
  return params;
}

/** 规则方法是否匹配 */
function methodMatches(rule: MockRule, method: string): boolean {
  if (!rule.method) {
    return true;
  }
  const methods = Array.isArray(rule.method) ? rule.method : [rule.method];
  return methods.some((item) => item.toUpperCase() === method.toUpperCase());
}

interface ResolvedRule {
  rule: MockRule;
  params: Record<string, string>;
}

/** 查找匹配规则：先精确字面量（无 : 段），再参数化，均按声明顺序 */
function resolveRule(method: string, pathname: string): ResolvedRule | null {
  const segments = splitPath(pathname);
  const parameterized: MockRule[] = [];
  for (const rule of allRules) {
    if (!methodMatches(rule, method)) {
      continue;
    }
    if (rule.url.includes(":")) {
      parameterized.push(rule);
      continue;
    }
    const params = matchRule(rule.url, segments);
    if (params) {
      return { rule, params };
    }
  }
  for (const rule of parameterized) {
    const params = matchRule(rule.url, segments);
    if (params) {
      return { rule, params };
    }
  }
  return null;
}

/** 合并 axios params 与 URL 查询串为字符串字典 */
function buildQuery(config: InternalAxiosRequestConfig, search: string): Record<string, string> {
  const query: Record<string, string> = {};
  if (search) {
    const searchParams = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    searchParams.forEach((value, key) => {
      query[key] = value;
    });
  }
  const params = config.params as Record<string, unknown> | undefined;
  if (params && typeof params === "object") {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          query[index === 0 ? key : `${key}_${index}`] = String(item);
        });
      } else {
        query[key] = String(value);
      }
    }
  }
  return query;
}

/** 解析请求体（axios transformRequest 之后通常是 JSON 字符串） */
function parseRequestBody(config: InternalAxiosRequestConfig): unknown {
  const data = config.data;
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data ?? {};
}

const notFoundEnvelope = { code: "A0404", data: null, msg: "offline mock: unmatched endpoint" };

/** 离线 axios 适配器：命中 mock 规则直接应答，未命中返回 404 信封 */
export const offlineAdapter = async (
  config: InternalAxiosRequestConfig
): Promise<AxiosResponse> => {
    const rawUrl = config.url ?? "";
    const base = config.baseURL ?? "";
    const full =
      rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
        ? rawUrl
        : `${base.replace(/\/$/, "")}/${rawUrl.replace(/^\//, "")}`;
    const [pathname, search] = full.split("?");
    const method = (config.method ?? "get").toUpperCase();
    const matched = resolveRule(method, pathname);

    if (!matched) {
      return {
        data: notFoundEnvelope,
        status: 404,
        statusText: "Not Found",
        headers: { "content-type": "application/json" },
        config,
        request: {},
      };
    }

    const context: MockContext = {
      params: matched.params,
      query: buildQuery(config, search ?? ""),
      body: parseRequestBody(config),
      headers: (config.headers ?? {}) as unknown as Record<string, string>,
    };
    const body =
      typeof matched.rule.body === "function" ? matched.rule.body(context) : matched.rule.body;

    const responseHeaders: Record<string, string> = {
      "content-type": "application/json",
      ...(matched.rule.headers ?? {}),
    };

    return {
      data: body ?? {},
      status: 200,
      statusText: "OK",
      headers: responseHeaders,
      config,
      request: {},
    };
};

/** 包装 fetch：为 SSE 连接提供永久保活的空事件流 */
function setupSseStream(): void {
  const originalFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.includes("/api/v1/sse/connect")) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(": offline-mock keep-alive\n\n"));
        },
      });
      return Promise.resolve(
        new Response(stream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        })
      );
    }
    return originalFetch(input, init);
  }) as typeof window.fetch;
}

axios.defaults.adapter = offlineAdapter;
setupSseStream();
