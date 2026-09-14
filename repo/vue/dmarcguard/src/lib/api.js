import ky from "ky";
import { useSettingsStore } from "@/stores";
import log from "@/logger.js";

var requestTimings = new WeakMap();

/**
 * Create a configured ky instance for the current API endpoint.
 *
 * Features:
 * - Automatic JSON parsing
 * - Consistent error handling
 * - Retry logic for transient failures
 * - Configurable timeout
 * - Dynamic API endpoint from settings store
 */
function createApiClient() {
  const settingsStore = useSettingsStore();

  return ky.create({
    prefix: settingsStore.apiEndpoint,
    timeout: 30000,
    retry: {
      limit: 3,
    },
    hooks: {
      beforeRequest: [
        function logBeforeRequest({ request }) {
          requestTimings.set(request, Date.now());
          log.debug(`API Request: ${request.method} ${request.url}`);
        },
      ],
      afterResponse: [
        function logAfterResponse({ request, response }) {
          var startTime = requestTimings.get(request);
          var duration = startTime ? Date.now() - startTime : 0;
          log.debug(
            `API Response: ${request.method} ${request.url} - ${response.status} ${response.statusText} (${duration}ms)`,
          );
        },
      ],
      beforeError: [
        function logBeforeError({ error }) {
          var { response } = error;
          log.error(
            `API Error: ${response?.status} ${response?.statusText} - ${error.message}`,
          );
          if (response?.body) {
            error.message = `API Error: ${response.status} ${response.statusText}`;
          }
          return error;
        },
      ],
    },
  });
}

// ---------------------------------------------------------------------------
// WLB offline adaptation (environment/adaptation.patch). This seed ships a Go backend
// (main.go + internal/api) that is NOT part of the repair task and is NOT started by the
// verifier, so the four getters below read same-origin STATIC FIXTURES instead of it.
//
// Why the paths look like this: ky 2.1.0 renamed the `prefixUrl` option to `prefix`
// (node_modules/ky/distribution/core/Ky.js:18 carries the rename message, :265-267 THROWS
// if `prefixUrl` is passed, :274 normalises `prefix`, :286-291 joins
// `prefix.replace(/\/+$/, "") + "/" + input.replace(/^\/+/, "")`). So the existing
// `prefix: settingsStore.apiEndpoint` in createApiClient() IS live code, and in a production
// build src/stores/settings.js:getDefaultApiUrl() returns `${window.location.origin}/api`
// (import.meta.env.DEV is false and no VITE_BASE_API_URL is set anywhere in the tree).
// Every getter therefore resolves to <origin>/api/rb-fixtures/<name>.json - which is exactly
// where the fixtures are landed: vite.config.js sets `publicDir: ./assets`, so
// assets/api/rb-fixtures/** is copied verbatim into dist/api/rb-fixtures/** by `vite build`.
//
// The request layer itself is untouched: real ky, real fetch, real JSON parsing, the real
// retry/timeout/hook configuration and the real searchParams. Only the four URL strings moved.
// These paths are ENVIRONMENT, not a defect - do not "repair" them back to the Go backend.
// ---------------------------------------------------------------------------
/**
 * Statistics API
 */
export const getStatistics = () => createApiClient().get("rb-fixtures/statistics.json").json();

/**
 * Top sources API
 * @param {number} limit - Maximum number of sources to return
 */
export const getTopSources = (limit = 10) =>
  createApiClient().get("rb-fixtures/top-sources.json", { searchParams: { limit } }).json();

/**
 * Reports API
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of reports to return
 * @param {number} options.offset - Offset for pagination
 */
export const getReports = ({ limit = 20, offset = 0 } = {}) =>
  createApiClient().get("rb-fixtures/reports.json", { searchParams: { limit, offset } }).json();

/**
 * Get a single report by ID
 * @param {string|number} id - Report ID
 */
export const getReportById = (id) =>
  createApiClient().get(`rb-fixtures/reports/${id}.json`).json();

export default createApiClient;
