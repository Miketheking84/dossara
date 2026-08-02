import path from "node:path";

import type { ModuleOptions } from "webpack";

const DESKTOP_TSCONFIG_PATH = path.resolve(__dirname, "tsconfig.desktop.json");

export const rules: Required<ModuleOptions>["rules"] = [
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: "ts-loader",
      options: {
        configFile: DESKTOP_TSCONFIG_PATH,
        transpileOnly: true,
        compilerOptions: {
          noEmit: false,
        },
      },
    },
  },
];
