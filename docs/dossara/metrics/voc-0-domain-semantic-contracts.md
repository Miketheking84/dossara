# DOSSARA — VOC-0 Domain Semantic Contracts

> **Historical status notice (GOV-REC-1).** Ovaj dokument čuva VOC-0 stanje, provisional granice i acceptance ishod iz vremena tog work package-a; njegovi tehnički nalazi, rationale i tadašnji status nijesu retroaktivno promijenjeni. Za sadašnju operational-semantics interpretaciju važi successor authority chain: VOC-1 je zatvorio pet ugovora (`09b74f514fcb56fbf20d74019ef2542aeb675b12`), a MVS-1 je prihvaćeni executable proof tih semantics (`b590e1738e88711f2d3aff5a0969190fe76e4cff`). Ovaj dokument ostaje historical governance artefakt i nije current authority tamo gdje ga VOC-1/MVS-1 preciziraju ili zamjenjuju.

## 1. Document control

| Polje | Vrijednost |
|---|---|
| Work package | VOC-0 — Metrics Vocabulary and Resolver Contracts |
| Status | Accepted provisionally for isolated MVS executable vertical slice and FIELD-0 validation |
| Datum | 10. avgust 2026. |
| Formalni kontrolni akt | `docs/dossara/decision-alignment-register-v1.2.md` |
| Normativni baseline | Accepted VLA-0A–E, VLA-1A/1B i FH-1 acceptance baseline |
| Companion acceptance | `docs/dossara/metrics/voc-0-contract-acceptance-and-closure.md` |
| Downstream design | `docs/dossara/metrics/mvs-0-metrics-vertical-slice.md` |
| Vrsta rada | Domain/resolver contract; bez production implementacije, UI-ja ili production coupling-a |

## 2. Decision and scope

VOC-0 zatvara pet MVS-0 authority/semantic blockera executable contract-om. Odluka je:

> **GO WITH PROVISIONAL CONTRACTS**

MVS-0 metrics implementation je odblokirana isključivo za uzak, izolovan executable vertical slice nad sintetičkim fixture-ima i za kasniju FIELD-0 validaciju. Ova odluka nije prihvatanje konačne production-wide poslovne semantike.

VOC-0 ne mijenja VLA/FH authority boundary. Metrics, generated Matter State, read modeli, cache, dashboard podaci i disposable SQLite/FTS indeks ostaju non-authoritative i potpuno rebuildable.

## 3. Common resolver contract

Svi classification resolveri vraćaju:

```text
TRUE | FALSE | UNRESOLVED
```

Temporalni/value resolveri mogu vratiti dokumentovani typed rezultat, `NULL` samo kada je odsustvo autoritativno utvrđeno, ili `UNRESOLVED`.

`UNRESOLVED` nikada nije `FALSE`, nula, prazna lista niti dozvola za best guess. Kada je moguće, rezultat nosi machine-readable reason:

- `MISSING_EFFECTIVE_TIME`;
- `CONFLICTING_AUTHORITY`;
- `INVALID_TEMPORAL_DATA`;
- `MISSING_TIMEZONE`;
- `AMBIGUOUS_SUPERSESSION`;
- `MISSING_PREREQUISITE_EVIDENCE`.

Svaki historical resolver prima `evaluatedAt = T` kao eksplicitni input. Core business logic ne smije koristiti `Date.now()`, host timezone, filesystem `mtime`, filename order, lexical ID order, UUID order, ingestion order ili projection generation time kao skriveni authority.

## 4. Contract 1 — Matter Active / Non-Active

```text
countsAsActiveMatterAsOf(matterId, T)
  -> TRUE | FALSE | UNRESOLVED
```

Za metrics, active znači da authoritative matter lifecycle state as of `T` nije terminalan. To je lifecycle portfolio classification, a ne tvrdnja da neko trenutno radi na predmetu.

Minimalna provisional mapa:

| Authoritative matter lifecycle state | Active portfolio |
|---|---|
| `OPEN` | `TRUE` |
| `ACTIVE` | `TRUE` |
| `SUSPENDED` | `TRUE` — FIELD-0 provisional |
| `ON_HOLD` | `TRUE` — FIELD-0 provisional |
| `CLOSED` | `FALSE` |
| `CANCELLED` | `FALSE` |
| `ARCHIVED` | `FALSE` — FIELD-0 provisional ako je lifecycle status |

`SUSPENDED` ili `ON_HOLD` predmet može biti active portfolio matter, ali nije automatski operationally actionable ili busy matter.

Reopening ne prepisuje istoriju. Ako je `CLOSED` effective 1. jula, a `OPEN` effective 5. avgusta, rezultat je `FALSE` za 1. avgust i `TRUE` za 10. avgust.

Status bez razrješivog effective timestamp-a daje `UNRESOLVED`. Dva konkurentna authoritative lifecycle recorda za isti effective period, bez authoritative correction/supersession veze, daju `UNRESOLVED`.

