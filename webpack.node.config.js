// production config
const { merge } = require("webpack-merge");
const { resolve } = require("path");
const commonConfig = require("./webpack.config");

module.exports = merge(commonConfig, {
  mode: "production",
  target: 'node',
  output: {
    filename: "polyjuice_provider.js",
    path: resolve(__dirname, "./lib/node"),
    libraryTarget: 'commonjs2',
  },
  devtool: "source-map",
});
