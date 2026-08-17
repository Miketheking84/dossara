# DOSSARA — VOC-1 Operational Semantics Closure

## 1. Document control

| Polje | Vrijednost |
|---|---|
| Work package | VOC-1 — Operational Semantics Closure |
| Status | **LOCKED — documentation-only domain contract** |
| Datum | 14. avgust 2026. |
| Formalni kontrolni akt | `docs/dossara/decision-alignment-register-v1.2.md` |
| Normativni baseline | Accepted VLA-0A–E, VLA-1A/1B i FH-1 acceptance commit `c9c8eb4` |
| Prethodni provisional contract | `docs/dossara/metrics/voc-0-domain-semantic-contracts.md` |
| MVS-0 nalazi | `docs/dossara/metrics/mvs-0-metrics-vertical-slice.md` i `docs/dossara/metrics/mvs-0-metric-contracts-and-acceptance.md` |
| Vrsta rada | Documentation-only; bez production koda, schema implementacije, UI-ja, migracije ili metrics implementacije |
| Contract version | `voc-1/v1` |

## 2. Outcome and reading rule

```text
GO — VOC-1 CLOSED / MVS-1 READY
```

Svih pet operational/domain ugovora imaju dovoljnu authority, temporalnu i fail-closed semantiku za naredni executable proof. Ovaj rezultat zaključava značenje i logical resolver boundary. Ne propisuje payload field names, novi canonical object type, novu persistence arhitekturu niti production implementaciju.

VOC-1 je controlling contract za pet pitanja iz ovog dokumenta. U dijelu u kojem su VOC-0 ili MVS-0 koristili provisional statusne liste, jedan `state` label ili effective-only historical shorthand, ovaj dokument ih zamjenjuje preciznijim pravilima. VLA/FH authority i temporalni baseline ostaju netaknuti.

`LOCKED` u ovom dokumentu znači: semantika je dovoljno precizna za executable proof i ne zahtijeva novu domain odluku. Ne znači da je production schema, resolver, UI ili rollout odobren.

## 3. Common contract rules

### 3.1 Odvojene ose

Najmanje sljedeće ose ostaju odvojene:

1. professional-engagement / matter-active klasifikacija;
2. lifecycle/currentness tačne canonical revizije;
3. stanje pojedinačne `LEGAL_ACTION`;
4. trenutna actionable work queue;
5. čekanje eksternog ili internog dependency-ja;
6. deadline, target i event datumi;
7. current operational projection;
8. historical operational projection.

Zato važi:

```text
activeMatter != hasActionableLegalAction
openAction != actionableAction
waitingAction != completedAction
revisionLifecycle.ACTIVE != activeMatter
currentProjection != historicalAuthority
```

### 3.2 Resolver result discipline

Boolean classification resolver vraća:

```text
TRUE | FALSE | UNRESOLVED
```

Vrijednosni resolver vraća validan typed rezultat, autoritativno `NO_VALUE`/`NO_DUE` kada je odsustvo dokazano, ili `UNRESOLVED`. `UNRESOLVED` se nikada ne svodi na `FALSE`, nulu, praznu listu ili best guess.

Minimalni reason codes su:

- `MISSING_AUTHORITY`;
- `INCOMPLETE_FRONTIER`;
- `CONFLICTING_AUTHORITY`;
- `AMBIGUOUS_CURRENTNESS`;
- `MISSING_EFFECTIVE_TIME`;
- `INVALID_TEMPORAL_DATA`;
- `MISSING_TIMEZONE`;
- `MISSING_REQUIRED_REFERENCE`;
- `RECOVERY_OR_RECONCILIATION_REQUIRED`;
- `UNSUPPORTED_AUTHORITY_INPUT`.

### 3.3 Authority and provenance

Semantički rezultat smije nastati samo iz primjenjivih VLA Layers 1–2 inputa: canonical exact revisions, typed relations, accepted review/decision/apply rezultata, immutable Semantic Events/state effects, currentness/supersession/correction zapisa i njihovih temporalnih i authority podataka.

Generated Matter State, Markdown view, metrics projection, dashboard, SQLite/FTS, cache, UI label, filename, directory order, lexical ID order, UUID order, filesystem `mtime`, ingestion order i host clock nijesu business authority.

Svaki resolved rezultat mora vratiti ili omogućiti exact source/authority trace: matter/scope/purpose, relevantne object/revision/event/receipt reference, cut-off koordinate, rules version i completeness/validation status.

### 3.4 No new canonical vocabulary by implication

Velika slova i logical resolver nazivi u ovom dokumentu opisuju ugovorno značenje. Ne uvode sami po sebi canonical enum, payload field ili object type. Postojeći VLA common envelope, `LEGAL_ACTION`, `DEADLINE`, `DECISION_REQUEST`, `EXPECTED_OUTPUT`, `SEMANTIC_EVENT`, typed references i state effects dovoljni su za authority mapping. Fizička schema ostaje zaseban implementacioni posao.

## 4. Contract 1 — Matter active / non-active

### 4.1 Business/domain question

Kada se predmet računa kao operationally active, posebno kada trenutno nema radnje koju advokat može izvršiti?

### 4.2 Locked semantic rule

Predmet je active kada su za isti `matterId`, scope i relevantno vrijeme autoritativno dokaziva oba uslova:

1. profesionalni angažman nije autoritativno završen ili otkazan; i
2. postoji najmanje jedan autoritativni continuation basis: buduća profesionalna obaveza, otvoreno pitanje/odluka, neterminalna legal action, potvrđeni budući deadline, očekivani događaj, nerazriješeni dependency ili izričita potreba daljeg profesionalnog praćenja.

Predmet nije active tek kada autoritativni, authority-valid state effect za relevantni scope utvrdi završetak/otkaz angažmana i nema konfliktni, i dalje važeći continuation basis koji nije dispositioned. Prazna actionable queue, broj otvorenih radnji `0`, čekanje ili arhivski prikaz nijesu sami dokaz završetka angažmana.

