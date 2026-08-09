import { describe, expect, it } from "vitest";
import { canonicalJson, CanonicalJsonError, parseJsonStrict } from "./canonical-json";
import { classifySupport, validateEnvelope, validateReference, type CanonicalEnvelope, type TypeRegistry } from "./contracts";
import { assessFrontier, type DependencyFrontier, type ObservedAuthority } from "./dependency-frontier";
import { reconcile } from "./reconciliation";

const registry: TypeRegistry = {
  version: "registry-1",
  types: [{ objectType: "MATTER_ASSERTION", schemaVersions: ["1"] }],
  referenceTypes: { SUBJECT_REVISION: ["MATTER_ASSERTION"] },
};

const envelope: CanonicalEnvelope = {
  recordFormat: "dossara-record/1",
  schemaId: "matter-assertion",
  schemaVersion: "1",
  objectType: "MATTER_ASSERTION",
  objectId: "object-1",
  revisionId: "revision-1",
  revisionOf: "object-1",
  matterId: "matter-1",
  recordedAt: "2026-08-09T10:00:00.000Z",
  createdBy: "actor-1",
  generatorType: "MANUAL",
  payload: { text: "Činjenica" },
  references: [],
};

const frontier: DependencyFrontier = {
  frontierId: "frontier-1",
  registryVersion: "registry-1",
  rulesVersion: "rules-1",
  schemaSetVersion: "schemas-1",
  matterId: "matter-1",
  heads: { "object-1": "revision-1" },
  unsupportedInputs: [],
  validatedAt: "2026-08-09T10:00:00.000Z",
};

const observed: ObservedAuthority = {
  registryVersion: "registry-1",
  rulesVersion: "rules-1",
  schemaSetVersion: "schemas-1",
  matterId: "matter-1",
  heads: { "object-1": "revision-1" },
  unsupportedInputs: [],
};

describe("canonical serialization", () => {
  it("is deterministic, NFC-normalized and newline-terminated", () => {
    expect(canonicalJson({ z: "e\u0301", a: 1 })).toBe('{"a":1,"z":"é"}\n');
  });

  it("rejects unsafe values and duplicate JSON keys", () => {
    expect(() => canonicalJson({ value: Number.NaN })).toThrow(CanonicalJsonError);
    expect(() => parseJsonStrict('{"a":1,"a":2}')).toThrow("Duplicate JSON object key");
  });
});

describe("objectType and typed references", () => {
  it("distinguishes unknown types and unsupported versions", () => {
    expect(classifySupport(registry, "FUTURE_TYPE", "1")).toBe("UNKNOWN_TYPE");
    expect(classifySupport(registry, "MATTER_ASSERTION", "2")).toBe("UNSUPPORTED_VERSION");
  });

  it("accepts a valid envelope and preserves unknown extensions through canonicalization", () => {
    expect(validateEnvelope({ ...envelope, extensions: { "future.example/value": { x: 1 } } }, registry)).toEqual([]);
    expect(canonicalJson({ ...envelope, extensions: { "future.example/value": { x: 1 } } })).toContain("future.example/value");
  });

  it("requires exact revisions for content-bound references", () => {
    expect(validateReference({
      referenceType: "SUBJECT_REVISION",
      targetObjectType: "MATTER_ASSERTION",
      targetObjectId: "object-1",
      required: true,
    }, registry).map((finding) => finding.code)).toContain("MISSING_EXACT_REVISION");
  });
});

describe("dependency frontier", () => {
  it("is current only for exact coverage and versions", () => {
    expect(assessFrontier(frontier, observed)).toEqual({ status: "CURRENT", reasons: [] });
  });

  it("becomes stale when a direct exact revision or rules version changes", () => {
    expect(assessFrontier(frontier, { ...observed, heads: { "object-1": "revision-2" } }).status).toBe("STALE");
    expect(assessFrontier(frontier, { ...observed, rulesVersion: "rules-2" }).status).toBe("STALE");
  });

  it("does not become stale for unrelated revisions", () => {
    expect(assessFrontier(frontier, { ...observed, heads: { ...observed.heads, "unrelated-object": "revision-9" } })).toEqual({ status: "CURRENT", reasons: [] });
  });

  it("becomes incomplete for unsupported input and invalid for an unresolved direct dependency", () => {
    expect(assessFrontier(frontier, { ...observed, unsupportedInputs: ["FUTURE_TYPE@1"] }).status).toBe("INCOMPLETE");
    expect(assessFrontier(frontier, { ...observed, heads: {} }).status).toBe("INVALID");
  });
});

describe("minimal reconciliation", () => {
  it("never silently accepts an external edit", () => {
    expect(reconcile({
      objectId: envelope.objectId,
      acceptedRevisionId: envelope.revisionId,
      acceptedCanonicalJson: canonicalJson(envelope),
      observedCanonicalJson: canonicalJson({ ...envelope, payload: { text: "promjena" } }),
    })).toMatchObject({ status: "RECONCILIATION_REQUIRED", projectionCurrent: false, controlledApplyAllowed: false });
  });
});
