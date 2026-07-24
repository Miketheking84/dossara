import Link from "next/link";
import { loadTodayDashboard, type DashboardMatter } from "@/lib/sdj-dashboard";

function matterHref(matter: Pick<DashboardMatter, "clientFolder" | "matterFolder">) {
  return `/matters/${encodeURIComponent(matter.clientFolder)}/${encodeURIComponent(matter.matterFolder)}`;
}

function display(value: string | null) {
  return value?.trim() || "—";
}

function MatterList({ matters, empty }: { matters: DashboardMatter[]; empty: string }) {
  if (matters.length === 0) return <p className="today-empty">{empty}</p>;
  return (
    <div className="today-matter-list">
      {matters.map((matter) => (
        <Link className="today-matter-row" href={matterHref(matter)} key={`${matter.clientFolder}/${matter.matterFolder}`}>
          <div className="today-matter-title">
            <span>{matter.clientName}</span>
            <strong>{matter.matterName}</strong>
          </div>
          <dl>
            <div><dt>Status</dt><dd>{display(matter.status)}</dd></div>
            <div><dt>Prioritet</dt><dd>{display(matter.priority)}</dd></div>
            <div><dt>Sledeći korak</dt><dd>{display(matter.nextStep)}</dd></div>
            <div><dt>Čeka se od</dt><dd>{display(matter.waitingFor)}</dd></div>
            <div><dt>Rok</dt><dd>{display(matter.deadline)}</dd></div>
          </dl>
        </Link>
      ))}
    </div>
  );
}

export default async function TodayPage() {
  const dashboard = await loadTodayDashboard();
  const cards = [
    { label: "Active Matters", value: dashboard.summary.activeMatters, tone: "navy" },
    { label: "Waiting for Client", value: dashboard.summary.waitingForClient, tone: "gold" },
    { label: "Waiting for Other Party", value: dashboard.summary.waitingForOtherParty, tone: "gold" },
    { label: "Urgent", value: dashboard.summary.urgent, tone: "red" },
    { label: "No Next Action", value: dashboard.summary.noNextAction, tone: "slate" },
  ] as const;
  const today = new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date());

  return (
    <section className="page-section today-page">
      <header className="page-header">
        <div>
          <p className="section-label">Operativni pregled</p>
          <h1>Today</h1>
          <p className="page-description">Najvažnije stanje aktivnog workspacea na jednom mjestu.</p>
        </div>
        <time className="date-block">{today}</time>
      </header>

      {dashboard.unavailable ? (
        <p className="today-warning" role="status">Today podaci trenutno nisu dostupni. Provjerite aktivni workspace u Settings.</p>
      ) : null}

      <div className="metric-grid" aria-label="Dnevni pregled">
        {cards.map((card) => (
          <article className="metric-card" key={card.label}>
            <span className={`metric-marker ${card.tone}`} aria-hidden="true" />
            <div><p>{card.label}</p><strong>{card.value}</strong></div>
            <span className="metric-note">{card.value === 0 ? "Nema stavki" : "Predmeti u workspaceu"}</span>
          </article>
        ))}
      </div>

      <div className="today-section-grid">
        <section className="today-card">
          <div className="today-card-heading"><div><p>Prioritet</p><h2>Urgent matters</h2></div><span>{dashboard.summary.urgent}</span></div>
          <MatterList matters={dashboard.urgentMatters} empty="Nema hitnih predmeta." />
        </section>
        <section className="today-card">
          <div className="today-card-heading"><div><p>Čekanje</p><h2>Waiting matters</h2></div><span>{dashboard.summary.waitingForClient + dashboard.summary.waitingForOtherParty}</span></div>
          <MatterList matters={dashboard.waitingMatters} empty="Nema predmeta koji čekaju klijenta ili drugu stranu." />
        </section>
        <section className="today-card">
          <div className="today-card-heading"><div><p>Potrebna akcija</p><h2>Matters without next action</h2></div><span>{dashboard.summary.noNextAction}</span></div>
          <MatterList matters={dashboard.noNextActionMatters} empty="Svi aktivni predmeti imaju definisan sledeći korak." />
        </section>
      </div>

      <div className="today-bottom-grid">
        <section className="today-card">
          <div className="today-card-heading"><div><p>AI rad</p><h2>Recent AI Prompts</h2></div></div>
          {dashboard.recentPrompts.length ? (
            <div className="today-recent-list">
              {dashboard.recentPrompts.map((prompt) => (
                <Link href={matterHref(prompt)} key={`${prompt.clientFolder}/${prompt.matterFolder}/${prompt.fileName}`}>
                  <time dateTime={prompt.date}>{prompt.date}</time>
                  <span><strong>{prompt.promptType}</strong>{prompt.clientName} · {prompt.matterName}</span>
                </Link>
              ))}
            </div>
          ) : <p className="today-empty">Nema sačuvanih AI promptova.</p>}
        </section>
        <section className="today-card">
          <div className="today-card-heading"><div><p>Workspace</p><h2>Recent Matters</h2></div></div>
          {dashboard.recentMatters.length ? (
            <div className="today-recent-list">
              {dashboard.recentMatters.map((matter) => (
                <Link href={matterHref(matter)} key={`${matter.clientFolder}/${matter.matterFolder}`}>
                  <span><strong>{matter.matterName}</strong>{matter.clientName}</span>
                  <span className="today-recent-status">{display(matter.status)}</span>
                </Link>
              ))}
            </div>
          ) : <p className="today-empty">Nema predmeta za prikaz.</p>}
        </section>
      </div>

      <section className="today-card today-quick-actions">
        <div className="today-card-heading"><div><p>Prečice</p><h2>Quick Actions</h2></div></div>
        <div>
          <Link href="/matters">New Client</Link>
          <Link href="/matters">New Matter</Link>
          <Link href="/prompts">Generate Prompt</Link>
          <a href="https://chatgpt.com" target="_blank" rel="noreferrer">Open ChatGPT</a>
          <a href="https://claude.ai" target="_blank" rel="noreferrer">Open Claude</a>
        </div>
      </section>
    </section>
  );
}
