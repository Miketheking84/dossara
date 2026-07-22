import { SettingsForm } from "./settings-form";

export default function SettingsPage() {
  return (
    <section className="page-section settings-page">
      <header className="page-header">
        <div><p className="section-label">Konfiguracija</p><h1>Settings</h1><p className="page-description">Podesite lokalni SDJ_LEGAL radni folder.</p></div>
      </header>
      <SettingsForm />
    </section>
  );
}
