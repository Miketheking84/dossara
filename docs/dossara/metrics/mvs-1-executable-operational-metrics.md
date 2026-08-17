# DOSSARA — MVS-1 Executable Operational Metrics

## 1. Document control

| Polje | Vrijednost |
|---|---|
| Work package | MVS-1 — Executable Operational Metrics Vertical Slice |
| Status | **GO — executable proof ready for acceptance** |
| Datum | 14. avgust 2026. |
| Formalni kontrolni akt | `docs/dossara/decision-alignment-register-v1.2.md` |
| Controlling domain contract | `docs/dossara/metrics/voc-1-operational-semantics-closure.md` (`voc-1/v1`) |
| Persistence baseline | Accepted VLA-0A–E, VLA-1A/1B i FH-1 commit `c9c8eb4` |
| Predecessor evidence | MVS-0 design/acceptance dokumenti i isolated spike |
| Executable evidence | `spikes/mvs-1-operational-metrics/` |
| Test workspace | Isključivo `C:\SDJ_TEST\SDJ_LEGAL_TEST\` sa sintetičkim podacima |
| Vrsta rada | Isolated executable spike; bez `src/`, UI, production persistence ili network coupling-a |

## 2. Objective

MVS-1 dokazuje da accepted VLA/FH persistence foundation i zaključane VOC-1 operational semantics mogu deterministički proizvesti minimalni skup operational metrika iz autoritativnih Layers 1–2 evidence inputa.

Slice ne predstavlja kompletan metrics sistem. Ne uvodi dashboard, analytics bazu, novi canonical lifecycle/status enum, novu persistence arhitekturu, produkcijski resolver niti FIELD integraciju.

```text
FH-1 immutable canonical revisions + JSONL state-effect history
  -> explicit dependency frontier
  -> VOC-1 pure operational resolvers
  -> multidimensional matter projection
  -> seven bounded, derived metrics
```

## 3. Authority baseline and reuse

| Potreba | Reused accepted/pre-existing primitive | MVS-1 delta |
|---|---|---|
| Canonical immutable action revision | FH-1 `writeImmutableRevision` / `readImmutableRevision` | synthetic `LEGAL_ACTION` fixture envelope only |
| Append-only semantic history | FH-1 `appendHistoryEvent` / `readHistory` | `STATE_EFFECT_EVENT` payload validation |
| Workspace containment | FH-1 `PERMITTED_TEST_ROOT` / `assertPermittedTestPath` | nema drugog filesystem root-a |
| Dependency coverage | FH-1 `assessFrontier` | exact action/event heads za declared synthetic matter frontier |
| Result algebra | MVS-0 `Resolution<T>` i postojeći unresolved reasons | nema novog general result framework-a |
| Instant/date-only logic | MVS-0 `parseInstant`, `canonicalInstant`, `resolveDateOnlyDueInstant` | governing-due authority selection iz VOC-1 |
| Domain semantics | VOC-1 Contracts 1–5 | executable resolver/projection/metric proof |

MVS-1 ne koristi FH-1 exploratory `rebuild.ts` ili `history-and-recovery.ts` kao accepted authority. Persistence harness je test-only adapter iznad accepted FH-1 primitive-a.

## 4. Implemented primitives

| Primitive | Executable behavior |
|---|---|
| `countsAsActiveMatterAsOf` | zahtijeva current engagement authority i continuation basis; prazna actionable queue ne znači inactive |
| `isOpenLegalActionAsOf` | applied action existence bez current terminal disposition-a |
| `isActionableLegalActionAsOf` | open + assignment + bez current waiting/future blocker-a |
| `isWaitingLegalActionAsOf` | izvedeno iz structured dependency-ja ili future earliest-action granice; nije lifecycle enum |
| `resolveGoverningDueInstantAsOf` | `RESOLVED` / `NO_DUE` / `UNRESOLVED`; koristi samo explicit governing legal/external ili internal deadline |
| `isOverdueLegalActionAsOf` | `OVERDUE` / `NOT_OVERDUE` / `NOT_CLASSIFIABLE_NO_DUE`; zahtijeva open action i resolved due |
| `operationalAsOf` | multidimenzionalna projection sa `Te = Tk = Tr = T` |
| `reconstructOperationalEffectiveAt` | zaseban explicit retrospective mode sa posebnim knowledge/recorded cut-off-ima |
| `deriveOperationalMetrics` | pure, deterministic derivation sedam ograničenih metrika |

Svi javni `...AsOf` resolveri primaju explicit query instant. Core resolver nema `Date.now()`, host timezone fallback, locale ordering, filesystem ordering niti insertion-order winner-a.

## 5. Executable VOC-1 semantics

### 5.1 Active is not actionable

Centralni fixture `matter-b` ima:

- open professional engagement;
- applied/open `action-b`;
- current dependency `WAITING` na klijentski dokument;
- explicit authoritative `NO_DUE`;
- nema current actionable step-a.

Rezultat:

```text
active = TRUE
open action = TRUE
waiting = TRUE
actionable = FALSE
```

Portfolio dokaz dodatno daje `activeMatterCount = 5` i `mattersWithActionableWorkCount = 4`; metrike nijesu semantički ni numerički iste.

### 5.2 Legal action lifecycle

Open, actionable, waiting i terminal disposition se računaju odvojeno. `ACTION_DEPENDENCY.status = WAITING` je authority fact o dependency-ju, ne canonical action lifecycle state. Completion/cancellation/supersession ostaju terminalni action dispositions i nijesu korišćeni kao waiting.

Missing assignment daje `UNRESOLVED/MISSING_AUTHORITY`; ne pretvara se u `actionable = false` kao navodno dokazanu poslovnu činjenicu.

### 5.3 Governing due

Due resolver:

1. razrješava current candidate po effective/knowledge/recorded query granicama i explicit supersession-u;
2. razmatra samo candidate sa `governing = true`;
3. prihvata samo `LEGAL_EXTERNAL` ili `INTERNAL` kao eligible due kind;
4. normalizuje explicit datetime ili date-only + authoritative timezone;
5. vraća `NO_DUE` samo iz explicit authority fact-a;
6. vraća `UNRESOLVED/CONFLICTING_AUTHORITY` za više governing candidate-a.

Target/event datum se nikada ne koristi samo zato što je raniji. Provenance rezultata sadrži exact event/revision i rule ID `VOC1_GOVERNING_CONFIRMED_DEADLINE` ili `VOC1_AUTHORITATIVE_NO_DUE`.

### 5.4 Multidimensional operational state

Matter projection vraća nezavisno:

- `active`;
- `hasActionableWork`;
- `waiting`;
- `hasOverdueWork`;
- `nextActionableStepAvailable`;
- action-level open/actionable/waiting/due/overdue rezultate;
- query koordinate i provenance po rezultatu.

Ne postoji jedan magic operational status niti UI DTO authority.

### 5.5 Historical and retrospective separation

```text
operationalAsOf(T)
  -> effectiveAt = T
  -> knowledgeCutoff = T
  -> recordedCutoff = T
