# DOSSARA — Phase 0 read-only audit

## 1. Status dokumenta

- **Vrsta:** evidence-based read-only audit zatečenog repozitorijuma.
- **Datum audita:** 31. jul 2026.
- **Branch:** `feature/v1.0.1-initial-documents`.
- **Audited HEAD:** `b5bcb19bbbb966a8c80b8e19bbd9347b1272d222` (`docs: establish DOSSARA decision baseline`).
- **Formalni kontrolni akt:** `docs/dossara/decision-alignment-register-v1.2.md`.
- **Radna oznaka:** “Phase 0A” je interni dokumentacioni alignment checkpoint; ne mijenja Registar niti uvodi novu formalnu fazu ili acceptance kriterijum.
- **Granice audita:** aplikacija i testovi nisu pokretani; nije otvoren ni izmijenjen nijedan testni, stvarni SDJ, OneDrive ili produkcijski workspace; nije izvršen network capture, packaging, restart, double-launch ni crash/recovery test.

## 2. Izvršni zaključak

SDJ MIKE V1 ima upotrebljiv lokalni, file-first temelj: Markdown CONTROL fajlovi i matter folderi su radni podaci, filesystem kod je na Node server strani, a kritični mutation tokovi imaju path-segment, traversal, `realpath`/`lstat` i staging zaštite. Matter kreiranje već koristi staging folder i završni `rename`.

To nije isto što i DOSSARA Track A model. Registar zahtijeva desktop lifecycle, Single Writer lease, zaštitu ručnih izmjena preko expected hasha, Windows-odgovarajući atomic replace, odbacivi lokalni indeks, stabilne identifikatore, backup/recovery, relativne putanje i kontrolisan dokaz nula odlaznih internet konekcija. Ti kapaciteti nisu potvrđeni u V1 kodu, a većina još nije implementirana.

Blokirajući Phase 0 gapovi su: izbor desktop modela, Single Writer i stale lease recovery, atomic write/recovery, backup/restore, migracioni model, `.msg`/`.eml`, `.docx`, OneDrive placeholder ponašanje i zero-outbound verifikacija. Produkcijska implementacija faza 1–6 zato ne smije početi prije prihvatanja Phase 0 nalaza, konkretnog plana i obaveznih approval gate-ova iz Registra §6.4 i §12.

## 3. Autoritativni izvori i hijerarhija

| Rang / uloga | Izvor | Upotreba u ovom auditu |
|---|---|---|
| 1 | `docs/dossara/decision-alignment-register-v1.2.md`, naročito §1, I1–I12, §3, §4, §6, §8, §12 i §14 | Formalni kontrolni akt i mjerilo usklađenosti. |
| Dokaz V1 stanja | `docs/architecture-v1.md` | Dokumentuje prihvaćeni Simple Core V1, runtime, API rute, testni root, granice i poznata ograničenja. |
| Raniji radni materijal | `docs/master-pack-v2/04_FILE_DATA_MODEL.md`, `13_SECURITY_PRIVACY_AI_GOVERNANCE.md`, `14_ROADMAP_ACCEPTANCE.md` | Koristi se samo kao istorijski kontekst; nije iznad Registra. |
| Dokaz implementacije | `src/lib/*`, `src/app/api/*`, client/server komponente i `package.json` | Potvrđuje stvarno prisutan kod, a ne buduće ponašanje. |

Registar §1 izričito daje prednost zaključanim invarijantama nad kodom i dokumentacijom. Zatečeni kod zato nije dokaz promjene zahtjeva.

## 4. Inventar repozitorijuma

### Git, runtime i paketi

| Stavka | Potvrđeno stanje |
|---|---|
| Branch / HEAD | `feature/v1.0.1-initial-documents` / `b5bcb19bbbb966a8c80b8e19bbd9347b1272d222` |
| Tagovi | `v1.0.0`, `step-1b-complete`, `step-1c-complete` |
| Node / npm | `v24.13.0` / `11.6.2` |
| Next / React / TypeScript | `16.2.11` / `19.2.4` / `5.9.3` |
| Skripte | `dev`, `build`, `start`, `lint`, `test` |
| Produkcijske dependencies | `next`, `react`, `react-dom` |
| Test framework | Vitest `4.1.10`; pet `*.test.ts` fajlova |

Nema potvrđenih produkcijskih dependencies za Electron, Tauri, SQLite, cloud storage, AI API, OCR, `.msg`/`.eml` parser ili `.docx` generisanje.

### Ključni moduli i rute

| Oblast | Potvrđeni moduli / rute |
|---|---|
| Workspace config | `src/lib/sdj-workspace.ts` |
| Folder konvencije | `src/lib/sdj-files.ts` |
| Matter razrješenje i CONTROL parsing | `src/lib/sdj-matters.ts` |
| Matter staging | `src/app/api/matters/matter-create.ts` i `route.ts` |
| Initial documents | `src/lib/sdj-initial-documents.ts`, `sdj-initial-document-storage.ts`, `sdj-initial-document-register.ts` |
| Prompt rad | `src/lib/sdj-prompts.ts`, `/api/prompts/generate`, `/api/prompts/save` |
| Dashboard | `src/lib/sdj-dashboard.ts`, `src/app/page.tsx` |
| API | clients, settings verification, matters, open-folder, delete, prompt generate/save |

