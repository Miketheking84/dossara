import { app, BrowserWindow } from "electron";

import { registerSystemIpc, unregisterSystemIpc } from "./ipc/system.ipc";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

app.enableSandbox();

const hasSingleInstanceLock = app.requestSingleInstanceLock();
let mainWindow: BrowserWindow | null = null;

function focusMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
}

function createMainWindow(): BrowserWindow {
  const expectedRendererUrl = new URL(MAIN_WINDOW_WEBPACK_ENTRY).href;
  const window = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 720,
    minHeight: 520,
    show: false,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  mainWindow = window;
  registerSystemIpc(window, expectedRendererUrl);

  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, targetUrl) => {
    if (targetUrl !== expectedRendererUrl) {
      event.preventDefault();
    }
  });
  window.webContents.on("will-redirect", (event, targetUrl) => {
    if (targetUrl !== expectedRendererUrl) {
      event.preventDefault();
    }
  });

  window.once("ready-to-show", () => {
    window.show();
  });
  window.once("closed", () => {
    unregisterSystemIpc();
    if (mainWindow === window) {
      mainWindow = null;
    }
  });

  void window.loadURL(expectedRendererUrl);
  return window;
}

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", focusMainWindow);

  void app.whenReady().then(() => {
    createMainWindow();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      focusMainWindow();
    }
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
