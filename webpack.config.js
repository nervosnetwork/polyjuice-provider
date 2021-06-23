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
    library: 'PolyjuiceHttpProvider',
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
      "./godwoken": path.resolve(__dirname, "src/godwoken"),
      buffer: path.join(__dirname, "./node_modules/buffer"),
      Buffer: path.join(__dirname, "./node_modules/buffer"),
      process: "process/browser"
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

// can be used in nodejs env
const serverConfig = {...basicConfig, ...{
  target: 'node',
  output: {...basicConfig.output, ...{
    filename: 'index.node.js',
  }}
}};

// can be used in web dev such as react
const clientConfig = {...basicConfig, ...{
  target: 'web', // <=== can be omitted as default is 'web'
  output: {...basicConfig.output, ...{
    filename: 'index.js',
  }}
}};

// can be used by html script tag. eg: <script src="/path/to/PolyjuiceHttpProvider.js"></script>
const browserConfig = {...basicConfig, ...{
  target: 'web',
  output: {...basicConfig.output, ...{
    path: path.resolve(__dirname, "./build/browser/"),
    filename: 'PolyjuiceHttpProvider.js',
  }},
  externals: [],
}}

module.exports = [serverConfig, clientConfig, browserConfig];
