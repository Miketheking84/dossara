# DOSSARA — VOC-0 Contract Acceptance and Closure

> **Historical status notice (GOV-REC-1).** Ovaj dokument čuva VOC-0 stanje, provisional granice i acceptance ishod iz vremena tog work package-a; njegovi tehnički nalazi, rationale i tadašnji status nijesu retroaktivno promijenjeni. Za sadašnju operational-semantics interpretaciju važi successor authority chain: VOC-1 je zatvorio pet ugovora (`09b74f514fcb56fbf20d74019ef2542aeb675b12`), a MVS-1 je prihvaćeni executable proof tih semantics (`b590e1738e88711f2d3aff5a0969190fe76e4cff`). Ovaj dokument ostaje historical governance artefakt i nije current authority tamo gdje ga VOC-1/MVS-1 preciziraju ili zamjenjuju.

## 1. Document control

| Polje | Vrijednost |
|---|---|
| Work package | VOC-0 — Contract-by-contract analysis and closure |
| Status | GO WITH PROVISIONAL CONTRACTS |
| Datum | 10. avgust 2026. |
| Formalni kontrolni akt | `docs/dossara/decision-alignment-register-v1.2.md` |
| Normativni contract | `docs/dossara/metrics/voc-0-domain-semantic-contracts.md` |
| Corrected MVS design | `docs/dossara/metrics/mvs-0-metrics-vertical-slice.md` |
| Corrected MVS acceptance | `docs/dossara/metrics/mvs-0-metric-contracts-and-acceptance.md` |

## 2. Acceptance rule

VOC-0 prihvata samo executable contract granice potrebne za prvi izolovani MVS metrics slice. Infrastructure invariants su zaključani. FIELD-sensitive vrijednosti su provisional i ne smiju se predstavljati kao konačna production-wide poslovna semantika.

Ovaj closure ne autorizuje produkcijsku implementaciju faza 1–6, pristup stvarnom SDJ/OneDrive workspace-u, UI, workflow engine, external network/API, commit ili push. Zaseban uzak nalog je potreban za executable metrics spike.

## 3. Contract acceptance matrix

| MVS blocker | Contract outcome | Status poslije VOC-0 |
|---|---|---|
| Matter active/non-active | non-terminal authoritative matter lifecycle as of `T`; `SUSPENDED`/`ON_HOLD`/`ARCHIVED` provisional | CLOSED PROVISIONALLY |
| `LEGAL_ACTION` open/actionable/completed | tri odvojena fail-closed resolvera; terminality i blockers iz structured authority-ja | CLOSED PROVISIONALLY |
| Action due-instant | explicit datetime ili date-only next-local-day boundary u authoritative timezone-u | CLOSED |
| Operational state/currentness/effective start | effective chronology, explicit supersession/correction, conflict -> unresolved | CLOSED PROVISIONALLY |
| Historical as-of/rebuild boundary | reconstruction samo iz authority inputs sa explicit `evaluatedAt`; projections disposable | CLOSED |

Rezultat: **5/5 MVS blockera imaju executable contract.**

## 4. Locked infrastructure acceptance

PASS ako contract i budući executable slice dokazuju:

- tri-state/fail-closed semantics;
- `UNKNOWN`/`UNRESOLVED` se nikada ne svodi na `FALSE` ili nulu;
- explicit `evaluatedAt` bez implicitnog `Date.now()`;
- effective time odvojeno od recorded/known/mtime vremena;
- canonical authority boundary;
- lifecycle/operational i open/completed/actionable separaciju;
- due-instant resolution bez host-timezone fallback-a;
- authority conflict ostaje `UNRESOLVED`;
- generated projections i disposable indeksi nijesu authority;
- isti authority frontier + isti `evaluatedAt` + ista contract verzija daje isti rezultat poslije rebuild-a.

FAIL ako implementacija koristi filename, UUID, lexical order, ingestion order, `mtime`, UI state ili host environment da izabere business winner-a ili popuni nedostajući authority podatak.

