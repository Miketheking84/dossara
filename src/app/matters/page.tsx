import { MattersWorkspace } from "./matters-workspace";

export default function MattersPage() {
  return <section className="page-section matters-page"><header className="page-header"><div><p className="section-label">Predmeti i klijenti</p><h1>Matters</h1><p className="page-description">Kreirajte lokalne klijente i strukturu novog predmeta.</p></div></header><MattersWorkspace /></section>;
}
