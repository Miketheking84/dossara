# DOSSARA — Foundation Hardening Work Package

## 1. Document control

| Polje | Vrijednost |
|---|---|
| Work package | Foundation Hardening |
| Status | Prepared — not started |
| Datum | 9. avgust 2026. |
| Predecessors | Accepted VLA-0A–E, accepted VLA-1A, completed VLA-1B |
| Vrsta | Isolated technical hardening and executable contract validation |
| Workspace boundary | Isključivo `C:\SDJ_TEST\SDJ_LEGAL_TEST\` za testne workspace operacije |

## 2. Purpose

Foundation Hardening pretvara VLA-1A/1B arhitektonske ugovore u provjerljive, izolovane tehničke contracte i failure fixtures prije bilo kakve produkcijske implementacije faza 1–6. Cilj nije feature delivery nego dokaz da persistence foundation može sačuvati authority, exact history, forward compatibility i recovery granice.

## 3. Entry conditions

WP smije početi tek nakon posebnog naloga naručioca koji potvrđuje:

1. dozvoljeni branch/worktree;
2. tačan spisak fajlova za izmjenu;
3. da li je rad documentation-only ili isolated spike;
4. korišćenje isključivo `C:\SDJ_TEST\SDJ_LEGAL_TEST\` za workspace fixtures;
5. da nema pristupa stvarnom SDJ/OneDrive workspace-u;
6. da nema AI API ni spoljnih mrežnih poziva;
7. da spike ne ulazi automatski u produkcionu granu.

## 4. In scope

### FH-1 — Canonical serialization contract

- definisati/testirati canonical UTF-8 JSON serialization;
- Unicode normalization, newline i key-order/canonical digest input;
- round-trip preservation unknown fields/extensions;
- reject duplicate keys, ambiguous numbers i invalid timestamps;
- dokazati da serialization ne mijenja semantic identity.

### FH-2 — Schema and registry foundation

- common envelope schema;
- object-type registry i schema-version mapping;
- typed-reference registry/cardinality rules;
- semantic validators odvojeni od syntax schema validation;
- unknown type/version safe-degradation fixtures.

### FH-3 — Identity and revision integrity

- izabrati opaque ID format/generator;
- collision/uniqueness test strategy;
- immutable revision publication contract;
- dokazati da rename/move ne mijenja semantic identity;
- spriječiti inference type/time/matter značenja iz ID formata.

### FH-4 — Dependency frontier proof

- izabrati manifest/head representation;
- coverage proof za authoritative partitions/segments;
- stale/incomplete/unsupported transitions;
- rules/registry/schema version invalidation;
- late discovery i future type fixtures.

### FH-5 — Append-only history and transaction spike

- sealed JSONL segment contract;
- active→sealed boundary;
- logical transaction record i idempotency identity;
- crash points prije/tokom/poslije authoritative publication;
- `RECOVERY_REQUIRED`, `RECONCILED_APPLIED` i `RECONCILED_NOT_APPLIED` fixtures;
- bez donošenja nove poslovne odluke u recovery-ju.

### FH-6 — Manual edit reconciliation spike

- razlikovati last accepted i externally observed state;
- accept/reject/resolve fixtures;
- new revision umjesto in-place legalization-a;
- projection invalidation i Controlled Apply blocking;
- očuvanje unknown record/extension podataka.

### FH-7 — Rebuild and disposable-index proof

- deterministički rebuild Matter State fixture-a iz Layers 1–2;
- rebuild nakon potpunog brisanja SQLite/FTS fixture-a;
- historical `as-known-at` i `as-effective-at` fixtures;
- projection equivalence i localized invalidity checks;
- dokaz da nijedan authoritative datum ne postoji samo u indeksu.

### FH-8 — Backup/restore validation

- potvrditi da `00 CONTROL/vla/` ulazi u DOSSARA Control Backup;
- manifest/integrity verification fixture;
- restore u izolovani testni workspace;
- jasno razdvojiti Control Backup od Document Backup-a;
- ne uključivati stvarne klijentske dokumente.

## 5. Explicitly out of scope

- produkcijska integracija u aplikaciju;
- migracija postojećeg SDJ workspace-a;
- rad nad stvarnim ili OneDrive workspace-om;
- UI/UX, dashboard i product features;
- full SQLite/FTS performance optimization;
- authentication, RBAC, encryption i komercijalna distribucija;
- AI provider, API ili network call;
- VLA-0/VLA-1 semantic changes;
- početak faza 1–6 bez njihove zasebne acceptance odluke.

## 6. Required deliverables

1. Foundation Hardening decision log sa svim izabranim tehničkim parametrima.
2. Versioned common-envelope i registry contracts.
3. Typed-reference validation matrix.
4. Dependency-frontier specification i executable fixtures.
5. Immutable revision/history/transaction fixture corpus.
6. Crash/recovery test matrix sa dokazivim outcomes.
7. Manual-edit reconciliation fixture corpus.
8. Rebuild/index-loss/historical-reconstruction test report.
9. Backup/restore test report.
10. Gap/blocker i implementation-readiness report.

Tačni filenames i code locations određuju se u posebnom start nalogu; ovaj dokument ih ne autorizuje.

## 7. Mandatory forward-compatibility tests

| Gate | Minimalni acceptance test |
|---|---|
| `objectType` | unknown future type round-trips bez gubitka i blokira lažnu completeness tvrdnju |
| typed references | unknown edge/target type se čuva; type/revision/matter mismatch se odbija |
| dependency frontier | novi/unknown segment, type ili rules version deterministički proizvodi stale/incomplete/unsupported |

Sva tri gate-a moraju proći zajedno. Bytes preservation bez safe projection ponašanja nije PASS.

## 8. Failure and data-loss test matrix

Minimalno testirati:

- proces prekida prije kreiranja canonical revision-a;
- revision postoji, ali transaction/receipt completion nije dokaziv;
- audit segment je nepotpun ili nije sealed;
- manifest/head ne obuhvata postojeći segment;
- current projection je stariji od authoritative frontier-a;
- index je potpuno izgubljen ili corrupt;
- ručna izmjena exact revision-a;
- type/schema/reference handler nije podržan;
- duplicated retry istog approved Change Item-a;
- partial physical effect unutar semantic atomic group;
- backup restore sa nedostajućim authoritative inputom.

Svaki scenario mora završiti u dokazivom applied, dokazivom not-applied, lokalizovanom invalid/incomplete ili `RECOVERY_REQUIRED` stanju. Silent success i normal retry preko unknown completion-a su zabranjeni.

## 9. Acceptance criteria

Foundation Hardening je acceptance-ready samo ako:

- canonical serialization je deterministička i round-trip safe;
- common envelope obavezno čuva `objectType`;
- sve semantic veze koriste validabilne typed references;
- dependency frontier dokazuje coverage i unknown-input stanje;
- exact revisions i sealed history se ne prepisuju;
- recovery nikad ne pretpostavlja completion;
- manual edit ne postaje silent authority;
- Matter State se deterministički rebuild-uje iz Layers 1–2;
- brisanje Layer 4 ne gubi authority;
- historical reconstruction čuva `Tk/Tr/Te` razliku;
- testovi koriste samo dozvoljeni testni workspace i sintetičke fixtures;
- nema mrežnih poziva, produkcijske integracije ni VLA semantic drift-a;
- svi data-loss i blocker nalazi su riješeni ili WP dobija NO-GO.

## 10. Stop conditions

Rad se odmah zaustavlja ako:

- tehnički izbor zahtijeva promjenu VLA-0/VLA-1 semantike;
- authoritative podatak bi postojao samo u SQLite-u/indexu;
- crash recovery ne može razlikovati success, non-effect i unknown completion;
- unknown type/reference može biti tiho ignorisan uz `complete/current` projection;
- test zahtijeva stvarni SDJ/OneDrive workspace;
- pronađe se neočekivana working-tree promjena ili scope creep;
- Phase 0/Registar zahtijeva novu odluku naručioca.

## 11. Gap classification

Svaki nalaz se klasifikuje kao:

- **A — semantic contradiction:** blocker; vraća se naručiocu, bez tihog VLA rewrite-a;
- **B — persistence hardening decision:** riješiti u ovom WP-u;
- **C — security/concurrency:** defer uz eksplicitnu safety granicu;
- **D — product/UX:** defer bez slabljenja authority-ja;
- **E — implementation detail:** riješiti/testirati ili evidentirati kao nonblocking.

WP ne može dobiti GO sa otvorenim A ili data-loss blocker nalazom.

## 12. Planned completion report

Završni izvještaj mora sadržati branch, početni/završni status, tačne izmijenjene fajlove, test environment, sve izvršene provjere, tri forward-compatibility gate-a, crash/recovery rezultate, rebuild/index-loss dokaz, backup/restore rezultat, A–E gapove, MATERIAL/BLOCKER nalaze, kompletan diff i jednu finalnu preporuku:

```text
GO — FOUNDATION HARDENING ACCEPTANCE READY
```

ili

```text
GO WITH CORRECTIONS — FOUNDATION HARDENING
```

ili

```text
NO-GO — FOUNDATION HARDENING
```

## 13. Prepared state

Foundation Hardening je pripremljen kao naredni WP, ali nije započet. Ovaj dokument ne autorizuje kod, testne fajlove, workspace mutacije, commit niti produkcijski rad. Za početak je potreban poseban, fajl-po-fajl nalog naručioca.
