import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  PERMITTED_TEST_ROOT,
  assertPermittedTestPath,
} from "../foundation-hardening/persistence-spike";
import type {
  DueKind,
  DueTemporalValue,
  LegalActionRecord,
  OperationalAuthorityDataset,
  OperationalFact,
} from "./contracts";
import {
  countsAsActiveMatterAsOf,
  deriveOperationalMetrics,
  isActionableLegalActionAsOf,
  isOpenLegalActionAsOf,
  isOverdueLegalActionAsOf,
  isWaitingLegalActionAsOf,
  operationalAsOf,
  reconstructOperationalEffectiveAt,
  resolveGoverningDueInstantAsOf,
} from "./operational-metrics";
import {
  createAuthorityBoundaries,
  loadOperationalDataset,
  persistOperationalDataset,
} from "./persistence-harness";

const T = "2026-08-10T12:00:00.000Z";
const EARLY = "2026-08-01T00:00:00.000Z";
const createdRoots: string[] = [];

afterEach(async () => {
  await Promise.all(createdRoots.splice(0).map(async (root) => {
    const safeRoot = assertPermittedTestPath(root);
    await rm(safeRoot, { recursive: true, force: true });
  }));
});

function action(actionId: string, matterId: string, recordedAt = EARLY): LegalActionRecord {
  return { actionId, matterId, revisionId: `${actionId}-revision-1`, recordedAt };
}

function fact(input: {
  eventId: string;
  matterId: string;
  subjectId: string;
  kind: OperationalFact["kind"];
  value: unknown;
  knownAt?: string;
  recordedAt?: string;
  effectiveFrom?: string;
  supersedes?: readonly string[];
}): OperationalFact {
  return {
    eventId: input.eventId,
    recordId: input.eventId,
    revisionId: `${input.eventId}-revision-1`,
    matterId: input.matterId,
    subjectId: input.subjectId,
    kind: input.kind,
    value: input.value,
    knownAt: input.knownAt ?? EARLY,
    recordedAt: input.recordedAt ?? EARLY,
    effectiveFrom: input.effectiveFrom ?? EARLY,
    ...(input.supersedes ? { supersedes: input.supersedes } : {}),
  } as OperationalFact;
}

function engagement(matterId: string, value: "OPEN" | "ENDED", eventId = `${matterId}-engagement`) {
  return fact({ eventId, matterId, subjectId: matterId, kind: "ENGAGEMENT_STATE", value });
}

function appliedActionFacts(actionId: string, matterId: string): OperationalFact[] {
  return [
    fact({
      eventId: `${actionId}-exists`,
      matterId,
      subjectId: actionId,
      kind: "ACTION_EXISTENCE",
      value: "APPLIED",
    }),
    fact({
      eventId: `${actionId}-assigned`,
      matterId,
      subjectId: actionId,
      kind: "ACTION_ASSIGNMENT",
      value: true,
    }),
  ];
}

function noDue(actionId: string, matterId: string): OperationalFact {
  return fact({
    eventId: `${actionId}-no-due`,
    matterId,
    subjectId: actionId,
    kind: "ACTION_NO_DUE",
    value: true,
  });
}

function due(
  actionId: string,
  matterId: string,
  candidateId: string,
  dueKind: DueKind,
  governing: boolean,
  temporal: DueTemporalValue,
): OperationalFact {
  return fact({
    eventId: `${actionId}-due-${candidateId}`,
    matterId,
    subjectId: actionId,
    kind: "ACTION_DUE",
    value: { candidateId, dueKind, governing, temporal },
  });
}

function dataset(
  portfolioId: string,
  matterIds: readonly string[],
  actions: readonly LegalActionRecord[],
  facts: readonly OperationalFact[],
  validatedAt = T,
): OperationalAuthorityDataset {
  return {
    portfolioId,
    matterIds,
    actions,
    facts,
    boundaries: createAuthorityBoundaries(matterIds, actions, facts, validatedAt),
  };
}

