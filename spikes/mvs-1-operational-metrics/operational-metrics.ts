import { canonicalJson } from "../foundation-hardening/canonical-json";
import { assessFrontier } from "../foundation-hardening/dependency-frontier";
import type {
  AuthorityReference,
  Resolution,
  ResolutionSeverity,
  UnresolvedReason,
} from "./contracts";
import {
  canonicalInstant,
  parseInstant,
  resolveDateOnlyDueInstant,
} from "./temporal";
import {
  MVS1_RULES_VERSION,
  type GoverningDue,
  type LegalActionProjection,
  type MatterOperationalProjection,
  type OperationalAuthorityDataset,
  type OperationalFact,
  type OperationalMetricId,
  type OperationalMetricResult,
  type OperationalMetricsProjection,
  type OperationalQuery,
  type OverdueClassification,
} from "./contracts";

type FactKind = OperationalFact["kind"];

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function reference(value: AuthorityReference): AuthorityReference {
  return { recordId: value.recordId, revisionId: value.revisionId };
}

function stableReferences(values: readonly AuthorityReference[]): AuthorityReference[] {
  const unique = new Map<string, AuthorityReference>();
  for (const value of values) {
    unique.set(`${value.recordId}\u0000${value.revisionId}`, reference(value));
  }
  return [...unique.values()].sort((left, right) =>
    compareText(left.recordId, right.recordId) || compareText(left.revisionId, right.revisionId));
}

function resolved<T>(value: T, provenance: readonly AuthorityReference[]): Resolution<T> {
  return { status: "RESOLVED", value, provenance: stableReferences(provenance) };
}

function unresolved<T>(
  reason: UnresolvedReason,
  severity: ResolutionSeverity,
  provenance: readonly AuthorityReference[],
): Resolution<T> {
  return { status: "UNRESOLVED", reason, severity, provenance: stableReferences(provenance) };
}

function mergeUnresolved<T>(values: readonly Resolution<unknown>[]): Resolution<T> | null {
  const failures = values
    .filter((value): value is Extract<Resolution<unknown>, { status: "UNRESOLVED" }> =>
      value.status === "UNRESOLVED")
    .sort((left, right) => {
      if (left.severity !== right.severity) return left.severity === "INVALID" ? -1 : 1;
      return compareText(left.reason, right.reason);
    });
  if (failures.length === 0) return null;
  return unresolved(
    failures[0].reason,
    failures.some((failure) => failure.severity === "INVALID") ? "INVALID" : "UNAVAILABLE",
    failures.flatMap((failure) => failure.provenance),
  );
}

function queryIsValid(query: OperationalQuery): boolean {
  return parseInstant(query.effectiveAt) !== null
    && parseInstant(query.knowledgeCutoff) !== null
    && parseInstant(query.recordedCutoff) !== null;
}

function operationalQuery(at: string): OperationalQuery {
  return { effectiveAt: at, knowledgeCutoff: at, recordedCutoff: at };
}

function factGroupKey(fact: OperationalFact): string {
  if (fact.kind === "ACTION_DEPENDENCY") return `${fact.kind}:${fact.value.dependencyId}`;
  if (fact.kind === "ACTION_DUE") return `${fact.kind}:${fact.value.candidateId}`;
  return fact.kind;
}

function factsFor(
  dataset: OperationalAuthorityDataset,
  matterId: string,
  subjectId: string,
  kind: FactKind,
): OperationalFact[] {
  return dataset.facts.filter((fact) =>
    fact.matterId === matterId && fact.subjectId === subjectId && fact.kind === kind);
}

