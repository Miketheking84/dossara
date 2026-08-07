# DOSSARA — WP VLA-1A Domain Contracts and Authority Boundary

## 1. Document Control

| Polje | Vrijednost |
|---|---|
| Work package | VLA-1A — Domain Contracts and Persistence Boundary |
| Dokument | Domain Contracts and Authority Boundary |
| Status | Documentation-only acceptance draft |
| Datum | 7. avgust 2026. |
| Branch | `spike/phase-0c-electron-forge-webpack` |
| Normativni baseline | Prihvaćeni VLA-0A–E paketi i Decision & Alignment Register v1.2 |
| Izvan scope-a | Kod, schema, fizički format, filesystem transakcije, RBAC, VLA-1B |

## 2. Purpose and central invariant

Ovaj dokument prevodi zaključanu VLA-0 semantiku u storage-neutral domain contracts. Ne mijenja VLA-0 termine niti uvodi novu poslovnu osu.

**Normative:** DOSSARA authoritative semantics reside in stable domain object identities, immutable exact revisions, authoritative lifecycle/currentness rules and immutable semantic/audit history. Matter State and technical indexes are rebuildable projections and must never become authority merely because they are convenient to read.

DOSSARA ostaje file-first, matter-centric, human-controlled i storage-neutral na semantičkom nivou. File-first ne znači Markdown-only, one-file-per-object niti slobodno uređivanje autoritativnog sadržaja bez reconciliation-a.

## 3. Canonical domain model

Svaki primjenjivi canonical record razdvaja četiri koncepta:

1. **Stable object identity** — kontinuitet istog semantičkog predmeta kroz vrijeme.
2. **Immutable exact revision** — identifikovano, jednom persisted i nepromjenjivo sadržajno/semantičko stanje tog objekta.
3. **Authoritative lifecycle/currentness** — auditabilna pravila koja određuju koja revizija ili relacija je aktuelna za određeni scope, purpose i vrijeme.
4. **Immutable semantic/audit history** — nepromjenjivi zapisi radnji, pregleda, odluka, pokušaja, rezultata, korekcija i state effects.

Zaključano razgraničenje je:

```text
stable object identity
≠ revision identity
≠ content hash
≠ filesystem path
≠ Semantic Event identity
```

Hash je dokaz ili verifikaciona vrijednost za određeni sadržaj i vrijeme, ne identitet objekta. Path je promjenjivi lokator. Semantic Event dokazuje događaj; nije ni objekat na koji se događaj odnosi ni njegova revizija. Format identifikatora ostaje za VLA-1B.

## 4. Revision and identity contract

### 4.1 Kada nastaje nova revizija

Nova exact revision nastaje kada se mijenja sadržaj ili semantički atribut čija vrijednost utiče na značenje, review, authority, provenance, lifecycle/currentness, temporalni rezultat, referencijalni integritet ili apply eligibility. To obuhvata semantic correction, izmjenu targeta/scope-a, assertion teksta/kind-a, proposed effect-a, preconditions, authority-sensitive sadržaja ili relevantne provenance veze. Jednom persisted revizija se ne mijenja in-place.

Tehnički metadata refresh koji nema semantički učinak ne mora stvarati domain revision; granica tehničkih polja pripada VLA-1B. Svaka sumnja da izmjena može promijeniti istorijsku interpretaciju rješava se novom revizijom, ne overwrite-om.

### 4.2 Kada nastaje novi object identity

Novi object identity nastaje kada se evidentira semantički zaseban predmet, prijedlog, tvrdnja, odluka, radnja, review, apply pokušaj/ishod ili izvor sa nezavisnim provenance značenjem. Ispravka formulacije istog kontinuiranog objekta tipično je nova revision; atomizacija jedne tvrdnje u više tvrdnji ili reconsideration završene odluke može zahtijevati nove povezane objekte prema VLA-0A. Odluka „ista identity / nova revision / novi object“ mora biti obrazloživa i auditabilna.

Rename, move, promjena prikaznog naziva, nova tehnička reprezentacija ili promjena hasha ne stvaraju sami po sebi novi object identity. Rename/move čuva identity i dodaje location history.

### 4.3 Exact historical reference

