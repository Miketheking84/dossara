export interface HistoryRecord {
  eventId: string;
  eventType: string;
  transactionId?: string;
  recordedAt: string;
  payload: unknown;
}

export interface HistorySegment {
  segmentId: string;
  sealed: boolean;
  records: readonly HistoryRecord[];
}

export function validateHistorySegment(segment: HistorySegment): string[] {
  const findings: string[] = [];
  const ids = new Set<string>();
  for (const record of segment.records) {
    if (ids.has(record.eventId)) findings.push(`DUPLICATE_EVENT_ID:${record.eventId}`);
    ids.add(record.eventId);
    if (Number.isNaN(Date.parse(record.recordedAt))) findings.push(`INVALID_RECORDED_AT:${record.eventId}`);
  }
  if (!segment.sealed) findings.push("UNSEALED_SEGMENT");
  return findings;
}

export type RecoveryFinding =
  | "RECONCILED_APPLIED"
  | "RECONCILED_NOT_APPLIED"
  | "RECOVERY_REQUIRED";

export interface RecoveryEvidence {
  attempted: boolean;
  resultingRevisionIds: readonly string[];
  receiptSaysApplied: boolean;
  receiptSaysNotApplied: boolean;
  contradictoryEvidence: boolean;
}

export function determineRecoveryFinding(evidence: RecoveryEvidence): RecoveryFinding {
  if (!evidence.attempted) return "RECONCILED_NOT_APPLIED";
  if (evidence.contradictoryEvidence) return "RECOVERY_REQUIRED";
  if (evidence.receiptSaysApplied && evidence.resultingRevisionIds.length > 0) return "RECONCILED_APPLIED";
  if (evidence.receiptSaysNotApplied && evidence.resultingRevisionIds.length === 0) return "RECONCILED_NOT_APPLIED";
  return "RECOVERY_REQUIRED";
}

export function retryAllowed(finding: RecoveryFinding): boolean {
  return finding === "RECONCILED_NOT_APPLIED";
}
