"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  validateInitialDocuments,
  type InitialDocumentValidationErrorCode,
  type InitialDocumentValidationResult,
} from "@/lib/sdj-initial-documents";

type MatterResult = { success: boolean; clientFolder: string; matterFolder: string; matterName: string; folderName: string; createdFolders: string[]; createdFiles: string[]; errors: { item: string; message: string }[] };
type ActiveMatter = { clientFolder: string; matterFolder: string; matterName: string };
function localIsoDate(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
const today = localIsoDate();
const LEGAL_AREAS = ["Opšte", "Ugovorno pravo", "Privredno pravo", "Parnica / sudski spor", "Naplata potraživanja", "Menično obezbeđenje", "Radno pravo", "Real estate / nepokretnosti", "Transport / Incoterms", "Due diligence", "Upravni / inspekcijski postupak", "Poresko / finansijsko", "Korporativno pravo", "Stečaj / blokada", "Izvršenje", "Drugo"];
const STATUSES = ["Aktivan", "Čeka klijenta", "Čeka drugu stranu", "Čeka sud / organ", "U izradi", "Za finalizaciju", "Poslato", "Završeno", "Arhiva"];
const PRIORITIES = ["Nizak", "Srednji", "Visok", "Hitno"];
const WAITING_FROM = ["Niko / nije primenljivo", "Klijent", "Druga strana", "Sud / državni organ", "Interno", "Ostalo"];
const transliteration: Record<string,string> = { č:"c",ć:"c",š:"s",đ:"dj",ž:"z",Č:"C",Ć:"C",Š:"S",Đ:"DJ",Ž:"Z" };
const normalize = (value:string) => [...value].map(char=>transliteration[char]??char).join("").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[<>:"/\\|?*]/g," ").trim().toUpperCase().replace(/\s+/g,"_").replace(/_+/g,"_").slice(0,60).replace(/_+$/g,"");
const INITIAL_DOCUMENT_ACCEPT = ".pdf,.docx,.xlsx,.txt,.jpg,.jpeg,.png";
const INITIAL_DOCUMENT_ERROR_MESSAGES: Record<InitialDocumentValidationErrorCode,string> = {
  TOO_MANY_FILES:"Možete izabrati najviše 10 fajlova.",
  EMPTY_FILE_NAME:"Jedan od izabranih fajlova nema validan naziv.",
  INVALID_FILE_SIZE:"Veličina jednog od izabranih fajlova nije validna.",
  EMPTY_FILE:"Prazni fajlovi nisu dozvoljeni.",
  FILE_TOO_LARGE:"Jedan od fajlova prelazi dozvoljenih 25 MiB.",
  TOTAL_SIZE_TOO_LARGE:"Ukupna veličina fajlova prelazi dozvoljenih 75 MiB.",
  EXTENSION_NOT_ALLOWED:"Jedan od izabranih tipova fajlova nije dozvoljen.",
  FILE_NAME_TOO_LONG:"Naziv jednog od fajlova je predugačak.",
  UNSAFE_FILE_NAME:"Naziv jednog od fajlova nije bezbjedan.",
  WINDOWS_RESERVED_NAME:"Naziv jednog od fajlova nije dozvoljen na Windowsu.",
  DUPLICATE_FILE_NAME:"Izabrani fajlovi sadrže duplikat naziva.",
};
const INITIAL_DOCUMENT_FALLBACK_MESSAGE = "Izabrani fajlovi nisu prihvaćeni. Provjerite tip, naziv i veličinu fajlova.";
function getInitialDocumentValidationMessage(result:InitialDocumentValidationResult){const code=result.errors[0]?.code;return code ? INITIAL_DOCUMENT_ERROR_MESSAGES[code] ?? INITIAL_DOCUMENT_FALLBACK_MESSAGE : INITIAL_DOCUMENT_FALLBACK_MESSAGE;}
const formatFileSize = (size:number) => size >= 1024*1024 ? `${(size/(1024*1024)).toFixed(1)} MiB` : size >= 1024 ? `${(size/1024).toFixed(1)} KiB` : `${size} B`;
const fileTypeLabel = (file:File) => file.name.slice(file.name.lastIndexOf(".")+1).toUpperCase();
const cockpitLinkStyle = { display:"inline-flex", alignItems:"center", minHeight:"38px", padding:"0 13px", border:"1px solid #17324d", borderRadius:"4px", color:"#17324d", fontSize:"12px", fontWeight:700, textDecoration:"none" } as const;

export function MattersWorkspace() {
  const [clients,setClients]=useState<string[]>([]); const [loading,setLoading]=useState(true); const [newClient,setNewClient]=useState(""); const [clientMessage,setClientMessage]=useState("");
  const [client,setClient]=useState(""); const [matterName,setMatterName]=useState(""); const [openingDate,setOpeningDate]=useState(today); const [pending,setPending]=useState(false); const [matterError,setMatterError]=useState(""); const [result,setResult]=useState<MatterResult|null>(null);
  const [legalArea,setLegalArea]=useState("Opšte"); const [status,setStatus]=useState("Aktivan"); const [priority,setPriority]=useState("Srednji"); const [waitingFrom,setWaitingFrom]=useState("Niko / nije primenljivo");
  const [suggestedFolder,setSuggestedFolder]=useState(""); const [folderOverride,setFolderOverride]=useState("");
  const [initialDocuments,setInitialDocuments]=useState<File[]>([]); const [initialDocumentsError,setInitialDocumentsError]=useState(""); const initialDocumentsInputRef=useRef<HTMLInputElement>(null);
  const [activeMatters,setActiveMatters]=useState<ActiveMatter[]>([]); const [mattersLoading,setMattersLoading]=useState(true); const [mattersMessage,setMattersMessage]=useState(""); const [movingMatter,setMovingMatter]=useState(""); const [pendingMoveMatter,setPendingMoveMatter]=useState<ActiveMatter|null>(null);
  const baseProposal=useMemo(()=>matterName&&client?`SDJ_${openingDate}_${normalize(client)}_${normalize(matterName)}`.slice(0,140).replace(/_+$/g,""):"",[client,matterName,openingDate]);
  const proposal=folderOverride||baseProposal;

  useEffect(()=>{let active=true;fetch("/api/clients",{cache:"no-store"}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);if(active){setClients(data.clients);setClient(data.clients[0]||"");}}).catch(error=>{if(active)setClientMessage(error instanceof Error?error.message:"Klijenti nisu učitani.");}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
  useEffect(()=>{let active=true;fetch("/api/matters",{cache:"no-store"}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);if(active)setActiveMatters(data.matters);}).catch(error=>{if(active)setMattersMessage(error instanceof Error?error.message:"Aktivni predmeti nisu učitani.");}).finally(()=>{if(active)setMattersLoading(false);});return()=>{active=false;};},[]);
  function resetSuggestion(){setSuggestedFolder("");setFolderOverride("");setMatterError("");}
  function validateFileSelection(files:File[]){return validateInitialDocuments(files.map(file=>({name:file.name,size:file.size,mimeType:file.type})));}
  function resetFileInput(){if(initialDocumentsInputRef.current)initialDocumentsInputRef.current.value="";}
  function clearInitialDocuments(){setInitialDocuments([]);setInitialDocumentsError("");resetFileInput();}
  function selectInitialDocuments(event:ChangeEvent<HTMLInputElement>){const fileList=event.currentTarget.files;if(!fileList||fileList.length===0){resetFileInput();return;}const files=Array.from(fileList);const validation=validateFileSelection(files);if(!validation.valid){setInitialDocumentsError(getInitialDocumentValidationMessage(validation));resetFileInput();return;}setInitialDocuments(files);setInitialDocumentsError("");}
  function removeInitialDocument(indexToRemove:number){const remaining=initialDocuments.filter((_,index)=>index!==indexToRemove);const validation=validateFileSelection(remaining);setInitialDocuments(remaining);setInitialDocumentsError(validation.valid?"":getInitialDocumentValidationMessage(validation));resetFileInput();}
  async function loadClients(){setLoading(true);try{const response=await fetch("/api/clients",{cache:"no-store"});const data=await response.json();if(!response.ok)throw new Error(data.error);setClients(data.clients);setClient(current=>current||data.clients[0]||"");}catch(error){setClientMessage(error instanceof Error?error.message:"Klijenti nisu učitani.");}finally{setLoading(false);}}
  async function loadMatters(){setMattersLoading(true);try{const response=await fetch("/api/matters",{cache:"no-store"});const data=await response.json();if(!response.ok)throw new Error(data.error);setActiveMatters(data.matters);}catch(error){setMattersMessage(error instanceof Error?error.message:"Aktivni predmeti nisu učitani.");}finally{setMattersLoading(false);}}
  async function createClient(event:FormEvent<HTMLFormElement>){event.preventDefault();setClientMessage("");const response=await fetch("/api/clients",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newClient})});const data=await response.json();if(!response.ok){setClientMessage(data.error);return;}setNewClient("");setClientMessage(`Klijent ${data.client} je kreiran.`);await loadClients();setClient(data.client);}
  async function createMatter(event:FormEvent<HTMLFormElement>){event.preventDefault();setPending(true);setMatterError("");setResult(null);const form=new FormData(event.currentTarget);const payload={client,matterName,openingDate,legalArea,status,priority,description:String(form.get("description")??""),nextStep:String(form.get("nextStep")??""),expectedOutput:String(form.get("expectedOutput")??""),deadline:String(form.get("deadline")??""),waitingFrom,waitingDetail:String(form.get("waitingDetail")??""),folderNameOverride:folderOverride};try{const response=await fetch("/api/matters",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const responseData=await response.json();if(response.status===409){setMatterError(responseData.error||"Predmet sa ovim nazivom već postoji.");setSuggestedFolder(responseData.suggestedFolderName||"");return;}if(!response.ok)throw new Error(responseData.error);setResult(responseData);setSuggestedFolder("");clearInitialDocuments();await loadMatters();}catch(error){setMatterError(error instanceof Error?error.message:"Predmet nije kreiran.");}finally{setPending(false);}}
  async function openFolder(){if(!result)return;if(!result.clientFolder||!result.matterFolder){setMatterError("Matter folder nema validne identifikatore.");return;}const response=await fetch("/api/matters/open-folder",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientFolder:result.clientFolder,matterFolder:result.matterFolder,target:"matter"})});const data=await response.json();if(!response.ok)setMatterError(data.error);}
  async function openActiveMatter(matter:ActiveMatter){setMattersMessage("");if(!matter.clientFolder||!matter.matterFolder){setMattersMessage("Matter folder nema validne identifikatore.");return;}const response=await fetch("/api/matters/open-folder",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientFolder:matter.clientFolder,matterFolder:matter.matterFolder,target:"matter"})});const data=await response.json();if(!response.ok)setMattersMessage(data.error);}
  async function moveMatterToArchive(matter:ActiveMatter){const key=`${matter.clientFolder}\\${matter.matterFolder}`;setMovingMatter(key);setMattersMessage("");try{const response=await fetch("/api/matters/delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientFolder:matter.clientFolder,matterFolder:matter.matterFolder})});const data=await response.json();if(!response.ok)throw new Error(data.error);setPendingMoveMatter(null);setMattersMessage("Predmet je premješten u arhivu.");await loadMatters();}catch(error){setMattersMessage(error instanceof Error?error.message:"Predmet nije premješten.");}finally{setMovingMatter("");}}

  return <><div className="matters-layout">
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
        <section className="initial-documents-card" aria-labelledby="initial-documents-title">
          <div className="initial-documents-heading"><div><h3 id="initial-documents-title">Početna dokumentacija</h3><p>Možete opciono izabrati do 10 fajlova. Dokumenti će biti sačuvani uz predmet u narednom koraku.</p></div>{initialDocuments.length>0&&<button type="button" onClick={clearInitialDocuments}>Očisti sve</button>}</div>
          <label className="initial-documents-picker" htmlFor="initial-documents-input"><span>Izaberite fajlove</span><input ref={initialDocumentsInputRef} className="initial-documents-input" id="initial-documents-input" type="file" accept={INITIAL_DOCUMENT_ACCEPT} multiple onChange={selectInitialDocuments}/></label>
          <p className="initial-documents-policy"><strong>Tipovi:</strong> PDF, DOCX, XLSX, TXT, JPG, JPEG, PNG <span aria-hidden="true">·</span> najviše 10 fajlova <span aria-hidden="true">·</span> 25 MiB po fajlu <span aria-hidden="true">·</span> 75 MiB ukupno</p>
          {initialDocumentsError&&<p className="initial-documents-error" role="alert">{initialDocumentsError}</p>}
          {initialDocuments.length>0&&<ul className="initial-documents-list">{initialDocuments.map((file,index)=><li key={`${file.name}-${file.size}-${file.lastModified}`}><div><strong>{file.name}</strong><span>{fileTypeLabel(file)} <span aria-hidden="true">·</span> {formatFileSize(file.size)}</span></div><button type="button" onClick={()=>removeInitialDocument(index)} aria-label={`Ukloni fajl ${file.name}`}>Ukloni</button></li>)}</ul>}
          <p className="initial-documents-note">Izbor fajlova biće povezan sa server-side čuvanjem u sledećem koraku implementacije.</p>
        </section>
        <button className="primary-action" type="submit" disabled={pending||!clients.length}>{pending?"Kreiram predmet…":"Create Matter"}</button>
      </form>
      {matterError&&<div className="duplicate-message" role="alert"><p>{matterError}</p>{suggestedFolder&&<><code>{suggestedFolder}</code><button type="button" onClick={()=>{setFolderOverride(suggestedFolder);setSuggestedFolder("");setMatterError("");}}>Predloži novi naziv</button></>}</div>}
      {result&&<section className="matter-result" aria-live="polite"><div className="result-heading"><h3>{result.success?"Matter created successfully":"Matter created with errors"}</h3><button type="button" onClick={openFolder}>Open Matter Folder</button></div><code className="matter-path">{result.matterFolder}</code><ResultList label="Kreirani folderi" items={result.createdFolders}/><ResultList label="Kreirani control files" items={result.createdFiles}/><ResultList label="Errors" items={result.errors.map(error=>`${error.item}: ${error.message}`)}/></section>}
    </section>
  </div>
    <section className="work-panel active-matters-panel">
      <div className="panel-heading"><div><h2>Aktivni predmeti</h2><p>Direktni SDJ_ folderi u aktivnom workspaceu</p></div><span>{activeMatters.length}</span></div>
      {mattersMessage&&<p className="active-matters-message" aria-live="polite">{mattersMessage}</p>}
      {mattersLoading?<p className="active-matters-empty">Učitavanje…</p>:activeMatters.length?<div className="active-matters-list">{activeMatters.map(matter=>{const key=`${matter.clientFolder}\\${matter.matterFolder}`;const hasCockpitSegments=typeof matter.clientFolder==="string"&&matter.clientFolder.length>0&&typeof matter.matterFolder==="string"&&matter.matterFolder.startsWith("SDJ_");const cockpitHref=hasCockpitSegments?`/matters/${encodeURIComponent(matter.clientFolder)}/${encodeURIComponent(matter.matterFolder)}`:"";return <article className="active-matter-row" key={key}><div><strong>{matter.matterName}</strong><span>Klijent: {matter.clientFolder}</span><code>{matter.matterFolder}</code></div><div className="active-matter-actions">{hasCockpitSegments?<Link href={cockpitHref} style={cockpitLinkStyle}>Otvori Matter Cockpit</Link>:null}<button type="button" onClick={()=>openActiveMatter(matter)}>Open Matter Folder</button><button type="button" className="danger-action" disabled={movingMatter===key} onClick={()=>setPendingMoveMatter(matter)} aria-label={`Obriši predmet ${matter.matterFolder}`}>{movingMatter===key?"Premještam…":"Obriši predmet"}</button></div></article>})}</div>:<p className="active-matters-empty">Nema aktivnih predmeta.</p>}
    </section>
    {pendingMoveMatter&&<div className="matter-confirm-backdrop" role="presentation"><section className="matter-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="move-matter-title"><h2 id="move-matter-title">Obriši predmet</h2><dl><div><dt>Predmet</dt><dd>{pendingMoveMatter.matterName}</dd></div><div><dt>Klijent</dt><dd>{pendingMoveMatter.clientFolder}</dd></div><div><dt>Matter folder</dt><dd><code>{pendingMoveMatter.matterFolder}</code></dd></div></dl><p>Predmet neće biti trajno obrisan. Cijeli folder biće premješten u 05 ARHIVA\OBRISANI_PREDMETI.</p><div className="matter-confirm-actions"><button type="button" onClick={()=>setPendingMoveMatter(null)}>Otkaži</button><button type="button" className="danger-action" onClick={()=>moveMatterToArchive(pendingMoveMatter)} disabled={Boolean(movingMatter)}>Potvrdi premještanje</button></div></section></div>}
  </>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="form-field"><span>{label}</span>{children}</label>}
function ResultList({label,items}:{label:string;items:string[]}){return <div className="created-list"><strong>{label}</strong>{items.length?<ul>{items.map(item=><li key={item}>{item}</li>)}</ul>:<p>None</p>}</div>}
