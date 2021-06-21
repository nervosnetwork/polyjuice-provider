// production config
const { merge } = require("webpack-merge");
const { resolve } = require("path");
const commonConfig = require("./webpack.config");

module.exports = merge(commonConfig, {
  mode: "production",
  output: {
    filename: "polyjuice_provider.min.js",
    path: resolve(__dirname, "./lib"),
    libraryTarget: 'umd',
    library: 'PolyjuiceHttpProvider',
    libraryExport: 'default',
    globalObject: 'this',
  },
  devtool: "source-map",
});
