export type ReconciliationDecision = "ACCEPT" | "REJECT" | "RESOLVE";

export interface ReconciliationInput {
  objectId: string;
  acceptedRevisionId: string;
  acceptedCanonicalJson: string;
  observedCanonicalJson: string;
  decision?: ReconciliationDecision;
}

export interface ReconciliationResult {
  status: "NO_CHANGE" | "RECONCILIATION_REQUIRED" | "NEW_REVISION_REQUIRED" | "OBSERVATION_REJECTED" | "RESOLUTION_REQUIRED";
  projectionCurrent: boolean;
  controlledApplyAllowed: boolean;
}

export function reconcile(input: ReconciliationInput): ReconciliationResult {
  if (input.acceptedCanonicalJson === input.observedCanonicalJson) {
    return { status: "NO_CHANGE", projectionCurrent: true, controlledApplyAllowed: true };
  }
  if (!input.decision) {
    return { status: "RECONCILIATION_REQUIRED", projectionCurrent: false, controlledApplyAllowed: false };
  }
  if (input.decision === "ACCEPT") {
    return { status: "NEW_REVISION_REQUIRED", projectionCurrent: false, controlledApplyAllowed: false };
  }
  if (input.decision === "REJECT") {
    return { status: "OBSERVATION_REJECTED", projectionCurrent: true, controlledApplyAllowed: true };
  }
  return { status: "RESOLUTION_REQUIRED", projectionCurrent: false, controlledApplyAllowed: false };
}
