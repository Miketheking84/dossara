export interface DependencyFrontier {
  frontierId: string;
  registryVersion: string;
  rulesVersion: string;
  schemaSetVersion: string;
  matterId: string;
  heads: Readonly<Record<string, string>>;
  unsupportedInputs: readonly string[];
  validatedAt: string;
}

export interface ObservedAuthority {
  registryVersion: string;
  rulesVersion: string;
  schemaSetVersion: string;
  matterId: string;
  heads: Readonly<Record<string, string>>;
  unsupportedInputs: readonly string[];
}

export type FrontierStatus = "CURRENT" | "STALE" | "INCOMPLETE" | "INVALID";

export interface FrontierAssessment {
  status: FrontierStatus;
  reasons: readonly string[];
}

export function assessFrontier(frontier: DependencyFrontier, observed: ObservedAuthority): FrontierAssessment {
  const invalid: string[] = [];
  const stale: string[] = [];
  const incomplete: string[] = [];

  if (frontier.matterId !== observed.matterId) invalid.push("MATTER_MISMATCH");
  if (frontier.registryVersion !== observed.registryVersion) stale.push("REGISTRY_VERSION_CHANGED");
  if (frontier.rulesVersion !== observed.rulesVersion) stale.push("RULES_VERSION_CHANGED");
  if (frontier.schemaSetVersion !== observed.schemaSetVersion) stale.push("SCHEMA_SET_CHANGED");

  for (const [dependency, exactRevision] of Object.entries(frontier.heads)) {
    if (!(dependency in observed.heads)) invalid.push(`MISSING_DIRECT_DEPENDENCY:${dependency}`);
    else if (observed.heads[dependency] !== exactRevision) stale.push(`DIRECT_DEPENDENCY_CHANGED:${dependency}`);
  }
  const unsupported = new Set([...frontier.unsupportedInputs, ...observed.unsupportedInputs]);
  for (const input of unsupported) incomplete.push(`UNSUPPORTED_INPUT:${input}`);

  if (invalid.length) return { status: "INVALID", reasons: invalid };
  if (incomplete.length) return { status: "INCOMPLETE", reasons: incomplete };
  if (stale.length) return { status: "STALE", reasons: stale };
  return { status: "CURRENT", reasons: [] };
}
