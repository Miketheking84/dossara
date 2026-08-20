"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MATTER_TYPES, isMatterType } from "@/lib/sdj-matter-classification";
import type { MatterWorkValues } from "@/lib/sdj-work-fields";

type EditableField = "matterType" | "nextStep";
type BaselineState = "BASELINE_REQUIRED" | "CURRENT" | "EXTERNAL_BASELINE_REVIEW_REQUIRED";

type CanonicalState = {
  readToken: string;
  acceptedRevisionId?: string;
  baselineState: BaselineState;
  publicationReady: boolean;
  values: { matterType: string; nextStep: string };
};

type ApiResult = Partial<CanonicalState> & {
  code?: string;
  error?: string;
  value?: string;
};

const READ_ONLY_FIELDS = [
  ["status", "status"],
  ["priority", "priority"],
  ["waitingFor", "waitingFor"],
  ["waitingDetail", "waitingDetail"],
  ["deadline", "deadline"],
] as const satisfies readonly (readonly [keyof MatterWorkValues, string])[];

export function MatterWorkEditor({
  clientFolder,
  matterFolder,
  initialMatterType,
  initialValues,
}: {
  clientFolder: string;
  matterFolder: string;
  initialMatterType: string;
  initialValues: MatterWorkValues;
}) {
  const t = useTranslations("MatterCockpit");
  const router = useRouter();
  const [matterType, setMatterType] = useState(initialMatterType);
  const [nextStep, setNextStep] = useState(initialValues.nextStep);
  const [canonical, setCanonical] = useState<CanonicalState | null>(null);
  const [requestedField, setRequestedField] = useState<EditableField | null>(null);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function loadCanonicalState(): Promise<CanonicalState> {
    const query = new URLSearchParams({ clientFolder, matterFolder });
    const response = await fetch(`/api/matters/command-center?${query.toString()}`, {
      cache: "no-store",
    });
    const data = (await response.json()) as ApiResult;
    if (!response.ok || !data.readToken || !data.baselineState || !data.values) {
      throw new Error(data.error || t("canonicalReadFailed"));
    }
    const state = data as CanonicalState;
    setCanonical(state);
    setMatterType(state.values.matterType);
    setNextStep(state.values.nextStep);
    if (!state.publicationReady) throw new Error(t("publicationUnavailable"));
    return state;
  }

  function openEditor(field: EditableField, state: CanonicalState) {
    setDraft(field === "matterType" ? state.values.matterType : state.values.nextStep);
    setEditingField(field);
    setRequestedField(null);
  }

  async function beginEditing(field: EditableField) {
    setBusy(true);
    setMessage(null);
    setRequestedField(field);
    try {
      const state = await loadCanonicalState();
      if (state.baselineState === "CURRENT" && state.acceptedRevisionId) {
        openEditor(field, state);
      } else if (state.baselineState === "BASELINE_REQUIRED") {
        setMessage({ kind: "error", text: t("baselineRequired") });
      } else {
        setMessage({ kind: "error", text: t("externalReviewRequired") });
      }
    } catch (error) {
      setRequestedField(null);
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : t("canonicalReadFailed"),
      });
    } finally {
      setBusy(false);
    }
  }

  async function acceptBaseline() {
    if (
      !canonical ||
      !canonical.publicationReady ||
      canonical.baselineState !== "BASELINE_REQUIRED"
    ) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/matters/command-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientFolder,
          matterFolder,
          expectedReadToken: canonical.readToken,
        }),
      });
      const data = (await response.json()) as ApiResult;
      if (!response.ok || !data.readToken || !data.acceptedRevisionId) {
        if (response.status === 409) await loadCanonicalState();
        throw new Error(data.error || t("baselineFailed"));
      }
      const accepted: CanonicalState = {
        ...canonical,
        baselineState: "CURRENT",
        readToken: data.readToken,
        acceptedRevisionId: data.acceptedRevisionId,
      };
      setCanonical(accepted);
      setMessage({ kind: "success", text: t("baselineAccepted") });
      if (requestedField) openEditor(requestedField, accepted);
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : t("baselineFailed"),
      });
    } finally {
      setBusy(false);
    }
  }

  function cancelEditing() {
    setEditingField(null);
    setRequestedField(null);
    setDraft("");
    setMessage(null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingField || !canonical?.acceptedRevisionId) return;
    const currentValue = editingField === "matterType" ? matterType : nextStep;
    if (draft === currentValue) {
      cancelEditing();
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/matters/command-center", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientFolder,
          matterFolder,
          field: editingField,
          value: draft,
          expectedReadToken: canonical.readToken,
          acceptedRevisionId: canonical.acceptedRevisionId,
        }),
      });
      const data = (await response.json()) as ApiResult;
      if (!response.ok || !data.readToken || !data.acceptedRevisionId) {
        if (response.status === 409) await loadCanonicalState();
        throw new Error(data.error || t("workSaveFailed"));
      }
      if (editingField === "matterType") setMatterType(draft);
      else setNextStep(draft);
      setCanonical({
        ...canonical,
        readToken: data.readToken,
        acceptedRevisionId: data.acceptedRevisionId,
        baselineState: "CURRENT",
        values: {
          matterType: editingField === "matterType" ? draft : matterType,
          nextStep: editingField === "nextStep" ? draft : nextStep,
        },
      });
      setEditingField(null);
      setDraft("");
      setMessage({ kind: "success", text: t("workSaved") });
      router.refresh();
    } catch (error) {
      setEditingField(null);
      setDraft("");
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : t("workSaveFailed"),
      });
    } finally {
      setBusy(false);
    }
  }

  const legacyMatterType = matterType !== "" && !isMatterType(matterType) ? matterType : null;

  return (
    <section className="work-panel matter-cockpit-section">
      <div className="panel-heading matter-work-heading">
        <div>
          <h2>{t("workTitle")}</h2>
          <p>{t("safeWorkDescription")}</p>
        </div>
      </div>

      <dl className="matter-cockpit-detail-grid">
        <div>
          <dt>{t("matterType")}</dt>
          <dd>{matterType || t("notSet")}</dd>
          <button type="button" disabled={busy || editingField !== null} onClick={() => void beginEditing("matterType")}>{t("editMatterType")}</button>
        </div>
        <div>
          <dt>{t("nextStep")}</dt>
          <dd>{nextStep || t("notSet")}</dd>
          <button type="button" disabled={busy || editingField !== null} onClick={() => void beginEditing("nextStep")}>{t("editNextStep")}</button>
        </div>
        {READ_ONLY_FIELDS.map(([field, label]) => (
          <div key={field}>
            <dt>{t(label)}</dt>
            <dd>{initialValues[field] || t("notSet")}</dd>
            <small>{t("readOnlyV1")}</small>
          </div>
        ))}
      </dl>

      {canonical?.baselineState === "BASELINE_REQUIRED" && canonical.publicationReady ? (
        <div className="matter-work-form-actions">
          <button type="button" disabled={busy} onClick={() => void acceptBaseline()}>
            {busy ? t("acceptingBaseline") : t("acceptBaseline")}
          </button>
        </div>
      ) : null}

      {editingField ? (
        <form className="matter-work-form" onSubmit={save}>
          {editingField === "matterType" ? (
            <label>
              <span>{t("matterType")}</span>
              <select value={draft} required onChange={(event) => setDraft(event.target.value)}>
                <option value="" disabled>{t("notSet")}</option>
                {legacyMatterType ? <option value={legacyMatterType} disabled>{legacyMatterType}</option> : null}
                {MATTER_TYPES.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          ) : (
            <label className="matter-work-wide">
              <span>{t("nextStep")}</span>
              <input required maxLength={500} value={draft} onChange={(event) => setDraft(event.target.value)} />
            </label>
          )}
          <div className="matter-work-form-actions">
            <button type="button" onClick={cancelEditing} disabled={busy}>{t("cancelEdit")}</button>
            <button type="submit" disabled={busy}>{busy ? t("savingWork") : t("saveWork")}</button>
          </div>
        </form>
      ) : null}

      {message ? <p className={message.kind === "success" ? "matter-work-message" : "matter-work-message error"} role="status">{message.text}</p> : null}
    </section>
  );
}