Review, approval, Evidence Link, Change Item target, Apply Receipt, Conflict disposition, Semantic Event i downstream provenance moraju referencirati stable identity i exact revision/content version kad sadržaj utiče na značenje. `latest` nije dozvoljen kao historical target u takvom slučaju. Kasnija revizija ne mijenja predmet ranije radnje.

### 4.4 Lifecycle pojmovi nisu sinonimi

| Pojam | Značenje | Posljedica |
|---|---|---|
| superseded | staru reviziju/relaciju zamjenjuje identifikovana novija | stara ostaje istorijski istinita; nije automatski refuted |
| replaced | usmjerena source relacija namijenjene zamjene za scope/purpose | ne proizvodi automatski globalni `SUPERSEDED` |
| inactive/deactivated | objekat nema current operativno ili projekciono učešće u deklarisanom scope-u | nije brisanje, rejection, withdrawal ni void; tačan object-specific status ostaje kasnija odluka |
| withdrawn | autor/ovlašćeni owner povlači još neprimijenjeni objekat/reviziju iz dalje upotrebe | ne poništava već applied effect |
| void | zapis nije smio proizvoditi dejstvo zbog proceduralne nevalidnosti | zahtijeva povišeni authority; istorija ostaje |
| archive | smještanje van redovnog aktivnog prikaza/operacije | ne mijenja samo po sebi istinitost, lifecycle ni istorijsko dejstvo |

`ACTIVE`, `SUPERSEDED`, `WITHDRAWN` i `VOIDED` ostaju zaključani VLA-0A lifecycle termini. „Deactivated“ i „archive“ u VLA-1A su generičke operativne mogućnosti, ne novi univerzalni lifecycle enum-i.

## 5. Canonical Object Contract Matrix

Skraćenice: **AR** = authoritative record; **Hist** = immutable historical representation; **MS** = Matter State. „Review“ znači review kada sadržaj treba dobiti trust, acceptance, approval, disposition ili state effect, ne nužno pregled samog postojanja zapisa.

