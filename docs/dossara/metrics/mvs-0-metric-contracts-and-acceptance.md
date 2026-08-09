# DOSSARA — MVS-0 Metric Contracts and Acceptance

## 1. Document control

| Polje | Vrijednost |
|---|---|
| Work package | MVS-0 — Metrics Vertical Slice Design |
| Status | Corrective acceptance contract — executable gate blocked |
| Datum | 10. avgust 2026. |
| Companion | `docs/dossara/metrics/mvs-0-metrics-vertical-slice.md` |
| Normativni baseline | Accepted VLA-0A–E, VLA-1A/1B i FH-1 acceptance commit `c9c8eb4` |
| Test boundary | Budući executable fixtures isključivo u `C:\SDJ_TEST\SDJ_LEGAL_TEST\` |

## 2. Reading rule

Ovaj dokument zaključava observable acceptance ponašanje, ne implementaciju. Svi nazivi classifier-a i resolver-a su konceptualne granice. Nijesu novi canonical object types, payload fields ili dozvola da se zaobiđu VLA review/apply/currentness pravila.

Acceptance rezultat je validan samo ako koristi isti declared authoritative frontier, isti `evaluatedAt`, isti `metricDefinitionVersion` i MVS-0 contract iz companion dokumenta. Test fixture smije deklarisati već razriješene outcomes samo kao design oracle za metric-level formulu; takva deklaracija nije domain authority i ne čini metriku executable. VLA resolver test mora zasebno dokazati kako je svaki outcome nastao.

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

Conditional design-oracle results, primjenjivi tek nakon acceptance-a nedostajućih authority contracta:

| Metric | Scope | Expected value |
|---|---|---:|
| `M1_ACTIVE_MATTER_COUNT` | portfolio | 3 |
| `M2_OPEN_ACTION_ITEM_COUNT` | portfolio | 3 |
| `M3_OVERDUE_OPEN_ACTION_ITEM_COUNT` | portfolio | 1 |
| `M4_ACTIVE_MATTERS_WITHOUT_OPEN_ACTIONS` | portfolio | 1 |
| `M2_OPEN_ACTION_ITEM_COUNT` | Matter A | 2 |
| `M3_OVERDUE_OPEN_ACTION_ITEM_COUNT` | Matter A | 1 |
| `M5_CURRENT_OPERATIONAL_STATE_AGE_SECONDS` | Matter A | 777600 |

Devet dana od `2026-08-01T12:00:00Z` do `2026-08-10T12:00:00Z` jednako je `777600` cijelih sekundi. Ove vrijednosti nijesu trenutni executable acceptance gate. Fixture ne smije pre-resolved labelama `active`, `open` ili `current operational state` zaobići authority blockers iz companion §§4 i 15.

## 4. Corrective classification oracles

### 4.1 Matter lifecycle oracle

| Authoritative lifecycle observation | `countsAsActiveMatterAsOf` outcome |
|---|---|
| `ACTIVE` exact revision | `cannot-classify` — current revision nije poslovno active matter |
| `SUPERSEDED` exact revision | follow accepted successor; bez jednoznačnog current result-a `INVALID` |
| `WITHDRAWN` exact revision | `cannot-classify` — withdrawal nije matter closure |
| `VOIDED` kao jedini relevantni osnov | `INVALID` |
| missing matter operational/closure contract | `UNAVAILABLE` |

Nema accepted lifecycle observation-a koji trenutno daje finalni true/false matter rezultat. Test koji hard-code-uje `ACTIVE -> true` mora pasti.

### 4.2 `LEGAL_ACTION` lifecycle oracle

| Authoritative lifecycle observation | `countsAsOpenActionAsOf` outcome |
|---|---|
| `ACTIVE` exact revision | `cannot-classify` — current revision nije open/completed operational state |
| `SUPERSEDED` exact revision | ta revision ne doprinosi; follow successor prije action classification-a |
| `WITHDRAWN` | `cannot-classify` dok object-specific applied-effect contract ne kaže da effect više nije current |
| `VOIDED` exact revision | ta revision ne doprinosi; unresolved corrective action scope je `INVALID` |
| review/trust/verification/approval status | nema open/closed posljedicu |

Test koji mapira `ACCEPTED`, verified/source-backed ili lifecycle `ACTIVE` direktno na open mora pasti.

### 4.3 Temporal oracle

M3 smije dobiti `COMPLETE` samo kada accepted contract preda validan authoritative action due **instant**. Date-only vrijednost, `DEADLINE` bez accepted action-due relation-a ili vrijednost kojoj nedostaje precision daje `UNAVAILABLE`; malformed/conflicting instant daje `INVALID`. Testovi moraju dokazati da nema `00:00`, `23:59`, end-of-business-day ili filesystem-time konverzije.

### 4.4 Operational-state oracle

M5 smije dobiti `COMPLETE` samo kada accepted resolver preda exact authoritative matter operational-state identity, jednoznačan currentness as-of T i validan `effective_at`/`effective_from`. Matter State projection ili segment label sam nije dovoljan. Dok taj contract ne postoji, rezultat je `UNAVAILABLE` i M5 nije executable gate.

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

Slučajevi u ovoj sekciji ostaju obavezni za metriku tek kada njena završna kategorija postane `EXECUTABLE IN MVS-0`. Do tada su design-forward acceptance katalog; ne mogu proizvesti lažni PASS pre-resolved fixture labelama.

| # | Slučaj | Setup / radnja | Očekivani rezultat |
|---:|---|---|---|
| 1 | deterministic repeat | isti authoritative fixture, T i version derive-ovati najmanje dva puta | semantički identični result sets i stabilno uređene reference/contributor liste |
| 2 | projection delete + rebuild | persist A, obrisati samo metrics projection, ponovo derive/persist B | A == B semantički; authority netaknut |
| 3 | isti canonical input, različit `evaluatedAt` | derive za T1 i T2 | samo time-sensitive rezultati smiju se promijeniti prema effective/due granicama; oba rezultata nose svoj T |
| 4 | missing dueAt | open/actionable action nema authoritative due instant | ulazi u M2; ne ulazi u M3; M3 nije `UNAVAILABLE` samo zbog odsustva optional due instant-a |
| 5 | dueAt == evaluatedAt | open action due tačno u T | ne ulazi u M3 |
| 6 | dueAt < evaluatedAt | open action due najmanje jedan instant prije T | ulazi u M3 |
| 7 | action completed prije T | authoritative classifier daje non-open/non-actionable as-of T | ne ulazi u M2 ni M3 |
| 8 | action completed poslije T | completion effective poslije T | action je klasifikovana prema stanju as-of T; ako je tada open/actionable ulazi u M2 i, uz due<T, u M3 |
| 9 | future action | action effect počinje poslije T | ne ulazi u M2/M3 prije effective granice |
| 10 | superseded revision | dvije immutable revisions sa validnim supersession/currentness tragom | koristi se samo VLA-resolved revision as-of T; nema lexical/timestamp winner-a |
| 11 | historical as-of reconstruction | isti matter derive za raniji T uz `Te=Tk=Tr=T` | ne koristi kasnije recorded/review/correction/disposition podatke; exact historical basis vraćen |
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
| 24 | full regression quality gates | nakon buduće implementacije pokrenuti targeted suite, full tests, typecheck, lint i build | svi gate-ovi PASS; postojeći warning se odvojeno prijavljuje, ne skriva failure |

## 7. Additional failure and boundary cases

| Slučaj | Očekivani rezultat |
|---|---|
| complete zero | `COMPLETE` sa value `0`, nikad missing sentinel |
| missing matter active classifier | M1/M4 i active-only portfolio roll-up `UNAVAILABLE` |
| action operational conflict | pogođeni M2/M3 `INVALID`; M4/portfolio nasljeđuju strogi status gdje rezultat može biti pogođen |
| invalid authoritative due instant | pogođeni M3 `INVALID`; M2 može ostati `COMPLETE` ako action open classification ne zavisi od due vrijednosti |
| unknown relevant object type/schema/reference | projection ne smije tvrditi complete; pogođeni metric `UNAVAILABLE` ili `INVALID` prema resolver nalazu, uz reason |
| missing direct dependency | FH-1 frontier `INVALID`; pogođeni metric `INVALID` |
| unsupported relevant input | frontier incomplete/unsupported; pogođeni metric `UNAVAILABLE`, bez parcijalnog broja |
| `RECOVERY_REQUIRED` ili unreconciled manual mutation | pogođeni metric `INVALID`; retry/rebuild ne proglašava success |
| closed matter sa open actions | ne doprinosi active-only portfolio M2/M3/M4; matter-level M2/M3 smiju ostati čitljivi ako query contract to traži |
| state age is zero | M5 `COMPLETE` sa `0` kada effective start == T |
| sub-second state age | M5 koristi floor proteklih sekundi kako companion §12 definiše |
| timezone-equivalent instant | različiti RFC 3339 offset zapisi istog instanta daju isti rezultat nakon UTC normalizacije |
| lifecycle `ACTIVE` matter | M1 `UNAVAILABLE`, ne implicitno value `1` |
| lifecycle `ACTIVE` legal action | M2 `UNAVAILABLE`, ne implicitno open |
| accepted/reviewed/source-backed action | nema open/closed posljedicu bez operational state-a |
| date-only deadline | M3 `UNAVAILABLE`; nema synthetic time-of-day |

## 8. Rebuildability executable protocol

Budući zasebno odobren acceptance test mora izvršiti ovaj redoslijed bez prečice. Protokol trenutno nije autorizovan jer nijedna metrika nema `EXECUTABLE IN MVS-0` status:

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
| C — evaluation/effective/supersession | VLA-0D/0E i VLA-1B currentness | DESIGN LOCKED / EXECUTION BLOCKED: T se mapira na `Te=Tk=Tr=T`; executable as-of resolver ne postoji |
| D — Matter State | VLA-0C i VLA-1A Layer 3 | PASS: Matter State je generated input convenience/projection, nikad independent authority; delete/rebuild je acceptance slučaj |
| E — implicit canonical schema | VLA-0A taxonomy i VLA-1B envelope/objectType | PASS: nema novog `ACTION_ITEM`, matter `ACTIVE`, `dueAt` payload field ili operational-state object-a; `cannot-classify` je eksplicitan |
| F — new VLA decisions | VLA-0C open decisions; VLA-1A object contracts | BLOCKER: matter activity, action operational, due mapping i matter operational-state/effective-start ostaju authority decisions |
| G — FH-1 persistence boundary | FH decision log/test report i commit `c9c8eb4` | OPTION B: architectural contract postoji; accepted `assessFrontier` nije resolver, a `rebuild.ts`/`history-and-recovery.ts` su exploratory; budući minimal adapter mora biti isolated i fail-closed |

Nije pronađena semantic contradiction koja bi zahtijevala izmjenu accepted VLA/FH dokumenta. Gapovi više nijesu implicitni: dokumentovani su kao blockers/deferred dependencies.

## 10. Final executable metric set

| Metric | Završna kategorija | Acceptance posljedica |
|---|---|---|
| M1 | `BLOCKED BY AUTHORITY CONTRACT` | nema accepted true/false matter classification-a |
| M2 | `BLOCKED BY AUTHORITY CONTRACT` | nema accepted open/actionable/completed classification-a |
| M3 | `DESIGN DEFINED — EXECUTION DEFERRED` | formula postoji; M2 i instant-level due contract nedostaju |
| M4 | `BLOCKED BY AUTHORITY CONTRACT` | zavisi od M1 i M2 |
| M5 | `DESIGN DEFINED — EXECUTION DEFERRED` | operational-state identity/currentness/effective-start nije accepted |

`EXECUTABLE IN MVS-0`: **nijedna metrika**. Minimum od tri povezane metrike nije dostignut, pa nema executable acceptance suite-a koji ovaj pass smije autorizovati.

## 11. Acceptance gates and disposition

Documentation design acceptance zahtijeva da reviewer potvrdi:

- pet formula i scope-ovi su dovoljno precizni;
- `evaluatedAt` default temporal mapping je prihvatljiv;
- strict portfolio failure propagation ne prikazuje parcijalne brojeve kao potpune;
- metric projection/read model ostaju derived i rebuildable;
- četiri domain authority odluke biće zatvorene prije executable rada, u zasebno odobrenom scope-u;
- FH-1 exploratory files neće biti promovisani kao accepted resolver/rebuild implementation bez novog acceptance-a.

Trenutna preporuka je:

```text
NO-GO — MVS-0 DESIGN
```

Pet gapova su sada eksplicitno decision-locked, ali potrebna je izričita human authority odluka/disposition prije executable WP-a za:

1. authoritative matter active/non-active contract;
2. authoritative `LEGAL_ACTION` open/actionable/completed contract;
3. authoritative action due-instant mapping;
4. authoritative matter operational-state/currentness/effective-start contract;
5. accepted executable VLA/FH historical as-of resolution i rebuild boundary prije implementation starta.

Zato se MVS-0 još ne može human-acceptovati kao executable-ready design bez nove arhitektonske/authority rasprave. Ovaj acceptance contract ne odobrava metrics kod, fixtures, tests, dependencies, UI, production coupling, external communication, stvarni SDJ/OneDrive workspace ili commit.