function baselineDataset(): OperationalAuthorityDataset {
  const actions = [
    action("action-a", "matter-a"),
    action("action-b", "matter-b"),
    action("action-d", "matter-d"),
    action("action-e", "matter-e"),
    action("action-f", "matter-f"),
  ];
  const facts: OperationalFact[] = [
    engagement("matter-a", "OPEN"),
    ...appliedActionFacts("action-a", "matter-a"),
    due("action-a", "matter-a", "external-future", "LEGAL_EXTERNAL", true, {
      type: "DATETIME",
      value: "2026-08-12T10:00:00+02:00",
    }),

    engagement("matter-b", "OPEN"),
    ...appliedActionFacts("action-b", "matter-b"),
    fact({
      eventId: "action-b-waits-client",
      matterId: "matter-b",
      subjectId: "action-b",
      kind: "ACTION_DEPENDENCY",
      value: { dependencyId: "client-document", actor: "CLIENT", status: "WAITING" },
    }),
    noDue("action-b", "matter-b"),

    engagement("matter-c", "ENDED"),

    engagement("matter-d", "OPEN"),
    ...appliedActionFacts("action-d", "matter-d"),
    due("action-d", "matter-d", "target", "TARGET", false, {
      type: "DATE",
      value: "2026-08-08",
      timezone: "Europe/Belgrade",
    }),
    due("action-d", "matter-d", "event", "EVENT", false, {
      type: "DATETIME",
      value: "2026-08-09T08:00:00Z",
    }),
    noDue("action-d", "matter-d"),

    engagement("matter-e", "OPEN"),
    ...appliedActionFacts("action-e", "matter-e"),
    due("action-e", "matter-e", "external", "LEGAL_EXTERNAL", true, {
      type: "DATETIME",
      value: "2026-08-10T10:00:00Z",
    }),

    engagement("matter-f", "OPEN"),
    ...appliedActionFacts("action-f", "matter-f"),
    due("action-f", "matter-f", "external-governing", "LEGAL_EXTERNAL", true, {
      type: "DATETIME",
      value: "2026-08-09T12:00:00Z",
    }),
    due("action-f", "matter-f", "internal", "INTERNAL", false, {
      type: "DATETIME",
      value: "2026-08-08T12:00:00Z",
    }),
    due("action-f", "matter-f", "target", "TARGET", false, {
      type: "DATETIME",
      value: "2026-08-07T12:00:00Z",
    }),
    due("action-f", "matter-f", "event", "EVENT", false, {
      type: "DATETIME",
      value: "2026-08-06T12:00:00Z",
    }),
  ];
  return dataset(
    "mvs-1-portfolio",
    ["matter-a", "matter-b", "matter-c", "matter-d", "matter-e", "matter-f"],
    actions,
    facts,
  );
}

function metricValue(projection: ReturnType<typeof deriveOperationalMetrics>, metricId: string): number {
  const metric = projection.metrics.find((value) => value.metricId === metricId);
  if (!metric || metric.value.status !== "RESOLVED") throw new Error(`Metric not resolved: ${metricId}`);
  return metric.value.value;
}

