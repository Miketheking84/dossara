import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { canonicalJson, parseJsonStrict } from "../foundation-hardening/canonical-json";
import { PERMITTED_TEST_ROOT, readImmutableRevision, revisionPath } from "../foundation-hardening/persistence-spike";
import type { CanonicalEnvelope } from "../foundation-hardening/contracts";
import {
  GPP_REGISTRY,
  GoldenPathError,
  authoritativeFileInventory,
  controlledApply,
  deterministicStateBytes,
  proposeAndReview,
  reconstruct,
  recoverInterruptedApply,
  verifyProvenance,
  type ProposedChange,
  type ReconstructedState,
} from "./golden-path-harness";

const matterId = "matter-gpp-001";
const startMs = Date.parse("2026-01-01T00:00:00.000Z");
const fields = ["claimAmount", "matterStatus", "court", "responsibleLawyer", "nextAction", "riskBand", "hearingRoom", "internalNote"];
let workspaceRoot = "";
let changes: ProposedChange[] = [];
const states: Record<string, ReconstructedState> = {};

function at(index: number): string {
  return new Date(startMs + index * 86_400_000).toISOString();
}

function fixtureChanges(): ProposedChange[] {
  const heads = new Map<string, string>();
  return Array.from({ length: 100 }, (_, offset) => {
    const n = offset + 1;
    const field = fields[offset % fields.length];
    const baseRevisionId = heads.get(field);
    const itemId = `item-${String(n).padStart(3, "0")}`;
    const assertionRevisionId = `assertion-${field}-${itemId}`;
    heads.set(field, assertionRevisionId);
    const kind = n <= fields.length ? "ADDITION" : n % 17 === 0 ? "CORRECTION" : n % 13 === 0 ? "STATUS_TRANSITION" : n % 11 === 0 ? "TEMPORAL" : n % 7 === 0 ? "UNRELATED" : "REPLACEMENT";
    const recordedAt = at(n);
    return {
      changeSetId: `change-set-${String(n).padStart(3, "0")}`,
      revisionId: `change-set-${String(n).padStart(3, "0")}-r1`,
      itemId,
      matterId,
      field,
      value: field === "claimAmount" ? n * 1_000 : `${field}-value-${n}`,
      kind,
      recordedAt,
      effectiveFrom: n % 11 === 0 ? at(n + 2) : recordedAt,
      baseRevisionId,
      sourceRevisionId: `source-${(n % 9) + 1}-r1`,
    };
  });
}

beforeAll(async () => {
  workspaceRoot = await mkdtemp(path.join(PERMITTED_TEST_ROOT, "gpp0-"));
  changes = fixtureChanges();
  for (const change of changes) {
    await proposeAndReview(workspaceRoot, change);
    await controlledApply(workspaceRoot, change);
  }
  states.T1 = await reconstruct(workspaceRoot, matterId, at(25), at(25));
  states.T2 = await reconstruct(workspaceRoot, matterId, at(60), at(60));
  states.T3 = await reconstruct(workspaceRoot, matterId, at(100), at(100));
}, 30_000);

afterAll(async () => {
  if (workspaceRoot) await rm(workspaceRoot, { recursive: true, force: true });
}, 30_000);

describe("GPP-0 100 ChangeSet Golden Path", () => {
  it("persists exactly 100 reviewed ChangeSets and controlled apply events", async () => {
    const inventory = await authoritativeFileInventory(workspaceRoot);
    expect(inventory.filter((item) => item.includes("objects/CHANGE_SET/") && item.endsWith(".json"))).toHaveLength(100);
    expect(inventory.filter((item) => item.includes("objects/REVIEW_RECORD/") && item.endsWith(".json"))).toHaveLength(100);
    expect(inventory.filter((item) => item.includes("transactions/") && item.endsWith(".json"))).toHaveLength(100);
    expect((await readFile(path.join(workspaceRoot, "00 CONTROL", "vla", "history", "active.jsonl"), "utf8")).trim().split("\n")).toHaveLength(100);
  });

  it("reconstructs deterministic and distinct State(T1), State(T2), and State(T3)", async () => {
    expect(states.T1.values).toEqual({
      claimAmount: 25_000,
      court: "court-value-19",
      hearingRoom: "hearingRoom-value-23",
      internalNote: "internalNote-value-24",
      matterStatus: "matterStatus-value-18",
      nextAction: "nextAction-value-21",
      responsibleLawyer: "responsibleLawyer-value-20",
      riskBand: "riskBand-value-22",
    });
    expect(states.T2.values).toEqual({
      claimAmount: 57_000,
      court: "court-value-59",
      hearingRoom: "hearingRoom-value-55",
      internalNote: "internalNote-value-56",
      matterStatus: "matterStatus-value-58",
      nextAction: "nextAction-value-53",
      responsibleLawyer: "responsibleLawyer-value-60",
      riskBand: "riskBand-value-54",
    });
    expect(states.T3.values).toEqual({
      claimAmount: 97_000,
      court: "court-value-91",
      hearingRoom: "hearingRoom-value-95",
      internalNote: "internalNote-value-96",
      matterStatus: "matterStatus-value-98",
      nextAction: "nextAction-value-93",
      responsibleLawyer: "responsibleLawyer-value-100",
      riskBand: "riskBand-value-94",
    });
    expect(await reconstruct(workspaceRoot, matterId, at(25), at(25))).toEqual(states.T1);
    expect(await reconstruct(workspaceRoot, matterId, at(60), at(60))).toEqual(states.T2);
    expect(await reconstruct(workspaceRoot, matterId, at(100), at(100))).toEqual(states.T3);
  });

  it("proves exact source, ChangeSet, review, assertion revision and apply lineage for every T3 value", async () => {
    expect(await verifyProvenance(workspaceRoot, states.T3)).toEqual([]);
    for (const proof of Object.values(states.T3.provenance)) {
      expect(proof.sourceRevisionId).toMatch(/^source-/);
      expect(proof.changeSetRevisionId).toMatch(/^change-set-/);
      expect(proof.reviewRevisionId).toMatch(/^review-/);
      expect(proof.assertionRevisionId).toMatch(/^assertion-/);
      expect(proof.applyEventId).toMatch(/^apply-/);
    }
  });

  it("rebuilds identically across repeated cold reconstruction without process state or filesystem ordering", async () => {
    const expected = deterministicStateBytes(states.T3);
    for (let attempt = 0; attempt < 5; attempt++) {
      expect(deterministicStateBytes(await reconstruct(workspaceRoot, matterId, at(100), at(100)))).toBe(expected);
    }
  });

  it("does not activate a future-effective change before its effective instant", async () => {
    const temporal = changes.find((change) => change.kind === "TEMPORAL")!;
    const before = await reconstruct(workspaceRoot, matterId, temporal.recordedAt, temporal.recordedAt);
    expect(before.provenance[temporal.field]?.assertionRevisionId).not.toBe(`assertion-${temporal.field}-${temporal.itemId}`);
    const after = await reconstruct(workspaceRoot, matterId, temporal.effectiveFrom, temporal.effectiveFrom);
    expect(after.provenance[temporal.field]?.assertionRevisionId).toBe(`assertion-${temporal.field}-${temporal.itemId}`);
  });
});

