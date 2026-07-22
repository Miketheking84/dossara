"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type MatterResult = { success: boolean; matterPath: string; folderName: string; createdFolders: string[]; createdFiles: string[]; errors: { item: string; message: string }[] };
const today = new Date().toISOString().slice(0, 10);
const LEGAL_AREAS = ["Opšte", "Ugovorno pravo", "Privredno pravo", "Parnica / sudski spor", "Naplata potraživanja", "Menično obezbeđenje", "Radno pravo", "Real estate / nepokretnosti", "Transport / Incoterms", "Due diligence", "Upravni / inspekcijski postupak", "Poresko / finansijsko", "Korporativno pravo", "Stečaj / blokada", "Izvršenje", "Drugo"];
const STATUSES = ["Aktivan", "Čeka klijenta", "Čeka drugu stranu", "Čeka sud / organ", "U izradi", "Za finalizaciju", "Poslato", "Završeno", "Arhiva"];
const PRIORITIES = ["Nizak", "Srednji", "Visok", "Hitno"];
const WAITING_FROM = ["Niko / nije primenljivo", "Klijent", "Druga strana", "Sud / organ", "Veštak", "Notar / katastar / APR", "Računovođa / finansije", "Interno / SDJ", "Ja", "Treće lice", "Drugo"];
const transliteration: Record<string,string> = { č:"c",ć:"c",š:"s",đ:"dj",ž:"z",Č:"C",Ć:"C",Š:"S",Đ:"DJ",Ž:"Z" };
const normalize = (value:string) => [...value].map(char=>transliteration[char]??char).join("").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[<>:"/\\|?*]/g," ").trim().toUpperCase().replace(/\s+/g,"_").replace(/_+/g,"_").slice(0,60).replace(/_+$/g,"");

export function MattersWorkspace() {
  const [clients,setClients]=useState<string[]>([]); const [loading,setLoading]=useState(true); const [newClient,setNewClient]=useState(""); const [clientMessage,setClientMessage]=useState("");
  const [client,setClient]=useState(""); const [matterName,setMatterName]=useState(""); const [openingDate,setOpeningDate]=useState(today); const [pending,setPending]=useState(false); const [matterError,setMatterError]=useState(""); const [result,setResult]=useState<MatterResult|null>(null);
  const [legalArea,setLegalArea]=useState("Opšte"); const [status,setStatus]=useState("Aktivan"); const [priority,setPriority]=useState("Srednji"); const [waitingFrom,setWaitingFrom]=useState("Niko / nije primenljivo");
  const [suggestedFolder,setSuggestedFolder]=useState(""); const [folderOverride,setFolderOverride]=useState("");
  const baseProposal=useMemo(()=>matterName&&client?`SDJ_${openingDate}_${normalize(client)}_${normalize(matterName)}`.slice(0,140).replace(/_+$/g,""):"",[client,matterName,openingDate]);
  const proposal=folderOverride||baseProposal;

  useEffect(()=>{let active=true;fetch("/api/clients",{cache:"no-store"}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);if(active){setClients(data.clients);setClient(data.clients[0]||"");}}).catch(error=>{if(active)setClientMessage(error instanceof Error?error.message:"Klijenti nisu učitani.");}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
  function resetSuggestion(){setSuggestedFolder("");setFolderOverride("");setMatterError("");}
  async function loadClients(){setLoading(true);try{const response=await fetch("/api/clients",{cache:"no-store"});const data=await response.json();if(!response.ok)throw new Error(data.error);setClients(data.clients);setClient(current=>current||data.clients[0]||"");}catch(error){setClientMessage(error instanceof Error?error.message:"Klijenti nisu učitani.");}finally{setLoading(false);}}
  async function createClient(event:FormEvent<HTMLFormElement>){event.preventDefault();setClientMessage("");const response=await fetch("/api/clients",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newClient})});const data=await response.json();if(!response.ok){setClientMessage(data.error);return;}setNewClient("");setClientMessage(`Klijent ${data.client} je kreiran.`);await loadClients();setClient(data.client);}
  async function createMatter(event:FormEvent<HTMLFormElement>){event.preventDefault();setPending(true);setMatterError("");setResult(null);const form=new FormData(event.currentTarget);const data=Object.fromEntries(form.entries());try{const response=await fetch("/api/matters",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...data,client,matterName,legalArea,status,priority,openingDate,waitingFrom,folderNameOverride:folderOverride})});const responseData=await response.json();if(response.status===409){setMatterError("Predmet sa ovim nazivom već postoji.");setSuggestedFolder(responseData.suggestedFolderName||"");return;}if(!response.ok&&response.status!==207)throw new Error(responseData.error);setResult(responseData);setSuggestedFolder("");}catch(error){setMatterError(error instanceof Error?error.message:"Predmet nije kreiran.");}finally{setPending(false);}}
  async function openFolder(){if(!result)return;const response=await fetch("/api/matters/open-folder",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:result.matterPath})});const data=await response.json();if(!response.ok)setMatterError(data.error);}

  return <div className="matters-layout">
    <section className="work-panel clients-panel"><div className="panel-heading"><div><h2>Clients</h2><p>Folderi u 01 KLIJENTI</p></div><span>{clients.length}</span></div>
      <form className="client-form" onSubmit={createClient}><label htmlFor="client-name">New Client</label><div><input id="client-name" value={newClient} onChange={event=>setNewClient(event.target.value)} placeholder="Naziv klijenta" required/><button type="submit">Create Client</button></div></form>
      {clientMessage&&<p className="form-message" aria-live="polite">{clientMessage}</p>}
      <div className="client-list">{loading?<p>Učitavanje…</p>:clients.length?clients.map(item=><button type="button" className={client===item?"selected":""} onClick={()=>{setClient(item);resetSuggestion();}} key={item}><span>{item.slice(0,2)}</span>{item}</button>):<p>Nema klijenata.</p>}</div>
    </section>

    <section className="work-panel matter-form-panel"><div className="panel-heading"><div><h2>New Matter</h2><p>Nova lokalna struktura predmeta</p></div></div>
      <form className="matter-form" onSubmit={createMatter}>
        <Field label="Klijent"><select value={client} onChange={event=>{setClient(event.target.value);resetSuggestion();}} required><option value="">Izaberite klijenta</option>{clients.map(item=><option key={item}>{item}</option>)}</select></Field>
        <Field label="Naziv predmeta"><input value={matterName} onChange={event=>{setMatterName(event.target.value);resetSuggestion();}} required placeholder="npr. ugovor o građenju ili naplata potraživanja"/></Field>
        {proposal&&<div className="folder-proposal"><div className="folder-proposal-date"><label htmlFor="opening-date">Datum otvaranja</label><input id="opening-date" type="date" value={openingDate} onChange={event=>{setOpeningDate(event.target.value);resetSuggestion();}} required/></div><div><span>Predloženi folder</span><code>{proposal}</code></div></div>}
        <div className="form-grid three"><Field label="Oblast prava"><select value={legalArea} onChange={event=>setLegalArea(event.target.value)}>{LEGAL_AREAS.map(item=><option key={item}>{item}</option>)}</select></Field><Field label="Status"><select value={status} onChange={event=>setStatus(event.target.value)}>{STATUSES.map(item=><option key={item}>{item}</option>)}</select></Field><Field label="Prioritet"><select value={priority} onChange={event=>setPriority(event.target.value)}>{PRIORITIES.map(item=><option key={item}>{item}</option>)}</select></Field></div>
        <Field label="Kratak opis"><textarea name="description" rows={3} placeholder="Sažetak činjeničnog i pravnog problema"/></Field>
        <div className="form-grid"><Field label="Sledeći korak"><input name="nextStep" placeholder="npr. pregledati ugovor i pripremiti odgovor"/></Field><Field label="Očekivani output"><input name="expectedOutput" placeholder="npr. pravno mišljenje, dopis ili tužba"/></Field></div>
        <Field label="Rok"><input name="deadline" type="date"/></Field>
        <div className="form-grid waiting-grid"><Field label="Čeka se od"><select name="waitingFrom" value={waitingFrom} onChange={event=>setWaitingFrom(event.target.value)}>{WAITING_FROM.map(item=><option key={item}>{item}</option>)}</select></Field><Field label="Detalj čekanja / napomena"><input name="waitingDetail" placeholder="npr. dostava ugovora, email komunikacije, izjašnjenje druge strane..."/></Field></div>
        <button className="primary-action" type="submit" disabled={pending||!clients.length}>{pending?"Kreiram predmet…":"Create Matter"}</button>
      </form>
      {matterError&&<div className="duplicate-message" role="alert"><p>{matterError}</p>{suggestedFolder&&<><code>{suggestedFolder}</code><button type="button" onClick={()=>{setFolderOverride(suggestedFolder);setSuggestedFolder("");setMatterError("");}}>Predloži novi naziv</button></>}</div>}
      {result&&<section className="matter-result" aria-live="polite"><div className="result-heading"><h3>{result.success?"Matter created successfully":"Matter created with errors"}</h3><button type="button" onClick={openFolder}>Open Matter Folder</button></div><code className="matter-path">{result.matterPath}</code><ResultList label="Kreirani folderi" items={result.createdFolders}/><ResultList label="Kreirani control files" items={result.createdFiles}/><ResultList label="Errors" items={result.errors.map(error=>`${error.item}: ${error.message}`)}/></section>}
    </section>
  </div>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="form-field"><span>{label}</span>{children}</label>}
function ResultList({label,items}:{label:string;items:string[]}){return <div className="created-list"><strong>{label}</strong>{items.length?<ul>{items.map(item=><li key={item}>{item}</li>)}</ul>:<p>None</p>}</div>}
