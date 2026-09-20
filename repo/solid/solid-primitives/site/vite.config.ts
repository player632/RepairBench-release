import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join as path_join, resolve } from "node:path";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/solid-start/plugin/vite";
import viteSolid from "vite-plugin-solid";

const __dirname = dirname(fileURLToPath(import.meta.url));

const packages = await (async () => {
  try {
    // @ts-ignore - generated file may not exist on a fresh checkout
    return (await import("./src/_generated/packages.json", { with: { type: "json" } }))
      .default as Array<{ name: string }>;
  } catch {
    throw new Error("No packages found. Did you run `pnpm generate`?");
  }
})();

// A package only gets a prerendered `/playground/<name>` page if it has a
// runnable dev harness at `packages/<name>/dev/index.tsx`. `filesystem` is
// additionally excluded because its dev harness imports Node-only chokidar
// (mirrors the glob exclusion in src/routes/playground/$name.tsx).
const hasPlayground = (name: string) =>
  name !== "filesystem" &&
  existsSync(resolve(__dirname, "..", "packages", name, "dev", "index.tsx"));

const prerenderPages = [
  "/",
  ...packages.flatMap(({ name }) => {
    const paths = [`/package/${name}`];
    if (hasPlayground(name)) paths.push(`/playground/${name}`);
    return paths;
  }),
].map(path => ({ path, prerender: { enabled: true, crawlLinks: false } }));

// Walks a package manifest's export-condition tree and returns the target declared under the
// workspace's own "@solid-primitives/source" condition, or undefined when there is none. Only
// bundler conditions are descended into; "types" is deliberately not, so a .d.ts can never be
// handed to the bundler as if it were the implementation.
const pickSourceEntry = (node: unknown): string | undefined => {
  if (!node || typeof node !== "object") return undefined;
  const rec = node as Record<string, unknown>;
  const direct = rec["@solid-primitives/source"];
  if (typeof direct === "string") return direct;
  for (const k of ["import", "module", "browser", "default"]) {
    const nested = pickSourceEntry(rec[k]);
    if (nested) return nested;
  }
  return undefined;
};

export default defineConfig({
  resolve: {
    // Use the source-code entry points of the workspace `@solid-primitives/*` packages
    // instead of their published dist files (matches customConditions in tsconfig.json).
    conditions: ["@solid-primitives/source"],
    // Auto-reads `paths` from tsconfig.json — preserves `~/*` → `./src/*`.
    tsconfigPaths: true,
  },
  build: {
    sourcemap: true,
  },
  plugins: [
    // resolve.conditions above asks for the packages' own "@solid-primitives/source" export
    // condition (./src/index.ts) instead of the published ./dist builds. Rolldown's client
    // environment does not carry a user-supplied resolve.conditions entry through to the
    // symlinked workspace packages, so the client build falls back to the manifest's
    // "default" target ("./dist/index.js") and fails outright on any tree that has not run the
    // library build: measured twice on the design seat's leg tree (packages carrying dist: 0/85) as
    //   [vite]: Rolldown failed to resolve import "@solid-primitives/event-listener" from
    //   ".../site/src/components/Header/Header.tsx"  ->  ELIFECYCLE Command failed with exit code 1
    //
    // packages themselves declare, for every environment, so the site always bundles the workspace
    // SOURCE - which is also what keeps a defect seeded in packages/<name>/src observable through a
    // bare "@solid-primitives/<name>" import instead of being masked by a stale prebuilt dist.
    // Both manifest shapes in this workspace are handled: the shorthand conditions form used by 82
    // packages (exports: { import: { "@solid-primitives/source": ... } }) and the keyed subpath form
    // used by 3 (exports: { ".": {...}, "./immutable": {...} }). Anything that declares no source
    // entry returns null and resolves exactly as before. Static audit of every @solid-primitives/*
    // specifier under site/src, packages/*/src and packages/*/dev: 24/24 resolve
    //
    {
      name: "solid-primitives-source-condition",
      enforce: "pre",
      resolveId(source: string) {
        const m = /^@solid-primitives\/([^/]+)(\/.*)?$/.exec(source);
        if (!m) return null;
        const pkgDir = resolve(__dirname, "..", "packages", m[1]!);
        const manifest = path_join(pkgDir, "package.json");
        if (!existsSync(manifest)) return null;
        const declared = JSON.parse(readFileSync(manifest, "utf8")).exports as unknown;
        if (!declared || typeof declared !== "object") return null;
        const ex = declared as Record<string, unknown>;
        const keyed = Object.keys(ex).some(k => k === "." || k.startsWith("./"));
        const entry = m[2] ? (keyed ? ex["." + m[2]] : undefined) : keyed ? ex["."] : declared;
        const target = pickSourceEntry(entry);
        if (typeof target !== "string") return null;
        const abs = path_join(pkgDir, target);
        return existsSync(abs) ? abs : null;
      },
    },
    tanstackStart({
      pages: prerenderPages,
      // site/src/routeTree.gen.ts is a TRACKED file that @tanstack/router-generator rewrites on
      // every vite build. The generator's defaults (quoteStyle "single", semicolons false) do not
      // match the committed formatting, so a verifier run used to dirty 152 lines of a tracked file
      // (measured: the delta normalises to nothing but quotes and semicolons). Pinning the two
      // options makes the regenerated file byte-identical to the committed one.
      router: { quoteStyle: "double", semicolons: true },
      // Custom client entry installs a dev-mode `console.warn` interceptor that
      // batches the noisy "Unable to find DOM nodes for hydration key" warnings
      // emitted by the primitives table.
      // The entry path is resolved RELATIVE TO srcDirectory (site/src) by
      // @tanstack/start-plugin-core's resolve-entries.js, so "./src/client.tsx" silently resolves
      // to site/src/src/client.tsx, exsolve's try:true swallows the miss, and the build falls back
      // to @tanstack/solid-start's default-entry/client.tsx - measured: the production bundle then
      // contains no trace of this file or of the probe it installs (0 hits for "__SPRB__" across all
      // 667 emitted files, and src/client.tsx is absent from assets/index-*.js.map#sources).
      client: { entry: "./client.tsx" },
      prerender: {
        enabled: true,
        // README content contains relative/anchor links; avoid following them.
        crawlLinks: false,
      },
    }),
    viteSolid({ ssr: true }),
  ],
});
