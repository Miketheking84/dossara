import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isSafeDirectChild, sanitizeFolderPart } from "@/lib/sdj-files";
import { getClientsRoot } from "@/lib/sdj-workspace";

export const runtime = "nodejs";

export async function GET() {
  try {
    const clientsRoot = await getClientsRoot();
    const entries = await readdir(clientsRoot, { withFileTypes: true });
    const clients = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ clients });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Klijenti nisu mogli biti učitani." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Neispravan JSON zahtev." }, { status: 400 }); }
  const name = typeof body === "object" && body !== null && "name" in body && typeof body.name === "string" ? body.name : "";
  const folderName = sanitizeFolderPart(name, 60);
  if (!folderName) return NextResponse.json({ error: "Unesite ispravan naziv klijenta." }, { status: 400 });
  try {
    const clientsRoot = await getClientsRoot();
    const clientPath = path.win32.join(clientsRoot, folderName);
    if (!isSafeDirectChild(clientsRoot, clientPath)) {
      return NextResponse.json({ error: "Neispravan naziv klijenta." }, { status: 400 });
    }
    try { await stat(clientPath); return NextResponse.json({ error: `Klijent ${folderName} već postoji.` }, { status: 409 }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    try {
      await mkdir(clientPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") {
        return NextResponse.json({ error: `Klijent ${folderName} već postoji.` }, { status: 409 });
      }
      throw error;
    }
    return NextResponse.json({ client: folderName, path: clientPath }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Klijent nije kreiran." }, { status: 500 });
  }
}
