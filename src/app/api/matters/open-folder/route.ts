import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getClientsRoot } from "@/lib/sdj-workspace";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Neispravan zahtev." }, { status: 400 }); }
  const folderPath = typeof body === "object" && body !== null && "path" in body && typeof body.path === "string" ? path.win32.resolve(body.path) : "";
  try {
    const clientsRoot = await getClientsRoot();
    const relative = path.win32.relative(clientsRoot, folderPath);
    if (!folderPath || !relative || relative.startsWith("..") || path.win32.isAbsolute(relative)) {
      return NextResponse.json({ error: "Folder mora biti unutar aktivnog workspace 01 KLIJENTI foldera." }, { status: 400 });
    }
    const info = await stat(folderPath); if (!info.isDirectory()) throw new Error("Putanja nije folder.");
    const child = spawn("explorer.exe", [folderPath], { detached: true, stdio: "ignore" }); child.unref();
    return NextResponse.json({ opened: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Folder nije otvoren." }, { status: 500 }); }
}
