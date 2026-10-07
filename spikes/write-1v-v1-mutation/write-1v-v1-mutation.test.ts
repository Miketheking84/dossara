import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, open, readFile, readdir, rename, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { PERMITTED_TEST_ROOT } from "../foundation-hardening/persistence-spike";
import {
  acceptMatterControlBaseline,
  currentMatterControl,
  exactReadToken,
  inspectMatterControlRecovery,
  losslessTransform,
  mutateMatterControl,
  WINDOWS_PUBLICATION_HELPER,
  withWindowsTargetIdentityGuard,
} from "./canonical-mutation";
import type { BaselineRequest, MutationRequest } from "./contracts";

const CONTROL_PATH = path.join("Matter-1", "00 CONTROL", "command-center.md");
const createdRoots: string[] = [];
const execFileAsync = promisify(execFile);
const HOLD_OPEN_HELPER = path.join(path.dirname(WINDOWS_PUBLICATION_HELPER), "windows-hold-open.ps1");

interface HelperMessage {
  status: string;
  detail?: string;
}

async function startPublicationHelper(parent: string) {
  const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", WINDOWS_PUBLICATION_HELPER, "-DirectoryPath", parent], {
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  let stderr = "";
  child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString("utf8"); });
  const reader = createInterface({ input: child.stdout, crlfDelay: Infinity });
  const lines = reader[Symbol.asyncIterator]();
  const next = async (): Promise<HelperMessage> => {
    const result = await lines.next();
    if (result.done) throw new Error(`WRITE-1V helper closed unexpectedly: ${stderr}`);
    return JSON.parse(result.value) as HelperMessage;
  };
  expect((await next()).status).toBe("READY");
  return {
    async send(command: string | Record<string, unknown>): Promise<HelperMessage> {
      child.stdin.write(`${typeof command === "string" ? command : JSON.stringify(command)}\n`);
      return next();
    },
    async close(): Promise<void> {
      if (child.exitCode === null) {
        const childClosed = new Promise<void>((resolve) => child.once("close", () => resolve()));
        child.stdin.end("CLOSE\n");
        await childClosed;
      }
      reader.close();
    },
  };
}

async function holdCanonicalOpen(filePath: string) {
  const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", HOLD_OPEN_HELPER, "-FilePath", filePath], {
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  const reader = createInterface({ input: child.stdout, crlfDelay: Infinity });
  const lines = reader[Symbol.asyncIterator]();
  const ready = await lines.next();
  if (ready.done || ready.value !== "READY") throw new Error("Windows hold-open helper failed to become ready");
  return {
    async release(): Promise<void> {
      if (child.exitCode === null) {
        const childClosed = new Promise<void>((resolve) => child.once("close", () => resolve()));
        child.stdin.end("RELEASE\n");
        await childClosed;
      }
      reader.close();
    },
  };
}

function controlBytes(options: { bom?: boolean; matterType?: string | null; duplicateNextStep?: boolean; newline?: "\n" | "\r\n" } = {}): Buffer {
  const newline = options.newline ?? "\r\n";
  const lines = [
    "# Command Center",
    "Oblast prava: Građansko pravo",
    ...(options.matterType === null ? [] : [`Vrsta predmeta: ${options.matterType ?? "Nasljedno pravo"}`]),
    "Nepoznata oznaka: sačuvaj",
    "  nastavak koji nije poznato polje",
    "Sledeći korak: Stari korak   ",
    ...(options.duplicateNextStep ? ["Sledeći korak: Drugi korak"] : []),
    "Ručna bilješka ostaje.",
    "",
  ];
  const body = Buffer.from(lines.join(newline), "utf8");
  return options.bom ? Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), body]) : body;
}

async function workspace(bytes = controlBytes({ bom: true })): Promise<{ root: string; target: string; baseline: { revisionId: string; readToken: string } }> {
  const fixture = await unacceptedWorkspace(bytes);
  const baseline = await acceptMatterControlBaseline(baselineRequest(fixture, `baseline-${randomUUID()}`));
  if (baseline.code !== "BASELINE_ACCEPTED") throw new Error(`WRITE-1V baseline failed: ${baseline.code}`);
  return { ...fixture, baseline };
}

async function unacceptedWorkspace(bytes = controlBytes({ bom: true })): Promise<{ root: string; target: string; bytes: Buffer }> {
  await mkdir(PERMITTED_TEST_ROOT, { recursive: true });
  const root = await mkdtemp(path.join(PERMITTED_TEST_ROOT, "write1v-"));
  createdRoots.push(root);
  const target = path.join(root, CONTROL_PATH);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  return { root, target, bytes };
}

