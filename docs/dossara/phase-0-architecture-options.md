# DOSSARA — Phase 0 architecture options

## 1. Status dokumenta

- **Datum:** 1. avgust 2026.
- **Branch / audited HEAD:** `feature/v1.0.1-initial-documents` / `fe1cc0effea22185d808a45cb4bf459774920cdd`.
- **Formalni kontrolni akt:** `docs/dossara/decision-alignment-register-v1.2.md`.
- **Evidence baseline:** `phase-0-read-only-audit.md` i `phase-0-alignment-matrix.md`.
- Ovaj dokument ne bira konačnu arhitekturu, ne odobrava tehnički spike i ne mijenja Registar.
- Aplikacija, testovi i workspace-i nisu pokretani ili otvarani za ovaj dokumentacioni korak.

## 2. Obavezni arhitektonski zahtjevi

| Zahtjev | Izvor | Značenje za alternativu |
|---|---|---|
| Windows desktop bez `npm run dev` | Registar §4.2, §8A | Pakovana lokalna aplikacija mora se pokretati poslije restarta. |
| File-first autoritativni workspace | I1, I3, I10 | Fajl se piše prije odbacivog indeksa; rad bez aplikacije ostaje moguć. |
| Privilegovana filesystem granica | audit §5–6; AGENTS | Node filesystem ili ekvivalent ne smije biti dostupan rendereru/browseru. |
| Nula automatskih outbound konekcija | I4, I5 | Nema AI API-ja, cloud storage-a ni automatskog prenosa dokumenata. |
| Single Writer i stale recovery | I11 | Potreban lease, TTL, heartbeat, read-only fallback, eksplicitni takeover i reconciliation. |
| Relative paths, stable IDs i odbaciv indeks | I1, I2, I6, I9 | Budući model ne smije vezati identitet za apsolutnu putanju. |
| Controlled process/folder opening | audit §5–6 | `explorer.exe` i drugi procesi moraju dobiti samo potvrđene ciljeve. |
| Restart, double-launch, update i rollback | §4.2, §8A | Nema orphan procesa, drugog lokalnog writer-a ni nebezbjednog update-a. |
| Backup/recovery i OneDrive placeholder ponašanje | §3, §4.4, §8A | Model mora podržati dokazive recovery i kontrolisane fixture testove. |
| `.msg`, `.eml` i `.docx` | §4.2, §8A, §14 | Lokalni tokovi bez mreže, OCR-a i Word add-in-a. |
| Mali tim / minimalna složenost | §6.1–6.4 | Izbor mora ostati održiv uz senior review kritičnih tačaka. |

Ocjene u tabelama su kvalitativne procjene na osnovu zatečenog Next.js V1 koda i poznatih granica alternativa; nisu empirijski rezultat spike-a.

## 3. Alternative

### Opcija A — Electron + ugrađeni Next/Node server

Electron main proces upravlja `BrowserWindow` rendererom i zapakovanim Next/Node serverom. Server se veže samo na `127.0.0.1`, bira dinamički slobodan port, a browser-server ugovor dobija capability token. Main proces upravlja server lifecycle-om, Electron single-instance lockom, controlled shutdown-om i installerom. Najviše čuva postojeće App Router, Route Handler i Node filesystem tokove; zahtijeva dokaz da loopback/token, child-process shutdown i packaged config rade bez LAN exposure-a.

### Opcija B — Electron bez HTTP servera, sa IPC granicom

Electron main/preload/renderer model drži filesystem operacije iza strogo ograničenog IPC API-ja, uz context isolation i bez direktnog Node pristupa rendereru. Ovo najčistije odvaja privilegije, ali postojeće `/api` rute i server components zahtijevaju značajnu migraciju u IPC komande ili novi lokalni domain sloj. To povećava refaktor, testnu površinu i rizik rewrita prije dokaza o vrijednosti.

### Opcija C — Tauri desktop shell

Tauri daje Rust backend i IPC/command granicu sa manjim tipičnim installerom. Postojeći React prikaz može djelimično ostati, ali postojeći Node filesystem i Next Route Handler kod ne može ostati neizmijenjen: potrebno je Rust ili sidecar rješenje. To uvodi dodatni jezik/runtime, posebna Windows filesystem, `.msg`/`.eml`, `.docx` i buduća SQLite pitanja. Nije odbijena opcija, ali nije mali nastavak postojećeg V1.

### Opcija D — Lokalni Windows servis ili background proces + browser UI

Lokalni servis/tray proces izlaže loopback API sistemskom browseru. Može zadržati Node rute, ali povećava lokalnu server površinu, zahtijeva klijentsku autentikaciju i servisni lifecycle, a UI ostaje manje jasna desktop aplikacija. Service privilegije ne smiju proširiti filesystem prava; update/orphan behavior treba dokazati.

### Opcija E — Pakovani Next/Node proces sa minimalnim desktop launcherom