function currentFact(
  facts: readonly OperationalFact[],
  query: OperationalQuery,
): Resolution<OperationalFact | null> {
  if (!queryIsValid(query)) return unresolved("INVALID_TEMPORAL_DATA", "INVALID", facts);

  const parsed = new Map<string, { effective: number; known: number; recorded: number }>();
  const byEventId = new Map<string, OperationalFact>();
  for (const fact of facts) {
    if (byEventId.has(fact.eventId)) {
      return unresolved("AMBIGUOUS_SUPERSESSION", "INVALID", facts);
    }
    const effective = parseInstant(fact.effectiveFrom);
    const known = parseInstant(fact.knownAt);
    const recorded = parseInstant(fact.recordedAt);
    if (effective === null || known === null || recorded === null) {
      return unresolved("INVALID_TEMPORAL_DATA", "INVALID", facts);
    }
    byEventId.set(fact.eventId, fact);
    parsed.set(fact.eventId, { effective, known, recorded });
  }

  for (const fact of facts) {
    for (const target of fact.supersedes ?? []) {
      if (!byEventId.has(target)) {
        return unresolved("AMBIGUOUS_SUPERSESSION", "INVALID", facts);
      }
    }
  }

  const effectiveAt = parseInstant(query.effectiveAt) as number;
  const knowledgeCutoff = parseInstant(query.knowledgeCutoff) as number;
  const recordedCutoff = parseInstant(query.recordedCutoff) as number;
  const visible = facts.filter((fact) => {
    const times = parsed.get(fact.eventId) as { effective: number; known: number; recorded: number };
    return times.effective <= effectiveAt
      && times.known <= knowledgeCutoff
      && times.recorded <= recordedCutoff;
  });
  if (visible.length === 0) return resolved(null, []);

  const superseded = new Set(visible.flatMap((fact) => [...(fact.supersedes ?? [])]));
  const candidates = visible.filter((fact) => !superseded.has(fact.eventId));
  if (candidates.length === 0) {
    return unresolved("AMBIGUOUS_SUPERSESSION", "INVALID", visible);
  }

  const latestEffective = Math.max(...candidates.map((fact) =>
    (parsed.get(fact.eventId) as { effective: number }).effective));
  const latest = candidates.filter((fact) =>
    (parsed.get(fact.eventId) as { effective: number }).effective === latestEffective);
  const firstValue = canonicalJson(latest[0].value);
  if (latest.some((fact) => canonicalJson(fact.value) !== firstValue)) {
    return unresolved("CONFLICTING_AUTHORITY", "INVALID", latest);
  }

  return resolved(
    [...latest].sort((left, right) => compareText(left.eventId, right.eventId))[0],
    latest,
  );
}

function currentFactsByGroup(
  facts: readonly OperationalFact[],
  query: OperationalQuery,
): Resolution<readonly OperationalFact[]> {
  const groups = new Map<string, OperationalFact[]>();
  for (const fact of facts) {
    const key = factGroupKey(fact);
    groups.set(key, [...(groups.get(key) ?? []), fact]);
  }
  const results = [...groups.entries()]
    .sort(([left], [right]) => compareText(left, right))
    .map(([, group]) => currentFact(group, query));
  const failure = mergeUnresolved<readonly OperationalFact[]>(results);
  if (failure) return failure;
  const current = results.flatMap((result) =>
    result.status === "RESOLVED" && result.value !== null ? [result.value] : []);
  return resolved(current, results.flatMap((result) => result.provenance));
}

function boundaryResult(
  dataset: OperationalAuthorityDataset,
  matterId: string,
): Resolution<true> {
  const boundary = dataset.boundaries[matterId];
  if (!boundary) return unresolved("MISSING_AUTHORITY", "UNAVAILABLE", []);
  const assessment = assessFrontier(boundary.frontier, boundary.observed);
  if (assessment.status === "CURRENT") return resolved(true, []);
  if (assessment.status === "INVALID") return unresolved("FRONTIER_INVALID", "INVALID", []);
  if (assessment.status === "INCOMPLETE") return unresolved("FRONTIER_INCOMPLETE", "UNAVAILABLE", []);
  return unresolved("FRONTIER_STALE", "UNAVAILABLE", []);
}

function actionRecord(dataset: OperationalAuthorityDataset, actionId: string) {
  return dataset.actions.find((action) => action.actionId === actionId);
}

function actionIdsForMatter(dataset: OperationalAuthorityDataset, matterId: string): string[] {
  return dataset.actions
    .filter((action) => action.matterId === matterId)
    .map((action) => action.actionId)
    .sort(compareText);
}

