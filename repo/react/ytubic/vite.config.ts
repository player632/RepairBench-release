import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      // 🔴 OFFLINE SHIMS (adaptation only; no defect lives here). Upstream this
      // is a Tauri desktop app: catalogue data reaches it through
      // `@tauri-apps/plugin-http` (a Rust-side client that REJECTS in a plain
      // browser tab) and every native side effect through `invoke`. The graded
      // artifact is served as a static browser build with allow_internet=false,
      // so all nine specifiers `src/` actually imports are aliased onto the
      // in-tree shims under `src/__rb/tauri/`, which answer from the fixed
      // corpus in `src/__rb/fixtures.ts` and record what they were asked for on
      // `window.__rb`. Order matters: rollup's alias matcher accepts an exact
      // id OR `id + "/"` as a prefix, so the four deep `@tauri-apps/api/*`
      // keys are listed before anything that could prefix-match them, and the
      // project's own `"@"` key stays LAST so it never shadows a package name.
      // 🔴 These are BUNDLE-time aliases only: `tsc --noEmit` (the second half
      // of `pnpm run build`) resolves through tsconfig, NOT through vite, so
      // the sources still type-check against the real @tauri-apps typings in
      // node_modules and no `paths` mapping is added or needed.
      "@tauri-apps/api/core": path.resolve(
        __dirname,
        "./src/__rb/tauri/core.ts",
      ),
      "@tauri-apps/api/event": path.resolve(
        __dirname,
        "./src/__rb/tauri/event.ts",
      ),
      "@tauri-apps/api/app": path.resolve(__dirname, "./src/__rb/tauri/app.ts"),
      "@tauri-apps/api/window": path.resolve(
        __dirname,
        "./src/__rb/tauri/window.ts",
      ),
      "@tauri-apps/plugin-http": path.resolve(
        __dirname,
        "./src/__rb/tauri/plugin-http.ts",
      ),
      "@tauri-apps/plugin-opener": path.resolve(
        __dirname,
        "./src/__rb/tauri/plugin-opener.ts",
      ),
      "@tauri-apps/plugin-process": path.resolve(
        __dirname,
        "./src/__rb/tauri/plugin-process.ts",
      ),
      "@tauri-apps/plugin-updater": path.resolve(
        __dirname,
        "./src/__rb/tauri/plugin-updater.ts",
      ),
      "@tauri-apps/plugin-deep-link": path.resolve(
        __dirname,
        "./src/__rb/tauri/plugin-deep-link.ts",
      ),
      "@": path.resolve(__dirname, "./src"),
    },
  },

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
