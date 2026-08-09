# DOSSARA — MVS-0 Metrics Vertical Slice

## 1. Document control

| Polje | Vrijednost |
|---|---|
| Work package | MVS-0 — Metrics Vertical Slice Design |
| Status | Corrective documentation draft — executable scope blocked |
| Datum | 10. avgust 2026. |
| Branch | `spike/phase-0c-electron-forge-webpack` |
| Formalni kontrolni akt | `docs/dossara/decision-alignment-register-v1.2.md` |
| Normativni baseline | Accepted VLA-0A–E, VLA-1A/1B i FH-1 acceptance commit `c9c8eb4` |
| Vrsta rada | Design contract; bez metrics implementacije, UI-ja ili production coupling-a |

## 2. Purpose and boundary

MVS-0 zaključava minimalni, deterministički vertical slice za pet operativnih metrika. Metrics sloj samo izvodi rezultate iz autoritativnog VLA/FH stanja. Ne stvara novi authority model, canonical object type, statusnu osu, pravnu ocjenu, bazu ili analytics platformu.

```text
Layer 1 canonical revisions + Layer 2 semantic/audit history
  -> VLA/FH authoritative as-of resolution
  -> MVS-0 pure metric derivation
  -> disposable metrics projection
  -> minimal read model
```

**Central invariant:** metrics rezultat i njegova projekcija su generated, disposable, rebuildable i non-authoritative. Brisanje svih metrics artefakata ne smije ukloniti niti promijeniti authoritative podatak.

## 3. Locked non-scope

MVS-0 ne obuhvata:

- metrics executable, fixture ili test kod;
- izmjene `src/` ili FH-1 spike-a;
- SQLite, FTS, novi metrics database ili trend/time-series storage;
- cloud bazu, Supabase, RAG, OpenAI/Claude API ili drugi AI provider;
- telemetry, analytics SaaS ili outbound slanje matter podataka;
- UI, scheduler, background refresh ili production adapter;
- Waiting on Client, Waiting on Other Side, Time Since Last Significant Activity, Unresolved Decision Points, Source-Backed Fact Count ili Verified/Unverified Ratio;
- risk, quality ili lawyer-productivity scoring;
- automatsku pravnu ocjenu roka ili propuštanja roka.

Trust status ostaje odvojen od lifecycle, operational, priority, quality i productivity značenja. Nijedna MVS-0 metrika ne koristi trust status kao zamjenu za te ose.

## 4. Alignment and terminology

| MVS-0 pojam | Accepted VLA/FH mapiranje |
|---|---|
| authoritative input | VLA-1A/1B Layers 1–2: canonical exact revisions, currentness/lifecycle relations i immutable semantic/audit history |
| action item | postojeći canonical object type `LEGAL_ACTION`; izraz ne uvodi `ACTION_ITEM` object type |
| active matter | rezultat budućeg accepted matter-operational classifier-a; nije VLA-0A revision lifecycle `ACTIVE` po automatizmu |
| open/actionable action | rezultat budućeg accepted `LEGAL_ACTION` operational classifier-a; nije izveden samo iz lifecycle `ACTIVE` |
| authoritative due instant | rezultat accepted action/deadline mapping-a; radni naziv `dueAt` u metric formuli nije novo canonical polje |
| current operational state | authoritative matter operational state/effect koji VLA resolver proglasi current za `evaluatedAt`; Matter State projection nije authority |
| effective time | VLA-0E `effective_at` ili uključivi `effective_from`, prema object-specific temporal contract-u |
| supersession | immutable lifecycle/currentness events i typed relations; nikad filename, lexical ID ili `mtime` |
| projection basis | VLA-1B `dependencyFrontier` plus exact typed authoritative references |

Repo trenutno ne zaključava matter active/closed vocabulary, konačni `LEGAL_ACTION` operational vocabulary, authoritative due mapping niti canonical matter operational-state contract. MVS-0 zato zaključava samo classification granice i fail-closed ponašanje; ne izmišlja enum-e ili payload field name-ove.

### 4.1 `countsAsActiveMatterAsOf(matter, T)` decision lock

