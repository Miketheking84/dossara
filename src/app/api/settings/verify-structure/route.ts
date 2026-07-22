import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const REQUIRED_FOLDERS = ["00 INBOX", "01 KLIJENTI", "03 SABLONI", "04 ADMIN_SDJ_MIKE", "05 ARHIVA"] as const;

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Neispravan JSON zahtev." }, { status: 400 }); }
  const rootPath = typeof body === "object" && body !== null && "rootPath" in body && typeof body.rootPath === "string" ? body.rootPath.trim() : "";
  if (!rootPath) return NextResponse.json({ error: "Root folder path je obavezan." }, { status: 400 });
  if (!path.win32.isAbsolute(rootPath)) return NextResponse.json({ error: "Root folder path mora biti apsolutna Windows putanja." }, { status: 400 });

  const created: string[] = []; const existing: string[] = []; const errors: { folder: string; message: string }[] = [];
  let rootStatus: "created" | "exists" | "error" = "exists";
  try {
    try {
      const info = await stat(rootPath);
      if (!info.isDirectory()) throw new Error("Putanja postoji, ali nije folder.");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await mkdir(rootPath, { recursive: true }); rootStatus = "created";
    }
  } catch (error) {
    rootStatus = "error";
    return NextResponse.json({ root: { status: rootStatus, path: rootPath }, created, existing, errors: [{ folder: rootPath, message: error instanceof Error ? error.message : "Nepoznata greška" }] });
  }

  for (const folder of REQUIRED_FOLDERS) {
    const folderPath = path.win32.join(rootPath, folder);
    try {
      try {
        const info = await stat(folderPath);
        if (!info.isDirectory()) throw new Error("Putanja postoji, ali nije folder.");
        existing.push(folder);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        await mkdir(folderPath); created.push(folder);
      }
    } catch (error) { errors.push({ folder, message: error instanceof Error ? error.message : "Nepoznata greška" }); }
  }

  return NextResponse.json({ root: { status: rootStatus, path: rootPath }, created, existing, errors });
}
