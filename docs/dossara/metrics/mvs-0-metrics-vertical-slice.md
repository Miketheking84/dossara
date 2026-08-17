# DOSSARA — MVS-0 Metrics Vertical Slice

> **Historical status notice (GOV-REC-1).** Ovaj dokument čuva MVS-0 stanje, identifikovane authority gap-ove, kasniji isolated/provisional evidence status i acceptance ishod iz vremena tog work package-a; njegovi tehnički nalazi, test rezultati, rationale i tadašnji status nijesu retroaktivno promijenjeni. Za sadašnju operational-semantics interpretaciju važi successor authority chain: VOC-1 je zatvorio pet ugovora (`09b74f514fcb56fbf20d74019ef2542aeb675b12`), a MVS-1 je prihvaćeni executable proof tih semantics (`b590e1738e88711f2d3aff5a0969190fe76e4cff`). Ovaj dokument ostaje historical design/acceptance artefakt i nije current authority tamo gdje ga VOC-1/MVS-1 preciziraju ili zamjenjuju.

## 1. Document control

| Polje | Vrijednost |
|---|---|
| Work package | MVS-0 — Metrics Vertical Slice Design |
| Status | Isolated executable vertical slice accepted with FIELD-0 provisional contracts |
| Datum | 10. avgust 2026. |
| Branch | `spike/phase-0c-electron-forge-webpack` |
| Formalni kontrolni akt | `docs/dossara/decision-alignment-register-v1.2.md` |
| Normativni baseline | Accepted VLA-0A–E, VLA-1A/1B i FH-1 acceptance commit `c9c8eb4` |
| VOC-0 contract | `docs/dossara/metrics/voc-0-domain-semantic-contracts.md` |
| Executable evidence | `spikes/mvs-0-metrics/` — targeted suite 13/13 PASS |
| Vrsta rada | Design contract + isolated executable spike; bez UI-ja ili production coupling-a |

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

- production metrics implementaciju izvan `spikes/mvs-0-metrics/`;
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
| active matter | VOC-0 lifecycle portfolio classification; nije VLA-0A revision lifecycle `ACTIVE` po automatizmu |
| open/completed/actionable action | tri odvojena VOC-0 resolvera nad authoritative `LEGAL_ACTION` istorijom |
| authoritative due instant | rezultat accepted action/deadline mapping-a; radni naziv `dueAt` u metric formuli nije novo canonical polje |
| current operational state | authoritative matter operational state/effect koji VLA resolver proglasi current za `evaluatedAt`; Matter State projection nije authority |
| effective time | VLA-0E `effective_at` ili uključivi `effective_from`, prema object-specific temporal contract-u |
| supersession | immutable lifecycle/currentness events i typed relations; nikad filename, lexical ID ili `mtime` |
| projection basis | VLA-1B `dependencyFrontier` plus exact typed authoritative references |

VLA/FH baseline ne zaključava ove domain semantike samostalno. VOC-0 ih sada daje kao executable contract za isolated MVS slice, uz FIELD-0 provisional granicu. VOC-0 contract ne pretvara VLA revision lifecycle u matter business lifecycle i ne propisuje canonical payload field name-ove.

### 4.1 `countsAsActiveMatterAsOf(matter, T)` decision lock

`countsAsActiveMatterAsOf` je metrics classification nad razriješenim authoritative **matter business lifecycle** stanjem. Nije canonical state, novi lifecycle enum niti zapis koji se smije persistirati u Layers 1–2. VLA-0A revision lifecycle `ACTIVE/SUPERSEDED/WITHDRAWN/VOIDED` ne mapira se na ovu tabelu.

| Matter business lifecycle as of `T` | Metrics classification |
|---|---|
| `OPEN`, `ACTIVE` | `TRUE` |
| `SUSPENDED`, `ON_HOLD` | `TRUE` — provisional |
| `CLOSED`, `CANCELLED` | `FALSE` |
| `ARCHIVED` | `FALSE` — provisional ako je lifecycle status |
| missing effective time ili unresolved conflict | `UNRESOLVED` -> §7 `UNAVAILABLE`/`INVALID` |

Classification koristi effective chronology. Close/reopen mijenja rezultat samo od svojih effective granica; ne prepisuje prethodni interval.

### 4.2 `countsAsOpenActionAsOf(action, T)` decision lock

