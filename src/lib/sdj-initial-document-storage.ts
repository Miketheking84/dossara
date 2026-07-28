import type { Stats } from "node:fs";
import {
  lstat as nodeLstat,
  mkdir as nodeMkdir,
  realpath as nodeRealpath,
  rm as nodeRm,
  writeFile as nodeWriteFile,
} from "node:fs/promises";
import path from "node:path";

export const INITIAL_DOCUMENT_STORAGE_RELATIVE_FOLDER =
  "01 ULAZ/00 INITIAL INTAKE" as const;

const INTAKE_FOLDER_NAME = "00 INITIAL INTAKE";
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;
const STAGING_FOLDER_NAME =
  /^\.sdj-mike-staging-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WINDOWS_RESERVED_BASE_NAME =
  /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

export type StagedInitialDocument = Readonly<{
  file: File;
  normalizedName: string;
  size: number;
}>;

export type InitialDocumentStorageError =
  | "INVALID_STAGING_STRUCTURE"
  | "INTAKE_ALREADY_EXISTS"
  | "INVALID_DOCUMENT_CONTRACT"
  | "DOCUMENT_READ_FAILED"
  | "DOCUMENT_SIZE_MISMATCH"
  | "DOCUMENT_WRITE_FAILED";

export type InitialDocumentStorageResult =
  | Readonly<{
      ok: true;
      savedCount: number;
      relativeFolder:
        | typeof INITIAL_DOCUMENT_STORAGE_RELATIVE_FOLDER
        | null;
    }>
  | Readonly<{
      ok: false;
      error: InitialDocumentStorageError;
      cleanupFailed: boolean;
    }>;

type DirectoryInfo = Pick<Stats, "isDirectory" | "isSymbolicLink">;

export type InitialDocumentStorageDependencies = Readonly<{
  lstat(candidate: string): Promise<DirectoryInfo>;
  realpath(candidate: string): Promise<string>;
  mkdir(candidate: string): Promise<unknown>;
  writeFile(
    destination: string,
    data: Uint8Array,
    options: Readonly<{ flag: "wx" }>,
  ): Promise<unknown>;
  bufferFrom(arrayBuffer: ArrayBuffer): Uint8Array;
  rm(
    candidate: string,
    options: Readonly<{ recursive: true; force: true }>,
  ): Promise<unknown>;
}>;

const DEFAULT_STORAGE_DEPENDENCIES: InitialDocumentStorageDependencies = {
  lstat: nodeLstat,
  realpath: nodeRealpath,
  mkdir: nodeMkdir,
  writeFile: nodeWriteFile,
  bufferFrom: Buffer.from,
  rm: nodeRm,
};

function samePath(left: string, right: string) {
  const normalizedLeft = path.resolve(left);
  const normalizedRight = path.resolve(right);
  return process.platform === "win32"
    ? normalizedLeft.toLocaleLowerCase("en-US") ===
        normalizedRight.toLocaleLowerCase("en-US")
    : normalizedLeft === normalizedRight;
}

function isDirectChild(parent: string, candidate: string) {
  const relative = path.relative(parent, candidate);
  return (
    relative.length > 0 &&
    relative !== "." &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative) &&
    !relative.includes(path.sep)
  );
}

function isSafeDocumentName(normalizedName: string) {
  const baseName = normalizedName.split(".", 1)[0];
  return (
    normalizedName.trim().length > 0 &&
    normalizedName !== "." &&
    normalizedName !== ".." &&
    !normalizedName.endsWith(".") &&
    !normalizedName.endsWith(" ") &&
    !WINDOWS_RESERVED_BASE_NAME.test(baseName) &&
    !normalizedName.includes("/") &&
    !normalizedName.includes("\\") &&
    !normalizedName.includes(":") &&
    !CONTROL_CHARACTER.test(normalizedName) &&
    !path.isAbsolute(normalizedName) &&
    !path.win32.isAbsolute(normalizedName) &&
    !path.posix.isAbsolute(normalizedName)
  );
}

function hasValidDocumentContract(document: StagedInitialDocument) {
  return (
    typeof document === "object" &&
    document !== null &&
    typeof document.normalizedName === "string" &&
    isSafeDocumentName(document.normalizedName) &&
    typeof document.size === "number" &&
    Number.isSafeInteger(document.size) &&
    document.size >= 0 &&
    typeof document.file === "object" &&
    document.file !== null &&
    typeof document.file.arrayBuffer === "function"
  );
}

async function requirePlainDirectory(
  candidate: string,
  dependencies: InitialDocumentStorageDependencies,
) {
  const info = await dependencies.lstat(candidate);
  return info.isDirectory() && !info.isSymbolicLink();
}

async function cleanupFailure(
  error: InitialDocumentStorageError,
  intakePath: string,
  dependencies: InitialDocumentStorageDependencies,
): Promise<InitialDocumentStorageResult> {
  try {
    await dependencies.rm(intakePath, { recursive: true, force: true });
    return { ok: false, error, cleanupFailed: false };
  } catch {
    return { ok: false, error, cleanupFailed: true };
  }
}

