var CopyPlugin = require("copy-webpack-plugin");

var path = require("path");

module.exports = {
  mode: "development",
  entry: "./public/app.js",
  output: {
    filename: "out.js",
    path: path.resolve(__dirname, "public"),
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.simubpmn$/,
        use: {
          loader: "raw-loader",
        },
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "dist/assets", to: "vendor/prop/assets" },
        {
          from: "node_modules/bpmn-js/dist/assets",
          to: "vendor/bpmn-js/assets",
        },
      ],
    }),
  ],
};
