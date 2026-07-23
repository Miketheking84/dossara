import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { CONTROL_FILES, isSafeDirectChild, makeMatterFolderName, markdownValue, MATTER_FOLDERS, sanitizeFolderPart } from "@/lib/sdj-files";
import { getClientsRoot } from "@/lib/sdj-workspace";

export const runtime = "nodejs";

type MatterInput = { client: string; matterName: string; legalArea: string; status: string; priority: string; description: string; nextStep: string; deadline: string; waitingFrom: string; waitingDetail: string; expectedOutput: string; openingDate: string; folderNameOverride: string };

function readInput(body: unknown): MatterInput | null {
  if (typeof body !== "object" || body === null) return null;
  const value = body as Record<string, unknown>;
  const get = (key: keyof MatterInput) => typeof value[key] === "string" ? value[key].trim() : "";
  return { client:get("client"), matterName:get("matterName"), legalArea:get("legalArea") || "Opšte", status:get("status") || "Aktivan", priority:get("priority") || "Srednji", description:get("description"), nextStep:get("nextStep"), deadline:get("deadline"), waitingFrom:get("waitingFrom") || "Niko / nije primenljivo", waitingDetail:get("waitingDetail"), expectedOutput:get("expectedOutput"), openingDate:get("openingDate"), folderNameOverride:get("folderNameOverride") };
}

