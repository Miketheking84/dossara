import "server-only";

import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import {
  getActiveWorkspaceRoot,
  getClientsRoot,
} from "@/lib/sdj-workspace";

export const MATTER_RESOLUTION_ERROR_CODES = [
  "INVALID_CLIENT_FOLDER",
  "INVALID_MATTER_FOLDER",
  "CLIENT_NOT_FOUND",
  "MATTER_NOT_FOUND",
  "CLIENT_OUTSIDE_WORKSPACE",
  "MATTER_OUTSIDE_CLIENT",
  "MATTER_NOT_ACTIVE",
  "UNSAFE_FILESYSTEM_TARGET",
] as const;

export type MatterResolutionErrorCode =
  (typeof MATTER_RESOLUTION_ERROR_CODES)[number];

export class MatterResolutionError extends Error {
  readonly code: MatterResolutionErrorCode;

  constructor(
    code: MatterResolutionErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "MatterResolutionError";
    this.code = code;
  }
}

export type ResolvedActiveMatter = {
  workspaceRoot: string;
  clientsRoot: string;
  clientFolder: string;
  clientPath: string;
  matterFolder: string;
  matterPath: string;
  controlPath: string;
  ulazPath: string;
  radnoPath: string;
  finalnoPath: string;
  aiPath: string;
};

