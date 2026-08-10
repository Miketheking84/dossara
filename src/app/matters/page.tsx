import { getTranslations } from "next-intl/server";
import { ClientMatterManager } from "./client-matter-manager";

export default async function MattersPage() { const t = await getTranslations("Matters"); return <section className="page-section matters-page"><header className="page-header"><div><h1>{t("title")}</h1><p className="page-description">{t("description")}</p></div></header><ClientMatterManager /></section>; }
