import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
);

// The echomd theme CSS is loaded at runtime by URL (see src/themes/manager.ts),
// versioned by the dependency spec string, e.g. /styles/echomd@^1.0.4/...
const echomdVersion: string = pkg.dependencies["@0xgg/echomd"];

// Build metadata shown in the Settings panel (replaces the legacy
// `yarn git-info` script that generated src/_git_commit.js).
//
// Frozen to a constant on purpose. The upstream implementation shelled out to
// `git log -1 --oneline` / `git rev-parse HEAD` at config time, so the string
// baked into the served bundle depended on whichever repository the build
// happened to run inside, and the Settings panel then displayed it. Both the
// value and its provenance are build-host detail: nothing under src/ branches
// on it, it is only rendered as text, so a fixed value is behaviourally
// equivalent for every consumer while making the artifact reproducible.
function getGitCommit(): { logMessage: string; hash: string } {
  return { logMessage: "crossnote", hash: "" };
}

export default defineConfig({
  resolve: {
    alias: {
      // The data layer treats lightning-fs paths as POSIX paths via Node's
      // path API; webpack 4 (CRA) used to polyfill it automatically.
      path: "path-browserify",
    },
  },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/@0xgg/echomd/theme/*",
          dest: `styles/echomd@${echomdVersion}`,
        },
      ],
    }),
  ],
  define: {
    __GIT_COMMIT__: JSON.stringify(getGitCommit()),
    // Some browser bundles (PouchDB and friends) still reference the Node
    // `global` object; map it to the standard globalThis.
    global: "globalThis",
  },
  optimizeDeps: {
    // Scan from the source entry instead of index.html: the classic
    // <script src="/deps/..."> tags there point at large pre-minified
    // bundles in /public that stall the dependency scanner.
    entries: ["src/index.tsx"],
  },
  server: {
    port: 3000,
  },
});