Pakovani launcher/tray proces pokreće Next/Node server, kontroliše single instance i otvara sistemski browser ili minimalni webview. Zadržava V1 API rute uz malo migracije, ali ima slabiju integraciju desktop prozora, teži UX/lifecycle i sličan loopback/token rizik kao Opcija A. Ako koristi sistemski browser, postoji dodatna neizvjesnost oko browser profila, external navigation i izolacije.

## 4. Matrica poređenja

Ocjene su preliminarne kvalitativne procjene zasnovane na zatečenom V1 kodu i dokumentovanim karakteristikama arhitektonskih modela. Nijesu empirijski rezultat packaging, security ili performance spike-a. Konačne ocjene mogu se promijeniti poslije 0C spike-a i senior review-a. Veličina instalera, stvarni refaktor, relativna sigurnost IPC-a/Tauri komandi/loopbacka, maintenance trošak i stvarna kompatibilnost sa `.msg`, `.eml`, `.docx`, SQLite ili OneDrive ponašanjem nisu dokazani ovim dokumentom.

`DOBRO`, `DJELIMIČNO` i `SLABO` označavaju preliminarnu arhitektonsku pogodnost. Negativni tereti koriste `NISKO`, `SREDNJE`, `VISOKO` ili `VRLO VISOKO`. Gdje nema dovoljno dokaza koristi se `NEPOZNATO — POTREBAN SPIKE`.

| Kriterijum | A Electron + Next server | B Electron + IPC | C Tauri | D servis + browser | E launcher + Next | Napomena |
|---|---|---|---|---|---|---|
| 1. Usklađenost sa postojećim Next.js V1 kodom | DOBRO | SLABO | SLABO | DOBRO | DOBRO | A, D i E čuvaju Route Handlere; B/C ih mijenjaju. |
| 2. Količina potrebnog refaktora | SREDNJE | VISOKO | VISOKO | SREDNJE | SREDNJE | Stvarni obim nije izmjeren. |
| 3. Node filesystem kompatibilnost | DOBRO | DOBRO | NEPOZNATO — POTREBAN SPIKE | DOBRO | DOBRO | Tauri traži Rust ili sidecar granicu. |
| 4. Server-only / privilegovana filesystem granica | DJELIMIČNO | DOBRO | DOBRO | DJELIMIČNO | DJELIMIČNO | Granica mora biti hardenovana u svakom modelu. |
| 5. Potreba za loopback serverom | DOBRO | SLABO | SLABO | DOBRO | DOBRO | Dobro znači prirodna podrška kada je server izabran; B/C ga ne koriste. |
| 6. Potreba za tokenom / lokalnom autentikacijom | DOBRO | DJELIMIČNO | DJELIMIČNO | DOBRO | DOBRO | A/D/E trebaju loopback capability; B/C IPC capability. |
| 7. Single-instance podrška | DOBRO | DOBRO | DOBRO | DJELIMIČNO | DJELIMIČNO | Ne dokazuje workspace Single Writer. |
| 8. Single Writer implementacija | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | I11 nije riješen shellom. |
| 9. Restart i double-launch kontrola | DJELIMIČNO | DJELIMIČNO | DJELIMIČNO | DJELIMIČNO | DJELIMIČNO | Zahtijeva lifecycle test. |
| 10. Offline rad | DJELIMIČNO | DJELIMIČNO | DJELIMIČNO | DJELIMIČNO | DJELIMIČNO | Zavisi od kompletne lokalne konfiguracije. |
| 11. Nula automatskih outbound konekcija | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | I4 zahtijeva network dokaz. |
| 12. Windows packaging | DJELIMIČNO | DJELIMIČNO | DJELIMIČNO | DJELIMIČNO | DJELIMIČNO | Installer nije testiran. |
| 13. Installer i update model | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | Track A nema automatski update. |
| 14. `.msg` / `.eml` mogućnosti | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | Parser nije implementiran. |
| 15. `.docx` mogućnosti | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | Generator nije implementiran. |
| 16. SQLite mogućnosti | DJELIMIČNO | DJELIMIČNO | DJELIMIČNO | DJELIMIČNO | DJELIMIČNO | I1–I3 model i `%LOCALAPPDATA%` nisu projektovani. |
| 17. OneDrive placeholder kompatibilnost | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | Potreban kontrolisani testni model. |
| 18. Crash recovery | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | I11/I12/§3 zahtijevaju dokaz. |
| 19. Backup/restore integracija | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | NEPOZNATO — POTREBAN SPIKE | Nema V1 backup sloja. |
| 20. Security attack surface | SREDNJE | SREDNJE | SREDNJE | VISOKO | SREDNJE | Procjena nije security test. |
| 21. Testabilnost | DJELIMIČNO | DJELIMIČNO | DJELIMIČNO | SLABO | DJELIMIČNO | Potrebni su negative i lifecycle testovi. |
| 22. Održavanje od strane malog tima | DJELIMIČNO | DJELIMIČNO | SLABO | SLABO | DJELIMIČNO | Stvarni maintenance nije procijenjen. |
| 23. Novi jezik ili runtime | SREDNJE | SREDNJE | VISOKO | SREDNJE | SREDNJE | Tauri uvodi Rust; ostali uvode desktop/service runtime. |
| 24. Očekivani rizik migracije | SREDNJE | VISOKO | VISOKO | SREDNJE | SREDNJE | Zahtijeva spike dokaz. |
| 25. Dugoročna proširivost | DJELIMIČNO | DJELIMIČNO | DJELIMIČNO | DJELIMIČNO | DJELIMIČNO | Ne proglašava se buduća arhitektura. |