describe("MVS-1 VOC-1 operational primitives", () => {
  it("proves active matter is not the same as matter with actionable work", () => {
    const authority = baselineDataset();
    expect(countsAsActiveMatterAsOf(authority, "matter-b", T)).toMatchObject({
      status: "RESOLVED",
      value: true,
    });
    expect(isOpenLegalActionAsOf(authority, "action-b", T)).toMatchObject({
      status: "RESOLVED",
      value: true,
    });
    expect(isWaitingLegalActionAsOf(authority, "action-b", T)).toMatchObject({
      status: "RESOLVED",
      value: true,
    });
    expect(isActionableLegalActionAsOf(authority, "action-b", T)).toMatchObject({
      status: "RESOLVED",
      value: false,
    });
  });

  it("classifies an ended professional engagement as non-active", () => {
    expect(countsAsActiveMatterAsOf(baselineDataset(), "matter-c", T)).toMatchObject({
      status: "RESOLVED",
      value: false,
    });
  });

  it("keeps no-due distinct from unresolved and ignores target/event dates", () => {
    const authority = baselineDataset();
    expect(resolveGoverningDueInstantAsOf(authority, "action-d", T)).toMatchObject({
      status: "RESOLVED",
      value: {
        classification: "NO_DUE",
        ruleId: "VOC1_AUTHORITATIVE_NO_DUE",
      },
    });
    expect(isOverdueLegalActionAsOf(authority, "action-d", T)).toMatchObject({
      status: "RESOLVED",
      value: "NOT_CLASSIFIABLE_NO_DUE",
    });
  });

  it("uses the authoritative external deadline before and after its boundary", () => {
    const authority = baselineDataset();
    expect(isOverdueLegalActionAsOf(
      authority,
      "action-e",
      "2026-08-10T09:59:59.000Z",
    )).toMatchObject({ status: "RESOLVED", value: "NOT_OVERDUE" });
    expect(isOverdueLegalActionAsOf(
      authority,
      "action-e",
      "2026-08-10T10:00:00.000Z",
    )).toMatchObject({ status: "RESOLVED", value: "OVERDUE" });
  });

  it("normalizes a governing date-only due at the next local calendar boundary", () => {
    const matterId = "matter-date-only";
    const actionId = "action-date-only";
    const authority = dataset(
      "date-only",
      [matterId],
      [action(actionId, matterId)],
      [
        engagement(matterId, "OPEN"),
        ...appliedActionFacts(actionId, matterId),
        due(actionId, matterId, "date-only", "LEGAL_EXTERNAL", true, {
          type: "DATE",
          value: "2026-03-29",
          timezone: "Europe/Belgrade",
        }),
      ],
    );

    expect(resolveGoverningDueInstantAsOf(authority, actionId, T)).toMatchObject({
      status: "RESOLVED",
      value: {
        classification: "RESOLVED",
        dueInstant: "2026-03-29T22:00:00.000Z",
        ruleId: "VOC1_GOVERNING_CONFIRMED_DEADLINE",
      },
    });
  });

  it("selects only the explicitly governing candidate among competing date kinds", () => {
    const result = resolveGoverningDueInstantAsOf(baselineDataset(), "action-f", T);
    expect(result).toMatchObject({
      status: "RESOLVED",
      value: {
        classification: "RESOLVED",
        candidateId: "external-governing",
        dueKind: "LEGAL_EXTERNAL",
        dueInstant: "2026-08-09T12:00:00.000Z",
        ruleId: "VOC1_GOVERNING_CONFIRMED_DEADLINE",
      },
    });
    expect(result.provenance).toEqual([{
      recordId: "action-f-due-external-governing",
      revisionId: "action-f-due-external-governing-revision-1",
    }]);
  });

  it("fails closed when governing due authority is ambiguous", () => {
    const matterId = "matter-ambiguous";
    const actionId = "action-ambiguous";
    const actions = [action(actionId, matterId)];
    const facts = [
      engagement(matterId, "OPEN"),
      ...appliedActionFacts(actionId, matterId),
      due(actionId, matterId, "legal-a", "LEGAL_EXTERNAL", true, {
        type: "DATETIME",
        value: "2026-08-11T10:00:00Z",
      }),
      due(actionId, matterId, "legal-b", "LEGAL_EXTERNAL", true, {
        type: "DATETIME",
        value: "2026-08-12T10:00:00Z",
      }),
    ];
    const authority = dataset("ambiguous", [matterId], actions, facts);
    expect(resolveGoverningDueInstantAsOf(authority, actionId, T)).toMatchObject({
      status: "UNRESOLVED",
      reason: "CONFLICTING_AUTHORITY",
      severity: "INVALID",
    });
    expect(isOverdueLegalActionAsOf(authority, actionId, T)).toMatchObject({
      status: "UNRESOLVED",
      reason: "CONFLICTING_AUTHORITY",
    });
  });

  it("derives waiting from dependency authority without a canonical waiting lifecycle", () => {
    const authority = baselineDataset();
    const waitingFacts = authority.facts.filter((value) =>
      value.subjectId === "action-b" && value.kind === "ACTION_DEPENDENCY");
    const terminalFacts = authority.facts.filter((value) =>
      value.subjectId === "action-b" && value.kind === "ACTION_DISPOSITION");
    expect(waitingFacts).toHaveLength(1);
    expect(terminalFacts).toHaveLength(0);
    expect(isWaitingLegalActionAsOf(authority, "action-b", T)).toMatchObject({
      status: "RESOLVED",
      value: true,
    });
  });
});

