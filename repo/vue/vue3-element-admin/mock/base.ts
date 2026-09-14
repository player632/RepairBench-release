/**
 * 离线 Mock 定义垫片（adaptation）
 *
 * 原始实现依赖 vite-plugin-mock-dev-server（仅 dev server 生效）。为让生产构建
 * 在完全离线环境下自包含运行，此处改为纯数据声明：url 统一拼上
 * VITE_APP_BASE_API + /api/v1/ 前缀，规则由 src/offline-mock.ts 的 axios 适配器
 * 在浏览器内分发（见该文件说明）。规则结构保持与原插件一致：
 * { url, method?, headers?, body: object | (ctx) => object }。
 */
export interface MockContext {
  params: Record<string, string>;
  query: Record<string, string>;
  body: any;
  headers: Record<string, string>;
}

export type MockResponseBody = Record<string, any>;

export interface MockRule {
  url: string;
  method?: string | string[];
  headers?: Record<string, string>;
  body?: MockResponseBody | ((ctx: MockContext) => MockResponseBody);
}

export const defineMock = (mocks: MockRule[]): MockRule[] => {
  const base = `${import.meta.env.VITE_APP_BASE_API}/api/v1/`;
  return mocks.map((mock) => ({
    ...mock,
    url: `${base}${mock.url}`.replace(/\/+/g, "/"),
  }));
};
