import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import path from 'path';

const pkg = require('./package.json');
const pkgVersion = require('./lerna.json').version;

const now = new Date();
const banner = `/**
 * filerobot-image-editor v${pkgVersion}
 * ${pkg.repository.url}
 * Copyright (c) 2019 ${pkg.author}
 * Released under the ${pkg.license} license
 * Date: ${now.toISOString()}
 */`;

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const isGithubPagesBuild = process.env.VITE_BUILD_TYPE === 'gh-pages';
  console.log(`🕺🏽Running in ${isProduction ? 'Production' : 'Development'}.`);

  if (isGithubPagesBuild) {
    console.log('⌛ Building GitHub pages demo...');
  }

  return {
    base: './',
    resolve: { alias: [
      { find: 'react-filerobot-image-editor/lib', replacement: path.resolve(__dirname, 'packages/react-filerobot-image-editor/src') },
      { find: 'react-filerobot-image-editor/src', replacement: path.resolve(__dirname, 'packages/react-filerobot-image-editor/src') },
      { find: 'react-filerobot-image-editor', replacement: path.resolve(__dirname, 'packages/react-filerobot-image-editor/src/index.js') },
      { find: 'filerobot-image-editor/src', replacement: path.resolve(__dirname, 'packages/filerobot-image-editor/src') },
      { find: 'filerobot-image-editor', replacement: path.resolve(__dirname, 'packages/filerobot-image-editor/src/index.js') },
    ] },
    publicDir: false,
    cacheDir: '.vite',
    plugins: [
      nodeResolve({
        extensions: ['.js', '.jsx', '.json'],
        moduleDirectories: [
          './packages/react-filerobot-image-editor/src',
          'node_modules',
        ]
      }),
      react(
        isProduction
          ? {
              babel: {
                configFile: true,
                ignore: [/node_modules/],
              },
            }
          : {},
      ),
    ],
    server: {
      port: 1111,
      open: true,
    },
    build: {
      ...(isGithubPagesBuild
        ? {
            outDir: './demo-dist',
            sourcemap: false,
          }
        : {
            minify: 'terser',
            terserOptions: {
              format: {
                comments: false,
                preamble: banner,
              },
            },
            outDir: './dist',
            sourcemap: 'hidden',
          }),
    },
  };
});