function isOpenAtQuery(
  dataset: OperationalAuthorityDataset,
  actionId: string,
  query: OperationalQuery,
): Resolution<boolean> {
  const action = actionRecord(dataset, actionId);
  if (!action) return unresolved("MISSING_AUTHORITY", "UNAVAILABLE", []);
  const boundary = boundaryResult(dataset, action.matterId);
  if (boundary.status === "UNRESOLVED") return boundary;

  const existence = currentFact(
    factsFor(dataset, action.matterId, actionId, "ACTION_EXISTENCE"),
    query,
  );
  if (existence.status === "UNRESOLVED") return existence;
  if (existence.value === null) return resolved(false, existence.provenance);

  const disposition = currentFact(
    factsFor(dataset, action.matterId, actionId, "ACTION_DISPOSITION"),
    query,
  );
  if (disposition.status === "UNRESOLVED") return disposition;
  return resolved(
    disposition.value === null,
    [...existence.provenance, ...disposition.provenance],
  );
}

function waitingAtQuery(
  dataset: OperationalAuthorityDataset,
  actionId: string,
  query: OperationalQuery,
): Resolution<boolean> {
  const action = actionRecord(dataset, actionId);
  if (!action) return unresolved("MISSING_AUTHORITY", "UNAVAILABLE", []);
  const open = isOpenAtQuery(dataset, actionId, query);
  if (open.status === "UNRESOLVED" || !open.value) return open;

  const earliest = currentFact(
    factsFor(dataset, action.matterId, actionId, "ACTION_EARLIEST"),
    query,
  );
  if (earliest.status === "UNRESOLVED") return earliest;
  if (earliest.value !== null) {
    const earliestValue = earliest.value.value;
    if (typeof earliestValue !== "string") {
      return unresolved("INVALID_TEMPORAL_DATA", "INVALID", earliest.provenance);
    }
    const earliestInstant = parseInstant(earliestValue);
    const effectiveAt = parseInstant(query.effectiveAt);
    if (earliestInstant === null || effectiveAt === null) {
      return unresolved("INVALID_TEMPORAL_DATA", "INVALID", earliest.provenance);
    }
    if (earliestInstant > effectiveAt) {
      return resolved(true, [...open.provenance, ...earliest.provenance]);
    }
  }

  const dependencies = currentFactsByGroup(
    factsFor(dataset, action.matterId, actionId, "ACTION_DEPENDENCY"),
    query,
  );
  if (dependencies.status === "UNRESOLVED") return dependencies;
  const isWaiting = dependencies.value.some((fact) =>
    fact.kind === "ACTION_DEPENDENCY" && fact.value.status === "WAITING");
  return resolved(
    isWaiting,
    [...open.provenance, ...earliest.provenance, ...dependencies.provenance],
  );
}

function actionableAtQuery(
  dataset: OperationalAuthorityDataset,
  actionId: string,
  query: OperationalQuery,
): Resolution<boolean> {
  const action = actionRecord(dataset, actionId);
  if (!action) return unresolved("MISSING_AUTHORITY", "UNAVAILABLE", []);
  const open = isOpenAtQuery(dataset, actionId, query);
  if (open.status === "UNRESOLVED" || !open.value) return open;

  const assignment = currentFact(
    factsFor(dataset, action.matterId, actionId, "ACTION_ASSIGNMENT"),
    query,
  );
  if (assignment.status === "UNRESOLVED") return assignment;
  if (assignment.value === null) {
    return unresolved("MISSING_AUTHORITY", "UNAVAILABLE", open.provenance);
  }
  if (assignment.value.kind !== "ACTION_ASSIGNMENT" || !assignment.value.value) {
    return resolved(false, [...open.provenance, ...assignment.provenance]);
  }

  const waiting = waitingAtQuery(dataset, actionId, query);
  if (waiting.status === "UNRESOLVED") return waiting;
  return resolved(
    !waiting.value,
    [...open.provenance, ...assignment.provenance, ...waiting.provenance],
  );
}

