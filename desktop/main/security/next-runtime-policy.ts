import type { BrowserWindow, Session } from "electron";
import { NEXT_ORIGIN } from "../next-runtime";

const APP_PATHS = new Set(["/", "/matters", "/inbox", "/prompts", "/settings"]);
export function localUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.origin === NEXT_ORIGIN && !url.username && !url.password ? url : null;
  } catch { return null; }
}
export function appNavigation(value: string): boolean {
  const url = localUrl(value);
  return Boolean(url && (APP_PATHS.has(url.pathname) || /^\/matters\/[^/]+\/SDJ_[^/]+$/u.test(url.pathname)));
}
export function documentNavigation(value: string): boolean {
  const url = localUrl(value);
  return Boolean(url && url.pathname === "/api/matters/file" && url.searchParams.size === 3 &&
    ["clientFolder", "matterFolder", "relativePath"].every((key) => url.searchParams.get(key)));
}
export function requestAllowed(value: string, method: string, resourceType: string, viewer: boolean): boolean {
  // Chromium's bundled PDF component is non-network code. No arbitrary
  // extension, file URL or external host is permitted.
  try {
    const internal = new URL(value);
    if (method === "GET" && internal.protocol === "chrome-extension:" && internal.hostname === "mhjfbmdgcfjbbpaeojofohoefgiehjai" && !internal.port && !internal.username && !internal.password) return true;
    if (resourceType === "image" && (value.startsWith("data:image/") || value.startsWith(`blob:${NEXT_ORIGIN}/`))) return true;
  } catch { return false; }
  const url = localUrl(value);
  if (!url) return false;
  if (viewer) return method === "GET" && documentNavigation(value);
  // A permitted popup initial request can be observed in the opener session.
  // Top-level application navigation still rejects document URLs separately.
  if (resourceType === "mainFrame") return method === "GET" && (appNavigation(value) || documentNavigation(value));
  if (resourceType === "subFrame") return method === "GET" && documentNavigation(value);
  // Keep the existing app APIs; no desktop filesystem-opening escape hatches.
  if (method !== "GET" && ["/api/matters/file", "/api/matters/open-folder", "/api/inbox/open-folder"].includes(url.pathname)) return false;
  return url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/") || appNavigation(value) || url.pathname === "/favicon.ico";
}

export function restrictSession(session: Session, usable: () => boolean, viewer: boolean) {
  const active = new Set<number>();
  let disabled = false;
  session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.setPermissionCheckHandler(() => false);
  session.on("will-download", (event) => event.preventDefault());
  session.webRequest.onBeforeRequest((details, callback) => {
    const allowed = !disabled && usable() && requestAllowed(details.url, details.method, details.resourceType, viewer);
    if (allowed && details.method !== "GET" && details.method !== "HEAD") active.add(details.id);
    callback({ cancel: !allowed });
  });
  session.webRequest.onCompleted((details) => active.delete(details.id));
  session.webRequest.onErrorOccurred((details) => active.delete(details.id));
  return {
    disable() { disabled = true; },
    async waitForMutations(timeoutMs = 10000) {
      disabled = true;
      const deadline = Date.now() + timeoutMs;
      while (active.size && Date.now() < deadline) await new Promise<void>((resolve) => setTimeout(resolve, 100));
      return active.size === 0;
    },
  };
}

export function restrictNavigation(window: BrowserWindow, viewer: boolean) {
  const allowed = viewer ? documentNavigation : appNavigation;
  window.webContents.on("will-navigate", (event, url) => { if (!allowed(url)) event.preventDefault(); });
  window.webContents.on("will-redirect", (event, url) => { if (!allowed(url)) event.preventDefault(); });
  window.webContents.on("will-frame-navigate", (event) => {
    if (!(event.isMainFrame ? allowed(event.url) : documentNavigation(event.url))) event.preventDefault();
  });
  window.webContents.on("will-attach-webview", (event) => event.preventDefault());
}
