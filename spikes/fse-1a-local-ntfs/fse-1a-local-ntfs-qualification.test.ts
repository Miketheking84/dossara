import { spawn, execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, open, readFile, readdir, rename, rm, symlink, writeFile, lstat } from "node:fs/promises";
import { release as osRelease } from "node:os";
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
} from "../write-1v-v1-mutation/canonical-mutation";
import type { BaselineRequest, MutationRequest } from "../write-1v-v1-mutation/contracts";

const CONTROL_PATH = path.join("Matter-1", "00 CONTROL", "command-center.md");
const HOLD_OPEN_HELPER = path.join(path.dirname(WINDOWS_PUBLICATION_HELPER), "windows-hold-open.ps1");
const execFileAsync = promisify(execFile);
const createdRoots: string[] = [];

interface HelperMessage { status: string; detail?: string }

function controlBytes(options: { matterType?: string | null; bom?: boolean } = {}): Buffer {
  const lines = [
    "# Command Center",
    "Oblast prava: Građansko pravo",
    ...(options.matterType === null ? [] : [`Vrsta predmeta: ${options.matterType ?? "Nasljedno pravo"}`]),
    "Nepoznata oznaka: sačuvaj",
    "  ručni nastavak ostaje",
    "Sledeći korak: Stari korak   ",
    "Ručna bilješka ostaje.",
    "",
  ];
  const body = Buffer.from(lines.join("\r\n"), "utf8");
  return options.bom === false ? body : Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), body]);
}

async function workspace(bytes = controlBytes()): Promise<{ root: string; target: string; baseline: { revisionId: string; readToken: string } }> {
  await mkdir(PERMITTED_TEST_ROOT, { recursive: true });
  const root = await mkdtemp(path.join(PERMITTED_TEST_ROOT, "fse1a-"));
  createdRoots.push(root);
  const target = path.join(root, CONTROL_PATH);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  const baselineRequest: BaselineRequest = {
    workspaceRoot: root,
    canonicalRelativePath: CONTROL_PATH,
    matterId: "matter-1",
    transactionId: `baseline-${randomUUID()}`,
    revisionId: `baseline-revision-${randomUUID()}`,
    expectedReadToken: exactReadToken(bytes),
    actor: "fse-1a-qualification",
    source: "FSE-1A_LOCAL_NTFS",
    recordedAt: "2026-08-19T10:00:00.000Z",
  };
  const baseline = await acceptMatterControlBaseline(baselineRequest);
  if (baseline.code !== "BASELINE_ACCEPTED") throw new Error(`FSE-1A baseline failed: ${baseline.code}`);
  return { root, target, baseline };
}

function mutation(fixture: Awaited<ReturnType<typeof workspace>>, id: string, overrides: Partial<MutationRequest> = {}): MutationRequest {
  return {
    workspaceRoot: fixture.root,
    canonicalRelativePath: CONTROL_PATH,
    matterId: "matter-1",
    transactionId: id,
    resultingRevisionId: `revision-${id}`,
    acceptedRevisionId: fixture.baseline.revisionId,
    expectedReadToken: fixture.baseline.readToken,
    actor: "fse-1a-qualification",
    source: "FSE-1A_LOCAL_NTFS",
    recordedAt: "2026-08-19T10:00:01.000Z",
    mutations: [{ field: "nextStep", value: "Novi korak" }],
    ...overrides,
  };
}

async function startPublicationHelper(parent: string) {
  const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", WINDOWS_PUBLICATION_HELPER, "-DirectoryPath", parent], {
    stdio: ["pipe", "pipe", "pipe"], windowsHide: true,
  });
  let stderr = "";
  child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString("utf8"); });
  const reader = createInterface({ input: child.stdout, crlfDelay: Infinity });
  const lines = reader[Symbol.asyncIterator]();
  const next = async (): Promise<HelperMessage> => {
    const result = await lines.next();
    if (result.done) throw new Error(`FSE-1A helper closed unexpectedly: ${stderr}`);
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
        const closed = new Promise<void>((resolve) => child.once("close", () => resolve()));
        child.stdin.end("CLOSE\n");
        await closed;
      }
      reader.close();
    },
  };
}

