# DOSSARA — Phase 0B filesystem boundary audit

## 1. Status dokumenta

- **Datum / branch / baseline:** 1. avgust 2026; `feature/v1.0.1-initial-documents`; prvobitni 0B source-review baseline je `d0f7aacaae5f8588971091584a2130e8c98b1592`, a završni revalidirani repository HEAD pri zaključenju 0B je `75d4092f8bc7bdd765a9b874df3e3c6137f35dd5`.
- **Kontrolni akt:** `docs/dossara/decision-alignment-register-v1.2.md`.
- **Evidence:** svi prethodni Phase 0 dokumenti, naročito audit, matrica, architecture options i execution plan.
- Ovo je read-only, source-based audit. Nije pristupljeno workspace-u; aplikacija i testovi nisu pokretani. Ne odobrava refaktor. “0B” je interna radna oznaka u Fazi 0.

## 2. Cilj i obuhvat

Audit obuhvata potvrđene produkcijske importe `node:fs`, `node:fs/promises` i `node:child_process`; path helper module; client/server granicu; API i UI tokove koji iniciraju operaciju. Ne obuhvata izvršavanje, runtime trace, OneDrive ponašanje, symlink race, crash/performance testove ni refaktor.

## 3. Metodologija

Pregledani su direktni importi, transitive calls, API rute, client `fetch` inicijatori, ulazni podaci, path validacije, mutacije/rollback i browser odgovori. Nalazi se porede sa I1, I3, I6, I9, I10, I11 i I12. Statički pregled nije runtime dokaz.

## 4. Trenutna filesystem arhitektura i tokovi

```text
Client UI → /api Route Handler → server/domain helper → Node filesystem → kontrolisani JSON odgovor
Server Component → domain helper → Node filesystem → server-rendered prikaz
open-folder Route Handler → potvrđen target → explorer.exe
```

| Tok | Inicijator → ruta → helper | Operacija i rezultat | Cleanup / granica |
|---|---|---|---|
| Verify workspace | Settings → `/api/settings/verify-structure` → `sdj-workspace` | stat/mkdir roota i obaveznih foldera; config write | nema atomic replace configa |
| Create client | Matters UI → `/api/clients` | clients root readdir; mkdir validiranog childa | collision je kontrolisana greška |
| Create matter | Matters UI → `/api/matters` → `matter-create` | staging mkdir, podfolderi, CONTROL `wx`, final rename | best-effort staging cleanup; nema I11/I12 protokola |
| Initial docs | multipart matter → storage helper | staging intake mkdir i `wx` document write | intake cleanup pri grešci |
| Prompt save | Prompt UI → `/api/prompts/save` → `sdj-prompts` | prompt `wx`, `ai-work-log.md` append | unlink prompta ako append ne uspije; append nije transakcija |
| Lists/dashboard | client fetch ili Today server component | readdir/stat/readFile | read-only, bez runtime race dokaza |
| Open folder | Matter UI → `/api/matters/open-folder` | realpath/stat; `spawn("explorer.exe", [path])` | no-shell spawn; packaged behavior nepotvrđen |
| Archive/delete | Matters UI → `/api/matters/delete` | archive child mkdir, matter rename | istorijski V1 archive tok, gap prema I9 |

## 5. Import mapa

Potvrđeno je **11** produkcijskih fajlova sa direktnim fs/child-process importom: `src/lib/sdj-workspace.ts`, `sdj-matters.ts`, `sdj-prompts.ts`, `sdj-dashboard.ts`, `sdj-initial-document-storage.ts`, `src/app/api/settings/verify-structure/route.ts`, `clients/route.ts`, `matters/route.ts`, `matters/matter-create.ts`, `matters/delete/route.ts` i `matters/open-folder/route.ts`. Prethodna sadržinski pregledana verzija registra imala je 23 grupisana operation ID-ja O01–O23. Corrective pass ih je razložio na 43 granularne operacije.

`src/lib/sdj-workspace.ts` je ponovo pregledan na završnom HEAD-u poslije commit-a `f01a8cba5689cd33abcf4b438d145293e0aef2f6` (`feat: add multilingual UI infrastructure`). Promjena je dodala samo opcioni `uiLocale` i `isAppLocale` validaciju sadržaja configa. Tri postojeće filesystem operacije — config read, config directory creation i direct config overwrite — ostale su iste; nisu promijenjeni `node:fs/promises` importi, `.sdj-mike/settings.json`, `process.cwd()`, allowed-root provjera, niti Single Writer, expected-hash, backup i atomicity nalazi. Ovo nije tvrdnja da u cijelom repozitorijumu nije bilo drugih promjena između baseline-a i završnog HEAD-a.