## 5. Contract 2 — `LEGAL_ACTION`

Open, completed i actionable su tri odvojena pitanja:

```text
isLegalActionOpenAsOf(actionId, T)
isLegalActionCompletedAsOf(actionId, T)
isLegalActionActionableAsOf(actionId, T)
  -> TRUE | FALSE | UNRESOLVED
```

### 5.1 Completed

Samo authoritative disposition `COMPLETED` daje `TRUE`. `CANCELLED`, `SUPERSEDED` i `NO_LONGER_REQUIRED` daju `FALSE` za pitanje completed, iako action više nije open. Nerazrješiva terminal disposition daje `UNRESOLVED`.

### 5.2 Open

```text
OPEN = authoritative existence as of T AND no authoritative terminal disposition effective as of T
```

Terminal dispositions za ovaj contract su:

- `COMPLETED`;
- `CANCELLED`;
- `SUPERSEDED`;
- `NO_LONGER_REQUIRED`.

Ako existence, terminality ili effective granica nijesu pouzdano razrješivi, rezultat je `UNRESOLVED`.

### 5.3 Actionable

Action je actionable samo kada structured authority dokazuje sve primjenjivo:

```text
OPEN
AND NOT AUTHORITATIVELY BLOCKED
AND earliestActionAt <= T, kada earliestActionAt postoji
AND nema authoritative waiting state koji sprečava akciju
AND svaki već deklarisani prerequisite je zadovoljen
```

Provisional blocker/waiting primjeri su `WAITING_ON_CLIENT`, `WAITING_ON_OTHER_SIDE`, `WAITING_ON_COURT`, `WAITING_ON_AUTHORITY` i `WAITING_ON_DOCUMENT`. Konačna taxonomy je FIELD-0 pitanje.

VOC-0 ne uvodi dependency graph. Ako prerequisite nije deklarisan, resolver ga ne izmišlja. Ako jeste deklarisan, ali se ne može provjeriti, rezultat je `UNRESOLVED`.

Actionability se ne smije izvesti iz naziva, opisa, AI teksta, “next step” rečenice ili UI pozicije.

## 6. Contract 3 — Authoritative Action Due Instant

```text
resolveActionDueInstant(actionId)
  -> INSTANT | NULL | UNRESOLVED
```

- `INSTANT`: validan authoritative due podatak jednoznačno je pretvoren u instant.
- `NULL`: authority eksplicitno utvrđuje da action nema due date/time.
- `UNRESOLVED`: due podatak postoji ili se očekuje, ali se ne može jednoznačno interpretirati.

Full datetime sa authoritative timezone/offset-om direktno se normalizuje u instant.

Date-only due važi tokom cijelog navedenog lokalnog kalendarskog dana. Njegova comparison granica je početak sljedećeg lokalnog kalendarskog dana u authoritative timezone-u:

```text
dueInstant = startOfNextLocalCalendarDay(dateOnly, authoritativeTimezone)
isOverdueAsOf(actionId, T) = T >= dueInstant
```

Timezone precedence:

1. explicit authoritative timezone na due field-u/action-u;
2. canonical matter timezone, samo ako već postoji u accepted modelu;
3. inače `UNRESOLVED`.

Host machine timezone i nevidljivi `Europe/Belgrade` fallback su zabranjeni. Eventualni office default timezone mora biti budući canonical configuration input odobren kroz FIELD-0.

Invalid datum, nepoznata timezone, konkurentni due podaci ili date-only bez dozvoljene timezone rezolucije daju `UNRESOLVED`; heuristička popravka je zabranjena. `NULL` ne znači “not overdue” kao data-quality tvrdnja i action bez poznatog roka ne ulazi u overdue denominator.

VOC-0 koristi samo explicitly recorded authoritative due data. Automatsko računanje zakonskih ili procesnih rokova nije dozvoljeno.

## 7. Contract 4 — Matter Operational State

Lifecycle i operational state ostaju odvojene ose. `ACTIVE` lifecycle i `WAITING_ON_CLIENT` operational state mogu istovremeno biti tačni.

```text
resolveMatterOperationalStateAsOf(matterId, T)
  -> {
       state,
       effectiveFrom,
       provenance,
       resolutionStatus: RESOLVED | UNRESOLVED
     }
```

Current state as of `T` je authoritative state čiji je `effectiveFrom <= T`, koji nije authoritative superseded za taj effective period i poslije kojeg nema kasnije effective transition prije ili na `T`. Effective chronology pobjeđuje file chronology.

`effectiveFrom` je početak stvarnog trajanja state-a, ne vrijeme unosa. Correction/supersession mora biti explicit; originalni zapis se ne briše. Dva različita authoritative state-a sa istim `effectiveFrom`, bez supersession/correction veze, daju `UNRESOLVED`.

Ako matter postoji prije prvog operational state-a, interval prije prvog state-a je `UNRESOLVED`; UI state se ne prenosi unazad.