const WINDOWS_INVALID_SEGMENT_CHARACTERS = /[<>:"/\\|?*\u0000-\u001f\u007f]/;
const WINDOWS_DEVICE_NAME =
  /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/i;

function isPlainWindowsFolderSegment(value: string) {
  return (
    value.length > 0 &&
    value === value.trim() &&
    value !== "." &&
    value !== ".." &&
    !value.endsWith(".") &&
    !WINDOWS_INVALID_SEGMENT_CHARACTERS.test(value) &&
    !WINDOWS_DEVICE_NAME.test(value) &&
    !/^[a-z]:/i.test(value) &&
    !path.win32.isAbsolute(value)
  );
}

function isDirectChild(parent: string, candidate: string) {
  const relative = path.win32.relative(parent, candidate);
  return (
    relative.length > 0 &&
    relative !== "." &&
    relative !== ".." &&
    !relative.startsWith(`..${path.win32.sep}`) &&
    !path.win32.isAbsolute(relative) &&
    !relative.includes(path.win32.sep)
  );
}

function isWithin(parent: string, candidate: string) {
  const relative = path.win32.relative(parent, candidate);
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.win32.sep}`) &&
      !path.win32.isAbsolute(relative))
  );
}

function sameWindowsPath(left: string, right: string) {
  return (
    path.win32.normalize(left).toLocaleLowerCase("en-US") ===
    path.win32.normalize(right).toLocaleLowerCase("en-US")
  );
}

async function requireDirectory(
  candidate: string,
  notFoundCode: "CLIENT_NOT_FOUND" | "MATTER_NOT_FOUND",
  notFoundMessage: string,
) {
  try {
    const info = await stat(candidate);
    if (!info.isDirectory()) {
      throw new MatterResolutionError(notFoundCode, notFoundMessage);
    }
  } catch (error) {
    if (error instanceof MatterResolutionError) throw error;
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      throw new MatterResolutionError(notFoundCode, notFoundMessage, {
        cause: error,
      });
    }
    throw new MatterResolutionError(
      "UNSAFE_FILESYSTEM_TARGET",
      "Filesystem cilj nije moguće bezbjedno provjeriti.",
      { cause: error },
    );
  }
}

async function requireRealPath(
  candidate: string,
  notFoundCode: "CLIENT_NOT_FOUND" | "MATTER_NOT_FOUND",
  notFoundMessage: string,
) {
  try {
    return await realpath(candidate);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      throw new MatterResolutionError(notFoundCode, notFoundMessage, {
        cause: error,
      });
    }
    throw new MatterResolutionError(
      "UNSAFE_FILESYSTEM_TARGET",
      "Filesystem cilj nije moguće bezbjedno razriješiti.",
      { cause: error },
    );
  }
}

export async function resolveActiveMatter(
  clientFolder: string,
  matterFolder: string,
): Promise<ResolvedActiveMatter> {
  if (!isPlainWindowsFolderSegment(clientFolder)) {
    throw new MatterResolutionError(
      "INVALID_CLIENT_FOLDER",
      "Naziv klijentskog foldera nije validan.",
    );
  }
  if (!isPlainWindowsFolderSegment(matterFolder)) {
    throw new MatterResolutionError(
      "INVALID_MATTER_FOLDER",
      "Naziv matter foldera nije validan.",
    );
  }
  if (!matterFolder.startsWith("SDJ_")) {
    throw new MatterResolutionError(
      "MATTER_NOT_ACTIVE",
      "Izabrani folder nije aktivni matter folder.",
    );
  }

  const [workspaceRoot, clientsRoot] = await Promise.all([
    getActiveWorkspaceRoot(),
    getClientsRoot(),
  ]);
  const expectedClientsRoot = path.win32.join(workspaceRoot, "01 KLIJENTI");
  if (!sameWindowsPath(clientsRoot, expectedClientsRoot)) {
    throw new MatterResolutionError(
      "UNSAFE_FILESYSTEM_TARGET",
      "Aktivni clients folder nije moguće bezbjedno potvrditi.",
    );
  }

  const clientPath = path.win32.join(clientsRoot, clientFolder);
  if (!isDirectChild(clientsRoot, clientPath)) {
    throw new MatterResolutionError(
      "CLIENT_OUTSIDE_WORKSPACE",
      "Klijentski folder nije direktno unutar aktivnog workspacea.",
    );
  }

  const matterPath = path.win32.join(clientPath, matterFolder);
  if (!isDirectChild(clientPath, matterPath)) {
    throw new MatterResolutionError(
      "MATTER_OUTSIDE_CLIENT",
      "Matter folder nije direktno unutar izabranog klijenta.",
    );
  }

  await requireDirectory(
    clientPath,
    "CLIENT_NOT_FOUND",
    "Izabrani klijentski folder ne postoji.",
  );
  await requireDirectory(
    matterPath,
    "MATTER_NOT_FOUND",
    "Izabrani matter folder ne postoji.",
  );

  let realWorkspaceRoot: string;
  let realClientsRoot: string;
  try {
    [realWorkspaceRoot, realClientsRoot] = await Promise.all([
      realpath(workspaceRoot),
      realpath(clientsRoot),
    ]);
  } catch (error) {
    throw new MatterResolutionError(
      "UNSAFE_FILESYSTEM_TARGET",
      "Aktivni workspace nije moguće bezbjedno razriješiti.",
      { cause: error },
    );
  }

  if (!isDirectChild(realWorkspaceRoot, realClientsRoot)) {
    throw new MatterResolutionError(
      "UNSAFE_FILESYSTEM_TARGET",
      "Aktivni clients folder nije direktno unutar workspacea.",
    );
  }

  const realClientPath = await requireRealPath(
    clientPath,
    "CLIENT_NOT_FOUND",
    "Izabrani klijentski folder ne postoji.",
  );
  if (!isDirectChild(realClientsRoot, realClientPath)) {
    throw new MatterResolutionError(
      "CLIENT_OUTSIDE_WORKSPACE",
      "Klijentski folder vodi izvan aktivnog workspacea.",
    );
  }

  const realMatterPath = await requireRealPath(
    matterPath,
    "MATTER_NOT_FOUND",
    "Izabrani matter folder ne postoji.",
  );
  if (!isDirectChild(realClientPath, realMatterPath)) {
    throw new MatterResolutionError(
      "MATTER_OUTSIDE_CLIENT",
      "Matter folder vodi izvan izabranog klijenta.",
    );
  }
  if (!isWithin(realClientsRoot, realMatterPath)) {
    throw new MatterResolutionError(
      "UNSAFE_FILESYSTEM_TARGET",
      "Matter folder vodi izvan aktivnog workspacea.",
    );
  }

  return {
    workspaceRoot,
    clientsRoot,
    clientFolder,
    clientPath,
    matterFolder,
    matterPath,
    controlPath: path.win32.join(matterPath, "00 CONTROL"),
    ulazPath: path.win32.join(matterPath, "01 ULAZ"),
    radnoPath: path.win32.join(matterPath, "02 RADNO"),
    finalnoPath: path.win32.join(matterPath, "03 FINALNO"),
    aiPath: path.win32.join(matterPath, "04 AI"),
  };
}
