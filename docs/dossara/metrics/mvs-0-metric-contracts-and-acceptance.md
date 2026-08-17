# DOSSARA — MVS-0 Metric Contracts and Acceptance

> **Historical status notice (GOV-REC-1).** Ovaj dokument čuva MVS-0 stanje, identifikovane authority gap-ove, kasniji isolated/provisional evidence status i acceptance ishod iz vremena tog work package-a; njegovi tehnički nalazi, test rezultati, rationale i tadašnji status nijesu retroaktivno promijenjeni. Za sadašnju operational-semantics interpretaciju važi successor authority chain: VOC-1 je zatvorio pet ugovora (`09b74f514fcb56fbf20d74019ef2542aeb675b12`), a MVS-1 je prihvaćeni executable proof tih semantics (`b590e1738e88711f2d3aff5a0969190fe76e4cff`). Ovaj dokument ostaje historical design/acceptance artefakt i nije current authority tamo gdje ga VOC-1/MVS-1 preciziraju ili zamjenjuju.

## 1. Document control

| Polje | Vrijednost |
|---|---|
| Work package | MVS-0 — Metrics Vertical Slice Design |
| Status | Isolated executable evidence accepted with FIELD-0 provisional contracts |
| Datum | 10. avgust 2026. |
| Companion | `docs/dossara/metrics/mvs-0-metrics-vertical-slice.md` |
| Normativni baseline | Accepted VLA-0A–E, VLA-1A/1B i FH-1 acceptance commit `c9c8eb4` |
| VOC-0 acceptance | `docs/dossara/metrics/voc-0-contract-acceptance-and-closure.md` |
| Executable evidence | `spikes/mvs-0-metrics/mvs-0-metrics.test.ts` |
| Test boundary | Synthetic executable fixtures isključivo u `C:\SDJ_TEST\SDJ_LEGAL_TEST\` |

## 2. Reading rule

Ovaj dokument zaključava observable acceptance ponašanje, ne implementaciju. Svi nazivi classifier-a i resolver-a su konceptualne granice. Nijesu novi canonical object types, payload fields ili dozvola da se zaobiđu VLA review/apply/currentness pravila.

Acceptance rezultat je validan samo ako koristi isti declared authoritative frontier, isti `evaluatedAt`, isti `metricDefinitionVersion`, VOC-0 contract i MVS-0 contract iz companion dokumenta. Pre-resolved fixture labela nije domain authority. Resolver test mora dokazati kako je svaki outcome nastao iz immutable revisions/history, effective time-a i correction/supersession evidence-a.

## 3. Baseline synthetic fixture

Fiksni evaluation instant:

```text
evaluatedAt = 2026-08-10T12:00:00Z
metricDefinitionVersion = mvs-0/v1
```

Fixture koristi četiri opaque matter identiteta. Oznake A–D su čitljiv testni alias, ne ID format niti canonical enum.

| Matter | Authoritative as-of outcome za fixture | Open actions | Due outcome | Current operational state effective start |
|---|---|---:|---|---|
| A | active | 2 | jedna action prije T; druga bez overdue uslova | `2026-08-01T12:00:00Z` |
| B | active | 0 | n/p | `2026-08-08T12:00:00Z` |
| C | active | 1 | due poslije T | validan fixture instant |
| D | closed/non-active | ne doprinosi active portfolio roll-up-u | ne doprinosi | ne utiče na expected portfolio |

Matter A može imati jednu open action bez due instant-a ili sa due instant-om koji nije prije T; u oba slučaja expected M2/M3 ostaje isti. Exact fixture varijanta mora biti eksplicitna i canonical prije executable testa.

Executable expected results prema VOC-0 contract-u:

| Metric | Scope | Expected value |
|---|---|---:|
| `M1_ACTIVE_MATTER_COUNT` | portfolio | 3 |
| `M2_OPEN_ACTION_ITEM_COUNT` | portfolio | 3 |
| `M3_OVERDUE_OPEN_ACTION_ITEM_COUNT` | portfolio | 1 |
| `M4_ACTIVE_MATTERS_WITHOUT_OPEN_ACTIONS` | portfolio | 1 |
| `M2_OPEN_ACTION_ITEM_COUNT` | Matter A | 2 |
| `M3_OVERDUE_OPEN_ACTION_ITEM_COUNT` | Matter A | 1 |
| `M5_CURRENT_OPERATIONAL_STATE_AGE_SECONDS` | Matter A | 777600 |

Devet dana od `2026-08-01T12:00:00Z` do `2026-08-10T12:00:00Z` jednako je `777600` cijelih sekundi. Ove vrijednosti jesu acceptance oracle, ali fixture mora dokazati `active`, `open` i current operational state kroz VOC-0 resolvere; hard-coded labels ne mogu proizvesti PASS.

## 4. Corrective classification oracles

### 4.1 Matter lifecycle oracle

| Authoritative matter business lifecycle as of `T` | `countsAsActiveMatterAsOf` outcome |
|---|---|
| `OPEN`, `ACTIVE` | `TRUE` |
| `SUSPENDED`, `ON_HOLD` | `TRUE` — provisional |
| `CLOSED`, `CANCELLED` | `FALSE` |
| `ARCHIVED` | `FALSE` — provisional ako je lifecycle status |
| missing effective time | `UNRESOLVED` -> metric `UNAVAILABLE` |
| konkurentni authority recordi bez supersession/correction resolution-a | `UNRESOLVED` -> metric `INVALID` |

VLA revision lifecycle `ACTIVE/SUPERSEDED/WITHDRAWN/VOIDED` nije ova business lifecycle osa. Test koji mapira revision `ACTIVE` direktno na matter `TRUE` mora pasti.

### 4.2 `LEGAL_ACTION` lifecycle oracle

| Authoritative action observation as of `T` | Required outcome |
|---|---|
| exists; nema terminal disposition effective do `T` | open `TRUE` |
| `COMPLETED` effective do `T` | open `FALSE`; completed `TRUE` |
| `CANCELLED` effective do `T` | open `FALSE`; completed `FALSE` |
| `SUPERSEDED` ili `NO_LONGER_REQUIRED` effective do `T` | open `FALSE`; completed `FALSE` |
| open + authoritative blocker/waiting state | actionable `FALSE` |
| open + declared prerequisite koji resolver ne može provjeriti | actionable `UNRESOLVED` |
| review/trust/verification/approval status | nema automatsku open/completed/actionable posljedicu |

Test koji mapira `ACCEPTED`, verified/source-backed ili lifecycle `ACTIVE` direktno na open mora pasti.

### 4.3 Temporal oracle

M3 smije dobiti `COMPLETE` samo kada VOC-0 resolver vrati validan authoritative action due instant ili autoritativni `NULL`. Full datetime zahtijeva timezone/offset. Date-only se mapira na početak sljedećeg lokalnog kalendarskog dana u authoritative timezone-u. Missing timezone, malformed vrijednost ili conflicting due authority daje `UNRESOLVED`, mapiran na `UNAVAILABLE`/`INVALID` prema razlogu. Testovi moraju dokazati da nema `00:00`, `23:59:59.999`, end-of-business-day, host-timezone ili filesystem-time heuristike.

### 4.4 Operational-state oracle

M5 smije dobiti `COMPLETE` samo kada VOC-0 resolver preda authoritative matter operational-state identity, jednoznačan currentness as-of `T` i validan `effectiveFrom`. Tie bez supersession/correction resolution-a i historical gap daju `UNRESOLVED`. Matter State projection ili segment label sam nije dovoljan.

## 5. Acceptance result shape

Svaki test provjerava najmanje:

- metric ID i scope;
- `evaluatedAt` i `metricDefinitionVersion`;
- status `COMPLETE`, `UNAVAILABLE` ili `INVALID`;
- numeric value samo za `COMPLETE`;
- reason code za non-complete rezultat;
- dependency frontier/projection identity;
- minimalne exact authoritative references;
- deterministic contributing matter scope za portfolio rezultate.

Reason-code vocabulary može biti proširen bez promjene metric semantics, ali najmanje mora razlikovati missing authoritative classification/state, conflict, invalid temporal value, unsupported/incomplete frontier i recovery/reconciliation block.

## 6. Mandatory acceptance cases

Svi slučajevi u ovoj sekciji obavezni su za odgovarajuće executable MVS-0 contracte. Ne mogu proizvesti PASS pre-resolved fixture labelama.

| # | Slučaj | Setup / radnja | Očekivani rezultat |
|---:|---|---|---|
| 1 | deterministic repeat | isti authoritative fixture, T i version derive-ovati najmanje dva puta | semantički identični result sets i stabilno uređene reference/contributor liste |
| 2 | projection delete + rebuild | persist A, obrisati samo metrics projection, ponovo derive/persist B | A == B semantički; authority netaknut |
| 3 | isti canonical input, različit `evaluatedAt` | derive za T1 i T2 | samo time-sensitive rezultati smiju se promijeniti prema effective/due granicama; oba rezultata nose svoj T |
| 4 | authoritative no due | open action ima `resolveActionDueInstant() = NULL` | ulazi u M2; ne ulazi u M3; M3 nije `UNAVAILABLE` |
| 5 | dueInstant == evaluatedAt | open action due granica tačno u T | ulazi u M3 |
| 6 | dueAt < evaluatedAt | open action due najmanje jedan instant prije T | ulazi u M3 |
| 7 | action completed prije T | authoritative classifier daje non-open/non-actionable as-of T | ne ulazi u M2 ni M3 |
| 8 | action completed poslije T | completion effective poslije T | action je klasifikovana prema stanju as-of T; ako je tada open ulazi u M2 i, uz dostignutu due granicu, u M3 |
| 9 | future action | action effect počinje poslije T | ne ulazi u M2/M3 prije effective granice |
| 10 | superseded revision | dvije immutable revisions sa validnim supersession/currentness tragom | koristi se samo VLA-resolved revision as-of T; nema lexical/timestamp winner-a |
| 11 | effective-as-of reconstruction | isti matter derive za raniji effective `T` | koristi danas accepted correction/supersession authority da rekonstruiše effective truth za `T`; ne tvrdi known-at-time analytics |
| 12 | missing operational state | nema authoritative current matter operational state/effective start | M5 `UNAVAILABLE`, bez numeric value |
| 13 | conflicting operational state | resolver ne može razriješiti dva relevantna current state-a | M5 `INVALID`; nema arbitrary winner-a |
| 14 | invalid temporal value | malformed timestamp ili current state effective start poslije T | pogođeni rezultat `INVALID`; greška se lokalizuje gdje je dokazivo |
| 15 | filesystem mtime independence | promijeniti samo `mtime` fixture fajla bez semantic revision/event promjene | metrics rezultat semantički identičan |
| 16 | Matter State projection independence | obrisati ili izmijeniti generated Matter State bez authoritative reconciliation efekta | rebuild iz Layers 1–2 daje isti metrics rezultat; Matter State nije authority |
| 17 | metrics projection independence | izmijeniti/obrisati metrics projection | authoritative input ostaje isti; sljedeći rebuild odbacuje izmjenu i vraća expected rezultat |
| 18 | canonical non-mutation | snimiti canonical/history bytes prije i poslije derive/rebuild-a | byte-identični inputi; nijedna nova revision/event nije nastala samo zbog read/derive-a |
| 19 | minimal read model | persist validnu projection pa pozvati portfolio i matter read | oba vraćaju isti projection identity/version/T; read ne derive-uje niti popravlja |
| 20 | traceability | pregledati svaki result basis | metric ID/T/version/scope i exact relevantne canonical/event reference postoje; portfolio navodi contributor scope |
| 21 | metricDefinitionVersion | isti input/T, druga version | rezultat eksplicitno nosi version; nema silent reinterpretation ili overwrite-a starog projection-a |
| 22 | no production coupling | izvršiti isolated test suite | nema importa iz `src/`, produkcijskog writer-a, stvarnog workspace-a ili automatske promocije |
| 23 | zero outbound | pratiti process i child-process mrežne konekcije tokom suite-a | nula aplikacijski iniciranih outbound konekcija; nema AI/API/telemetry poziva |
| 24 | full regression quality gates | za executable acceptance pokrenuti targeted suite, full tests, typecheck, lint i build | svi gate-ovi PASS; postojeći warning se odvojeno prijavljuje, ne skriva failure |
| 25 | close/reopen | matter `CLOSED` effective T1, zatim `OPEN` effective T2 | između T1 i T2 M1 classifier `FALSE`; od T2 `TRUE`; raniji interval se ne prepisuje |
| 26 | terminal disposition separation | actions sa `COMPLETED`, `CANCELLED`, `SUPERSEDED`, `NO_LONGER_REQUIRED` | sve su non-open; samo `COMPLETED` daje completed `TRUE` |
| 27 | blocker/actionability separation | open action ima authoritative waiting/blocker state | M2 ga i dalje računa kao open; actionable resolver vraća `FALSE` |
| 28 | date-only due | date-only + authoritative timezone | due instant je start sljedećeg lokalnog dana; overdue od te granice uključivo |
| 29 | date-only missing timezone | date-only bez explicit/canonical matter timezone-a | `UNRESOLVED`; host timezone se ne koristi |
| 30 | operational correction tie/gap | correction sa explicit supersession, unresolved tie i interval prije prvog state-a | correction pobjeđuje original; tie i gap ostaju `UNRESOLVED` |

## 7. Additional failure and boundary cases

| Slučaj | Očekivani rezultat |
|---|---|
| complete zero | `COMPLETE` sa value `0`, nikad missing sentinel |
| missing matter active classifier | M1/M4 i active-only portfolio roll-up `UNAVAILABLE` |
| action operational/blocker conflict | actionable resolver `UNRESOLVED`; M2/M3 ostaju zasnovani na open/due authority-ju i ne smiju biti pokvareni samo actionability konfliktom |
| invalid authoritative due instant | pogođeni M3 `INVALID`; M2 može ostati `COMPLETE` ako action open classification ne zavisi od due vrijednosti |
| unknown relevant object type/schema/reference | projection ne smije tvrditi complete; pogođeni metric `UNAVAILABLE` ili `INVALID` prema resolver nalazu, uz reason |
| missing direct dependency | FH-1 frontier `INVALID`; pogođeni metric `INVALID` |
| unsupported relevant input | frontier incomplete/unsupported; pogođeni metric `UNAVAILABLE`, bez parcijalnog broja |
| `RECOVERY_REQUIRED` ili unreconciled manual mutation | pogođeni metric `INVALID`; retry/rebuild ne proglašava success |
| closed matter sa open actions | ne doprinosi active-only portfolio M2/M3/M4; matter-level M2/M3 smiju ostati čitljivi ako query contract to traži |
| state age is zero | M5 `COMPLETE` sa `0` kada effective start == T |
| sub-second state age | M5 koristi floor proteklih sekundi kako companion §12 definiše |
| timezone-equivalent instant | različiti RFC 3339 offset zapisi istog instanta daju isti rezultat nakon UTC normalizacije |
| revision lifecycle `ACTIVE` matter record | nema direktnu M1 posljedicu; potreban matter business lifecycle authority |
| lifecycle `ACTIVE` legal action | M2 `UNAVAILABLE`, ne implicitno open |
| accepted/reviewed/source-backed action | nema open/closed posljedicu bez operational state-a |
| date-only deadline sa authoritative timezone-om | next-local-day boundary; nema synthetic end-of-day instant |

## 8. Rebuildability executable protocol

Izolovani executable test u `spikes/mvs-0-metrics/` izvršava ovaj protokol bez produkcijskog coupling-a:

1. kreirati synthetic authoritative fixture samo unutar `C:\SDJ_TEST\SDJ_LEGAL_TEST\`;
2. potvrditi canonical revision/history integrity i declared dependency frontier;
3. derive metrics za fiksni T i `mvs-0/v1`;
4. persist projection A;
5. sačuvati hash/bytes svih canonical Layer 1–2 inputa;
6. obrisati samo metrics projection;
7. ponovo resolve/derive sa istim T, version i authoritative frontier-om;
8. persist projection B;
9. porediti semantic equality A == B, ignorišući isključivo deklarisani non-semantic generation metadata;
10. dokazati da su Layer 1–2 bytes/hash vrijednosti nepromijenjene;
11. očistiti samo synthetic test artefakte unutar dozvoljenog root-a.

## 9. Targeted consistency review

| Gate | Reviewed baseline | Nalaz |
|---|---|---|
| A — terminology/trust | VLA-0A terminology/trust model i transition matrix | PASS: action se mapira na `LEGAL_ACTION`; trust se ne koristi kao operational/quality score; `ACTIVE` revision lifecycle se ne proglašava matter-open statusom |
| B — source/evidence/persistence authority | VLA-0B, VLA-1A/1B | PASS: metrics koristi Layers 1–2 i typed exact references; source support ne postaje metric authority; projection/SQLite nijesu authority |
| C — evaluation/effective/supersession | VLA-0D/0E, VLA-1B i VOC-0 | PASS EVIDENCE: explicit T, effective chronology, correction/supersession, close/reopen, tie/gap i conflict -> unresolved dokazani su izolovanim testovima |
| D — Matter State | VLA-0C i VLA-1A Layer 3 | PASS: Matter State je generated input convenience/projection, nikad independent authority; delete/rebuild je acceptance slučaj |
| E — implicit canonical schema | VLA-0A taxonomy, VLA-1B i VOC-0 | PASS: nema novog `ACTION_ITEM` niti propisanog `dueAt` payload field-a; VOC-0 pojmovi su logical resolver contracti |
| F — domain decisions | VOC-0 contract/closure | PASS PROVISIONALLY: 5/5 blockera zatvoreno; FIELD taxonomy i statusi ostaju provisional |
| G — FH-1 persistence boundary | FH baseline + VOC-0 rebuild boundary | PASS ISOLATED: adapter je ostao u spike-u, koristi accepted frontier primitive, authority-only je i fail-closed; nije promovisan u production resolver |

Nije pronađena semantic contradiction koja zahtijeva izmjenu accepted VLA/FH dokumenta. VOC-0 zatvara gapove na domain-resolver granici i čuva FIELD-sensitive stavke kao vidljiv provisional debt.

## 10. Final executable metric set

| Metric | Završna kategorija | Acceptance posljedica |
|---|---|---|
| M1 | `EXECUTABLE IN ISOLATED MVS-0 — PROVISIONAL` | matter lifecycle FIELD semantics provisional |
| M2 | `EXECUTABLE IN ISOLATED MVS-0 — PROVISIONAL` | open resolver accepted; blocker taxonomy FIELD-sensitive |
| M3 | `EXECUTABLE IN ISOLATED MVS-0` | due-instant contract accepted |
| M4 | `EXECUTABLE IN ISOLATED MVS-0 — PROVISIONAL` | kompozicija provisional M1/M2 |
| M5 | `EXECUTABLE IN ISOLATED MVS-0 — PROVISIONAL` | operational taxonomy FIELD-sensitive |

`EXECUTABLE IN ISOLATED MVS-0`: **5 metrika**. Minimum od tri povezane metrike je dostignut, a izolovani executable dokaz je implementiran i testiran u `spikes/mvs-0-metrics/`.

## 11. Acceptance gates and disposition

Recorded executable evidence on 10. avgust 2026:

- targeted MVS-0 suite: **13/13 PASS**;
- full Vitest regression: **352/352 PASS** u 17 test fajlova;
- TypeScript: **PASS**;
- ESLint: **PASS**;
- Next.js production build: **PASS**;
- Desktop B0 static smoke: **PASS**;
- postojeći Turbopack NFT warning u prompt-save import trace-u ostaje non-blocking i nije MVS-0 failure.

Isolated executable acceptance potvrđuje:

- pet formula i scope-ovi su dovoljno precizni;
- `evaluatedAt` default temporal mapping je prihvatljiv;
- strict portfolio failure propagation ne prikazuje parcijalne brojeve kao potpune;
- metric projection/read model ostaju derived i rebuildable;
- VOC-0 provisional FIELD pretpostavke biće vidljive u output-u i potvrđene prije production-wide domain acceptance-a;
- FH-1 exploratory files nijesu promovisani u production resolver/rebuild implementation;
- minimalni read model vraća portfolio i matter rezultate iz iste projection identity/version/T bez ponovne derivacije;
- source guard potvrđuje da isolated implementation nema `src/` coupling niti outbound-capable dependency.

Acceptance disposition je:

```text
GO — ISOLATED MVS-0 EXECUTABLE EVIDENCE ACCEPTED WITH FIELD-0 PROVISIONAL CONTRACTS
```

Pet gapova imaju executable VOC-0 contract i izolovani acceptance dokaz. Prihvatanje je ograničeno na vertical slice i FIELD validation; nije konačno production-wide domain prihvatanje.

Prihvatanje se odnosi samo na `spikes/mvs-0-metrics/` i synthetic test artefakte u odobrenom test root-u. Ne odobrava UI, production coupling, external communication, stvarni SDJ/OneDrive workspace, commit ili push.