function dueAtQuery(
  dataset: OperationalAuthorityDataset,
  actionId: string,
  query: OperationalQuery,
): Resolution<GoverningDue> {
  const action = actionRecord(dataset, actionId);
  if (!action) return unresolved("MISSING_AUTHORITY", "UNAVAILABLE", []);
  const boundary = boundaryResult(dataset, action.matterId);
  if (boundary.status === "UNRESOLVED") return boundary;

  const dueFacts = currentFactsByGroup(
    factsFor(dataset, action.matterId, actionId, "ACTION_DUE"),
    query,
  );
  if (dueFacts.status === "UNRESOLVED") return dueFacts;
  const noDue = currentFact(
    factsFor(dataset, action.matterId, actionId, "ACTION_NO_DUE"),
    query,
  );
  if (noDue.status === "UNRESOLVED") return noDue;

  const governing = dueFacts.value.filter((fact) =>
    fact.kind === "ACTION_DUE" && fact.value.governing);
  if (governing.length > 0 && noDue.value !== null) {
    return unresolved(
      "CONFLICTING_AUTHORITY",
      "INVALID",
      [...dueFacts.provenance, ...noDue.provenance],
    );
  }
  if (governing.length === 0) {
    if (noDue.value !== null) {
      return resolved(
        { classification: "NO_DUE", ruleId: "VOC1_AUTHORITATIVE_NO_DUE" },
        noDue.provenance,
      );
    }
    return unresolved("MISSING_AUTHORITY", "UNAVAILABLE", dueFacts.provenance);
  }
  if (governing.length !== 1) {
    return unresolved("CONFLICTING_AUTHORITY", "INVALID", governing);
  }

  const fact = governing[0];
  if (fact.kind !== "ACTION_DUE") {
    return unresolved("MISSING_AUTHORITY", "INVALID", governing);
  }
  if (fact.value.dueKind !== "LEGAL_EXTERNAL" && fact.value.dueKind !== "INTERNAL") {
    return unresolved("CONFLICTING_AUTHORITY", "INVALID", [fact]);
  }

  let dueInstant: string | null;
  if (fact.value.temporal.type === "DATETIME") {
    dueInstant = canonicalInstant(fact.value.temporal.value);
  } else {
    if (!fact.value.temporal.timezone) {
      return unresolved("MISSING_TIMEZONE", "UNAVAILABLE", [fact]);
    }
    dueInstant = resolveDateOnlyDueInstant(
      fact.value.temporal.value,
      fact.value.temporal.timezone,
    );
  }
  if (dueInstant === null) {
    return unresolved("INVALID_TEMPORAL_DATA", "INVALID", [fact]);
  }
  return resolved(
    {
      classification: "RESOLVED",
      dueKind: fact.value.dueKind,
      dueInstant,
      candidateId: fact.value.candidateId,
      ruleId: "VOC1_GOVERNING_CONFIRMED_DEADLINE",
    },
    [fact],
  );
}

function overdueAtQuery(
  dataset: OperationalAuthorityDataset,
  actionId: string,
  query: OperationalQuery,
): Resolution<OverdueClassification> {
  const open = isOpenAtQuery(dataset, actionId, query);
  if (open.status === "UNRESOLVED") return open;
  if (!open.value) return resolved("NOT_OVERDUE", open.provenance);

  const due = dueAtQuery(dataset, actionId, query);
  if (due.status === "UNRESOLVED") return due;
  if (due.value.classification === "NO_DUE") {
    return resolved("NOT_CLASSIFIABLE_NO_DUE", [...open.provenance, ...due.provenance]);
  }
  const effectiveAt = parseInstant(query.effectiveAt);
  const dueInstant = parseInstant(due.value.dueInstant);
  if (effectiveAt === null || dueInstant === null) {
    return unresolved("INVALID_TEMPORAL_DATA", "INVALID", due.provenance);
  }
  return resolved(
    effectiveAt >= dueInstant ? "OVERDUE" : "NOT_OVERDUE",
    [...open.provenance, ...due.provenance],
  );
}

function existential(
  values: readonly Resolution<boolean>[],
): Resolution<boolean> {
  const positive = values.filter((value) => value.status === "RESOLVED" && value.value);
  if (positive.length > 0) {
    return resolved(true, positive.flatMap((value) => value.provenance));
  }
  const failure = mergeUnresolved<boolean>(values);
  if (failure) return failure;
  return resolved(false, values.flatMap((value) => value.provenance));
}