Formalno:

```text
countsAsActiveMatterAsOf(matterId, Te, Tk, Tr)
  = TRUE
    iff engagementNotEndedAsOf(...) == TRUE
    AND hasAuthoritativeContinuationBasisAsOf(...) == TRUE

  = FALSE
    iff authoritativeEngagementEndAsOf(...) == TRUE
    AND no unresolved contradictory continuation authority exists

  = UNRESOLVED
    otherwise
```

Time se active matter ne izjednačava sa `hasActionableWork`. Waiting-only matter može biti active.

### 4.3 Authority source

Authority je matter-scoped accepted state effect i njegov causal basis u Layers 1–2. Početak, završetak, otkaz ili ponovno otvaranje angažmana može biti evidentirano kroz VLA-0E `STATE_EFFECT_EVENT` sa authority-context-om i `matter_id`; nije potreban novi `MATTER` object type.

Continuation basis se mapira na current accepted `LEGAL_ACTION`, `DECISION_REQUEST`, ljudski potvrđen `DEADLINE`, `EXPECTED_OUTPUT`, structured dependency/event record ili drugi authority-valid state effect sa typed referencama, purpose/scope-om i effective intervalom.

VLA-0A revision lifecycle `ACTIVE/SUPERSEDED/WITHDRAWN/VOIDED` nije matter business lifecycle authority.

### 4.4 Derived vs authoritative classification

`countsAsActiveMatterAsOf` je **derived classification**. Autoritativni su engagement/continuation records, decisions i state effects koji nose njen osnov. Rezultat se ne smije persistirati kao novi Layer 1–2 fact samo zato što ga metrics engine računa.

`hasActionableWork`, `hasWaitingDependency`, `hasFutureDeadlineOrEvent` i `needsProfessionalMonitoring` jesu odvojene derived klasifikacije nad svojim authoritative osnovama.

### 4.5 Effective-time rule

Engagement ili continuation effect važi od svog authority-valid `effective_at/effective_from`; future-effective zapis ne proizvodi current active/non-active promjenu prije granice. Close/reopen proizvode odvojene effective intervale. Sam `recorded_at`, datum foldera ili generation time ne određuje activity.

Nastup prethodno odobrene future-effective granice može promijeniti derived current projection bez nove poslovne odluke, u skladu sa VLA-0E §13.

### 4.6 Historical/as-of behavior

Active classification se rekonstruiše iz tačnih engagement i continuation zapisa dozvoljenih sa `Tk/Tr` i efektivnih u `Te`. Close effective u `T1` i reopen effective u `T2` daje active interval prije `T1`, non-active interval `[T1,T2)` i active od `T2`, pod uslovom da su continuation kriterijumi dokazani za te intervale.

Naknadno evidentiran retroaktivni effect može promijeniti današnju rekonstrukciju ranijeg `Te`, ali ne smije promijeniti contemporaneous `operationalAsOf(T)` rezultat iz §8 niti prepisati ranije sačuvani audit/projection trag.

### 4.7 Fail-closed behavior

Vraća se `UNRESOLVED`, a matter se ne ubraja ni u pouzdani active ni non-active total, kada:

- nije dokaziv angažman ili njegov effective interval;
- nema dokazivog continuation basis-a, ali nema ni autoritativnog završetka;
- closure i buduća obaveza konfliktuju bez disposition-a;
- relevantni frontier nije complete;
- authority/currentness/supersession nije razrješiv;
- postoji recovery/reconciliation block u pogođenom scope-u.

Portfolio rezultat ne smije parcijalni count prikazati kao complete ako potencijalni contributor ostaje `UNRESOLVED`.

### 4.8 Examples

| Scenario | Active | Actionable work | Waiting |
|---|---:|---:|---:|
| Čeka se odgovor klijenta; angažman otvoren | `TRUE` | može biti `FALSE` | `TRUE` |
| Čeka se presuda; postoji accepted expected event/monitoring basis | `TRUE` | `FALSE` | `TRUE` |
| Buduće ročište ili potvrđeni rok; trenutno nema koraka | `TRUE` | `FALSE` | može biti `TRUE` |
| Postoji druga, nezavisna actionable action dok se čeka sud | `TRUE` | `TRUE` | `TRUE` |
| Angažman autoritativno završen; sve obaveze dispositioned | `FALSE` | n/p za active count | `FALSE` za current engagement |
| Nema actions ni closure eventa, frontier je complete ali continuation basis nije dokaziv | `UNRESOLVED` | `FALSE` ili `UNRESOLVED` odvojeno | `FALSE` ili `UNRESOLVED` odvojeno |

### 4.9 Edge cases

- `ARCHIVED` view/path ne znači non-active bez engagement-end authority-ja.
- `SUSPENDED`/`ON_HOLD` label nije potreban: predmet sa autoritativnim continuation basis-om ostaje active i kada nema actionable work.
- Terminalna revision pojedinačne action ne zatvara matter.
- Closed matter sa nedispositioned budućim confirmed deadline-om je authority conflict, ne automatski closed winner.
- Reopen zahtijeva novi authority-valid effect; sama pojava novog fajla ili action proposal-a ne otvara angažman.

### 4.10 Mapping to existing VLA/FH concepts

- VLA-0E §§6–14: matter-scoped Semantic Event, authority-at-time i state effect/effective interval;
- VLA-0C §§18, 21 i 23: incomplete/conflict, temporal model i derived waiting/attention;
- VLA-1A Domain Contracts §§2–5: Layers 1–2 authority/currentness bez status collapse-a;
- VLA-1B §§8–11: currentness, typed references i closed-world dependency frontier;
- FH-1: exact immutable revisions i direct-frontier tehnička osnova, bez domain resolver authority-ja.

### 4.11 Explicit non-goals

Nema novog matter lifecycle enum-a, `MATTER` object type-a, archive workflowa, engagement UI-ja, auto-close logike, inactivity heuristike, produkcijskog resolvera ni metric implementacije.