### Placeholderi i nepostojeće DOSSARA komponente

- Inbox je V1 UI placeholder (`src/app/inbox/page.tsx`).
- Nema desktop omotača, local server lifecycle-a, installer-a ni restart/double-launch kontrole.
- Nema Single Writer lease-a, TTL-a, heartbeata ili stale takeover reconciliation-a.
- Nema SQLite indeksa, stable-ID modela, migration dry-run-a, backup/restore-a ni ExternalFolderFingerprint-a.
- Nema `.msg`/`.eml` parsera, `.docx` generatora, OCR-a ni AIExecutionProvider granice.

## 5. Filesystem mapa

Svi navedeni produkcijski moduli rade u Node server kontekstu ili su importovani samo iz Node route/server component tokova. To nije dokaz complete desktop sigurnosti.

| Fajl | Operacija | Server-only | Postojeća zaštita | Gap prema Registru / kandidat za centralizaciju |
|---|---|---:|---|---|
| `src/lib/sdj-workspace.ts` | config read/create/write | Da | dozvoljeni root poredi se normalizovanom Windows putanjom | `process.cwd()` config; nema atomic replace ni desktop user-data modela |
| `src/lib/sdj-matters.ts` | read, create archive podfoldera, stat/lstat/realpath | Da | validni segmenti, direct-child, non-link direktorijumi | više lokalnih path pravila; nema lease/hash kontrole |
| `src/lib/sdj-prompts.ts` | read, create-only write, append, unlink rollback | Da | direct-child, realpath/stat, `wx` za prompt fajl | append loga nije expected-hash/atomic-replace transakcija |
| `src/lib/sdj-dashboard.ts` | `readdir`, `stat` | Da | filtrira symlink direktorijume pri listanju | nema indeks/cache/reconciliation model |
| `src/lib/sdj-initial-document-storage.ts` | staging create/write/cleanup | Da | lstat/realpath, direct child, `wx`, dependency injection | cleanup i write nisu opšti DOSSARA atomic-write primitive |
| `src/app/api/settings/verify-structure/route.ts` | root/folder create, stat | Da | validacija preko workspace servisa | V1 struktura, bez V2 workspace manifest/lease |
| `src/app/api/clients/route.ts` | list/create client foldera | Da | path-attempt provjera, sanitizacija | nema stable ID ni concurrency protokol |
| `src/app/api/matters/route.ts` | list/read/create delegacija | Da | input i path provjere | nema V2 model / index update |
| `src/app/api/matters/matter-create.ts` | staging create, CONTROL write, rename, cleanup | Da | UUID staging, `wx`, collision handling, završni rename | nema fsync, expected hash, index transaction, lease |
| `src/app/api/matters/delete/route.ts` | archive move preko rename | Da | safe source/destination chain | istorijski V1 tok je gap prema I9; ne mijenja se ovim korakom |
| `src/app/api/matters/open-folder/route.ts` | stat/realpath; otvara `explorer.exe` | Da | potvrđen matter/subfolder target | desktop lifecycle/process policy nije testirana |

## 6. Postojeće sigurnosne kontrole i granice

| Kontrola | Dokaz | Šta ne rješava |
|---|---|---|
| Validacija segmenata i traversal zaštita | `sdj-files.ts`, `sdj-matters.ts`, clients/matters rute | Nije workspace lease, stable ID ni manual-edit conflict kontrola. |
| Windows zabranjeni znakovi i device imena | `sdj-matters.ts`, initial-document validation | Ne pokriva V2 relativne putanje i external folder model. |
| `lstat` / `realpath` | `sdj-matters.ts`, storage, open-folder | Ne garantuje sigurnost nakon provjere niti cross-device write ekskluzivnost. |
| Symlink/junction odbacivanje | mutation tokovi u `sdj-matters.ts` i storage | Nije testirano na ciljnom OneDrive/workspace okruženju u ovom auditu. |
| Staging + rename | `matter-create.ts` | Ne daje fsync/atomic replace za ručno izmjenjive postojeće fajlove. |
| Create-only `wx` | matter CONTROL i initial documents; prompt file reservation | Ne serijalizuje append u `ai-work-log.md` ni više writer-a. |
| Browser-facing putanje | route odgovori izlažu identifikatore, ne izvedene putanje | Settings prima/prikazuje root koji korisnik unosi; desktop IPC/token granica ne postoji. |
| Node runtime | sve filesystem API rute izvoze `runtime = "nodejs"` | Ne rješava installer, loopback bind ili child process lifecycle. |
| Bez AI/cloud dependency | `package.json`; V1 architecture | Ne dokazuje nula izlaznih konekcija; UI ima user-click eksterne linkove. |

## 7. Potvrđeni gapovi

