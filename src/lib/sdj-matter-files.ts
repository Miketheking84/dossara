import "server-only";

import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import { MATTER_FOLDERS } from "./sdj-files";
import { resolveActiveMatter } from "./sdj-matters";

export const MAX_MATTER_PREVIEW_BYTES = 25 * 1024 * 1024;
const MAX_TREE_DEPTH = 20;
const MAX_TREE_ITEMS = 4_000;

const IMAGE_MIME_TYPES: Record<string, string> = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const TEXT_EXTENSIONS = new Set([
  ".csv",
  ".json",
  ".log",
  ".md",
  ".rtf",
  ".tsv",
  ".txt",
  ".xml",
]);

export type MatterPreviewKind =
  | "docx"
  | "image"
  | "pdf"
  | "text"
  | "unsupported";

export type MatterFileTreeNode = {
  name: string;
  relativePath: string;
  kind: "directory" | "file";
  children?: MatterFileTreeNode[];
  extension?: string;
  size?: number;
  previewKind?: MatterPreviewKind;
  canPreview?: boolean;
};

export type MatterFileTreeResult = {
  nodes: MatterFileTreeNode[];
  totalFiles: number;
  totalFolders: number;
  truncated: boolean;
  warnings: string[];
};

export type ResolvedMatterFile = {
  absolutePath: string;
  relativePath: string;
  name: string;
  extension: string;
  size: number;
  previewKind: MatterPreviewKind;
  mimeType: string;
  canPreview: boolean;
};

export class MatterFileAccessError extends Error {
  readonly code: "INVALID_PATH" | "NOT_FOUND" | "UNSAFE_TARGET" | "NOT_A_FILE";

  constructor(code: MatterFileAccessError["code"], message: string) {
    super(message);
    this.name = "MatterFileAccessError";
    this.code = code;
  }
}

