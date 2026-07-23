"use client";

import { FormEvent, useState } from "react";

type Result = {
  root: { status: "created" | "exists" | "error"; path: string };
  created: string[];
  existing: string[];
  errors: { folder: string; message: string }[];
};

export function SettingsForm() {
  const [rootPath, setRootPath] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(false);
  const [requestError, setRequestError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setRequestError(""); setResult(null);
    try {
      const response = await fetch("/api/settings/verify-structure", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rootPath }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Provera nije uspela.");
      setResult(data);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Došlo je do nepoznate greške.");
    } finally { setPending(false); }
  }

  return (
    <div className="settings-panel">
      <form onSubmit={submit}>
        <label htmlFor="root-path">Root folder path</label>
        <p className="field-help">Folder ostaje na ovom računaru. Aplikacija ne šalje dokumente eksternim servisima.</p>
        <input id="root-path" value={rootPath} onChange={(e) => setRootPath(e.target.value)} placeholder="Unesite odobreni SDJ MIKE test root" required spellCheck={false}/>
        <button type="submit" disabled={pending}>{pending ? "Proveravam strukturu…" : "Create / Verify SDJ_LEGAL structure"}</button>
      </form>

      {(result || requestError) && <section className="result-panel" aria-live="polite">
        <div className="result-heading"><h2>Rezultat provere</h2><span className={requestError || result?.errors.length ? "status-error" : "status-success"}>{requestError || result?.errors.length ? "Završeno sa greškama" : "Uspešno završeno"}</span></div>
        {requestError && <p className="error-message">{requestError}</p>}
        {result && <div className="result-list">
          <ResultRow label="Root folder" values={[`${result.root.path} — ${result.root.status === "created" ? "created" : result.root.status === "exists" ? "exists" : "error"}`]}/>
          <ResultRow label="Folders created" values={result.created}/>
          <ResultRow label="Folders already existed" values={result.existing}/>
          <ResultRow label="Errors" values={result.errors.map((item) => `${item.folder}: ${item.message}`)} error/>
        </div>}
      </section>}
    </div>
  );
}

function ResultRow({ label, values, error = false }: { label: string; values: string[]; error?: boolean }) {
  return <div className="result-row"><h3>{label}</h3>{values.length ? <ul className={error ? "error-list" : ""}>{values.map((value) => <li key={value}>{value}</li>)}</ul> : <p>None</p>}</div>;
}
