"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { validateInitialDocuments } from "@/lib/sdj-initial-documents";

type Matter = {
  clientFolder: string;
  clientName: string;
  matterFolder: string;
  matterName: string;
  legalArea: string;
  status: string;
  nextStep: string;
  deadline: string;
};

type CreatedMatter = {
  clientFolder: string;
  matterFolder: string;
};

const LEGAL_AREAS = ["Opšte", "Ugovorno pravo", "Privredno pravo", "Parnica / sudski spor", "Naplata potraživanja", "Radno pravo", "Real estate / nepokretnosti", "Upravni / inspekcijski postupak", "Poresko / finansijsko", "Korporativno pravo", "Stečaj / blokada", "Izvršenje", "Drugo"];
const STATUSES = ["Aktivan", "Čeka klijenta", "Čeka drugu stranu", "Čeka sud / organ", "U izradi", "Za finalizaciju"];
const PRIORITIES = ["Nizak", "Srednji", "Visok", "Hitno"];
const ACCEPTED_FILES = ".pdf,.docx,.xlsx,.txt,.jpg,.jpeg,.png";

function today() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function humanize(folder: string) {
  return folder.replace(/_/g, " ").toLocaleLowerCase("sr-Latn").replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase("sr-Latn"));
}

function searchable(value: string) {
  return value.toLocaleLowerCase("sr-Latn").replace(/_/g, " ");
}