**Status: LOCKED.**

## 5. Contract 2 — `LEGAL_ACTION` lifecycle

### 5.1 Business/domain question

Kada je pojedinačna legal action open, actionable, waiting, completed, cancelled ili prestala zbog supersession-a?

### 5.2 Locked semantic rule

`OPEN`, `ACTIONABLE`, `WAITING` i `COMPLETED` nijesu jedna statusna osa:

- **Open**: action identity je authority-valid i applied/effective u scope-u, a do query granice nema authority-valid terminalnog action disposition-a.
- **Actionable**: action je open, postoji identifikovan odgovorni učesnik, relevantni start/earliest-action trenutak je nastupio, svi deklarisani prerequisites potrebni za naredni korak su zadovoljeni i nijedan current blocker ne sprečava taj korak.
- **Waiting**: action je open, ali je njen current progression autoritativno zavisan od neispunjenog događaja, odgovora, datuma ili druge radnje; waiting nije completed.
- **Completed**: authority-valid completion event/state effect potvrđuje da je definisani action outcome izvršen u deklarisanom scope-u.
- **Cancelled**: authority-valid disposition kaže da se action više neće izvršavati; terminalna je za open, ali nije completed.
- **Superseded action**: authority-valid disposition povezuje action sa nasljednikom koji preuzima isti relevantni purpose/scope; terminalna je za staru action, ali nije completed. Ovo nije isto što i VLA revision lifecycle `SUPERSEDED`.

### 5.3 Authority source

Authority je stable `LEGAL_ACTION` identity sa exact revisions, validnim review/apply/currentness osnovom, odgovornošću i action-specific Semantic Events/state effects. Completion, cancellation ili action-level supersession moraju biti eksplicitni, authority-valid, temporalno određeni i traceable.

Waiting/actionability koristi structured typed dependency basis: klijent, druga strana, sud/organ, treće lice, future-effective datum, `LEGAL_ACTION`, `DECISION_REQUEST`, `DEADLINE`, `EXPECTED_OUTPUT` ili identifikovani event. Slobodni tekst, naziv action, AI sažetak ili UI kolona nijesu authority.

### 5.4 Derived vs authoritative classification

- action identity/revisions, assignment, dependency, completion/cancellation/supersession events i state effects su authoritative Layers 1–2 inputi;
- `isOpen`, `isActionable` i `isWaiting` su derived classifications;
- completion disposition je authoritative event/effect, dok `isCompletedAsOf` ostaje derived odgovor na query;
- `WAITING` ostaje derived operational classification, ne novi obavezni canonical enum.

Ovim se slijedi VLA-0C §23, koji waiting-on prikaze definiše kao izvedene projekcije.

### 5.5 Effective-time rule

Action postaje open tek od validnog applied/effective state effect-a. Proposal, review ili approval bez actual apply/effect-a nije open action.

Completion/cancellation/action-supersession mijenja klasifikaciju od svog validnog effective trenutka. Future start/dependency date ne čini action terminalnom; prije tog datuma action može biti open + waiting/non-actionable. Nastup datuma uklanja samo date blocker ako su ostali prerequisites razriješeni.

### 5.6 Historical/as-of behavior

Svaka klasifikacija koristi isti `Te/Tk/Tr`, scope, frontier i rules version. Action completed u `T2` može biti open/actionable ili open/waiting u `T1 < T2`, a non-open/completed od `T2`. Cancellation ili supersession ne smije retroaktivno pretvoriti raniji open interval u „nikada nije postojala“.

### 5.7 Fail-closed behavior

`UNRESOLVED` se vraća kada nedostaje action existence/apply effect, odgovornost potrebna za actionability, effective time, required dependency reference ili kada su terminalni dispositions konfliktni/ambiguous.

Nepoznat prerequisite nije „zadovoljen“. Nepostojanje declared prerequisite-a ne dozvoljava resolveru da ga izmisli. Action bez assignee-ja nije actionable; ako je open dokaziv, može ostati open sa assignment-required attention rezultatom.

### 5.8 Examples

| Authority situation | Open | Actionable | Waiting | Completed |
|---|---:|---:|---:|---:|
| Applied action, assignee postoji, nema blocker-a | `TRUE` | `TRUE` | `FALSE` | `FALSE` |
| Čeka se dokument klijenta | `TRUE` | `FALSE` | `TRUE` | `FALSE` |
| Future start date nije nastupio | `TRUE` | `FALSE` | `TRUE` | `FALSE` |
| Completion effect je nastupio | `FALSE` | `FALSE` | `FALSE` | `TRUE` |
| Cancelled | `FALSE` | `FALSE` | `FALSE` | `FALSE` |
| Action-level superseded sa exact successor vezom | `FALSE` | `FALSE` | `FALSE` | `FALSE` |
| Samo revision `SUPERSEDED`, stable action ima current successor revision | zavisi od action effect-a, ne od stare revision | odvojeno se računa | odvojeno se računa | odvojeno se računa |

### 5.9 Edge cases

- Završen `EXPECTED_OUTPUT` ne završava action bez completion eventa.
- Prošao due datum ne završava niti otkazuje action.
- Više dependencies: action je waiting ako makar jedan required current prerequisite blokira naredni korak; unresolved required dependency daje `UNRESOLVED`, ne `WAITING=FALSE`.
- Jedna action može prestati zbog action-level supersession-a dok sve njene revisions ostaju u istoriji.
- Matter može istovremeno imati waiting Action A i actionable Action B.
- Terminalni action disposition ne zatvara automatski engagement/matter.

### 5.10 Mapping to existing VLA/FH concepts

- VLA-0A §§7, 14 i 17.2: odvojene lifecycle/operational ose, revision lifecycle i `LEGAL_ACTION` taxonomy;
- VLA-0C §§9, 15 i 23: active legal-actions segment, open operational vocabulary deferral i derived waiting/attention;
- VLA-0E §§7, 9, 13–14: events, effective time i state effects;
- VLA-1A §5: Legal Action kao Layer 1 record + Layer 2 history;
- VLA-1B §§7–9: canonical type, immutable revisions/currentness i typed references.