/** @internal Test-only dependency injection entry point. */
export async function storeInitialDocumentsInStagingWithDependencies(
  {
    stagingMatterPath,
    documents,
  }: Readonly<{
    stagingMatterPath: string;
    documents: readonly StagedInitialDocument[];
  }>,
  dependencies: InitialDocumentStorageDependencies,
): Promise<InitialDocumentStorageResult> {
  if (documents.length === 0) {
    return { ok: true, savedCount: 0, relativeFolder: null };
  }

  if (
    typeof stagingMatterPath !== "string" ||
    !path.isAbsolute(stagingMatterPath)
  ) {
    return {
      ok: false,
      error: "INVALID_STAGING_STRUCTURE",
      cleanupFailed: false,
    };
  }

  if (!documents.every(hasValidDocumentContract)) {
    return {
      ok: false,
      error: "INVALID_DOCUMENT_CONTRACT",
      cleanupFailed: false,
    };
  }

  let realStagingPath: string;
  let realUlazPath: string;
  const expectedUlazPath = path.join(stagingMatterPath, "01 ULAZ");

  try {
    if (
      !(await requirePlainDirectory(stagingMatterPath, dependencies)) ||
      !(await requirePlainDirectory(expectedUlazPath, dependencies))
    ) {
      return {
        ok: false,
        error: "INVALID_STAGING_STRUCTURE",
        cleanupFailed: false,
      };
    }

    realStagingPath = await dependencies.realpath(stagingMatterPath);
    realUlazPath = await dependencies.realpath(expectedUlazPath);
  } catch {
    return {
      ok: false,
      error: "INVALID_STAGING_STRUCTURE",
      cleanupFailed: false,
    };
  }

  if (
    !samePath(stagingMatterPath, realStagingPath) ||
    !STAGING_FOLDER_NAME.test(path.basename(realStagingPath)) ||
    !samePath(expectedUlazPath, realUlazPath) ||
    !isDirectChild(realStagingPath, realUlazPath)
  ) {
    return {
      ok: false,
      error: "INVALID_STAGING_STRUCTURE",
      cleanupFailed: false,
    };
  }

  const intakePath = path.join(realUlazPath, INTAKE_FOLDER_NAME);
  if (!isDirectChild(realUlazPath, intakePath)) {
    return {
      ok: false,
      error: "INVALID_STAGING_STRUCTURE",
      cleanupFailed: false,
    };
  }

  try {
    await dependencies.mkdir(intakePath);
  } catch (error) {
    return {
      ok: false,
      error:
        (error as NodeJS.ErrnoException).code === "EEXIST"
          ? "INTAKE_ALREADY_EXISTS"
          : "INVALID_STAGING_STRUCTURE",
      cleanupFailed: false,
    };
  }

  let realIntakePath: string;
  try {
    if (!(await requirePlainDirectory(intakePath, dependencies))) {
      return cleanupFailure(
        "INVALID_STAGING_STRUCTURE",
        intakePath,
        dependencies,
      );
    }
    realIntakePath = await dependencies.realpath(intakePath);
  } catch {
    return cleanupFailure(
      "INVALID_STAGING_STRUCTURE",
      intakePath,
      dependencies,
    );
  }

  if (
    !samePath(intakePath, realIntakePath) ||
    !isDirectChild(realUlazPath, realIntakePath)
  ) {
    return cleanupFailure(
      "INVALID_STAGING_STRUCTURE",
      intakePath,
      dependencies,
    );
  }

  let savedCount = 0;
  for (const document of documents) {
    const destination = path.join(realIntakePath, document.normalizedName);
    if (
      !isDirectChild(realIntakePath, destination) ||
      path.basename(destination) !== document.normalizedName
    ) {
      return cleanupFailure(
        "INVALID_DOCUMENT_CONTRACT",
        intakePath,
        dependencies,
      );
    }

    let data: Uint8Array;
    try {
      const arrayBuffer: unknown = await document.file.arrayBuffer();
      if (!(arrayBuffer instanceof ArrayBuffer)) {
        throw new TypeError("Invalid arrayBuffer result.");
      }
      if (arrayBuffer.byteLength !== document.size) {
        return cleanupFailure(
          "DOCUMENT_SIZE_MISMATCH",
          intakePath,
          dependencies,
        );
      }
      data = dependencies.bufferFrom(arrayBuffer);
    } catch {
      return cleanupFailure(
        "DOCUMENT_READ_FAILED",
        intakePath,
        dependencies,
      );
    }

    try {
      await dependencies.writeFile(destination, data, {
        flag: "wx",
      });
    } catch {
      return cleanupFailure(
        "DOCUMENT_WRITE_FAILED",
        intakePath,
        dependencies,
      );
    }

    savedCount += 1;
  }

  return {
    ok: true,
    savedCount,
    relativeFolder: INITIAL_DOCUMENT_STORAGE_RELATIVE_FOLDER,
  };
}

export async function storeInitialDocumentsInStaging(
  input: Readonly<{
    stagingMatterPath: string;
    documents: readonly StagedInitialDocument[];
  }>,
): Promise<InitialDocumentStorageResult> {
  return storeInitialDocumentsInStagingWithDependencies(
    input,
    DEFAULT_STORAGE_DEPENDENCIES,
  );
}
