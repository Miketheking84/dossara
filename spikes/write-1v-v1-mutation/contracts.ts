import type { CanonicalEnvelope, TypeRegistry } from "../foundation-hardening/contracts";

export const WRITE1E_SCHEMA_VERSION = "write-1e/1";

export const WRITE1E_REGISTRY: TypeRegistry = {
  version: "write-1e-registry/1",
  types: [
    { objectType: "MATTER_CONTROL", schemaVersions: [WRITE1E_SCHEMA_VERSION] },
    { objectType: "MATTER_CONTROL_MUTATION_ATTEMPT", schemaVersions: [WRITE1E_SCHEMA_VERSION] },
    { objectType: "MATTER_CONTROL_MUTATION_OUTCOME", schemaVersions: [WRITE1E_SCHEMA_VERSION] },
    { objectType: "MATTER_CONTROL_MUTATION_RECEIPT", schemaVersions: [WRITE1E_SCHEMA_VERSION] },
  ],
  referenceTypes: {
    PREVIOUS_MATTER_CONTROL_REVISION: ["MATTER_CONTROL"],
    PREPARED_MATTER_CONTROL_REVISION: ["MATTER_CONTROL"],
    MUTATION_ATTEMPT: ["MATTER_CONTROL_MUTATION_ATTEMPT"],
  },
};

export type MutableMatterField = "matterType" | "nextStep";

export interface FieldMutation {
  field: MutableMatterField;
  value: string;
}

export type FailurePoint =
  | "TEMP_CREATE"
  | "TEMP_WRITE"
  | "TEMP_SYNC"
  | "PUBLICATION"
  | "FINAL_REREAD_MISMATCH"
  | "RECEIPT_WRITE"
  | "DERIVED_UPDATE";

export interface BaselineRequest {
  workspaceRoot: string;
  canonicalRelativePath: string;
  matterId: string;
  transactionId: string;
  revisionId: string;
  actor: string;
  source: string;
  recordedAt: string;
}

export interface MutationRequest {
  workspaceRoot: string;
  canonicalRelativePath: string;
  matterId: string;
  transactionId: string;
  resultingRevisionId: string;
  acceptedRevisionId: string;
  expectedReadToken: string;
  actor: string;
  source: string;
  recordedAt: string;
  mutations: readonly FieldMutation[];
}

export type MutationCode =
  | "CANONICAL_SUCCESS"
  | "CANONICAL_SUCCESS_DERIVED_REBUILD_REQUIRED"
  | "CONFLICT"
  | "EXTERNAL_BASELINE_REVIEW_REQUIRED"
  | "VALIDATION_FAILED"
  | "IO_FAILED"
  | "RECOVERY_REQUIRED";

export interface MutationResult {
  code: MutationCode;
  transactionId: string;
  previousReadToken?: string;
  resultingReadToken?: string;
  preparedRevisionId?: string;
  currentRevisionId?: string;
  detail?: string;
}

export type EvidenceState = "ACCEPTED_BASELINE" | "PREPARED";

export interface MatterControlPayload {
  state: EvidenceState;
  matterId: string;
  transactionId: string;
  canonicalRelativePath: string;
  previousReadToken: string | null;
  resultingReadToken: string;
  changedFields: readonly MutableMatterField[];
  contentEncoding: "base64";
  exactContentBase64: string;
  source: string;
}

export interface AttemptPayload {
  state: "ATTEMPTED";
  transactionId: string;
  matterId: string;
  canonicalRelativePath: string;
  expectedReadToken: string;
  acceptedRevisionId: string;
  requestedMutations: readonly FieldMutation[];
  source: string;
}

export interface OutcomePayload {
  state: "TERMINAL";
  transactionId: string;
  code: MutationCode;
  canonicalRelativePath: string;
  observedReadToken?: string;
  detail: string;
}

export interface ReceiptPayload {
  state: "SUCCESS" | "BASELINE_ACCEPTED";
  transactionId: string;
  matterId: string;
  canonicalRelativePath: string;
  previousRevisionId: string | null;
  currentRevisionId: string;
  previousReadToken: string | null;
  resultingVerifiedReadToken: string;
  changedFields: readonly MutableMatterField[];
  publicationVerified: true;
  derivedState: "PENDING" | "VALID";
  source: string;
}

export type Write1eEnvelope = CanonicalEnvelope & {
  objectType:
    | "MATTER_CONTROL"
    | "MATTER_CONTROL_MUTATION_ATTEMPT"
    | "MATTER_CONTROL_MUTATION_OUTCOME"
    | "MATTER_CONTROL_MUTATION_RECEIPT";
};

export interface CurrentMatterControl {
  revisionId: string;
  readToken: string;
  receiptRevisionId: string;
}

export type RecoveryCode =
  | "NO_EVIDENCE"
  | "ORPHAN_TEMP_NOT_PUBLISHED"
  | "COMMITTED"
  | "PREPARED_NOT_CURRENT"
  | "RECOVERY_REQUIRED";

export interface RecoveryResult {
  code: RecoveryCode;
  canonicalReadToken?: string;
  currentRevisionId?: string;
  orphanTemps: readonly string[];
  detail: string;
}
