"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  MATTER_WORK_PRIORITIES,
  MATTER_WORK_STATUSES,
  MATTER_WORK_WAITING_OPTIONS,
  type MatterWorkValues,
} from "@/lib/sdj-work-fields";

const DISPLAY_FIELDS = [
  ["status", "status"],
  ["priority", "priority"],
  ["nextStep", "nextStep"],
  ["waitingFor", "waitingFor"],
  ["waitingDetail", "waitingDetail"],
  ["deadline", "deadline"],
] as const satisfies readonly (readonly [keyof MatterWorkValues, string])[];

export function MatterWorkEditor({
  clientFolder,
  matterFolder,
  initialValues,
}: {
  clientFolder: string;
  matterFolder: string;
  initialValues: MatterWorkValues;
}) {
  const t = useTranslations("MatterCockpit");
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [draft, setDraft] = useState(initialValues);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const visibleFields = DISPLAY_FIELDS.filter(([field]) => values[field] !== "");

  function setDraftField(field: keyof MatterWorkValues, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function beginEditing() {
    setDraft(values);
    setMessage(null);
    setEditing(true);
  }

  function cancelEditing() {
    setDraft(values);
    setMessage(null);
    setEditing(false);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/matters/command-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientFolder, matterFolder, values: draft }),
      });
      const data = (await response.json()) as { error?: string; values?: MatterWorkValues };
      if (!response.ok || !data.values) throw new Error(data.error || t("workSaveFailed"));
      setValues(data.values);
      setDraft(data.values);
      setEditing(false);
      setMessage({ kind: "success", text: t("workSaved") });
      router.refresh();
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : t("workSaveFailed"),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="work-panel matter-cockpit-section">
      <div className="panel-heading matter-work-heading">
        <div>
          <h2>{t("workTitle")}</h2>
          <p>{t("workDescription")}</p>
        </div>
        {!editing ? <button type="button" onClick={beginEditing}>{t("editWork")}</button> : null}
      </div>

      {editing ? (
        <form className="matter-work-form" onSubmit={save}>
          <label><span>{t("status")}</span><select value={draft.status} onChange={(event) => setDraftField("status", event.target.value)}><option value="">{t("notSet")}</option>{MATTER_WORK_STATUSES.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label><span>{t("priority")}</span><select value={draft.priority} onChange={(event) => setDraftField("priority", event.target.value)}><option value="">{t("notSet")}</option>{MATTER_WORK_PRIORITIES.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="matter-work-wide"><span>{t("nextStep")}</span><textarea rows={3} maxLength={500} value={draft.nextStep} onChange={(event) => setDraftField("nextStep", event.target.value)} /></label>
          <label><span>{t("deadline")}</span><input type="date" value={draft.deadline} onChange={(event) => setDraftField("deadline", event.target.value)} /></label>
          <label><span>{t("waitingFor")}</span><select value={draft.waitingFor} onChange={(event) => setDraftField("waitingFor", event.target.value)}><option value="">{t("notSet")}</option>{MATTER_WORK_WAITING_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="matter-work-wide"><span>{t("waitingDetail")}</span><input maxLength={500} value={draft.waitingDetail} onChange={(event) => setDraftField("waitingDetail", event.target.value)} /></label>
          <div className="matter-work-form-actions">
            <button type="button" onClick={cancelEditing} disabled={saving}>{t("cancelEdit")}</button>
            <button type="submit" disabled={saving}>{saving ? t("savingWork") : t("saveWork")}</button>
          </div>
        </form>
      ) : visibleFields.length > 0 ? (
        <dl className="matter-cockpit-detail-grid">
          {visibleFields.map(([field, label]) => (
            <div key={field}>
              <dt>{t(label)}</dt>
              <dd>{values[field]}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="matter-cockpit-empty">{t("workEmpty")}</p>
      )}

      {message ? <p className={message.kind === "success" ? "matter-work-message" : "matter-work-message error"} role="status">{message.text}</p> : null}
    </section>
  );
}
