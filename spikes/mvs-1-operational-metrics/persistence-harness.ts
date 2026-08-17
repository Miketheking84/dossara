import path from "node:path";
import type { CanonicalEnvelope, TypeRegistry } from "../foundation-hardening/contracts";
import {
  appendHistoryEvent,
  assertPermittedTestPath,
  readHistory,
  readImmutableRevision,
  writeImmutableRevision,
} from "../foundation-hardening/persistence-spike";
import type { DependencyFrontier, ObservedAuthority } from "../foundation-hardening/dependency-frontier";
import {
  MVS1_REGISTRY_VERSION,
  MVS1_RULES_VERSION,
  MVS1_SCHEMA_SET_VERSION,
  type LegalActionRecord,
  type MatterAuthorityBoundary,
  type OperationalAuthorityDataset,
  type OperationalFact,
  type PersistedDatasetManifest,
} from "./contracts";

const registry: TypeRegistry = {
  version: MVS1_REGISTRY_VERSION,
  types: [{ objectType: "LEGAL_ACTION", schemaVersions: ["mvs-1-fixture/1"] }],
  referenceTypes: {},
};

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sortedHeads(values: Readonly<Record<string, string>>): Readonly<Record<string, string>> {
  return Object.fromEntries(Object.entries(values).sort(([left], [right]) => compareText(left, right)));
}

function authorityHeads(
  matterId: string,
  actions: readonly LegalActionRecord[],
  facts: readonly OperationalFact[],
): Readonly<Record<string, string>> {
  const heads: Record<string, string> = {};
  for (const action of actions.filter((value) => value.matterId === matterId)) {
    heads[`action:${action.actionId}`] = action.revisionId;
  }
  for (const fact of facts.filter((value) => value.matterId === matterId)) {
    heads[`event:${fact.eventId}`] = fact.revisionId;
  }
  return sortedHeads(heads);
}

export function createAuthorityBoundaries(
  matterIds: readonly string[],
  actions: readonly LegalActionRecord[],
  facts: readonly OperationalFact[],
  validatedAt: string,
): Readonly<Record<string, MatterAuthorityBoundary>> {
  return Object.fromEntries([...matterIds].sort(compareText).map((matterId) => {
    const heads = authorityHeads(matterId, actions, facts);
    const frontier: DependencyFrontier = {
      frontierId: `mvs-1-frontier:${matterId}`,
      registryVersion: MVS1_REGISTRY_VERSION,
      rulesVersion: MVS1_RULES_VERSION,
      schemaSetVersion: MVS1_SCHEMA_SET_VERSION,
      matterId,
      heads,
      unsupportedInputs: [],
      validatedAt,
    };
    const observed: ObservedAuthority = {
      registryVersion: MVS1_REGISTRY_VERSION,
      rulesVersion: MVS1_RULES_VERSION,
      schemaSetVersion: MVS1_SCHEMA_SET_VERSION,
      matterId,
      heads,
      unsupportedInputs: [],
    };
    return [matterId, { frontier, observed }];
  }));
}

