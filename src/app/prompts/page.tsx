import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { PromptGenerator } from "./prompt-generator";

export default async function PromptsPage() {
  const t = await getTranslations("PromptGenerator");
  return <section className="page-section prompts-page"><header className="page-header"><div><p className="section-label">{t("sectionLabel")}</p><h1>{t("title")}</h1><p className="page-description">{t("description")}</p></div></header><Suspense fallback={<section className="work-panel prompt-generator-loading"><p>{t("loading")}</p></section>}><PromptGenerator /></Suspense></section>;
}
