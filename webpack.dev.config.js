// development config
const { merge } = require("webpack-merge");
const commonConfig = require("./webpack.config");

module.exports = merge(commonConfig, {
  mode: "development",
  devServer: {
    hot: true, // enable HMR on the server
    port: 3000
  },
  devtool: "cheap-module-source-map",
});
