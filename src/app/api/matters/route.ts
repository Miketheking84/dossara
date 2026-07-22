import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { CLIENTS_ROOT, CONTROL_FILES, isSafeDirectChild, makeMatterFolderName, markdownValue, MATTER_FOLDERS, sanitizeFolderPart } from "@/lib/sdj-files";

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
  const waitingNote = input.waitingDetail ? `\n- Napomena: ${v(input.waitingDetail)}` : "";
  const commandCenter = `# Command Center\n\nKlijent: ${v(input.client)}\nPredmet: ${v(input.matterName)}\nDatum otvaranja: ${v(input.openingDate)}\nStatus: ${v(input.status)}\nPrioritet: ${v(input.priority)}\nOblast prava: ${v(input.legalArea)}\nSledeći korak: ${v(input.nextStep)}\nČeka se od:\n- ${v(input.waitingFrom)}${waitingNote}\nRok: ${v(input.deadline)}\nKratak opis: ${v(input.description)}\nKljučna pitanja:\nRizici:\nOčekivani output: ${v(input.expectedOutput)}\nStatus outputa:\nFinalni dokument:\nFinalni cilj:\n`;
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

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Neispravan JSON zahtev." }, { status: 400 }); }
  const input = readInput(body);
  if (!input || !input.client || !input.matterName || !/^\d{4}-\d{2}-\d{2}$/.test(input.openingDate)) return NextResponse.json({ error: "Klijent, naziv predmeta i datum otvaranja su obavezni." }, { status: 400 });
  const clientFolder = sanitizeFolderPart(input.client, 60);
  const clientPath = path.win32.join(CLIENTS_ROOT, clientFolder);
  if (!isSafeDirectChild(CLIENTS_ROOT, clientPath)) return NextResponse.json({ error: "Neispravan klijent." }, { status: 400 });
  try { const info = await stat(clientPath); if (!info.isDirectory()) throw new Error(); }
  catch { return NextResponse.json({ error: "Izabrani klijent ne postoji." }, { status: 404 }); }

  const baseFolderName = makeMatterFolderName(input.openingDate, clientFolder, input.matterName);
  const overridePattern = new RegExp(`^${baseFolderName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}_\\d{3}$`);
  if (input.folderNameOverride && !overridePattern.test(input.folderNameOverride)) return NextResponse.json({ error: "Predloženi naziv predmeta nije validan." }, { status: 400 });
  const folderName = input.folderNameOverride || baseFolderName;
  const matterPath = path.win32.join(clientPath, folderName);
  try {
    try {
      await stat(matterPath);
      let suggestedFolderName = "";
      for (let index = 1; index <= 999; index += 1) {
        const candidate = `${baseFolderName}_${String(index).padStart(3, "0")}`;
        try { await stat(path.win32.join(clientPath, candidate)); }
        catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") { suggestedFolderName = candidate; break; } throw error; }
      }
      return NextResponse.json({ error: "Predmet sa ovim nazivom već postoji.", suggestedFolderName }, { status: 409 });
    }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    await mkdir(matterPath);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Folder predmeta nije kreiran." }, { status: 500 }); }

  const createdFolders: string[] = []; const createdFiles: string[] = []; const errors: { item: string; message: string }[] = [];
  for (const folder of MATTER_FOLDERS) {
    try { await mkdir(path.win32.join(matterPath, folder)); createdFolders.push(folder); }
    catch (error) { errors.push({ item: folder, message: error instanceof Error ? error.message : "Greška pri kreiranju foldera." }); }
  }
  const contents = controlContents(input);
  for (const file of CONTROL_FILES) {
    try { await writeFile(path.win32.join(matterPath, "00 CONTROL", file), contents[file], { encoding: "utf8", flag: "wx" }); createdFiles.push(file); }
    catch (error) { errors.push({ item: file, message: error instanceof Error ? error.message : "Greška pri kreiranju fajla." }); }
  }
  return NextResponse.json({ success: errors.length === 0, matterPath, folderName, createdFolders, createdFiles, errors }, { status: errors.length ? 207 : 201 });
}
