import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CONFIG_DIRECTORY = path.join(process.cwd(), ".sdj-mike");
const CONFIG_PATH = path.join(CONFIG_DIRECTORY, "settings.json");

export const WORKSPACE_NOT_CONFIGURED_MESSAGE =
  "Workspace nije konfigurisan. Verifikujte test root u Settings.";

type WorkspaceSettings = {
  allowedTestRoot: string;
  activeRootPath?: string;
};

function normalizeWindowsPath(value: string) {
  const normalized = path.win32.normalize(value.trim());
  const parsed = path.win32.parse(normalized);
  return normalized.length > parsed.root.length
    ? normalized.replace(/[\\/]+$/g, "")
    : normalized;
}

function sameWindowsPath(left: string, right: string) {
  return normalizeWindowsPath(left).toLocaleLowerCase("en-US") ===
    normalizeWindowsPath(right).toLocaleLowerCase("en-US");
}

async function readSettings(): Promise<WorkspaceSettings> {
  let raw: string;
  try {
    raw = await readFile(CONFIG_PATH, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(WORKSPACE_NOT_CONFIGURED_MESSAGE);
    }
    throw error;
  }

  try {
    const value = JSON.parse(raw) as Partial<WorkspaceSettings>;
    if (
      typeof value.allowedTestRoot !== "string" ||
      !path.win32.isAbsolute(value.allowedTestRoot)
    ) {
      throw new Error();
    }
    return {
      allowedTestRoot: normalizeWindowsPath(value.allowedTestRoot),
      activeRootPath:
        typeof value.activeRootPath === "string"
          ? normalizeWindowsPath(value.activeRootPath)
          : undefined,
    };
  } catch {
    throw new Error(
      "Lokalna workspace konfiguracija nije validna. Proverite .sdj-mike/settings.json.",
    );
  }
}

export async function validateAllowedTestRoot(rootPath: string) {
  if (!path.win32.isAbsolute(rootPath)) {
    throw new Error("Root folder path mora biti apsolutna Windows putanja.");
  }

  const settings = await readSettings();
  const normalizedRoot = normalizeWindowsPath(rootPath);
  if (!sameWindowsPath(normalizedRoot, settings.allowedTestRoot)) {
    throw new Error("Dozvoljen je isključivo konfigurisani SDJ MIKE test root.");
  }
  return normalizedRoot;
}

export async function saveActiveWorkspaceRoot(rootPath: string) {
  const normalizedRoot = await validateAllowedTestRoot(rootPath);
  const settings = await readSettings();
  await mkdir(CONFIG_DIRECTORY, { recursive: true });
  await writeFile(
    CONFIG_PATH,
    `${JSON.stringify(
      { ...settings, activeRootPath: normalizedRoot },
      null,
      2,
    )}\n`,
    { encoding: "utf8" },
  );
}

export async function getActiveWorkspaceRoot() {
  const settings = await readSettings();
  if (
    !settings.activeRootPath ||
    !sameWindowsPath(settings.activeRootPath, settings.allowedTestRoot)
  ) {
    throw new Error(WORKSPACE_NOT_CONFIGURED_MESSAGE);
  }
  return settings.activeRootPath;
}

export async function getClientsRoot() {
  return path.win32.join(await getActiveWorkspaceRoot(), "01 KLIJENTI");
}
