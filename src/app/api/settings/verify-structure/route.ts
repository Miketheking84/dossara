import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  saveActiveWorkspaceRoot,
  validateAllowedTestRoot,
} from "@/lib/sdj-workspace";

export const runtime = "nodejs";

const REQUIRED_FOLDERS = ["00 INBOX", "01 KLIJENTI", "03 SABLONI", "04 ADMIN_SDJ_MIKE", "05 ARHIVA"] as const;

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Neispravan JSON zahtev." }, { status: 400 }); }
  const rootPath = typeof body === "object" && body !== null && "rootPath" in body && typeof body.rootPath === "string" ? body.rootPath.trim() : "";
  if (!rootPath) return NextResponse.json({ error: "Root folder path je obavezan." }, { status: 400 });
  let verifiedRootPath: string;
  try {
    verifiedRootPath = await validateAllowedTestRoot(rootPath);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Test root nije dozvoljen." },
      { status: 400 },
    );
  }

  const created: string[] = []; const existing: string[] = []; const errors: { folder: string; message: string }[] = [];
  let rootStatus: "created" | "exists" | "error" = "exists";
  try {
    try {
      const info = await stat(verifiedRootPath);
      if (!info.isDirectory()) throw new Error("Putanja postoji, ali nije folder.");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await mkdir(verifiedRootPath, { recursive: true }); rootStatus = "created";
    }
  } catch (error) {
    rootStatus = "error";
    return NextResponse.json(
      {
        error: "Workspace root nije mogao biti kreiran ili potvrđen.",
        root: { status: rootStatus, path: verifiedRootPath },
        created,
        existing,
        errors: [{ folder: verifiedRootPath, message: error instanceof Error ? error.message : "Nepoznata greška" }],
      },
      { status: 500 },
    );
  }

  for (const folder of REQUIRED_FOLDERS) {
    const folderPath = path.win32.join(verifiedRootPath, folder);
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

  if (errors.length) {
    return NextResponse.json(
      {
        error: "Workspace struktura nije potpuno verifikovana. Aktivni workspace nije sačuvan.",
        root: { status: rootStatus, path: verifiedRootPath },
        created,
        existing,
        errors,
      },
      { status: 500 },
    );
  }

  try {
    await saveActiveWorkspaceRoot(verifiedRootPath);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Aktivni workspace nije sačuvan.",
        root: { status: rootStatus, path: verifiedRootPath },
        created,
        existing,
        errors,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ root: { status: rootStatus, path: verifiedRootPath }, created, existing, errors });
}
