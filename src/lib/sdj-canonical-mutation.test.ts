import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResolvedActiveMatter } from "@/lib/sdj-matters";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/sdj-workspace", () => ({
  getActiveWorkspaceRoot: vi.fn(),
  getClientsRoot: vi.fn(),
}));

import {
  acceptCanonicalMatterBaseline,
  mutateCanonicalMatter,
  readCanonicalMatterState,
} from "./sdj-canonical-mutation";

const PERMITTED_ROOT = "C:\\SDJ_TEST\\SDJ_LEGAL_TEST";
const V1 = Buffer.from(
  "Ručna napomena: sačuvaj ovo tačno\r\nKlijent: TEST CLIENT\r\nPredmet: Test predmet\r\nOblast prava: Ugovorno pravo\r\nVrsta predmeta: Ugovorni predmet\r\nSledeći korak: Pregled ugovora\r\n",
  "utf8",
);

describe("WRITE-PROD-1A canonical mutation adapter", () => {
  let workspaceRoot: string;
  let matter: ResolvedActiveMatter;
  let commandCenterPath: string;

  beforeEach(async () => {
    await mkdir(PERMITTED_ROOT, { recursive: true });
    workspaceRoot = await mkdtemp(path.join(PERMITTED_ROOT, "write-prod-1a-"));
    const clientsRoot = path.join(workspaceRoot, "01 KLIJENTI");
    const clientFolder = "TEST_CLIENT";
    const clientPath = path.join(clientsRoot, clientFolder);
    const matterFolder = "SDJ_2026-08-20_TEST_CLIENT_SAFE_EDIT";
    const matterPath = path.join(clientPath, matterFolder);
    const controlPath = path.join(matterPath, "00 CONTROL");
    await mkdir(controlPath, { recursive: true });
    commandCenterPath = path.join(controlPath, "command-center.md");
    await writeFile(commandCenterPath, V1);
    matter = {
      workspaceRoot,
      clientsRoot,
      clientFolder,
      clientPath,
      matterFolder,
      matterPath,
      controlPath,
      ulazPath: path.join(matterPath, "01 ULAZ"),
      radnoPath: path.join(matterPath, "02 RADNO"),
      finalnoPath: path.join(matterPath, "03 FINALNO"),
      aiPath: path.join(matterPath, "04 AI"),
    };
  });

  afterEach(async () => {
    await rm(workspaceRoot, { recursive: true, force: true });
  });

  async function acceptCurrentBaseline() {
    const initial = await readCanonicalMatterState(matter);
    const result = await acceptCanonicalMatterBaseline(matter, initial.readToken);
    if (result.code !== "BASELINE_ACCEPTED" && result.code !== "BASELINE_ALREADY_ACCEPTED") {
      throw new Error(`Expected accepted baseline, received ${result.code}`);
    }
    return { initial, result };
  }

  it("reads an exact raw-byte token and reports onboarding without changing bytes", async () => {
    const before = await readFile(commandCenterPath);
    const state = await readCanonicalMatterState(matter);

    expect(state).toMatchObject({
      baselineState: "BASELINE_REQUIRED",
      publicationReady: true,
      values: { matterType: "Ugovorni predmet", nextStep: "Pregled ugovora" },
    });
    expect(state.readToken).toMatch(/^sha256:[0-9a-f]{64}$/u);
    expect(await readFile(commandCenterPath)).toEqual(before);
  });

  it("accepts only the reviewed exact token and leaves canonical business bytes untouched", async () => {
    const before = await readFile(commandCenterPath);
    const { result } = await acceptCurrentBaseline();
    const state = await readCanonicalMatterState(matter);

    expect(result.code).toBe("BASELINE_ACCEPTED");
    expect(state.baselineState).toBe("CURRENT");
    expect(state.acceptedRevisionId).toBe(result.revisionId);
    expect(await readFile(commandCenterPath)).toEqual(before);
  });

  it("closes read V1 -> token T1 -> manual V2 -> accept T1 with CONFLICT and no currentness", async () => {
    const reviewed = await readCanonicalMatterState(matter);
    const manualV2 = Buffer.from(V1.toString("utf8").replace("Pregled ugovora", "Ručna V2 izmjena"), "utf8");
    await writeFile(commandCenterPath, manualV2);

    const result = await acceptCanonicalMatterBaseline(matter, reviewed.readToken);

    expect(result.code).toBe("CONFLICT");
    expect(await readFile(commandCenterPath)).toEqual(manualV2);
    expect(await readCanonicalMatterState(matter)).toMatchObject({
      baselineState: "BASELINE_REQUIRED",
      acceptedRevisionId: undefined,
    });
  });

  it("serializes concurrent identical baseline attempts deterministically", async () => {
    const reviewed = await readCanonicalMatterState(matter);
    const results = await Promise.all([
      acceptCanonicalMatterBaseline(matter, reviewed.readToken),
      acceptCanonicalMatterBaseline(matter, reviewed.readToken),
    ]);

    expect(results.map((result) => result.code).sort()).toEqual([
      "BASELINE_ACCEPTED",
      "BASELINE_ALREADY_ACCEPTED",
    ]);
    const accepted = results.find((result) => result.code === "BASELINE_ACCEPTED");
    const reused = results.find((result) => result.code === "BASELINE_ALREADY_ACCEPTED");
    expect(accepted && "revisionId" in accepted ? accepted.revisionId : undefined).toBe(
      reused && "revisionId" in reused ? reused.revisionId : undefined,
    );
  });

  it("mutates Matter Type through the accepted primitive and preserves unrelated bytes", async () => {
    const { initial, result: baseline } = await acceptCurrentBaseline();
    if (!("revisionId" in baseline)) throw new Error("Missing accepted revision");

    const result = await mutateCanonicalMatter(matter, {
      field: "matterType",
      value: "Privredni spor",
      expectedReadToken: initial.readToken,
      acceptedRevisionId: baseline.revisionId,
    });
    const after = await readFile(commandCenterPath, "utf8");

    expect(result.code).toBe("CANONICAL_SUCCESS");
    expect(after).toContain("Vrsta predmeta: Privredni spor\r\n");
    expect(after).toContain("Ručna napomena: sačuvaj ovo tačno\r\n");
    expect((after.match(/Vrsta predmeta:/gu) ?? [])).toHaveLength(1);
  });

  it("requires the matching accepted revision before changing next step", async () => {
    const { initial } = await acceptCurrentBaseline();
    const before = await readFile(commandCenterPath);

    const result = await mutateCanonicalMatter(matter, {
      field: "nextStep",
      value: "Nova bezbjedna radnja",
      expectedReadToken: initial.readToken,
      acceptedRevisionId: "wrong-revision",
    });

    expect(result.code).toBe("EXTERNAL_BASELINE_REVIEW_REQUIRED");
    expect(await readFile(commandCenterPath)).toEqual(before);
  });

  it("rejects a stale editor after a manual change without overwriting manual bytes", async () => {
    const { initial, result: baseline } = await acceptCurrentBaseline();
    if (!("revisionId" in baseline)) throw new Error("Missing accepted revision");
    const manualV2 = Buffer.from(V1.toString("utf8").replace("Pregled ugovora", "Manual V2 wins"), "utf8");
    await writeFile(commandCenterPath, manualV2);

    const result = await mutateCanonicalMatter(matter, {
      field: "nextStep",
      value: "Stale editor value",
      expectedReadToken: initial.readToken,
      acceptedRevisionId: baseline.revisionId,
    });

    expect(result.code).toBe("CONFLICT");
    expect(await readFile(commandCenterPath)).toEqual(manualV2);
  });

  it("allows one same-target writer and rejects the stale concurrent writer", async () => {
    const { initial, result: baseline } = await acceptCurrentBaseline();
    if (!("revisionId" in baseline)) throw new Error("Missing accepted revision");
    const results = await Promise.all([
      mutateCanonicalMatter(matter, {
        field: "nextStep",
        value: "Writer one",
        expectedReadToken: initial.readToken,
        acceptedRevisionId: baseline.revisionId,
      }),
      mutateCanonicalMatter(matter, {
        field: "nextStep",
        value: "Writer two",
        expectedReadToken: initial.readToken,
        acceptedRevisionId: baseline.revisionId,
      }),
    ]);

    expect(results.map((result) => result.code).sort()).toEqual([
      "CANONICAL_SUCCESS",
      "CONFLICT",
    ]);
    const after = await readFile(commandCenterPath, "utf8");
    expect(after.includes("Sledeći korak: Writer one") || after.includes("Sledeći korak: Writer two")).toBe(true);
  });
});