`countsAsActiveMatterAsOf` je metrics classification nad već razriješenim authoritative lifecycle/currentness stanjem. Nije canonical state, novi lifecycle enum niti zapis koji se smije persisted u Layers 1–2.

Accepted VLA-0A lifecycle termini opisuju revision/object record lifecycle, ne poslovnu otvorenost predmeta:

| Accepted lifecycle state | Metrics classification za matter | Razlog |
|---|---|---|
| `ACTIVE` | `cannot-classify` -> `UNAVAILABLE` | znači aktuelna verzija objekta; ne znači da je matter poslovno active/open |
| `SUPERSEDED` | `cannot-classify` -> follow accepted successor/currentness chain; inače `INVALID` | označava zamijenjenu reviziju, ne closed matter |
| `WITHDRAWN` | `cannot-classify` -> `UNAVAILABLE` | povlačenje objekta/revizije nije accepted matter closure contract |
| `VOIDED` | `cannot-classify` -> `INVALID` kada je jedini relevantni osnov | proceduralno nevalidan zapis ne dokazuje ni active ni non-active matter |
| missing/conflicting currentness | `cannot-classify` -> `UNAVAILABLE`/`INVALID` prema §7 | nema dozvoljenog arbitrary winner-a |

Nijedno accepted VLA lifecycle stanje trenutno ne daje `counts-as-active = true` ili `counts-as-active = false` za matter kao poslovnu cjelinu. `inactive/deactivated` u VLA-1A je generička operativna mogućnost čiji object-specific status ostaje kasnija odluka. Zato je M1 authority-blocked, a M4 i active-only portfolio roll-up zavisno blocked.

### 4.2 `countsAsOpenActionAsOf(action, T)` decision lock

`countsAsOpenActionAsOf` se primjenjuje tek nakon accepted currentness/supersession resolution-a nad stable `LEGAL_ACTION` identity-jem. Lifecycle, review, trust/verification i operational classification ostaju odvojeni.

| Accepted lifecycle state | Metrics classification za action | Razlog |
|---|---|---|
| `ACTIVE` | `cannot-classify` -> `UNAVAILABLE` | znači aktuelna revision; ista revision može konceptualno biti planned, active, blocked, completed ili cancelled dok operational vocabulary nije zaključan |
| `SUPERSEDED` | exact revision `counts-as-open = false`; classification stable action-a prati accepted successor, inače `INVALID` | stara revision nije current, ali supersession ne govori da je radnja završena |
| `WITHDRAWN` | `cannot-classify` bez object-specific effect resolution-a | VLA-1A izričito kaže da withdrawal ne poništava već applied effect |
| `VOIDED` | exact revision `counts-as-open = false`; unresolved corrective/current action scope -> `INVALID` | voided zapis nije smio proizvoditi operativno dejstvo, ali ne bira niti stvara korektivnu action revision |
| missing/conflicting operational state | `cannot-classify` -> `UNAVAILABLE`/`INVALID` | accepted operational vocabulary/resolver ne postoji |

Review `PROPOSED/IN_REVIEW/ACCEPTED/REJECTED`, trust `UNASSESSED/CONFIRMED_FROM_SOURCE/ASSUMED`, source support, verification i approval ne znače automatski open, actionable, completed ili closed. VLA-0C `ACTIVE_LEGAL_ACTIONS` jeste projekciono mjesto, ali planned/active/blocked/completed/withdrawn/cancelled nijesu zaključani kao statusni rječnik. Zato je M2 authority-blocked, a M3/M4 zavisno blocked.

### 4.3 Authoritative action due-instant decision lock

Accepted VLA-0A definiše `DEADLINE` kao odvojeni, ručno uneseni i ljudski potvrđeni datum/obavezu, uz opcionu vezu ka `LEGAL_ACTION`; detaljna polja i operational status ostavlja VLA-0F. VLA-0E definiše porediva vremena i effective semantics, ali ne proglašava nijedno od njih action due time-om.

M3 može porediti samo accepted authoritative instant koji budući action/deadline contract eksplicitno mapira na action due time. Do tada:

