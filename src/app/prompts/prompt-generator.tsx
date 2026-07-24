"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const PROMPT_TYPES = [
  { slug: "INTAKE_AGENT", label: "Intake Agent" },
  { slug: "CONTRACT_AGENT", label: "Contract Agent" },
  { slug: "LITIGATION_AGENT", label: "Litigation Agent" },
  { slug: "CLIENT_EMAIL_AGENT", label: "Client Email Agent" },
  { slug: "CLAUDE_REVIEW", label: "Claude Review" },
  { slug: "TABULAR_REVIEW_LITE", label: "Tabular Review Lite" },
] as const;

type PromptTypeSlug = (typeof PROMPT_TYPES)[number]["slug"];

type ActiveMatter = {
  clientFolder: string;
  matterFolder: string;
  matterName: string;
};

type GeneratedInputsSnapshot = {
  clientFolder: string;
  matterFolder: string;
  promptType: PromptTypeSlug;
  additionalContext: string;
};

type GeneratedResult = {
  prompt: string;
  claudeReviewPrompt: string;
  generatedFrom: GeneratedInputsSnapshot;
  matter: ActiveMatter;
  promptType: {
    slug: string;
    label: string;
  };
};

type SavedPromptConfirmation = {
  fileName: string;
  relativePath: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isActiveMatter(value: unknown): value is ActiveMatter {
  return (
    isRecord(value) &&
    typeof value.clientFolder === "string" &&
    typeof value.matterFolder === "string" &&
    typeof value.matterName === "string"
  );
}

function readMattersResponse(value: unknown): ActiveMatter[] | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.matters) ||
    !value.matters.every(isActiveMatter)
  ) {
    return null;
  }
  return value.matters;
}

function readGenerateResponse(
  value: unknown,
  generatedFrom: GeneratedInputsSnapshot,
): GeneratedResult | null {
  if (
    !isRecord(value) ||
    typeof value.prompt !== "string" ||
    typeof value.claudeReviewPrompt !== "string" ||
    !isActiveMatter(value.matter) ||
    !isRecord(value.promptType) ||
    typeof value.promptType.slug !== "string" ||
    typeof value.promptType.label !== "string"
  ) {
    return null;
  }
  if (
    value.matter.clientFolder !== generatedFrom.clientFolder ||
    value.matter.matterFolder !== generatedFrom.matterFolder ||
    value.promptType.slug !== generatedFrom.promptType
  ) {
    return null;
  }
  return {
    prompt: value.prompt,
    claudeReviewPrompt: value.claudeReviewPrompt,
    generatedFrom,
    matter: value.matter,
    promptType: {
      slug: value.promptType.slug,
      label: value.promptType.label,
    },
  };
}

const SAFE_SAVED_PROMPT_PATH =
  /^04 AI\/\d{4}-\d{2}-\d{2}_prompt_(?:INTAKE_AGENT|CONTRACT_AGENT|LITIGATION_AGENT|CLIENT_EMAIL_AGENT|CLAUDE_REVIEW|TABULAR_REVIEW_LITE)(?:_\d{3})?\.md$/;

function readSaveResponse(value: unknown): SavedPromptConfirmation | null {
  if (
    !isRecord(value) ||
    !isRecord(value.savedPrompt) ||
    typeof value.savedPrompt.fileName !== "string" ||
    typeof value.savedPrompt.relativePath !== "string" ||
    !SAFE_SAVED_PROMPT_PATH.test(value.savedPrompt.relativePath) ||
    value.savedPrompt.relativePath !==
      `04 AI/${value.savedPrompt.fileName}`
  ) {
    return null;
  }
  return {
    fileName: value.savedPrompt.fileName,
    relativePath: value.savedPrompt.relativePath,
  };
}

function saveErrorMessage(status: number) {
  if (status === 400) {
    return "Podaci za čuvanje prompta nisu validni. Generišite prompt ponovo.";
  }
  if (status === 404) {
    return "Predmet ili potrebni lokalni fajlovi nisu dostupni.";
  }
  if (status === 409) {
    return "Prompt trenutno nije moguće sačuvati zbog konflikta imena. Pokušajte ponovo.";
  }
  return "Prompt trenutno nije moguće sačuvati. Pokušajte ponovo.";
}

function matterKey(matter: ActiveMatter) {
  return JSON.stringify([matter.clientFolder, matter.matterFolder]);
}