function baselineRequest(
  fixture: Awaited<ReturnType<typeof unacceptedWorkspace>>,
  transactionId: string,
  overrides: Partial<BaselineRequest> = {},
): BaselineRequest {
  return {
    workspaceRoot: fixture.root,
    canonicalRelativePath: CONTROL_PATH,
    matterId: "matter-1",
    transactionId,
    revisionId: `revision-${transactionId}`,
    expectedReadToken: exactReadToken(fixture.bytes),
    actor: "write-1v-test",
    source: "WRITE-1V_BASELINE",
    recordedAt: "2026-08-18T12:00:00.000Z",
    ...overrides,
  };
}

async function evidenceJsonFiles(root: string): Promise<string[]> {
  const result: string[] = [];
  async function visit(directory: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
    for (const entry of entries) {
      const child = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(child);
      else if (entry.isFile() && entry.name.endsWith(".json")) result.push(child);
    }
  }
  await visit(path.join(root, "00 CONTROL", "vla", "objects"));
  return result.sort();
}

function request(
  fixture: Awaited<ReturnType<typeof workspace>>,
  transactionId: string,
  overrides: Partial<MutationRequest> = {},
): MutationRequest {
  return {
    workspaceRoot: fixture.root,
    canonicalRelativePath: CONTROL_PATH,
    matterId: "matter-1",
    transactionId,
    resultingRevisionId: `revision-${transactionId}`,
    acceptedRevisionId: fixture.baseline.revisionId,
    expectedReadToken: fixture.baseline.readToken,
    actor: "write-1v-test",
    source: "WRITE-1V_TEST",
    recordedAt: "2026-08-18T12:00:01.000Z",
    mutations: [{ field: "nextStep", value: "Novi korak" }],
    ...overrides,
  };
}

