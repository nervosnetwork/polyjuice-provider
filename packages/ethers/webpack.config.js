// shared config (dev and prod)
const path = require("path");
const webpack = require("webpack");
const nodeExternals = require('webpack-node-externals');

const basicConfig = {
  context: path.resolve(__dirname, "./src"),
  entry: "./index.ts",
  target: 'node',
  mode: "production",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "./lib"),
    libraryTarget: 'umd',
    library: 'PolyjuiceEthers',
    libraryExport: 'default',
    globalObject: 'this',
  },

  // in order to ignore all modules in node_modules folder 
  externals: [nodeExternals()],

  resolve: {
    extensions: [".js", ".ts"],
    fallback: {
      stream: require.resolve("stream-browserify"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      url: require.resolve("url"),
      os: require.resolve("os-browserify/browser"),
      crypto: require.resolve("crypto-browserify")
    },
    alias: {
      buffer: path.join(__dirname, "./node_modules/buffer"),
      Buffer: path.join(__dirname, "./node_modules/buffer"),
      process: "process/browser",
    },
  },
  module: {
    rules: [
      {
        test: [/\.js?$/, /\.ts?$/],
        use: ["ts-loader"],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
    new webpack.ProvidePlugin({
      transformruntime: "process/browser",
    }),
    new webpack.ProvidePlugin({
      fetch: "cross-fetch",
    }),
  ],
  optimization: {
    minimize: false,
  },
};

//======== ethers compatibale provider and signer ===========
// can be used in hardhat
const ethersProvidersConfig = {...basicConfig, ...{
  //target: 'web',
  context: path.resolve(__dirname, "./src"),
  entry: "./providers.ts",
  output: {...basicConfig.output, ...{
    path: path.resolve(__dirname, "./lib"),
    filename: 'providers.js',
    libraryTarget: 'umd',
    library: 'PolyjuiceProviders',
    libraryExport: 'default',
    globalObject: 'this',
  }}
}}

const ethersWalletSignerConfig = {...basicConfig, ...{
  //target: 'web',
  context: path.resolve(__dirname, "./src"),
  entry: "./wallet-signer.ts",
  output: {...basicConfig.output, ...{
    path: path.resolve(__dirname, "./lib"),
    filename: 'wallet-signer.js',
    libraryTarget: 'umd',
    library: 'PolyjuiceWalletSigner',
    libraryExport: 'default',
    globalObject: 'this',
  }}
}}

module.exports = [ethersProvidersConfig, ethersWalletSignerConfig];