### 5.11 Explicit non-goals

Nema workflow engine-a, arbitrary dependency graph-a, AI inference-a, universal action status enum-a, auto-assignment-a, UI queue-a niti production koda.

**Status: LOCKED.**

## 6. Contract 3 — Due semantics

### 6.1 Business/domain question

Koji od više mogućih datuma predstavlja authoritative `dueInstant` za metric purpose, i kako se taj instant poredi kroz vrijeme?

### 6.2 Locked semantic rule

Datumi se klasifikuju po značenju, ne po nazivu polja ili najranijoj vrijednosti:

| Date kind | Značenje | Eligible kao action `dueInstant` |
|---|---|---:|
| Legal / external deadline | ljudski potvrđena obaveza iz zakona, suda/organa, ugovora ili druge spoljne osnove | da, kada je authoritative i eksplicitno governing za action/metric scope |
| Internal deadline | ljudski potvrđena interna kancelarijska obaveza | da, kada je authoritative i eksplicitno governing za action/metric scope |
| Target date | plan rada bez obavezujućeg deadline značenja | ne |
| Event date | vrijeme očekivanog događaja, sastanka, ročišta, provjere ili odluke | ne, osim ako zaseban authority record taj datum takođe utvrdi kao deadline |
| No due date | action legitimno nema governing deadline | daje `NO_DUE`, ne instant |

Resolver ne bira najraniji, najkasniji, „pravno važniji“ ili najnovije evidentirani datum. Tačno jedan current governing deadline za action/metric purpose mora biti dokaziv autoritativnom typed vezom, review/apply/state-effect osnovom ili ekvivalentnim accepted authority zapisom. Ako postoje legal i internal deadline, authority mora odrediti koji je governing za konkretni metric purpose; metrics layer ne uvodi precedence.

```text
resolveActionDueAsOf(actionId, Te, Tk, Tr)
  -> { kind: LEGAL_EXTERNAL | INTERNAL, dueInstant, provenance }
   | NO_DUE
   | UNRESOLVED
```

Logical kind nazivi nijesu novi canonical enum zahtjev.

### 6.3 Authority source

Primarni authority je current, applied, ljudski potvrđen `DEADLINE` sa osnovom, scope-om, timezone-om kada je potreban i typed vezom ka action. Action revision smije nositi authoritative due podatak samo ako object-specific accepted schema/rules eksplicitno daju isto značenje; naziv poput `date`, `targetAt` ili tekst u opisu nije dovoljan.

Registar I7 ostaje controlling: sistem ne računa procesni rok i nepotvrđen rok ne utiče na attention/metrics. Metrics nikada ne tvrdi da je pravni/procesni rok zaista propušten; samo poredi ljudski potvrđeni governing due podatak.

### 6.4 Derived vs authoritative classification

Vrsta datuma, vrijednost, timezone, governing action/scope veza, confirmation i promjene roka pripadaju authority osnovi. `dueInstant`, `isOverdueAsOf` i `isDueSoonAsOf` su derived.

`NO_DUE` je autoritativno dokazivo odsustvo kada complete frontier i primjenjivi accepted schema/relations dokazuju da current action nema governing deadline, ili kada postoji eksplicitni no-due disposition. Missing/incomplete due authority nije `NO_DUE`.

### 6.5 Effective-time rule

Full datetime mora imati authoritative UTC offset ili timezone i normalizuje se u instant.

Date-only deadline važi tokom cijelog navedenog lokalnog kalendarskog dana. Comparison boundary je početak sljedećeg lokalnog kalendarskog dana u authoritative timezone-u:

```text
dueInstant = startOfNextLocalCalendarDay(dateOnly, authoritativeTimezone)
isOverdueAsOf(actionId, T) = T >= dueInstant
```

Ne proizvodi se synthetic `23:59:59.999`, end-of-business-day ili host-local midnight.

Timezone precedence je:

1. timezone/offset koji je eksplicitni dio governing deadline authority-ja;
2. canonical matter/office timezone samo ako kasnije postoji kao accepted authoritative configuration input za isti scope;
3. inače `UNRESOLVED`.

Host timezone i skriveni `Europe/Belgrade` fallback su zabranjeni.

### 6.6 Historical/as-of behavior

Promjena roka je nova immutable revision/relation/state effect sa explicit currentness/supersession i effective granicom. Stari deadline ostaje u istoriji. Resolver za raniji `Te` bira samo governing deadline koji je prema query `Tk/Tr` i effective intervalima važio za taj scope.

Naknadno unesena retroaktivna izmjena može u današnjoj rekonstrukciji promijeniti due koji se smatra effective u ranijem `Te`, ali ne ulazi u contemporaneous `operationalAsOf(T)` ako je `recorded_at > T`.

### 6.7 Fail-closed behavior

`UNRESOLVED` se vraća za:

- dva ili više konkurentnih governing deadline-a bez authority disposition-a;
- deadline i target/event datum bez jasne klasifikacije;
- invalid datum ili timezone;
- date-only bez authoritative timezone-a;
- missing confirmation, basis, action link, effective interval ili currentness;
- incomplete/unsupported frontier;
- manual-edit/recovery/reconciliation conflict.

Action sa `NO_DUE` ili `UNRESOLVED` ne ulazi u overdue/due-soon denominator. `UNRESOLVED` mora učiniti pogođeni metric unavailable/invalid prema razlogu; ne prikazuje se kao „not overdue“.

### 6.8 Examples

| Input | Rezultat |
|---|---|
| `2026-08-20T14:00:00+02:00`, confirmed governing external deadline | instant `2026-08-20T12:00:00Z` |
| Date-only `2026-08-20`, timezone `Europe/Belgrade` kao explicit authority | početak lokalnog 21. avgusta, normalizovan u instant |
| Target date `2026-08-20` | nije due |
| Ročište 20. avgusta bez zasebnog deadline authority-ja | event date, nije due |
| Internal deadline i legal deadline, nijedan nije designated governing za metric scope | `UNRESOLVED` |
| Complete authority kaže da action nema rok | `NO_DUE` |

