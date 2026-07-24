import { spawn } from "node:child_process";
import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  MatterResolutionError,
  resolveActiveMatter,
  type ResolvedActiveMatter,
} from "@/lib/sdj-matters";

export const runtime = "nodejs";

type OpenMatterFolderTarget =
  | "matter"
  | "ulaz"
  | "radno"
  | "finalno"
  | "ai";

type OpenMatterFolderInput = {
  clientFolder: string;
  matterFolder: string;
  target: OpenMatterFolderTarget;
};

function readInput(body: unknown): OpenMatterFolderInput | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return null;
  }
  const value = body as Record<string, unknown>;
  const allowedKeys = new Set(["clientFolder", "matterFolder", "target"]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return null;
  const allowedTargets: readonly OpenMatterFolderTarget[] = [
    "matter",
    "ulaz",
    "radno",
    "finalno",
    "ai",
  ];
  if (
    typeof value.clientFolder !== "string" ||
    typeof value.matterFolder !== "string" ||
    typeof value.target !== "string" ||
    !allowedTargets.includes(value.target as OpenMatterFolderTarget)
  ) {
    return null;
  }
  return {
    clientFolder: value.clientFolder,
    matterFolder: value.matterFolder,
    target: value.target as OpenMatterFolderTarget,
  };
}

class FolderTargetError extends Error {
  readonly status: 400 | 404;

  constructor(status: 400 | 404) {
    super("Folder target nije moguće bezbjedno potvrditi.");
    this.name = "FolderTargetError";
    this.status = status;
  }
}

function selectFolderPath(
  resolved: ResolvedActiveMatter,
  target: OpenMatterFolderTarget,
) {
  switch (target) {
    case "matter":
      return resolved.matterPath;
    case "ulaz":
      return resolved.ulazPath;
    case "radno":
      return resolved.radnoPath;
    case "finalno":
      return resolved.finalnoPath;
    case "ai":
      return resolved.aiPath;
  }
}

function isDirectWindowsChild(parent: string, candidate: string) {
  const relative = path.win32.relative(
    path.win32.normalize(parent).toLocaleLowerCase("en-US"),
    path.win32.normalize(candidate).toLocaleLowerCase("en-US"),
  );
  return (
    relative.length > 0 &&
    relative !== "." &&
    relative !== ".." &&
    !relative.startsWith(`..${path.win32.sep}`) &&
    !path.win32.isAbsolute(relative) &&
    !relative.includes(path.win32.sep)
  );
}

async function validateSubfolderPath(
  matterPath: string,
  selectedPath: string,
) {
  try {
    const [realMatterPath, realSelectedPath] = await Promise.all([
      realpath(matterPath),
      realpath(selectedPath),
    ]);
    const info = await stat(realSelectedPath);
    if (!info.isDirectory()) throw new FolderTargetError(404);
    if (!isDirectWindowsChild(realMatterPath, realSelectedPath)) {
      throw new FolderTargetError(400);
    }
    return realSelectedPath;
  } catch (error) {
    if (error instanceof FolderTargetError) throw error;
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      throw new FolderTargetError(404);
    }
    throw new FolderTargetError(400);
  }
}

function openMatterFolder(selectedPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("explorer.exe", [selectedPath], {
      detached: true,
      stdio: "ignore",
    });
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
    child.once("error", reject);
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neispravan zahtev." }, { status: 400 });
  }
  const input = readInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Zahtev za otvaranje matter foldera nije validan." },
      { status: 400 },
    );
  }

  try {
    const resolved = await resolveActiveMatter(
      input.clientFolder,
      input.matterFolder,
    );
    const candidatePath = selectFolderPath(resolved, input.target);
    const selectedPath =
      input.target === "matter"
        ? candidatePath
        : await validateSubfolderPath(resolved.matterPath, candidatePath);
    await openMatterFolder(selectedPath);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof MatterResolutionError) {
      const status =
        error.code === "CLIENT_NOT_FOUND" || error.code === "MATTER_NOT_FOUND"
          ? 404
          : 400;
      return NextResponse.json(
        { error: "Izabrani aktivni matter folder nije pronađen." },
        { status },
      );
    }
    if (error instanceof FolderTargetError) {
      return NextResponse.json(
        {
          error:
            error.status === 404
              ? "Traženi folder nije pronađen."
              : "Traženi folder nije moguće bezbjedno otvoriti.",
        },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Matter folder trenutno nije moguće otvoriti." },
      { status: 500 },
    );
  }
}
