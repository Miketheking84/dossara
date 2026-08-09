import type { CanonicalEnvelope } from "./contracts";
import type { DependencyFrontier, FrontierAssessment } from "./dependency-frontier";

export interface MatterProjection {
  matterId: string;
  frontierId: string;
  status: FrontierAssessment["status"];
  currentObjectRevisions: Readonly<Record<string, string>>;
  unsupportedObjectIds: readonly string[];
}

export function rebuildMatterState(
  matterId: string,
  records: readonly CanonicalEnvelope[],
  frontier: DependencyFrontier,
  assessment: FrontierAssessment,
  supportedObjectTypes: ReadonlySet<string>,
): MatterProjection {
  const currentObjectRevisions: Record<string, string> = {};
  const unsupportedObjectIds: string[] = [];

  for (const record of records) {
    if (record.matterId !== matterId) continue;
    if (!supportedObjectTypes.has(record.objectType)) {
      unsupportedObjectIds.push(record.objectId);
      continue;
    }
    currentObjectRevisions[record.objectId] = record.revisionId;
  }

  const status = unsupportedObjectIds.length > 0 && assessment.status === "CURRENT"
    ? "INCOMPLETE"
    : assessment.status;

  return {
    matterId,
    frontierId: frontier.frontierId,
    status,
    currentObjectRevisions,
    unsupportedObjectIds: unsupportedObjectIds.sort(),
  };
}

export function rebuildDisposableIndex(projection: MatterProjection): Map<string, string> {
  return new Map(Object.entries(projection.currentObjectRevisions));
}
