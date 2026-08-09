import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { canonicalJson, parseJsonStrict } from "./canonical-json";
import type { CanonicalEnvelope, TypeRegistry } from "./contracts";
import {
  PERMITTED_TEST_ROOT,
  PersistenceSpikeError,
  appendHistoryEvent,
  assertPermittedTestPath,
  readHistory,
  readImmutableRevision,
  writeImmutableRevision,
  type HistoryEvent,
} from "./persistence-spike";

const registry: TypeRegistry = {
  version: "registry-1",
  types: [{ objectType: "MATTER_ASSERTION", schemaVersions: ["1"] }],
  referenceTypes: { SUBJECT_REVISION: ["MATTER_ASSERTION"] },
};

const revision1: CanonicalEnvelope = {
  recordFormat: "dossara-record/1",
  schemaId: "matter-assertion",
  schemaVersion: "1",
  objectType: "MATTER_ASSERTION",
  objectId: "object-1",
  revisionId: "revision-1",
  revisionOf: "object-1",
  matterId: "matter-1",
  recordedAt: "2026-08-09T10:00:00.000Z",
  createdBy: "actor-1",
  generatorType: "MANUAL",
  payload: { text: "Činjenica" },
  references: [],
};

const createdRoots: string[] = [];

async function workspace(): Promise<string> {
  const root = await mkdtemp(path.join(PERMITTED_TEST_ROOT, "fh1-"));
  createdRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(createdRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("FH-1 immutable filesystem persistence", () => {
  it("writes canonical bytes and cold-reads the same validated record and digest", async () => {
    const written = await writeImmutableRevision(await workspace(), revision1, registry);
    expect(await readFile(written.filePath, "utf8")).toBe(written.bytes);

    const cold = await readImmutableRevision(written.filePath, registry);
    expect(cold.envelope).toEqual(revision1);
    expect(cold.digest).toBe(written.digest);
    expect(cold.bytes).toBe(canonicalJson(parseJsonStrict(cold.bytes)));
  });

  it("keeps revision 1 unchanged when revision 2 is written", async () => {
    const root = await workspace();
    const first = await writeImmutableRevision(root, revision1, registry);
    const firstBytes = await readFile(first.filePath, "utf8");
    await writeImmutableRevision(root, { ...revision1, revisionId: "revision-2", payload: { text: "Nova činjenica" } }, registry);
    expect(await readFile(first.filePath, "utf8")).toBe(firstBytes);
  });

  it("rejects overwrite of an existing exact revision", async () => {
    const root = await workspace();
    await writeImmutableRevision(root, revision1, registry);
    await expect(writeImmutableRevision(root, revision1, registry)).rejects.toMatchObject({ code: "REVISION_ALREADY_EXISTS" });
  });

  it("detects a canonical byte-level content change without repairing it", async () => {
    const written = await writeImmutableRevision(await workspace(), revision1, registry);
    const stored = parseJsonStrict(written.bytes) as { envelope: CanonicalEnvelope; integrity: unknown };
    const changed = canonicalJson({ ...stored, envelope: { ...stored.envelope, payload: { text: "ručna izmjena" } } });
    await writeFile(written.filePath, changed, "utf8");

    await expect(readImmutableRevision(written.filePath, registry)).rejects.toMatchObject({ code: "INTEGRITY_MISMATCH" });
    expect(await readFile(written.filePath, "utf8")).toBe(changed);
  });

  it("detects malformed manual changes without repair or overwrite", async () => {
    const written = await writeImmutableRevision(await workspace(), revision1, registry);
    const malformed = `${written.bytes.slice(0, -3)}MANUAL`;
    await writeFile(written.filePath, malformed, "utf8");

    await expect(readImmutableRevision(written.filePath, registry)).rejects.toMatchObject({ code: "MALFORMED_JSON" });
    expect(await readFile(written.filePath, "utf8")).toBe(malformed);
  });

  it("rejects paths outside the sole permitted test root", async () => {
    expect(() => assertPermittedTestPath("C:\\SDJ_TEST\\outside-fh1")).toThrowError(PersistenceSpikeError);
    await expect(writeImmutableRevision("C:\\SDJ_TEST\\outside-fh1", revision1, registry)).rejects.toMatchObject({ code: "PATH_OUTSIDE_PERMITTED_ROOT" });
  });
});

describe("FH-1 minimal append-only history", () => {
  const event1: HistoryEvent = { eventId: "event-1", eventType: "REVIEW_EVENT", recordedAt: revision1.recordedAt, payload: { order: 1 } };
  const event2: HistoryEvent = { ...event1, eventId: "event-2", payload: { order: 2 } };

  it("preserves event 1 byte-for-byte after event 2 and cold-reads both", async () => {
    const logPath = path.join(await workspace(), "00 CONTROL", "vla", "history", "active.jsonl");
    const firstLine = await appendHistoryEvent(logPath, event1);
    expect(await readFile(logPath, "utf8")).toBe(firstLine);
    await appendHistoryEvent(logPath, event2);
    const cold = await readHistory(logPath);
    expect(cold.bytes.startsWith(firstLine)).toBe(true);
    expect(cold.events).toEqual([event1, event2]);
  });

  it("validates before append so an invalid event cannot mutate the log", async () => {
    const logPath = path.join(await workspace(), "00 CONTROL", "vla", "history", "active.jsonl");
    await appendHistoryEvent(logPath, event1);
    const before = await readFile(logPath, "utf8");
    await expect(appendHistoryEvent(logPath, { ...event2, recordedAt: "invalid" })).rejects.toMatchObject({ code: "INVALID_HISTORY" });
    expect(await readFile(logPath, "utf8")).toBe(before);
  });
});
