"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { SUPPORTED_LOCALES, type AppLocale } from "@/i18n/config";

export function LocaleSelector() {
  const t = useTranslations("Settings");
  const router = useRouter();
  const currentLocale = useLocale() as AppLocale;
  const [locale, setLocale] = useState<AppLocale>(currentLocale);
  const [pending, setPending] = useState(false);
  const [messageKey, setMessageKey] = useState<"languageSaved" | "languageSaveFailed" | null>(null);

  async function saveLocale() {
    setPending(true);
    setMessageKey(null);
    try {
      const response = await fetch("/api/settings/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      if (!response.ok) throw new Error();
      setMessageKey("languageSaved");
      router.refresh();
    } catch {
      setMessageKey("languageSaveFailed");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="settings-panel" aria-labelledby="language-settings-title">
      <h2 id="language-settings-title">{t("language")}</h2>
      <p className="field-help">{t("languageHelp")}</p>
      <label htmlFor="app-locale">{t("language")}</label>
      <select id="app-locale" value={locale} onChange={(event) => setLocale(event.target.value as AppLocale)}>
        {SUPPORTED_LOCALES.map((option) => <option key={option} value={option}>{option === "sr-Latn" ? t("serbianLatin") : t("english")}</option>)}
      </select>
      <button type="button" onClick={() => void saveLocale()} disabled={pending}>{pending ? t("savingLanguage") : t("saveLanguage")}</button>
      {messageKey ? <p role="status">{t(messageKey)}</p> : null}
    </section>
  );
}