Provisional prvi skup može sadržati:

- `WORK_IN_PROGRESS`;
- `WAITING_ON_CLIENT`;
- `WAITING_ON_OTHER_SIDE`;
- `WAITING_ON_COURT`;
- `WAITING_ON_AUTHORITY`;
- `READY_FOR_REVIEW`;
- `NO_NEXT_ACTION`.

Konačna taxonomy i precizne razlike među waiting state-ovima ostaju FIELD-0 pitanja.

## 8. Contract 5 — Historical As-Of Resolver and Rebuild Boundary

```text
resolveMatterAsOf(matterId, evaluatedAt)
```

Ovo je logical contract i može biti kompozicija više resolvera.

Dozvoljeni authority inputs su canonical immutable revisions, accepted semantic history/events, effective timestamps, explicit supersession/correction metadata i provenance/review/verification metadata kada accepted model nalaže da utiču na authority.

Required input ne smiju biti generated Matter State, metrics cache/projection, SQLite/FTS, UI ili dashboard podaci.

Primary ordering je effective business time. Kod istog effective time-a samo explicit authoritative supersession/correction smije razriješiti konflikt; inače je rezultat `UNRESOLVED`.

Prvi MVS slice implementira effective-as-of reconstruction: šta danas prihvaćeni authority kaže da je važilo u `T`. Known-at-time/bitemporal analytics je deferred, ali evidence potrebna za njegovu buduću rekonstrukciju ne smije biti uništena.

Authority i non-rebuildable evidence:

- canonical revisions;
- authoritative semantic history;
- provenance;
- supersession/correction records;
- effective-time evidence.

Potpuno rebuildable artefakti:

- metrics projection/cache;
- generated Matter State;
- read modeli;
- dashboard statistics;
- derived UI state;
- disposable SQLite/FTS indeks.

Obrisan derived state mora se iz istog authority input-a, istog `evaluatedAt` i iste contract verzije obnoviti u semantički identičan rezultat.

## 9. Locked cross-contract invariants

1. Metrics nikada nijesu authority.
2. `UNKNOWN`/`UNRESOLVED` nije `FALSE`.
3. Missing due date nije isto što i “not overdue”.
4. `OPEN` nije `ACTIONABLE`.
5. Active matter nije operationally busy matter.
6. Lifecycle status nije operational state.
7. Recorded time nije effective time.
8. Generated projection ne razrješava authority conflict.
9. Rebuild ne mijenja canonical authority.
10. Isti authority input + isti `evaluatedAt` + ista contract verzija daje isti rezultat.
11. Resolver ne koristi host environment kao skriveni business authority.
12. Conflict bez authoritative resolution-a ostaje vidljiv kao `UNRESOLVED`; tehnički sorting ga ne smije sakriti.

## 10. FIELD-0 provisional and deferred boundary

FIELD-0 treba da potvrdi:

- da li `SUSPENDED` i `ON_HOLD` ulaze u active portfolio count;
- da li je `ARCHIVED` lifecycle status i kako se klasifikuje;
- koje waiting/blocker state-ove stvarni SDJ rad zahtijeva;
- konačnu operational-state taxonomy;
- da li je explicit timezone disciplina praktična ili treba canonical office timezone fallback.

Deferred van VOC-0/MVS-0 scope-a:

- workflow engine i arbitrary dependency graph;
- automatic prerequisite inference;
- rules engine i automatsko računanje zakonskih/procesnih rokova;
- prediction i AI inference of operational state;
- bitemporal/known-at-time analytics i reporting;
- veliki universal status taxonomy.

## 11. Required decision table

| Contract | Rule | Authority | Temporal basis | Unknown handling | FIELD evidence | Decision |
|---|---|---|---|---|---|---|
| Matter Active | lifecycle non-terminal as of `T`; operational activity odvojena | canonical matter lifecycle history | effective time | `UNRESOLVED` | `SUSPENDED`, `ON_HOLD`, `ARCHIVED` | ACCEPT PROVISIONALLY |
| `LEGAL_ACTION` | open, completed i actionable su odvojeni resolveri | canonical action + terminal/blocking state | effective time / earliest action time | `UNRESOLVED` | blocker taxonomy | ACCEPT PROVISIONALLY |
| Action Due Instant | explicit datetime; date-only do next-local-day boundary; bez hidden timezone | canonical due data | due data + authoritative timezone | `NULL` ili `UNRESOLVED` | office timezone fallback | ACCEPT |
| Operational State | current effective non-superseded state as of `T` | canonical operational history | `effectiveFrom` | `UNRESOLVED` | operational taxonomy | ACCEPT PROVISIONALLY |
| Historical As-Of | rekonstrukcija samo iz authority-ja; projections disposable | canonical revisions/history/supersession/provenance | explicit `evaluatedAt` + effective chronology | `UNRESOLVED` | nije potrebno za prvi slice | ACCEPT |