- `DEADLINE` datum se ne pretpostavlja automatski kao due instant radnje;
- date-only vrijednost nema dovoljnu precision za poređenje sa instantom `evaluatedAt`;
- zabranjeno je dodavanje `00:00`, `23:59`, lokalnog end-of-business-day pravila ili drugog heurističkog vremena;
- `recorded_at`, `occurred_at`, `effective_at`, review time i filesystem `mtime` nijesu due-time zamjene;
- missing precision ili neaccepted mapping daje `UNAVAILABLE`; invalid/conflicting temporal input daje `INVALID`.

M3 formula ostaje design-defined, ali execution je deferred dok accepted authoritative action due-time contract ne odredi concept/field, temporal type, precision i typed relation.

### 4.4 Matter operational-state decision lock

VLA-0C daje Matter State kao derived projekciju i segmentna članstva, VLA-0E daje `effective_at`/`effective_from` i as-of semantiku, a VLA-1A/1B daju canonical revision/currentness granicu. Baseline ipak ne definiše canonical matter operational-state identity, njegove object-specific transition/currentness rules ni obavezni effective start.

Zato M5 ne smije koristiti Matter State projection, naziv segmenta ili projection generation time kao authority. M5 ostaje design-forward contract; execution je deferred dok accepted canonical/event contract ne omogući jednoznačnu rekonstrukciju identity-ja, currentness-a as-of T i effective start-a.

## 5. Evaluation-time contract

Svaka derivacija prima eksplicitni, validni RFC 3339 UTC instant `evaluatedAt`. Core semantics ne smije čitati `Date.now()`, filesystem vrijeme, projection generation time ili drugi implicitni wall clock.

```text
MetricResult = f(
  authoritativeStateAsOf(evaluatedAt),
  evaluatedAt,
  metricDefinitionVersion
)
```

Za isti authoritative input/frontier, isti `evaluatedAt` i isti `metricDefinitionVersion`, rezultat mora biti semantički identičan, uključujući status, numeric value, contributing scope i traceability basis. Serialization metadata koja nema semantičko značenje ne ulazi u equality.

MVS-0 default as-of query mapira jedan `evaluatedAt = T` na VLA-0E shorthand:

```text
as-effective-at(Te = T, Tk = T, Tr = T)
```

Time-zone zapis se normalizuje na isti UTC instant prije poređenja. `occurred_at`, `known_at`, `recorded_at`, review/verification vrijeme i `effective_at` ostaju odvojene ose. `evaluatedAt` ih ne preimenuje niti spaja; on određuje default cut-off-e za ovaj slice. Budući query sa odvojenim `Tk`, `Tr` i `Te` zahtijeva novu metric contract verziju ili eksplicitno kompatibilno proširenje.

## 6. Authority-resolution boundary

Metrics engine prima već razriješeno authoritative as-of stanje i dokaz njegovog dependency frontier-a. Ne smije sam birati current revision ili state effect koristeći:

- `latest file wins`;
- najveći timestamp, ID ili revision number;
- lexical/directory ordering;
- filesystem `mtime`;
- Matter State ili raniju metrics projekciju kao independent authority.

VLA-1B currentness se izvodi iz lifecycle/currentness records/events, supersession/replacement relacija, exact review/approval/apply rezultata, temporal/effective semantike i conflict/recovery/reconciliation stanja. FH-1 prihvaćeni `assessFrontier` u `spikes/foundation-hardening/dependency-frontier.ts` dokazuje samo direct exact-revision dependency coverage/currentness. Ne bira authoritative object revision, lifecycle/operational state niti historical effect. `spikes/foundation-hardening/rebuild.ts` i `history-and-recovery.ts` su eksplicitno exploratory i nijesu dio FH-1 acceptance-a.

Stanje je zato corrective option **B: accepted arhitektonski contract postoji, executable resolver ne postoji**. Budući zasebno odobren executable WP smije napraviti samo minimalni authoritative as-of adapter:

```text
VLA/FH authoritative as-of resolver -> immutable MVS-0 derivation input
```

Adapter mora implementirati samo accepted VLA-0E/VLA-1A/1B pravila potrebna za synthetic fixture, biti test-only/isolated spike bez production coupling-a, reuse-ovati FH-1 accepted validation/frontier primitives gdje su primjenjivi i failovati zatvoreno za svaku semantiku koju baseline ne određuje. Ne smije fixture declaration pretvoriti u domain authority, projektovati novi statusni rječnik niti se predstavljati kao production resolver.