async function holdCanonicalOpen(filePath: string) {
  const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", HOLD_OPEN_HELPER, "-FilePath", filePath], {
    stdio: ["pipe", "pipe", "pipe"], windowsHide: true,
  });
  const reader = createInterface({ input: child.stdout, crlfDelay: Infinity });
  const lines = reader[Symbol.asyncIterator]();
  const ready = await lines.next();
  if (ready.done || ready.value !== "READY") throw new Error("FSE-1A hold-open helper did not become ready");
  return {
    async release(): Promise<void> {
      if (child.exitCode === null) {
        const closed = new Promise<void>((resolve) => child.once("close", () => resolve()));
        child.stdin.end("RELEASE\n");
        await closed;
      }
      reader.close();
    },
  };
}

afterEach(async () => {
  await Promise.all(createdRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("FSE-1A supported local NTFS environment", () => {
  it("records a local fixed NTFS, non-reparse, non-OneDrive environment", async () => {
    const script = "$d=[IO.DriveInfo]::new('C');@{driveFormat=$d.DriveFormat;driveType=$d.DriveType.ToString();isReady=$d.IsReady}|ConvertTo-Json -Compress";
    const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], { windowsHide: true });
    const volume = JSON.parse(stdout) as { driveFormat: string; driveType: string; isReady: boolean };
    const rootStat = await lstat(PERMITTED_TEST_ROOT);
    const profile = {
      platform: process.platform,
      windowsVersion: osRelease(),
      architecture: process.arch,
      node: process.version,
      libuv: process.versions.uv,
      testRoot: path.resolve(PERMITTED_TEST_ROOT),
      volume,
      rootIsSymbolicLink: rootStat.isSymbolicLink(),
    };
    console.info(`FSE1A_ENVIRONMENT ${JSON.stringify(profile)}`);
    expect(profile.platform).toBe("win32");
    expect(profile.volume).toMatchObject({ driveFormat: "NTFS", driveType: "Fixed", isReady: true });
    expect(profile.testRoot.toLowerCase()).not.toContain("onedrive");
    expect(profile.rootIsSymbolicLink).toBe(false);
  }, 15_000);

  it("A qualifies normal mutation and records practical phase latency", async () => {
    const fixture = await workspace();
    const rawRoot = await mkdtemp(path.join(PERMITTED_TEST_ROOT, "fse1a-perf-"));
    createdRoots.push(rawRoot);
    const rawTarget = path.join(rawRoot, "Matter-1", "00 CONTROL", "command-center.md");
    await mkdir(path.dirname(rawTarget), { recursive: true });
    await writeFile(rawTarget, controlBytes());
    const timings: Record<string, number> = {};
    let started = performance.now();
    const before = await readFile(rawTarget);
    const beforeToken = exactReadToken(before);
    timings.readAndHashMs = performance.now() - started;
    started = performance.now();
    const proposed = losslessTransform(before, [{ field: "nextStep", value: "Perf korak" }]);
    const proposedToken = exactReadToken(proposed);
    timings.transformMs = performance.now() - started;
    const temp = path.join(path.dirname(rawTarget), ".fse1a-performance.write1v.tmp");
    started = performance.now();
    const handle = await open(temp, "wx");
    try { await handle.writeFile(proposed); await handle.sync(); } finally { await handle.close(); }
    timings.stagedWriteAndSyncMs = performance.now() - started;
    started = performance.now();
    await withWindowsTargetIdentityGuard(rawTarget, (publisher) => publisher.publish(rawTarget, temp, beforeToken, proposedToken));
    timings.publicationMs = performance.now() - started;
    started = performance.now();
    expect(exactReadToken(await readFile(rawTarget))).toBe(proposedToken);
    timings.finalReadAndHashMs = performance.now() - started;
    started = performance.now();
    const result = await mutateMatterControl(mutation(fixture, "normal-mutation"));
    timings.endToEndIncludingEvidenceAndReceiptMs = performance.now() - started;
    console.info(`FSE1A_PERFORMANCE ${JSON.stringify(timings)}`);
    expect(result.code, result.detail).toBe("CANONICAL_SUCCESS");
    expect(exactReadToken(await readFile(fixture.target))).toBe(result.resultingReadToken);
    expect(timings.endToEndIncludingEvidenceAndReceiptMs).toBeLessThan(10_000);
  }, 30_000);

  it("B returns CONFLICT for a stale manual edit and preserves it", async () => {
    const fixture = await workspace();
    const manual = Buffer.concat([await readFile(fixture.target), Buffer.from("Manual edit before save\r\n")]);
    await writeFile(fixture.target, manual);
    const result = await mutateMatterControl(mutation(fixture, "stale-manual"));
    expect(result.code).toBe("CONFLICT");
    expect(await readFile(fixture.target)).toEqual(manual);
  }, 30_000);

  it("C gives exactly one success and one conflict to two same-token application writers", async () => {
    const fixture = await workspace();
    const [first, second] = await Promise.all([
      mutateMatterControl(mutation(fixture, "writer-one", { mutations: [{ field: "nextStep", value: "Prvi" }] })),
      mutateMatterControl(mutation(fixture, "writer-two", { mutations: [{ field: "nextStep", value: "Drugi" }], recordedAt: "2026-08-19T10:00:02.000Z" })),
    ]);
    expect([first.code, second.code].sort()).toEqual(["CANONICAL_SUCCESS", "CONFLICT"]);
  }, 30_000);

  it("D rejects a wrong-matter junction without changing the outside matter", async () => {
    const root = await mkdtemp(path.join(PERMITTED_TEST_ROOT, "fse1a-junction-"));
    createdRoots.push(root);
    const outside = path.join(root, "Matter-2", "00 CONTROL", "command-center.md");
    await mkdir(path.dirname(outside), { recursive: true });
    await writeFile(outside, controlBytes());
    await symlink(path.join(root, "Matter-2"), path.join(root, "Matter-1"), "junction");
    const request: BaselineRequest = {
      workspaceRoot: root, canonicalRelativePath: CONTROL_PATH, matterId: "matter-1",
      transactionId: "junction-baseline", revisionId: "junction-revision", actor: "fse-1a",
      expectedReadToken: exactReadToken(controlBytes()),
      source: "FSE-1A_JUNCTION", recordedAt: "2026-08-19T10:00:00.000Z",
    };
    await expect(acceptMatterControlBaseline(request)).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    expect(await readFile(outside)).toEqual(controlBytes());
  }, 30_000);

  it("D holds trusted parent identity against substitution", async () => {
    const fixture = await workspace();
    const matter = path.join(fixture.root, "Matter-1");
    const parked = path.join(fixture.root, "Matter-1-parked");
    let substituted = false;
    await withWindowsTargetIdentityGuard(fixture.target, async (publisher) => {
      await publisher.verify();
      try { await rename(matter, parked); substituted = true; await rename(parked, matter); } catch { /* expected sharing denial */ }
    });
    expect(substituted).toBe(false);
  }, 30_000);

  it("E publishes the verified source object despite source pathname substitution", async () => {
    const fixture = await workspace();
    const replacement = path.join(path.dirname(fixture.target), ".fse1a-source.write1v.tmp");
    const parked = `${replacement}.parked`;
    const proposed = Buffer.from("verified-fse1a-source\r\n");
    await writeFile(replacement, proposed);
    const helper = await startPublicationHelper(path.dirname(fixture.target));
    try {
      expect((await helper.send({ command: "PUBLISH", target: fixture.target, replacement, expectedTargetHash: exactReadToken(await readFile(fixture.target)).slice(7), expectedResultHash: exactReadToken(proposed).slice(7) })).status).toBe("RENAME_READY");
      await rename(replacement, parked);
      await writeFile(replacement, "attacker pathname bytes");
      expect((await helper.send("COMMIT")).status).toBe("PUBLISHED");
    } finally { await helper.close(); }
    expect(await readFile(fixture.target)).toEqual(proposed);
    expect(await readFile(replacement, "utf8")).toBe("attacker pathname bytes");
  }, 30_000);

  it("F/G/H preserves unknown content, legacy Matter Type, and a missing Matter Type", async () => {
    const legacy = await workspace(controlBytes({ matterType: "Nasljedno pravo" }));
    expect((await mutateMatterControl(mutation(legacy, "legacy-preserve"))).code).toBe("CANONICAL_SUCCESS");
    const legacyAfter = await readFile(legacy.target, "utf8");
    expect(legacyAfter).toContain("Vrsta predmeta: Nasljedno pravo");
    expect(legacyAfter).toContain("Nepoznata oznaka: sačuvaj\r\n  ručni nastavak ostaje");
    const missing = await workspace(controlBytes({ matterType: null }));
    expect((await mutateMatterControl(mutation(missing, "missing-preserve"))).code).toBe("CANONICAL_SUCCESS");
    const missingAfter = await readFile(missing.target, "utf8");
    expect(missingAfter).not.toContain("Vrsta predmeta:");
    expect(missingAfter).not.toContain("Drugo");
  }, 30_000);

  it("I retries transient sharing contention and publishes after release", async () => {
    const fixture = await workspace();
    const replacement = path.join(path.dirname(fixture.target), ".fse1a-transient.write1v.tmp");
    const proposed = Buffer.from("transient-result\r\n");
    await writeFile(replacement, proposed);
    const holder = await holdCanonicalOpen(fixture.target);
    const helper = await startPublicationHelper(path.dirname(fixture.target));
    let released = false;
    try {
      expect((await helper.send({ command: "PUBLISH", target: fixture.target, replacement, expectedTargetHash: exactReadToken(await readFile(fixture.target)).slice(7), expectedResultHash: exactReadToken(proposed).slice(7) })).status).toBe("RENAME_READY");
      const commit = helper.send("COMMIT");
      await delay(100);
      await holder.release();
      released = true;
      expect((await commit).status).toBe("PUBLISHED");
    } finally { if (!released) await holder.release(); await helper.close(); }
  }, 30_000);

  it("I exhausts bounded contention as safe IO failure", async () => {
    const fixture = await workspace();
    const before = await readFile(fixture.target);
    const holder = await holdCanonicalOpen(fixture.target);
    try {
      const result = await mutateMatterControl(mutation(fixture, "sharing-exhausted"));
      expect(result.code).toBe("IO_FAILED");
      expect(await readFile(fixture.target)).toEqual(before);
    } finally { await holder.release(); }
  }, 30_000);

  it("J fails closed on a read-only canonical target", async () => {
    const fixture = await workspace();
    const before = await readFile(fixture.target);
    await execFileAsync("attrib.exe", ["+R", fixture.target], { windowsHide: true });
    try {
      expect((await mutateMatterControl(mutation(fixture, "read-only"))).code).toBe("IO_FAILED");
      expect(await readFile(fixture.target)).toEqual(before);
    } finally { await execFileAsync("attrib.exe", ["-R", fixture.target], { windowsHide: true }); }
  }, 30_000);

  it("K returns RECOVERY_REQUIRED on final verification mismatch", async () => {
    const fixture = await workspace();
    const result = await mutateMatterControl(mutation(fixture, "final-mismatch"), { faults: { failurePoint: "FINAL_REREAD_MISMATCH", finalMismatchBytes: Buffer.from("external-final-mismatch") } });
    expect(result.code).toBe("RECOVERY_REQUIRED");
    expect((await currentMatterControl(fixture.root, "matter-1", CONTROL_PATH))?.revisionId).toBe(fixture.baseline.revisionId);
  }, 30_000);

  it("L retains canonical success when derived state requires rebuild", async () => {
    const fixture = await workspace();
    const result = await mutateMatterControl(mutation(fixture, "derived-failure"), { faults: { failurePoint: "DERIVED_UPDATE" } });
    expect(result.code).toBe("CANONICAL_SUCCESS_DERIVED_REBUILD_REQUIRED");
    expect((await currentMatterControl(fixture.root, "matter-1", CONTROL_PATH))?.revisionId).toBe("revision-derived-failure");
  }, 30_000);
});

describe("FSE-1A recovery and namespace qualification", () => {
  it("qualifies orphan temp, prepared-no-receipt, and inconsistent-receipt recovery", async () => {
    const orphan = await workspace();
    await writeFile(path.join(path.dirname(orphan.target), ".orphan.write1v.tmp"), "orphan");
    expect((await inspectMatterControlRecovery(orphan.root, "matter-1", CONTROL_PATH)).code).toBe("ORPHAN_TEMP_NOT_PUBLISHED");
    const prepared = await workspace();
    await mutateMatterControl(mutation(prepared, "prepared-no-receipt"), { faults: { failurePoint: "TEMP_SYNC" } });
    expect((await inspectMatterControlRecovery(prepared.root, "matter-1", CONTROL_PATH)).code).toBe("PREPARED_NOT_CURRENT");
    const inconsistent = await workspace();
    expect((await mutateMatterControl(mutation(inconsistent, "receipt-success"))).code).toBe("CANONICAL_SUCCESS");
    await writeFile(inconsistent.target, "canonical-contradiction");
    expect((await inspectMatterControlRecovery(inconsistent.root, "matter-1", CONTROL_PATH)).code).toBe("RECOVERY_REQUIRED");
  }, 60_000);

  it("completes 300 publications with continuous valid namespace content", async () => {
    const fixture = await workspace();
    await writeFile(fixture.target, "fse1a-version-0\r\n");
    let stop = false;
    let readerObservations = 0;
    let enoent = 0;
    let invalidPartial = 0;
    let hashMismatches = 0;
    let unexpectedIo = 0;
    const reader = (async () => {
      while (!stop) {
        try {
          const observed = await readFile(fixture.target, "utf8");
          readerObservations += 1;
          if (!/^fse1a-version-\d+\r\n$/u.test(observed)) invalidPartial += 1;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") enoent += 1;
          else unexpectedIo += 1;
        }
        await delay(0);
      }
    })();
    const started = performance.now();
    await withWindowsTargetIdentityGuard(fixture.target, async (publisher) => {
      for (let index = 1; index <= 300; index += 1) {
        const before = await readFile(fixture.target);
        const proposed = Buffer.from(`fse1a-version-${index}\r\n`);
        const temp = path.join(path.dirname(fixture.target), `.fse1a-${index}.write1v.tmp`);
        const handle = await open(temp, "wx");
        try { await handle.writeFile(proposed); await handle.sync(); } finally { await handle.close(); }
        try { await publisher.publish(fixture.target, temp, exactReadToken(before), exactReadToken(proposed)); }
        catch { unexpectedIo += 1; throw new Error(`Unexpected publication failure at ${index}`); }
        if (exactReadToken(await readFile(fixture.target)) !== exactReadToken(proposed)) hashMismatches += 1;
      }
    });
    stop = true;
    await reader;
    const tempLeftovers = (await readdir(path.dirname(fixture.target))).filter((name) => name.endsWith(".write1v.tmp")).length;
    const result = { publications: 300, readerObservations, enoent, invalidPartial, hashMismatches, unexpectedIo, tempLeftovers, elapsedMs: Number((performance.now() - started).toFixed(3)) };
    console.info(`FSE1A_STRESS ${JSON.stringify(result)}`);
    expect(result).toMatchObject({ publications: 300, enoent: 0, invalidPartial: 0, hashMismatches: 0, unexpectedIo: 0, tempLeftovers: 0 });
    expect(readerObservations).toBeGreaterThan(0);
  }, 120_000);

  it("records the accepted unsupported active-save external-mutation capability", async () => {
    const fixture = await workspace();
    const replacement = path.join(path.dirname(fixture.target), ".fse1a-negative.write1v.tmp");
    const parked = `${fixture.target}.external-v1`;
    const proposed = Buffer.from("application-proposed\r\n");
    await writeFile(replacement, proposed);
    const helper = await startPublicationHelper(path.dirname(fixture.target));
    try {
      expect((await helper.send({ command: "PUBLISH", target: fixture.target, replacement, expectedTargetHash: exactReadToken(await readFile(fixture.target)).slice(7), expectedResultHash: exactReadToken(proposed).slice(7) })).status).toBe("RENAME_READY");
      await rename(fixture.target, parked);
      await writeFile(fixture.target, "unsupported-external-v2");
      expect((await helper.send("COMMIT")).status).toBe("PUBLISHED");
    } finally { await helper.close(); }
    expect(await readFile(fixture.target)).toEqual(proposed);
    // PASS records UNSUPPORTED_CONCURRENT_EXTERNAL_MUTATION_DURING_ACTIVE_SAVE; it does not claim destination CAS.
  }, 30_000);
});