### 6.9 Edge cases

- DST se rješava IANA timezone pravilima relevantnim za lokalni kalendarski datum; fiksni offset ne glumi zonu izvan svog instanta.
- Ukidanje roka ne briše prethodni due interval; novi disposition/effect daje `NO_DUE` od svoje granice.
- Completion action ne mijenja historical due; samo action više nije open za current overdue metric.
- Due exactly jednak `T` je overdue od te uključive granice.
- Event date može istovremeno imati zaseban povezani confirmed deadline, ali ta značenja ostaju odvojena.

### 6.10 Mapping to existing VLA/FH concepts

- Registar I7: ručni unos/potvrda i zabrana računanja procesnih rokova;
- VLA-0A §§17.2–17.3 i §22: odvojeni `LEGAL_ACTION`/`DEADLINE`, user-entered deadline authority;
- VLA-0C §§16 i 23: samo human-confirmed deadline i zabrana overdue bez validne temporalne osnove;
- VLA-0E §§9, 11–13: temporalne ose, retroactivity i future effect;
- VLA-1B §§8–11: currentness, typed references i frontier completeness.

### 6.11 Explicit non-goals

Nema legal-deadline calculator-a, holiday adjustment-a, priority heuristike, office-timezone default odluke, calendar/UI rada, payload schema dizajna niti metrics implementacije.

**Status: LOCKED.**

## 7. Contract 4 — Matter operational state / currentness

### 7.1 Business/domain question

Šta predstavlja current operational state predmeta, kada postaje efektivan i kako nova informacija mijenja current pogled bez prepisivanja istorije?

### 7.2 Locked semantic rule

Matter operational state nije jedna mutually-exclusive etiketa. To je purpose-aware derived projection najmanje sljedećih nezavisnih dimenzija:

```text
MatterOperationalProjection {
  activeMatterClassification
  openActionIds
  actionableActionIds
  waitingDependencies
  currentDeadlines
  expectedFutureEvents
  openDecisionOrQuestionIds
  monitoringObligations
  attentionAndValidationFlags
  provenanceAndTemporalCoordinates
}
```

Ovo je logical result shape, ne production schema.

Predmet može istovremeno biti active, imati actionable Action B i čekati sud za Action A. `WAITING_ON_*`, `NO_NEXT_ACTION`, `OVERDUE` i slični dashboard termini jesu derived views nad strukturisanim authority inputima, a ne pobjednički matter status.

### 7.3 Authority source

Current projection se izvodi iz complete primjenjivih VLA Layers 1–2 records/events: exact current revisions, review/decision/apply/state effects, action/deadline/dependency authority, lifecycle/currentness, correction/supersession, conflict, recovery i reconciliation zapisa.

Accepted event mijenja authoritative basis kada je authority-valid, scope/purpose relevantan i actual effect je nastao. Proposal, approval bez apply-ja, UI edit ili generated Matter State ne mijenjaju authority.

### 7.4 Derived vs authoritative classification

Cijeli Matter Operational Projection je Layer 3 derived state. Njegove source facts/effects u Layers 1–2 su authoritative. Materialized Matter State ili metrics read model smije biti cache ovog rezultata samo sa exact frontier/rules/provenance i validation statusom.

`matterHasActionableWork` je `TRUE` ako postoji makar jedna resolved actionable action. `matterIsWaiting` je `TRUE` ako postoji makar jedan current authority-backed waiting dependency. Oba mogu biti `TRUE`.

`matterWithoutNextActionableStep` je `TRUE` samo kada je matter active `TRUE`, declared action/dependency frontier je complete i nema actionable action. Ovaj rezultat ne znači da je matter završen; mora prikazati waiting/future-event/monitoring basis ili attention gap.

### 7.5 Effective-time rule

Operational input postaje efektivan od validnog `effective_at/effective_from` poslije potrebnog review/approval/apply/state-effect lanca. `recorded_at` određuje kada je zapis ušao u authority history, ne kada tvrdi da je effect počeo.

Current za koordinate `(Te,Tk,Tr)` znači: exact non-superseded/corrected authority input čiji je effective interval uključio `Te`, koji je dozvoljen sa `Tk/Tr`, i za koji ne postoji nerazriješen relevantni conflict/recovery/reconciliation block.

### 7.6 Historical/as-of behavior

Svaka dimenzija se rekonstruše zasebno sa istim koordinatama, rules version-om i frontier-om. Nova informacija može promijeniti current projection od svog validnog effect-a. Ne smije mutirati ranije revisions, events, receipts, dependency intervale ili recorded history.

Ako se danas unese ranije-effective informacija, današnja retrospective rekonstrukcija smije je uključiti uz tačan kasniji `known_at/recorded_at`; contemporaneous historical projection je ne uključuje.

### 7.7 Fail-closed behavior

Conflict se lokalizuje kada je dokazivo izolovan. Npr. unresolved due ne mora spriječiti open-action count ako open klasifikacija ne zavisi od due podatka. Međutim, pogođena dimenzija vraća `UNRESOLVED` i portfolio/matter summary ne smije tvrditi completeness ako bi nepoznati input mogao promijeniti rezultat.

Dva state effect-a sa istim effective scope-om bez authority correction/supersession ne razrješavaju se timestampom, filename-om ili ID sortom. Unknown object/reference/schema u declared frontier-u daje incomplete/unsupported, ne pretpostavljeni current state.

### 7.8 Examples

