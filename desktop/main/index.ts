import { app, BrowserWindow, dialog, session } from "electron";
import { randomUUID } from "node:crypto";
import { OwnedNextRuntime, NEXT_ORIGIN, prepareTestProfile } from "./next-runtime";
import { documentNavigation, restrictNavigation, restrictSession } from "./security/next-runtime-policy";

import { registerSystemIpc, unregisterSystemIpc } from "./ipc/system.ipc";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

app.enableSandbox();

const alphaMode = process.env.DOSSARA_ALPHA === "1";
let setupError: Error | undefined;
if (alphaMode || process.env.DOSSARA_TEST_PROFILE === "1") {
  try {
    const profile = prepareTestProfile();
    app.setPath("userData", profile);
    app.setPath("sessionData", profile);
  } catch (error) { setupError = error instanceof Error ? error : new Error(String(error)); }
}
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

let runtime: OwnedNextRuntime | undefined;
let appPolicy: ReturnType<typeof restrictSession> | undefined;
let quitting = false;
let startup: Promise<void> | undefined;

function runtimeFailure(error: Error): void {
  console.error("DOSSARA_ALPHA_FAILED", error.message);
  appPolicy?.disable();
  for (const window of BrowserWindow.getAllWindows()) window.hide();
  if (!quitting) {
    void dialog.showMessageBox({ type: "error", title: "DOSSARA — local runtime stopped", message: error.message,
      detail: "No legal operation will be retried automatically. Restart explicitly and use the existing Alpha recovery workflow if necessary." }).then(() => app.quit());
  }
}

function createAlphaWindow(): void {
  if (!runtime?.usable || quitting) return;
  const appSession = session.fromPartition("dossara-alpha-app");
  appPolicy ??= restrictSession(appSession, () => Boolean(runtime?.usable) && !quitting, false);
  const window = new BrowserWindow({
    width: 1200, height: 850, minWidth: 720, minHeight: 520, show: false,
    webPreferences: { session: appSession, nodeIntegration: false, contextIsolation: true, sandbox: true,
      webSecurity: true, allowRunningInsecureContent: false },
  });
  mainWindow = window;
  restrictNavigation(window, false);
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (!runtime?.usable || quitting || !documentNavigation(url)) return { action: "deny" };
    const viewerSession = session.fromPartition(`dossara-alpha-document-${randomUUID()}`);
    restrictSession(viewerSession, () => Boolean(runtime?.usable) && !quitting, true);
    return { action: "allow", overrideBrowserWindowOptions: {
      width: 960, height: 720, parent: window,
      webPreferences: { session: viewerSession, nodeIntegration: false, contextIsolation: true, sandbox: true,
        webSecurity: true, allowRunningInsecureContent: false },
    } };
  });
  window.webContents.on("did-create-window", (viewer) => {
    restrictNavigation(viewer, true);
    viewer.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  });
  window.once("ready-to-show", () => window.show());
  window.on("close", (event) => { if (!quitting) { event.preventDefault(); app.quit(); } });
  window.once("closed", () => { if (mainWindow === window) mainWindow = null; });
  void window.loadURL(`${NEXT_ORIGIN}/matters`).catch(runtimeFailure);
}

async function startAlpha(): Promise<void> {
  try {
    if (setupError) throw setupError;
    runtime = new OwnedNextRuntime(runtimeFailure);
    await runtime.start();
    createAlphaWindow();
  } catch (error) { runtimeFailure(error instanceof Error ? error : new Error(String(error))); }
}

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => { console.log("DOSSARA_SECOND_INSTANCE"); focusMainWindow(); });
  void app.whenReady().then(() => {
    if (alphaMode) { startup = startAlpha(); }
    else if (setupError) runtimeFailure(setupError);
    else createMainWindow();
  });
  app.on("activate", () => {
    if (quitting) return;
    if (BrowserWindow.getAllWindows().length === 0) {
      if (alphaMode) createAlphaWindow(); else createMainWindow();
    } else focusMainWindow();
  });
}

app.on("before-quit", (event) => {
  if (!alphaMode || !hasSingleInstanceLock) return;
  event.preventDefault();
  if (quitting) return;
  quitting = true;
  mainWindow?.hide();
  void (async () => {
    try {
      // Closing the UI does not promise server-side draining. Completed responses
      // are allowed to finish before terminating; uncertainty uses durable recovery.
      if (appPolicy && !await appPolicy.waitForMutations()) console.error("DOSSARA_ALPHA_INTERRUPTED: mutation response did not finish before shutdown");
      await startup;
      for (const window of BrowserWindow.getAllWindows()) window.destroy();
      await runtime?.stop();
    } catch (error) { console.error("DOSSARA_ALPHA_SHUTDOWN_FAILED", String(error)); }
    finally { app.exit(0); }
  })();
});
app.on("window-all-closed", () => {
  if (alphaMode && quitting) return;
  if (process.platform !== "darwin") app.quit();
});