function activeAtQuery(
  dataset: OperationalAuthorityDataset,
  matterId: string,
  query: OperationalQuery,
): Resolution<boolean> {
  const boundary = boundaryResult(dataset, matterId);
  if (boundary.status === "UNRESOLVED") return boundary;
  const engagement = currentFact(factsFor(dataset, matterId, matterId, "ENGAGEMENT_STATE"), query);
  if (engagement.status === "UNRESOLVED") return engagement;
  if (engagement.value === null || engagement.value.kind !== "ENGAGEMENT_STATE") {
    return unresolved("MISSING_AUTHORITY", "UNAVAILABLE", engagement.provenance);
  }

  const actionContinuation = actionIdsForMatter(dataset, matterId)
    .map((actionId) => isOpenAtQuery(dataset, actionId, query));
  const monitoring = currentFact(factsFor(dataset, matterId, matterId, "MONITORING_REQUIRED"), query);
  const expectedEvent = currentFact(factsFor(dataset, matterId, matterId, "EXPECTED_EVENT_PENDING"), query);
  const directFailures = mergeUnresolved<boolean>([monitoring, expectedEvent]);

  const directContinuation = [monitoring, expectedEvent].some((result) =>
    result.status === "RESOLVED" && result.value !== null && result.value.value === true);
  const openAction = actionContinuation.some((result) => result.status === "RESOLVED" && result.value);
  const unknownAction = mergeUnresolved<boolean>(actionContinuation);
  const provenance = [
    ...engagement.provenance,
    ...monitoring.provenance,
    ...expectedEvent.provenance,
    ...actionContinuation.flatMap((result) => result.provenance),
  ];

  if (engagement.value.value === "ENDED") {
    if (directContinuation || openAction) {
      return unresolved("CONFLICTING_AUTHORITY", "INVALID", provenance);
    }
    if (directFailures || unknownAction) return directFailures ?? unknownAction as Resolution<boolean>;
    return resolved(false, provenance);
  }
  if (directContinuation || openAction) return resolved(true, provenance);
  if (directFailures || unknownAction) return directFailures ?? unknownAction as Resolution<boolean>;
  return unresolved("MISSING_AUTHORITY", "UNAVAILABLE", provenance);
}

function projectMatterAtQuery(
  dataset: OperationalAuthorityDataset,
  matterId: string,
  query: OperationalQuery,
): MatterOperationalProjection {
  const actions: LegalActionProjection[] = actionIdsForMatter(dataset, matterId).map((actionId) => ({
    actionId,
    open: isOpenAtQuery(dataset, actionId, query),
    actionable: actionableAtQuery(dataset, actionId, query),
    waiting: waitingAtQuery(dataset, actionId, query),
    governingDue: dueAtQuery(dataset, actionId, query),
    overdue: overdueAtQuery(dataset, actionId, query),
  }));
  const hasActionableWork = existential(actions.map((action) => action.actionable));
  const waiting = existential(actions.map((action) => action.waiting));
  const hasOverdueWork = existential(actions.map((action) => {
    if (action.overdue.status === "UNRESOLVED") return action.overdue;
    return resolved(action.overdue.value === "OVERDUE", action.overdue.provenance);
  }));
  return {
    matterId,
    query,
    active: activeAtQuery(dataset, matterId, query),
    hasActionableWork,
    waiting,
    hasOverdueWork,
    nextActionableStepAvailable: hasActionableWork,
    actions,
  };
}

export function countsAsActiveMatterAsOf(
  dataset: OperationalAuthorityDataset,
  matterId: string,
  at: string,
): Resolution<boolean> {
  return activeAtQuery(dataset, matterId, operationalQuery(at));
}

export function isOpenLegalActionAsOf(
  dataset: OperationalAuthorityDataset,
  actionId: string,
  at: string,
): Resolution<boolean> {
  return isOpenAtQuery(dataset, actionId, operationalQuery(at));
}

