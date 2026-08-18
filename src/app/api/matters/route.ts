import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { CONTROL_FILES, isSafeDirectChild, makeMatterFolderName, MATTER_FOLDERS, sanitizeFolderPart } from "@/lib/sdj-files";
import { isMatterType } from "@/lib/sdj-matter-classification";
import {
  parseMatterCommandCenter,
  resolveSafeClientForMutation,
} from "@/lib/sdj-matters";
import { getClientsRoot } from "@/lib/sdj-workspace";
import { createMatterTransaction } from "./matter-create";
import {
  parseMatterRequest,
} from "./matter-request";

export const runtime = "nodejs";

function containsPathAttempt(value: string) {
  return (
    value.includes("..") ||
    value.includes("/") ||
    value.includes("\\") ||
    /^[a-z]:/i.test(value) ||
    path.win32.isAbsolute(value) ||
    path.posix.isAbsolute(value)
  );
}

function isValidIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1];
}

async function firstAvailableFolderName(clientPath: string, baseFolderName: string) {
  for (let index = 1; index <= 999; index += 1) {
    const candidate = `${baseFolderName}_${String(index).padStart(3, "0")}`;
    try {
      await stat(path.win32.join(clientPath, candidate));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return candidate;
      throw error;
    }
  }
  return "";
}

export async function GET() {
  try {
    const clientsRoot = await getClientsRoot();
    const clientEntries = await readdir(clientsRoot, { withFileTypes: true });
    const clients = clientEntries.filter((entry) => entry.isDirectory());
    const matters = (
      await Promise.all(
        clients.map(async (clientEntry) => {
          const clientPath = path.win32.join(clientsRoot, clientEntry.name);
          if (!isSafeDirectChild(clientsRoot, clientPath)) return [];
          const entries = await readdir(clientPath, { withFileTypes: true });
          return Promise.all(
            entries
              .filter((entry) => entry.isDirectory() && entry.name.startsWith("SDJ_"))
              .map(async (entry) => {
                const matterPath = path.win32.join(clientPath, entry.name);
                let matterName = entry.name;
                let clientName = clientEntry.name;
                let legalArea = "";
                let matterType = "";
                let status = "";
                let nextStep = "";
                let deadline = "";
                try {
                  const commandCenter = await readFile(
                    path.win32.join(matterPath, "00 CONTROL", "command-center.md"),
                    "utf8",
                  );
                  const { metadata } = parseMatterCommandCenter(commandCenter);
                  if (metadata.matter) matterName = metadata.matter;
                  if (metadata.client) clientName = metadata.client;
                  legalArea = metadata.legalArea ?? "";
                  matterType = metadata.matterType ?? "";
                  status = metadata.status ?? "";
                  nextStep = metadata.nextStep ?? "";
                  deadline = metadata.deadline ?? "";
                } catch {
                  // Naziv foldera je fallback kada kontrolni fajl nije čitljiv.
                }
                return {
                  clientFolder: clientEntry.name,
                  clientName,
                  matterFolder: entry.name,
                  matterName,
                  legalArea,
                  matterType,
                  status,
                  nextStep,
                  deadline,
                };
              }),
          );
        }),
      )
    ).flat();
    matters.sort((left, right) =>
      `${left.clientFolder}\\${left.matterFolder}`.localeCompare(
        `${right.clientFolder}\\${right.matterFolder}`,
      ),
    );
    return NextResponse.json({ matters });
  } catch {
    return NextResponse.json(
      { error: "Aktivni predmeti nisu mogli biti učitani." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const parsedRequest = await parseMatterRequest(request);
  if (!parsedRequest.ok) {
    return NextResponse.json({ error: parsedRequest.error }, { status: parsedRequest.status });
  }
  const { input } = parsedRequest;
  if (!input || !input.client || !input.matterName || !input.openingDate) {
    return NextResponse.json({ error: "Klijent, naziv predmeta i datum otvaranja su obavezni." }, { status: 400 });
  }
  if (containsPathAttempt(input.matterName)) {
    return NextResponse.json({ error: "Naziv predmeta nije validan." }, { status: 400 });
  }
  if (!isValidIsoDate(input.openingDate)) {
    return NextResponse.json({ error: "Datum otvaranja mora biti stvaran datum u formatu YYYY-MM-DD." }, { status: 400 });
  }
  if (input.deadline && !isValidIsoDate(input.deadline)) {
    return NextResponse.json({ error: "Rok mora biti prazan ili stvaran datum u formatu YYYY-MM-DD." }, { status: 400 });
  }
  if (input.matterType && !isMatterType(input.matterType)) {
    return NextResponse.json({ error: "Vrsta predmeta nije dozvoljena." }, { status: 400 });
  }
  const clientFolder = sanitizeFolderPart(input.client, 60);
  let clientPath: string;
  try {
    ({ clientPath } = await resolveSafeClientForMutation(clientFolder));
  } catch {
    return NextResponse.json(
      { error: "Izabrani klijent ne postoji ili nije bezbjedan." },
      { status: 404 },
    );
  }

  const baseFolderName = makeMatterFolderName(input.openingDate, clientFolder, input.matterName);
  const overridePattern = new RegExp(`^${baseFolderName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}_\\d{3}$`);
  if (input.folderNameOverride && !overridePattern.test(input.folderNameOverride)) return NextResponse.json({ error: "Predloženi naziv predmeta nije validan." }, { status: 400 });
  const folderName = input.folderNameOverride || baseFolderName;
  const matterPath = path.win32.join(clientPath, folderName);
  if (!isSafeDirectChild(clientPath, matterPath)) {
    return NextResponse.json({ error: "Predloženi naziv predmeta nije validan." }, { status: 400 });
  }

  const transaction = await createMatterTransaction({
    realClientPath: clientPath,
    matterPath,
    matterFolder: folderName,
    controlInput: input,
    initialDocuments: parsedRequest.initialDocuments,
  });
  if (!transaction.ok) {
    if (transaction.collision) {
      try {
        return NextResponse.json(
          {
            error: "Predmet sa ovim nazivom već postoji.",
            suggestedFolderName: await firstAvailableFolderName(clientPath, baseFolderName),
          },
          { status: 409 },
        );
      } catch {
        return NextResponse.json(
          { error: "Provera naziva predmeta nije uspela." },
          { status: 500 },
        );
      }
    }
    if (transaction.error === "MATTER_CHECK_FAILED") {
      return NextResponse.json(
        { error: "Provera naziva predmeta nije uspela." },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Predmet nije kreiran." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    clientFolder,
    matterFolder: folderName,
    matterName: input.matterName,
    folderName,
    createdFolders: [...MATTER_FOLDERS],
    createdFiles: [...CONTROL_FILES],
    errors: [],
    initialDocumentsSaved: transaction.initialDocumentsSaved,
  }, { status: 201 });
}