VOC-0 razdvaja `isLegalActionOpenAsOf`, `isLegalActionCompletedAsOf` i `isLegalActionActionableAsOf`. Sva tri se primjenjuju nakon currentness/supersession resolution-a nad stable `LEGAL_ACTION` identity-jem i vraćaju `TRUE | FALSE | UNRESOLVED`.

- completed je `TRUE` samo za authoritative `COMPLETED`;
- `CANCELLED`, `SUPERSEDED` i `NO_LONGER_REQUIRED` nijesu completed, ali jesu terminalni za open;
- open znači authoritative existence as of `T` bez authoritative terminal disposition effective as of `T`;
- actionable zahtijeva open, odsustvo authoritative blocker/waiting state-a, zadovoljenu `earliestActionAt` granicu i svaki već deklarisani provjerljivi prerequisite.

Review, trust, source support, verification i approval ne znače automatski open, actionable ili completed. Naziv, opis, AI tekst, “next step” rečenica i UI pozicija nijesu structured authority.

### 4.3 Authoritative action due-instant decision lock

`resolveActionDueInstant(actionId)` vraća `INSTANT | NULL | UNRESOLVED`. Full datetime sa authoritative timezone/offset-om direktno se normalizuje u instant. Date-only due mapira se na početak sljedećeg lokalnog kalendarskog dana u authoritative timezone-u; tada je overdue kada je `T >= dueInstant`.

Timezone precedence je explicit due/action timezone, zatim canonical matter timezone samo ako postoji u accepted modelu, inače `UNRESOLVED`. Host timezone i skriveni `Europe/Belgrade` fallback su zabranjeni. `NULL` znači da authority eksplicitno kaže da roka nema; nije data-quality tvrdnja “not overdue”. Invalid ili konkurentni due podaci daju `UNRESOLVED` i ne popravljaju se heuristikom. Automatsko računanje zakonskih/procesnih rokova ostaje van scope-a.

### 4.4 Matter operational-state decision lock

`resolveMatterOperationalStateAsOf(matterId, T)` vraća state, `effectiveFrom`, provenance i `RESOLVED | UNRESOLVED`. Current je authoritative non-superseded state sa `effectiveFrom <= T` poslije kojeg nema kasnije effective transition prije ili na `T`.

Effective chronology, ne file chronology, određuje currentness. Correction/supersession je explicit i ne briše original. Tie bez authority resolution-a i gap prije prvog state-a daju `UNRESOLVED`. Matter State projection, segment, UI ili generation time nijesu authority. Konačna operational taxonomy ostaje FIELD-0 provisional.

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

MVS-0 default resolver koristi `evaluatedAt = T` kao effective-time granicu nad eksplicitno deklarisanim, danas prihvaćenim authoritative frontier-om:

```text
effectiveTruthAsOf(Te = T, authoritativeFrontier)
```

Time-zone zapis se normalizuje na isti UTC instant prije poređenja. `occurred_at`, `known_at`, `recorded_at`, review/verification vrijeme i `effective_at` ostaju odvojene ose. `evaluatedAt` ih ne preimenuje niti spaja. Kasnije prihvaćena explicit correction može promijeniti danas rekonstruisanu effective truth za raniji `T`, uz sačuvan originalni evidence trag. Known-at-time/bitemporal pitanje “šta je sistem znao u `Tk`/`Tr`” nije dio prvog slice-a i zahtijeva novu metric contract verziju.

## 6. Authority-resolution boundary

Metrics engine prima već razriješeno authoritative as-of stanje i dokaz njegovog dependency frontier-a. Ne smije sam birati current revision ili state effect koristeći:

- `latest file wins`;
- najveći timestamp, ID ili revision number;
- lexical/directory ordering;
- filesystem `mtime`;
- Matter State ili raniju metrics projekciju kao independent authority.

VLA-1B currentness se izvodi iz lifecycle/currentness records/events, supersession/replacement relacija, exact review/approval/apply rezultata, temporal/effective semantike i conflict/recovery/reconciliation stanja. FH-1 prihvaćeni `assessFrontier` u `spikes/foundation-hardening/dependency-frontier.ts` dokazuje samo direct exact-revision dependency coverage/currentness. Ne bira authoritative object revision, lifecycle/operational state niti historical effect. `spikes/foundation-hardening/rebuild.ts` i `history-and-recovery.ts` su eksplicitno exploratory i nijesu dio FH-1 acceptance-a.