function controlContents(input: MatterInput) {
  const v = markdownValue;
  const commandCenter = `# Command Center\n\nKlijent: ${v(input.client)}\nPredmet: ${v(input.matterName)}\nDatum otvaranja: ${v(input.openingDate)}\nStatus: ${v(input.status)}\nPrioritet: ${v(input.priority)}\nOblast prava: ${v(input.legalArea)}\nSledeći korak: ${v(input.nextStep)}\nČeka se od: ${v(input.waitingFrom)}\nDetalj čekanja / napomena: ${v(input.waitingDetail)}\nRok: ${v(input.deadline)}\nKratak opis: ${v(input.description)}\nKljučna pitanja:\nRizici:\nOčekivani output: ${v(input.expectedOutput)}\nStatus outputa:\nFinalni dokument:\nFinalni cilj:\n`;
  const actionSection = input.priority === "Hitno" || input.priority === "Visok" ? "Hitno" : "Ove nedelje";
  const nextActions = `# Next Actions\n\n## Hitno\n${actionSection === "Hitno" && input.nextStep ? `- ${v(input.nextStep)}` : "- "}\n\n## Ove nedelje\n${actionSection === "Ove nedelje" && input.nextStep ? `- ${v(input.nextStep)}` : "- "}\n\n## Čeka se od klijenta\n- \n\n## Čeka se od druge strane\n- \n\n## Potrebno proveriti\n- \n`;
  return {
    "command-center.md": commandCenter,
    "chronology.md": "# Chronology\n\n| Datum | Događaj | Dokument | Napomena |\n|---|---|---|---|\n",
    "next-actions.md": nextActions,
    "document-register.md": "# Document Register\n\n| Br. | Dokument | Datum | Tip | Folder | Napomena |\n|---|---|---|---|---|---|\n",
    "ai-work-log.md": "# AI Work Log\n\n| Datum | Alat | Prompt tip | Sačuvano u | Rezultat / Napomena |\n|---|---|---|---|---|\n",
  } satisfies Record<(typeof CONTROL_FILES)[number], string>;
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

async function pathExists(candidate: string) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
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
                try {
                  const commandCenter = await readFile(
                    path.win32.join(matterPath, "00 CONTROL", "command-center.md"),
                    "utf8",
                  );
                  const match = /^Predmet:\s*(.*)$/m.exec(commandCenter);
                  if (match?.[1]?.trim()) matterName = match[1].trim();
                } catch {
                  // Naziv foldera je fallback kada kontrolni fajl nije čitljiv.
                }
                return {
                  clientFolder: clientEntry.name,
                  matterFolder: entry.name,
                  matterName,
                  matterPath,
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
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Aktivni predmeti nisu mogli biti učitani." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Neispravan JSON zahtev." }, { status: 400 }); }
  const input = readInput(body);
  if (!input || !input.client || !input.matterName || !input.openingDate) {
    return NextResponse.json({ error: "Klijent, naziv predmeta i datum otvaranja su obavezni." }, { status: 400 });
  }
  if (!isValidIsoDate(input.openingDate)) {
    return NextResponse.json({ error: "Datum otvaranja mora biti stvaran datum u formatu YYYY-MM-DD." }, { status: 400 });
  }
  if (input.deadline && !isValidIsoDate(input.deadline)) {
    return NextResponse.json({ error: "Rok mora biti prazan ili stvaran datum u formatu YYYY-MM-DD." }, { status: 400 });
  }
  let clientsRoot: string;
  try {
    clientsRoot = await getClientsRoot();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Workspace nije konfigurisan." },
      { status: 500 },
    );
  }
  const clientFolder = sanitizeFolderPart(input.client, 60);
  const clientPath = path.win32.join(clientsRoot, clientFolder);
  if (!isSafeDirectChild(clientsRoot, clientPath)) return NextResponse.json({ error: "Neispravan klijent." }, { status: 400 });
  try { const info = await stat(clientPath); if (!info.isDirectory()) throw new Error(); }
  catch { return NextResponse.json({ error: "Izabrani klijent ne postoji." }, { status: 404 }); }

  const baseFolderName = makeMatterFolderName(input.openingDate, clientFolder, input.matterName);
  const overridePattern = new RegExp(`^${baseFolderName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}_\\d{3}$`);
  if (input.folderNameOverride && !overridePattern.test(input.folderNameOverride)) return NextResponse.json({ error: "Predloženi naziv predmeta nije validan." }, { status: 400 });
  const folderName = input.folderNameOverride || baseFolderName;
  const matterPath = path.win32.join(clientPath, folderName);
  if (!isSafeDirectChild(clientPath, matterPath)) {
    return NextResponse.json({ error: "Predloženi naziv predmeta nije validan." }, { status: 400 });
  }

  try {
    if (await pathExists(matterPath)) {
      return NextResponse.json(
        {
          error: "Predmet sa ovim nazivom već postoji.",
          suggestedFolderName: await firstAvailableFolderName(clientPath, baseFolderName),
        },
        { status: 409 },
      );
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Provera naziva predmeta nije uspela." }, { status: 500 });
  }

  const stagingPath = path.win32.join(clientPath, `.sdj-mike-staging-${randomUUID()}`);
  let stagingCreated = false;
  try {
    await mkdir(stagingPath);
    stagingCreated = true;

    for (const folder of MATTER_FOLDERS) {
      await mkdir(path.win32.join(stagingPath, folder));
    }

    const contents = controlContents(input);
    for (const file of CONTROL_FILES) {
      await writeFile(path.win32.join(stagingPath, "00 CONTROL", file), contents[file], { encoding: "utf8", flag: "wx" });
    }

    if (await pathExists(matterPath)) {
      return NextResponse.json(
        {
          error: "Predmet sa ovim nazivom već postoji.",
          suggestedFolderName: await firstAvailableFolderName(clientPath, baseFolderName),
        },
        { status: 409 },
      );
    }

    await rename(stagingPath, matterPath);
    stagingCreated = false;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EEXIST" || code === "ENOTEMPTY") {
      return NextResponse.json(
        {
          error: "Predmet sa ovim nazivom već postoji.",
          suggestedFolderName: await firstAvailableFolderName(clientPath, baseFolderName),
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? `Predmet nije kreiran: ${error.message}` : "Predmet nije kreiran." },
      { status: 500 },
    );
  } finally {
    if (stagingCreated) {
      try {
        await rm(stagingPath, { recursive: true, force: true });
      } catch {
        // Finalni matter folder nikada nije rollback target.
      }
    }
  }

  return NextResponse.json({
    success: true,
    matterPath,
    folderName,
    createdFolders: [...MATTER_FOLDERS],
    createdFiles: [...CONTROL_FILES],
    errors: [],
  }, { status: 201 });
}
