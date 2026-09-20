import { minify } from 'html-minifier-terser';
import type { Plugin } from 'vite';

export const minifyHtmlPlugin = (): Plugin => ({
  name: 'vite-plugin-minify',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler: (html) =>
      minify(html, {
        removeComments: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: false,
        removeEmptyAttributes: true,
        minifyCSS: true,
        minifyJS: true,
        minifyURLs: true
      })
  }
});
