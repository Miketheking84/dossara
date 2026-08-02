import type { ForgeConfig } from "@electron-forge/shared-types";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

const DEVELOPMENT_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' ws://localhost:*",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {
    onlyModules: [],
  },
  makers: [],
  plugins: [
    new WebpackPlugin({
      mainConfig,
      packageSourceMaps: false,
      devContentSecurityPolicy: DEVELOPMENT_CSP,
      devServer: {
        host: "127.0.0.1",
        allowedHosts: ["localhost"],
      },
      renderer: {
        config: rendererConfig,
        nodeIntegration: false,
        entryPoints: [
          {
            name: "main_window",
            html: "./desktop/renderer/index.html",
            js: "./desktop/renderer/main.tsx",
            preload: {
              js: "./desktop/preload/index.ts",
            },
          },
        ],
      },
    }),
  ],
};

export default config;