| Object type | Stable identity | Revisioned? | Append-only? | Current AR / Hist | Provenance | Review | Authority / time | MS | Projection only | Supersede / deactivate | Normal physical delete |
|---|---|---:|---:|---|---|---|---|---:|---:|---|---:|
| Source Item | da, materijal kao logički evidencijski predmet | da za semantičke atribute | history da | current revision + sve revisions/events | obavezna | sporna klasifikacija/relevantnost | authority-sensitive procjene; source/receipt/recorded times | input | ne | da / da uz audit | ne |
| Source Content Version | da, version identity unutar Source Item-a | ne; ona jeste exact immutable version | da | currentness relation + sve versions | obavezna | integritet/scope gdje relevantno | recorded/known/source times | input | ne | može biti zamijenjena; ne prepisuje se | ne |
| Evidence Link | da, relation identity | da | history da | current relation revision + history | exact Source Version/Scope i Assertion revision | da za evidence učinak | reviewer, scope, action time | input | ne | da / withdraw/void prema osnovu | ne |
| Assertion (`MATTER_ASSERTION`) | da | da | history da | current exact revision + history | generator, sources, evidence | da za trust/purpose | reviewer/authority i temporalni scope | input/contributor nakon apply-ja | ne | da / da | ne |
| Verified Fact | identitet underlying Assertion-a; nije novi primarni object | prati exact Assertion revision i membership/effect | membership history da | izvedena current kvalifikacija; authoritative basis ostaje u AR/history | exact assertion/evidence/review/apply | obavezno | ovlašćeni reviewer/apply authority; effective scope | segment | da kao oznaka/članstvo | supersession/deactivation kroz underlying records/effects | n/p; underlying ne |
| Working Assumption | identitet underlying Assertion-a; nije novi primarni object | prati exact `ASSUMED` factual claim revision | membership history da | izvedeni segment iz AR trust/review/apply osnova | obavezni razlog, ograničenja i basis | da za purpose | purpose authority i vremena | segment | da kao oznaka/članstvo | da kroz underlying records/effects | n/p; underlying ne |
| Factual Inference | identitet `MATTER_ASSERTION` sa kind `FACTUAL_INFERENCE` | da | history da | current assertion revision + history | exact inference basis/limitations | da za purpose | reviewer i relevantna vremena | zaseban segment nakon apply-ja | ne kao assertion; segment jeste projection | da / da | ne |
| Decision | stabilni Decision Request/outcome identity prema VLA-0A | završeni outcome se ne prepisuje; reconsideration je novi povezani request | history da | AR odluke + event history | exact basis/relevant revisions | authority decision obavezna | izrazito authority-sensitive; action/effective time | neposredni input | ne | ne prepisuje se; cancellation/reconsideration su novi tragovi | ne |
| Conflict Record | da, za konkretni conflict/scope | da ako se materijalno redefiniše; dispositions su novi history | history da | current resolution view + svi dispositions | exact scopes/assertion revisions | obavezno za materiality/disposition | authority, purpose, known/effective time | input/blocker | ne | scope-specific resolve/reopen; može se deaktivirati samo auditabilno | ne, uključujući resolved |
| Legal Action | da | da | history da | current revision/status + history | basis/decision links | prema vrsti i effect-u | assignee/authority i action/effective times | contributor | ne | da / da | ne |
| Change Set | da | da | proposal/apply history da | current proposal revision + all revisions/receipts | generator, basis, target frontier | set/item approval prema VLA-0D | review/apply authority i times | proposed effect nije input; actual results jesu | ne | da; applied set se ne withdraw-uje radi poništenja | ne |
| Change Item | da | da | proposal/apply history da | exact item revision + history | exact targets, basis, dependencies | item-level content-bound approval | review/apply authority, effective time | resulting effect nakon apply-ja | ne | da; applied effect samo novim change/apply putem | ne |
| Review Record | da, svaki review čin | ne; korekcija/reopen je novi record | da | nema mutable current sadržaja; current status je projection po scope-u | exact subject revision i basis | sam je dokaz reviewa | izrazito authority-sensitive; reviewed/recorded time | input | ne | ne supersede-uje se tiho; corrective record | ne |
| Apply Receipt | da, za attempt/item/group rezultat | ne; finding/addendum je novi record | da | nema mutable current sadržaja; agregat je izveden | exact Set/Item revisions, attempts, actual result | prethodni approval validiran | izrazito authority-sensitive; attempted/applied/recorded time | input za actual effect/recovery | ne | ne; korekcija novim recovery recordom | ne |
| Semantic Event | da | ne | da | immutable event stream/history | targets, exact revisions, causal chain | zavisi od event klase | actor, authority-at-event-time, occurred/known/recorded/effective | input za reconstruction/protective effects | ne | može biti kvalifikovan novim eventom, nikad overwritten | ne |

Matrica ne uvodi nove domain objekte. „Verified Fact“ i „Working Assumption“ su VLA-0C projection qualifications/memberships; „Factual Inference“ je VLA-0A assertion kind. „Decision“ obuhvata zaključani Decision Request/outcome model, bez novog paralelnog decision objekta.

## 6. Source identity contract

`SOURCE_ITEM` i `SOURCE_CONTENT_VERSION` ostaju odvojeni:

```text
Source Item
  ├── Content Version 1
  ├── Content Version 2
  └── Content Version 3
```

Promjena sadržaja tipično stvara novu immutable Content Version istog Source Item-a kada kontinuitet materijala i provenance to opravdavaju. Zasebna dostava/evidencijska uloga može biti novi Source Item povezan sa `REPLACES`, `CORRECTS`, `COPY_OF` ili drugom VLA-0B relacijom. Sistem to ne odlučuje samo iz imena, path-a ili hasha. Svaki historical evidence scope referencira exact Content Version.

## 7. Review and approval binding

**Invariant:** Content-dependent review and approval are bound to an exact revision, purpose and scope.

```text
Change Item R3 — APPROVED
Change Item R4 — requires its own review/approval
```

Approval R3 ne prelazi automatski na R4. Stari Review Record/approval ostaje istinit historical record o R3. Isto pravilo važi za assertions, evidence relations, Change Set/Item, source assessments i sve druge content-sensitive targete. Materialno nepromijenjena tehnička reprezentacija ne daje pravo implementaciji da samostalno prenese approval; pravilo semantičke ekvivalentnosti mora biti eksplicitno i auditabilno.

