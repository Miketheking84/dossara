"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { AlphaState, EvidenceRecord, ReviewInput } from "@/lib/sdj-next-step-review";

type Base = { readToken: string; acceptedRevisionId?: string; baselineState: string; values: { nextStep: string } };
export function NextStepReviewPanel({ clientFolder, matterFolder }: { clientFolder: string; matterFolder: string }) {
  const t = useTranslations("AlphaNextStep");
  const router = useRouter();
  const [state, setState] = useState<AlphaState | null>(null);
  const [evidence, setEvidence] = useState<EvidenceRecord | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [original, setOriginal] = useState("");
  const [proposed, setProposed] = useState("");
  const [lawyerId, setLawyerId] = useState("");
  const [lawyerName, setLawyerName] = useState("");
  const [selection, setSelection] = useState<{ proposalId: string; base: Base; value: string } | null>(null);
  const [retry, setRetry] = useState<ReviewInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [currentNextStep, setCurrentNextStep] = useState<string | null>(null);
  function outcome(code: string) {
    if (code === "CANONICAL_SUCCESS") return t("outcomeSuccess");
    if (code === "CANONICAL_SUCCESS_DERIVED_REBUILD_REQUIRED") return t("outcomeDerived");
    if (code === "REJECTED") return t("outcomeRejected");
    if (["CONFLICT", "EXTERNAL_BASELINE_REVIEW_REQUIRED"].includes(code)) return t("outcomeConflict");
    if (["RECOVERY_REQUIRED", "BUSY", "IO_FAILED"].includes(code)) return t("outcomeRecovery");
    if (["INVALID_INPUT", "VALIDATION_FAILED"].includes(code)) return t("outcomeInvalid");
    return t("error");
  }
  const endpoint = "/api/matters/next-step-review";
  const query = new URLSearchParams({ clientFolder, matterFolder }).toString();
  async function json(response: Response) {
    const data = await response.json();
    if (!response.ok) throw new Error(data.code ? outcome(data.code) : data.error ?? t("error"));
    return data;
  }
  async function base(): Promise<Base> {
    const data: Base = await json(await fetch(`/api/matters/command-center?${query}`, { cache: "no-store" }));
    if (data.baselineState !== "CURRENT" || !data.acceptedRevisionId) throw new Error(t("baseline"));
    return data;
  }
  async function load() {
    const data = await json(await fetch(`${endpoint}?${query}`, { cache: "no-store" }));
    setState(data);
    const current: Base = await json(await fetch(`/api/matters/command-center?${query}`, { cache: "no-store" }));
    setCurrentNextStep(current.values.nextStep);
    router.refresh();
  }
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setMessage("");
    try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : t("error")); }
    finally { setBusy(false); }
  }
  async function post(body: Record<string, unknown>) {
    return json(await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientFolder, matterFolder, ...body }) }));
  }
  async function register() {
    if (!file) return;
    const form = new FormData();
    form.set("clientFolder", clientFolder); form.set("matterFolder", matterFolder); form.set("evidence", file);
    setEvidence(await json(await fetch(endpoint, { method: "POST", body: form })));
    await load(); setMessage(t("done"));
  }
  async function propose() {
    if (!evidence) return;
    const current = await base();
    await post({ action: "propose", evidenceId: evidence.evidenceId, nextStep: proposed, originalResult: original,
      baseToken: current.readToken, baseRevision: current.acceptedRevisionId });
    await load(); setMessage(t("done"));
  }
  async function decide(decision: ReviewInput["decision"]) {
    if (!selection) return;
    const input: ReviewInput = { reviewId: crypto.randomUUID(), proposalId: selection.proposalId, decision,
      value: decision === "reject" ? "" : selection.value, lawyerId, lawyerName,
      baseToken: selection.base.readToken, baseRevision: selection.base.acceptedRevisionId! };
    setRetry(input);
    const result = await post({ action: "review", ...input });
    setRetry(null); setSelection(null); await load(); setMessage(outcome(result.code));
  }
  async function recover(input: ReviewInput) {
    // Exact original decision/base/operation, never a fresh approval or silent rebase.
    const result = await post({ action: "recover", reviewId: input.reviewId, proposalId: input.proposalId, decision: input.decision,
      value: input.value, lawyerId: input.lawyerId, lawyerName: input.lawyerName, baseToken: input.baseToken, baseRevision: input.baseRevision });
    setRetry(null); setSelection(null); await load(); setMessage(outcome(result.code));
  }
  function sourceLink(relativePath: string) {
    return `/api/matters/file?${new URLSearchParams({ clientFolder, matterFolder, relativePath })}`;
  }
  return <section className="work-panel matter-cockpit-section">
    <div className="panel-heading"><h2>{t("title")}</h2></div>
    <button type="button" disabled={busy} onClick={() => void run(load)}>{t("load")}</button>
    <p role="status">{message}</p>
    {currentNextStep !== null ? <p>{t("current")}: {currentNextStep || "—"}</p> : null}
    <label className="form-field">{t("evidence")}<input type="file" accept=".pdf,.docx,.xlsx,.txt,.jpg,.jpeg,.png" disabled={busy} onChange={(event) => { setFile(event.target.files?.[0] ?? null); setEvidence(null); }} /></label>
    <p>{t("selection")}</p>
    <button type="button" disabled={busy || !file} onClick={() => void run(register)}>{t("register")}</button>
    {evidence ? <p>{t("source")}: {evidence.originalName} ({evidence.hash})</p> : null}
    <label className="form-field">{t("original")}<textarea value={original} disabled={busy} onChange={(event) => setOriginal(event.target.value)} maxLength={1024 * 1024} /></label>
    <label className="form-field">{t("proposed")}<input value={proposed} disabled={busy} onChange={(event) => setProposed(event.target.value)} maxLength={500} /></label>
    <button type="button" disabled={busy || !evidence || !original.trim() || !proposed.trim()} onClick={() => void run(propose)}>{t("propose")}</button>
    <label className="form-field">{t("lawyerId")}<input value={lawyerId} onChange={(event) => setLawyerId(event.target.value)} maxLength={100} /></label>
    <label className="form-field">{t("lawyerName")}<input value={lawyerName} onChange={(event) => setLawyerName(event.target.value)} maxLength={160} /></label>
    <p>{t("attribution")}</p>
    {state?.lockPresent ? <p role="alert">{t("pending")}</p> : null}
    {state?.proposals.map(({ proposal, reviews }) => <article key={proposal.proposalId}>
      <p>{t("source")}: <a href={sourceLink(proposal.evidence.relativePath)} target="_blank" rel="noreferrer">{proposal.evidence.originalName}</a></p>
      <p><a href={sourceLink(proposal.originalResultPath)} target="_blank" rel="noreferrer">{t("original")}</a></p>
      <p>{t("proposed")}: {proposal.nextStep}</p>
      <button type="button" disabled={busy || reviews.some((item) => !item.result || ["REJECTED", "CANONICAL_SUCCESS", "CANONICAL_SUCCESS_DERIVED_REBUILD_REQUIRED"].includes(item.result.code))} onClick={() => void run(async () => {
        setSelection({ proposalId: proposal.proposalId, base: await base(), value: proposal.nextStep }); setRetry(null);
      })}>{t("review")}</button>
      <ul>{reviews.map(({ review, result }) => <li key={review.reviewId}>{review.lawyerName}: {t(review.decision)} — {result ? outcome(result.code) : t("pending")}
        {review.decision !== "reject" ? <p>{t("reviewedValue")}: {review.value}</p> : null}
        {!result ? <button type="button" disabled={busy} onClick={() => void run(() => recover(review))}>{t("recover")}</button> : null}
      </li>)}</ul>
    </article>)}
    {selection ? <div>
      <p>{t("previous")}: {selection.base.values.nextStep}</p>
      <label className="form-field">{t("value")}<input value={selection.value} maxLength={500} disabled={busy} onChange={(event) => setSelection({ ...selection, value: event.target.value })} /></label>
      <button type="button" disabled={busy || !lawyerId.trim() || !lawyerName.trim()} onClick={() => void run(() => decide("approve"))}>{t("approve")}</button>
      <button type="button" disabled={busy || !lawyerId.trim() || !lawyerName.trim()} onClick={() => void run(() => decide("modify"))}>{t("modify")}</button>
      <button type="button" disabled={busy || !lawyerId.trim() || !lawyerName.trim()} onClick={() => void run(() => decide("reject"))}>{t("reject")}</button>
    </div> : null}
    {retry ? <button type="button" disabled={busy} onClick={() => void run(() => recover(retry))}>{t("recover")}</button> : null}
  </section>;
}
