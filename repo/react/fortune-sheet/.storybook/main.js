module.exports = {
  stories: [
    "../stories/**/*.stories.mdx",
    "../stories/API.stories.tsx",
    "../stories/Features.stories.tsx",
  ],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],

  framework: {
    name: "@storybook/react-webpack5",
    options: {}
  },

  docs: {
    autodocs: "tag"
  },

  // repair-bench adaptation: wire the dormant seed webpack snippet (.storybook/webpack.config.js)
  // so tsconfig-paths-webpack-plugin resolves @fortune-sheet/core|react to the workspace src;
  // without it the demo resolves the packages dist builds (absent) and source repairs would
  // not propagate into the served build.
  webpackFinal: (config) => require("./webpack.config.js")({ config }),
};