describe("MVS-1 temporal modes and correction history", () => {
  function historicalDataset(): OperationalAuthorityDataset {
    const matterId = "matter-history";
    const facts = [
      fact({
        eventId: "history-engagement-open",
        matterId,
        subjectId: matterId,
        kind: "ENGAGEMENT_STATE",
        value: "OPEN",
        knownAt: "2026-06-01T00:00:00.000Z",
        recordedAt: "2026-06-01T00:00:00.000Z",
        effectiveFrom: "2026-06-01T00:00:00.000Z",
      }),
      fact({
        eventId: "history-monitoring-on",
        matterId,
        subjectId: matterId,
        kind: "MONITORING_REQUIRED",
        value: true,
        knownAt: "2026-06-01T00:00:00.000Z",
        recordedAt: "2026-06-01T00:00:00.000Z",
        effectiveFrom: "2026-06-01T00:00:00.000Z",
      }),
      fact({
        eventId: "history-engagement-correction",
        matterId,
        subjectId: matterId,
        kind: "ENGAGEMENT_STATE",
        value: "ENDED",
        knownAt: "2026-08-20T00:00:00.000Z",
        recordedAt: "2026-08-21T00:00:00.000Z",
        effectiveFrom: "2026-07-01T00:00:00.000Z",
        supersedes: ["history-engagement-open"],
      }),
      fact({
        eventId: "history-monitoring-correction",
        matterId,
        subjectId: matterId,
        kind: "MONITORING_REQUIRED",
        value: false,
        knownAt: "2026-08-20T00:00:00.000Z",
        recordedAt: "2026-08-21T00:00:00.000Z",
        effectiveFrom: "2026-07-01T00:00:00.000Z",
        supersedes: ["history-monitoring-on"],
      }),
    ];
    return dataset("history", [matterId], [], facts, "2026-08-22T00:00:00.000Z");
  }

  it("enforces Te = Tk = Tr = T for regular operationalAsOf", () => {
    const authority = historicalDataset();
    const historical = operationalAsOf(authority, "matter-history", T);
    expect(historical.query).toEqual({
      effectiveAt: T,
      knowledgeCutoff: T,
      recordedCutoff: T,
    });
    expect(historical.active).toMatchObject({ status: "RESOLVED", value: true });
  });

  it("keeps retrospective reconstruction explicit and preserves the prior historical result", () => {
    const authority = historicalDataset();
    const historicalA = operationalAsOf(authority, "matter-history", T);
    const retrospective = reconstructOperationalEffectiveAt(
      authority,
      "matter-history",
      T,
      "2026-08-22T00:00:00.000Z",
      "2026-08-22T00:00:00.000Z",
    );
    const historicalB = operationalAsOf(authority, "matter-history", T);

    expect(retrospective.active).toMatchObject({ status: "RESOLVED", value: false });
    expect(retrospective.query).not.toEqual(historicalA.query);
    expect(historicalB).toEqual(historicalA);
  });
});

