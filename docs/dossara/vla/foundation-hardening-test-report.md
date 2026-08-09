# DOSSARA — Foundation Hardening Test Report

## FH-1 corrective acceptance report — 9. avgust 2026.

```text
GO — FH-1 TECHNICALLY ACCEPTED
```

FH-1 je executable spike isključivo pod `spikes/foundation-hardening/`. Nema
production coupling-a, `src/` izmjena, runtime importa, mrežnih poziva niti
pristupa stvarnom SDJ/OneDrive workspace-u. Production promotion i početak
faza 1–6 nijesu odobreni ovim rezultatom.

### Acceptance matrix

| Gate | Automated evidence | Rezultat |
|---|---|---|
| canonical serialization | deterministic keys, NFC, LF, unsafe values i duplicate keys | PASS |
| schema/objectType registry | supported/unsupported/unknown i defensive envelope validation | PASS |
| stable identity/revisions | isti objectId, dvije immutable revision datoteke | PASS |
| direct dependency frontier | current, direct stale, missing invalid, unsupported incomplete, unrelated unchanged | PASS |
| immutable filesystem write | canonical wrapper + SHA-256 + `wx` create-only | PASS |
| cold filesystem read | strict parse, validation, canonical bytes i digest verification | PASS |
| overwrite rejection | drugi upis istog exact revision path-a vraća `REVISION_ALREADY_EXISTS` | PASS |
| manual byte change | canonical content mutation vraća `INTEGRITY_MISMATCH`; bytes ostaju netaknuti | PASS |
| malformed manual change | vraća `MALFORMED_JSON`; nema repair/overwrite-a | PASS |
| append-only minimum | event 1 byte prefix ostaje isti nakon eventa 2; cold read vraća oba | PASS |
| invalid append | validation failure ne mijenja postojeći log | PASS |
| root containment | path van `C:\SDJ_TEST\SDJ_LEGAL_TEST\` je odbijen prije I/O-a | PASS |

### Verification results

| Provjera | Rezultat |
|---|---|
| ciljano `npm.cmd test -- ...foundation-hardening.test.ts ...persistence-spike.integration.test.ts` | PASS — 2 files, 18/18 tests |
| puni `npm.cmd test` | PASS — 22 files, 624/624 tests |
| `npx.cmd tsc --noEmit` | PASS |
| `npx.cmd eslint spikes/foundation-hardening/*.ts` | PASS |
| `npm.cmd run build` | PASS — Next.js 16.2.11; postojeći unrelated NFT warning za `src/lib/sdj-prompts.ts` |

Integration suite je kreirao samo sintetičke `fh1-*` foldere neposredno ispod
dozvoljenog root-a i uklonio ih u test cleanup-u. Root guard koristi resolved
absolute path i `path.relative` containment; guard se primjenjuje na workspace,
revision i history putanje.

### Acceptance boundary

Accepted u FH-1: canonicalization, registry/validation, stable exact revisions,
direct frontier, immutable disk round-trip, SHA-256 integrity, minimal JSONL
append i manual-change detection bez silent repair-a.

Exploratory, neaccepted: sealed-history/recovery contracts u
`history-and-recovery.ts` i rebuild abstractions u `rebuild.ts`.

Deferred: full segment/head lifecycle, crash recovery, full reconciliation,
Matter State/disposable-index acceptance, backup/restore, lease/OneDrive,
SQLite/FTS, Metrics Vertical Slice, UI, AI/API i production promotion.

## Status

Initial executable contract suite je pripremljen i provjeren u `spikes/foundation-hardening/`.

```text
FOUNDATION HARDENING — INITIAL CONTRACT TRANCHE PASS
```

## Coverage matrix

| Oblast | Executable evidence |
|---|---|
| canonical JSON | deterministic key order, NFC, LF, invalid values, duplicate keys |
| `objectType` | supported, unsupported-version i unknown classification |
| typed references | exact revision requirement i target-type validation |
| dependency frontier | current, stale, uncovered partition i unsupported input |
| append-only history | unsealed segment i duplicate event detection |
| recovery | ambiguous completion → `RECOVERY_REQUIRED`; retry blocked |
| reconciliation | external mismatch → reconciliation required; apply blocked |
| rebuildability | deterministic index rebuild nakon total loss-a |
| forward compatibility | unknown type → preserved input + incomplete projection |

## Environment boundary

- Testovi su pure/in-memory.
- Nije korišćen `C:\SDJ_TEST\SDJ_LEGAL_TEST\` jer ovoj početnoj suite nije potreban filesystem.
- Stvarni SDJ i OneDrive workspace nisu dotaknuti.
- Nema mrežnih poziva, AI API-ja, SQLite authority-ja ni produkcijske integracije.

## Verification results

| Provjera | Rezultat |
|---|---|
| `npm.cmd test -- spikes/foundation-hardening/foundation-hardening.test.ts` | PASS — 1 file, 13/13 tests |
| `npx.cmd tsc --noEmit` | PASS |
| `npx.cmd eslint spikes/foundation-hardening/*.ts` | PASS |
| network/external workspace access | nije korišćen |

Napomena: početni `npm` poziv nije pokrenuo testove jer lokalna PowerShell execution policy blokira `npm.ps1`; ekvivalentni `npm.cmd` je uspješno izvršio suite bez promjene system policy-ja.

## Gap and blocker classification

| Klasa | Nalaz | Status |
|---|---|---|
| A — semantic contradiction | nijedan | closed |
| B — hardening decision | canonical digest, segment/head manifest, atomic publication i disk recovery mechanics | pending naredni tranche |
| C — security/concurrency | writer lease, locking i OneDrive concurrency | deferred prema WP-u |
| D — product/UX | reconciliation/recovery UI | deferred |
| E — implementation detail | full payload schemas, reference cardinalities i SQLite schema | pending/deferred |

MATERIAL/BLOCKER nalaz nije pronađen u initial contract tranche-u.

## Remaining work before full Foundation Hardening closure

- on-disk sealed-segment i manifest/head spike;
- controlled crash-point i atomic-publication fixtures;
- recovery nad stvarnim testnim fajlovima isključivo u `C:\SDJ_TEST\SDJ_LEGAL_TEST\`;
- backup/restore validation u dozvoljenom testnom workspace-u;
- finalni `git diff --check` i kompletan closure report.