| Scenario | Operational projection |
|---|---|
| Čeka se sud za A; B je spremna za rad | active `TRUE`; actionable `{B}`; waiting `{A -> court}` |
| Čeka se klijent; nema drugih actions; follow-up event postoji | active `TRUE`; actionable `{}`; waiting dependency + future event |
| Nema actionable action ni waiting/future/monitoring basis-a | active `UNRESOLVED` ili attention gap prema Contract 1; ne auto-close |
| Deadline promijenjen novom accepted revision | current deadline koristi novi effective interval; stari ostaje historical |
| Novi material conflict pogađa samo A | A/dotična dimenzija unresolved/blocked; nepogođena B ostaje čitljiva |

### 7.9 Edge cases

- Actionability i waiting nijesu matter-wide mutually exclusive statusi.
- Projection generation time ne postaje effective start.
- Protok vremena može aktivirati već approved future effect bez novog human approval-a.
- Ručni edit authority fajla čini pogođeni frontier stale/incomplete do reconciliation-a; ne postaje current samo zato što je noviji.
- Current projection se može obrisati i rebuild-ovati bez gubitka ili promjene authority-ja.

### 7.10 Mapping to existing VLA/FH concepts

- VLA-0C §§7–9, 18–24: derived Matter State, conflicts, temporal/waiting/attention i snapshot boundary;
- VLA-0C Projection §§3–5, 14–17 i 21: inputs, outputs, temporal rules, rebuild i invariants;
- VLA-0E §§11–18: knowledge/effective pogledi, state effects i projection semantics;
- VLA-1A Persistence §§2–6 i 13: četvoroslojni model, projection/currentness i rebuild;
- VLA-1B §§8–15: currentness, frontier, projection i reconciliation;
- FH-1: accepted immutable read/write/frontier primitives; full Matter State rebuild ostaje neaccepted/exploratory.

### 7.11 Explicit non-goals

Nema universal matter-status enum-a, dashboard modela, scheduling engine-a, current-state database authority-ja, production projection adaptera, UI-ja niti metrics implementacije.

**Status: LOCKED.**

## 8. Contract 5 — Historical `asOf` semantics

### 8.1 Business/domain question

Kakvo je authoritative operational stanje predmeta bilo u trenutku `T`, bez pretvaranja današnjeg current state-a u lažnu istoriju?

### 8.2 Locked semantic rule

Naked `asOf(T)` sa skrivenim knowledge/recorded vantage-om je zabranjen. Accepted executable boundary za contemporaneous historical operational query je:

```text
operationalAsOf(T)
  := as-effective-at(Te = T, Tk = T, Tr = T,
                     rulesVersion = voc-1/v1,
                     declaredAuthorityFrontier)
```

Ovaj query odgovara: šta je prema informacijama dokazivo dostupnim i evidentiranim do `T`, te authority/review/effect stanju koje je do `T` postojalo, važilo u `T`?

Današnja rekonstrukcija ranijeg effective stanja je drugi, eksplicitni query:

```text
reconstructEffectiveAt(Te = T, Tk, Tr, rulesVersion, frontier)
```

Za današnji vantage `Tk` i `Tr` mogu biti deklarisani current cut-off-i, ali nikada implicitni `now`. Isti `Te` smije dati drugi rezultat sa drugim `Tk/Tr`; oba rezultata su validna samo sa svojim koordinatama i provenance-om.

### 8.3 Authority source

Resolver smije čitati:

- canonical immutable exact revisions i content versions;
- lifecycle/currentness i typed supersession/correction relations;
- Review Records, decisions, Change Set/Item i Apply Receipts kada utiču na effect;
- immutable Semantic Events/state effects;
- conflict, recovery i reconciliation history;
- temporal/authority-at-time metadata;
- registry/schema/rules i dependency-frontier evidence potreban za completeness.

Generated Matter State, historical snapshot, metrics projection ili SQLite smije biti verifikovani acceleration artifact, ali ne required authority input i ne smije biti jedini dokaz rezultata.

### 8.4 Derived vs authoritative classification

Historical operational projection je derived. Historical canonical facts/revisions/events su authoritative zapisi. Sačuvani historical snapshot može autoritativno dokazati da je određena projekcija tada generisana sa navedenim inputima/statusom, ali ne zamjenjuje njene Layers 1–2 inpute niti dokazuje njihovu semantičku istinitost.

### 8.5 Effective-time rule

Resolver prvo primjenjuje knowledge cut `known_at <= Tk` i recorded cut `recorded_at <= Tr`, zatim authority/review/apply/currentness pravila, pa effective interval na `Te`. `effective_to` je isključiva gornja granica. Future-effective effect nije current prije svoje granice.

Tie u effective vremenu razrješava samo explicit authority-valid correction/supersession/disposition. Technical sorting je dozvoljen samo za stabilan output, nikad za izbor business winner-a.

### 8.6 Historical/as-of behavior

Četiri obavezno odvojena pogleda su:

1. **historical canonical facts** — exact revisions/events koji zadovoljavaju query cut-off-e;
2. **historical operational projection** — derived `operationalAsOf(T)` rezultat;
3. **today's reconstruction of historical effective state** — `reconstructEffectiveAt(T, Tk=currentKnowledgeCutoff, Tr=currentRecordedCutoff, ...)` sa eksplicitnim cut-off-ima;
4. **late-recorded, earlier-effective fact** — isključen iz `operationalAsOf(T)` ako je recorded poslije `T`, ali može ući u današnju rekonstrukciju istog `Te` uz corrective chain i provenance.

Rebuild sa istim exact frontier-om, cut-off-ima i rules version-om mora dati semantički identičan rezultat, nezavisno od cache-a, file enumeration order-a i generation time-a.

### 8.7 Fail-closed behavior

Resolver vraća `UNRESOLVED`/`INSUFFICIENT_AUTHORITY` ili lokalizovan incomplete/invalid rezultat kada:

- nedostaje required exact revision/event/reference;
- frontier coverage nije dokaziv;
- authority-at-time, review/apply effect ili currentness nije dokaziv;
- timestamp je unknown tamo gdje je potreban za ordering/eligibility;
- relevantni conflict, recovery ili reconciliation nije razriješen;
- rules version ili historical policy vantage nije deklarisan;
- rezultat bi zavisio samo od projection/index/cache artefakta;
- correction/supersession tie nema authoritative disposition.