## 5. Threat model po opciji

| Rizik | A | B | C | D | E | Šta zahtijeva spike |
|---|---|---|---|---|---|---|
| LAN exposure, port discovery, CSRF, token leakage | loopback/token granica | nema HTTP; IPC grantovi | nema HTTP; IPC grantovi | najizraženije | loopback/token granica | bind, port, token i process inspection |
| Renderer compromise / IPC overexposure | preload i navigation policy | ključni rizik IPC allowlist-e | ključni rizik command allowlist-e | browser origin/API rizik | browser/webview granica | negative capability tests |
| Child process / orphan lifecycle | main upravlja serverom | main upravlja backendom | host upravlja sidecarom | service može ostati aktivan | launcher/server split | restart, kill UI, shutdown test |
| Filesystem, symlink/junction TOCTOU | zadržava V1 + budući adapter | centralizuje u main | novi backend mora replicirati kontrole | server mora zadržati kontrole | zadržava V1 + budući adapter | path/race fixture tests |
| Dual writer / stale lease | nije riješeno shellom | nije riješeno shellom | nije riješeno shellom | nije riješeno servisom | nije riješeno launcherom | 0D lease spike |
| Updater, external navigation, sensitive logging | packaging politika potrebna | packaging politika potrebna | packaging politika potrebna | service/update politika | launcher/update politika | network/log inspection |
| Dokument izlazi sa računara | samo user action mora ostati izvan DOSSARE | isto | isto | browser rizik je veći | browser rizik je veći | I4/I5 review |

Nijedna shell opcija sama ne rješava I11, I12, backup ili OneDrive semantiku; to su odvojeni domain/workspace problemi.

## 6. Packaging i lifecycle pitanja

Za svaki server model A, D i E spike mora dokazati: bind samo na `127.0.0.1`; dinamički port; lokalni capability token; odbijanje drugog procesa; uredno gašenje child procesa; ponašanje poslije UI pada; restart; double-launch; rollback paketa; lokaciju configa, lease-a i budućeg indeksa van workspace-a; i odsustvo LAN/outbound prometa. B i C zamjenjuju port/token provjeru IPC capability i context-isolation/command-allowlist provjerom. Svi modeli moraju odvojiti paket/update rollback od workspace podataka, koji se ne smiju mijenjati update-om bez posebne migracione procedure.

## 7. Uticaj na postojeći V1

| Opcija | Šta uglavnom ostaje | Šta bi zahtijevalo prilagođavanje |
|---|---|---|
| A | App Router, Route Handleri, server-only fs, existing fetch ugovor | desktop entrypoint, config lokacija, open-folder lifecycle, loopback token |
| B | React dio i domain pravila uz izdvajanje | Route Handleri/server components prema IPC komandi; preload API; testovi |
| C | dio React UI | Rust/sidecar filesystem granica, Next server logika, build/runtime |
| D | većina Node ruta | browser auth, service lifecycle, installer, local server hardening |
| E | Next rute i fs kod | launcher, browser/webview control, local auth, lifecycle |

`open-folder` i `explorer.exe` ostaju privilegovana operacija u A/D/E; u B/C postaju usko definisana IPC/command operacija. `process.cwd()` config u svim modelima mora dobiti stabilnu desktop runtime lokaciju. Nijedan od ovih prilagođavanja nije odobren refaktor.

## 8. Slabiji kandidati

B i C imaju jasnu dugoročnu privilege granicu, ali trenutno nose visok migracioni rizik. D ima najveću lokalnu server/service površinu i najslabije odgovara očekivanju jasne desktop aplikacije. E je realan minimalni put, ali sistemski browser ostavlja više lifecycle i UX neizvjesnosti. To su preliminarne procjene, ne formalno odbacivanje.

## 9. Preliminarni zaključak

Za budući, posebno odobren tehnički spike preporučuju se najviše dvije opcije: **A** i **B** samo zato što daju najkorisniji kontrast za dokazivanje. A nije usvojena zbog kompatibilnosti sa postojećim kodom, a B nije usvojena zbog pretpostavljene sigurnosti IPC-a. Electron nije izabran kao konačni framework; konačni izbor ostaje iza Gate A i Gate B.

Prije odluke potrebno je dokazati lifecycle, loopback/token ili IPC capability, renderer hardening, clean shutdown, double-launch, zero-outbound ponašanje i integraciju I11/I12. Senior review je obavezan za desktop threat model, filesystem privilege granicu, Single Writer i recovery.
