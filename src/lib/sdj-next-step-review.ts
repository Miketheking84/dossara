import "server-only";

import { randomUUID } from "node:crypto";
import { link, lstat, open, readFile, readdir, realpath, unlink } from "node:fs/promises";
import path from "node:path";
import { applyReviewedNextStep, readCanonicalMatterState } from "./sdj-canonical-mutation";
import { ensureSafeDirectoryForMutation, type ResolvedActiveMatter } from "./sdj-matters";
import { validateInitialDocuments } from "./sdj-initial-documents";
import { exactReadToken, losslessTransform, type MutationHarnessOptions } from "../../spikes/write-1v-v1-mutation/canonical-mutation";
import type { MutationResult } from "../../spikes/write-1v-v1-mutation/contracts";

// Only one evidence -> nextStep review flow. Not a general legal-state store.
const PERMITTED_ROOT = "C:\\SDJ_TEST\\SDJ_LEGAL_TEST";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const queues = new Map<string, Promise<void>>();
export class AlphaReviewError extends Error {
  constructor(readonly code: "INVALID_INPUT" | "CONFLICT" | "BUSY" | "RECOVERY_REQUIRED", message: string) {
    super(message);
  }
}
function fail(code: AlphaReviewError["code"], message: string): never { throw new AlphaReviewError(code, message); }
function id(value: string) { if (!UUID.test(value)) fail("INVALID_INPUT", "Invalid workflow identity"); return value; }
function text(value: string, limit: number) {
  if (typeof value !== "string" || !value.trim() || value.length > limit || /[\u0000-\u001f]/u.test(value)) fail("INVALID_INPUT", "Invalid single-line value");
  return value.trim();
}
function matterKey(matter: ResolvedActiveMatter) { return `${matter.clientFolder}/${matter.matterFolder}`; }
async function root(matter: ResolvedActiveMatter) {
  const lexical = path.relative(path.resolve(PERMITTED_ROOT), path.resolve(matter.matterPath));
  if (!lexical || lexical.startsWith("..") || path.isAbsolute(lexical)) fail("INVALID_INPUT", "Only the permitted test root is supported");
  const permitted = await realpath(PERMITTED_ROOT);
  const actual = await realpath(matter.matterPath);
  const relative = path.relative(permitted, actual);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) fail("INVALID_INPUT", "Only the permitted test root is supported");
  const control = await ensureSafeDirectoryForMutation(actual, "00 CONTROL");
  return ensureSafeDirectoryForMutation(control, "alpha-next-step");
}
async function safeFile(file: string) {
  const info = await lstat(file);
  if (!info.isFile() || info.isSymbolicLink() || info.size > 26 * 1024 * 1024) fail("RECOVERY_REQUIRED", "Unsafe workflow file");
  const resolved = await realpath(file);
  if (resolved.toLowerCase() !== path.resolve(file).toLowerCase()) fail("RECOVERY_REQUIRED", "Workflow file redirected");
}
async function bytes(file: string) { await safeFile(file); return readFile(file); }
async function exists(file: string) {
  try { await lstat(file); return true; } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error; }
}
async function writeBytes(file: string, value: Uint8Array) {
  // Publish complete bytes create-only. A crash cannot expose a partial JSON
  // record or replace an existing review/lock/result.
  const temporary = `${file}.${randomUUID()}.part`;
  const handle = await open(temporary, "wx");
  try {
    try { await handle.writeFile(value); await handle.sync(); } finally { await handle.close(); }
    await link(temporary, file);
  } finally { await unlink(temporary).catch((error) => { if (error.code !== "ENOENT") throw error; }); }
}
async function record(file: string, value: unknown) {
  const body = JSON.stringify(value);
  await writeBytes(file, Buffer.from(JSON.stringify({ body, hash: exactReadToken(Buffer.from(body)) }), "utf8"));
}
async function readRecord<T>(file: string): Promise<T> {
  try {
    const stored = JSON.parse((await bytes(file)).toString("utf8")) as { body: string; hash: string };
    if (typeof stored.body !== "string" || exactReadToken(Buffer.from(stored.body)) !== stored.hash) fail("RECOVERY_REQUIRED", "Workflow integrity mismatch");
    return JSON.parse(stored.body) as T;
  } catch (error) {
    if (error instanceof AlphaReviewError) throw error;
    fail("RECOVERY_REQUIRED", "Workflow record cannot be verified");
  }
}
export type EvidenceRecord = { version: 1; evidenceId: string; matter: string; originalName: string; relativePath: string; size: number; hash: string; registeredAt: string };
export type ProposalRecord = { version: 1; proposalId: string; matter: string; evidence: EvidenceRecord; originalResultPath: string; originalResultHash: string;
  nextStep: string; baseRevision: string; baseToken: string; previousValue: string; createdAt: string };
