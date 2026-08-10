import { lstat, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  MatterWorkUpdateError,
  saveMatterWorkValues,
  updateCommandCenterContent,
  validateMatterWorkValues,
} from "./sdj-command-center-update";
import type { MatterWorkValues } from "./sdj-work-fields";

const cleanup: string[] = [];

afterEach(async () => {
  await Promise.all(cleanup.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

const values: MatterWorkValues = {
  status: "Aktivan",
  priority: "Visok",
  nextStep: "Pripremiti odgovor",
  waitingFor: "Klijent",
  waitingDetail: "Dostava priloga",
  deadline: "2026-08-15",
};

const commandCenter = `# Command Center

Klijent: Balkan Steel Group
Predmet: Spor
Datum otvaranja:
Status:
Prioritet:
Oblast prava:
Sledeći korak: stara vrijednost
stari nastavak
Čeka se od:
Detalj čekanja / napomena:
Rok:
Kratak opis: Ostaje isto
Ključna pitanja:
Rizici:
Očekivani output:
Status outputa:
Finalni dokument:
Finalni cilj:
`;

describe("command-center operational update", () => {
  it("updates only operational fields and preserves the rest of the file", () => {
    const updated = updateCommandCenterContent(commandCenter, values);
    expect(updated).toContain("Klijent: Balkan Steel Group");
    expect(updated).toContain("Status: Aktivan");
    expect(updated).toContain("Sledeći korak: Pripremiti odgovor");
    expect(updated).not.toContain("stari nastavak");
    expect(updated).toContain("Kratak opis: Ostaje isto");
  });

  it("rejects unknown options, extra fields and invalid dates", () => {
    expect(() => validateMatterWorkValues({ ...values, status: "Nepoznat" })).toThrow(MatterWorkUpdateError);
    expect(() => validateMatterWorkValues({ ...values, extra: "x" })).toThrow(MatterWorkUpdateError);
    expect(() => validateMatterWorkValues({ ...values, deadline: "15.08.2026" })).toThrow(MatterWorkUpdateError);
  });

  it("supports the standard control file without a waiting-detail field", () => {
    const standardFile = commandCenter.replace("Detalj čekanja / napomena:\n", "");
    const updated = updateCommandCenterContent(standardFile, {
      ...values,
      waitingDetail: "",
    });

    expect(updated).toContain("Čeka se od: Klijent");
    expect(updated).not.toContain("Detalj čekanja / napomena:");
    expect(updated).toContain("Rok: 2026-08-15");
  });

  it("adds a waiting detail only when the user actually enters one", () => {
    const standardFile = commandCenter.replace("Detalj čekanja / napomena:\n", "");
    const updated = updateCommandCenterContent(standardFile, values);

    expect(updated).toContain("Čeka se od: Klijent\r\nDetalj čekanja / napomena: Dostava priloga");
  });

  it("writes through a same-folder temporary file and leaves no temporary artifact", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "sdj-command-center-"));
    cleanup.push(directory);
    const filePath = path.join(directory, "command-center.md");
    await writeFile(filePath, commandCenter, "utf8");

    await saveMatterWorkValues(filePath, values);

    expect(await readFile(filePath, "utf8")).toContain("Rok: 2026-08-15");
    const info = await lstat(filePath);
    expect(info.isFile()).toBe(true);
    expect(await readdir(directory)).toEqual(["command-center.md"]);
  });
});