export function isActionableLegalActionAsOf(
  dataset: OperationalAuthorityDataset,
  actionId: string,
  at: string,
): Resolution<boolean> {
  return actionableAtQuery(dataset, actionId, operationalQuery(at));
}

export function isWaitingLegalActionAsOf(
  dataset: OperationalAuthorityDataset,
  actionId: string,
  at: string,
): Resolution<boolean> {
  return waitingAtQuery(dataset, actionId, operationalQuery(at));
}

export function resolveGoverningDueInstantAsOf(
  dataset: OperationalAuthorityDataset,
  actionId: string,
  at: string,
): Resolution<GoverningDue> {
  return dueAtQuery(dataset, actionId, operationalQuery(at));
}

export function isOverdueLegalActionAsOf(
  dataset: OperationalAuthorityDataset,
  actionId: string,
  at: string,
): Resolution<OverdueClassification> {
  return overdueAtQuery(dataset, actionId, operationalQuery(at));
}

export function operationalAsOf(
  dataset: OperationalAuthorityDataset,
  matterId: string,
  at: string,
): MatterOperationalProjection {
  return projectMatterAtQuery(dataset, matterId, operationalQuery(at));
}

export function reconstructOperationalEffectiveAt(
  dataset: OperationalAuthorityDataset,
  matterId: string,
  effectiveAt: string,
  knowledgeCutoff: string,
  recordedCutoff: string,
): MatterOperationalProjection {
  return projectMatterAtQuery(dataset, matterId, {
    effectiveAt,
    knowledgeCutoff,
    recordedCutoff,
  });
}

function countResolved(
  metricId: OperationalMetricId,
  values: readonly Resolution<boolean>[],
): OperationalMetricResult {
  const failure = mergeUnresolved<number>(values);
  if (failure) return { metricId, value: failure };
  return {
    metricId,
    value: resolved(
      values.filter((value) => value.status === "RESOLVED" && value.value).length,
      values.flatMap((value) => value.provenance),
    ),
  };
}

export function deriveOperationalMetrics(
  dataset: OperationalAuthorityDataset,
  evaluatedAt: string,
): OperationalMetricsProjection {
  const matters = [...dataset.matterIds]
    .sort(compareText)
    .map((matterId) => operationalAsOf(dataset, matterId, evaluatedAt));
  const active = matters.map((matter) => matter.active);

  const activeActionable = matters.map((matter) => {
    if (matter.active.status === "UNRESOLVED") return matter.active;
    if (!matter.active.value) return resolved(false, matter.active.provenance);
    return matter.hasActionableWork;
  });
  const activeWaiting = matters.map((matter) => {
    if (matter.active.status === "UNRESOLVED") return matter.active;
    if (!matter.active.value) return resolved(false, matter.active.provenance);
    return matter.waiting;
  });
  const activeWithoutNext = matters.map((matter) => {
    if (matter.active.status === "UNRESOLVED") return matter.active;
    if (!matter.active.value) return resolved(false, matter.active.provenance);
    if (matter.hasActionableWork.status === "UNRESOLVED") return matter.hasActionableWork;
    return resolved(!matter.hasActionableWork.value, matter.hasActionableWork.provenance);
  });
  const actions = matters.flatMap((matter) => matter.actions);
  const open = actions.map((action) => action.open);
  const actionable = actions.map((action) => action.actionable);
  const overdue = actions.map((action) => {
    if (action.overdue.status === "UNRESOLVED") return action.overdue;
    return resolved(action.overdue.value === "OVERDUE", action.overdue.provenance);
  });

  return {
    portfolioId: dataset.portfolioId,
    evaluatedAt,
    rulesVersion: MVS1_RULES_VERSION,
    matters,
    metrics: [
      countResolved("activeMatterCount", active),
      countResolved("mattersWithActionableWorkCount", activeActionable),
      countResolved("waitingMatterCount", activeWaiting),
      countResolved("openLegalActionCount", open),
      countResolved("actionableLegalActionCount", actionable),
      countResolved("overdueLegalActionCount", overdue),
      countResolved("mattersWithoutNextActionableStepCount", activeWithoutNext),
    ],
  };
}