export type ReviewInput = { reviewId: string; proposalId: string; decision: "approve" | "modify" | "reject"; value: string; lawyerId: string; lawyerName: string; baseRevision: string; baseToken: string };
type ReviewRecord = ReviewInput & { version: 1; proposalHash: string; decidedAt: string };
type Intent = { version: 1; reviewId: string; reviewHash: string; transactionId: string; resultingRevisionId: string;
  acceptedRevisionId: string; expectedReadToken: string; resultingReadToken: string; value: string; actor: string; source: string; recordedAt: string };
export type AlphaState = { proposals: Array<{ proposal: ProposalRecord; reviews: Array<{ review: ReviewRecord; result?: MutationResult | { code: "REJECTED" | "CONFLICT" } }> }>; lockPresent: boolean };
async function directory(parent: string, name: string) { return ensureSafeDirectoryForMutation(parent, name); }
async function proposalDirectory(matter: ResolvedActiveMatter, proposalId: string) { return directory(await directory(await root(matter), "proposals"), id(proposalId)); }

async function pending(workflowRoot: string) {
  const proposals = path.join(workflowRoot, "proposals");
  if (!await exists(proposals)) return false;
  for (const entry of await readdir(proposals, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink() || !UUID.test(entry.name)) fail("RECOVERY_REQUIRED", "Unsafe proposal directory");
    const reviews = path.join(await directory(proposals, entry.name), "reviews");
    if (!await exists(reviews)) continue;
    for (const review of await readdir(reviews, { withFileTypes: true })) {
      if (!review.isDirectory() || review.isSymbolicLink() || !UUID.test(review.name)) fail("RECOVERY_REQUIRED", "Unsafe review directory");
      const rd = await directory(reviews, review.name);
      if (await exists(path.join(rd, "intent.json")) && !await exists(path.join(rd, "result.json"))) return true;
      if (await exists(path.join(rd, "result.json"))) await readRecord(path.join(rd, "result.json"));
    }
  }
  return false;
}

// Shared with the existing manual canonical and archive routes. A crashed owner
// can be reclaimed only by explicit recovery, never by ordinary save or retry.
export async function withAlphaMatterGate<T>(matter: ResolvedActiveMatter, action: () => Promise<T>, options: { allowPending?: boolean; recoverLock?: boolean; movedMatterPath?: () => string | undefined } = {}): Promise<T> {
  const key = matter.matterPath.toLowerCase();
  const previous = queues.get(key) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => { release = resolve; });
  const tail = previous.then(() => current);
  queues.set(key, tail);
  await previous;
  let lock: string | undefined;
  let owned = false;
  try {
    const workflowRoot = await root(matter);
    lock = path.join(workflowRoot, "writer.lock");
    if (await exists(lock)) {
      if (!options.recoverLock) fail("BUSY", "Alpha writer requires explicit recovery");
      const owner = await readRecord<{ pid: number }>(lock);
      if (!Number.isSafeInteger(owner.pid) || owner.pid <= 0) fail("RECOVERY_REQUIRED", "Unverifiable lock owner");
      try { process.kill(owner.pid, 0); fail("BUSY", "Writer process is still active"); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error; }
      await unlink(lock);
    }
    try { await record(lock, { pid: process.pid, createdAt: new Date().toISOString() }); owned = true; }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "EEXIST") fail("BUSY", "Another writer is active"); throw error; }
    if (!options.allowPending && await pending(workflowRoot)) fail("RECOVERY_REQUIRED", "An Alpha apply must be reconciled first");
    return await action();
  } finally {
    try { if (owned && lock) {
      const moved = options.movedMatterPath?.();
      if (moved) {
        const permitted = await realpath(PERMITTED_ROOT);
        const target = await realpath(moved);
        const relative = path.relative(permitted, target);
        if (relative.startsWith("..") || path.isAbsolute(relative)) fail("RECOVERY_REQUIRED", "Moved lock escaped test root");
        lock = path.join(target, "00 CONTROL", "alpha-next-step", "writer.lock");
      }
      await safeFile(lock);
      await unlink(lock);
    } }
    finally { release(); if (queues.get(key) === tail) queues.delete(key); }
  }
}

