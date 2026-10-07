import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import {
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface, type Interface as ReadLineInterface } from "node:readline";
import { setTimeout as delay } from "node:timers/promises";
import { isMatterType } from "../../src/lib/sdj-matter-classification";
import { canonicalJson, parseJsonStrict } from "../foundation-hardening/canonical-json";
import { validateEnvelope, type CanonicalEnvelope } from "../foundation-hardening/contracts";
import { PERMITTED_TEST_ROOT } from "../foundation-hardening/persistence-spike";
import {
  WRITE1E_REGISTRY,
  WRITE1E_SCHEMA_VERSION,
  type AttemptPayload,
  type BaselineAcceptanceResult,
  type BaselineRequest,
  type CurrentMatterControl,
  type FailurePoint,
  type FieldMutation,
  type MatterControlPayload,
  type MutableMatterField,
  type MutationRequest,
  type MutationResult,
  type OutcomePayload,
  type ReceiptPayload,
  type RecoveryResult,
  type Write1eEnvelope,
} from "./contracts";

const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const MAX_CONTROL_BYTES = 1024 * 1024;

const LABELS: Readonly<Record<MutableMatterField, string>> = {
  matterType: "Vrsta predmeta",
  nextStep: "Sledeći korak",
};

class Write1eError extends Error {
  constructor(
    readonly code: "VALIDATION_FAILED" | "CONFLICT" | "IO_FAILED" | "RECOVERY_REQUIRED",
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

interface StoredEnvelope {
  envelope: CanonicalEnvelope;
  integrity: { algorithm: "sha256"; digest: string };
}

interface Faults {
  failurePoint?: FailurePoint;
  finalMismatchBytes?: Buffer;
}

export interface MutationHarnessOptions {
  faults?: Faults;
  replay?: boolean;
  recoverPublished?: boolean;
  updateDerived?: (result: { matterId: string; revisionId: string; readToken: string }) => Promise<void>;
}

interface TargetGuard {
  verify(): Promise<void>;
  publish(target: string, replacement: string, expectedTargetToken: string, expectedResultToken: string): Promise<void>;
  close(): Promise<void>;
}

export interface GuardedWindowsPublisher {
  verify(): Promise<void>;
  publish(target: string, replacement: string, expectedTargetToken: string, expectedResultToken: string): Promise<void>;
}

interface GuardMessage {
  status: "READY" | "VERIFIED" | "RENAME_READY" | "PUBLISHED" | "PUBLISH_FAILED" | "CONFLICT" | "RECOVERY_REQUIRED" | "ERROR";
  detail?: string;
}

export const WINDOWS_PUBLICATION_HELPER = path.join(path.dirname(fileURLToPath(import.meta.url)), "windows-handle-publication.ps1");

function nextGuardMessage(lines: AsyncIterator<string>): Promise<GuardMessage> {
  return Promise.race([
    lines.next().then(({ value, done }) => {
      if (done || value === undefined) throw new Write1eError("IO_FAILED", "Windows target guard closed without a response");
      try { return JSON.parse(value) as GuardMessage; } catch { throw new Write1eError("IO_FAILED", `Invalid Windows target guard response: ${value}`); }
    }),
    delay(10_000).then(() => { throw new Write1eError("IO_FAILED", "Windows target guard response timed out"); }),
  ]);
}

async function acquireWindowsTargetGuard(targetParent: string): Promise<TargetGuard> {
  if (process.platform !== "win32") throw new Write1eError("IO_FAILED", "WRITE-1V publication guard is Windows-only");
  const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", WINDOWS_PUBLICATION_HELPER, "-DirectoryPath", targetParent], {
    stdio: ["pipe", "pipe", "pipe"], windowsHide: true,
  });
  const reader: ReadLineInterface = createInterface({ input: child.stdout, crlfDelay: Infinity });
  const lines = reader[Symbol.asyncIterator]();
  const ready = await nextGuardMessage(lines);
  if (ready.status !== "READY") {
    if (child.exitCode === null) {
      const childClosed = new Promise<void>((resolve) => child.once("close", () => resolve()));
      child.stdin.end("CLOSE\n");
      await childClosed;
    }
    reader.close();
    throw new Write1eError("VALIDATION_FAILED", ready.detail ?? "Windows target identity guard rejected the canonical path");
  }
  let closed = false;
  return {
    async verify(): Promise<void> {
      if (closed) throw new Write1eError("RECOVERY_REQUIRED", "Windows target guard was closed before verification");
      child.stdin.write("VERIFY\n");
      const verified = await nextGuardMessage(lines);
      if (verified.status !== "VERIFIED") throw new Write1eError("RECOVERY_REQUIRED", verified.detail ?? "Canonical directory identity discontinuity");
    },
    async publish(target: string, replacement: string, expectedTargetToken: string, expectedResultToken: string): Promise<void> {
      if (closed) throw new Write1eError("RECOVERY_REQUIRED", "Windows target guard was closed before publication");
      child.stdin.write(`${JSON.stringify({
        command: "PUBLISH", target, replacement,
        expectedTargetHash: expectedTargetToken.replace(/^sha256:/u, ""),
        expectedResultHash: expectedResultToken.replace(/^sha256:/u, ""),
      })}\n`);
      let publication = await nextGuardMessage(lines);
      if (publication.status === "RENAME_READY") {
        child.stdin.write("COMMIT\n");
        publication = await nextGuardMessage(lines);
      }
      if (publication.status === "PUBLISHED") return;
      if (publication.status === "CONFLICT") throw new Write1eError("CONFLICT", publication.detail ?? "Canonical bytes changed at publication boundary");
      if (publication.status === "RECOVERY_REQUIRED") throw new Write1eError("RECOVERY_REQUIRED", publication.detail ?? "Publication identity continuity is indeterminate");
      throw new Write1eError("IO_FAILED", publication.detail ?? "Guarded Windows publication failed");
    },
    async close(): Promise<void> {
      if (closed) return;
      closed = true;
      if (child.exitCode === null) {
        const childClosed = new Promise<void>((resolve) => child.once("close", () => resolve()));
        child.stdin.end("CLOSE\n");
        await childClosed;
      }
      reader.close();
    },
  };
}

