// shared config (dev and prod)
const path = require("path");
const webpack = require("webpack");

module.exports = {
  context: path.resolve(__dirname, "./src"),
  entry: "./index.js",
  resolve: {
    extensions: [".js",  ".ts"],
    fallback: {
      "stream": require.resolve("stream-browserify"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "url": require.resolve("url"),
      "os": require.resolve("os-browserify/browser"),
      "crypto": require.resolve("crypto-browserify"),
    },
    alias: {
      './godwoken': path.resolve(__dirname, 'src/godwoken'),
      buffer: path.join(__dirname, './node_modules/buffer'),
      Buffer: path.join(__dirname, './node_modules/buffer'),
      process: "process/browser",
    }
  },
  module: {
    rules: [
      {
        test: [/\.js?$/, /\.ts?$/],
        use: ["ts-loader"],
        exclude: /node_modules/,
      }
    ],
  },
  plugins: [
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
      new webpack.ProvidePlugin({
        transformruntime: 'process/browser',
      })
  ]
};
