import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { loadTodayDashboard, type DashboardMatter } from "@/lib/sdj-dashboard";

function matterHref(matter: Pick<DashboardMatter, "clientFolder" | "matterFolder">) {
  return `/matters/${encodeURIComponent(matter.clientFolder)}/${encodeURIComponent(matter.matterFolder)}`;
}

function display(value: string | null) { return value?.trim() || "—"; }

export default async function TodayPage() {
  const [dashboard, t, locale] = await Promise.all([loadTodayDashboard(), getTranslations("Today"), getLocale()]);
  const cards = [
    { key: "activeMatters", value: dashboard.summary.activeMatters, tone: "navy" },
    { key: "waitingForClient", value: dashboard.summary.waitingForClient, tone: "gold" },
    { key: "waitingForOtherParty", value: dashboard.summary.waitingForOtherParty, tone: "gold" },
    { key: "urgent", value: dashboard.summary.urgent, tone: "red" },
    { key: "noNextAction", value: dashboard.summary.noNextAction, tone: "slate" },
  ] as const;
  const today = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const labels = [["status", "status"], ["priority", "priority"], ["nextStep", "nextStep"], ["waitingFor", "waitingFor"], ["deadline", "deadline"]] as const;
  const list = (matters: DashboardMatter[], empty: string) => matters.length === 0 ? <p className="today-empty">{empty}</p> : <div className="today-matter-list">{matters.map((matter) => <Link className="today-matter-row" href={matterHref(matter)} key={`${matter.clientFolder}/${matter.matterFolder}`}><div className="today-matter-title"><span>{matter.clientName}</span><strong>{matter.matterName}</strong></div><dl>{labels.map(([label, field]) => <div key={field}><dt>{t(label)}</dt><dd>{display(matter[field])}</dd></div>)}</dl></Link>)}</div>;

  return <section className="page-section today-page"><header className="page-header"><div><p className="section-label">{t("sectionLabel")}</p><h1>{t("title")}</h1><p className="page-description">{t("description")}</p></div><time className="date-block">{today}</time></header>
    {dashboard.unavailable ? <p className="today-warning" role="status">{t("unavailable")}</p> : null}
    <div className="metric-grid" aria-label={t("summary")}>{cards.map((card) => <article className="metric-card" key={card.key}><span className={`metric-marker ${card.tone}`} aria-hidden="true"/><div><p>{t(card.key)}</p><strong>{card.value}</strong></div><span className="metric-note">{card.value === 0 ? t("noItems") : t("mattersInWorkspace")}</span></article>)}</div>
    <div className="today-section-grid"><section className="today-card"><div className="today-card-heading"><div><p>{t("priority")}</p><h2>{t("urgentMatters")}</h2></div><span>{dashboard.summary.urgent}</span></div>{list(dashboard.urgentMatters, t("noUrgentMatters"))}</section><section className="today-card"><div className="today-card-heading"><div><p>{t("waitingFor")}</p><h2>{t("waitingMatters")}</h2></div><span>{dashboard.summary.waitingForClient + dashboard.summary.waitingForOtherParty}</span></div>{list(dashboard.waitingMatters, t("noWaitingMatters"))}</section><section className="today-card"><div className="today-card-heading"><div><p>{t("nextStep")}</p><h2>{t("mattersWithoutNextAction")}</h2></div><span>{dashboard.summary.noNextAction}</span></div>{list(dashboard.noNextActionMatters, t("allHaveNextAction"))}</section></div>
    <div className="today-bottom-grid"><section className="today-card"><div className="today-card-heading"><div><p>{t("aiWork")}</p><h2>{t("recentAiPrompts")}</h2></div></div>{dashboard.recentPrompts.length ? <div className="today-recent-list">{dashboard.recentPrompts.map((prompt) => <Link href={matterHref(prompt)} key={`${prompt.clientFolder}/${prompt.matterFolder}/${prompt.fileName}`}><time dateTime={prompt.date}>{prompt.date}</time><span><strong>{prompt.promptType}</strong>{prompt.clientName} · {prompt.matterName}</span></Link>)}</div> : <p className="today-empty">{t("noSavedPrompts")}</p>}</section><section className="today-card"><div className="today-card-heading"><div><p>{t("workspace")}</p><h2>{t("recentMatters")}</h2></div></div>{dashboard.recentMatters.length ? <div className="today-recent-list">{dashboard.recentMatters.map((matter) => <Link href={matterHref(matter)} key={`${matter.clientFolder}/${matter.matterFolder}`}><span><strong>{matter.matterName}</strong>{matter.clientName}</span><span className="today-recent-status">{display(matter.status)}</span></Link>)}</div> : <p className="today-empty">{t("noMatters")}</p>}</section></div>
    <section className="today-card today-quick-actions"><div className="today-card-heading"><div><p>{t("shortcuts")}</p><h2>{t("quickActions")}</h2></div></div><div><Link href="/matters">{t("newClient")}</Link><Link href="/matters">{t("newMatter")}</Link><Link href="/prompts">{t("generatePrompt")}</Link><a href="https://chatgpt.com" target="_blank" rel="noreferrer">{t("openChatGpt")}</a><a href="https://claude.ai" target="_blank" rel="noreferrer">{t("openClaude")}</a></div></section>
  </section>;
}