describe("MVS-1 multidimensional projection and metrics", () => {
  it("returns independent active, actionable, waiting, overdue and next-step dimensions", () => {
    const projection = operationalAsOf(baselineDataset(), "matter-b", T);
    expect(projection).toMatchObject({
      active: { status: "RESOLVED", value: true },
      hasActionableWork: { status: "RESOLVED", value: false },
      waiting: { status: "RESOLVED", value: true },
      hasOverdueWork: { status: "RESOLVED", value: false },
      nextActionableStepAvailable: { status: "RESOLVED", value: false },
    });
    expect(projection.actions[0]).toMatchObject({
      actionId: "action-b",
      open: { value: true },
      actionable: { value: false },
      waiting: { value: true },
      governingDue: { value: { classification: "NO_DUE" } },
    });
  });

  it("derives only the seven bounded MVS-1 metrics with the expected fixture results", () => {
    const projection = deriveOperationalMetrics(baselineDataset(), T);
    expect(projection.metrics.map((metric) => metric.metricId)).toEqual([
      "activeMatterCount",
      "mattersWithActionableWorkCount",
      "waitingMatterCount",
      "openLegalActionCount",
      "actionableLegalActionCount",
      "overdueLegalActionCount",
      "mattersWithoutNextActionableStepCount",
    ]);
    expect(metricValue(projection, "activeMatterCount")).toBe(5);
    expect(metricValue(projection, "mattersWithActionableWorkCount")).toBe(4);
    expect(metricValue(projection, "waitingMatterCount")).toBe(1);
    expect(metricValue(projection, "openLegalActionCount")).toBe(5);
    expect(metricValue(projection, "actionableLegalActionCount")).toBe(4);
    expect(metricValue(projection, "overdueLegalActionCount")).toBe(2);
    expect(metricValue(projection, "mattersWithoutNextActionableStepCount")).toBe(1);
  });

  it("is deterministic across equivalent input insertion order", () => {
    const authority = baselineDataset();
    const reversed: OperationalAuthorityDataset = {
      ...authority,
      matterIds: [...authority.matterIds].reverse(),
      actions: [...authority.actions].reverse(),
      facts: [...authority.facts].reverse(),
    };
    expect(deriveOperationalMetrics(reversed, T)).toEqual(deriveOperationalMetrics(authority, T));
  });

  it("propagates insufficient authority instead of converting unknown to false", () => {
    const authority = baselineDataset();
    const withoutAssignmentFacts = authority.facts.filter((value) =>
      value.eventId !== "action-a-assigned");
    const changed = dataset(
      authority.portfolioId,
      authority.matterIds,
      authority.actions,
      withoutAssignmentFacts,
    );
    expect(isActionableLegalActionAsOf(changed, "action-a", T)).toMatchObject({
      status: "UNRESOLVED",
      reason: "MISSING_AUTHORITY",
    });
    const metric = deriveOperationalMetrics(changed, T).metrics.find((value) =>
      value.metricId === "actionableLegalActionCount");
    expect(metric?.value).toMatchObject({ status: "UNRESOLVED" });
    expect(metric?.value).not.toHaveProperty("value");
  });

  it("propagates an FH-1 stale frontier instead of resolving from stale authority", () => {
    const authority = baselineDataset();
    const boundary = authority.boundaries["matter-a"];
    if (!boundary) throw new Error("Missing matter-a boundary");
    const changed: OperationalAuthorityDataset = {
      ...authority,
      boundaries: {
        ...authority.boundaries,
        "matter-a": {
          frontier: boundary.frontier,
          observed: { ...boundary.observed, rulesVersion: "unexpected-rules-version" },
        },
      },
    };
    expect(countsAsActiveMatterAsOf(changed, "matter-a", T)).toMatchObject({
      status: "UNRESOLVED",
      reason: "FRONTIER_STALE",
      severity: "UNAVAILABLE",
    });
  });
});

describe("MVS-1 persisted reconstruction", () => {
  it("rebuilds the same result from equivalent FH-1 persisted evidence orders", async () => {
    const workspaceA = assertPermittedTestPath(await mkdtemp(path.join(PERMITTED_TEST_ROOT, "mvs1-a-")));
    const workspaceB = assertPermittedTestPath(await mkdtemp(path.join(PERMITTED_TEST_ROOT, "mvs1-b-")));
    createdRoots.push(workspaceA, workspaceB);
    const authority = baselineDataset();

    const manifestA = await persistOperationalDataset(workspaceA, authority, "FORWARD");
    const manifestB = await persistOperationalDataset(workspaceB, authority, "REVERSE");
    const actionBytesBefore = await readFile(manifestA.actionRevisionPaths[0], "utf8");
    const loadedA = await loadOperationalDataset(manifestA);
    const loadedB = await loadOperationalDataset(manifestB);

    const projectionA = deriveOperationalMetrics(loadedA, T);
    const projectionB = deriveOperationalMetrics(loadedB, T);
    expect(projectionB).toEqual(projectionA);
    expect(projectionA).toEqual(deriveOperationalMetrics(authority, T));
    expect(await readFile(manifestA.actionRevisionPaths[0], "utf8")).toBe(actionBytesBefore);
  });

  it("has no production src/UI or outbound-capable coupling and no hidden time/locale source", async () => {
    const source = (await Promise.all([
      "contracts.ts",
      "operational-metrics.ts",
      "persistence-harness.ts",
      "temporal.ts",
    ].map((file) => readFile(path.join(
      process.cwd(),
      "spikes",
      "mvs-1-operational-metrics",
      file,
    ), "utf8")))).join("\n");

    expect(source).not.toMatch(/from\s+["']@\//);
    expect(source).not.toMatch(/from\s+["'][^"']*src[\\/]/);
    expect(source).not.toMatch(/node:(?:http|https|net|tls|dgram|child_process)/);
    expect(source).not.toMatch(/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);
    expect(source).not.toMatch(/\bDate\.now\s*\(/);
    expect(source).not.toMatch(/\.localeCompare\s*\(/);
    expect(source).not.toMatch(/mvs-0-metrics/);
  });
});