function actionEnvelope(action: LegalActionRecord): CanonicalEnvelope {
  return {
    recordFormat: "dossara-record/1",
    schemaId: "mvs-1-legal-action-fixture",
    schemaVersion: "mvs-1-fixture/1",
    objectType: "LEGAL_ACTION",
    objectId: action.actionId,
    revisionId: action.revisionId,
    revisionOf: action.actionId,
    matterId: action.matterId,
    recordedAt: action.recordedAt,
    createdBy: "mvs-1-synthetic-fixture",
    generatorType: "MANUAL",
    payload: { actionId: action.actionId, matterId: action.matterId },
    references: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid MVS-1 fact field: ${key}`);
  }
  return value;
}

function validateFact(value: unknown): OperationalFact {
  if (!isRecord(value) || !isRecord(value.value)) {
    if (!isRecord(value)) throw new Error("MVS-1 history payload must be an object");
  }
  const record = value as Record<string, unknown>;
  const kind = requireString(record, "kind");
  const acceptedKinds = new Set([
    "ENGAGEMENT_STATE",
    "MONITORING_REQUIRED",
    "EXPECTED_EVENT_PENDING",
    "ACTION_EXISTENCE",
    "ACTION_ASSIGNMENT",
    "ACTION_DISPOSITION",
    "ACTION_DEPENDENCY",
    "ACTION_EARLIEST",
    "ACTION_DUE",
    "ACTION_NO_DUE",
  ]);
  if (!acceptedKinds.has(kind)) throw new Error(`Unsupported MVS-1 fact kind: ${kind}`);
  for (const key of [
    "eventId",
    "recordId",
    "revisionId",
    "matterId",
    "subjectId",
    "knownAt",
    "recordedAt",
    "effectiveFrom",
  ]) {
    requireString(record, key);
  }
  if (!("value" in record)) throw new Error("MVS-1 fact value is required");
  if (record.supersedes !== undefined && (
    !Array.isArray(record.supersedes)
    || record.supersedes.some((item) => typeof item !== "string")
  )) {
    throw new Error("MVS-1 fact supersedes must be string[]");
  }
  return value as unknown as OperationalFact;
}

export async function persistOperationalDataset(
  workspaceRoot: string,
  dataset: OperationalAuthorityDataset,
  order: "FORWARD" | "REVERSE" = "FORWARD",
): Promise<PersistedDatasetManifest> {
  const root = assertPermittedTestPath(workspaceRoot);
  const actions = order === "FORWARD" ? [...dataset.actions] : [...dataset.actions].reverse();
  const facts = order === "FORWARD" ? [...dataset.facts] : [...dataset.facts].reverse();
  const actionRevisionPaths: string[] = [];
  for (const action of actions) {
    const written = await writeImmutableRevision(root, actionEnvelope(action), registry);
    actionRevisionPaths.push(written.filePath);
  }

  const historyPath = assertPermittedTestPath(path.join(
    root,
    "00 CONTROL",
    "vla",
    "history",
    "mvs-1-operational-facts.jsonl",
  ));
  for (const fact of facts) {
    await appendHistoryEvent(historyPath, {
      eventId: fact.eventId,
      eventType: "STATE_EFFECT_EVENT",
      recordedAt: fact.recordedAt,
      payload: fact,
    });
  }

  return {
    portfolioId: dataset.portfolioId,
    matterIds: [...dataset.matterIds],
    actionRevisionPaths: actionRevisionPaths.sort(compareText),
    historyPath,
    boundaries: dataset.boundaries,
  };
}

export async function loadOperationalDataset(
  manifest: PersistedDatasetManifest,
): Promise<OperationalAuthorityDataset> {
  const actions: LegalActionRecord[] = [];
  for (const filePath of [...manifest.actionRevisionPaths].sort(compareText)) {
    const loaded = await readImmutableRevision(filePath, registry);
    const payload = loaded.envelope.payload;
    if (!isRecord(payload)) throw new Error("LEGAL_ACTION payload must be an object");
    actions.push({
      actionId: requireString(payload, "actionId"),
      matterId: requireString(payload, "matterId"),
      revisionId: loaded.envelope.revisionId,
      recordedAt: loaded.envelope.recordedAt,
    });
  }

  const history = await readHistory(manifest.historyPath);
  const facts = history.events.map((event) => {
    if (event.eventType !== "STATE_EFFECT_EVENT") {
      throw new Error(`Unexpected history event type: ${event.eventType}`);
    }
    const fact = validateFact(event.payload);
    if (fact.eventId !== event.eventId || fact.recordedAt !== event.recordedAt) {
      throw new Error("History envelope and fact payload identity/time mismatch");
    }
    return fact;
  });

  const boundaries = Object.fromEntries([...manifest.matterIds].sort(compareText).map((matterId) => {
    const expected = manifest.boundaries[matterId];
    if (!expected) throw new Error(`Missing declared frontier for ${matterId}`);
    const observed: ObservedAuthority = {
      registryVersion: MVS1_REGISTRY_VERSION,
      rulesVersion: MVS1_RULES_VERSION,
      schemaSetVersion: MVS1_SCHEMA_SET_VERSION,
      matterId,
      heads: authorityHeads(matterId, actions, facts),
      unsupportedInputs: [],
    };
    return [matterId, { frontier: expected.frontier, observed }];
  }));

  return {
    portfolioId: manifest.portfolioId,
    matterIds: [...manifest.matterIds],
    actions: actions.sort((left, right) => compareText(left.actionId, right.actionId)),
    facts,
    boundaries,
  };
}