Determinističko sortiranje po stable opaque ID-u dozvoljeno je samo za stabilan output. Ono nikad ne bira pobjednika između kontradiktornih autoritativnih state-ova.

## 7. Result and failure contract

Svaki metric result ima tačno jedan status:

| Status | Značenje | Numeric value |
|---|---|---|
| `COMPLETE` | rezultat je potpuno i validno izveden iz declared authoritative frontier-a | obavezan; nula je validna vrijednost |
| `UNAVAILABLE` | nema dovoljno autoritativnih podataka da metrika ima definisano značenje | ne postoji |
| `INVALID` | relevantni input ili resolution ima conflict, integrity/recovery problem ili invalidnu temporalnu vrijednost | ne postoji |

`0` nikad ne predstavlja missing, unsupported ili invalid input. Status precedence za isti metric scope je `INVALID` pa `UNAVAILABLE` pa `COMPLETE`.

Portfolio rezultat je `COMPLETE` samo kada declared portfolio scope/frontier dokazuje closed-world coverage i svaki potencijalni contributor može biti klasifikovan. Relevantni `INVALID` matter čini portfolio rezultat `INVALID`; relevantni nedostajući classifier/input čini ga `UNAVAILABLE`. Implementacija ne smije objaviti parcijalni broj kao potpuni rezultat. Lokalizovani problem smije ostaviti nepogođenu matter-level metriku `COMPLETE` kada frontier dokazuje da problem ne može uticati na nju.

## 8. M1 — Active Matter Count

| Atribut | Contract |
|---|---|
| ID | `M1_ACTIVE_MATTER_COUNT` |
| Scope | portfolio |
| Definicija | broj matters za koje authoritative matter-operational classifier vraća active as-of `evaluatedAt` |
| Formula | `count(matter where countsAsActiveMatterAsOf(matter, evaluatedAt) == true)` |
| Isključenja | closed/non-active matters prema istom accepted classifier-u |
| Failure | classification table §4.1 ne daje true/false -> `UNAVAILABLE` ili `INVALID` |

VLA-0A lifecycle `ACTIVE` označava aktuelnu verziju objekta i nije sam po sebi dokaz da je predmet poslovno aktivan. MVS-0 ne uvodi literalni matter enum `ACTIVE`. M1 je `BLOCKED BY AUTHORITY CONTRACT`.

## 9. M2 — Open Action Item Count

| Atribut | Contract |
|---|---|
| ID | `M2_OPEN_ACTION_ITEM_COUNT` |
| Scope | matter; portfolio roll-up samo kroz active matters |
| Autoritativni objekat | `LEGAL_ACTION` |
| Definicija | broj authoritative actions koje accepted action classifier proglasi open/actionable as-of `evaluatedAt` |
| Matter formula | `count(action where belongsToMatter && countsAsOpenActionAsOf(action, evaluatedAt) == true)` |
| Portfolio formula | suma complete matter rezultata samo za M1-active matters |
| Failure | classification table §4.2 ne daje finalni open/closed outcome -> `UNAVAILABLE` ili `INVALID` |

Planned, active, blocked, completed, withdrawn i cancelled termini iz VLA-0C su opisne kategorije, ne zaključani konačni statusni rječnik. MVS-0 ih ne pretvara u enum. M2 je `BLOCKED BY AUTHORITY CONTRACT`.

## 10. M3 — Overdue Open Action Item Count

| Atribut | Contract |
|---|---|
| ID | `M3_OVERDUE_OPEN_ACTION_ITEM_COUNT` |
| Scope | matter; portfolio roll-up kroz active matters |
| Definicija | open/actionable action sa authoritative due instant-om strogo prije `evaluatedAt` |
| Formula | `countsAsOpenActionAsOf(action, T) == true && dueAt(action) exists && dueAt(action) < T` |

Boundary pravila:

- `dueAt < evaluatedAt` -> overdue;
- `dueAt == evaluatedAt` -> nije overdue;
- `dueAt > evaluatedAt` -> nije overdue;
- open action bez authoritative due instant-a ulazi u M2, ali ne u M3;
- completed/non-actionable action as-of T ne ulazi u M3 bez obzira na due instant;
- future-effective action koja još nije current as-of T ne ulazi;
- invalid due instant ili nerazrješiv due/status conflict -> `INVALID` za pogođeni scope.

`dueAt` je ovdje metric-level naziv za razriješeni authoritative due instant. Ne propisuje da `LEGAL_ACTION.payload` mora dobiti istoimeno polje niti spaja `LEGAL_ACTION` i `DEADLINE`. Ova metrika nije tvrdnja da je zakonski ili procesni rok propušten.

M3 je `DESIGN DEFINED — EXECUTION DEFERRED`; dodatno zavisi od blocked M2 classification-a.

## 11. M4 — Active Matters Without Open Actions

| Atribut | Contract |
|---|---|
| ID | `M4_ACTIVE_MATTERS_WITHOUT_OPEN_ACTIONS` |
| Scope | portfolio |
| Definicija | broj M1-active matters čiji je complete M2 matter count jednak `0` za isti `evaluatedAt`, version i frontier |
| Formula | `count(active matter where openActionItemCount == 0)` |
| Failure | nasljeđuje relevantni M1/M2 `INVALID` ili `UNAVAILABLE` status |

Naziv `Matters Without Next Action` je zabranjen u MVS-0 jer slice ne uvodi canonical next-action ordering contract.

M4 je `BLOCKED BY AUTHORITY CONTRACT` jer zahtijeva i M1 i M2.

## 12. M5 — Current Operational State Age

| Atribut | Contract |
|---|---|
| ID | `M5_CURRENT_OPERATIONAL_STATE_AGE_SECONDS` |
| Scope | matter |
| Definicija | cijeli broj proteklih sekundi od početka dejstva authoritative current matter operational state-a do `evaluatedAt` |
| Formula | `floor((evaluatedAt - effectiveStart(currentOperationalState)) / 1000 ms)` |
| Jedinica | sekunde, nenegativan integer |

`effectiveStart` se mapira na VLA-0E `effective_at` ili uključivi `effective_from` prema accepted object-specific contract-u. Ne koristi `recorded_at`, `occurred_at`, `known_at`, review/verification time, projection generation time ili filesystem `mtime` kao zamjenu.

- nema authoritative current operational state-a -> `UNAVAILABLE`;
- state postoji, ali effective start nedostaje/unknown -> `UNAVAILABLE`;
- više konfliktnih current state-ova, invalid timestamp ili effective start poslije `evaluatedAt` za state koji resolver ipak tvrdi da je current -> `INVALID`;
- future-effective state se ne smatra current prije svoje effective granice;
- validna starost od nula sekundi je `COMPLETE` sa value `0`.

M5 je `DESIGN DEFINED — EXECUTION DEFERRED`.

## 13. Projection and read model contract

Metrics projection mora konceptualno sadržati najmanje:

- projection schema version i projection identity;
- `metricDefinitionVersion`;
- `evaluatedAt` i VLA temporal query mapping;
- dependency frontier identity/status;
- declared portfolio/matter scope;
- portfolio metric results;
- matter-level metric results;
- za svaki rezultat status, value kada je `COMPLETE`, reason code kada nije i minimalni traceability basis;
- generation time kao tehnički metadata koji ne utiče na metric vrijednosti.

Projection ne kopira cijele canonical objekte. Traceability basis koristi typed exact references na relevantne object/revision/event/receipt identitete i, za portfolio metric, deterministički uređenu listu contributing/excluded matter identiteta sa razlogom. Fizički metrics path i serialization schema nijesu zaključani ovim documentation pass-om; svaki budući artefakt mora ostati unutar VLA Layer 3/4 generated granice i izvan authority-ja.

Minimalni budući read sloj je semantički ekvivalentan:

```text
getPortfolioMetrics() -> one persisted, validated portfolio result set
getMatterMetrics(matterId) -> matter result set from the same projection identity
```

Read sloj validira schema/version/frontier i vraća sačuvane rezultate. Ne računa metrike ponovo, ne popravlja projection i nije drugi metrics engine.

## 14. Corrective gap disposition

