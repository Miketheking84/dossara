"use client";

import { useState } from "react";

type FolderTarget = "matter" | "ulaz" | "radno" | "finalno" | "ai";

const ACTIONS: readonly { target: FolderTarget; label: string }[] = [
  { target: "matter", label: "Otvori folder predmeta" },
  { target: "ulaz", label: "Otvori 01 ULAZ" },
  { target: "radno", label: "Otvori 02 RADNO" },
  { target: "finalno", label: "Otvori 03 FINALNO" },
  { target: "ai", label: "Otvori 04 AI" },
];

export function MatterFolderActions({
  clientFolder,
  matterFolder,
}: {
  clientFolder: string;
  matterFolder: string;
}) {
  const [pendingTarget, setPendingTarget] = useState<FolderTarget | null>(null);
  const [message, setMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  async function openFolder(target: FolderTarget) {
    setPendingTarget(target);
    setMessage(null);
    try {
      const response = await fetch("/api/matters/open-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientFolder, matterFolder, target }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const error =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Folder trenutno nije moguće otvoriti.";
        throw new Error(error);
      }
      setMessage({ kind: "success", text: "Folder je otvoren." });
    } catch (error) {
      setMessage({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Folder trenutno nije moguće otvoriti.",
      });
    } finally {
      setPendingTarget(null);
    }
  }

  return (
    <section className="work-panel" style={{ marginTop: "30px" }}>
      <div className="panel-heading">
        <div>
          <h2>Brze akcije</h2>
          <p>Otvorite odabrani folder aktivnog predmeta</p>
        </div>
      </div>
      <div
        className="active-matter-actions"
        style={{ flexWrap: "wrap", padding: "22px 24px" }}
        aria-busy={pendingTarget !== null}
      >
        {ACTIONS.map(({ target, label }) => (
          <button
            key={target}
            type="button"
            disabled={pendingTarget !== null}
            onClick={() => openFolder(target)}
          >
            {pendingTarget === target ? "Otvaranje…" : label}
          </button>
        ))}
      </div>
      {message ? (
        <p
          className={
            message.kind === "success"
              ? "active-matters-message"
              : "error-message"
          }
          style={{ margin: "0 24px 22px" }}
          role="status"
        >
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