function isWithinWindowsPath(parent: string, candidate: string) {
  const relative = path.win32.relative(
    path.win32.normalize(parent).toLocaleLowerCase("en-US"),
    path.win32.normalize(candidate).toLocaleLowerCase("en-US"),
  );
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.win32.sep}`) &&
      !path.win32.isAbsolute(relative))
  );
}

function relativeForUi(root: string, candidate: string) {
  return path.win32.relative(root, candidate).split(path.win32.sep).join("/");
}

function previewKindForExtension(extension: string): MatterPreviewKind {
  if (extension === ".pdf") return "pdf";
  if (extension === ".docx") return "docx";
  if (extension in IMAGE_MIME_TYPES) return "image";
  if (TEXT_EXTENSIONS.has(extension)) return "text";
  return "unsupported";
}

function mimeTypeFor(extension: string, previewKind: MatterPreviewKind) {
  if (previewKind === "pdf") return "application/pdf";
  if (previewKind === "image") {
    return IMAGE_MIME_TYPES[extension] ?? "application/octet-stream";
  }
  return "text/plain; charset=utf-8";
}

export function normalizeMatterRelativePath(value: string) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 1_024 ||
    value.includes("\0") ||
    path.win32.isAbsolute(value)
  ) {
    throw new MatterFileAccessError("INVALID_PATH", "Putanja fajla nije validna.");
  }

  const segments = value.replaceAll("/", path.win32.sep).split(path.win32.sep);
  if (
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".." ||
        segment.includes(":"),
    )
  ) {
    throw new MatterFileAccessError("INVALID_PATH", "Putanja fajla nije validna.");
  }
  return segments.join(path.win32.sep);
}

function sortEntries(
  left: { name: string; isDirectory(): boolean },
  right: { name: string; isDirectory(): boolean },
) {
  if (left.isDirectory() !== right.isDirectory()) {
    return left.isDirectory() ? -1 : 1;
  }
  const leftStandardIndex = MATTER_FOLDERS.indexOf(
    left.name as (typeof MATTER_FOLDERS)[number],
  );
  const rightStandardIndex = MATTER_FOLDERS.indexOf(
    right.name as (typeof MATTER_FOLDERS)[number],
  );
  if (leftStandardIndex >= 0 || rightStandardIndex >= 0) {
    if (leftStandardIndex < 0) return 1;
    if (rightStandardIndex < 0) return -1;
    return leftStandardIndex - rightStandardIndex;
  }
  return left.name.localeCompare(right.name, "sr-Latn", { sensitivity: "base" });
}

type ScanState = {
  totalFiles: number;
  totalFolders: number;
  visited: number;
  truncated: boolean;
  warnings: string[];
};

async function scanDirectory(
  realMatterRoot: string,
  directoryPath: string,
  depth: number,
  state: ScanState,
): Promise<MatterFileTreeNode[]> {
  if (depth > MAX_TREE_DEPTH || state.visited >= MAX_TREE_ITEMS) {
    state.truncated = true;
    return [];
  }

  const entries = (await readdir(directoryPath, { withFileTypes: true })).sort(
    sortEntries,
  );
  const nodes: MatterFileTreeNode[] = [];

  for (const entry of entries) {
    if (state.visited >= MAX_TREE_ITEMS) {
      state.truncated = true;
      break;
    }
    state.visited += 1;
    const candidate = path.win32.join(directoryPath, entry.name);
    try {
      const info = await lstat(candidate);
      if (info.isSymbolicLink()) {
        state.warnings.push(relativeForUi(realMatterRoot, candidate));
        continue;
      }
      const realCandidate = await realpath(candidate);
      if (!isWithinWindowsPath(realMatterRoot, realCandidate)) {
        state.warnings.push(relativeForUi(realMatterRoot, candidate));
        continue;
      }
      const relativePath = relativeForUi(realMatterRoot, realCandidate);
      if (info.isDirectory()) {
        state.totalFolders += 1;
        nodes.push({
          name: entry.name,
          relativePath,
          kind: "directory",
          children: await scanDirectory(
            realMatterRoot,
            realCandidate,
            depth + 1,
            state,
          ),
        });
      } else if (info.isFile()) {
        const extension = path.win32.extname(entry.name).toLocaleLowerCase("en-US");
        const previewKind = previewKindForExtension(extension);
        state.totalFiles += 1;
        nodes.push({
          name: entry.name,
          relativePath,
          kind: "file",
          extension,
          size: info.size,
          previewKind,
          canPreview:
            previewKind !== "unsupported" &&
            info.size <= MAX_MATTER_PREVIEW_BYTES,
        });
      }
    } catch {
      state.warnings.push(relativeForUi(realMatterRoot, candidate));
    }
  }
  return nodes;
}

export async function listMatterFileTreeAtRoot(
  matterRoot: string,
): Promise<MatterFileTreeResult> {
  const realMatterRoot = await realpath(matterRoot);
  const state: ScanState = {
    totalFiles: 0,
    totalFolders: 0,
    visited: 0,
    truncated: false,
    warnings: [],
  };
  const nodes = await scanDirectory(realMatterRoot, realMatterRoot, 0, state);
  return {
    nodes,
    totalFiles: state.totalFiles,
    totalFolders: state.totalFolders,
    truncated: state.truncated,
    warnings: state.warnings,
  };
}

export async function listActiveMatterFileTree(
  clientFolder: string,
  matterFolder: string,
) {
  const resolvedMatter = await resolveActiveMatter(clientFolder, matterFolder);
  return listMatterFileTreeAtRoot(resolvedMatter.matterPath);
}

export async function resolveMatterFileAtRoot(
  matterRoot: string,
  relativePath: string,
): Promise<ResolvedMatterFile> {
  const normalizedRelativePath = normalizeMatterRelativePath(relativePath);
  const realMatterRoot = await realpath(matterRoot);
  const candidate = path.win32.resolve(realMatterRoot, normalizedRelativePath);
  if (!isWithinWindowsPath(realMatterRoot, candidate)) {
    throw new MatterFileAccessError("UNSAFE_TARGET", "Fajl je izvan matter foldera.");
  }

  let info;
  try {
    info = await lstat(candidate);
  } catch {
    throw new MatterFileAccessError("NOT_FOUND", "Fajl nije pronađen.");
  }
  if (info.isSymbolicLink()) {
    throw new MatterFileAccessError("UNSAFE_TARGET", "Fajl nije bezbjedno dostupan.");
  }
  if (!info.isFile()) {
    throw new MatterFileAccessError("NOT_A_FILE", "Izabrana putanja nije fajl.");
  }

  const realCandidate = await realpath(candidate);
  if (!isWithinWindowsPath(realMatterRoot, realCandidate)) {
    throw new MatterFileAccessError("UNSAFE_TARGET", "Fajl je izvan matter foldera.");
  }
  const extension = path.win32.extname(realCandidate).toLocaleLowerCase("en-US");
  const previewKind = previewKindForExtension(extension);
  return {
    absolutePath: realCandidate,
    relativePath: relativeForUi(realMatterRoot, realCandidate),
    name: path.win32.basename(realCandidate),
    extension,
    size: info.size,
    previewKind,
    mimeType: mimeTypeFor(extension, previewKind),
    canPreview:
      previewKind !== "unsupported" && info.size <= MAX_MATTER_PREVIEW_BYTES,
  };
}

export async function resolveActiveMatterFile(
  clientFolder: string,
  matterFolder: string,
  relativePath: string,
) {
  const resolvedMatter = await resolveActiveMatter(clientFolder, matterFolder);
  return resolveMatterFileAtRoot(resolvedMatter.matterPath, relativePath);
}

export async function readMatterPreview(file: ResolvedMatterFile) {
  if (!file.canPreview) {
    throw new MatterFileAccessError(
      "UNSAFE_TARGET",
      "Fajl nije dostupan za ugrađeni pregled.",
    );
  }
  const buffer = await readFile(file.absolutePath);
  if (file.previewKind === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return Buffer.from(result.value, "utf8");
  }
  return buffer;
}
