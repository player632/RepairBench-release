const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const fs = require('fs');

// Copy the vendored theme stylesheet next to the generated index.html.
class CopyVendorCss {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('CopyVendorCss', () => {
      const outDir = path.join(__dirname, 'dist', 'vendor');
      fs.mkdirSync(outDir, { recursive: true });
      fs.copyFileSync(path.join(__dirname, 'app', 'vendor', 'main.css'), path.join(outDir, 'main.css'));
    });
  }
}

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: ['whatwg-fetch', './app/index.js'],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './app/index.html'
    }),
    new CopyVendorCss(),
    new webpack.IgnorePlugin(/vertx/)
  ]
};
