export type Support = "SUPPORTED" | "UNSUPPORTED_VERSION" | "UNKNOWN_TYPE";

export interface TypeRegistration {
  objectType: string;
  schemaVersions: readonly string[];
}

export interface TypeRegistry {
  version: string;
  types: readonly TypeRegistration[];
  referenceTypes: Readonly<Record<string, readonly string[]>>;
}

export interface TypedReference {
  referenceType: string;
  targetObjectType: string;
  targetObjectId: string;
  targetRevisionId?: string;
  matterId?: string;
  required: boolean;
}

export interface CanonicalEnvelope {
  recordFormat: string;
  schemaId: string;
  schemaVersion: string;
  objectType: string;
  objectId: string;
  revisionId: string;
  revisionOf: string;
  matterId?: string;
  recordedAt: string;
  createdBy: string;
  generatorType: "MANUAL" | "SYSTEM" | "AI" | "IMPORT";
  payload: unknown;
  references: readonly TypedReference[];
  extensions?: Readonly<Record<string, unknown>>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export interface ContractFinding {
  code: string;
  path: string;
  message: string;
}

export function classifySupport(
  registry: TypeRegistry,
  objectType: string,
  schemaVersion: string,
): Support {
  const registration = registry.types.find((entry) => entry.objectType === objectType);
  if (!registration) return "UNKNOWN_TYPE";
  return registration.schemaVersions.includes(schemaVersion) ? "SUPPORTED" : "UNSUPPORTED_VERSION";
}

export function validateEnvelope(
  value: unknown,
  registry: TypeRegistry,
): ContractFinding[] {
  const findings: ContractFinding[] = [];
  if (!isRecord(value)) {
    return [{ code: "INVALID_ENVELOPE", path: "$", message: "Envelope must be an object" }];
  }
  const envelope = value as unknown as CanonicalEnvelope;
  const requiredStrings: Array<keyof CanonicalEnvelope> = [
    "recordFormat", "schemaId", "schemaVersion", "objectType", "objectId", "revisionId",
    "revisionOf", "recordedAt", "createdBy", "generatorType",
  ];
  for (const key of requiredStrings) {
    if (typeof envelope[key] !== "string" || envelope[key] === "") {
      findings.push({ code: "REQUIRED_STRING", path: String(key), message: `${String(key)} is required` });
    }
  }
  if (typeof envelope.objectId === "string" && envelope.revisionOf !== envelope.objectId) {
    findings.push({ code: "REVISION_IDENTITY_MISMATCH", path: "revisionOf", message: "revisionOf must equal objectId" });
  }
  if (typeof envelope.recordedAt !== "string" || Number.isNaN(Date.parse(envelope.recordedAt)) || new Date(envelope.recordedAt).toISOString() !== envelope.recordedAt) {
    findings.push({ code: "INVALID_TIMESTAMP", path: "recordedAt", message: "recordedAt must be a canonical ISO timestamp" });
  }
  const support = typeof envelope.objectType === "string" && typeof envelope.schemaVersion === "string"
    ? classifySupport(registry, envelope.objectType, envelope.schemaVersion)
    : undefined;
  if (support && support !== "SUPPORTED") {
    findings.push({ code: support, path: "objectType", message: `${envelope.objectType}@${envelope.schemaVersion} is ${support}` });
  }
  if (!Array.isArray(envelope.references)) {
    findings.push({ code: "INVALID_REFERENCES", path: "references", message: "references must be an array" });
    return findings;
  }
  envelope.references.forEach((reference, index) => {
    if (!isRecord(reference)) {
      findings.push({ code: "INVALID_REFERENCE", path: `references[${index}]`, message: "Reference must be an object" });
      return;
    }
    findings.push(...validateReference(reference as unknown as TypedReference, registry).map((finding) => ({
      ...finding,
      path: `references[${index}].${finding.path}`,
    })));
  });
  return findings;
}

export function validateReference(reference: TypedReference, registry: TypeRegistry): ContractFinding[] {
  const findings: ContractFinding[] = [];
  if (!registry.referenceTypes[reference.referenceType]) {
    findings.push({ code: "UNKNOWN_REFERENCE_TYPE", path: "referenceType", message: "Reference type is not registered" });
    return findings;
  }
  const allowedTargets = registry.referenceTypes[reference.referenceType];
  if (!allowedTargets.includes(reference.targetObjectType)) {
    findings.push({ code: "TARGET_TYPE_MISMATCH", path: "targetObjectType", message: "Target type is not allowed" });
  }
  if (!reference.targetObjectId) {
    findings.push({ code: "MISSING_TARGET_ID", path: "targetObjectId", message: "Target object identity is required" });
  }
  if (reference.referenceType.endsWith("_REVISION") && !reference.targetRevisionId) {
    findings.push({ code: "MISSING_EXACT_REVISION", path: "targetRevisionId", message: "Content-bound reference requires exact revision" });
  }
  return findings;
}