export async function registerAlphaEvidence(matter: ResolvedActiveMatter, file: File): Promise<EvidenceRecord> {
  const validation = validateInitialDocuments([{ name: file.name, size: file.size, mimeType: file.type }]);
  if (!validation.valid || file.size > 25 * 1024 * 1024) fail("INVALID_INPUT", "Evidence must be one supported file up to 25 MiB");
  return withAlphaMatterGate(matter, async () => {
    const evidenceId = randomUUID();
    const input = Buffer.from(await file.arrayBuffer());
    if (input.length !== file.size) fail("INVALID_INPUT", "Evidence size changed");
    const ulaz = await directory(matter.matterPath, "01 ULAZ");
    const folder = await directory(await directory(ulaz, "ALPHA NEXT STEP"), evidenceId);
    const name = validation.documents![0].name;
    const destination = path.join(folder, name);
    await writeBytes(destination, input);
    const value: EvidenceRecord = { version: 1, evidenceId, matter: matterKey(matter), originalName: file.name,
      relativePath: path.relative(matter.matterPath, destination), size: input.length, hash: exactReadToken(input), registeredAt: new Date().toISOString() };
    await record(path.join(await directory(await root(matter), "evidence"), `${evidenceId}.json`), value);
    return value;
  });
}
async function checkEvidence(matter: ResolvedActiveMatter, evidence: EvidenceRecord) {
  id(evidence.evidenceId);
  if (evidence.matter !== matterKey(matter) || path.isAbsolute(evidence.relativePath) || evidence.relativePath.split(/[\\/]/).includes("..")) fail("RECOVERY_REQUIRED", "Evidence reference mismatch");
  const expectedParent = await directory(await directory(await directory(matter.matterPath, "01 ULAZ"), "ALPHA NEXT STEP"), evidence.evidenceId);
  const target = path.join(matter.matterPath, evidence.relativePath);
  if (path.dirname(target).toLowerCase() !== expectedParent.toLowerCase()) fail("RECOVERY_REQUIRED", "Evidence path mismatch");
  const original = await bytes(target);
  if (original.length !== evidence.size || exactReadToken(original) !== evidence.hash) fail("CONFLICT", "Original evidence changed; register it as new evidence");
}
export async function createNextStepProposal(matter: ResolvedActiveMatter, input: { evidenceId: string; nextStep: string; originalResult: string; baseToken: string; baseRevision: string }) {
  const nextStep = text(input.nextStep, 500);
  if (!input.originalResult.trim() || Buffer.byteLength(input.originalResult) > 1024 * 1024) fail("INVALID_INPUT", "Original returned result is required (up to 1 MiB)");
  return withAlphaMatterGate(matter, async () => {
    const state = await readCanonicalMatterState(matter);
    if (state.baselineState !== "CURRENT" || state.readToken !== input.baseToken || state.acceptedRevisionId !== input.baseRevision) fail("CONFLICT", "Reload and review the accepted matter baseline");
    const evidence = await readRecord<EvidenceRecord>(path.join(await directory(await root(matter), "evidence"), `${id(input.evidenceId)}.json`));
    await checkEvidence(matter, evidence);
    const proposalId = randomUUID();
    const ai = await directory(await directory(await directory(matter.matterPath, "04 AI"), "ALPHA NEXT STEP"), proposalId);
    const originalPath = path.join(ai, "original-result.txt");
    const original = Buffer.from(input.originalResult, "utf8");
    await writeBytes(originalPath, original);
    const proposal: ProposalRecord = { version: 1, proposalId, matter: matterKey(matter), evidence,
      originalResultPath: path.relative(matter.matterPath, originalPath), originalResultHash: exactReadToken(original), nextStep,
      baseRevision: input.baseRevision, baseToken: input.baseToken, previousValue: state.values.nextStep, createdAt: new Date().toISOString() };
    await record(path.join(await proposalDirectory(matter, proposalId), "proposal.json"), proposal);
    return proposal;
  });
}
async function checkedProposal(matter: ResolvedActiveMatter, proposalId: string) {
  const proposal = await readRecord<ProposalRecord>(path.join(await proposalDirectory(matter, proposalId), "proposal.json"));
  if (proposal.matter !== matterKey(matter) || proposal.proposalId !== proposalId) fail("RECOVERY_REQUIRED", "Wrong proposal matter");
  await checkEvidence(matter, proposal.evidence);
  const ai = await directory(await directory(await directory(matter.matterPath, "04 AI"), "ALPHA NEXT STEP"), proposalId);
  if (proposal.originalResultPath !== path.relative(matter.matterPath, path.join(ai, "original-result.txt")) ||
      exactReadToken(await bytes(path.join(ai, "original-result.txt"))) !== proposal.originalResultHash) fail("CONFLICT", "Original AI result changed");
  return proposal;
}
export async function reviewNextStep(matter: ResolvedActiveMatter, input: ReviewInput, options: MutationHarnessOptions & { recover?: boolean; afterCanonical?: () => Promise<void> } = {}) {
  id(input.reviewId); id(input.proposalId);
  if (!/^sha256:[0-9a-f]{64}$/u.test(input.baseToken)) fail("INVALID_INPUT", "Invalid base token");
  text(input.baseRevision, 200);
  text(input.lawyerId, 100); text(input.lawyerName, 160);
  if (!["approve", "modify", "reject"].includes(input.decision)) fail("INVALID_INPUT", "Invalid review decision");
  if (input.decision !== "reject") text(input.value, 500);
  return withAlphaMatterGate(matter, async () => {
    const rd = await directory(await directory(await proposalDirectory(matter, input.proposalId), "reviews"), input.reviewId);
    const reviewPath = path.join(rd, "review.json");
    const resultPath = path.join(rd, "result.json");
    let review: ReviewRecord;
    if (await exists(reviewPath)) {
      review = await readRecord<ReviewRecord>(reviewPath);
      if ((Object.keys(input) as Array<keyof ReviewInput>).some((key) => review[key] !== input[key])) fail("INVALID_INPUT", "Review identity reused with a different payload");
      if (await exists(resultPath)) return readRecord<MutationResult | { code: "REJECTED" | "CONFLICT" }>(resultPath);
    } else {
      if (await pending(await root(matter))) fail("RECOVERY_REQUIRED", "Reconcile the pending apply first");
      const reviews = path.dirname(rd);
      for (const item of await readdir(reviews, { withFileTypes: true })) {
        if (item.name === input.reviewId) continue;
        const resultFile = path.join(await directory(reviews, id(item.name)), "result.json");
        if (await exists(resultFile)) {
          const result = await readRecord<{ code: string }>(resultFile);
          if (["CANONICAL_SUCCESS", "CANONICAL_SUCCESS_DERIVED_REBUILD_REQUIRED", "REJECTED"].includes(result.code)) fail("CONFLICT", "Proposal already has a final decision");
        }
      }
      const proposal = await checkedProposal(matter, input.proposalId);
      if (input.decision === "approve" && input.value !== proposal.nextStep) fail("INVALID_INPUT", "Changed value requires modify decision");
      const state = await readCanonicalMatterState(matter);
      if (input.decision !== "reject" && state.baselineState === "CURRENT" && state.readToken === input.baseToken && state.acceptedRevisionId === input.baseRevision && state.values.nextStep === input.value) fail("INVALID_INPUT", "Proposal would not change nextStep");
      review = { ...input, version: 1, proposalHash: exactReadToken(Buffer.from(JSON.stringify(proposal))), decidedAt: new Date().toISOString() };
      await record(reviewPath, review);
      if (state.baselineState !== "CURRENT" || state.readToken !== input.baseToken || state.acceptedRevisionId !== input.baseRevision) {
        const result = { code: "CONFLICT" as const }; await record(resultPath, result); return result;
      }
    }
    if (review.decision === "reject") { const result = { code: "REJECTED" as const }; await record(resultPath, result); return result; }
    const proposal = await checkedProposal(matter, input.proposalId);
    if (exactReadToken(Buffer.from(JSON.stringify(proposal))) !== review.proposalHash) fail("RECOVERY_REQUIRED", "Reviewed proposal changed");
    const intentPath = path.join(rd, "intent.json");
    let intent: Intent;
    if (await exists(intentPath)) intent = await readRecord<Intent>(intentPath);
    else {
      const canonicalBytes = await bytes(path.join(matter.controlPath, "command-center.md"));
      if (exactReadToken(canonicalBytes) !== review.baseToken) {
        const result = { code: "CONFLICT" as const }; await record(resultPath, result); return result;
      }
      const resultingReadToken = exactReadToken(losslessTransform(canonicalBytes, [{ field: "nextStep", value: review.value }]));
      if (resultingReadToken === review.baseToken) fail("INVALID_INPUT", "Proposal would not change nextStep");
      intent = { version: 1, reviewId: review.reviewId, reviewHash: exactReadToken(Buffer.from(JSON.stringify(review))),
        transactionId: randomUUID(), resultingRevisionId: randomUUID(), acceptedRevisionId: review.baseRevision,
        expectedReadToken: review.baseToken, resultingReadToken, value: review.value, actor: `${review.lawyerId}: ${review.lawyerName}`,
        source: `ALPHA-NEXT-STEP/${review.proposalId}/${review.reviewId}`, recordedAt: review.decidedAt };
      await record(intentPath, intent);
    }
    if (intent.reviewHash !== exactReadToken(Buffer.from(JSON.stringify(review))) || intent.reviewId !== review.reviewId || intent.value !== review.value ||
        intent.acceptedRevisionId !== review.baseRevision || intent.expectedReadToken !== review.baseToken) fail("RECOVERY_REQUIRED", "Apply intent mismatch");
    const result = await applyReviewedNextStep(matter, intent, { ...options, recoverPublished: options.recover });
    if (["CANONICAL_SUCCESS", "CANONICAL_SUCCESS_DERIVED_REBUILD_REQUIRED"].includes(result.code) && result.resultingReadToken !== intent.resultingReadToken) fail("RECOVERY_REQUIRED", "Apply result differs from reviewed bytes");
    await options.afterCanonical?.();
    if (result.code === "CANONICAL_SUCCESS" || result.code === "CANONICAL_SUCCESS_DERIVED_REBUILD_REQUIRED" || result.code === "CONFLICT" || result.code === "EXTERNAL_BASELINE_REVIEW_REQUIRED" || result.code === "VALIDATION_FAILED") {
      await record(resultPath, result);
    }
    return result;
  }, { allowPending: true, recoverLock: options.recover });
}
export async function readAlphaState(matter: ResolvedActiveMatter): Promise<AlphaState> {
  const workflowRoot = await root(matter);
  const proposals: AlphaState["proposals"] = [];
  const pd = await directory(workflowRoot, "proposals");
  for (const entry of await readdir(pd, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink() || !UUID.test(entry.name)) fail("RECOVERY_REQUIRED", "Unsafe proposal directory");
    const folder = await directory(pd, entry.name);
    const proposal = await readRecord<ProposalRecord>(path.join(folder, "proposal.json"));
    const reviews: AlphaState["proposals"][number]["reviews"] = [];
    const rd = await directory(folder, "reviews");
    for (const entry of await readdir(rd, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.isSymbolicLink() || !UUID.test(entry.name)) fail("RECOVERY_REQUIRED", "Unsafe review directory");
      const folder = await directory(rd, entry.name);
      if (!await exists(path.join(folder, "review.json"))) continue;
      const review = await readRecord<ReviewRecord>(path.join(folder, "review.json"));
      const result = await exists(path.join(folder, "result.json")) ? await readRecord<MutationResult>(path.join(folder, "result.json")) : undefined;
      reviews.push({ review, result });
    }
    proposals.push({ proposal, reviews });
  }
  return { proposals, lockPresent: await exists(path.join(workflowRoot, "writer.lock")) };
}