Corrective option **B** je sada realizovan kao minimalni isolated authoritative as-of adapter u `spikes/mvs-0-metrics/`:

```text
VLA/FH authoritative as-of resolver -> immutable MVS-0 derivation input
```

Adapter implementira samo accepted VLA-0E/VLA-1A/1B i VOC-0 pravila potrebna za synthetic fixture, ostaje test-only/isolated spike bez production coupling-a, reuse-uje FH-1 accepted frontier primitive i failuje zatvoreno za semantiku koju authority ne razrješava. Fixture declaration nije domain authority, nije uveden production statusni rječnik i spike se ne predstavlja kao production resolver.

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

VLA-0A revision lifecycle `ACTIVE` nije dokaz da je predmet poslovno aktivan. M1 koristi VOC-0 matter business lifecycle contract i `EXECUTABLE IN ISOLATED MVS-0 — PROVISIONAL` je.

## 9. M2 — Open Action Item Count

| Atribut | Contract |
|---|---|
| ID | `M2_OPEN_ACTION_ITEM_COUNT` |
| Scope | matter; portfolio roll-up samo kroz active matters |
| Autoritativni objekat | `LEGAL_ACTION` |
| Definicija | broj authoritative actions za koje `isLegalActionOpenAsOf` vraća `TRUE` as-of `evaluatedAt` |
| Matter formula | `count(action where belongsToMatter && countsAsOpenActionAsOf(action, evaluatedAt) == true)` |
| Portfolio formula | suma complete matter rezultata samo za M1-active matters |
| Failure | classification table §4.2 ne daje finalni open/closed outcome -> `UNAVAILABLE` ili `INVALID` |

M2 ne zahtijeva actionability i ne računa terminalne actions kao open. M2 je `EXECUTABLE IN ISOLATED MVS-0 — PROVISIONAL`.

## 10. M3 — Overdue Open Action Item Count

| Atribut | Contract |
|---|---|
| ID | `M3_OVERDUE_OPEN_ACTION_ITEM_COUNT` |
| Scope | matter; portfolio roll-up kroz active matters |
| Definicija | open action čiji je resolved authoritative due boundary dostignut do `evaluatedAt` |
| Formula | `isLegalActionOpenAsOf(action, T) == TRUE && resolveActionDueInstant(action) == dueInstant && T >= dueInstant` |

Boundary pravila:

- `dueInstant < evaluatedAt` -> overdue;
- `dueInstant == evaluatedAt` -> overdue;
- `dueAt > evaluatedAt` -> nije overdue;
- open action bez authoritative due instant-a ulazi u M2, ali ne u M3;
- terminal/non-open action as-of T ne ulazi u M3 bez obzira na due instant;
- future-effective action koja još nije current as-of T ne ulazi;
- invalid due instant ili nerazrješiv due/status conflict -> `INVALID` za pogođeni scope.

`dueAt` je ovdje metric-level naziv za razriješeni authoritative due instant. Ne propisuje da `LEGAL_ACTION.payload` mora dobiti istoimeno polje niti spaja `LEGAL_ACTION` i `DEADLINE`. Ova metrika nije tvrdnja da je zakonski ili procesni rok propušten.

M3 je `EXECUTABLE IN ISOLATED MVS-0`.

## 11. M4 — Active Matters Without Open Actions

| Atribut | Contract |
|---|---|
| ID | `M4_ACTIVE_MATTERS_WITHOUT_OPEN_ACTIONS` |
| Scope | portfolio |
| Definicija | broj M1-active matters čiji je complete M2 matter count jednak `0` za isti `evaluatedAt`, version i frontier |
| Formula | `count(active matter where openActionItemCount == 0)` |
| Failure | nasljeđuje relevantni M1/M2 `INVALID` ili `UNAVAILABLE` status |

Naziv `Matters Without Next Action` je zabranjen u MVS-0 jer slice ne uvodi canonical next-action ordering contract.

M4 je `EXECUTABLE IN ISOLATED MVS-0 — PROVISIONAL` jer koristi provisional M1/M2 domain contracte.

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