export async function withWindowsTargetIdentityGuard<T>(target: string, action: (publisher: GuardedWindowsPublisher) => Promise<T>): Promise<T> {
  const guard = await acquireWindowsTargetGuard(path.dirname(target));
  try {
    return await action(guard);
  } finally {
    await guard.close();
  }
}

const writerTails = new Map<string, Promise<void>>();

function sha256(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function exactReadToken(bytes: Uint8Array): string {
  return `sha256:${sha256(bytes)}`;
}

function assertCanonicalTimestamp(value: string): void {
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Write1eError("VALIDATION_FAILED", "recordedAt must be a canonical ISO timestamp");
  }
}

function containsPath(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

async function resolveCanonicalTarget(workspaceRoot: string, canonicalRelativePath: string): Promise<string> {
  const permitted = path.resolve(PERMITTED_TEST_ROOT);
  const workspace = path.resolve(workspaceRoot);
  if (!containsPath(permitted, workspace)) {
    throw new Write1eError("VALIDATION_FAILED", "Workspace is outside the sole permitted test root");
  }
  if (path.isAbsolute(canonicalRelativePath) || canonicalRelativePath.split(/[\\/]/u).includes("..")) {
    throw new Write1eError("VALIDATION_FAILED", "Canonical path must be a contained relative path");
  }
  const target = path.resolve(workspace, canonicalRelativePath);
  if (!containsPath(workspace, target)) {
    throw new Write1eError("VALIDATION_FAILED", "Canonical path escapes the workspace");
  }
  const workspaceReal = await realpath(workspace);
  const parentReal = await realpath(path.dirname(target));
  if (!containsPath(workspaceReal, parentReal)) {
    throw new Write1eError("VALIDATION_FAILED", "Canonical parent resolves outside the workspace");
  }
  const targetStat = await lstat(target);
  if (!targetStat.isFile() || targetStat.isSymbolicLink()) {
    throw new Write1eError("VALIDATION_FAILED", "Canonical target must be a regular non-symlink file");
  }
  if (targetStat.size > MAX_CONTROL_BYTES) {
    throw new Write1eError("VALIDATION_FAILED", "Canonical target exceeds the accepted size limit");
  }
  return target;
}

function strictUtf8(bytes: Buffer): { bom: Buffer; body: string } {
  const hasBom = bytes.subarray(0, 3).equals(UTF8_BOM);
  const bodyBytes = hasBom ? bytes.subarray(3) : bytes;
  try {
    return { bom: hasBom ? UTF8_BOM : Buffer.alloc(0), body: new TextDecoder("utf-8", { fatal: true }).decode(bodyBytes) };
  } catch (error) {
    throw new Write1eError("VALIDATION_FAILED", "Canonical target is not strict UTF-8", { cause: error });
  }
}

interface Span {
  field: MutableMatterField;
  start: number;
  end: number;
  replacement: string;
}

function lineRanges(text: string): Array<{ start: number; contentEnd: number; next: number }> {
  const result: Array<{ start: number; contentEnd: number; next: number }> = [];
  let start = 0;
  while (start < text.length) {
    const lf = text.indexOf("\n", start);
    const next = lf === -1 ? text.length : lf + 1;
    let contentEnd = lf === -1 ? text.length : lf;
    if (contentEnd > start && text[contentEnd - 1] === "\r") contentEnd -= 1;
    result.push({ start, contentEnd, next });
    start = next;
  }
  if (text.length === 0) result.push({ start: 0, contentEnd: 0, next: 0 });
  return result;
}

function occurrences(text: string, label: string): Array<{ start: number; end: number; line: ReturnType<typeof lineRanges>[number] }> {
  const prefix = `${label}:`;
  const result: Array<{ start: number; end: number; line: ReturnType<typeof lineRanges>[number] }> = [];
  for (const line of lineRanges(text)) {
    const content = text.slice(line.start, line.contentEnd);
    if (!content.startsWith(prefix)) continue;
    let start = line.start + prefix.length;
    while (start < line.contentEnd && (text[start] === " " || text[start] === "\t")) start += 1;
    let end = line.contentEnd;
    while (end > start && (text[end - 1] === " " || text[end - 1] === "\t")) end -= 1;
    result.push({ start, end, line });
  }
  return result;
}

function validateMutations(mutations: readonly FieldMutation[]): void {
  if (mutations.length === 0) throw new Write1eError("VALIDATION_FAILED", "At least one mutation is required");
  const seen = new Set<MutableMatterField>();
  for (const mutation of mutations) {
    if (!(mutation.field in LABELS) || typeof mutation.value !== "string" || mutation.value.length === 0 || /[\r\n]/u.test(mutation.value)) {
      throw new Write1eError("VALIDATION_FAILED", "Mutation field/value is invalid");
    }
    if (seen.has(mutation.field)) throw new Write1eError("VALIDATION_FAILED", "A field may be targeted only once");
    seen.add(mutation.field);
    if (mutation.field === "matterType" && !isMatterType(mutation.value)) {
      throw new Write1eError("VALIDATION_FAILED", "Matter Type is outside the accepted MTC-1 vocabulary");
    }
  }
}

export function losslessTransform(current: Buffer, mutations: readonly FieldMutation[]): Buffer {
  validateMutations(mutations);
  const decoded = strictUtf8(current);
  const spans: Span[] = [];
  for (const mutation of mutations) {
    const found = occurrences(decoded.body, LABELS[mutation.field]);
    if (found.length > 1) throw new Write1eError("VALIDATION_FAILED", `Duplicate target: ${LABELS[mutation.field]}`);
    if (found.length === 0) {
      if (mutation.field !== "matterType") {
        throw new Write1eError("VALIDATION_FAILED", `Missing required target: ${LABELS[mutation.field]}`);
      }
      const anchors = occurrences(decoded.body, "Oblast prava");
      if (anchors.length !== 1) throw new Write1eError("VALIDATION_FAILED", "Matter Type insertion anchor is missing or ambiguous");
      const anchor = anchors[0].line;
      const newline = decoded.body.slice(anchor.contentEnd, anchor.next) || (decoded.body.includes("\r\n") ? "\r\n" : "\n");
      spans.push({ field: mutation.field, start: anchor.next, end: anchor.next, replacement: `${LABELS.matterType}: ${mutation.value}${newline}` });
      continue;
    }
    spans.push({ field: mutation.field, start: found[0].start, end: found[0].end, replacement: mutation.value });
  }
  spans.sort((left, right) => right.start - left.start);
  let body = decoded.body;
  for (const span of spans) body = `${body.slice(0, span.start)}${span.replacement}${body.slice(span.end)}`;
  return Buffer.concat([decoded.bom, Buffer.from(body, "utf8")]);
}

function envelope(
  objectType: Write1eEnvelope["objectType"],
  objectId: string,
  revisionId: string,
  matterId: string,
  recordedAt: string,
  actor: string,
  payload: MatterControlPayload | AttemptPayload | OutcomePayload | ReceiptPayload,
  references: CanonicalEnvelope["references"] = [],
): Write1eEnvelope {
  return {
    recordFormat: "dossara-record/1",
    schemaId: "write-1e-canonical-mutation",
    schemaVersion: WRITE1E_SCHEMA_VERSION,
    objectType,
    objectId,
    revisionId,
    revisionOf: objectId,
    matterId,
    recordedAt,
    createdBy: actor,
    generatorType: "SYSTEM",
    payload,
    references,
  };
}

function evidenceRoot(evidenceStorageRoot: string): string {
  return path.join(evidenceStorageRoot, "00 CONTROL", "vla", "objects");
}

function evidencePath(evidenceStorageRoot: string, value: Write1eEnvelope): string {
  return path.join(evidenceRoot(evidenceStorageRoot), value.objectType, encodeURIComponent(value.objectId), "revisions", `${encodeURIComponent(value.revisionId)}.json`);
}

async function writeDurableEnvelope(evidenceStorageRoot: string, value: Write1eEnvelope, replay = false): Promise<string> {
  const findings = validateEnvelope(value, WRITE1E_REGISTRY);
  if (findings.length > 0) throw new Write1eError("IO_FAILED", findings.map((item) => `${item.path}:${item.code}`).join(", "));
  const filePath = evidencePath(evidenceStorageRoot, value);
  await mkdir(path.dirname(filePath), { recursive: true });
  const digest = sha256(canonicalJson(value));
  const bytes = canonicalJson({ envelope: value, integrity: { algorithm: "sha256", digest } } satisfies StoredEnvelope);
  if (replay) {
    try {
      if ((await readFile(filePath, "utf8")) !== bytes) throw new Write1eError("RECOVERY_REQUIRED", "Immutable transaction identity reused with different bytes");
      return filePath;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  const handle = await open(filePath, "wx");
  try {
    await handle.writeFile(bytes, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  return filePath;
}

async function readEvidence(evidenceStorageRoot: string): Promise<Write1eEnvelope[]> {
  const root = evidenceRoot(evidenceStorageRoot);
  const values: Write1eEnvelope[] = [];
  async function visit(directory: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
    for (const entry of entries) {
      const child = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(child);
      else if (entry.isFile() && entry.name.endsWith(".json")) {
        const stored = parseJsonStrict(await readFile(child, "utf8")) as StoredEnvelope;
        if (sha256(canonicalJson(stored.envelope)) !== stored.integrity?.digest) {
          throw new Write1eError("RECOVERY_REQUIRED", `Evidence integrity mismatch: ${child}`);
        }
        const findings = validateEnvelope(stored.envelope, WRITE1E_REGISTRY);
        if (findings.length > 0) throw new Write1eError("RECOVERY_REQUIRED", `Invalid evidence: ${child}`);
        values.push(stored.envelope as Write1eEnvelope);
      }
    }
  }
  await visit(root);
  return values;
}

export async function currentMatterControl(evidenceStorageRoot: string, matterId: string, canonicalRelativePath: string): Promise<CurrentMatterControl | undefined> {
  const receipts = (await readEvidence(evidenceStorageRoot)).filter((value) => {
    if (value.objectType !== "MATTER_CONTROL_MUTATION_RECEIPT" || value.matterId !== matterId) return false;
    const payload = value.payload as ReceiptPayload;
    return payload.canonicalRelativePath === canonicalRelativePath;
  });
  receipts.sort((left, right) => left.recordedAt.localeCompare(right.recordedAt) || left.revisionId.localeCompare(right.revisionId));
  const supersededRevisionIds = new Set(
    receipts
      .map((receipt) => (receipt.payload as ReceiptPayload).previousRevisionId)
      .filter((revisionId): revisionId is string => revisionId !== null),
  );
  const tips = receipts.filter(
    (receipt) => !supersededRevisionIds.has(
      (receipt.payload as ReceiptPayload).currentRevisionId,
    ),
  );
  const latest = (tips.length === 1 ? tips : receipts).at(-1);
  if (!latest) return undefined;
  const payload = latest.payload as ReceiptPayload;
  return { revisionId: payload.currentRevisionId, readToken: payload.resultingVerifiedReadToken, receiptRevisionId: latest.revisionId };
}

function requestEvidenceStorageRoot(request: BaselineRequest | MutationRequest): string {
  const workspaceRoot = path.resolve(request.workspaceRoot);
  const storageRoot = path.resolve(request.evidenceStorageRoot ?? request.workspaceRoot);
  if (!containsPath(workspaceRoot, storageRoot)) {
    throw new Write1eError("VALIDATION_FAILED", "Evidence storage root must stay inside the workspace");
  }
  return storageRoot;
}

async function withSingleWriter<T>(key: string, action: () => Promise<T>): Promise<T> {
  const previous = writerTails.get(key) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => { release = resolve; });
  const tail = previous.then(() => current);
  writerTails.set(key, tail);
  await previous;
  try {
    return await action();
  } finally {
    release();
    if (writerTails.get(key) === tail) writerTails.delete(key);
  }
}

async function recordOutcome(request: MutationRequest, code: OutcomePayload["code"], detail: string, observedReadToken?: string): Promise<void> {
  const payload: OutcomePayload = { state: "TERMINAL", transactionId: request.transactionId, code, canonicalRelativePath: request.canonicalRelativePath, observedReadToken, detail };
  await writeDurableEnvelope(requestEvidenceStorageRoot(request), envelope(
    "MATTER_CONTROL_MUTATION_OUTCOME", request.transactionId, `${request.transactionId}-outcome`, request.matterId,
    request.recordedAt, request.actor, payload,
    [{ referenceType: "MUTATION_ATTEMPT", targetObjectType: "MATTER_CONTROL_MUTATION_ATTEMPT", targetObjectId: request.transactionId, targetRevisionId: `${request.transactionId}-attempt`, matterId: request.matterId, required: true }],
  ));
}

export async function acceptMatterControlBaseline(request: BaselineRequest): Promise<BaselineAcceptanceResult> {
  assertCanonicalTimestamp(request.recordedAt);
  if (!/^sha256:[0-9a-f]{64}$/u.test(request.expectedReadToken)) {
    throw new Write1eError("VALIDATION_FAILED", "expectedReadToken is malformed");
  }
  const target = await resolveCanonicalTarget(request.workspaceRoot, request.canonicalRelativePath);
  const evidenceStorageRoot = requestEvidenceStorageRoot(request);
  return withSingleWriter(target.toLowerCase(), async () => {
    const targetGuard = await acquireWindowsTargetGuard(path.dirname(target));
    try {
      await targetGuard.verify();
      const bytes = await readFile(target);
      strictUtf8(bytes);
      const readToken = exactReadToken(bytes);
      if (readToken !== request.expectedReadToken) {
        return {
          code: "CONFLICT",
          transactionId: request.transactionId,
          observedReadToken: readToken,
          currentRevisionId: (await currentMatterControl(evidenceStorageRoot, request.matterId, request.canonicalRelativePath))?.revisionId,
          detail: "Exact-byte read token mismatch during baseline acceptance",
        };
      }

      const existing = await currentMatterControl(
        evidenceStorageRoot,
        request.matterId,
        request.canonicalRelativePath,
      );
      if (existing) {
        if (existing.readToken === readToken) {
          return {
            code: "BASELINE_ALREADY_ACCEPTED",
            transactionId: request.transactionId,
            revisionId: existing.revisionId,
            readToken,
          };
        }
        return {
          code: "EXTERNAL_BASELINE_REVIEW_REQUIRED",
          transactionId: request.transactionId,
          observedReadToken: readToken,
          currentRevisionId: existing.revisionId,
          detail: "An accepted baseline already exists for different canonical bytes",
        };
      }

      const revisionPayload: MatterControlPayload = {
        state: "ACCEPTED_BASELINE", matterId: request.matterId, transactionId: request.transactionId,
        canonicalRelativePath: request.canonicalRelativePath, previousReadToken: null, resultingReadToken: readToken,
        changedFields: [], contentEncoding: "base64", exactContentBase64: bytes.toString("base64"), source: request.source,
      };
      await writeDurableEnvelope(evidenceStorageRoot, envelope("MATTER_CONTROL", request.matterId, request.revisionId, request.matterId, request.recordedAt, request.actor, revisionPayload));
      const receiptPayload: ReceiptPayload = {
        state: "BASELINE_ACCEPTED", transactionId: request.transactionId, matterId: request.matterId,
        canonicalRelativePath: request.canonicalRelativePath, previousRevisionId: null, currentRevisionId: request.revisionId,
        previousReadToken: null, resultingVerifiedReadToken: readToken, changedFields: [], publicationVerified: true,
        derivedState: "VALID", source: request.source,
      };
      await writeDurableEnvelope(evidenceStorageRoot, envelope(
        "MATTER_CONTROL_MUTATION_RECEIPT", request.transactionId, `${request.transactionId}-receipt`, request.matterId,
        request.recordedAt, request.actor, receiptPayload,
        [{ referenceType: "PREPARED_MATTER_CONTROL_REVISION", targetObjectType: "MATTER_CONTROL", targetObjectId: request.matterId, targetRevisionId: request.revisionId, matterId: request.matterId, required: true }],
      ));
      return {
        code: "BASELINE_ACCEPTED",
        transactionId: request.transactionId,
        revisionId: request.revisionId,
        readToken,
      };
    } finally {
      await targetGuard.close();
    }
  });
}

export async function acceptExternalMatterControlBaseline(request: BaselineRequest): Promise<BaselineAcceptanceResult> {
  assertCanonicalTimestamp(request.recordedAt);
  if (!/^sha256:[0-9a-f]{64}$/u.test(request.expectedReadToken)) {
    throw new Write1eError("VALIDATION_FAILED", "expectedReadToken is malformed");
  }
  const target = await resolveCanonicalTarget(request.workspaceRoot, request.canonicalRelativePath);
  const evidenceStorageRoot = requestEvidenceStorageRoot(request);
  return withSingleWriter(target.toLowerCase(), async () => {
    const targetGuard = await acquireWindowsTargetGuard(path.dirname(target));
    try {
      await targetGuard.verify();
      const bytes = await readFile(target);
      strictUtf8(bytes);
      const readToken = exactReadToken(bytes);
      const existing = await currentMatterControl(
        evidenceStorageRoot,
        request.matterId,
        request.canonicalRelativePath,
      );
      if (readToken !== request.expectedReadToken) {
        return {
          code: "CONFLICT",
          transactionId: request.transactionId,
          observedReadToken: readToken,
          currentRevisionId: existing?.revisionId,
          detail: "Exact-byte read token mismatch during external baseline acceptance",
        };
      }
      if (!existing) {
        return {
          code: "EXTERNAL_BASELINE_REVIEW_REQUIRED",
          transactionId: request.transactionId,
          observedReadToken: readToken,
          detail: "External baseline acceptance requires a previous accepted revision",
        };
      }
      if (existing.readToken === readToken) {
        return {
          code: "BASELINE_ALREADY_ACCEPTED",
          transactionId: request.transactionId,
          revisionId: existing.revisionId,
          readToken,
        };
      }

      const revisionPayload: MatterControlPayload = {
        state: "EXTERNAL_BASELINE_ACCEPTED", matterId: request.matterId, transactionId: request.transactionId,
        canonicalRelativePath: request.canonicalRelativePath, previousReadToken: existing.readToken,
        resultingReadToken: readToken, changedFields: [], contentEncoding: "base64",
        exactContentBase64: bytes.toString("base64"), source: request.source,
      };
      await writeDurableEnvelope(evidenceStorageRoot, envelope(
        "MATTER_CONTROL", request.matterId, request.revisionId, request.matterId,
        request.recordedAt, request.actor, revisionPayload,
        [{ referenceType: "PREVIOUS_MATTER_CONTROL_REVISION", targetObjectType: "MATTER_CONTROL", targetObjectId: request.matterId, targetRevisionId: existing.revisionId, matterId: request.matterId, required: true }],
      ));
      const receiptPayload: ReceiptPayload = {
        state: "EXTERNAL_BASELINE_ACCEPTED", transactionId: request.transactionId, matterId: request.matterId,
        canonicalRelativePath: request.canonicalRelativePath, previousRevisionId: existing.revisionId,
        currentRevisionId: request.revisionId, previousReadToken: existing.readToken,
        resultingVerifiedReadToken: readToken, changedFields: [], publicationVerified: true,
        derivedState: "VALID", source: request.source,
      };
      await writeDurableEnvelope(evidenceStorageRoot, envelope(
        "MATTER_CONTROL_MUTATION_RECEIPT", request.transactionId, `${request.transactionId}-receipt`, request.matterId,
        request.recordedAt, request.actor, receiptPayload,
        [
          { referenceType: "PREVIOUS_MATTER_CONTROL_REVISION", targetObjectType: "MATTER_CONTROL", targetObjectId: request.matterId, targetRevisionId: existing.revisionId, matterId: request.matterId, required: true },
          { referenceType: "PREPARED_MATTER_CONTROL_REVISION", targetObjectType: "MATTER_CONTROL", targetObjectId: request.matterId, targetRevisionId: request.revisionId, matterId: request.matterId, required: true },
        ],
      ));
      return {
        code: "EXTERNAL_BASELINE_ACCEPTED",
        transactionId: request.transactionId,
        revisionId: request.revisionId,
        readToken,
      };
    } finally {
      await targetGuard.close();
    }
  });
}

export async function mutateMatterControl(request: MutationRequest, options: MutationHarnessOptions = {}): Promise<MutationResult> {
  assertCanonicalTimestamp(request.recordedAt);
  validateMutations(request.mutations);
  if (!/^sha256:[0-9a-f]{64}$/u.test(request.expectedReadToken)) throw new Write1eError("VALIDATION_FAILED", "expectedReadToken is malformed");
  const target = await resolveCanonicalTarget(request.workspaceRoot, request.canonicalRelativePath);
  const evidenceStorageRoot = requestEvidenceStorageRoot(request);
  return withSingleWriter(target.toLowerCase(), async () => {
    const recordReplayOutcome = async (...args: Parameters<typeof recordOutcome>) => {
      if (!options.replay) return recordOutcome(...args);
      const existing = (await readEvidence(evidenceStorageRoot)).some((item) => item.objectType === "MATTER_CONTROL_MUTATION_OUTCOME" && item.objectId === request.transactionId);
      if (!existing) await recordOutcome(...args);
    };
    if (options.replay) {
      const evidence = await readEvidence(evidenceStorageRoot);
      const attempt = evidence.find((item) => item.objectType === "MATTER_CONTROL_MUTATION_ATTEMPT" && item.objectId === request.transactionId);
      const prepared = evidence.find((item) => item.objectType === "MATTER_CONTROL" && item.revisionId === request.resultingRevisionId);
      const receipt = evidence.find((item) => item.objectType === "MATTER_CONTROL_MUTATION_RECEIPT" && item.objectId === request.transactionId);
      if (attempt) {
        const payload = attempt.payload as AttemptPayload;
        if (attempt.matterId !== request.matterId || attempt.createdBy !== request.actor || attempt.recordedAt !== request.recordedAt ||
            payload.canonicalRelativePath !== request.canonicalRelativePath || payload.expectedReadToken !== request.expectedReadToken ||
            payload.acceptedRevisionId !== request.acceptedRevisionId || payload.source !== request.source ||
            canonicalJson(payload.requestedMutations) !== canonicalJson(request.mutations)) {
          throw new Write1eError("VALIDATION_FAILED", "Transaction cannot be reused for a different review");
        }
      }
      if (receipt) {
        const payload = receipt.payload as ReceiptPayload;
        if (!attempt || !prepared || payload.currentRevisionId !== request.resultingRevisionId ||
            payload.previousRevisionId !== request.acceptedRevisionId || payload.previousReadToken !== request.expectedReadToken ||
            payload.resultingVerifiedReadToken !== (prepared.payload as MatterControlPayload).resultingReadToken) {
          throw new Write1eError("RECOVERY_REQUIRED", "Incomplete replay provenance");
        }
        return { code: "CANONICAL_SUCCESS", transactionId: request.transactionId, previousReadToken: payload.previousReadToken!,
          resultingReadToken: payload.resultingVerifiedReadToken, currentRevisionId: payload.currentRevisionId, preparedRevisionId: payload.currentRevisionId };
      }
      if (prepared) {
        const payload = prepared.payload as MatterControlPayload;
        if (!attempt || payload.transactionId !== request.transactionId || payload.previousReadToken !== request.expectedReadToken ||
            prepared.matterId !== request.matterId || payload.canonicalRelativePath !== request.canonicalRelativePath) {
          throw new Write1eError("RECOVERY_REQUIRED", "Prepared transaction mismatch");
        }
        const token = exactReadToken(await readFile(target));
        if (token !== request.expectedReadToken) {
          if (!options.recoverPublished || token !== payload.resultingReadToken) {
            return { code: "RECOVERY_REQUIRED", transactionId: request.transactionId, resultingReadToken: token };
          }
          const guard = await acquireWindowsTargetGuard(path.dirname(target));
          try {
            await guard.verify();
            const current = await currentMatterControl(evidenceStorageRoot, request.matterId, request.canonicalRelativePath);
            if (!current || current.revisionId !== request.acceptedRevisionId || current.readToken !== request.expectedReadToken ||
                exactReadToken(Buffer.from(payload.exactContentBase64, "base64")) !== token || exactReadToken(await readFile(target)) !== token) {
              throw new Write1eError("RECOVERY_REQUIRED", "Published recovery no longer matches its reviewed base/result");
            }
            await writeDurableEnvelope(evidenceStorageRoot, envelope(
              "MATTER_CONTROL_MUTATION_RECEIPT", request.transactionId, `${request.transactionId}-receipt`, request.matterId,
              request.recordedAt, request.actor, { state: "SUCCESS", transactionId: request.transactionId, matterId: request.matterId,
                canonicalRelativePath: request.canonicalRelativePath, previousRevisionId: request.acceptedRevisionId,
                currentRevisionId: request.resultingRevisionId, previousReadToken: request.expectedReadToken,
                resultingVerifiedReadToken: token, changedFields: request.mutations.map((item) => item.field),
                publicationVerified: true, derivedState: "PENDING", source: request.source } satisfies ReceiptPayload,
              [ { referenceType: "MUTATION_ATTEMPT", targetObjectType: "MATTER_CONTROL_MUTATION_ATTEMPT", targetObjectId: request.transactionId, targetRevisionId: `${request.transactionId}-attempt`, matterId: request.matterId, required: true },
                { referenceType: "PREPARED_MATTER_CONTROL_REVISION", targetObjectType: "MATTER_CONTROL", targetObjectId: request.matterId, targetRevisionId: request.resultingRevisionId, matterId: request.matterId, required: true } ],
            ), true);
            return { code: "CANONICAL_SUCCESS", transactionId: request.transactionId, previousReadToken: request.expectedReadToken,
              resultingReadToken: token, currentRevisionId: request.resultingRevisionId, preparedRevisionId: request.resultingRevisionId };
          } finally { await guard.close(); }
        }
      }
    }
    const attemptPayload: AttemptPayload = {
      state: "ATTEMPTED", transactionId: request.transactionId, matterId: request.matterId,
      canonicalRelativePath: request.canonicalRelativePath, expectedReadToken: request.expectedReadToken,
      acceptedRevisionId: request.acceptedRevisionId, requestedMutations: request.mutations, source: request.source,
    };
    await writeDurableEnvelope(evidenceStorageRoot, envelope(
      "MATTER_CONTROL_MUTATION_ATTEMPT", request.transactionId, `${request.transactionId}-attempt`, request.matterId,
      request.recordedAt, request.actor, attemptPayload,
    ), options.replay);

    // A writer queued behind a successful same-process mutation is already stale.
    // Reject it before starting another native guard; successful candidates are
    // read and checked again only after the trusted parent handles are held.
    const preliminaryBytes = await readFile(target);
    strictUtf8(preliminaryBytes);
    const preliminaryToken = exactReadToken(preliminaryBytes);
    if (preliminaryToken !== request.expectedReadToken) {
      await recordReplayOutcome(request, "CONFLICT", "Exact-byte read token mismatch", preliminaryToken);
      return { code: "CONFLICT", transactionId: request.transactionId, previousReadToken: preliminaryToken, currentRevisionId: (await currentMatterControl(evidenceStorageRoot, request.matterId, request.canonicalRelativePath))?.revisionId };
    }

    const targetGuard = await acquireWindowsTargetGuard(path.dirname(target));
    try {
    const currentBytes = await readFile(target);
    strictUtf8(currentBytes);
    const observedToken = exactReadToken(currentBytes);
    if (observedToken !== request.expectedReadToken) {
      await recordReplayOutcome(request, "CONFLICT", "Exact-byte read token mismatch", observedToken);
      return { code: "CONFLICT", transactionId: request.transactionId, previousReadToken: observedToken, currentRevisionId: (await currentMatterControl(evidenceStorageRoot, request.matterId, request.canonicalRelativePath))?.revisionId };
    }
    const accepted = await currentMatterControl(evidenceStorageRoot, request.matterId, request.canonicalRelativePath);
    if (!accepted || accepted.revisionId !== request.acceptedRevisionId || accepted.readToken !== observedToken) {
      await recordReplayOutcome(request, "EXTERNAL_BASELINE_REVIEW_REQUIRED", "Current bytes are not the supplied accepted revision", observedToken);
      return { code: "EXTERNAL_BASELINE_REVIEW_REQUIRED", transactionId: request.transactionId, previousReadToken: observedToken, currentRevisionId: accepted?.revisionId };
    }

    let proposed: Buffer;
    try {
      proposed = losslessTransform(currentBytes, request.mutations);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      await recordReplayOutcome(request, "VALIDATION_FAILED", detail, observedToken);
      return { code: "VALIDATION_FAILED", transactionId: request.transactionId, previousReadToken: observedToken, currentRevisionId: accepted.revisionId, detail };
    }
    const proposedToken = exactReadToken(proposed);
    const revisionPayload: MatterControlPayload = {
      state: "PREPARED", matterId: request.matterId, transactionId: request.transactionId,
      canonicalRelativePath: request.canonicalRelativePath, previousReadToken: observedToken, resultingReadToken: proposedToken,
      changedFields: request.mutations.map((item) => item.field), contentEncoding: "base64",
      exactContentBase64: proposed.toString("base64"), source: request.source,
    };
    await writeDurableEnvelope(evidenceStorageRoot, envelope(
      "MATTER_CONTROL", request.matterId, request.resultingRevisionId, request.matterId,
      request.recordedAt, request.actor, revisionPayload,
      [{ referenceType: "PREVIOUS_MATTER_CONTROL_REVISION", targetObjectType: "MATTER_CONTROL", targetObjectId: request.matterId, targetRevisionId: accepted.revisionId, matterId: request.matterId, required: true }],
    ), options.replay);

    const unique = `${request.transactionId}-${randomUUID()}`;
    const temp = path.join(path.dirname(target), `.${path.basename(target)}.${unique}.write1v.tmp`);
    let canonicalMayHaveChanged = false;
    try {
      await targetGuard.verify();
      if (options.faults?.failurePoint === "TEMP_CREATE") throw new Write1eError("IO_FAILED", "Injected temp-create failure");
      const handle = await open(temp, "wx");
      try {
        if (options.faults?.failurePoint === "TEMP_WRITE") throw new Write1eError("IO_FAILED", "Injected temp-write failure");
        await handle.writeFile(proposed);
        if (options.faults?.failurePoint === "TEMP_SYNC") throw new Write1eError("IO_FAILED", "Injected temp-sync failure");
        await handle.sync();
      } finally {
        await handle.close();
      }
      if (exactReadToken(await readFile(temp)) !== proposedToken) throw new Write1eError("IO_FAILED", "Staged temp hash mismatch");
      await targetGuard.verify();
      if (options.faults?.failurePoint === "PUBLICATION") throw new Write1eError("IO_FAILED", "Injected publication failure");
      await targetGuard.verify();
      await targetGuard.publish(target, temp, observedToken, proposedToken);
      canonicalMayHaveChanged = true;
      await targetGuard.verify();
      if (options.faults?.failurePoint === "FINAL_REREAD_MISMATCH") {
        await writeFile(target, options.faults.finalMismatchBytes ?? Buffer.from("external-final-mismatch", "utf8"));
      }
      const finalToken = exactReadToken(await readFile(target));
      if (finalToken !== proposedToken) throw new Write1eError("RECOVERY_REQUIRED", "Final canonical reread/hash mismatch");
      if (options.faults?.failurePoint === "RECEIPT_WRITE") throw new Write1eError("RECOVERY_REQUIRED", "Injected receipt-write failure");
      const receiptPayload: ReceiptPayload = {
        state: "SUCCESS", transactionId: request.transactionId, matterId: request.matterId,
        canonicalRelativePath: request.canonicalRelativePath, previousRevisionId: accepted.revisionId,
        currentRevisionId: request.resultingRevisionId, previousReadToken: observedToken,
        resultingVerifiedReadToken: proposedToken, changedFields: request.mutations.map((item) => item.field),
        publicationVerified: true, derivedState: "PENDING",
        source: request.source,
      };
      await writeDurableEnvelope(evidenceStorageRoot, envelope(
        "MATTER_CONTROL_MUTATION_RECEIPT", request.transactionId, `${request.transactionId}-receipt`, request.matterId,
        request.recordedAt, request.actor, receiptPayload,
        [
          { referenceType: "MUTATION_ATTEMPT", targetObjectType: "MATTER_CONTROL_MUTATION_ATTEMPT", targetObjectId: request.transactionId, targetRevisionId: `${request.transactionId}-attempt`, matterId: request.matterId, required: true },
          { referenceType: "PREPARED_MATTER_CONTROL_REVISION", targetObjectType: "MATTER_CONTROL", targetObjectId: request.matterId, targetRevisionId: request.resultingRevisionId, matterId: request.matterId, required: true },
        ],
      ));
      try {
        if (options.faults?.failurePoint === "DERIVED_UPDATE") throw new Error("Injected derived update failure");
        await options.updateDerived?.({ matterId: request.matterId, revisionId: request.resultingRevisionId, readToken: proposedToken });
      } catch {
        await recordReplayOutcome(request, "CANONICAL_SUCCESS_DERIVED_REBUILD_REQUIRED", "Canonical receipt is current; derived state requires rebuild", proposedToken);
        return { code: "CANONICAL_SUCCESS_DERIVED_REBUILD_REQUIRED", transactionId: request.transactionId, previousReadToken: observedToken, resultingReadToken: proposedToken, preparedRevisionId: request.resultingRevisionId, currentRevisionId: request.resultingRevisionId };
      }
      if (!options.replay) await recordReplayOutcome(request, "CANONICAL_SUCCESS", "Canonical receipt and derived update are complete", proposedToken);
      return { code: "CANONICAL_SUCCESS", transactionId: request.transactionId, previousReadToken: observedToken, resultingReadToken: proposedToken, preparedRevisionId: request.resultingRevisionId, currentRevisionId: request.resultingRevisionId };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      let code: "CONFLICT" | "IO_FAILED" | "RECOVERY_REQUIRED" = error instanceof Write1eError && (error.code === "CONFLICT" || error.code === "RECOVERY_REQUIRED") ? error.code : "IO_FAILED";
      let actualToken: string | undefined;
      try { actualToken = exactReadToken(await readFile(target)); } catch { code = "RECOVERY_REQUIRED"; }
      if (canonicalMayHaveChanged && actualToken !== observedToken) code = "RECOVERY_REQUIRED";
      await recordReplayOutcome(request, code, detail, actualToken);
      return { code, transactionId: request.transactionId, previousReadToken: observedToken, resultingReadToken: actualToken, preparedRevisionId: request.resultingRevisionId, currentRevisionId: accepted.revisionId, detail };
    } finally {
      await rm(temp, { force: true });
    }
    } finally {
      await targetGuard.close();
    }
  });
}

export async function inspectMatterControlRecovery(
  workspaceRoot: string,
  matterId: string,
  canonicalRelativePath: string,
  evidenceStorageRoot = workspaceRoot,
): Promise<RecoveryResult> {
  const target = await resolveCanonicalTarget(workspaceRoot, canonicalRelativePath);
  const canonicalReadToken = exactReadToken(await readFile(target));
  const evidence = await readEvidence(evidenceStorageRoot);
  const current = await currentMatterControl(evidenceStorageRoot, matterId, canonicalRelativePath);
  const prepared = evidence.filter((item) => item.objectType === "MATTER_CONTROL" && item.matterId === matterId && (item.payload as MatterControlPayload).state === "PREPARED");
  const receiptedRevisionIds = new Set(evidence
    .filter((item) => item.objectType === "MATTER_CONTROL_MUTATION_RECEIPT" && item.matterId === matterId)
    .map((item) => (item.payload as ReceiptPayload).currentRevisionId));
  const unreceiptedPrepared = prepared.filter((item) => !receiptedRevisionIds.has(item.revisionId));
  const names = await readdir(path.dirname(target));
  const orphanTemps = names.filter((name) => name.includes(".write1v.tmp")).sort();
  if (current && canonicalReadToken === current.readToken) {
    if (unreceiptedPrepared.length > 0) {
      return { code: "PREPARED_NOT_CURRENT", canonicalReadToken, currentRevisionId: current.revisionId, orphanTemps, detail: "Prepared revision exists without a successful currentness receipt" };
    }
    if (orphanTemps.length > 0) {
      return { code: "ORPHAN_TEMP_NOT_PUBLISHED", canonicalReadToken, currentRevisionId: current.revisionId, orphanTemps, detail: "Canonical matches receipt; orphan temp is not auto-published" };
    }
    return { code: "COMMITTED", canonicalReadToken, currentRevisionId: current.revisionId, orphanTemps, detail: "Canonical exact hash matches the latest successful receipt" };
  }
  if (!current && unreceiptedPrepared.length === 0 && orphanTemps.length === 0) {
    return { code: "NO_EVIDENCE", canonicalReadToken, orphanTemps, detail: "No accepted Matter Control evidence exists" };
  }
  return { code: "RECOVERY_REQUIRED", canonicalReadToken, currentRevisionId: current?.revisionId, orphanTemps, detail: "Canonical hash does not match the successful receipt chain" };
}
