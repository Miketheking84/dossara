import { mkdir, rename, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isSafeDirectChild } from "@/lib/sdj-files";
import { getActiveWorkspaceRoot, getClientsRoot } from "@/lib/sdj-workspace";

export const runtime = "nodejs";

function isSafeSegment(value: string) {
  return (
    value.length > 0 &&
    !value.includes("..") &&
    !value.includes("/") &&
    !value.includes("\\") &&
    !path.win32.isAbsolute(value)
  );
}

async function pathExists(candidate: string) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

async function ensureDirectory(candidate: string) {
  try {
    const info = await stat(candidate);
    if (!info.isDirectory()) throw new Error(`Putanja nije folder: ${candidate}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    await mkdir(candidate);
  }
}

function archiveTimestamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neispravan JSON zahtev." }, { status: 400 });
  }

  const value = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
  const allowedKeys = new Set(["clientFolder", "matterFolder"]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    return NextResponse.json({ error: "Zahtev sadrži nedozvoljena polja." }, { status: 400 });
  }
  const clientFolder = typeof value.clientFolder === "string" ? value.clientFolder.trim() : "";
  const matterFolder = typeof value.matterFolder === "string" ? value.matterFolder.trim() : "";
  if (!isSafeSegment(clientFolder) || !isSafeSegment(matterFolder)) {
    return NextResponse.json({ error: "Klijent ili predmet imaju neispravan naziv foldera." }, { status: 400 });
  }
  if (!matterFolder.startsWith("SDJ_")) {
    return NextResponse.json({ error: "Samo aktivni SDJ_ matter folder može biti premješten." }, { status: 400 });
  }

  try {
    const [activeRoot, clientsRoot] = await Promise.all([
      getActiveWorkspaceRoot(),
      getClientsRoot(),
    ]);
    const clientPath = path.win32.join(clientsRoot, clientFolder);
    if (!isSafeDirectChild(clientsRoot, clientPath)) {
      return NextResponse.json({ error: "Klijent nije direktni folder u 01 KLIJENTI." }, { status: 400 });
    }
    const clientInfo = await stat(clientPath);
    if (!clientInfo.isDirectory()) {
      return NextResponse.json({ error: "Izabrani klijent nije folder." }, { status: 400 });
    }

    const sourcePath = path.win32.join(clientPath, matterFolder);
    if (!isSafeDirectChild(clientPath, sourcePath)) {
      return NextResponse.json({ error: "Predmet nije direktni folder izabranog klijenta." }, { status: 400 });
    }
    const sourceInfo = await stat(sourcePath);
    if (!sourceInfo.isDirectory()) {
      return NextResponse.json({ error: "Izabrani predmet nije folder." }, { status: 400 });
    }

    const archiveRoot = path.win32.join(activeRoot, "05 ARHIVA");
    const deletedMattersRoot = path.win32.join(archiveRoot, "OBRISANI_PREDMETI");
    const deletedClientRoot = path.win32.join(deletedMattersRoot, clientFolder);
    if (
      !isSafeDirectChild(activeRoot, archiveRoot) ||
      !isSafeDirectChild(archiveRoot, deletedMattersRoot) ||
      !isSafeDirectChild(deletedMattersRoot, deletedClientRoot)
    ) {
      return NextResponse.json({ error: "Arhivska destinacija nije bezbedna." }, { status: 400 });
    }

    await ensureDirectory(archiveRoot);
    await ensureDirectory(deletedMattersRoot);
    await ensureDirectory(deletedClientRoot);

    const destinationBase = `${matterFolder}__OBRISAN_${archiveTimestamp()}`;
    for (let index = 0; index <= 999; index += 1) {
      const suffix = index === 0 ? "" : `_${String(index).padStart(3, "0")}`;
      const destinationFolder = `${destinationBase}${suffix}`;
      const destinationPath = path.win32.join(deletedClientRoot, destinationFolder);
      if (!isSafeDirectChild(deletedClientRoot, destinationPath)) {
        return NextResponse.json({ error: "Arhivska destinacija nije bezbedna." }, { status: 400 });
      }
      if (await pathExists(destinationPath)) continue;
      try {
        await rename(sourcePath, destinationPath);
        return NextResponse.json({
          success: true,
          message: "Predmet je premješten u arhivu.",
          destinationFolder,
        });
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === "EEXIST" || code === "ENOTEMPTY") continue;
        throw error;
      }
    }
    return NextResponse.json(
      { error: "Nije pronađen slobodan naziv u arhivi." },
      { status: 409 },
    );
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return NextResponse.json({ error: "Izabrani klijent ili predmet ne postoji." }, { status: 404 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? `Predmet nije premješten: ${error.message}` : "Predmet nije premješten." },
      { status: 500 },
    );
  }
}