| Gap | Accepted source | Corrective resolution | Potpuno riješen? | Execution dependency |
|---|---|---|---:|---|
| matter active/non-active | VLA-0A lifecycle §14; VLA-1A §4.4 | §4.1 zaključava `cannot-classify`; nema metrics reinterpretacije `ACTIVE` | NE | novi accepted matter operational/closure contract |
| action open/actionable/completed | VLA-0A axes/object taxonomy; VLA-0C Legal Actions; VLA-1A withdrawal rule | §4.2 zaključava lifecycle mapping i razdvajanje osa | NE | accepted `LEGAL_ACTION` operational contract |
| action due instant | VLA-0A `DEADLINE`; VLA-0C Deadlines; VLA-0E temporal axes | §4.3 zabranjuje date heuristics i definiše fail-closed behavior | NE | accepted due concept/type/precision/relation |
| operational-state currentness/effective start | VLA-0C projection; VLA-0E effective time; VLA-1A/1B currentness | §4.4 potvrđuje da projection nije authority i defer-uje execution | NE | accepted canonical matter operational-state contract |
| as-of resolver/rebuild | VLA-0E reconstruction; VLA-1A/1B boundary; FH-1 decision log | option B; dozvoljen samo budući minimalni isolated fail-closed adapter | ARHITEKTONSKI DA; EXECUTABLE NE | poseban executable nalog i acceptance |

Ovo nijesu kontradikcije. Nijedan gap više nije implicitna pretpostavka, ali prva četiri ostaju authority blockers koje MVS-0 documentation ne smije riješiti promjenom VLA semantike.

## 15. Final metric classification and minimal slice

| Metric | Završna kategorija | Konkretan razlog |
|---|---|---|
| M1 | `BLOCKED BY AUTHORITY CONTRACT` | accepted lifecycle ne klasifikuje poslovno active/non-active matter |
| M2 | `BLOCKED BY AUTHORITY CONTRACT` | accepted `LEGAL_ACTION` lifecycle ne klasifikuje open/actionable/completed |
| M3 | `DESIGN DEFINED — EXECUTION DEFERRED` | formula je zaključana, ali M2 i authoritative instant-level due mapping nedostaju |
| M4 | `BLOCKED BY AUTHORITY CONTRACT` | zavisi od blocked M1 i M2 |
| M5 | `DESIGN DEFINED — EXECUTION DEFERRED` | nema canonical matter operational-state identity/currentness/effective-start contract-a |

Broj metrika `EXECUTABLE IN MVS-0`: **0**. Minimalni uspješni vertical slice zahtijeva najmanje tri povezane metrike; taj prag nije dostignut. MVS-0 executable WP ne smije početi na osnovu ovog dokumenta.

## 16. Rebuildability invariant

Buduća implementacija mora dokazati:

1. synthetic authoritative fixture se persisted kroz dozvoljeni VLA/FH boundary;
2. metrics se derive-uju za fiksni `evaluatedAt` i version;
3. projection A se persisted;
4. samo metrics projection se briše;
5. metrics se ponovo derive-uju iz istog authoritative frontier-a sa istim parametrima;
6. projection B se persisted;
7. A i B su semantički jednake nakon isključenja tehničkog generation metadata-a;
8. canonical input bytes, revisions, history i references nijesu mutirani.

Brisanje Matter State, metrics projection-a ili disposable index-a ne smije promijeniti rezultat kada se authoritative Layers 1–2 i pravila nijesu promijenili.

## 17. Design decision

Pet metric formula, evaluation-time semantics, strict failure behavior, non-authoritative projection, traceability i minimalni read model ostaju design-defined. Targeted review nije pronašao semantic contradiction, ali je dokazao da nema najmanje tri executable metrike bez novih accepted authority contracta.

Zato je preporuka:

```text
NO-GO — MVS-0 DESIGN
```

Dokumenti se mogu human-reviewovati kao tačan gap/decision-lock zapis, ali MVS-0 se ne može human-acceptovati kao executable-ready design bez prethodne authority odluke za najmanje M1, M2 i treću povezanu metriku. Ovo ne odobrava executable implementation, izmjenu VLA/FH baseline-a, production coupling, stvarni workspace pristup ili commit.
