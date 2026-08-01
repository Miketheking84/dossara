import { getTranslations } from "next-intl/server";
import { SettingsForm } from "./settings-form";
import { LocaleSelector } from "./locale-selector";

export default async function SettingsPage() {
  const t = await getTranslations("Settings");

  return (
    <section className="page-section settings-page">
      <header className="page-header">
        <div><p className="section-label">{t("sectionLabel")}</p><h1>{t("title")}</h1><p className="page-description">{t("description")}</p></div>
      </header>
      <LocaleSelector />
      <SettingsForm />
    </section>
  );
}
