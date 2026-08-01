import { getTranslations } from "next-intl/server";

export default async function InboxPage() { const t = await getTranslations("Inbox"); return <section className="page-section"><header className="page-header"><div><p className="section-label">{t("sectionLabel")}</p><h1>{t("title")}</h1><p className="page-description">{t("description")}</p></div></header></section>; }
