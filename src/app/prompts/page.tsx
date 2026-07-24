import { Suspense } from "react";
import { PromptGenerator } from "./prompt-generator";

export default function PromptsPage() {
  return (
    <section className="page-section prompts-page">
      <header className="page-header">
        <div>
          <p className="section-label">AI rad</p>
          <h1>Prompt Generator</h1>
          <p className="page-description">
            Pripremite strukturisan pravni prompt iz podataka postojećeg
            predmeta.
          </p>
        </div>
      </header>

      <Suspense
        fallback={
          <section className="work-panel prompt-generator-loading">
            <p>Učitavanje Prompt Generatora…</p>
          </section>
        }
      >
        <PromptGenerator />
      </Suspense>
    </section>
  );
}
