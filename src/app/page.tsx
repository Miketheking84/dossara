const cards = [
  { label: "Aktivni predmeti", tone: "navy" },
  { label: "Čeka se", tone: "gold" },
  { label: "Hitno", tone: "red" },
  { label: "Bez sledećeg koraka", tone: "slate" },
] as const;

export default function TodayPage() {
  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <p className="section-label">Pregled</p>
          <h1>Today</h1>
          <p className="page-description">Brzi pregled statusa vaše pravne prakse.</p>
        </div>
        <time className="date-block" dateTime="2026-07-22">22. jul 2026.</time>
      </header>

      <div className="metric-grid" aria-label="Dnevni pregled">
        {cards.map((card) => (
          <article className="metric-card" key={card.label}>
            <span className={`metric-marker ${card.tone}`} aria-hidden="true" />
            <div>
              <p>{card.label}</p>
              <strong>0</strong>
            </div>
            <span className="metric-note">Nema stavki</span>
          </article>
        ))}
      </div>
    </section>
  );
}
