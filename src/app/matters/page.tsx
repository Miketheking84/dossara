import { getTranslations } from "next-intl/server";
import { MattersWorkspace } from "./matters-workspace";

export default async function MattersPage() { const t = await getTranslations("Matters"); return <section className="page-section matters-page"><header className="page-header"><div><p className="section-label">{t("sectionLabel")}</p><h1>{t("title")}</h1><p className="page-description">{t("description")}</p></div></header><MattersWorkspace /></section>; }
