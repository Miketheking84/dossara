import { createHash } from "node:crypto";
import { mkdir, open, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { canonicalJson, parseJsonStrict } from "./canonical-json";
import { validateEnvelope, type CanonicalEnvelope, type TypeRegistry } from "./contracts";

export const PERMITTED_TEST_ROOT = path.resolve("C:\\SDJ_TEST\\SDJ_LEGAL_TEST");

export type PersistenceFailureCode =
  | "PATH_OUTSIDE_PERMITTED_ROOT"
  | "INVALID_RECORD"
  | "REVISION_ALREADY_EXISTS"
  | "MALFORMED_JSON"
  | "NON_CANONICAL_BYTES"
  | "INTEGRITY_MISMATCH"
  | "INVALID_HISTORY";

export class PersistenceSpikeError extends Error {
  constructor(readonly code: PersistenceFailureCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "PersistenceSpikeError";
  }
}

interface StoredRevision {
  envelope: CanonicalEnvelope;
  integrity: { algorithm: "sha256"; digest: string };
}

export interface HistoryEvent {
  eventId: string;
  eventType: string;
  recordedAt: string;
  payload: unknown;
}

export function assertPermittedTestPath(candidate: string): string {
  const resolved = path.resolve(candidate);
  const relative = path.relative(PERMITTED_TEST_ROOT, resolved);
  if (relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))) {
    return resolved;
  }
  throw new PersistenceSpikeError("PATH_OUTSIDE_PERMITTED_ROOT", `Path is outside ${PERMITTED_TEST_ROOT}`);
}

function digestCanonical(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value), "utf8").digest("hex");
}

function filenameSegment(identifier: string): string {
  if (!identifier || identifier === "." || identifier === "..") {
    throw new PersistenceSpikeError("INVALID_RECORD", "Identity cannot be empty or a dot segment");
  }
  return encodeURIComponent(identifier);
}

function requireValidEnvelope(value: unknown, registry: TypeRegistry): asserts value is CanonicalEnvelope {
  const findings = validateEnvelope(value, registry);
  if (findings.length) {
    throw new PersistenceSpikeError("INVALID_RECORD", findings.map((finding) => `${finding.path}:${finding.code}`).join(", "));
  }
}

export function revisionPath(workspaceRoot: string, envelope: CanonicalEnvelope): string {
  const root = assertPermittedTestPath(workspaceRoot);
  return assertPermittedTestPath(path.join(
    root,
    "00 CONTROL",
    "vla",
    "objects",
    filenameSegment(envelope.objectType),
    filenameSegment(envelope.objectId),
    "revisions",
    `${filenameSegment(envelope.revisionId)}.json`,
  ));
}

export async function writeImmutableRevision(
  workspaceRoot: string,
  envelope: CanonicalEnvelope,
  registry: TypeRegistry,
): Promise<{ filePath: string; digest: string; bytes: string }> {
  requireValidEnvelope(envelope, registry);
  const filePath = revisionPath(workspaceRoot, envelope);
  const digest = digestCanonical(envelope);
  const bytes = canonicalJson({ envelope, integrity: { algorithm: "sha256", digest } } satisfies StoredRevision);
  await mkdir(path.dirname(filePath), { recursive: true });
  try {
    await writeFile(filePath, bytes, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new PersistenceSpikeError("REVISION_ALREADY_EXISTS", "Immutable revision already exists", { cause: error });
    }
    throw error;
  }
  return { filePath, digest, bytes };
}

export async function readImmutableRevision(
  filePath: string,
  registry: TypeRegistry,
): Promise<{ envelope: CanonicalEnvelope; digest: string; bytes: string }> {
  const safePath = assertPermittedTestPath(filePath);
  const bytes = await readFile(safePath, "utf8");
  let value: unknown;
  try {
    value = parseJsonStrict(bytes);
  } catch (error) {
    throw new PersistenceSpikeError("MALFORMED_JSON", "Revision is not strict JSON", { cause: error });
  }
  if (canonicalJson(value) !== bytes) {
    throw new PersistenceSpikeError("NON_CANONICAL_BYTES", "Revision bytes are not canonical");
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new PersistenceSpikeError("INVALID_RECORD", "Stored revision wrapper must be an object");
  }
  const stored = value as Partial<StoredRevision>;
  requireValidEnvelope(stored.envelope, registry);
  if (stored.integrity?.algorithm !== "sha256" || typeof stored.integrity.digest !== "string") {
    throw new PersistenceSpikeError("INVALID_RECORD", "Integrity metadata is invalid");
  }
  const digest = digestCanonical(stored.envelope);
  if (digest !== stored.integrity.digest) {
    throw new PersistenceSpikeError("INTEGRITY_MISMATCH", "Revision digest does not match canonical content");
  }
  return { envelope: stored.envelope, digest, bytes };
}

function validateHistoryEvent(value: unknown): asserts value is HistoryEvent {
  const event = value as Partial<HistoryEvent> | null;
  if (
    typeof event !== "object" || event === null ||
    typeof event.eventId !== "string" || !event.eventId ||
    typeof event.eventType !== "string" || !event.eventType ||
    typeof event.recordedAt !== "string" || Number.isNaN(Date.parse(event.recordedAt)) ||
    new Date(event.recordedAt).toISOString() !== event.recordedAt || !("payload" in event)
  ) {
    throw new PersistenceSpikeError("INVALID_HISTORY", "History event is invalid");
  }
}

export async function readHistory(logPath: string): Promise<{ events: HistoryEvent[]; bytes: string }> {
  const safePath = assertPermittedTestPath(logPath);
  const bytes = await readFile(safePath, "utf8");
  const events: HistoryEvent[] = [];
  const ids = new Set<string>();
  for (const line of bytes.split("\n")) {
    if (!line) continue;
    let value: unknown;
    try {
      value = parseJsonStrict(line);
    } catch (error) {
      throw new PersistenceSpikeError("INVALID_HISTORY", "History contains malformed JSON", { cause: error });
    }
    validateHistoryEvent(value);
    if (ids.has(value.eventId)) throw new PersistenceSpikeError("INVALID_HISTORY", "History contains a duplicate eventId");
    ids.add(value.eventId);
    events.push(value);
  }
  return { events, bytes };
}

export async function appendHistoryEvent(logPath: string, event: HistoryEvent): Promise<string> {
  validateHistoryEvent(event);
  const safePath = assertPermittedTestPath(logPath);
  await mkdir(path.dirname(safePath), { recursive: true });
  let existing = "";
  try {
    existing = (await readHistory(safePath)).bytes;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (existing && !existing.endsWith("\n")) {
    throw new PersistenceSpikeError("INVALID_HISTORY", "History does not end at an event boundary");
  }
  const existingEvents = existing ? (await readHistory(safePath)).events : [];
  if (existingEvents.some((item) => item.eventId === event.eventId)) {
    throw new PersistenceSpikeError("INVALID_HISTORY", "History eventId already exists");
  }
  const line = canonicalJson(event);
  const handle = await open(safePath, "a");
  try {
    await handle.writeFile(line, "utf8");
  } finally {
    await handle.close();
  }
  return line;
}
