const path = require("path")

module.exports = {
  mode: "development",
  entry: "./src/renderer.ts",
  devtool: "source-map",
  module: {
    rules: [
      {
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: "tsconfig.json"
            }
          }
        ],
        include: /src/
      }
    ]
  },
  resolve: {
    extensions: [ ".ts", ".js" ]
  },
  optimization: {
    minimize: false
  },
  output: {
    filename: "renderer.js",
    path: path.resolve(__dirname, "dist")
  }
}
