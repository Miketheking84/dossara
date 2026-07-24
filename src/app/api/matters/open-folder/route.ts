import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import {
  MatterResolutionError,
  resolveActiveMatter,
} from "@/lib/sdj-matters";

export const runtime = "nodejs";

type OpenMatterFolderTarget = "matter";

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
  if (
    typeof value.clientFolder !== "string" ||
    typeof value.matterFolder !== "string" ||
    value.target !== "matter"
  ) {
    return null;
  }
  return {
    clientFolder: value.clientFolder,
    matterFolder: value.matterFolder,
    target: value.target,
  };
}

function openMatterFolder(matterPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("explorer.exe", [matterPath], {
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
    await openMatterFolder(resolved.matterPath);
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
    return NextResponse.json(
      { error: "Matter folder trenutno nije moguće otvoriti." },
      { status: 500 },
    );
  }
}
