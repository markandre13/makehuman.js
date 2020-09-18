const path = require("path")

module.exports = {
  mode: "development",
  entry: "./src/renderer.ts",
  target: 'electron-renderer',
  devtool: "source-map",
  module: {
    rules: [
      {
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ ".ts", ".js" ]
  },
  // node: {
  //   fs: 'empty',
  //   readline: 'empty'
  // },
  optimization: {
    minimize: false
  },
  output: {
    filename: "renderer.js",
    path: path.resolve(__dirname, "dist")
  }
}
