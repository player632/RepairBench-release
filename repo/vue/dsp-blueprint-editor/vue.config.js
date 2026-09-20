const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')
const { execSync } = require('child_process')

// Deterministic build identity. Added by environment/adaptation.patch, and the whole reason this
// file is patched at all. The seed inlined
//     VERSION: JSON.stringify(execSync('git describe --tags --always --dirty', ...).trim())
// straight into the webpack.DefinePlugin below, at module top level and with no try/catch, which
// produces two independent measurement hazards. Neither is an application defect:
//   (1) the state trees this task is measured on are REBUILT trees, so a tree with no .git, or a
//       .git with no commit in it, made execSync throw WHILE this file was still being EVALUATED,
//       that is before webpack had started at all. The failure then reads as "the config is
//       broken" rather than as a build step failing, and it takes every state down identically;
//   (2) '--dirty' appends "-dirty" whenever the working tree differs from HEAD, and every state
//       in this task differs from HEAD by construction (that is what a patch is), so the inlined
//       VERSION literal, and therefore the emitted bundle bytes, depended on exactly how dirty the
//       tree happened to be. That is not reproducible from one run to the next.
// Treatment: resolve it defensively, drop '--dirty', and fall back to a CONSTANT read verbatim out
// of package.json ('version' == '0.1.0', package.json:3). No time-varying input is introduced
// anywhere in this block: no new Date(), no Date.now(), no hrtime, no random, no env variable, so
// the value is a pure function of the tree it is built from and the artifact bytes are stable
// across runs of the same state.
// VERSION is consumed at src/define.ts:8-10 and rendered in the sidebar footer at src/App.vue:115.
// No checkpoint in tests/dsl.json reads that footer in either state, so neither the git value nor
// the fallback constant can leak into a measured reading.
const VERSION_FALLBACK = require('./package.json').version
const resolveBuildVersion = () => {
    try {
        const described = execSync('git describe --tags --always', {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        })
        const trimmed = String(described).trim()
        return trimmed.length > 0 ? trimmed : VERSION_FALLBACK
    } catch (e) {
        return VERSION_FALLBACK
    }
}
const BUILD_VERSION = resolveBuildVersion()

module.exports = defineConfig({
    publicPath: '/dsp_blueprint_editor/',
    transpileDependencies: false,
    configureWebpack: {
        module: {
            rules: [
                {
                    test: /\/assets\//,
                    type: 'asset',
                }, {
                    test: /\/assets\/icons\/(item_recipe|signal|tech)\//,
                    type: 'asset/resource',
                },
            ],
        },
        resolve: {
            alias: {
                three$: 'three/src/Three.js',
            }
        },
        plugins: [
            new webpack.DefinePlugin({
                VERSION: JSON.stringify(BUILD_VERSION),
            }),
        ],
    },
    pwa: {
        name: '戴森球计划蓝图预览',
        themeColor: '#000000',
        msTileColor: null,
        appleMobileWebAppCapable: 'yes',
        appleMobileWebAppStatusBarStyle: 'black',
        manifestOptions: {
            short_name: '蓝图预览',
            icons: [
                {
                    'src': './img/icons/android-chrome-192x192.png',
                    'sizes': '192x192',
                    'type': 'image/png'
                },
                {
                    'src': './img/icons/android-chrome-512x512.png',
                    'sizes': '512x512',
                    'type': 'image/png'
                },
            ],
        },
        iconPaths: {
            faviconSVG: 'img/icons/favicon.svg',
            favicon32: 'img/icons/favicon-32x32.png',
            favicon16: 'img/icons/favicon-16x16.png',
            appleTouchIcon: null,
            maskIcon: null,
            msTileImage: null,
        },
    },

    pluginOptions: {
      i18n: {
        localeDir: 'locales',
        enableLegacy: false,
        runtimeOnly: true,
        compositionOnly: true,
        fullInstall: true
      }
    }
})
