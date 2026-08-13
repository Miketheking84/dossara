import { mkdir, open, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { canonicalJson, parseJsonStrict } from "../foundation-hardening/canonical-json";
import type { CanonicalEnvelope, TypeRegistry, TypedReference } from "../foundation-hardening/contracts";
import {
  appendHistoryEvent,
  assertPermittedTestPath,
  readHistory,
  readImmutableRevision,
  revisionPath,
  writeImmutableRevision,
  type HistoryEvent,
} from "../foundation-hardening/persistence-spike";

export const GPP_REGISTRY: TypeRegistry = {
  version: "gpp-registry-1",
  types: [
    "SOURCE_ITEM",
    "CHANGE_SET",
    "REVIEW_RECORD",
    "MATTER_ASSERTION",
    "APPLY_RECEIPT",
  ].map((objectType) => ({ objectType, schemaVersions: ["1"] })),
  referenceTypes: {
    SOURCE_REVISION: ["SOURCE_ITEM"],
    CHANGE_SET_REVISION: ["CHANGE_SET"],
    REVIEW_REVISION: ["REVIEW_RECORD"],
    RESULT_REVISION: ["MATTER_ASSERTION"],
    TARGET_REVISION: ["MATTER_ASSERTION"],
  },
};

export type ChangeKind = "ADDITION" | "REPLACEMENT" | "CORRECTION" | "STATUS_TRANSITION" | "TEMPORAL" | "UNRELATED";

export interface ProposedChange {
  changeSetId: string;
  revisionId: string;
  itemId: string;
  matterId: string;
  field: string;
  value: string | number | boolean;
  kind: ChangeKind;
  recordedAt: string;
  effectiveFrom: string;
  effectiveTo?: string;
  baseRevisionId?: string;
  sourceRevisionId: string;
  contradictory?: boolean;
}

export interface MaterialValueProof {
  field: string;
  value: ProposedChange["value"];
  effectiveFrom: string;
  effectiveTo?: string;
  assertionRevisionId: string;
  changeSetRevisionId: string;
  reviewRevisionId: string;
  sourceRevisionId: string;
  applyEventId: string;
  transactionId: string;
}

export interface ReconstructedState {
  matterId: string;
  recordedCutoff: string;
  effectiveAt: string;
  values: Readonly<Record<string, ProposedChange["value"]>>;
  provenance: Readonly<Record<string, MaterialValueProof>>;
}

export class GoldenPathError extends Error {
  constructor(readonly code: "NOT_APPROVED" | "STALE_BASE" | "CONFLICT_BLOCKED" | "RECOVERY_REQUIRED", message: string) {
    super(message);
    this.name = "GoldenPathError";
  }
}

interface AssertionPayload {
  field: string;
  value: ProposedChange["value"];
  kind: ChangeKind;
  effectiveFrom: string;
  effectiveTo?: string;
}

interface ApplyPayload {
  transactionId: string;
  matterId: string;
  field: string;
  assertionRevisionId: string;
  changeSetRevisionId: string;
  reviewRevisionId: string;
  sourceRevisionId: string;
  recovery: boolean;
}

function ref(referenceType: string, targetObjectType: string, targetObjectId: string, targetRevisionId: string, matterId: string): TypedReference {
  return { referenceType, targetObjectType, targetObjectId, targetRevisionId, matterId, required: true };
}

function envelope(input: {
  objectType: string;
  objectId: string;
  revisionId: string;
  matterId: string;
  recordedAt: string;
  payload: unknown;
  references?: readonly TypedReference[];
}): CanonicalEnvelope {
  return {
    recordFormat: "dossara-record/1",
    schemaId: input.objectType.toLowerCase().replaceAll("_", "-"),
    schemaVersion: "1",
    objectType: input.objectType,
    objectId: input.objectId,
    revisionId: input.revisionId,
    revisionOf: input.objectId,
    matterId: input.matterId,
    recordedAt: input.recordedAt,
    createdBy: "gpp-lawyer-1",
    generatorType: "MANUAL",
    payload: input.payload,
    references: input.references ?? [],
  };
}

function historyPath(workspaceRoot: string): string {
  return assertPermittedTestPath(path.join(workspaceRoot, "00 CONTROL", "vla", "history", "active.jsonl"));
}

async function publishJsonCreateOnly(filePath: string, value: unknown): Promise<void> {
  const safePath = assertPermittedTestPath(filePath);
  await mkdir(path.dirname(safePath), { recursive: true });
  const handle = await open(safePath, "wx");
  try {
    await handle.writeFile(canonicalJson(value), "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function transactionPath(workspaceRoot: string, transactionId: string): string {
  return assertPermittedTestPath(path.join(workspaceRoot, "00 CONTROL", "vla", "transactions", `${transactionId}.json`));
}

export async function proposeAndReview(workspaceRoot: string, change: ProposedChange): Promise<void> {
  const sourceObjectId = change.sourceRevisionId.replace(/-r\d+$/, "");
  const source = envelope({
    objectType: "SOURCE_ITEM",
    objectId: sourceObjectId,
    revisionId: change.sourceRevisionId,
    matterId: change.matterId,
    recordedAt: change.recordedAt,
    payload: { locator: `synthetic://${sourceObjectId}`, evidence: `fixture-${sourceObjectId}` },
  });
  try {
    await writeImmutableRevision(workspaceRoot, source, GPP_REGISTRY);
  } catch (error) {
    if ((error as { code?: string }).code !== "REVISION_ALREADY_EXISTS") throw error;
  }

  await writeImmutableRevision(workspaceRoot, envelope({
    objectType: "CHANGE_SET",
    objectId: change.changeSetId,
    revisionId: change.revisionId,
    matterId: change.matterId,
    recordedAt: change.recordedAt,
    payload: {
      changeSetId: change.changeSetId,
      revisionId: change.revisionId,
      itemId: change.itemId,
      matterId: change.matterId,
      field: change.field,
      value: change.value,
      kind: change.kind,
      recordedAt: change.recordedAt,
      effectiveFrom: change.effectiveFrom,
      ...(change.effectiveTo ? { effectiveTo: change.effectiveTo } : {}),
      ...(change.baseRevisionId ? { baseRevisionId: change.baseRevisionId } : {}),
      sourceRevisionId: change.sourceRevisionId,
      ...(change.contradictory === undefined ? {} : { contradictory: change.contradictory }),
    },
    references: [ref("SOURCE_REVISION", "SOURCE_ITEM", sourceObjectId, change.sourceRevisionId, change.matterId)],
  }), GPP_REGISTRY);

  await writeImmutableRevision(workspaceRoot, envelope({
    objectType: "REVIEW_RECORD",
    objectId: `review-${change.itemId}`,
    revisionId: `review-${change.itemId}-r1`,
    matterId: change.matterId,
    recordedAt: change.recordedAt,
    payload: { decision: "APPROVED", authority: "LAWYER", purpose: "GPP_PROOF", exactChangeSetRevision: change.revisionId },
    references: [ref("CHANGE_SET_REVISION", "CHANGE_SET", change.changeSetId, change.revisionId, change.matterId)],
  }), GPP_REGISTRY);
}

async function latestRevisionForField(workspaceRoot: string, matterId: string, field: string): Promise<string | undefined> {
  const state = await reconstruct(workspaceRoot, matterId, "9999-12-31T23:59:59.999Z", "9999-12-31T23:59:59.999Z");
  return state.provenance[field]?.assertionRevisionId;
}

export async function controlledApply(
  workspaceRoot: string,
  change: ProposedChange,
  options: { failAfterRevision?: boolean } = {},
): Promise<{ transactionId: string; assertionRevisionId: string; applyEventId: string }> {
  const reviewRevisionId = `review-${change.itemId}-r1`;
  const reviewPath = revisionPath(workspaceRoot, envelope({
    objectType: "REVIEW_RECORD", objectId: `review-${change.itemId}`, revisionId: reviewRevisionId,
    matterId: change.matterId, recordedAt: change.recordedAt, payload: {},
  }));
  const review = await readImmutableRevision(reviewPath, GPP_REGISTRY);
  const reviewPayload = review.envelope.payload as { decision?: string; exactChangeSetRevision?: string };
  if (reviewPayload.decision !== "APPROVED" || reviewPayload.exactChangeSetRevision !== change.revisionId) {
    throw new GoldenPathError("NOT_APPROVED", "Review is not bound to the exact Change Set revision");
  }
  if (change.contradictory) throw new GoldenPathError("CONFLICT_BLOCKED", "Unresolved material contradiction blocks apply");

  const actualBase = await latestRevisionForField(workspaceRoot, change.matterId, change.field);
  if (actualBase !== change.baseRevisionId) {
    throw new GoldenPathError("STALE_BASE", `Expected ${change.baseRevisionId ?? "absence"}, observed ${actualBase ?? "absence"}`);
  }

  const transactionId = `tx-${change.itemId}`;
  const assertionObjectId = `assertion-${change.field}`;
  const assertionRevisionId = `${assertionObjectId}-${change.itemId}`;
  const applyEventId = `apply-${change.itemId}`;
  const attempt = {
    transactionId,
    status: "ATTEMPTED",
    matterId: change.matterId,
    changeSetId: change.changeSetId,
    changeSetRevisionId: change.revisionId,
    reviewRevisionId,
    assertionObjectId,
    assertionRevisionId,
    applyEventId,
    recordedAt: change.recordedAt,
  };
  await publishJsonCreateOnly(transactionPath(workspaceRoot, transactionId), attempt);

  await writeImmutableRevision(workspaceRoot, envelope({
    objectType: "MATTER_ASSERTION",
    objectId: assertionObjectId,
    revisionId: assertionRevisionId,
    matterId: change.matterId,
    recordedAt: change.recordedAt,
    payload: {
      field: change.field,
      value: change.value,
      kind: change.kind,
      effectiveFrom: change.effectiveFrom,
      ...(change.effectiveTo ? { effectiveTo: change.effectiveTo } : {}),
    } satisfies AssertionPayload,
    references: [
      ref("CHANGE_SET_REVISION", "CHANGE_SET", change.changeSetId, change.revisionId, change.matterId),
      ref("REVIEW_REVISION", "REVIEW_RECORD", `review-${change.itemId}`, reviewRevisionId, change.matterId),
      ref("SOURCE_REVISION", "SOURCE_ITEM", change.sourceRevisionId.replace(/-r\d+$/, ""), change.sourceRevisionId, change.matterId),
      ...(change.baseRevisionId ? [ref("TARGET_REVISION", "MATTER_ASSERTION", assertionObjectId, change.baseRevisionId, change.matterId)] : []),
    ],
  }), GPP_REGISTRY);

  if (options.failAfterRevision) throw new GoldenPathError("RECOVERY_REQUIRED", transactionId);

  await appendApplyEvent(workspaceRoot, attempt, false);
  return { transactionId, assertionRevisionId, applyEventId };
}

async function appendApplyEvent(workspaceRoot: string, attempt: Record<string, string>, recovery: boolean): Promise<void> {
  const event: HistoryEvent = {
    eventId: recovery ? `recovery-${attempt.applyEventId}` : attempt.applyEventId,
    eventType: recovery ? "RECOVERY_RECONCILED_APPLIED" : "APPLY_COMPLETED",
    recordedAt: attempt.recordedAt,
    payload: {
      transactionId: attempt.transactionId,
      matterId: attempt.matterId,
      field: attempt.assertionObjectId.replace(/^assertion-/, ""),
      assertionRevisionId: attempt.assertionRevisionId,
      changeSetRevisionId: attempt.changeSetRevisionId,
      reviewRevisionId: attempt.reviewRevisionId,
      sourceRevisionId: "",
      recovery,
    } satisfies ApplyPayload,
  };
  const assertion = await readImmutableRevision(revisionPath(workspaceRoot, envelope({
    objectType: "MATTER_ASSERTION", objectId: attempt.assertionObjectId, revisionId: attempt.assertionRevisionId,
    matterId: attempt.matterId, recordedAt: attempt.recordedAt, payload: {},
  })), GPP_REGISTRY);
  const source = assertion.envelope.references.find((item) => item.referenceType === "SOURCE_REVISION");
  (event.payload as ApplyPayload).sourceRevisionId = source?.targetRevisionId ?? "";
  await appendHistoryEvent(historyPath(workspaceRoot), event);
}

export async function recoverInterruptedApply(workspaceRoot: string, transactionId: string): Promise<"RECONCILED_APPLIED"> {
  const value = parseJsonStrict(await readFile(transactionPath(workspaceRoot, transactionId), "utf8")) as Record<string, string>;
  const history = await readHistory(historyPath(workspaceRoot)).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return { events: [], bytes: "" };
    throw error;
  });
  if (history.events.some((event) => (event.payload as Partial<ApplyPayload>).transactionId === transactionId)) return "RECONCILED_APPLIED";
  await readImmutableRevision(revisionPath(workspaceRoot, envelope({
    objectType: "MATTER_ASSERTION", objectId: value.assertionObjectId, revisionId: value.assertionRevisionId,
    matterId: value.matterId, recordedAt: value.recordedAt, payload: {},
  })), GPP_REGISTRY);
  await appendApplyEvent(workspaceRoot, value, true);
  return "RECONCILED_APPLIED";
}

export async function reconstruct(workspaceRoot: string, matterId: string, recordedCutoff: string, effectiveAt: string): Promise<ReconstructedState> {
  let events: HistoryEvent[] = [];
  try {
    events = (await readHistory(historyPath(workspaceRoot))).events;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const selected = new Map<string, { proof: MaterialValueProof; recordedAt: string }>();
  for (const event of events) {
    if (event.eventType !== "APPLY_COMPLETED" && event.eventType !== "RECOVERY_RECONCILED_APPLIED") continue;
    if (event.recordedAt > recordedCutoff) continue;
    const applied = event.payload as ApplyPayload;
    if (applied.matterId !== matterId) continue;
    const assertion = await readImmutableRevision(revisionPath(workspaceRoot, envelope({
      objectType: "MATTER_ASSERTION", objectId: `assertion-${applied.field}`, revisionId: applied.assertionRevisionId,
      matterId, recordedAt: event.recordedAt, payload: {},
    })), GPP_REGISTRY);
    const payload = assertion.envelope.payload as AssertionPayload;
    if (payload.effectiveFrom > effectiveAt || (payload.effectiveTo && effectiveAt >= payload.effectiveTo)) continue;
    selected.set(payload.field, {
      recordedAt: event.recordedAt,
      proof: {
        field: payload.field,
        value: payload.value,
        effectiveFrom: payload.effectiveFrom,
        ...(payload.effectiveTo ? { effectiveTo: payload.effectiveTo } : {}),
        assertionRevisionId: applied.assertionRevisionId,
        changeSetRevisionId: applied.changeSetRevisionId,
        reviewRevisionId: applied.reviewRevisionId,
        sourceRevisionId: applied.sourceRevisionId,
        applyEventId: event.eventId,
        transactionId: applied.transactionId,
      },
    });
  }
  const provenance = Object.fromEntries([...selected.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([field, item]) => [field, item.proof]));
  const values = Object.fromEntries(Object.entries(provenance).map(([field, proof]) => [field, proof.value]));
  return { matterId, recordedCutoff, effectiveAt, values, provenance };
}

export async function verifyProvenance(workspaceRoot: string, state: ReconstructedState): Promise<string[]> {
  const findings: string[] = [];
  for (const proof of Object.values(state.provenance)) {
    const targets: Array<[string, string, string]> = [
      ["MATTER_ASSERTION", `assertion-${proof.field}`, proof.assertionRevisionId],
      ["CHANGE_SET", proof.changeSetRevisionId.replace(/-r\d+$/, ""), proof.changeSetRevisionId],
      ["REVIEW_RECORD", proof.reviewRevisionId.replace(/-r\d+$/, ""), proof.reviewRevisionId],
      ["SOURCE_ITEM", proof.sourceRevisionId.replace(/-r\d+$/, ""), proof.sourceRevisionId],
    ];
    for (const [objectType, objectId, revisionId] of targets) {
      try {
        await readImmutableRevision(revisionPath(workspaceRoot, envelope({
          objectType, objectId, revisionId, matterId: state.matterId, recordedAt: state.recordedCutoff, payload: {},
        })), GPP_REGISTRY);
      } catch {
        findings.push(`${proof.field}:${objectType}:${revisionId}`);
      }
    }
  }
  return findings;
}

export async function authoritativeFileInventory(workspaceRoot: string): Promise<string[]> {
  const root = assertPermittedTestPath(path.join(workspaceRoot, "00 CONTROL", "vla"));
  const result: string[] = [];
  async function walk(folder: string): Promise<void> {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const item = path.join(folder, entry.name);
      if (entry.isDirectory()) await walk(item);
      else result.push(path.relative(root, item).replaceAll("\\", "/"));
    }
  }
  await walk(root);
  return result.sort();
}

export function deterministicStateBytes(state: ReconstructedState): string {
  return canonicalJson(state);
}