## 8. Authority boundary

Svaki authority-sensitive record ili event mora sačuvati najmanje:

- actor identity i deklarisanu ulogu/capacity;
- authority context i basis/policy reference;
- authority scope, matter, target i purpose;
- action time (`reviewed_at`, `approved_at`, `attempted_at` ili drugo primjenjivo vrijeme);
- `effective_at`/interval kada se razlikuje od action time-a;
- rezultat authority provjere i poznata ograničenja.

Authority se procjenjuje u vrijeme radnje, ne prema današnjoj ulozi. Kasniji nalaz ne prepisuje original; stvara corrective/reconciliation trag. Ovaj ugovor ne projektuje authentication, RBAC ili concurrency.

## 9. One conceptual Semantic Write Boundary

**Normative:** Postoji jedan konceptualni `Semantic Write Boundary` kroz koji moraju proći sve authoritative semantic mutations: kreiranje/revizija canonical records, review/approval/decision, lifecycle, relations, Controlled Apply, receipts, events, recovery i reconciliation.

To ne znači jedan OS proces, lock, bazu, korisnika ili fizičku transakciju. Te mehanike su kasnije odluke. Znači da nijedna komponenta, importer, AI, UI, file watcher, indexer ili recovery alat ne smije imati paralelni nezavisni semantic write path koji zaobilazi iste validacije, authority, revision, audit i invalidation invarijante.

## 10. AI boundary

**AI is never an authoritative semantic writer.** AI smije proizvesti proposal, extraction, classification, suggested relation, candidate Assertion/Conflict/Legal Action/Change Set i draft Work Product. Svaki output zadržava generator provenance i nema authoritative semantic effect dok ovlašćeni čovjek ne izvrši primjenjivi VLA review/approval/apply. Nema AI API niti mrežne integracije u ovom WP-u.

## 11. Work Product boundary

Memo, draft, pleading, contract draft, legal opinion dokument, client email i Client Action Pack nisu sami po sebi authoritative Matter State. Njihovo postojanje ne potvrđuje sadržane činjenice, odluke ili radnje. Buduća Work Product arhitektura mora moći vezati proizvod za exact source/domain revisions, purpose, projection/rules version, knowledge/recorded/effective cut-offs i state boundary korišćen pri izradi. Ovdje se ne projektuje Work Product model.

## 12. Deletion model

Fizičko brisanje nije normalni lifecycle authoritative VLA objekata. Verified Fact basis, Decision, Review Record, Apply Receipt, Semantic Event, applied Change Set/Item i resolved Conflict moraju ostati istorijski rekonstruisivi. Normalne promjene koriste, prema tačnom značenju, supersede, withdraw, void, deactivate ili archive; nijedan od tih pojmova nije sinonim za drugi niti briše audit.

Applied effect se ne povlači brisanjem ili withdrawal-om starog prijedloga, nego novim odobrenim Change Item-om, Controlled Apply-em i receipt-om. Event ili receipt se koriguje novim povezanim recordom. Privacy, retention i pravno obavezna destruction policy ostaju van scope-a i ne mogu se improvizovati kroz normalni lifecycle.

## 13. Gap register and conclusion

| Klasa | Nalaz | Disposition |
|---|---|---|
| A — Domain semantic blocker | nijedan | svi domain semantic gapovi potrebni za VLA-1A zaključani ovim dokumentom i VLA-0 baseline-om |
| B — Persistence architecture | ID format; serialization; physical layout; relation/revision storage; audit container | VLA-1B |
| C — Security/concurrency | authentication, RBAC, authority-policy engine, locks, multi-user/OneDrive mechanics | kasniji technical WP |
| D — Product functionality | review UX, archive UX, Work Product UX, vocabulary presentation | kasniji product/UX WP |
| E — Implementation detail | hash, watcher, schema validators, transaction staging, fsync, cache refresh | ne blokira VLA-1A |

Nema MATERIAL/BLOCKER nalaza i nema potrebe za VLA-0F. Domain semantics, identity, exact revisions, authority boundary i conceptual single writer su fixed; fizički persistence ostaje replaceable.