afterEach(async () => {
  await Promise.all(createdRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("BASE-1 exact-token external baseline acceptance", () => {
  it("B1 accepts an unrecognized canonical baseline only for its exact raw-byte token", async () => {
    const fixture = await unacceptedWorkspace();
    const result = await acceptMatterControlBaseline(baselineRequest(fixture, "base-b1"));
    expect(result).toMatchObject({ code: "BASELINE_ACCEPTED", revisionId: "revision-base-b1", readToken: exactReadToken(fixture.bytes) });
  });

  it("B2 returns CONFLICT for a wrong exact-byte token", async () => {
    const fixture = await unacceptedWorkspace();
    const result = await acceptMatterControlBaseline(baselineRequest(fixture, "base-b2", { expectedReadToken: exactReadToken(Buffer.from("wrong")) }));
    expect(result).toMatchObject({ code: "CONFLICT", observedReadToken: exactReadToken(fixture.bytes) });
  });

  it("B3 detects a manual edit between read and baseline acceptance", async () => {
    const fixture = await unacceptedWorkspace();
    const reviewedToken = exactReadToken(fixture.bytes);
    const manual = Buffer.concat([fixture.bytes, Buffer.from("Manual V2\r\n")]);
    await writeFile(fixture.target, manual);
    const result = await acceptMatterControlBaseline(baselineRequest(fixture, "base-b3", { expectedReadToken: reviewedToken }));
    expect(result.code).toBe("CONFLICT");
    expect(await readFile(fixture.target)).toEqual(manual);
  });

  it("B4 writes no accepted revision or receipt for a conflict", async () => {
    const fixture = await unacceptedWorkspace();
    const result = await acceptMatterControlBaseline(baselineRequest(fixture, "base-b4", { expectedReadToken: exactReadToken(Buffer.from("stale")) }));
    expect(result.code).toBe("CONFLICT");
    expect(await evidenceJsonFiles(fixture.root)).toEqual([]);
    expect(await currentMatterControl(fixture.root, "matter-1", CONTROL_PATH)).toBeUndefined();
  });

  it("B5 leaves canonical bytes byte-identical after successful acceptance", async () => {
    const fixture = await unacceptedWorkspace(controlBytes({ bom: true, newline: "\n" }));
    const before = await readFile(fixture.target);
    expect((await acceptMatterControlBaseline(baselineRequest(fixture, "base-b5"))).code).toBe("BASELINE_ACCEPTED");
    expect(await readFile(fixture.target)).toEqual(before);
  });

  it("B6 exposes a usable accepted revision identity and exact token", async () => {
    const fixture = await unacceptedWorkspace();
    const accepted = await acceptMatterControlBaseline(baselineRequest(fixture, "base-b6"));
    expect(accepted.code).toBe("BASELINE_ACCEPTED");
    expect(await currentMatterControl(fixture.root, "matter-1", CONTROL_PATH)).toMatchObject({ revisionId: "revision-base-b6", readToken: exactReadToken(fixture.bytes) });
  });

  it("B7 permits a following nextStep mutation from the accepted baseline", async () => {
    const fixture = await workspace();
    const result = await mutateMatterControl(request(fixture, "base-b7", { mutations: [{ field: "nextStep", value: "BASE-1 naredni korak" }] }));
    expect(result.code).toBe("CANONICAL_SUCCESS");
    expect(await readFile(fixture.target, "utf8")).toContain("Sledeći korak: BASE-1 naredni korak");
  });

  it("B8 permits a following accepted Matter Type mutation", async () => {
    const fixture = await workspace();
    const result = await mutateMatterControl(request(fixture, "base-b8", { mutations: [{ field: "matterType", value: "Privredni spor" }] }));
    expect(result.code).toBe("CANONICAL_SUCCESS");
    expect(await readFile(fixture.target, "utf8")).toContain("Vrsta predmeta: Privredni spor");
  });

  it("B9 preserves unknown and manual continuation bytes during acceptance", async () => {
    const fixture = await unacceptedWorkspace();
    const before = await readFile(fixture.target);
    expect((await acceptMatterControlBaseline(baselineRequest(fixture, "base-b9"))).code).toBe("BASELINE_ACCEPTED");
    expect(await readFile(fixture.target)).toEqual(before);
    expect(before.toString("utf8")).toContain("  nastavak koji nije poznato polje");
  });

  it("B10 preserves a legacy unknown Matter Type through onboarding and nextStep mutation", async () => {
    const fixture = await workspace(controlBytes({ matterType: "Nasljedno pravo" }));
    expect((await mutateMatterControl(request(fixture, "base-b10"))).code).toBe("CANONICAL_SUCCESS");
    expect(await readFile(fixture.target, "utf8")).toContain("Vrsta predmeta: Nasljedno pravo");
  });

  it("B11 keeps a missing Matter Type missing through onboarding and nextStep mutation", async () => {
    const fixture = await workspace(controlBytes({ matterType: null }));
    expect((await mutateMatterControl(request(fixture, "base-b11"))).code).toBe("CANONICAL_SUCCESS");
    expect(await readFile(fixture.target, "utf8")).not.toContain("Vrsta predmeta:");
  });

  it("B12 deterministically reuses one accepted baseline for concurrent same-token attempts", async () => {
    const fixture = await unacceptedWorkspace();
    const [first, second] = await Promise.all([
      acceptMatterControlBaseline(baselineRequest(fixture, "base-b12-first")),
      acceptMatterControlBaseline(baselineRequest(fixture, "base-b12-second")),
    ]);
    expect([first.code, second.code].sort()).toEqual(["BASELINE_ACCEPTED", "BASELINE_ALREADY_ACCEPTED"]);
    const accepted = first.code === "BASELINE_ACCEPTED" ? first : second;
    const repeated = first.code === "BASELINE_ALREADY_ACCEPTED" ? first : second;
    if (accepted.code !== "BASELINE_ACCEPTED" || repeated.code !== "BASELINE_ALREADY_ACCEPTED") {
      throw new Error("Concurrent baseline outcomes were not deterministic");
    }
    expect(repeated).toMatchObject({ revisionId: accepted.revisionId, readToken: accepted.readToken });
    expect(await evidenceJsonFiles(fixture.root)).toHaveLength(2);
  });

  it("does not create a new initial baseline over an existing accepted history", async () => {
    const fixture = await workspace();
    const manual = Buffer.concat([await readFile(fixture.target), Buffer.from("External V2\r\n")]);
    await writeFile(fixture.target, manual);
    const result = await acceptMatterControlBaseline(baselineRequest(
      { root: fixture.root, target: fixture.target, bytes: manual },
      "base-existing-history",
    ));
    expect(result).toMatchObject({
      code: "EXTERNAL_BASELINE_REVIEW_REQUIRED",
      currentRevisionId: fixture.baseline.revisionId,
      observedReadToken: exactReadToken(manual),
    });
    expect(await evidenceJsonFiles(fixture.root)).toHaveLength(2);
    expect(await currentMatterControl(fixture.root, "matter-1", CONTROL_PATH)).toMatchObject({
      revisionId: fixture.baseline.revisionId,
      readToken: fixture.baseline.readToken,
    });
  });
});

describe("WRITE-1V exact-byte and lossless mutation contract", () => {
  it("hashes BOM, newline style, whitespace and unknown content as exact bytes", () => {
    const crlfBom = controlBytes({ bom: true, newline: "\r\n" });
    const lf = controlBytes({ bom: false, newline: "\n" });
    expect(exactReadToken(crlfBom)).toMatch(/^sha256:[0-9a-f]{64}$/u);
    expect(exactReadToken(crlfBom)).not.toBe(exactReadToken(lf));
    expect(exactReadToken(Buffer.concat([crlfBom, Buffer.from(" ")]))).not.toBe(exactReadToken(crlfBom));
  });

  it("performs a normal mutation and preserves every byte outside the targeted value", async () => {
    const fixture = await workspace();
    const before = await readFile(fixture.target);
    const expected = losslessTransform(before, [{ field: "nextStep", value: "Novi korak" }]);
    const result = await mutateMatterControl(request(fixture, "success-1"));
    expect(result.code, result.detail).toBe("CANONICAL_SUCCESS");
    expect(await readFile(fixture.target)).toEqual(expected);
    expect((await readFile(fixture.target, "utf8"))).toContain("  nastavak koji nije poznato polje");
    expect(await currentMatterControl(fixture.root, "matter-1", CONTROL_PATH)).toMatchObject({ revisionId: "revision-success-1", readToken: exactReadToken(expected) });
  });

  it("rejects a manual edit after read as CONFLICT without temp publication", async () => {
    const fixture = await workspace();
    const manual = Buffer.concat([await readFile(fixture.target), Buffer.from("Ručna izmjena\r\n", "utf8")]);
    await writeFile(fixture.target, manual);
    const result = await mutateMatterControl(request(fixture, "conflict-manual"));
    expect(result.code).toBe("CONFLICT");
    expect(await readFile(fixture.target)).toEqual(manual);
    expect((await readdir(path.dirname(fixture.target))).some((name) => name.includes(".write1v.tmp"))).toBe(false);
  });

  it("serializes two stale writers but still requires the second exact hash", async () => {
    const fixture = await workspace();
    const first = request(fixture, "writer-first", { mutations: [{ field: "nextStep", value: "Prvi" }] });
    const second = request(fixture, "writer-second", { mutations: [{ field: "nextStep", value: "Drugi" }], recordedAt: "2026-08-18T12:00:02.000Z" });
    const [left, right] = await Promise.all([mutateMatterControl(first), mutateMatterControl(second)]);
    expect([left.code, right.code].sort()).toEqual(["CANONICAL_SUCCESS", "CONFLICT"]);
    expect(await readFile(fixture.target, "utf8")).toContain(`Sledeći korak: ${left.code === "CANONICAL_SUCCESS" ? "Prvi" : "Drugi"}`);
  });

  it("fails closed on a duplicate target and leaves canonical bytes intact", async () => {
    const fixture = await workspace(controlBytes({ duplicateNextStep: true }));
    const before = await readFile(fixture.target);
    const result = await mutateMatterControl(request(fixture, "duplicate-target"));
    expect(result.code).toBe("VALIDATION_FAILED");
    expect(await readFile(fixture.target)).toEqual(before);
  });

  it("fails closed when a required existing target is missing", async () => {
    const bytes = Buffer.from("# Command Center\r\nOblast prava: Građansko pravo\r\n", "utf8");
    const fixture = await workspace(bytes);
    const result = await mutateMatterControl(request(fixture, "missing-target"));
    expect(result.code).toBe("VALIDATION_FAILED");
    expect(await readFile(fixture.target)).toEqual(bytes);
  });

  it("preserves a legacy unknown Matter Type during an unrelated mutation", async () => {
    const fixture = await workspace(controlBytes({ matterType: "Nasljedno pravo" }));
    expect((await mutateMatterControl(request(fixture, "legacy-preserve"))).code).toBe("CANONICAL_SUCCESS");
    expect(await readFile(fixture.target, "utf8")).toContain("Vrsta predmeta: Nasljedno pravo");
  });

  it("keeps a missing Matter Type missing during an unrelated mutation", async () => {
    const fixture = await workspace(controlBytes({ matterType: null }));
    expect((await mutateMatterControl(request(fixture, "missing-preserve"))).code).toBe("CANONICAL_SUCCESS");
    const after = await readFile(fixture.target, "utf8");
    expect(after).not.toContain("Vrsta predmeta:");
    expect(after).not.toContain("Drugo");
  });

  it("allows an explicit MTC-1 Matter Type replacement", async () => {
    const fixture = await workspace();
    const result = await mutateMatterControl(request(fixture, "matter-type-valid", { mutations: [{ field: "matterType", value: "Radni spor" }] }));
    expect(result.code).toBe("CANONICAL_SUCCESS");
    expect(await readFile(fixture.target, "utf8")).toContain("Vrsta predmeta: Radni spor");
  });

  it("rejects an explicit Matter Type outside the MTC-1 vocabulary before mutation", async () => {
    const fixture = await workspace();
    const before = await readFile(fixture.target);
    await expect(mutateMatterControl(request(fixture, "matter-type-invalid", { mutations: [{ field: "matterType", value: "Nasljedno pravo" }] }))).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    expect(await readFile(fixture.target)).toEqual(before);
  });
});

describe("WRITE-1V publication, durability ordering and currentness", () => {
  for (const failurePoint of ["TEMP_CREATE", "TEMP_WRITE", "TEMP_SYNC"] as const) {
    it(`keeps canonical old and noncurrent when ${failurePoint} fails`, async () => {
      const fixture = await workspace();
      const before = await readFile(fixture.target);
      const result = await mutateMatterControl(request(fixture, `failure-${failurePoint.toLowerCase()}`), { faults: { failurePoint } });
      expect(result.code).toBe("IO_FAILED");
      expect(await readFile(fixture.target)).toEqual(before);
      expect((await currentMatterControl(fixture.root, "matter-1", CONTROL_PATH))?.revisionId).toBe(fixture.baseline.revisionId);
    });
  }

  it("keeps the original canonical file when publication fails before handle-relative commit", async () => {
    const fixture = await workspace();
    const before = await readFile(fixture.target);
    const result = await mutateMatterControl(request(fixture, "publication-failure"), { faults: { failurePoint: "PUBLICATION" } });
    expect(result.code).toBe("IO_FAILED");
    expect(await readFile(fixture.target)).toEqual(before);
  });

  it("returns RECOVERY_REQUIRED when final reread/hash does not match prepared bytes", async () => {
    const fixture = await workspace();
    const result = await mutateMatterControl(request(fixture, "final-mismatch"), { faults: { failurePoint: "FINAL_REREAD_MISMATCH", finalMismatchBytes: Buffer.from("manual-after-publication", "utf8") } });
    expect(result.code).toBe("RECOVERY_REQUIRED");
    expect((await currentMatterControl(fixture.root, "matter-1", CONTROL_PATH))?.revisionId).toBe(fixture.baseline.revisionId);
  });

  it("does not make a prepared revision current without a successful receipt", async () => {
    const fixture = await workspace();
    const result = await mutateMatterControl(request(fixture, "prepared-only"), { faults: { failurePoint: "PUBLICATION" } });
    expect(result.preparedRevisionId).toBe("revision-prepared-only");
    const recovery = await inspectMatterControlRecovery(fixture.root, "matter-1", CONTROL_PATH);
    expect(recovery.code).toBe("PREPARED_NOT_CURRENT");
    expect(recovery.currentRevisionId).toBe(fixture.baseline.revisionId);
  });

  it("does not claim success when the receipt cannot be written after verified publication", async () => {
    const fixture = await workspace();
    const result = await mutateMatterControl(request(fixture, "receipt-failure"), { faults: { failurePoint: "RECEIPT_WRITE" } });
    expect(result.code).toBe("RECOVERY_REQUIRED");
    expect((await currentMatterControl(fixture.root, "matter-1", CONTROL_PATH))?.revisionId).toBe(fixture.baseline.revisionId);
  });

  it("keeps verified canonical success when derived update fails", async () => {
    const fixture = await workspace();
    const result = await mutateMatterControl(request(fixture, "derived-failure"), { faults: { failurePoint: "DERIVED_UPDATE" } });
    expect(result.code).toBe("CANONICAL_SUCCESS_DERIVED_REBUILD_REQUIRED");
    expect((await currentMatterControl(fixture.root, "matter-1", CONTROL_PATH))?.revisionId).toBe("revision-derived-failure");
    expect(await readFile(fixture.target, "utf8")).toContain("Sledeći korak: Novi korak");
  });

});

describe("WRITE-1V cold recovery decision table", () => {
  it("R1 does not auto-publish an orphan temp", async () => {
    const fixture = await workspace();
    const orphan = path.join(path.dirname(fixture.target), ".command-center.md.orphan.write1v.tmp");
    await writeFile(orphan, "untrusted-temp", "utf8");
    const recovery = await inspectMatterControlRecovery(fixture.root, "matter-1", CONTROL_PATH);
    expect(recovery.code).toBe("ORPHAN_TEMP_NOT_PUBLISHED");
    expect(await readFile(fixture.target)).toEqual(controlBytes({ bom: true }));
  });

  it("R2 recognizes canonical bytes matching the successful receipt", async () => {
    const fixture = await workspace();
    const first = await mutateMatterControl(request(fixture, "recovery-committed"));
    expect(first.code).toBe("CANONICAL_SUCCESS");
    const second = await mutateMatterControl(request(fixture, "recovery-committed-2", {
      acceptedRevisionId: "revision-recovery-committed",
      expectedReadToken: first.resultingReadToken!,
      recordedAt: "2026-08-18T12:00:02.000Z",
    }));
    expect(second.code).toBe("CANONICAL_SUCCESS");
    expect((await inspectMatterControlRecovery(fixture.root, "matter-1", CONTROL_PATH)).code).toBe("COMMITTED");
  });

  it("R3 requires recovery when canonical bytes contradict the receipt chain", async () => {
    const fixture = await workspace();
    expect((await mutateMatterControl(request(fixture, "recovery-inconsistent"))).code).toBe("CANONICAL_SUCCESS");
    await writeFile(fixture.target, "external-contradiction", "utf8");
    expect((await inspectMatterControlRecovery(fixture.root, "matter-1", CONTROL_PATH)).code).toBe("RECOVERY_REQUIRED");
  });

  it("R4 keeps a prepared revision without a receipt noncurrent", async () => {
    const fixture = await workspace();
    await mutateMatterControl(request(fixture, "recovery-prepared"), { faults: { failurePoint: "TEMP_SYNC" } });
    const recovery = await inspectMatterControlRecovery(fixture.root, "matter-1", CONTROL_PATH);
    expect(recovery.code).toBe("PREPARED_NOT_CURRENT");
    expect(recovery.currentRevisionId).toBe(fixture.baseline.revisionId);
  });
});

describe("WRITE-1V Windows identity, sharing and namespace qualification", () => {
  it("holds trusted parent identity and blocks matter-directory substitution", async () => {
    const fixture = await workspace();
    const matterDirectory = path.join(fixture.root, "Matter-1");
    const parked = path.join(fixture.root, "Matter-1-parked");
    let substituted = false;
    await withWindowsTargetIdentityGuard(fixture.target, async (publisher) => {
      await publisher.verify();
      try {
        await rename(matterDirectory, parked);
        substituted = true;
        await rename(parked, matterDirectory);
      } catch {
        // Expected: held directory handles deny delete/rename sharing.
      }
    });
    expect(substituted).toBe(false);
    expect(await readFile(fixture.target)).toEqual(controlBytes({ bom: true }));
  });

  it("rejects a junction that would redirect a canonical path into another matter", async () => {
    await mkdir(PERMITTED_TEST_ROOT, { recursive: true });
    const root = await mkdtemp(path.join(PERMITTED_TEST_ROOT, "write1v-wrong-matter-"));
    createdRoots.push(root);
    const otherTarget = path.join(root, "Matter-2", "00 CONTROL", "command-center.md");
    await mkdir(path.dirname(otherTarget), { recursive: true });
    await writeFile(otherTarget, controlBytes());
    await symlink(path.join(root, "Matter-2"), path.join(root, "Matter-1"), "junction");
    const request: BaselineRequest = {
      workspaceRoot: root,
      canonicalRelativePath: CONTROL_PATH,
      matterId: "matter-1",
      transactionId: `wrong-matter-${randomUUID()}`,
      revisionId: `wrong-matter-revision-${randomUUID()}`,
      expectedReadToken: exactReadToken(controlBytes()),
      actor: "write-1v-test",
      source: "WRITE-1V_WRONG_MATTER",
      recordedAt: "2026-08-18T12:00:00.000Z",
    };
    await expect(acceptMatterControlBaseline(request)).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    expect(await readFile(otherTarget)).toEqual(controlBytes());
  });

  it("publishes the verified source object when its original pathname is substituted", async () => {
    const fixture = await workspace();
    const replacement = path.join(path.dirname(fixture.target), ".source-binding.write1v.tmp");
    const parked = `${replacement}.parked`;
    const proposed = Buffer.from("verified-source-object\r\n", "utf8");
    await writeFile(replacement, proposed);
    const helper = await startPublicationHelper(path.dirname(fixture.target));
    try {
      const prepared = await helper.send({
        command: "PUBLISH",
        target: fixture.target,
        replacement,
        expectedTargetHash: exactReadToken(await readFile(fixture.target)).slice(7),
        expectedResultHash: exactReadToken(proposed).slice(7),
      });
      expect(prepared.status, prepared.detail).toBe("RENAME_READY");
      await rename(replacement, parked);
      await writeFile(replacement, "attacker-path-bytes", "utf8");
      const committed = await helper.send("COMMIT");
      expect(committed.status, committed.detail).toBe("PUBLISHED");
    } finally {
      await helper.close();
    }
    expect(await readFile(fixture.target)).toEqual(proposed);
    expect(await readFile(replacement, "utf8")).toBe("attacker-path-bytes");
    await expect(readFile(parked)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("supports an ordinary open reader without weakening final verification", async () => {
    const fixture = await workspace();
    const reader = await open(fixture.target, "r");
    try {
      const result = await mutateMatterControl(request(fixture, "ordinary-reader"));
      expect(result.code, result.detail).toBe("CANONICAL_SUCCESS");
      expect(exactReadToken(await readFile(fixture.target))).toBe(result.resultingReadToken);
    } finally {
      await reader.close();
    }
  });

  it("retries transient sharing contention and publishes after the reader releases", async () => {
    const fixture = await workspace();
    const replacement = path.join(path.dirname(fixture.target), ".transient-sharing.write1v.tmp");
    const proposed = Buffer.from("transient-sharing-result\r\n", "utf8");
    await writeFile(replacement, proposed);
    const holder = await holdCanonicalOpen(fixture.target);
    const helper = await startPublicationHelper(path.dirname(fixture.target));
    let released = false;
    try {
      const prepared = await helper.send({
        command: "PUBLISH",
        target: fixture.target,
        replacement,
        expectedTargetHash: exactReadToken(await readFile(fixture.target)).slice(7),
        expectedResultHash: exactReadToken(proposed).slice(7),
      });
      expect(prepared.status, prepared.detail).toBe("RENAME_READY");
      const committing = helper.send("COMMIT");
      await delay(100);
      await holder.release();
      released = true;
      const committed = await committing;
      expect(committed.status, committed.detail).toBe("PUBLISHED");
    } finally {
      if (!released) await holder.release();
      await helper.close();
    }
    expect(await readFile(fixture.target)).toEqual(proposed);
  }, 30_000);

  it("exhausts bounded sharing retry and returns safe IO failure", async () => {
    const fixture = await workspace();
    const before = await readFile(fixture.target);
    const holder = await holdCanonicalOpen(fixture.target);
    try {
      const result = await mutateMatterControl(request(fixture, "sharing-contention"));
      expect(result.code).toBe("IO_FAILED");
      expect(result.detail).toMatch(/sharing violation|NTSTATUS 0xC0000043/u);
      expect(await readFile(fixture.target)).toEqual(before);
    } finally {
      await holder.release();
    }
  }, 30_000);

  it("does not bypass the Windows read-only attribute", async () => {
    const fixture = await workspace();
    const before = await readFile(fixture.target);
    await execFileAsync("attrib.exe", ["+R", fixture.target], { windowsHide: true });
    try {
      const result = await mutateMatterControl(request(fixture, "read-only"));
      expect(result.code).toBe("IO_FAILED");
      expect(await readFile(fixture.target)).toEqual(before);
    } finally {
      await execFileAsync("attrib.exe", ["-R", fixture.target], { windowsHide: true });
    }
  }, 30_000);

  it("completes 300 normal publications with continuous valid namespace content", async () => {
    const fixture = await workspace();
    await writeFile(fixture.target, "write1v-stress-version-0\r\n", "utf8");
    let stop = false;
    let readerObservations = 0;
    let enoentObservations = 0;
    let invalidPartialReads = 0;
    let hashMismatches = 0;
    let unexpectedIoOutcomes = 0;
    const reader = (async () => {
      while (!stop) {
        try {
          const observed = await readFile(fixture.target, "utf8");
          readerObservations += 1;
          if (!/^write1v-stress-version-\d+\r\n$/u.test(observed)) invalidPartialReads += 1;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") enoentObservations += 1;
          else unexpectedIoOutcomes += 1;
        }
        await delay(0);
      }
    })();
    const started = performance.now();
    await withWindowsTargetIdentityGuard(fixture.target, async (publisher) => {
      for (let index = 1; index <= 300; index += 1) {
        const before = await readFile(fixture.target);
        const proposed = Buffer.from(`write1v-stress-version-${index}\r\n`, "utf8");
        const replacement = path.join(path.dirname(fixture.target), `.stress-${index}.write1v.tmp`);
        const handle = await open(replacement, "wx");
        try {
          await handle.writeFile(proposed);
          await handle.sync();
        } finally {
          await handle.close();
        }
        try {
          await publisher.publish(fixture.target, replacement, exactReadToken(before), exactReadToken(proposed));
        } catch {
          unexpectedIoOutcomes += 1;
          throw new Error(`Unexpected WRITE-1V publication failure at iteration ${index}`);
        }
        if (exactReadToken(await readFile(fixture.target)) !== exactReadToken(proposed)) hashMismatches += 1;
      }
    });
    stop = true;
    await reader;
    const unexpectedTempLeftovers = (await readdir(path.dirname(fixture.target))).filter((name) => name.endsWith(".write1v.tmp")).length;
    const summary = {
      publications: 300,
      readerObservations,
      enoentObservations,
      invalidPartialReads,
      hashMismatches,
      unexpectedIoOutcomes,
      unexpectedTempLeftovers,
      elapsedMs: Number((performance.now() - started).toFixed(3)),
    };
    console.info(`WRITE1V_STRESS ${JSON.stringify(summary)}`);
    expect(summary).toMatchObject({
      publications: 300,
      enoentObservations: 0,
      invalidPartialReads: 0,
      hashMismatches: 0,
      unexpectedIoOutcomes: 0,
      unexpectedTempLeftovers: 0,
    });
    expect(readerObservations).toBeGreaterThan(0);
  }, 120_000);

  it("records the accepted negative capability without claiming destination CAS", async () => {
    const fixture = await workspace();
    const replacement = path.join(path.dirname(fixture.target), ".negative-capability.write1v.tmp");
    const parkedOriginal = `${fixture.target}.external-v1`;
    const proposed = Buffer.from("application-proposed-result\r\n", "utf8");
    const externalV2 = Buffer.from("independent-external-v2\r\n", "utf8");
    await writeFile(replacement, proposed);
    const helper = await startPublicationHelper(path.dirname(fixture.target));
    try {
      const prepared = await helper.send({
        command: "PUBLISH",
        target: fixture.target,
        replacement,
        expectedTargetHash: exactReadToken(await readFile(fixture.target)).slice(7),
        expectedResultHash: exactReadToken(proposed).slice(7),
      });
      expect(prepared.status, prepared.detail).toBe("RENAME_READY");
      await rename(fixture.target, parkedOriginal);
      await writeFile(fixture.target, externalV2);
      const committed = await helper.send("COMMIT");
      expect(committed.status, committed.detail).toBe("PUBLISHED");
    } finally {
      await helper.close();
    }
    expect(await readFile(fixture.target)).toEqual(proposed);
    expect(await readFile(parkedOriginal)).toEqual(controlBytes({ bom: true }));
    expect(await readFile(fixture.target)).not.toEqual(externalV2);
    // PASS means the ACA-1/WAC-1A negative capability remains reproducible and explicitly unsupported.
  });
});


describe("bounded transaction replay", () => {
  it("returns the same receipt without publishing twice and refuses changed review identity", async () => {
    const fixture = await workspace(); const tx = request(fixture, `alpha-replay-${randomUUID()}`);
    const first = await mutateMatterControl(tx, { replay: true });
    const files = await evidenceJsonFiles(fixture.root); const before = await readFile(fixture.target);
    const second = await mutateMatterControl(tx, { replay: true });
    expect(second.code).toBe("CANONICAL_SUCCESS"); expect(second.currentRevisionId).toBe(first.currentRevisionId);
    expect(await evidenceJsonFiles(fixture.root)).toEqual(files); expect(await readFile(fixture.target)).toEqual(before);
    await expect(mutateMatterControl({ ...tx, actor: "different lawyer" }, { replay: true })).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });
});