Current state se nikada ne backdate-uje kao fallback.

### 8.8 Examples

| Query | Late fact: known/recorded 20/21.8, effective 1.6 | Rezultat |
|---|---|---|
| `operationalAsOf(5.6)` | cut-off prije discovery/recording | fact isključen |
| `reconstructEffectiveAt(1.6, Tk=22.8, Tr=22.8, ...)` | cut-off uključuje accepted retroactive effect | fact može biti uključen uz provenance |
| `reconstructEffectiveAt(1.6, Tk=20.8, Tr=20.8, ...)` | poznato, ali još nije recorded 21.8 | fact nije authoritative recorded input |
| isti query poslije brisanja SQLite/Matter State | Layers 1–2 isti | semantički identičan rezultat ili dokaziv isti failure |

### 8.9 Edge cases

- Unknown `occurred_at` ne popunjava se `recorded_at` vrijednošću.
- Historical review target ne smije biti `latest`; mora voditi na exact revision.
- Kasniji authority change ne poništava raniju validnu authority-at-event-time procjenu bez corrective/reconciliation effect-a.
- Different `rulesVersion` je druga query koordinata i mora biti vidljiva; rezultat se ne poredi kao isti bez eksplicitne compatibility politike.
- Sačuvani snapshot sa incomplete statusom ne postaje complete zato što se kasnije otvorio bez greške.

### 8.10 Mapping to existing VLA/FH concepts

- VLA-0E Semantic History §§9–18: temporalne ose, `as-known-at`, `as-effective-at`, late discovery i state effects;
- VLA-0E Historical Reconstruction §§2–12: `Te/Tk/Tr`, deterministic provenance i failure conditions;
- VLA-1A Persistence §§4–6 i 13: projection/historical reconstruction/rebuildability;
- VLA-1B §§8–11 i 13–15: currentness, exact references, frontier, projection/reconciliation/rules versions;
- FH-1: canonical bytes, exact revisions, integrity i direct-frontier dokaz; full historical resolver nije FH-1 accepted artefakt.

### 8.11 Explicit non-goals

Nema production query API-ja, performance/index strategije, event sourcing zahtjeva, bitemporal database-a, historical dashboarda, migration-a niti metrics implementacije.

**Status: LOCKED.**

## 9. Cross-contract metric semantics now available to MVS-1

VOC-1 omogućava executable proof sljedećih logical capabilities, bez njihove implementacije u ovom WP-u:

| Capability | Required resolved basis |
|---|---|
| Active matters | Contract 1 `TRUE` za isti query boundary |
| Matters with actionable work | active `TRUE` + najmanje jedna actionable action iz Contract 2 |
| Matters waiting | active `TRUE` + najmanje jedan authority-backed waiting dependency; ne zahtijeva da actionable set bude prazan |
| Overdue actions | open `TRUE` + resolved governing `dueInstant` + `T >= dueInstant` |
| Actions due soon | open `TRUE` + resolved governing `dueInstant` unutar eksplicitno versioned look-ahead intervala |
| Matters without next actionable step | active `TRUE` + complete action frontier + actionable count `0`; waiting/monitoring/attention basis ostaje vidljiv |
| Historical operational state | Contract 5 `operationalAsOf(T)` ili eksplicitno named retrospective reconstruction |

`due soon` look-ahead trajanje nije zaključano ovim WP-om; MVS-1 mora ga deklarisati kao metric-definition parameter/version, ne kao hidden default. To je metric-definition odluka, ne preostali authority/domain gap.

## 10. Architecture compatibility review

| Baseline dokument / sekcija | VOC-1 provjera | Konflikt / vrsta | Može li se zaključati bez baseline promjene? |
|---|---|---|---:|
| Decision Register §1 i I1 | Layers 1–2/workspace authority; SQLite/projections disposable | nema konflikta | da |
| Decision Register I7 | samo human-confirmed deadline; nema računanja procesnog roka | nema konflikta | da |
| Decision Register I12 i §12 | manual edit ne prepisuje authority; documentation-only pre-Phase-1 rad | nema konflikta | da |
| VLA-0A §§7, 14 i 17 | trust/review/revision lifecycle odvojeni od operational ose; koristi postojeće `LEGAL_ACTION`/`DEADLINE` | nema konflikta | da |
| VLA-0C §15 i §30(10) | action operational vocabulary je bio deferred | **scope/deferral tension**, ne semantic contradiction; VOC-1 kao kasniji domain WP zaključava logical classification bez enum/schema izmjene | da |
| VLA-0C §21 i §30(11) | §21 je ostavio effective engine otvoren; VLA-0E je kasnije zaključao semantiku | **sequencing tension**; implementacija ostaje deferred, semantika slijedi kasniji VLA-0E | da |
| VLA-0C §23 | waiting/attention su derived projections | nema konflikta; VOC-1 eksplicitno zadržava derived status | da |
| VLA-0E §§6–18 i Historical Reconstruction §§2–12 | `Te/Tk/Tr`, event immutability, late discovery, effective intervals, fail-closed reconstruction | nema konflikta | da |
| VLA-1A Domain §§2–5, Authority §8 | exact revisions/currentness/history nose authority; Matter State derived | nema konflikta | da |
| VLA-1A Persistence §§2–6, 13 i 16 | Layers 1–2 authority, Layers 3–4 rebuildable | nema konflikta | da |
| VLA-1B §§4–15 | structured JSON, sealed JSONL, typed refs/frontier, projection/reconciliation boundary | nema konflikta; VOC-1 ne mijenja storage contract | da |
| FH-1 Decision Log „Accepted technical decisions“ i „Exploratory only“ | primitives su accepted; full rebuild/history resolver nije | nema domain konflikta; MVS-1 mora dokazati resolver iznad accepted primitive-a bez predstavljanja exploratory fajlova kao baseline | da |
| VOC-0 §§4–8 i §11 | pet contracta su bili provisional; effective-only historical shorthand nije razlikovao contemporaneous pogled | **predecessor contract correction**; VOC-1 zamjenjuje provisional taxonomy kompozicionim pravilima i zaključava dvije historical query vrste | da |
| MVS-0 Design §§4–6, 14–17 | koristi provisional status mapu, single operational-state label i today-frontier effective truth | **downstream contract mismatch**; MVS-1 mora koristiti VOC-1, a MVS-0 ostaje historical isolated evidence | da; ne mijenja accepted VLA/FH baseline |
| MVS-0 Acceptance §§9–11 | fajl trenutno tvrdi isolated GO sa FIELD-provisional semantics, dok VOC-1 nalog postavlja implementation block do closure-a | **governance/document-status inconsistency**; VOC-1 closure uklanja domain blocker, ali ne retroaktivno mijenja MVS-0 fajl niti odobrava production rad | da za semantiku; zasebna dokumentaciona reconciliation odluka ostaje |

