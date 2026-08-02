import { app, ipcMain, type BrowserWindow } from "electron";

import {
  SYSTEM_GET_APP_INFO_CHANNEL,
  type AppInfo,
} from "../../shared/contracts";
import { assertTrustedMainWindowSender } from "../security/validate-sender";

export function registerSystemIpc(
  mainWindow: BrowserWindow,
  expectedRendererUrl: string,
): void {
  ipcMain.handle(SYSTEM_GET_APP_INFO_CHANNEL, (event): AppInfo => {
    assertTrustedMainWindowSender(event, mainWindow, expectedRendererUrl);

    return {
      appName: app.getName(),
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      chromiumVersion: process.versions.chrome,
      platform: process.platform,
    };
  });
}

export function unregisterSystemIpc(): void {
  ipcMain.removeHandler(SYSTEM_GET_APP_INFO_CHANNEL);
}
