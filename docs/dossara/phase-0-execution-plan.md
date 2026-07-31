# DOSSARA — Phase 0 execution plan

## 1. Status dokumenta

- **Branch / HEAD:** `feature/v1.0.1-initial-documents` / `fe1cc0effea22185d808a45cb4bf459774920cdd`.
- **Formalni kontrolni akt:** `docs/dossara/decision-alignment-register-v1.2.md`.
- **Audit baseline commit:** `fe1cc0effea22185d808a45cb4bf459774920cdd`.
- Dokument ne odobrava implementaciju. Svaki work package zahtijeva zasebno odobrenje; spike se ne spaja automatski u produkcionu granu.

## 2. Cilj Faze 0

> `Audit repozitorijuma, desktop prototip, odluka o pakovanju.`

Faza 0 proizvodi odluku zasnovanu na dokazima, a ne produkcijsku DOSSARA implementaciju.

## 3. Pravila izvršenja

- Jedan mali work package po odobrenju, uz plan i tačan spisak dozvoljenih fajlova prije izmjene.
- Testira se samo na `C:\SDJ_TEST\SDJ_LEGAL_TEST\`; stvarni SDJ i OneDrive workspace su zabranjeni.
- Nema AI API-ja, automatskih mrežnih poziva ni izmjene Registra bez odluke naručioca.
- Nema commit-a/push-a bez odobrenja. Svaki spike ima stop condition i rollback/potpuno uklanjanje.
- Produkcijski kod se ne mijenja osim u izričito odobrenom izolovanom spike-u; rezultat spike-a nije usvojena arhitektura.
- Svaki spike završava statusom `GO`, `NO-GO`, `GO UZ USLOVE` ili `NEDOVOLJNO DOKAZA`. Status spike-a nije odluka o produkcijskoj implementaciji.

## 4. Work package 0B — Filesystem boundary audit

**Cilj:** završiti read/write/create/rename/move/delete/archive/open-process mapu svih `node:fs`, `node:fs/promises` i `node:child_process` pristupa te plan centralizacije bez refaktora.

**Ulazi i izlazi:** Registar, audit, matrica, relevantni source; evidence dokument, klasifikacija server granice i lista kandidata za budući adapter. Dozvoljeni su samo audit/dokumentacioni fajlovi posebno navedeni u odobrenju; zabranjeni su filesystem refaktor, workspace pristup i testovi koji ga otvaraju.

**Evidence / stop / review:** source import mapa i path-policy analiza; stop kod konflikta s I1/I6/I9/I11/I12; senior review je potreban prije bilo kakvog centralizacijskog refaktora.

## 5. Work package 0C — Desktop packaging spike

**Cilj:** testirati najviše dvije prethodno odobrene alternative, trenutno samo kandidati A i B iz architecture options dokumenta. Tačan spike scope, source fajlovi i dependencies moraju se posebno odobriti neposredno prije rada.

**Obavezni dokaz:** pakovana lokalna aplikacija; loopback-only i token/capability provjera kada postoji server; restart, double-launch, orphan process, clean shutdown, external link ponašanje, process inspection, network capture, uninstall i rollback paketa.

**Stop:** LAN exposure, neobjašnjiv outbound, token/capability curenje, orphan proces ili nedokaziv single-instance ishod. Spike se ne spaja u produkcionu granu bez posebne odluke.

## 6. Work package 0D — Single Writer i lease spike

**Cilj:** dokazati workspace lease sa owner/process identitetom, parametrima TTL/heartbeat, read-only fallbackom, stale detekcijom, eksplicitnim takeoverom i reconciliation-om.

**Obavezni scenariji:** double-launch, crash, sleep/wake, clock drift i file-sync/OneDrive kašnjenje u kontrolisanom modelu. TTL i heartbeat su parametri spike-a, ne unaprijed zaključane vrijednosti.

**Stop / review:** ako svježi lease ne daje read-only ili stale takeover može tiho dati write pravo; senior review je obavezan prije mutirajućih V2 tokova.

## 7. Work package 0E — Atomic write i optimistic concurrency spike

**Cilj:** dokazati I12 tok: expected hash, pre-write read, temp fajl u istom direktorijumu, flush/fsync, Windows-safe atomic replace, hash provjera, index update poslije fajla i startup cleanup.

**Obavezni scenariji:** backup prethodne verzije gdje je primjenjivo, crash simulacija, ručna izmjena između read/write, conflict rezultat i ponavljanje recovery-a. `rename` se ne smatra dovoljnim za sve Windows scenarije dok spike to ne dokaže.

**Stop / review:** original se može izgubiti, conflict se tiho prepisuje ili index može prethoditi autoritativnom fajlu; senior review obavezan.

## 8. Work package 0F — `.msg` / `.eml` spike

**Cilj:** lokalni parser nad sintetičkim fixture fajlovima, bez mreže i bez automatskog upisa u produkcijski workspace.

**Dokaz:** staging, attachment extraction, original preservation, Unicode, malformed poruke, duplikati, veličinski limiti i bez OCR-a. **Stop:** gubitak/izmjena originala, traversal ili nerazjašnjeno parsiranje. 

## 9. Work package 0G — `.docx` spike

**Cilj:** lokalno generisanje Word-ready rezultata nad sintetičkim podacima, bez Word add-in-a i mreže.

**Dokaz:** TemplatePair pitanje, otvaranje u Wordu, sadržaj/format i determinističnost; Markdown ili strukturisani izvor ostaje autoritativan. **Stop:** generator zahtijeva cloud/API ili zamjenjuje autoritativni izvor.

## 10. Work package 0H — Backup, recovery i migration architecture

**Cilj:** dizajnirati i dokazati Control Backup granicu prema originalnim dokumentima, manifest/checksum, retention, restore rehearsal, partial/corrupt backup i dokument-backup upozorenje.

**Migracija:** dry-run, journal, rollback, prekid procesa i ponovljivost. **Stop:** nema provjerljivog restore-a, migracija može tiho izgubiti podatke ili data-loss granice nisu jasne. Senior review obavezan.

## 11. Work package 0I — Zaključni Phase 0 report

Konsoliduje dokaze, otvorene odluke, preporučeni desktop/packaging model, alternative koje nisu preporučene i razloge, rizike, acceptance matricu, senior sign-off i odluku naručioca. Prelaz u Fazu 1 postoji samo poslije Gate E i Gate F.

## 12. Dependency mapa

| Zavisnost | Razlog |
|---|---|
| Architecture options → 0C | spike bira najviše dvije dokumentovane opcije |
| 0B → 0E | atomic-write dizajn treba potpunu filesystem mapu |
| 0C → konačna desktop odluka | packaging/lifecycle mora biti dokazan |
| 0D i 0E → mutirajući V2 tokovi | I11 i I12 štite autoritativne promjene |
| 0H → interni rollout | backup/recovery mora prethoditi realnoj upotrebi |
| 0F i 0G | mogu biti izolovani poslije odobrenja |
| svi obavezni dokazi → 0I | završni report ne može preteći dokaz |

## 13. Approval gates

| Gate | Ulazni dokazi | Odlučuje | Odobrava | Ostaje zabranjeno / stop |
|---|---|---|---|---|
| A | architecture options, tačan spike scope | naručilac | architecture spike | nema spike-a bez scope-a |
| B | lifecycle/threat-model dokaz | senior programer | desktop arhitekturu | nema konačnog packaging izbora bez review-a |
| C | lease i atomic-write dokazi | senior programer | I11/I12 pristup | nema mutirajućih V2 tokova |
| D | backup/recovery/migration dokaz | senior programer | data-loss granice | nema rollout-a |
| E | 0I report i acceptance matrix | naručilac | prihvatanje Faze 0 | Faza 1 ostaje zabranjena |
| F | Gate E + konkretan Phase 1 plan | naručilac | početak Faze 1 | scope se ne podrazumijeva |

## 14. Evidencija i Git pravila

`PREPORUKA — POTREBNA ODLUKA NARUČIOCA`: spike-ovi treba da koriste zasebne review grane; dokumentacioni rad može ostati na trenutnoj grani do posebne odluke. Nijedan spike commit se ne spaja automatski, svaki commit ima tačan scope, a push zahtijeva odluku. Fixtures ne smiju sadržati stvarne klijentske podatke. Stvarni workspace ne smije u Git. Budući lokalni config, lease, indeks i backup artefakti moraju biti isključeni iz repozitorijuma.

## 15. Exit criteria Faze 0

Obavezno prije Faze 1: završen 0B; najviše dvije testirane desktop alternative i odluka o modelu; restart/double-launch; loopback/token ako postoji server; Single Writer; atomic-write/conflict/recovery; zero-outbound; izvršen posebno odobren kontrolisani test OneDrive placeholder ponašanja na dozvoljenom testnom modelu, ili dokumentovana blokada i odluka naručioca ako se bez pristupa stvarnom OneDrive okruženju ne može dobiti pouzdan dokaz; završen i dokumentovan `.msg`/`.eml` tehnički spike; završen i dokumentovan `.docx` tehnički spike; za svaki spike evidentiran rezultat `GO`, `NO-GO` ili `GO UZ USLOVE` i dokumentovana preporuka za kasniju produkcijsku fazu; backup/restore; migration dry-run/rollback; dokumentovani rizici; senior review; formalno prihvatanje naručioca.

Produkcijska implementacija `.msg`/`.eml` i `.docx` tokova nije exit criterion Faze 0; Faza 0 zahtijeva dokaz, zaključak i odluku.

Odlaganje bilo koje od ovih stavki zahtijeva izričitu odluku naručioca i izmjenu odobrenog plana; ne smije se pretpostaviti.

## 16. Otvorene odluke

- Najviše dvije desktop opcije za spike i konačni packaging model.
- I4/I5 tumačenje eksternih linkova.
- Loopback/token model, stable-ID model i SQLite lokacija/format.
- Backup retention, recovery politika i lease TTL/heartbeat parametri.
- Grane za spike-ove, V2 specifikacija/Aneks A poslije §5 i kriterijumi senior review-a.

Ovaj dokument ne rješava nijednu od navedenih odluka bez dokaza.
