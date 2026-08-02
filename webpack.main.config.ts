import type { Configuration } from "webpack";

import { rules } from "./webpack.rules";

export const mainConfig: Configuration = {
  entry: "./desktop/main/index.ts",
  target: "electron-main",
  devtool: "source-map",
  module: {
    rules,
  },
  resolve: {
    extensions: [".js", ".ts", ".json"],
  },
};