export function ClientMatterManager() {
  const [clients, setClients] = useState<string[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showClientForm, setShowClientForm] = useState(false);
  const [showMatterForm, setShowMatterForm] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [creatingMatter, setCreatingMatter] = useState(false);
  const [matterName, setMatterName] = useState("");
  const [openingDate, setOpeningDate] = useState(today);
  const [legalArea, setLegalArea] = useState("Opšte");
  const [status, setStatus] = useState("Aktivan");
  const [priority, setPriority] = useState("Srednji");
  const [nextStep, setNextStep] = useState("");
  const [deadline, setDeadline] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);
  const [createdMatter, setCreatedMatter] = useState<CreatedMatter | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadWorkspace(preferredClient?: string) {
    const [clientsResponse, mattersResponse] = await Promise.all([
      fetch("/api/clients", { cache: "no-store" }),
      fetch("/api/matters", { cache: "no-store" }),
    ]);
    const clientsData = await clientsResponse.json();
    const mattersData = await mattersResponse.json();
    if (!clientsResponse.ok) throw new Error(clientsData.error);
    if (!mattersResponse.ok) throw new Error(mattersData.error);
    setClients(clientsData.clients);
    setMatters(mattersData.matters);
    setSelectedClient((current) => preferredClient || current || clientsData.clients[0] || "");
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [clientsResponse, mattersResponse] = await Promise.all([
          fetch("/api/clients", { cache: "no-store" }),
          fetch("/api/matters", { cache: "no-store" }),
        ]);
        const clientsData = await clientsResponse.json();
        const mattersData = await mattersResponse.json();
        if (!clientsResponse.ok) throw new Error(clientsData.error);
        if (!mattersResponse.ok) throw new Error(mattersData.error);
        if (!active) return;
        setClients(clientsData.clients);
        setMatters(mattersData.matters);
        setSelectedClient(clientsData.clients[0] || "");
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Podaci trenutno nijesu dostupni.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const counts = useMemo(() => {
    const result = new Map<string, number>();
    for (const matter of matters) result.set(matter.clientFolder, (result.get(matter.clientFolder) ?? 0) + 1);
    return result;
  }, [matters]);
  const clientMatters = useMemo(() => matters.filter((matter) => matter.clientFolder === selectedClient), [matters, selectedClient]);
  const clientName = clientMatters.find((matter) => matter.clientName)?.clientName || humanize(selectedClient);
  const query = searchable(deferredSearch.trim());
  const filteredClients = useMemo(() => clients.filter((client) => {
    const knownName = matters.find((matter) => matter.clientFolder === client)?.clientName || humanize(client);
    return !query || searchable(client).includes(query) || searchable(knownName).includes(query);
  }), [clients, matters, query]);

  async function createClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newClientName }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await loadWorkspace(data.client);
      setNewClientName("");
      setShowClientForm(false);
      setMessage("Klijent je kreiran.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Klijent nije kreiran.");
    }
  }

  function chooseDocuments(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    const validation = validateInitialDocuments(files.map((file) => ({ name: file.name, size: file.size, mimeType: file.type })));
    if (!validation.valid) {
      setMessage("Izabrani fajlovi nijesu prihvaćeni. Provjerite tip, broj i veličinu fajlova.");
      event.currentTarget.value = "";
      return;
    }
    setDocuments(files);
    setMessage("");
  }

  async function createMatter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingMatter(true);
    setMessage("");
    setCreatedMatter(null);
    const payload = { client: selectedClient, matterName, openingDate, legalArea, status, priority, description: "", nextStep, expectedOutput: "", deadline, waitingFrom: "Niko / nije primenljivo", waitingDetail: "", folderNameOverride: "" };
    try {
      let response: Response;
      if (documents.length) {
        const body = new FormData();
        for (const [key, value] of Object.entries(payload)) body.append(key, value);
        for (const file of documents) body.append("initialDocuments", file, file.name);
        response = await fetch("/api/matters", { method: "POST", body });
      } else {
        response = await fetch("/api/matters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await loadWorkspace(selectedClient);
      setCreatedMatter({ clientFolder: data.clientFolder, matterFolder: data.matterFolder });
      setMatterName(""); setNextStep(""); setDeadline(""); setDocuments([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage("Predmet je kreiran i dodat klijentu.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Predmet nije kreiran.");
    } finally {
      setCreatingMatter(false);
    }
  }

  return <div className="client-matter-manager">
    <aside className="client-directory">
      <div className="client-directory-heading"><div><h2>Klijenti</h2><p>{clients.length} lokalnih klijenata</p></div><button type="button" onClick={() => setShowClientForm((value) => !value)}>{showClientForm ? "Otkaži" : "Novi klijent"}</button></div>
      {showClientForm ? <form className="client-create-inline" onSubmit={createClient}><label htmlFor="new-client-name">Naziv klijenta</label><input id="new-client-name" value={newClientName} onChange={(event) => setNewClientName(event.target.value)} autoFocus required/><button type="submit">Kreiraj</button></form> : null}
      <label className="client-search"><span>Pretraži klijente</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Unesite najmanje tri slova…"/></label>
      <div className="client-list">{loading ? <p>Učitavanje…</p> : filteredClients.length ? filteredClients.map((client) => {
        const name = matters.find((matter) => matter.clientFolder === client)?.clientName || humanize(client);
        return <button type="button" className={selectedClient === client ? "selected" : ""} onClick={() => { setSelectedClient(client); setShowMatterForm(false); setCreatedMatter(null); }} key={client}><span>{name.slice(0, 2).toLocaleUpperCase("sr-Latn")}</span><strong>{name}</strong><small>{counts.get(client) ?? 0}</small></button>;
      }) : <p>Nema klijenata za ovu pretragu.</p>}</div>
    </aside>

    <main className="client-workspace">{selectedClient ? <>
      <header className="client-profile-header"><div><p>Klijent</p><h2>{clientName}</h2></div><button type="button" className="primary-action" onClick={() => { setShowMatterForm((value) => !value); setCreatedMatter(null); setMessage(""); }}>{showMatterForm ? "Zatvori formu" : "Novi predmet"}</button></header>
      <section className="client-overview"><div><h3>Osnovni podaci</h3><p>Kontakt, matični broj, PIB, sjedište i web adresa još nijesu evidentirani.</p></div><div><h3>Povezana lica</h3><p>Nema evidentiranih povezanih lica.</p></div></section>

      {showMatterForm ? <section className="matter-create-section"><div className="matter-create-heading"><h3>Novi predmet za {clientName}</h3><p>Unesite poznate podatke. Ostalo možete dopuniti kasnije u Kokpitu.</p></div><form className="matter-form compact-matter-form" onSubmit={createMatter}>
        <label className="form-field"><span>Naziv predmeta</span><input value={matterName} onChange={(event) => setMatterName(event.target.value)} placeholder="npr. naplata potraživanja" required/></label>
        <label className="form-field"><span>Oblast prava</span><select value={legalArea} onChange={(event) => setLegalArea(event.target.value)}>{LEGAL_AREAS.map((area) => <option key={area}>{area}</option>)}</select></label>
        <label className="form-field"><span>Datum otvaranja</span><input type="date" value={openingDate} onChange={(event) => setOpeningDate(event.target.value)} required/></label>
        <label className="form-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="form-field"><span>Prioritet</span><select value={priority} onChange={(event) => setPriority(event.target.value)}>{PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="form-field"><span>Rok</span><input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)}/></label>
        <label className="form-field compact-form-wide"><span>Sledeći korak</span><input value={nextStep} onChange={(event) => setNextStep(event.target.value)} placeholder="Šta konkretno treba uraditi dalje?"/></label>
        <label className="initial-documents-picker compact-form-wide" htmlFor="matter-documents"><span>{documents.length ? `${documents.length} izabranih fajlova` : "Dodaj početnu dokumentaciju (opciono)"}</span><input ref={fileInputRef} id="matter-documents" className="initial-documents-input" type="file" accept={ACCEPTED_FILES} multiple onChange={chooseDocuments}/></label>
        <p className="initial-documents-policy compact-form-wide">Dokumenti se čuvaju u 01 ULAZ · najviše 10 fajlova · 25 MiB po fajlu</p>
        <button className="primary-action compact-form-wide" type="submit" disabled={creatingMatter}>{creatingMatter ? "Kreiram predmet…" : "Kreiraj predmet"}</button>
      </form></section> : null}

      {message ? <p className="client-manager-message" role="status">{message}</p> : null}
      {createdMatter ? <p className="client-manager-created"><Link href={`/matters/${encodeURIComponent(createdMatter.clientFolder)}/${encodeURIComponent(createdMatter.matterFolder)}`}>Otvori novi predmet u Kokpitu</Link></p> : null}

      <section className="client-matters"><div className="client-matters-heading"><div><h3>Predmeti klijenta</h3><p>{clientMatters.length} {clientMatters.length === 1 ? "predmet" : "predmeta"}</p></div></div>{clientMatters.length ? <div className="client-matters-table"><div className="client-matter-table-head"><span>Predmet</span><span>Oblast prava</span><span>Status</span><span>Sledeći korak</span><span>Rok</span><span></span></div>{clientMatters.map((matter) => <article className="client-matter-row" key={matter.matterFolder}><div><strong>{matter.matterName}</strong><small>Predmet</small></div><span data-label="Oblast prava">{matter.legalArea || "Nije navedeno"}</span><span data-label="Status">{matter.status || "Nije naveden"}</span><span data-label="Sledeći korak">{matter.nextStep || "Nije naveden"}</span><span data-label="Rok">{matter.deadline || "Nije naveden"}</span><Link href={`/matters/${encodeURIComponent(matter.clientFolder)}/${encodeURIComponent(matter.matterFolder)}`}>Otvori</Link></article>)}</div> : <div className="client-matters-empty"><strong>Ovaj klijent nema aktivnih predmeta.</strong><p>Otvorite prvi predmet samo kada za njega postoji stvaran rad.</p></div>}</section>
    </> : <div className="client-matters-empty"><strong>Izaberite klijenta.</strong></div>}</main>
  </div>;
}
