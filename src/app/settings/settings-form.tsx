"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

type Result = { root: { status: "created" | "exists" | "error"; path: string }; created: string[]; existing: string[]; errors: { folder: string; message: string }[]; };

export function SettingsForm() {
  const t = useTranslations("Settings");
  const [rootPath, setRootPath] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(false);
  const [requestError, setRequestError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setRequestError(""); setResult(null);
    try {
      const response = await fetch("/api/settings/verify-structure", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rootPath }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? t("workspaceFallbackError"));
      setResult(data);
    } catch (error) { setRequestError(error instanceof Error ? error.message : t("unknownError")); }
    finally { setPending(false); }
  }
  return <div className="settings-panel"><form onSubmit={submit}>
    <label htmlFor="root-path">{t("rootPath")}</label><p className="field-help">{t("workspaceHelp")}</p>
    <input id="root-path" value={rootPath} onChange={(e) => setRootPath(e.target.value)} placeholder={t("workspacePlaceholder")} required spellCheck={false}/>
    <button type="submit" disabled={pending}>{pending ? t("verifyingStructure") : t("verifyStructure")}</button>
  </form>{(result || requestError) && <section className="result-panel" aria-live="polite"><div className="result-heading"><h2>{t("verificationResult")}</h2><span className={requestError || result?.errors.length ? "status-error" : "status-success"}>{requestError || result?.errors.length ? t("completedWithErrors") : t("completedSuccessfully")}</span></div>{requestError && <p className="error-message">{requestError}</p>}{result && <div className="result-list"><ResultRow label={t("rootFolder")} values={[`${result.root.path} — ${result.root.status}`]}/><ResultRow label={t("foldersCreated")} values={result.created}/><ResultRow label={t("foldersExisting")} values={result.existing}/><ResultRow label={t("errors")} values={result.errors.map((item) => `${item.folder}: ${item.message}`)} error/></div>}</section>}</div>;
}

function ResultRow({ label, values, error = false }: { label: string; values: string[]; error?: boolean }) { const t = useTranslations("Settings"); return <div className="result-row"><h3>{label}</h3>{values.length ? <ul className={error ? "error-list" : ""}>{values.map((value) => <li key={value}>{value}</li>)}</ul> : <p>{t("none")}</p>}</div>; }