M5 je `EXECUTABLE IN ISOLATED MVS-0 — PROVISIONAL`.

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

Projection ne kopira cijele canonical objekte. Traceability basis koristi typed exact references na relevantne object/revision/event/receipt identitete i, za portfolio metric, deterministički uređenu listu contributing/excluded matter identiteta sa razlogom. Spike serialization `mvs-0-projection/1` je prihvaćena samo kao isolated evidence schema; production metrics path i production serialization contract nijesu zaključani i svaki budući artefakt mora ostati unutar VLA Layer 3/4 generated granice i izvan authority-ja.

Minimalni isolated read sloj implementira:

```text
getPortfolioMetrics() -> one persisted, validated portfolio result set
getMatterMetrics(matterId) -> matter result set from the same projection identity
```

Read sloj validira schema/version/frontier i vraća sačuvane rezultate. Ne računa metrike ponovo, ne popravlja projection i nije drugi metrics engine.

## 14. Corrective gap disposition

| Gap | Accepted source | Corrective resolution | Potpuno riješen? | Execution dependency |
|---|---|---|---:|---|
| matter active/non-active | VLA/FH authority boundary + VOC-0 §4 | non-terminal matter business lifecycle as of `T`; FIELD-sensitive states provisional | DA, PROVISIONAL | FIELD-0 validation |
| action open/actionable/completed | VLA/FH authority boundary + VOC-0 §5 | tri odvojena fail-closed resolvera | DA, PROVISIONAL | blocker taxonomy FIELD-0 |
| action due instant | VLA temporal boundary + VOC-0 §6 | explicit datetime ili date-only next-local-day boundary; no hidden timezone | DA | eventualni office timezone FIELD-0 |
| operational-state currentness/effective start | VLA effective/currentness boundary + VOC-0 §7 | effective chronology, explicit correction/supersession, conflict -> unresolved | DA, PROVISIONAL | operational taxonomy FIELD-0 |
| as-of resolver/rebuild | VLA-0E/VLA-1A/1B/FH-1 + VOC-0 §8 | authority-only effective-as-of resolver; derived state disposable | DA | isolated evidence PASS; production adapter deferred |

VOC-0 zatvara svih pet gap-ova bez promjene VLA revision lifecycle semantike. FIELD-sensitive stavke ostaju provisional, ali nijesu blocker za isolated MVS executable slice.

## 15. Final metric classification and minimal slice

| Metric | Završna kategorija | Konkretan razlog |
|---|---|---|
| M1 | `EXECUTABLE IN ISOLATED MVS-0 — PROVISIONAL` | VOC-0 matter lifecycle contract; FIELD statusi provisional |
| M2 | `EXECUTABLE IN ISOLATED MVS-0 — PROVISIONAL` | VOC-0 open resolver; blocker taxonomy ne utiče na open count |
| M3 | `EXECUTABLE IN ISOLATED MVS-0` | VOC-0 due-instant i open resolver contracti |
| M4 | `EXECUTABLE IN ISOLATED MVS-0 — PROVISIONAL` | kompozicija M1 i M2 |
| M5 | `EXECUTABLE IN ISOLATED MVS-0 — PROVISIONAL` | VOC-0 operational currentness/effective-start contract |

Broj metrika `EXECUTABLE IN ISOLATED MVS-0`: **5**. Minimalni prag od tri povezane metrike je dostignut. Implementacija je završena samo kao izolovani spike/vertical slice bez production coupling-a.

## 16. Rebuildability invariant

Isolated executable implementacija dokazuje:

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

Pet metric formula, evaluation-time semantics, strict failure behavior, non-authoritative projection, traceability i minimalni read model ostaju design-defined. VOC-0 sada daje executable authority/domain contract za svih pet blockera, uz FIELD-0 provisional granicu.

Zato je acceptance disposition:

```text
GO — ISOLATED MVS-0 EXECUTABLE EVIDENCE ACCEPTED WITH FIELD-0 PROVISIONAL CONTRACTS
```

Ovo prihvata MVS-0 executable evidence samo za izolovani vertical slice i FIELD validation. Ne prihvata konačnu production-wide domain semantiku i ne odobrava produkcijski coupling, stvarni SDJ/OneDrive workspace, external network/API, commit ili push. Svaka promocija iz spike-a zahtijeva novi, zaseban acceptance.
