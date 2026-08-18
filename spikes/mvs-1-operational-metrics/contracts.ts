import type {
  DependencyFrontier,
  ObservedAuthority,
} from "../foundation-hardening/dependency-frontier";

export type ResolutionSeverity = "UNAVAILABLE" | "INVALID";

export type UnresolvedReason =
  | "CONFLICTING_AUTHORITY"
  | "INVALID_TEMPORAL_DATA"
  | "MISSING_TIMEZONE"
  | "AMBIGUOUS_SUPERSESSION"
  | "MISSING_AUTHORITY"
  | "FRONTIER_STALE"
  | "FRONTIER_INCOMPLETE"
  | "FRONTIER_INVALID";

export interface AuthorityReference {
  recordId: string;
  revisionId: string;
}

export type Resolution<T> =
  | {
      status: "RESOLVED";
      value: T;
      provenance: readonly AuthorityReference[];
    }
  | {
      status: "UNRESOLVED";
      reason: UnresolvedReason;
      severity: ResolutionSeverity;
      provenance: readonly AuthorityReference[];
    };

export const MVS1_RULES_VERSION = "voc-1/v1";
export const MVS1_REGISTRY_VERSION = "mvs-1-registry/1";
export const MVS1_SCHEMA_SET_VERSION = "mvs-1-schemas/1";

export type WaitingActor =
  | "CLIENT"
  | "OTHER_SIDE"
  | "COURT_OR_AUTHORITY"
  | "THIRD_PARTY"
  | "FUTURE_DATE"
  | "OTHER_ACTION_OR_EVENT";

export type DueKind = "LEGAL_EXTERNAL" | "INTERNAL" | "TARGET" | "EVENT";

export type DueTemporalValue =
  | { type: "DATETIME"; value: string }
  | { type: "DATE"; value: string; timezone?: string };

interface FactBase extends AuthorityReference {
  eventId: string;
  matterId: string;
  subjectId: string;
  knownAt: string;
  recordedAt: string;
  effectiveFrom: string;
  supersedes?: readonly string[];
}

export type OperationalFact =
  | (FactBase & { kind: "ENGAGEMENT_STATE"; value: "OPEN" | "ENDED" })
  | (FactBase & { kind: "MONITORING_REQUIRED"; value: boolean })
  | (FactBase & { kind: "EXPECTED_EVENT_PENDING"; value: boolean })
  | (FactBase & { kind: "ACTION_EXISTENCE"; value: "APPLIED" })
  | (FactBase & { kind: "ACTION_ASSIGNMENT"; value: boolean })
  | (FactBase & {
      kind: "ACTION_DISPOSITION";
      value: "COMPLETED" | "CANCELLED" | "SUPERSEDED";
    })
  | (FactBase & {
      kind: "ACTION_DEPENDENCY";
      value: {
        dependencyId: string;
        actor: WaitingActor;
        status: "WAITING" | "SATISFIED";
      };
    })
  | (FactBase & { kind: "ACTION_EARLIEST"; value: string })
  | (FactBase & {
      kind: "ACTION_DUE";
      value: {
        candidateId: string;
        dueKind: DueKind;
        governing: boolean;
        temporal: DueTemporalValue;
      };
    })
  | (FactBase & { kind: "ACTION_NO_DUE"; value: true });

export interface LegalActionRecord {
  actionId: string;
  matterId: string;
  revisionId: string;
  recordedAt: string;
}

export interface MatterAuthorityBoundary {
  frontier: DependencyFrontier;
  observed: ObservedAuthority;
}

export interface OperationalAuthorityDataset {
  portfolioId: string;
  matterIds: readonly string[];
  actions: readonly LegalActionRecord[];
  facts: readonly OperationalFact[];
  boundaries: Readonly<Record<string, MatterAuthorityBoundary>>;
}

export interface OperationalQuery {
  effectiveAt: string;
  knowledgeCutoff: string;
  recordedCutoff: string;
}

export type GoverningDue =
  | {
      classification: "RESOLVED";
      dueKind: "LEGAL_EXTERNAL" | "INTERNAL";
      dueInstant: string;
      candidateId: string;
      ruleId: "VOC1_GOVERNING_CONFIRMED_DEADLINE";
    }
  | {
      classification: "NO_DUE";
      ruleId: "VOC1_AUTHORITATIVE_NO_DUE";
    };

export type OverdueClassification =
  | "OVERDUE"
  | "NOT_OVERDUE"
  | "NOT_CLASSIFIABLE_NO_DUE";

export interface LegalActionProjection {
  actionId: string;
  open: Resolution<boolean>;
  actionable: Resolution<boolean>;
  waiting: Resolution<boolean>;
  governingDue: Resolution<GoverningDue>;
  overdue: Resolution<OverdueClassification>;
}

export interface MatterOperationalProjection {
  matterId: string;
  query: OperationalQuery;
  active: Resolution<boolean>;
  hasActionableWork: Resolution<boolean>;
  waiting: Resolution<boolean>;
  hasOverdueWork: Resolution<boolean>;
  nextActionableStepAvailable: Resolution<boolean>;
  actions: readonly LegalActionProjection[];
}

export type OperationalMetricId =
  | "activeMatterCount"
  | "mattersWithActionableWorkCount"
  | "waitingMatterCount"
  | "openLegalActionCount"
  | "actionableLegalActionCount"
  | "overdueLegalActionCount"
  | "mattersWithoutNextActionableStepCount";

export interface OperationalMetricResult {
  metricId: OperationalMetricId;
  value: Resolution<number>;
}

export interface OperationalMetricsProjection {
  portfolioId: string;
  evaluatedAt: string;
  rulesVersion: typeof MVS1_RULES_VERSION;
  matters: readonly MatterOperationalProjection[];
  metrics: readonly OperationalMetricResult[];
}

export interface PersistedDatasetManifest {
  portfolioId: string;
  matterIds: readonly string[];
  actionRevisionPaths: readonly string[];
  historyPath: string;
  boundaries: Readonly<Record<string, MatterAuthorityBoundary>>;
}
