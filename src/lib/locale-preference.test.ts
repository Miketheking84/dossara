import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createLocalePreferenceStore } from "./locale-preference-store";

const nodeDependencies = {
  readFile: (candidate: string, encoding: "utf8") => readFile(candidate, encoding),
  mkdir: (candidate: string, options: { recursive: true }) => mkdir(candidate, options),
  writeFile: (candidate: string, content: string, options: { encoding: "utf8"; flag: "wx" }) => writeFile(candidate, content, options),
  rename,
  rm: (candidate: string, options: { force: true }) => rm(candidate, options),
  dirname: path.dirname,
  basename: path.basename,
  join: path.join,
  randomUUID,
};

describe("locale preference store", () => {
  let tempRoot: string;
  let settingsPath: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(tmpdir(), "sdj-locale-preference-"));
    settingsPath = path.join(tempRoot, ".sdj-mike", "settings.json");
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  async function writeLegacySettings() {
    await mkdir(path.dirname(settingsPath), { recursive: true });
    await writeFile(settingsPath, JSON.stringify({
      allowedTestRoot: "C:\\SDJ_TEST\\SDJ_LEGAL_TEST",
      activeRootPath: "C:\\SDJ_TEST\\SDJ_LEGAL_TEST",
    }), "utf8");
  }

  it("treats a legacy Settings file without uiLocale as no saved locale", async () => {
    await writeLegacySettings();

    await expect(createLocalePreferenceStore(settingsPath, nodeDependencies).getLocale()).resolves.toBeNull();
  });

  it("preserves existing and future Settings values when it saves and reads a locale", async () => {
    await writeLegacySettings();
    const legacy = JSON.parse(await readFile(settingsPath, "utf8"));
    await writeFile(settingsPath, JSON.stringify({ ...legacy, futureSetting: { preserve: true } }), "utf8");
    const store = createLocalePreferenceStore(settingsPath, nodeDependencies);

    await store.setLocale("en");

    expect(JSON.parse(await readFile(settingsPath, "utf8"))).toEqual({
      allowedTestRoot: "C:\\SDJ_TEST\\SDJ_LEGAL_TEST",
      activeRootPath: "C:\\SDJ_TEST\\SDJ_LEGAL_TEST",
      futureSetting: { preserve: true },
      uiLocale: "en",
    });
    await expect(store.getLocale()).resolves.toBe("en");
  });

  it("rejects unsupported locale values without writing", async () => {
    const store = createLocalePreferenceStore(settingsPath, nodeDependencies);
    await expect(store.setLocale("sr" as never)).rejects.toThrow("INVALID_LOCALE");
    await expect(store.getLocale()).resolves.toBeNull();
  });

  it("keeps the previous Settings file when the temporary write fails", async () => {
    await writeLegacySettings();
    const writeFailureDependencies = {
      ...nodeDependencies,
      writeFile: async () => { throw new Error("WRITE_FAILED"); },
    };

    await expect(createLocalePreferenceStore(settingsPath, writeFailureDependencies).setLocale("en")).rejects.toThrow("WRITE_FAILED");
    expect(JSON.parse(await readFile(settingsPath, "utf8"))).not.toHaveProperty("uiLocale");
  });
});
