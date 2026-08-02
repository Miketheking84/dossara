import type { Configuration } from "webpack";

import { rules } from "./webpack.rules";

export const rendererConfig: Configuration = {
  target: "web",
  devtool: "source-map",
  module: {
    rules: [
      ...rules,
      {
        test: /\.css$/,
        oneOf: [
          {
            resourceQuery: /sheet/,
            use: [
              {
                loader: "css-loader",
                options: {
                  exportType: "css-style-sheet",
                },
              },
            ],
          },
          {
            use: ["style-loader", "css-loader"],
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
  },
};