Svi su u server/helper ili `runtime = "nodejs"` tokovima; client komponente ne importuju Node API-je. Client indirektno inicira mutations kroz relativni `fetch("/api/…")`; Today server component indirektno poziva dashboard. To nije desktop security dokaz.

## 6. Klasifikacija operacija

Korišćene kategorije su `READ`, `STAT`, `RESOLVE`, `VALIDATE`, `CREATE_DIRECTORY`, `CREATE_FILE`, `CREATE_ONLY_WRITE`, `OVERWRITE_WRITE`, `APPEND`, `RENAME`, `MOVE`, `ARCHIVE`, `ROLLBACK_CLEANUP`, `OPEN_EXTERNAL_PROCESS`, `CONFIG_READ` i `CONFIG_WRITE`. `DELETE` nije potvrđena kao business delete operacija; `rm` se koristi za staging/intake cleanup.

## 7. Path trust boundaries

| Izvor | Trust / zaštita | Granica |
|---|---|---|
| Hard-coded konvencije i server-derived child path | `TRUSTED_CONSTANT` / `SERVER_DERIVED`; `path.win32.join`, direct-child | nije opšta TOCTOU garancija |
| Root iz local configa | `LOCAL_CONFIG`; normalizacija i allowed-root poređenje | apsolutni root, `process.cwd()` config |
| Client segmenti, route params, form input | `UNTRUSTED_USER_INPUT` → validated | segment/absolute/traversal provjere; mutation tokovi koriste lstat/realpath |
| Upload metadata | `UNTRUSTED_USER_INPUT` → validated | safe filename, veličina, extension, direct-child, `wx` |
| Existing entries | `FILESYSTEM_DERIVED` | stat/lstat/realpath gdje je pozvano; ne u svakom read toku |
| Prompt/archive/open target | `MIXED` | server-derived nakon validated IDs; realpath/stat u relevantnim tokovima |

Browser uglavnom dobija identifikatore, ne apsolutne putanje. Settings root je namjerni V1 izuzetak. Statički audit ne isključuje TOCTOU/symlink race između provjere i mutacije.

## 8. Mutation safety analiza

Matter creation ima najsnažniju potvrđenu zaštitu: safe client resolution, UUID staging, folderi, `wx` CONTROL write, final rename i best-effort cleanup. Initial document storage dodatno provjerava staging/ULAZ i čisti intake pri grešci. Prompt save rezerviše fajl `wx`, ali čita pa appenduje log bez expected hasha, locka ili atomic replace-a. Config write je direktni overwrite. Client `mkdir` oslanja se na filesystem collision. Archive priprema safe child chain i radi rename, ali ne ispunjava budući I9 ignored semantički model. Nema potvrđenog Single Writer, expected-hash, backup-before-mutate niti crash recovery protokola.

## 9. Browser-facing boundary

`settings-form.tsx`, `matters-workspace.tsx`, `prompt-generator.tsx` i `matter-folder-actions.tsx` iniciraju API pozive. Browser šalje root, client/matter identifikatore, form/multipart podatke i open target; vraćaju se statusi, sigurni nazivi i relativno ime prompta. Client ne importuje `node:fs`. Relativni fetch sam po sebi ne rješava desktop loopback/token, renderer ili local API sigurnost.

## 10. External process boundary

`src/app/api/matters/open-folder/route.ts` koristi `node:child_process.spawn("explorer.exe", [selectedPath], { detached: true, stdio: "ignore" })`; ne koristi shell. Target se dobija iz resolved mattera i za subfolder ponovo provjerava `realpath`, `stat` i direct-child. Greške se mapiraju na generički odgovor. Nema potvrđenog logginga, packaged lifecycle-a ili runtime dokaza da nema arbitrary path/process otvaranja.

## 11. Gapovi prema Registru

