# GPP-0 — Golden Path Reconstruction & Provenance Proof

## Control

| Polje | Vrijednost |
|---|---|
| Work package | GPP-0 |
| Vrsta rada | Izolovani executable proof harness; bez produkcijske integracije |
| Authority | Decision & Alignment Register v1.2; accepted VLA-0A–E, VLA-1A/1B; FH-1 commit `c9c8eb4` |
| Dozvoljeni workspace | Isključivo privremeni folderi ispod `C:\SDJ_TEST\SDJ_LEGAL_TEST\` |
| Produkcijski `src/` | Nije mijenjan |

## Reconnaissance

| Golden Path korak | Postojeći authority / primitiva | Stanje prije GPP-0 |
|---|---|---|
| Source / evidence | VLA-0B; VLA-1B `SOURCE_ITEM` i exact typed references | Contract postoji; FH-1 dokazuje typed exact-reference validation |
| Proposed state change / Change Set | VLA-0D Change Set Architecture | Semantika postoji; nema end-to-end executable dokaza |
| Review | VLA-0A/VLA-0D exact-revision-bound review | Semantika postoji; nema integration dokaza |
| Controlled Apply | VLA-0D Controlled Apply | Semantika postoji; fizička mehanika deferred |
| Canonical revisions | VLA-1A/1B; FH-1 immutable revision primitive | FH-1 executable PASS |
| Audit/history | VLA-0E; VLA-1B JSONL; FH-1 minimal append | Minimalni append executable PASS; recovery/reconstruction nije accepted u FH-1 |
| Reconstruction | VLA-0C/0E/1A | Contract postoji; FH-1 rebuild fajl je exploratory-only |
| Manual edit | Register I12; VLA-1B reconciliation; FH-1 integrity read | Detection executable PASS; puni reconciliation workflow deferred |

Reconnaissance nije pronašao novi domain-authority gap. GPP-0 zato komponuje postojeće primitive u izolovanom harness-u. Harness nije produkcijska implementacija, ne zaključava API/SQLite/UI i ne proglašava deferred produkcijsku crash mehaniku završenom.

## Executable scenario

`golden-path-proof.integration.test.ts` generiše jedan sintetički matter i 100 determinističkih ChangeSetova. Miks uključuje additions, replacements, corrections, status transitions, temporal changes, ponovljene izmjene istih vrijednosti, unrelated promjene i devet različitih source lineage-a.

Svaki uspješni tok trajno povezuje:

```text
SOURCE_ITEM exact revision
  → CHANGE_SET exact revision
  → REVIEW_RECORD exact revision
  → immutable MATTER_ASSERTION revision
  → transaction attempt + APPLY_COMPLETED/recovery event
  → reconstructed material value + machine-verifiable provenance