### 10.1 Conflict disposition

Nijedan identifikovani konflikt ne zahtijeva promjenu VLA/FH authority, trust, temporal ili persistence baseline-a. Tri vidljive tenzije su:

1. raniji VLA-0C deferral koji kasniji domain WP sada smije zatvoriti;
2. provisional VOC-0/MVS-0 contract koji VOC-1 precizira;
3. statusni tekst u dirty MVS-0 dokumentima koji nije mijenjan u ovom documentation-only WP-u.

Treća stavka je governance/document reconciliation debt. Nije unresolved operational-authority gap, ali MVS-1 ne smije tvrditi da je production implementation odobrena samo na osnovu starog MVS-0 statusnog teksta.

## 11. Decision matrix

| Contract | Decision | Authority | Derived? | Historical support | Fail-closed rule | Status |
|---|---|---|---|---|---|---|
| Matter active / non-active | unclosed engagement + authoritative continuation basis; actionable work je odvojeno | matter-scoped state effects + current action/decision/deadline/event/monitoring authority | da | `Te/Tk/Tr`, close/reopen intervali | missing/conflicting engagement ili continuation authority -> `UNRESOLVED` | **LOCKED** |
| `LEGAL_ACTION` lifecycle | open/actionable/waiting/completed/cancelled/action-superseded su odvojena pitanja | `LEGAL_ACTION` exact revisions + assignment/dependency/terminal state effects | klasifikacije da; source effects ne | isti cut-off-i i immutable terminal history | missing prerequisite/currentness/terminal authority -> `UNRESOLVED` | **LOCKED** |
| Due semantics | samo explicitly governing confirmed legal/external ili internal deadline daje due; target/event ne | human-confirmed `DEADLINE` ili ekvivalentni accepted due authority + typed action link | due/overdue da | historical governing deadline po effective intervalima | ambiguity, invalid date/timezone ili incomplete authority -> `UNRESOLVED` | **LOCKED** |
| Operational state/currentness | višedimenzionalna projection; actionable i waiting mogu koegzistirati | complete Layers 1–2 frontier, exact currentness/effects/conflicts | da | svaka dimenzija rekonstruiše se sa istim koordinatama | lokalizovan unknown; summary nije complete ako unknown može promijeniti rezultat | **LOCKED** |
| Historical `asOf` | contemporaneous `operationalAsOf(T)=Te=Tk=Tr=T`; retrospective query eksplicitno odvojen | exact Layers 1–2 history + rules/frontier/authority-at-time | da | deterministic, reproducible, source-traceable | insufficient authority/frontier/rules/timestamps -> `UNRESOLVED`; nema current fallback-a | **LOCKED** |

## 12. MVS-1 readiness assessment

```text
GO — VOC-1 CLOSED / MVS-1 READY
```

MVS-1 sada smije, u zasebno odobrenom isolated executable work package-u, dokazivati:

1. independent active/actionable/waiting classifications;
2. action open/actionable/waiting/terminal transitions bez status collapse-a;
3. authoritative due selection, date-only/timezone normalization, `NO_DUE` i due-change history;
4. multidimensional current operational projection sa localized fail-closed rezultatom;
5. contemporaneous `operationalAsOf(T)` i explicit retrospective reconstruction;
6. deterministic rebuild iz istog Layers 1–2 frontier-a, cut-off-a i `voc-1/v1` rules;
7. exact provenance i complete/invalid/unavailable propagation za buduće metrike iz §9.

Ovaj GO nije dozvola za production implementation, `src/` izmjene, UI, FIELD pilot, pravi SDJ/OneDrive workspace, migration, external API/network, commit, push, merge, rebase ili tag. Faze 1–6 i dalje zavise od formalnog project acceptance-a iz Registra i zasebnog preciznog naloga.

## 13. Explicit unresolved items and non-goals

### 13.1 Unresolved items that do not block VOC-1 semantics

- physical payload/schema field names i serialization detalji;
- canonical office/matter timezone fallback — trenutno ga nema; date-only bez explicit accepted timezone-a failuje zatvoreno;
- MVS-1 `due soon` look-ahead parameter/version;
- production resolver/query API, performance, scheduling i materialization;
- reconciliation MVS-0 statusnog teksta sa VOC-1 controlling decision-om;
- FIELD potvrda UX naziva, bez prava da promijeni ovdje zaključane semantic separations bez nove odluke.

### 13.2 Explicit non-goals

Nijedan metrics engine, metric formula implementation, production adapter, SQLite schema, persistence promjena, status enum migration, dashboard/UI, FIELD validation, workflow/dependency engine, legal deadline calculator, AI inference ili external integration nije dio VOC-1.

## 14. STOP boundary

VOC-1 se završava ovim documentation-only closure-om. Naredni korak zahtijeva zaseban nalog. Ne započinjati MVS-1, metrics engine, UI, FIELD validation, migration ili production coupling u okviru ovog work package-a.
