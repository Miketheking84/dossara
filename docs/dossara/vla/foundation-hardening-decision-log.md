# DOSSARA — Foundation Hardening Decision Log

## FH-1 corrective acceptance scope — 9. avgust 2026.

Ovaj odjeljak kontroliše FH-1 interpretaciju ranijeg initial tranche drafta. FH-1 je
izolovani executable spike pod `spikes/foundation-hardening/`; nije production
implementation, nije importovan iz `src/` i ne odobrava faze 1–6.

### Accepted technical decisions

| ID | Odluka | FH-1 dokaz |
|---|---|---|
| FH-DEC-012 | SHA-256 se računa nad UTF-8 canonical envelope bytes | cold read ponavlja digest i odbija mismatch |
| FH-DEC-013 | Exact revision se objavljuje create-only (`wx`) u VLA logical layoutu | postojeća revision se ne može prepisati; druga revision ne mijenja prvu |
| FH-DEC-014 | Stored revision je canonical wrapper `{ envelope, integrity }` | strict parse, registry validation, canonical-byte i integrity provjera na cold read-u |
| FH-DEC-015 | Jedini FH-1 filesystem root je lexical containment ispod `C:\SDJ_TEST\SDJ_LEGAL_TEST\` | root i svaki izvedeni revision/history path prolaze `path.resolve` + `path.relative` guard |
| FH-DEC-016 | FH-1 frontier prati samo deklarisane direct exact-revision dependencies | direct change je stale; missing direct dependency invalid; unrelated revision se ignoriše |
| FH-DEC-017 | Minimal history proof je validirani JSONL append | validacija i existing-log provjera prethode append-u; event 1 ostaje isti prefix poslije eventa 2 |
| FH-DEC-018 | Manual mutation se samo detektuje | canonical tamper → integrity mismatch; malformed tamper → corrupt; reader ne repair-uje niti prepisuje |

### Retained FH-1-compatible draft

- canonical JSON, NFC, stable key ordering, LF i strict duplicate-key detection;
- common envelope, objectType/schema registry i typed exact-revision references;
- direct dependency-frontier assessment;
- minimal manual-edit reconciliation classification.

### Exploratory only — not part of FH-1 acceptance

- `history-and-recovery.ts`: sealed-history/recovery contract draft;
- `rebuild.ts`: Matter State i disposable-index rebuild draft.

Ova dva fajla nijesu importovana u FH-1 acceptance suite i nijesu dalje razvijana.

### Deferred after FH-1

- on-disk sealed segment lifecycle i segment/head manifest;
- crash recovery, atomic-publication fixture suite i full recovery protocol;
- full reconciliation workflow/UI;
- Matter State i disposable-index rebuild acceptance;
- backup/restore validation;
- writer lease, OneDrive/concurrency mechanics i production promotion;
- Metrics Vertical Slice, metrics calculations, UI, SQLite/FTS, AI/API i production workspace integration.

## Control

| Polje | Vrijednost |
|---|---|
| Status | Isolated spike baseline |
| Datum | 9. avgust 2026. |
| Scope | `spikes/foundation-hardening/`; bez produkcijske integracije |
| Test data | Isključivo sintetički in-memory fixtures |

## Decisions

| ID | Odluka | Razlog | Produkcijski status |
|---|---|---|---|
| FH-DEC-001 | Canonical JSON sortira object keys, NFC-normalizuje strings i završava LF-om | determinističan byte input za digest/diff | spike; canonical standard treba senior review |
| FH-DEC-002 | Duplicate JSON keys, non-finite numbers, `undefined`, unsupported values i cycles se odbijaju | nema parser ambiguity ili silent loss-a | spike validator |
| FH-DEC-003 | ID-jevi su opaque strings; type/time/matter se ne izvode iz formata | forward compatibility i identity stabilnost | konkretni generator deferred |
| FH-DEC-004 | `objectType` i schema version se klasifikuju kao supported/unsupported-version/unknown | safe degradation bez coercion-a | registry storage deferred |
| FH-DEC-005 | Content-bound reference types sa suffixom `_REVISION` zahtijevaju exact revision | review/approval/history ne mogu plutati na latest | registry vocabulary treba proširiti |
| FH-DEC-006 | Frontier status precedence je invalid → incomplete → stale → current | missing/unsupported input je stroži od običnog staleness-a | manifest/head format deferred |
| FH-DEC-007 | Unknown type u rebuild inputu proizvodi incomplete projection | bytes preservation nije lažna completeness | projection rules još nisu produkcijske |
| FH-DEC-008 | Unsealed history nije valid authoritative reconstruction input | partial segment ne smije izgledati complete | sealing algorithm deferred |
| FH-DEC-009 | Ambiguous completion je `RECOVERY_REQUIRED`; retry nije dozvoljen | čuva VLA-0D/VLA-0E invariant | persistence algorithm deferred |
| FH-DEC-010 | External edit mismatch zahtijeva reconciliation; accept znači nova revision | nema silent manual authority | filesystem detection deferred |
| FH-DEC-011 | Disposable index se gradi isključivo iz projection-a/authoritative inputs | potpuni index loss bez data loss-a | SQLite schema deferred |

## Deferred technical decisions

- concrete UUID/ULID/GUID choice and generator;
- canonical digest/hash algorithm;
- on-disk schema registry representation;
- JSONL active segment, seal, manifest and head representation;
- atomic publication, fsync, staging, writer lease and OneDrive mechanics;
- full object-specific payload schemas and reference cardinalities;
- production Matter State rules and historical query engine;
- backup/restore implementation against the permitted test workspace.

## Boundary

Ove odluke potvrđuju executable feasibility VLA-1B ugovora. Ne autorizuju production code, migration, real workspace access ili faze 1–6.
