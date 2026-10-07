import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertOwnedListener, parseListeners, validateSettings, TEST_ROOT, validateRuntimeInputs, listeners, resolveRuntimeRoot, RUNTIME_ROOT, NEXT_ORIGIN } from "./next-runtime";
describe("owned Next local startup boundaries", () => {
  it("rejects missing or differing root settings instead of opening another workspace", () => {
    for (const value of [null, {}, { allowedTestRoot: TEST_ROOT }, { allowedTestRoot: TEST_ROOT, activeRootPath: "C:\\NOT_ALLOWED" }, { allowedTestRoot: "C:\\OTHER", activeRootPath: TEST_ROOT }]) expect(() => validateSettings(value)).toThrow();
    expect(() => validateSettings({ allowedTestRoot: TEST_ROOT, activeRootPath: TEST_ROOT })).not.toThrow();
  });
  it("detects occupied wildcard/IPv6 listeners and refuses a foreign or duplicated owner", () => {
    const entries = parseListeners(" TCP 0.0.0.0:3100 0.0.0.0:0 LISTENING 123\r\n TCP [::]:3100 [::]:0 LISTENING 123\r\n TCP 127.0.0.1:3100 127.0.0.1:5555 ESTABLISHED 123");
    expect(entries).toHaveLength(2); expect(() => assertOwnedListener(entries, 123)).toThrow();
    expect(() => assertOwnedListener([{ address: "127.0.0.1:3100", pid: 999 }], 123)).toThrow();
    expect(() => assertOwnedListener([], 123)).toThrow();
    expect(() => assertOwnedListener([{ address: "127.0.0.1:3100", pid: 123 }], 123)).not.toThrow();
  });
  it("reads real local approved assets and listener snapshot without starting a writer", async () => {
    const cli = await validateRuntimeInputs(); expect(cli).toMatch(/node_modules[\\/]next[\\/]dist[\\/]bin[\\/]next$/u);
    expect(Array.isArray(await listeners())).toBe(true);
  }, 20000);
});


describe("explicit Stage F candidate checkout", () => {
  it("keeps the default pinned root and loopback unchanged", async () => {
    expect(await resolveRuntimeRoot({})).toBe("C:\\SDJ_TOOLS\\sdj-mike-v1");
    expect(await resolveRuntimeRoot({ DOSSARA_TEST_PROFILE: "1" })).toBe(RUNTIME_ROOT);
    expect(NEXT_ORIGIN).toBe("http://127.0.0.1:3100");
  });
  it("accepts a real test-root candidate and rejects malformed, outside, missing and redirected roots", async () => {
    const fixture = await mkdtemp(path.join(TEST_ROOT, "stage-f-path-"));
    const env = (candidate: string) => ({ DOSSARA_TEST_PROFILE: "1", DOSSARA_STAGE_F_CANDIDATE_SOURCE: candidate });
    try {
      const source = path.join(fixture, "source"); await mkdir(source);
      expect(await resolveRuntimeRoot(env(source))).toBe(await import("node:fs/promises").then(fs => fs.realpath(source)));
      await expect(resolveRuntimeRoot({ DOSSARA_STAGE_F_CANDIDATE_SOURCE: source })).rejects.toThrow();
      for (const value of ["", " ", "source", "C:source", RUNTIME_ROOT, TEST_ROOT, `${TEST_ROOT}-other\\source`,
        path.join(fixture, "missing"), `${fixture}\\..\\source`, `${fixture}\\.\\source`, `${source}.`, `${source} `, "\\\\server\\share", `${fixture}\\bad:stream`]) {
        await expect(resolveRuntimeRoot(env(value))).rejects.toThrow();
      }
      const file = path.join(fixture, "not-a-directory"); await writeFile(file, "test");
      await expect(resolveRuntimeRoot(env(file))).rejects.toThrow();
      const redirected = path.join(fixture, "redirected"); await symlink(source, redirected, "junction");
      await expect(resolveRuntimeRoot(env(redirected))).rejects.toThrow();
      await expect(resolveRuntimeRoot(env(path.join(redirected, "nested")))).rejects.toThrow();
    } finally {
      if (path.relative(TEST_ROOT, fixture).startsWith("stage-f-path-")) await rm(fixture, { recursive: true, force: true });
    }
  });
});