```

`State(T1)`, `State(T2)` i `State(T3)` koriste eksplicitni recorded cut-off i effective instant. Future-effective zapis nije current prije `effectiveFrom`. Pet uzastopnih cold rebuildova mora dati identične canonical bytes.

## Failure semantics proved by the harness

- unresolved contradictory change: `CONFLICT_BLOCKED`, bez authoritative effect-a;
- stale base revision: `STALE_BASE`, bez silent overwrite-a;
- interruption poslije immutable revision publication, prije apply eventa: revision nije current; recovery ga dokazivo povezuje kroz `RECOVERY_RECONCILED_APPLIED` bez duplikata;
- restart/rebuild: stanje se ponovo čita isključivo iz file-first revisions, transactions i history;
- manual mutation: integrity mismatch; izmijenjeni bytes se ne popravljaju niti prihvataju.

## Acceptance boundary

GPP-0 dokaz važi samo za izolovani foundation harness. Ne odobrava produkcijske faze 1–6, stvarni SDJ/OneDrive workspace, multi-user rad, UI niti produkcijski recovery engine.

## Executed evidence — 13. avgust 2026.

### Scenario composition

| Vrsta promjene | Broj |
|---|---:|
| additions | 8 |
| replacements | 60 |
| corrections | 5 |
| status transitions | 7 |
| temporal/effective changes | 9 |
| unrelated changes | 11 |
| **Ukupno** | **100** |

Scenario mijenja osam materijalnih polja više puta i koristi devet različitih sintetičkih Source Item lineage-a.

### Historical states

| Polje | `State(T1)` — 26.1.2026. | `State(T2)` — 2.3.2026. | `State(T3)` — 11.4.2026. |
|---|---|---|---|
| `claimAmount` | `25000` | `57000` | `97000` |
| `matterStatus` | `matterStatus-value-18` | `matterStatus-value-58` | `matterStatus-value-98` |
| `court` | `court-value-19` | `court-value-59` | `court-value-91` |
| `responsibleLawyer` | `responsibleLawyer-value-20` | `responsibleLawyer-value-60` | `responsibleLawyer-value-100` |
| `nextAction` | `nextAction-value-21` | `nextAction-value-53` | `nextAction-value-93` |
| `riskBand` | `riskBand-value-22` | `riskBand-value-54` | `riskBand-value-94` |
| `hearingRoom` | `hearingRoom-value-23` | `hearingRoom-value-55` | `hearingRoom-value-95` |
| `internalNote` | `internalNote-value-24` | `internalNote-value-56` | `internalNote-value-96` |

`court-value-99` je recorded prije T3, ali ima future `effectiveFrom` poslije T3, pa je dokazano da u `State(T3)` još važi `court-value-91`.

### Verification results

| Provjera | Rezultat |
|---|---|
| FH-1 targeted baseline | PASS — 18/18 |
| GPP-0 targeted | PASS — 9/9 |
| Full Vitest | PASS — 366/366 u 18 fajlova |
| TypeScript `tsc --noEmit` | PASS |
| ESLint | PASS |
| Next.js production build | PASS; jedan pre-existing Turbopack/NFT warning van GPP-0 scope-a |
| Repeated cold rebuild | PASS — 5/5 canonical-byte ekvivalencija |
| T3 material-value provenance | PASS — 8/8 vrijednosti imaju exact source, ChangeSet, review, assertion revision, transaction i apply event lineage |
| Test workspace guard | PASS — harness koristi `PERMITTED_TEST_ROOT = C:\SDJ_TEST\SDJ_LEGAL_TEST`; privremeni `gpp0-*` folder se briše nakon testa |
| Spoljni mrežni pozivi / AI API / SQLite authority | PASS — nijesu uvedeni niti korišćeni |

### Acceptance matrix

| # | Stavka | Status | Executable dokaz |
|---:|---|---|---|
| 1 | Source → State Change | PASS | exact `SOURCE_REVISION` u ChangeSet-u |
| 2 | State Change → ChangeSet | PASS | 100 immutable `CHANGE_SET` revisions |
| 3 | Review gate | PASS | exact-revision-bound approved `REVIEW_RECORD`; apply ga ponovo validira |
| 4 | Controlled Apply | PASS | expected-base, conflict i review guard prije authoritative effect-a |
| 5 | Canonical revision creation | PASS | immutable `MATTER_ASSERTION` exact revision |
| 6 | Audit/history persistence | PASS | 100 transaction attempts i 100 apply history događaja |
| 7 | Current-state rebuild | PASS | file-first cold reconstruction odgovara prethodno dokazanom current state-u |
| 8 | historical `State(T1)` | PASS | eksplicitne vrijednosti iz tabele |
| 9 | historical `State(T2)` | PASS | eksplicitne vrijednosti iz tabele |
| 10 | historical `State(T3)` | PASS | eksplicitne vrijednosti iz tabele |
| 11 | material-value provenance | PASS | 8/8 machine-verifiable lineage lanaca u T3 |
| 12 | contradictory change handling | PASS | `CONFLICT_BLOCKED`; ChangeSet/review trag ostaje; state nepromijenjen |
| 13 | stale base revision handling | PASS | `STALE_BASE`; stanje prije/poslije identično |
| 14 | interrupted apply recovery | PASS | orphan revision nije current; `RECOVERY_RECONCILED_APPLIED` daje jedan dokazivi effect |
| 15 | restart/rebuild determinism | PASS | pet cold rebuildova daje iste canonical bytes |
| 16 | manual file modification handling | PASS | `INTEGRITY_MISMATCH`; izmijenjeni bytes ostaju netaknuti i nijesu prihvaćeni |
| 17 | 100 ChangeSet deterministic replay | PASS | 100/100 ChangeSet, review, transaction i apply tokova |

## Final verdict

```text
GO — VERIFIED CORE PROVEN
```

Verdict je ograničen na GPP-0 claim: accepted DOSSARA Verified Core authority/reconstruction/provenance model može se executable komponovati end-to-end iz file-first artefakata u izolovanom test harness-u. Nije tvrdnja da je isti mehanizam već integrisan u produkcijski `src/`, niti da su deferred produkcijski atomic publication, locking, OneDrive ili recovery UI završeni.
