// production config
const { merge } = require("webpack-merge");
const { resolve } = require("path");
const commonConfig = require("./webpack.config");
const webpack = require("webpack");

module.exports = merge(commonConfig, {
  mode: "production",
  target: 'node',
  plugins: [
    new webpack.ProvidePlugin({
      fetch: 'whatwg-fetch/fetch'
    })
  ],
  output: {
    filename: "polyjuice_provider.js",
    path: resolve(__dirname, "./lib/node"),
    libraryTarget: 'commonjs2',
  },
  devtool: "source-map",
});
