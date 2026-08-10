import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import {
  MatterFileAccessError,
  readMatterPreview,
  resolveActiveMatterFile,
} from "@/lib/sdj-matter-files";
import { MatterResolutionError } from "@/lib/sdj-matters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FileRequestInput = {
  clientFolder: string;
  matterFolder: string;
  relativePath: string;
};

function readQuery(request: Request): FileRequestInput | null {
  const url = new URL(request.url);
  const clientFolder = url.searchParams.get("clientFolder");
  const matterFolder = url.searchParams.get("matterFolder");
  const relativePath = url.searchParams.get("relativePath");
  if (!clientFolder || !matterFolder || !relativePath) return null;
  return { clientFolder, matterFolder, relativePath };
}

function readBody(body: unknown): FileRequestInput | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>;
  const allowedKeys = new Set(["clientFolder", "matterFolder", "relativePath"]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return null;
  if (
    typeof value.clientFolder !== "string" ||
    typeof value.matterFolder !== "string" ||
    typeof value.relativePath !== "string"
  ) {
    return null;
  }
  return {
    clientFolder: value.clientFolder,
    matterFolder: value.matterFolder,
    relativePath: value.relativePath,
  };
}

function errorResponse(error: unknown) {
  if (error instanceof MatterResolutionError) {
    return NextResponse.json(
      { error: "Izabrani predmet nije pronađen." },
      { status: 404 },
    );
  }
  if (error instanceof MatterFileAccessError) {
    return NextResponse.json(
      { error: "Izabrani fajl nije moguće bezbjedno otvoriti." },
      { status: error.code === "NOT_FOUND" ? 404 : 400 },
    );
  }
  return NextResponse.json(
    { error: "Izabrani fajl trenutno nije dostupan." },
    { status: 500 },
  );
}

function contentDisposition(fileName: string) {
  return `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(request: Request) {
  const input = readQuery(request);
  if (!input) {
    return NextResponse.json({ error: "Zahtev nije validan." }, { status: 400 });
  }
  try {
    const file = await resolveActiveMatterFile(
      input.clientFolder,
      input.matterFolder,
      input.relativePath,
    );
    if (!file.canPreview) {
      return NextResponse.json(
        { error: "Ovaj format nije dostupan za ugrađeni pregled." },
        { status: 415 },
      );
    }
    const content = await readMatterPreview(file);
    return new Response(content, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": contentDisposition(file.name),
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:",
        "Content-Type": file.mimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

function openLocalFile(absolutePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("explorer.exe", [absolutePath], {
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
    return NextResponse.json({ error: "Zahtev nije validan." }, { status: 400 });
  }
  const input = readBody(body);
  if (!input) {
    return NextResponse.json({ error: "Zahtev nije validan." }, { status: 400 });
  }
  try {
    const file = await resolveActiveMatterFile(
      input.clientFolder,
      input.matterFolder,
      input.relativePath,
    );
    await openLocalFile(file.absolutePath);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