| Zahtjev | Trenutni dokaz | Klasifikacija | Gap / rizik | Budući dokaz | Senior / naručilac |
|---|---|---|---|---|---|
| I1 file-first | CONTROL i folderi su V1 podaci | USKLAĐENO | budući indeks nije projektovan | model i rebuild test | Da / Da |
| I3 file-before-index | staging prvo fajl; indeks ne postoji | DJELIMIČNO USKLAĐENO | nema opšti file/index tok | 0E/1 test | Da / Ne |
| I6 relative paths | absolute config root; izvedene putanje skrivene | DJELIMIČNO USKLAĐENO | V2 relative/external model | fixture move/relink | Da / Da |
| I9 ignored/remove | archive rename | NEUSKLAĐENO | originalni folder se mijenja | migration design | Da / Da |
| I10 bez aplikacije | Markdown CONTROL | DJELIMIČNO USKLAĐENO | export/backup nedostaje | restore rehearsal | Da / Da |
| I11 Single Writer | nema lease/lock | NEUSKLAĐENO | dual writer/stale lease | 0D | Da / Da |
| I12 hash/atomic write | staging samo za dio tokova | DJELIMIČNO USKLAĐENO | config/log/manual edits | 0E | Da / Da |
| Backup/recovery | nema sloja | NEUSKLAĐENO | data loss/recovery | 0H | Da / Da |
| Stable IDs / fingerprint | nema V2 modela | NEUSKLAĐENO | rename/relink | Phase 1 model | Da / Da |
| Desktop config lokacija | `.sdj-mike` ispod cwd | DJELIMIČNO USKLAĐENO | packaged writeability | 0C | Da / Da |
| Central adapter / authorization / audit log | path pravila djelimično ponovljena | DJELIMIČNO USKLAĐENO | inconsistent mutation policy | 0B/0E design | Da / Ne |
| Startup recovery | nema protokola | NEUSKLAĐENO | stale temp/staging/lease | 0D/0E/0H | Da / Da |

## 12. Centralization candidates

| Kandidat | Dupliranje / odgovornost | Invarijante / budući korisnici | Faza |
|---|---|---|---|
| Workspace root resolver | config/path normalizacija | I1, I6; workspace/matters/dashboard | 0E/1 |
| Safe path join/direct-child guard | više lokalnih verzija | I6; matters, prompts, storage | 1 |
| Directory/file reader | readdir/stat/readFile obrasci | I1/I10; dashboard/routes | 1 |
| Create-only writer / directory creator | `wx`/mkdir obrasci | I3/I12 | 1 |
| Atomic writer / append-log writer | direct config write i append | I12; ne spajati update i append semantiku | 0E/1 |
| Move/archive / cleanup primitive | rename/rm | I9/I12 | 1 |
| External process opener | `explorer.exe` | authorization/capability | 0C/1 |
| Lease, backup, index coordinator | ne postoje | I1–I3/I11/§3 | 0D/0H/1 |

Ovo nisu odobreni moduli. Jedan “god object” filesystem adapter bi zamaglio capability granice i spojio read, write, archive i process privilegije.

## 13. Preporučena capability podjela

Preporuka, ne implementacija: `WorkspaceConfigRead`, `WorkspaceConfigWrite`, `WorkspaceRead`, `SafeDirectoryCreate`, `CreateOnlyFileWrite`, `ControlledFileUpdate`, `AppendAuditLog`, `MatterCreateTransaction`, `ControlledArchiveMove`, `Cleanup`, `ExternalFolderOpen`, `Backup`, `Lease` i `IndexUpdate`. Osjetljive operacije ne smiju dijeliti generički `execute(path, operation)` interfejs jer bi caller dobio šire pravo od potrebnog.

## 14. Rizici i prioriteti

- **P0:** Single Writer; expected hash/atomic replace; startup recovery — blokiraju mutirajuće V2 tokove.
- **P1:** backup, archive/delete semantika, desktop config lokacija, open-folder packaged granica — prije internog rollout-a.
- **P2:** stable IDs, relative paths, centralizacija, dashboard read-only operacije — poslije osnovne zaštitne arhitekture, uz dependency na Phase 1.
- **POTREBNA ODLUKA:** I4/I5 external link tumačenje i budući desktop capability model.

## 15. Zaključak i gate

Statički pregled potvrđuje server-side filesystem, značajne path/staging kontrole i 11 direktnih import fajlova. Ne dokazuje runtime race ponašanje, crash safety, OneDrive, desktop lifecycle ni Single Writer. Audit ne odobrava refaktor. Prije 0E i mutirajućih V2 tokova potreban je senior pregled 0B nalaza i posebno odobren sljedeći korak.
