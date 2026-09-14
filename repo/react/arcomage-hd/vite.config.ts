import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json'
import { defaultAppUrl, origDesc, origTitle } from './src/constants/htmlVars'
import path from 'path'
// RepairBench adaptation AD-2/AD-3/AD-4/AD-5 (build tooling only; no application
// code path and no runtime behaviour of the app is touched by any of them):
//   AD-2  dropped `vite-plugin-pwa` + `./tools/manifest`: the manifest/icon generator
//         needs `sharp` at config-load time and its whole product is a service worker
//         plus generated PNGs. A service worker would make every later page load serve
//         cached bytes instead of the build under test, so removing it is required for
//         deterministic re-measurement, not just for convenience. `src/` never imports
//         `virtual:pwa-register` / registerSW / navigator.serviceWorker (grep-verified),
//         so nothing in the app graph loses a symbol.
//   AD-3  dropped `@vitejs/plugin-legacy` and `vite-plugin-html-minifier`, and moved
//         `build.minify` from 'terser' to 'esbuild': `terser` is not a dependency of this
//         repo (it only ever arrived transitively), plugin-legacy requires it, and the
//         legacy chunks/polyfills it emits are dead weight for the single modern engine
//         the verifier drives. Minifier choice cannot change app semantics.
//   AD-4  dropped `rollup-plugin-license`: it only writes dist/LICENSES.txt.
//   AD-5  dropped the inline `vite-plugin-run-script` plugin: it shelled out to
//         `bun tools/sass-var-gen`, `bun tools/mangle-action-type/mangle.ts` and
//         `.../restore.ts`. bun is not present in this pipeline (npm 11.19.0 / node
//         v24.20.0 only), and mangle/restore REWRITE src/ during the build and rewrite it
//         back afterwards, which a verifier must never do to the tree it is grading
//         (methodology §3.6.2: run.sh is read-only on the source). The only artifact the
//         three scripts produce that the build actually consumes is
//         src/constants/_css_constants.scss, which AD-6 commits pre-generated.

const isDev = process.env.NODE_ENV === 'development'

// RepairBench adaptation AD-1: upstream derived these two values from
// `execSync('git log -1 --date=unix --format="%ad"')` at config-load time. The delivered
// tree carries no .git (methodology §3.7.1) so that command cannot run there, and a
// value read from a live repository would make the build non-reproducible. Inlined
// instead is the pinned upstream revision's own commit timestamp
// (efa3ea4120ce2aef4625c50d492a733cf3afbbf7 = unix 1763213072, read once from the gate
// clone). It feeds only the %APP_COMMITTIME% / %APP_COMMITTIME2% HTML meta tags.
const commitTimeDateObj = new Date(1763213072 * 1000)
const commitTime = commitTimeDateObj.toUTCString()
const commitTime2 = commitTimeDateObj.toISOString().replace(/\.\d+Z$/, '+00:00')

// const ogimageHash = (() => {
//   const fileBuffer = fs.readFileSync('./assets/logo/ogimage.jpg')
//   const hashSum = crypto.createHash('sha1')
//   hashSum.update(fileBuffer)
//   return hashSum.digest('hex').substring(0, 20)
// })()

const ReactCompilerConfig = {
  target: '19',
}

const homeUrl = process.env.APP_URL || defaultAppUrl

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@assets': path.resolve(__dirname, 'assets'),
      '@root': path.resolve(__dirname),
    },
  },
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(pkg.version),
    'import.meta.env.APP_TITLE': JSON.stringify(origTitle),
    'import.meta.env.APP_URL': JSON.stringify(homeUrl),
    'import.meta.env.APP_FAVICONSVG': JSON.stringify(
      isDev ? './favicon.svg' : `${homeUrl}favicon.svg`,
    ),
    'import.meta.env.APP_FAVICONICO': JSON.stringify(
      isDev ? './favicon.ico' : `${homeUrl}favicon.ico`,
    ),
    'import.meta.env.APP_OGIMAGE': JSON.stringify(
      isDev ? './ogimage.jpg' : `${homeUrl}ogimage.jpg`,
    ),
    'import.meta.env.APP_DESCRIPTION': JSON.stringify(origDesc),
    'import.meta.env.APP_COMMITTIME': JSON.stringify(commitTime),
    'import.meta.env.APP_COMMITTIME2': JSON.stringify(commitTime2),
  },
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
      },
    }),
  ],
  server: {
    port: 8080,
    open: true,
  },
  build: {
    target: 'es2017',
    outDir: 'dist',
    minify: 'esbuild',
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const vendor = id.split('node_modules/')[1].split('/')[0]
            if (
              vendor === 'peerjs' ||
              vendor === 'peerjs-js-binarypack' ||
              vendor === 'webrtc-adapter' ||
              vendor === 'sdp'
            ) {
              return
            }
            if (vendor === 'react-dom' || vendor === 'react') {
              return vendor
            }
            return 'vendor'
          }
        },
      },
    },
  },
})
