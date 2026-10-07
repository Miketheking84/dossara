import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/sdj-workspace", () => ({ getActiveWorkspaceRoot: vi.fn(), getClientsRoot: vi.fn() }));
import type { ResolvedActiveMatter } from "./sdj-matters";
import { acceptCanonicalMatterBaseline, mutateCanonicalMatter, readCanonicalMatterState } from "./sdj-canonical-mutation";
import { createNextStepProposal, readAlphaState, registerAlphaEvidence, reviewNextStep, withAlphaMatterGate, type ReviewInput } from "./sdj-next-step-review";
import { exactReadToken } from "../../spikes/write-1v-v1-mutation/canonical-mutation";
const ROOT = "C:\\SDJ_TEST\\SDJ_LEGAL_TEST";
const ORIGINAL = Buffer.from("Ručna bilješka: ostaje ista\r\nKlijent: TEST\r\nPredmet: Alpha\r\nOblast prava: Ugovorno pravo\r\nVrsta predmeta: Ugovorni predmet\r\nSledeći korak: Pregled ugovora\r\n");
let workspace: string;
let matter: ResolvedActiveMatter;
let canonical: string;
beforeEach(async () => {
  await mkdir(ROOT, { recursive: true });
  workspace = await mkdtemp(path.join(ROOT, "alpha-next-step-"));
  const clientsRoot = path.join(workspace, "01 KLIJENTI");
  const clientPath = path.join(clientsRoot, "TEST");
  const matterPath = path.join(clientPath, "SDJ_ALPHA");
  matter = { workspaceRoot: workspace, clientsRoot, clientFolder: "TEST", clientPath, matterFolder: "SDJ_ALPHA", matterPath,
    controlPath: path.join(matterPath, "00 CONTROL"), ulazPath: path.join(matterPath, "01 ULAZ"), aiPath: path.join(matterPath, "04 AI"),
    radnoPath: path.join(matterPath, "02 RADNO"), finalnoPath: path.join(matterPath, "03 FINALNO") };
  await mkdir(matter.controlPath, { recursive: true });
  canonical = path.join(matter.controlPath, "command-center.md"); await writeFile(canonical, ORIGINAL);
  const state = await readCanonicalMatterState(matter); await acceptCanonicalMatterBaseline(matter, state.readToken);
}, 60000);
afterEach(async () => { if (workspace && path.relative(ROOT, workspace).startsWith("alpha-next-step-")) await rm(workspace, { recursive: true, force: true }); });
async function proposal() {
  const evidence = await registerAlphaEvidence(matter, new File(["original evidence\r\n"], "Izvor.txt", { type: "text/plain" }));
  const state = await readCanonicalMatterState(matter);
  return createNextStepProposal(matter, { evidenceId: evidence.evidenceId, originalResult: "AI NACRT: Zatražiti dopunu", nextStep: "Zatražiti dopunu",
    baseToken: state.readToken, baseRevision: state.acceptedRevisionId! });
}
async function input(decision: ReviewInput["decision"] = "approve") {
  const p = await proposal();
  return { reviewId: randomUUID(), proposalId: p.proposalId, decision, value: decision === "reject" ? "" : decision === "modify" ? "Pravnikova ispravka" : p.nextStep,
    lawyerId: "LAWYER-1", lawyerName: "Test pravnik", baseToken: p.baseToken, baseRevision: p.baseRevision } satisfies ReviewInput;
}
async function receiptCount() {
  const folder = path.join(matter.controlPath, "vla", "objects", "MATTER_CONTROL_MUTATION_RECEIPT");
  return (await readdir(folder)).length;
}
describe("bounded Alpha evidence -> nextStep", () => {
  it("refuses a no-op before saving a pending decision and permits a corrected review", async () => {
    const review = await input("modify");
    await expect(reviewNextStep(matter, { ...review, value: "Pregled ugovora" })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect((await readAlphaState(matter)).proposals[0].reviews).toHaveLength(0);
    expect((await reviewNextStep(matter, review)).code).toBe("CANONICAL_SUCCESS");
  });
  it("preserves evidence and original returned result; approves exact nextStep with attributable receipt", async () => {
    const review = await input();
    const result = await reviewNextStep(matter, review);
    expect(result.code).toBe("CANONICAL_SUCCESS");
    expect(await readFile(canonical, "utf8")).toBe(ORIGINAL.toString().replace("Pregled ugovora", "Zatražiti dopunu"));
    const state = await readAlphaState(matter); const p = state.proposals[0].proposal;
    expect(await readFile(path.join(matter.matterPath, p.evidence.relativePath), "utf8")).toBe("original evidence\r\n");
    expect(await readFile(path.join(matter.matterPath, p.originalResultPath), "utf8")).toBe("AI NACRT: Zatražiti dopunu");
    expect(state.proposals[0].reviews[0].review.lawyerId).toBe("LAWYER-1");
    if (!("transactionId" in result)) throw new Error("Missing canonical transaction identity");
    const receipt = JSON.parse(await readFile(path.join(matter.controlPath, "vla", "objects", "MATTER_CONTROL_MUTATION_RECEIPT", result.transactionId!, "revisions", `${result.transactionId}-receipt.json`), "utf8"));
    expect(receipt.envelope.createdBy).toBe("LAWYER-1: Test pravnik");
    expect(receipt.envelope.payload.source).toContain(review.reviewId);
  });
  it("rejects without changing canonical bytes or adding a successful receipt", async () => {
    const review = await input("reject"); const count = await receiptCount();
    expect(await reviewNextStep(matter, review)).toEqual({ code: "REJECTED" });
    expect(await readFile(canonical)).toEqual(ORIGINAL); expect(await receiptCount()).toBe(count);
  });
  it("modify preserves the AI proposal and writes only the lawyer's final value", async () => {
    const review = await input("modify"); await reviewNextStep(matter, review);
    expect((await readCanonicalMatterState(matter)).values.nextStep).toBe("Pravnikova ispravka");
    expect((await readAlphaState(matter)).proposals[0].proposal.nextStep).toBe("Zatražiti dopunu");
  });
  it("rejects a stale manual base and preserves the manual bytes", async () => {
    const review = await input(); const manual = Buffer.concat([ORIGINAL, Buffer.from("Manual change\r\n")]);
    await writeFile(canonical, manual);
    expect((await reviewNextStep(matter, review)).code).toBe("CONFLICT");
    expect((await readAlphaState(matter)).proposals[0].reviews[0].review.reviewId).toBe(review.reviewId);
    expect(await readFile(canonical)).toEqual(manual);
  });
  it("same review concurrent retry produces one successful receipt; changed payload is refused", async () => {
    const review = await input(); const count = await receiptCount();
    const results = await Promise.all([reviewNextStep(matter, review), reviewNextStep(matter, review)]);
    expect(results[0]).toEqual(results[1]); expect(await receiptCount()).toBe(count + 1);
    await expect(reviewNextStep(matter, { ...review, value: "Another value" })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(reviewNextStep(matter, { ...review, reviewId: randomUUID() })).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("lost response replays historical success even after a later legitimate edit", async () => {
    const review = await input(); await reviewNextStep(matter, review);
    const state = await readCanonicalMatterState(matter);
    await mutateCanonicalMatter(matter, { field: "nextStep", value: "Later manual action", expectedReadToken: state.readToken, acceptedRevisionId: state.acceptedRevisionId! });
    const count = await receiptCount(); await reviewNextStep(matter, review);
    expect(await receiptCount()).toBe(count); expect((await readCanonicalMatterState(matter)).values.nextStep).toBe("Later manual action");
  });
  it("interrupted before publication resumes the same transaction explicitly", async () => {
    const review = await input();
    expect((await reviewNextStep(matter, review, { faults: { failurePoint: "PUBLICATION" } })).code).toBe("IO_FAILED");
    expect(await readFile(canonical)).toEqual(ORIGINAL);
    await expect(withAlphaMatterGate(matter, async () => true)).rejects.toMatchObject({ code: "RECOVERY_REQUIRED" });
    expect((await reviewNextStep(matter, review, { recover: true })).code).toBe("CANONICAL_SUCCESS");
  });
  it("published without receipt blocks retry; explicit recovery finalizes receipt without rewriting bytes", async () => {
    const review = await input(); const count = await receiptCount();
    expect((await reviewNextStep(matter, review, { faults: { failurePoint: "RECEIPT_WRITE" } })).code).toBe("RECOVERY_REQUIRED");
    const published = await readFile(canonical);
    expect((await reviewNextStep(matter, review)).code).toBe("RECOVERY_REQUIRED");
    await expect(withAlphaMatterGate(matter, async () => true)).rejects.toMatchObject({ code: "RECOVERY_REQUIRED" });
    expect((await reviewNextStep(matter, review, { recover: true })).code).toBe("CANONICAL_SUCCESS");
    expect(await readFile(canonical)).toEqual(published); expect(await receiptCount()).toBe(count + 1);
  });
  it("canonical receipt survives failure before Alpha result, and replay writes only the result", async () => {
    const review = await input(); const count = await receiptCount();
    await expect(reviewNextStep(matter, review, { afterCanonical: async () => { throw new Error("simulated response/result interruption"); } })).rejects.toThrow("interruption");
    expect(await receiptCount()).toBe(count + 1);
    expect((await reviewNextStep(matter, review, { recover: true })).code).toBe("CANONICAL_SUCCESS");
    expect(await receiptCount()).toBe(count + 1);
  });
  it("does not guess recovery when published bytes were subsequently changed", async () => {
    const review = await input(); await reviewNextStep(matter, review, { faults: { failurePoint: "RECEIPT_WRITE" } });
    await writeFile(canonical, "manual uncertain result");
    expect((await reviewNextStep(matter, review, { recover: true })).code).toBe("RECOVERY_REQUIRED");
    expect(await readFile(canonical, "utf8")).toBe("manual uncertain result");
  });
  it("changed original evidence refuses apply", async () => {
    const review = await input(); const p = (await readAlphaState(matter)).proposals[0].proposal;
    await writeFile(path.join(matter.matterPath, p.evidence.relativePath), "changed source");
    await expect(reviewNextStep(matter, review)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await readFile(canonical)).toEqual(ORIGINAL);
  });
  it("corrupt durable state blocks rather than rebuilding an assumed approval", async () => {
    const review = await input();
    await writeFile(path.join(matter.controlPath, "alpha-next-step", "proposals", review.proposalId, "proposal.json"), "broken");
    await expect(reviewNextStep(matter, review)).rejects.toMatchObject({ code: "RECOVERY_REQUIRED" });
    expect(await readFile(canonical)).toEqual(ORIGINAL);
  });
  it("reclaims a dead-process lock only during explicit recovery", async () => {
    const review = await input(); await reviewNextStep(matter, review, { faults: { failurePoint: "PUBLICATION" } });
    const body = JSON.stringify({ pid: 2147483647, createdAt: new Date().toISOString() });
    await writeFile(path.join(matter.controlPath, "alpha-next-step", "writer.lock"), JSON.stringify({ body, hash: exactReadToken(Buffer.from(body)) }));
    await expect(reviewNextStep(matter, review)).rejects.toMatchObject({ code: "BUSY" });
    expect((await reviewNextStep(matter, review, { recover: true })).code).toBe("CANONICAL_SUCCESS");
  });
  it("cold module reload recovers using files rather than process memory", async () => {
    const review = await input();
    await reviewNextStep(matter, review, { faults: { failurePoint: "RECEIPT_WRITE" } });
    const before = await readFile(canonical); const count = await receiptCount();
    vi.resetModules();
    const restarted = await import("./sdj-next-step-review");
    expect((await restarted.reviewNextStep(matter, review, { recover: true })).code).toBe("CANONICAL_SUCCESS");
    expect(await receiptCount()).toBe(count + 1); expect(await readFile(canonical)).toEqual(before);
  });
  it("archive relocation releases its own lock at the destination", async () => {
    const destination = path.join(workspace, "ARCHIVED_ALPHA");
    await withAlphaMatterGate(matter, () => rename(matter.matterPath, destination), { movedMatterPath: () => destination });
    const names = await readdir(path.join(destination, "00 CONTROL", "alpha-next-step"));
    expect(names).not.toContain("writer.lock");
  });

});