export function PromptGenerator() {
  const searchParams = useSearchParams();
  const initialQuerySelection = useRef({
    clientFolder: searchParams.get("clientFolder"),
    matterFolder: searchParams.get("matterFolder"),
  });

  const [matters, setMatters] = useState<ActiveMatter[]>([]);
  const [mattersLoading, setMattersLoading] = useState(true);
  const [mattersError, setMattersError] = useState("");
  const [selectedMatter, setSelectedMatter] =
    useState<ActiveMatter | null>(null);
  const [promptType, setPromptType] = useState<PromptTypeSlug | "">("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [generatePending, setGeneratePending] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [savePending, setSavePending] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [clipboardStatus, setClipboardStatus] = useState("");
  const resultVersion = useRef(0);
  const savePendingRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMatters() {
      try {
        const response = await fetch("/api/matters", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data: unknown = await response.json();
        const loadedMatters = readMattersResponse(data);
        if (!response.ok || !loadedMatters) {
          throw new Error("Invalid matters response");
        }
        setMatters(loadedMatters);
        const querySelection = initialQuerySelection.current;
        if (querySelection.clientFolder && querySelection.matterFolder) {
          const matchingMatter = loadedMatters.find(
            (matter) =>
              matter.clientFolder === querySelection.clientFolder &&
              matter.matterFolder === querySelection.matterFolder,
          );
          if (matchingMatter) setSelectedMatter(matchingMatter);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setMattersError(
          "Predmeti trenutno nisu dostupni. Pokušajte ponovo kasnije.",
        );
      } finally {
        if (!controller.signal.aborted) setMattersLoading(false);
      }
    }

    void loadMatters();
    return () => controller.abort();
  }, []);

  function invalidateResult() {
    resultVersion.current += 1;
    setResult(null);
    setGenerateError("");
    setSaveError("");
    setSaveSuccess("");
    setClipboardStatus("");
  }

  function changeMatter(value: string) {
    setSelectedMatter(
      matters.find((matter) => matterKey(matter) === value) ?? null,
    );
    invalidateResult();
  }

  function changePromptType(value: string) {
    const selectedType = PROMPT_TYPES.find(({ slug }) => slug === value);
    setPromptType(selectedType?.slug ?? "");
    invalidateResult();
  }

  async function generatePrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMatter || !promptType || generatePending) return;

    const generatedFrom: GeneratedInputsSnapshot = {
      clientFolder: selectedMatter.clientFolder,
      matterFolder: selectedMatter.matterFolder,
      promptType,
      additionalContext,
    };
    const requestVersion = resultVersion.current + 1;
    resultVersion.current = requestVersion;
    setGeneratePending(true);
    setGenerateError("");
    setResult(null);
    setSaveError("");
    setSaveSuccess("");
    setClipboardStatus("");
    try {
      const response = await fetch("/api/prompts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generatedFrom),
      });
      const data: unknown = await response.json();
      const generated = readGenerateResponse(data, generatedFrom);
      if (!response.ok || !generated) {
        throw new Error("Prompt generation failed");
      }
      if (resultVersion.current === requestVersion) {
        setResult(generated);
      }
    } catch {
      if (resultVersion.current === requestVersion) {
        setGenerateError(
          "Prompt trenutno nije moguće generisati. Proverite izbor i pokušajte ponovo.",
        );
      }
    } finally {
      setGeneratePending(false);
    }
  }

  async function copyPrompt(target: "chatgpt" | "claude") {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(
        target === "chatgpt" ? result.prompt : result.claudeReviewPrompt,
      );
      setClipboardStatus(
        target === "chatgpt"
          ? "Prompt za ChatGPT je kopiran."
          : "Claude Review prompt je kopiran.",
      );
    } catch {
      setClipboardStatus(
        "Prompt nije moguće kopirati. Označite tekst i kopirajte ga ručno.",
      );
    }
  }

  async function savePrompt() {
    if (!result || savePendingRef.current) return;

    const snapshot = result.generatedFrom;
    const requestVersion = resultVersion.current;
    savePendingRef.current = true;
    setSavePending(true);
    setSaveError("");
    setSaveSuccess("");
    try {
      const response = await fetch("/api/prompts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });
      if (!response.ok) {
        if (resultVersion.current === requestVersion) {
          setSaveError(saveErrorMessage(response.status));
        }
        return;
      }
      const data: unknown = await response.json();
      const savedPrompt = readSaveResponse(data);
      if (!savedPrompt) {
        if (resultVersion.current === requestVersion) {
          setSaveError(saveErrorMessage(500));
        }
        return;
      }
      if (resultVersion.current === requestVersion) {
        setSaveSuccess(`Sačuvano: ${savedPrompt.relativePath}`);
      }
    } catch {
      if (resultVersion.current === requestVersion) {
        setSaveError(saveErrorMessage(500));
      }
    } finally {
      savePendingRef.current = false;
      setSavePending(false);
    }
  }

  return (
    <div className="prompt-generator-layout">
      <section className="work-panel prompt-generator-form-panel">
        <div className="panel-heading">
          <div>
            <h2>Priprema prompta</h2>
            <p>Izaberite predmet i vrstu pravnog zadatka</p>
          </div>
        </div>

        <form className="prompt-generator-form" onSubmit={generatePrompt}>
          <label className="prompt-generator-field" htmlFor="prompt-matter">
            <span>Predmet</span>
            <select
              id="prompt-matter"
              value={selectedMatter ? matterKey(selectedMatter) : ""}
              onChange={(event) => changeMatter(event.target.value)}
              disabled={mattersLoading || Boolean(mattersError)}
              required
            >
              <option value="">
                {mattersLoading
                  ? "Učitavanje predmeta…"
                  : "Izaberite predmet"}
              </option>
              {matters.map((matter) => (
                <option key={matterKey(matter)} value={matterKey(matter)}>
                  {matter.matterName} — {matter.clientFolder}
                </option>
              ))}
            </select>
          </label>

          {mattersError ? (
            <p className="prompt-generator-error" role="alert">
              {mattersError}
            </p>
          ) : null}

          {!mattersLoading && !mattersError && matters.length === 0 ? (
            <p className="prompt-generator-empty">
              Nema aktivnih predmeta. Prvo kreirajte predmet u modulu Matters.
            </p>
          ) : null}

          <label className="prompt-generator-field" htmlFor="prompt-type">
            <span>Prompt tip</span>
            <select
              id="prompt-type"
              value={promptType}
              onChange={(event) => changePromptType(event.target.value)}
              required
            >
              <option value="">Izaberite prompt tip</option>
              {PROMPT_TYPES.map((type) => (
                <option key={type.slug} value={type.slug}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label className="prompt-generator-field" htmlFor="prompt-context">
            <span>Dodatni kontekst</span>
            <textarea
              id="prompt-context"
              rows={9}
              value={additionalContext}
              onChange={(event) => {
                setAdditionalContext(event.target.value);
                invalidateResult();
              }}
              placeholder="Dodajte činjenice, cilj, ograničenja ili pitanja koja nisu evidentirana u predmetu."
            />
          </label>

          <button
            className="primary-action"
            type="submit"
            disabled={
              !selectedMatter ||
              !promptType ||
              generatePending ||
              mattersLoading
            }
          >
            {generatePending ? "Generisanje…" : "Generate Prompt"}
          </button>

          {generateError ? (
            <p className="prompt-generator-error" role="alert">
              {generateError}
            </p>
          ) : null}
        </form>
      </section>

      <section className="work-panel prompt-preview-panel">
        <div className="panel-heading">
          <div>
            <h2>Pregled prompta</h2>
            <p>Word-ready tekst za ručni nastavak rada</p>
          </div>
        </div>

        {result ? (
          <div className="prompt-preview-result" aria-live="polite">
            <dl>
              <div>
                <dt>Predmet</dt>
                <dd>{result.matter.matterName}</dd>
              </div>
              <div>
                <dt>Prompt tip</dt>
                <dd>{result.promptType.label}</dd>
              </div>
            </dl>

            <div className="prompt-preview-documents">
              <section className="prompt-preview-document">
                <h3>ChatGPT prompt</h3>
                <pre tabIndex={0} aria-label="Generisani Word-ready prompt">
                  {result.prompt}
                </pre>
              </section>
              <section className="prompt-preview-document">
                <h3>Claude Review prompt</h3>
                <pre tabIndex={0} aria-label="Generisani Claude Review prompt">
                  {result.claudeReviewPrompt}
                </pre>
              </section>
            </div>

            <div className="prompt-action-groups">
              <section>
                <h3>Rad sa promptom</h3>
                <div className="prompt-action-row">
                  <button type="button" onClick={() => void copyPrompt("chatgpt")}>
                    Copy for ChatGPT
                  </button>
                  <button type="button" onClick={() => void copyPrompt("claude")}>
                    Copy for Claude Review
                  </button>
                  <button
                    type="button"
                    onClick={() => void savePrompt()}
                    disabled={savePending}
                  >
                    {savePending ? "Čuvanje…" : "Save Prompt to 04 AI"}
                  </button>
                </div>
              </section>

              <section>
                <h3>Otvori AI alat</h3>
                <div className="prompt-action-row">
                  <a
                    href="https://chatgpt.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open ChatGPT
                  </a>
                  <a
                    href="https://claude.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Claude
                  </a>
                </div>
              </section>
            </div>

            <div className="prompt-action-status" aria-live="polite">
              {clipboardStatus ? (
                <p className="prompt-clipboard-status">{clipboardStatus}</p>
              ) : null}
              {saveSuccess ? (
                <p className="prompt-save-success">{saveSuccess}</p>
              ) : null}
              {saveError ? (
                <p className="prompt-generator-error" role="alert">
                  {saveError}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="prompt-preview-empty">
            <strong>Prompt još nije generisan.</strong>
            <p>
              Izaberite predmet i prompt tip, dodajte kontekst po potrebi i
              pokrenite generisanje.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
