import { describe, expect, it, vi } from "vitest";
import { appNavigation, documentNavigation, requestAllowed, restrictSession } from "./next-runtime-policy";
import type { Session } from "electron";
const origin = "http://127.0.0.1:3100";
const document = `${origin}/api/matters/file?clientFolder=TEST&matterFolder=SDJ_ALPHA&relativePath=01%20ULAZ%2Fevidence.txt`;
describe("local Alpha navigation and request boundaries", () => {
  it("rejects external URLs, aliases, ports, credentials and API pages as app navigation", () => {
    for (const value of ["https://external.test", "http://localhost:3100/matters", "http://127.0.0.1:3101/matters", "file:///C:/x", "javascript:alert(1)", "http://user@127.0.0.1:3100/matters", document]) expect(appNavigation(value)).toBe(false);
    expect(appNavigation(`${origin}/matters/TEST/SDJ_ALPHA`)).toBe(true);
    expect(appNavigation(`${origin}/settings`)).toBe(true);
  });
  it("permits only valid source viewer routes, not other API or writable requests", () => {
    expect(documentNavigation(document)).toBe(true);
    expect(documentNavigation(document + "&extra=x")).toBe(false);
    expect(documentNavigation(`${origin}/api/matters/file?clientFolder=TEST&matterFolder=SDJ_ALPHA`)).toBe(false);
    expect(requestAllowed(document, "GET", "mainFrame", true)).toBe(true);
    expect(requestAllowed(document, "POST", "xhr", true)).toBe(false);
    expect(requestAllowed("chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/index.html", "GET", "mainFrame", true)).toBe(true);
    expect(requestAllowed("chrome-extension://untrusted/index.html", "GET", "mainFrame", true)).toBe(false);
    expect(requestAllowed("data:text/html,test", "GET", "mainFrame", true)).toBe(false);
    expect(requestAllowed(`${origin}/api/matters/next-step-review`, "POST", "xhr", true)).toBe(false);
  });
  it("preserves app fetch and previews but blocks external requests, downloads and filesystem-opening APIs", () => {
    expect(requestAllowed(`${origin}/api/matters/next-step-review`, "POST", "xhr", false)).toBe(true);
    expect(requestAllowed(`${origin}/_next/static/chunk.js`, "GET", "script", false)).toBe(true);
    expect(requestAllowed(document, "GET", "subFrame", false)).toBe(true);
    expect(requestAllowed(document, "GET", "mainFrame", false)).toBe(true);
    expect(appNavigation(document)).toBe(false);
    for (const value of ["https://external.test/a", `${origin}/api/matters/file`, `${origin}/api/matters/open-folder`, `${origin}/api/inbox/open-folder`]) expect(requestAllowed(value, "POST", "xhr", false)).toBe(false);
  });
  it("fails closed when runtime dies, and drains only tracked responses without reissuing writes", async () => {
    let usable = true;
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const session = { setPermissionRequestHandler: vi.fn(), setPermissionCheckHandler: vi.fn(), on: vi.fn(), webRequest: {
      onBeforeRequest: (fn: (...args: unknown[]) => unknown) => { handlers.before = fn; },
      onCompleted: (fn: (...args: unknown[]) => unknown) => { handlers.complete = fn; },
      onErrorOccurred: (fn: (...args: unknown[]) => unknown) => { handlers.error = fn; },
    } } as unknown as Session;
    const policy = restrictSession(session, () => usable, false);
    const callback = vi.fn();
    handlers.before({ id: 1, url: `${origin}/api/matters/next-step-review`, method: "POST", resourceType: "xhr" }, callback);
    expect(callback).toHaveBeenLastCalledWith({ cancel: false });
    expect(await policy.waitForMutations(1)).toBe(false);
    handlers.complete({ id: 1 });
    expect(await policy.waitForMutations(1)).toBe(true);
    usable = false;
    handlers.before({ id: 2, url: `${origin}/matters`, method: "GET", resourceType: "mainFrame" }, callback);
    expect(callback).toHaveBeenLastCalledWith({ cancel: true });
  });
});
