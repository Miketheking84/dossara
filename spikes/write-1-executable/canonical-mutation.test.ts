import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, open, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { afterEach, describe, expect, it } from "vitest";
import { PERMITTED_TEST_ROOT } from "../foundation-hardening/persistence-spike";
import {
  acceptMatterControlBaseline,
  currentMatterControl,
  exactReadToken,
  filesystemPublicationFacts,
  inspectMatterControlRecovery,
  losslessTransform,
  mutateMatterControl,
  replaceFileWindows,
} from "./canonical-mutation";
import type { BaselineRequest, MutationRequest } from "./contracts";

const CONTROL_PATH = path.join("Matter-1", "00 CONTROL", "command-center.md");
const createdRoots: string[] = [];

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
  await mkdir(PERMITTED_TEST_ROOT, { recursive: true });
  const root = await mkdtemp(path.join(PERMITTED_TEST_ROOT, "write1e-"));
  createdRoots.push(root);
  const target = path.join(root, CONTROL_PATH);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  const baselineRequest: BaselineRequest = {
    workspaceRoot: root,
    canonicalRelativePath: CONTROL_PATH,
    matterId: "matter-1",
    transactionId: `baseline-${randomUUID()}`,
    revisionId: `revision-baseline-${randomUUID()}`,
    actor: "write-1e-test",
    source: "WRITE-1E_BASELINE",
    recordedAt: "2026-08-18T12:00:00.000Z",
  };
  const baseline = await acceptMatterControlBaseline(baselineRequest);
  return { root, target, baseline };
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
    actor: "write-1e-test",
    source: "WRITE-1E_TEST",
    recordedAt: "2026-08-18T12:00:01.000Z",
    mutations: [{ field: "nextStep", value: "Novi korak" }],
    ...overrides,
  };
}

afterEach(async () => {
  await Promise.all(createdRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("WRITE-1E exact-byte and lossless mutation contract", () => {
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
    expect(result.code).toBe("CANONICAL_SUCCESS");
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
    expect((await readdir(path.dirname(fixture.target))).some((name) => name.includes(".write1e.tmp"))).toBe(false);
  });

  it("serializes two stale writers but still requires the second exact hash", async () => {
    const fixture = await workspace();
    const first = request(fixture, "writer-first", { mutations: [{ field: "nextStep", value: "Prvi" }] });
    const second = request(fixture, "writer-second", { mutations: [{ field: "nextStep", value: "Drugi" }], recordedAt: "2026-08-18T12:00:02.000Z" });
    const [left, right] = await Promise.all([mutateMatterControl(first), mutateMatterControl(second)]);
    expect(left.code).toBe("CANONICAL_SUCCESS");
    expect(right.code).toBe("CONFLICT");
    expect(await readFile(fixture.target, "utf8")).toContain("Sledeći korak: Prvi");
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

describe("WRITE-1E publication, durability ordering and currentness", () => {
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

  it("keeps the original canonical file when publication fails before MoveFileExW", async () => {
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

  it("uses actual Node 24/libuv MoveFileExW without an observed missing-target window", async () => {
    const fixture = await workspace(Buffer.from("version-0", "utf8"));
    const facts = await filesystemPublicationFacts(fixture.target);
    expect(facts).toMatchObject({ platform: "win32", node: process.version, uv: process.versions.uv, isRegularFile: true });
    let stop = false;
    let missingReads = 0;
    const reader = (async () => {
      while (!stop) {
        try { await stat(fixture.target); } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") missingReads += 1; }
        await delay(1);
      }
    })();
    for (let index = 1; index <= 8; index += 1) {
      const replacement = `${fixture.target}.${index}.replacement`;
      const backup = `${fixture.target}.${index}.backup`;
      const handle = await open(replacement, "wx");
      try {
        await handle.writeFile(Buffer.from(`version-${index}`, "utf8"));
        await handle.sync();
      } finally {
        await handle.close();
      }
      await replaceFileWindows(fixture.target, replacement, backup);
      expect(await readFile(fixture.target, "utf8")).toBe(`version-${index}`);
      await rm(backup, { force: true });
    }
    stop = true;
    await reader;
    expect(missingReads).toBe(0);
    expect(await readFile(fixture.target, "utf8")).toBe("version-8");
  }, 30_000);
});

describe("WRITE-1E cold recovery decision table", () => {
  it("R1 does not auto-publish an orphan temp", async () => {
    const fixture = await workspace();
    const orphan = path.join(path.dirname(fixture.target), ".command-center.md.orphan.write1e.tmp");
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