## 5. FIELD-0 acceptance debt

Sljedeće nije architecture blocker za isolated slice, ali ostaje obavezno prije konačnog production-wide domain prihvatanja:

| FIELD pitanje | Provisional assumption za isolated MVS | Closure condition |
|---|---|---|
| `SUSPENDED` / `ON_HOLD` | active portfolio = `TRUE` | potvrda na kontrolisanim SDJ primjerima |
| `ARCHIVED` | `FALSE` ako je authoritative lifecycle status | potvrda značenja i mjesta u lifecycle osi |
| blocker/waiting taxonomy | koristi samo eksplicitne structured state-ove iz malog provisional skupa | FIELD inventar stvarnih obrazaca rada |
| operational taxonomy | mali provisional skup iz VOC-0 contract-a | potvrđena minimalna taxonomy i značenje `NO_NEXT_ACTION` |
| timezone fallback | nema fallback-a | odluka da li postoji canonical office timezone input |

Dok ovo nije završeno, rezultat se označava kao provisional i ne koristi se za tvrdnju da su poslovne definicije konačno prihvaćene.

## 6. Deferred scope acceptance

VOC-0 eksplicitno ne zatvara niti odobrava:

- workflow engine;
- arbitrary dependency graph;
- automatic prerequisite ili operational-state inference;
- legal-deadline rules engine;
- bitemporal known-at-time analytics;
- prediction ili AI classification;
- universal status taxonomy.

Njihovo odsustvo nije failure prvog MVS vertical slice-a.

## 7. Corrective MVS-0 disposition

Prethodni MVS-0 `NO-GO` zaključak bio je zasnovan na pet eksplicitno identifikovanih authority/semantic gap-ova. VOC-0 ih sada zatvara contract-om, bez retroaktivnog pretvaranja VLA revision lifecycle statusa u matter business lifecycle.

Corrective rezultat je:

```text
M1 Active Matter Count                         EXECUTABLE IN ISOLATED MVS-0 — PROVISIONAL
M2 Open Action Item Count                      EXECUTABLE IN ISOLATED MVS-0 — PROVISIONAL
M3 Overdue Open Action Item Count              EXECUTABLE IN ISOLATED MVS-0
M4 Active Matters Without Open Actions         EXECUTABLE IN ISOLATED MVS-0 — PROVISIONAL
M5 Current Operational State Age               EXECUTABLE IN ISOLATED MVS-0 — PROVISIONAL
```

Minimum od tri povezane metrike je dostignut. Executable acceptance suite može biti predmet narednog, zasebno odobrenog izolovanog naloga.

## 8. Required future executable evidence

Budući isolated MVS-0 acceptance mora najmanje dokazati:

1. active/non-active as-of granice, uključujući close i reopen;
2. odvojene open/completed/actionable outcomes za sve terminal dispositions;
3. blockers, waiting state, earliest action time i deklarisani prerequisite fail-closed behavior;
4. full datetime i date-only due boundary, uključujući DST gdje je relevantan;
5. `NULL` naspram `UNRESOLVED` due outcome-a;
6. operational effective chronology, correction/supersession, tie i gap;
7. deletion/rebuild svih derived artefakata bez promjene authority-ja;
8. semantički identičan rezultat za isti frontier, `evaluatedAt` i contract version;
9. machine-readable unresolved reasons;
10. nula pristupa stvarnom SDJ/OneDrive workspace-u i nula external network poziva.

## 9. Final verdict

> **GO WITH PROVISIONAL CONTRACTS**

> **MVS-0 METRICS IMPLEMENTATION — UNBLOCKED for isolated executable vertical slice and FIELD validation. Not accepted as final production-wide domain semantics.**

Sljedeći dozvoljeni korak je veoma uzak executable metrics vertical slice u dozvoljenom testnom workspace-u i/ili izolovanom spike-u, tek po zasebnom preciznom nalogu naručioca. Širenje arhitekture ili produkcijski coupling ostaju zabranjeni.
