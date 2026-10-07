import { AlphaReviewError, withAlphaMatterGate } from "@/lib/sdj-next-step-review";
import { rename, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isSafeDirectChild } from "@/lib/sdj-files";
import {
  ensureSafeDirectoryForMutation,
  MatterResolutionError,
  resolveSafeMatterForMutation,
} from "@/lib/sdj-matters";

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
    const resolvedMatter = await resolveSafeMatterForMutation(
      clientFolder,
      matterFolder,
    );
    let movedMatterPath: string | undefined;
    return await withAlphaMatterGate(resolvedMatter, async () => {
    const archiveRoot = await ensureSafeDirectoryForMutation(
      resolvedMatter.workspaceRoot,
      "05 ARHIVA",
    );
    const deletedMattersRoot = await ensureSafeDirectoryForMutation(
      archiveRoot,
      "OBRISANI_PREDMETI",
    );
    const deletedClientRoot = await ensureSafeDirectoryForMutation(
      deletedMattersRoot,
      clientFolder,
    );

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
        await rename(resolvedMatter.matterPath, destinationPath);
        movedMatterPath = destinationPath;
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
    }, { movedMatterPath: () => movedMatterPath });
  } catch (error) {
    if (error instanceof AlphaReviewError) return NextResponse.json({ code: error.code, error: error.message }, { status: 409 });
    if (error instanceof MatterResolutionError) {
      return NextResponse.json(
        { error: "Klijent, predmet ili arhivska destinacija nisu bezbjedni." },
        { status: 400 },
      );
    }
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return NextResponse.json({ error: "Izabrani klijent ili predmet ne postoji." }, { status: 404 });
    }
    return NextResponse.json({ error: "Predmet nije premješten." }, { status: 500 });
  }
}
