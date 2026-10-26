const path = require("path");
const HtmlWebPackPlugin = require("html-webpack-plugin");

const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  mode: isProduction ? "production" : "development",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    // Content-hash the production bundle so each build emits a unique filename.
    // A changed build produces a new URL CloudFront cannot serve stale, and
    // HtmlWebpackPlugin rewrites index.html to point at it. Dev keeps the
    // stable name so the dev server/HMR stays simple.
    filename: isProduction ? "bundle.[contenthash].js" : "bundle.js",
    publicPath: "/",
    // Only wipe dist for production builds; the dev server keeps it warm.
    clean: isProduction,
  },

  // Persistent filesystem cache dramatically speeds up warm dev/prod starts.
  cache: {
    type: "filesystem",
    buildDependencies: {
      config: [__filename],
    },
  },

  // Lighter source maps in dev rebuild faster; full maps for production.
  devtool: isProduction ? "source-map" : "eval-cheap-module-source-map",
  resolve: {
    extensions: [".js", ".jsx"],
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, "dist"),
      publicPath: "/",
    },
    historyApiFallback: true,
    // Skip gzip in dev to save per-reload CPU; prod hosting handles compression.
    compress: false,
    port: 8080,
    hot: true,
    open: true,
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  // Target modern browsers in dev to cut transform work; a
                  // production build can rely on a browserslist if added later.
                  targets: isProduction
                    ? "defaults"
                    : "last 2 Chrome versions, last 2 Firefox versions, last 2 Safari versions",
                },
              ],
              "@babel/preset-react",
            ],
            // Reuse transforms across runs.
            cacheDirectory: true,
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: path.resolve(__dirname, "src/index.html"),
      filename: "index.html",
    }),
  ],
};