| Gap | Dokaz trenutnog stanja | Zahtjev Registra | Rizik / razmatranje | Gate |
|---|---|---|---|---|
| Desktop lifecycle i packaging | samo Next `dev/build/start` skripte | §4.2, §8A, §14 | bez instalirane desktop aplikacije nema pouzdan restart/lifecycle modela | 0C, senior review |
| Single Writer, TTL i stale recovery | nema lease modula | I11 | paralelni/autonomni writer-i i nejasan takeover | 0D, senior + naručilac |
| Optimistic concurrency i expected hash | nema spremljenog očekivanog hasha | I12 | ručna izmjena može biti prepisana bez konflikta | 0E, senior review |
| Temp + fsync + atomic replace | staging/rename postoji samo za matter create | I12 | djelimičan update config/log/CONTROL fajla | 0E, senior review |
| Backup i restore | nema modula ili skripte | §3, I10 | nema dokaznog Control Backup-a ni restore rehearsal-a | 0H, senior + naručilac |
| Odbacivi SQLite indeks | nema SQLite dependency ni indeks | I1–I3 | funkcionalno još ne blokira V1, ali V2 model nije projektovan | 1, odluka naručioca |
| Stable ID i relative paths | folder naziv je primarni V1 identifikator; config koristi apsolutan root | I6, I9, §8A | preimenovanje/move i ignored model nisu stabilni | 1, odluka naručioca |
| ExternalFolderFingerprint | nema implementacije | I6, §4.4 | nepoznato ponašanje spoljne/OneDrive lokacije | 0B/2, senior review |
| `.msg` / `.eml` | nema parsera | §4.2, §8A | Golden Path prijem nije moguć | 0F |
| `.docx` | nema generatora | §8A, §14 | Word par nije dokazan | 0G |
| Tri oznake pouzdanosti | nema provenance modela | I8 | sistem ne može razlikovati izvor/predlog/odluku | 2–5 |
| I9 ignored model | delete route preimenuje matter u arhivu | I9 | V1 ponašanje nije budući DOSSARA remove model | 1, odluka naručioca |
| Izlazne konekcije | user-click linkovi za ChatGPT/Claude postoje | I4, I5 | tumačenje za desktop proizvod je otvoreno | desktop architecture review |
| Crash recovery | nema startup reconciliation/recovery protokola | I11, I12, §3 | stale staging/temp/lease stanje | 0D/0E/0H |

## 8. Rizici zatečenog V1 koda

- **Data-loss rizik — potvrđen nedostatak kontrole:** postojeći config write i prompt log append nemaju opšti expected-hash + atomic-replace protokol. Audit nije utvrdio konkretan incident gubitka podataka.
- **Concurrency — potvrđen nedostatak kontrole:** nema workspace lease-a, procesa-locka ni serijalizacije svih writer-a.
- **Recovery — budući rizik:** nema formalnog stale lease, temp-file ili backup restore protokola jer te funkcije još ne postoje.
- **Filesystem — potvrđen ograničeni rizik:** path sigurnost je snažnija u mutation tokovima nego u arhitekturi kao cjelini; pristupi su raspoređeni kroz više modula.
- **Desktop lifecycle — budući rizik:** `explorer.exe` spawn i `process.cwd()` config nisu provjereni iz pakovane aplikacije.
- **Mrežni izlaz — otvorena odluka:** eksplicitni user-click eksterni linkovi nisu API integracija niti prenos podataka, ali njihovo tumačenje pod I4/I5 ostaje otvoreno.
- **Kompatibilnost — nepotvrđeno:** OneDrive placeholderi, dugačke Unicode putanje, restart i double-launch nisu testirani.
- **Migracija — potvrđen nedostatak funkcionalnosti:** nema V2 schema/version, dry-run, journal ili rollback modela.
- **File-first održavanje — budući rizik:** budući indeks mora ostati odbaciv i ne smije postati jedini izvor autoritativnih podataka.

## 9. Granice ovog audita

Nijedna od sljedećih stavki nije predstavljena kao uspješno testirana: pokretanje aplikacije, unit/integration testovi, otvaranje workspace-a, OneDrive placeholderi, desktop packaging, network capture, restart/double-launch, crash/recovery, backup/restore, `.msg`/`.eml` ili `.docx` tok.

## 10. Zaključak i gate za nastavak

Dokazano je da V1 ima lokalni file-first rad, Node server-only filesystem pristup i značajne path/staging zaštite. Nisu dokazani desktop model, Single Writer, I12 write protokol, backup/recovery, migracija, indeks, V2 identiteti ni mrežni invariant.

Produkcijsku Fazu 1 blokiraju otvoreni Phase 0 dokazi i odluke: desktop arhitektura, I4/I5 tumačenje za user-initiated linkove, lease model, atomic-write/recovery i backup plan. Preporučeni sljedeći dokumentacioni korak je arhitektonska matrica alternativa i izvršni plan, ali se ne započinje bez posebnog odobrenja. Odluke iz ovog audita ne mijenjaju Registar, V1 archive/delete niti postojeće ChatGPT/Claude linkove.