```

Testni late correction je effective 1. jula, known 20. avgusta i recorded 21. avgusta. `operationalAsOf(10. avgust)` je ne koristi i vraća ranije accepted active stanje.

Zasebni `reconstructOperationalEffectiveAt(10. avgust, 22. avgust, 22. avgust)` koristi correction i vraća non-active. Ponovljeni `operationalAsOf(10. avgust)` ostaje identičan prvom historical rezultatu.

## 6. Metric definitions and fixture results

| Metric | Definition | Fixture result at `2026-08-10T12:00:00.000Z` |
|---|---|---:|
| `activeMatterCount` | matters sa resolved active `TRUE` | 5 |
| `mattersWithActionableWorkCount` | active matters sa najmanje jednom resolved actionable action | 4 |
| `waitingMatterCount` | active matters sa najmanje jednom resolved waiting action | 1 |
| `openLegalActionCount` | actions sa resolved open `TRUE` | 5 |
| `actionableLegalActionCount` | actions sa resolved actionable `TRUE` | 4 |
| `overdueLegalActionCount` | open actions sa classification `OVERDUE` | 2 |
| `mattersWithoutNextActionableStepCount` | active matters sa complete action frontier-om i actionable `FALSE` | 1 |

`NO_DUE` se ne računa kao overdue. `UNRESOLVED` u contributor scope-u propagira unresolved metric rezultat bez numeric value-a.

## 7. Fixture scenarios

| # | Scenario | Executable evidence |
|---:|---|---|
| 1 | Active + actionable | `matter-a` / `action-a`: active/open/actionable |
| 2 | Active + waiting | `matter-b` / `action-b`: active/open/waiting, non-actionable |
| 3 | Completed matter | `matter-c`: engagement `ENDED`, active false |
| 4 | Open action without due | `action-d`: explicit `NO_DUE`; target/event ignored; overdue not classifiable |
| 5 | Legal external deadline | `action-e`: not overdue prije instant-a, overdue od granice uključivo |
| 6 | Competing dates | `action-f`: external governing pobjeđuje samo zbog explicit authority-ja; internal/target/event nijesu governing |
| 7 | Ambiguous due authority | synthetic action sa dva governing deadline-a -> unresolved/invalid |
| 8 | Historical knowledge boundary | later-known/recorded correction isključena iz `operationalAsOf(T)` |
| 9 | Later correction | retrospective current understanding se mijenja; raniji historical query ostaje reproduktivan |
| 10 | Waiting is derived | dependency fact proizvodi waiting; nema action terminal/lifecycle waiting disposition-a |

## 8. Fail-closed cases

Testovi eksplicitno dokazuju:

- dva governing due candidate-a -> `CONFLICTING_AUTHORITY`, bez heuristike;
- missing assignment -> `MISSING_AUTHORITY`, ne `false`;
- `NO_DUE` je zasebna resolved klasifikacija;
- target/event candidate ne postaje due;
- frontier `STALE/INCOMPLETE/INVALID` se mapira na unresolved/invalid rezultat kroz FH-1 assessment;
- invalid temporal input ne koristi host environment za repair;
- unresolved action contributor uklanja numeric metric value umjesto objavljivanja parcijalnog count-a.

## 9. Provenance and determinism

Svaki `Resolution<T>` nosi stable, deduplicated exact `{recordId, revisionId}` reference. Governing-due value dodatno nosi `candidateId`, `dueKind` i applied `ruleId`.

Determinism je dokazan na dva nivoa:

1. reversed in-memory matter/action/fact insertion order daje identičnu projection;
2. isti authority dataset persisted u dva FH-1 workspace-a, jednom forward i jednom reverse history order-om, cold-read/rebuild daje identičnu projection i iste metric rezultate.

Canonical action revision bytes ostaju nepromijenjeni nakon derivacije. Test harness kreira i uklanja samo synthetic `mvs1-*` foldere neposredno ispod dozvoljenog test root-a.

## 10. Test evidence

| Gate | Command | Result |
|---|---|---|
| MVS-1 targeted | `npm.cmd test -- spikes/mvs-1-operational-metrics/mvs-1-operational-metrics.test.ts` | **PASS — 1 file, 16/16 tests** |
| FH-1 regression | `npm.cmd test -- spikes/foundation-hardening/foundation-hardening.test.ts spikes/foundation-hardening/persistence-spike.integration.test.ts` | **PASS — 2 files, 18/18 tests** |
| Full Vitest | `npm.cmd test` | **PASS — 19 files, 382/382 tests** |
| TypeScript | `npx.cmd tsc --noEmit` | **PASS** |
| Full ESLint | `npm.cmd run lint` | **PASS** |
| Next.js build | `npm.cmd run build` | **PASS — Next.js 16.2.11, 19/19 static pages** |
| Diff whitespace | `git diff --check` + isolated untracked-file checks | **PASS** |

Build zadržava postojeći non-blocking Turbopack NFT warning u `src/lib/sdj-prompts.ts` import trace-u. MVS-1 nema import ili izmjenu tog production path-a.

## 11. Architecture findings

| Gate | Finding |
|---|---|
| VOC-1 compatibility | PASS: svih pet zaključanih ugovora dokazano bez reinterpretacije |
| VLA Layers 1–2 authority | PASS: canonical action revisions + state-effect JSONL history; projection/metrics derived |
| VLA-1B persistence | PASS: structured exact revisions, history, typed identities i declared frontier; nema SQLite authority-ja |
| FH-1 boundary | PASS: reused accepted primitives; exploratory rebuild/history fajlovi nijesu promovisani |
| Production coupling | PASS: source guard potvrđuje bez `src/`, UI, HTTP/network i hidden-time importa |
| Scope | PASS: četiri spike fajla + jedan documentation fajl; pre-existing dirty paths netaknuti |

Nije pronađena nova domain odluka potrebna za active/non-active, action lifecycle, waiting, governing due, operational currentness ili historical semantics.

## 12. Limitations

Non-blocking implementation granice:

- harness je synthetic/test-only i nije production resolver;
- `STATE_EFFECT_EVENT` payload je uzak MVS-1 fixture contract, ne production schema;
- nema production manifest/head/sealed-segment lifecycle-a, recovery UI-ja ili full reconciliation workflowa;
- nema office/matter timezone fallback-a; date-only bez explicit authoritative timezone-a failuje zatvoreno;
- nema `due soon` metric parameter-a, dashboarda, refresh scheduler-a ili historical analytics UI-ja;
- nema FIELD validation-a, stvarnih predmeta ili pravog SDJ/OneDrive pristupa;
- MVS-0/VOC-0 dokumentacioni status reconciliation ostaje zaseban governance posao.

Nijedna od ovih stavki ne blokira executable semantic proof iz MVS-1 scope-a.

## 13. Acceptance result

```text
GO — MVS-1 EXECUTABLE PROOF READY FOR ACCEPTANCE
```

Acceptance je ograničen na isolated executable evidence. Ne autorizuje production implementation, UI, migration, FIELD pilot, stvarni workspace, commit, push, merge, rebase ili tag.

## 14. STOP boundary

MVS-1 završava acceptance report-om. Naredni korak zahtijeva zaseban eksplicitan nalog naručioca.