describe("GPP-0 fail-closed scenarios", () => {
  it("blocks contradictory changes without an authoritative effect", async () => {
    const prior = states.T3.provenance.claimAmount.assertionRevisionId;
    const change: ProposedChange = { ...changes[96], changeSetId: "change-set-conflict", revisionId: "change-set-conflict-r1", itemId: "item-conflict", field: "claimAmount", value: 999_999, baseRevisionId: prior, recordedAt: at(110), effectiveFrom: at(110), contradictory: true };
    await proposeAndReview(workspaceRoot, change);
    await expect(controlledApply(workspaceRoot, change)).rejects.toMatchObject({ code: "CONFLICT_BLOCKED" });
    expect((await reconstruct(workspaceRoot, matterId, at(110), at(110))).values.claimAmount).toBe(states.T3.values.claimAmount);
  });

  it("rejects a stale base revision and never overwrites the newer state", async () => {
    const stale = changes.find((change) => change.field === "court" && change.baseRevisionId)!;
    const change: ProposedChange = { ...stale, changeSetId: "change-set-stale", revisionId: "change-set-stale-r1", itemId: "item-stale", value: "stale-write", recordedAt: at(111), effectiveFrom: at(111) };
    const before = await reconstruct(workspaceRoot, matterId, at(111), at(111));
    await proposeAndReview(workspaceRoot, change);
    await expect(controlledApply(workspaceRoot, change)).rejects.toMatchObject({ code: "STALE_BASE" });
    expect(await reconstruct(workspaceRoot, matterId, at(111), at(111))).toEqual(before);
  });

  it("recovers an interruption after revision publication without exposing a half-applied state", async () => {
    const baseRevisionId = states.T3.provenance.riskBand.assertionRevisionId;
    const change: ProposedChange = { ...changes[95], changeSetId: "change-set-crash", revisionId: "change-set-crash-r1", itemId: "item-crash", field: "riskBand", value: "recovered-value", baseRevisionId, recordedAt: at(112), effectiveFrom: at(112) };
    await proposeAndReview(workspaceRoot, change);
    await expect(controlledApply(workspaceRoot, change, { failAfterRevision: true })).rejects.toEqual(new GoldenPathError("RECOVERY_REQUIRED", "tx-item-crash"));
    expect((await reconstruct(workspaceRoot, matterId, at(112), at(112))).values.riskBand).toBe(states.T3.values.riskBand);
    await expect(recoverInterruptedApply(workspaceRoot, "tx-item-crash")).resolves.toBe("RECONCILED_APPLIED");
    expect((await reconstruct(workspaceRoot, matterId, at(112), at(112))).values.riskBand).toBe("recovered-value");
  });

  it("detects manual canonical-file modification and preserves the modified bytes without accepting them", async () => {
    const proof = states.T3.provenance.internalNote;
    const probe: CanonicalEnvelope = { recordFormat: "dossara-record/1", schemaId: "matter-assertion", schemaVersion: "1", objectType: "MATTER_ASSERTION", objectId: "assertion-internalNote", revisionId: proof.assertionRevisionId, revisionOf: "assertion-internalNote", matterId, recordedAt: at(100), createdBy: "probe", generatorType: "MANUAL", payload: {}, references: [] };
    const filePath = revisionPath(workspaceRoot, probe);
    const original = parseJsonStrict(await readFile(filePath, "utf8")) as { envelope: CanonicalEnvelope; integrity: unknown };
    const changed = canonicalJson({ ...original, envelope: { ...original.envelope, payload: { field: "internalNote", value: "manual tamper" } } });
    await writeFile(filePath, changed, "utf8");
    await expect(readImmutableRevision(filePath, GPP_REGISTRY)).rejects.toMatchObject({ code: "INTEGRITY_MISMATCH" });
    expect(await readFile(filePath, "utf8")).toBe(changed);
  });
});
