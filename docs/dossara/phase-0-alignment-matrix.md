# DOSSARA — Phase 0 alignment matrix

Ova matrica je evidence-based pregled zatečenog V1 stanja prema Decision & Alignment Register v1.2. Klasifikacija ne predstavlja izmjenu Registra niti odobrenje implementacije.

| ID | Zahtjev / invarijanta | Izvor u Registru | Dokaz iz repozitorijuma | Trenutno stanje | Klasifikacija | Gap | Rizik | Minimalni naredni dokaz ili test | Predloženi Phase 0 work package | Senior review | Odluka naručioca | Acceptance evidence | Napomena |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| I1 | Fajlovi su izvor istine; indeks je odbaciv | I1 | CONTROL Markdown i matter folderi; `docs/architecture-v1.md` | V1 je file-first | USKLAĐENO | V2 indeks nije projektovan | budući indeks može postati autoritativan | model autoritativnih/izvedenih podataka | 0B/1 | Da | Da, prije indeksa | source + senior sign-off | Bez SQLite-a sada ne znači da je budući model riješen |
| I2 | Indeks je u `%LOCALAPPDATA%` | I2 | nema SQLite/index koda ili dependency-ja | Indeks trenutno ne postoji; zahtjev je relevantan za budući DOSSARA model | NEUSKLAĐENO | lokacija/format nisu projektovani | pogrešna lokacija u sync folderu | arhitektonski dizajn | 0B/1 | Da | Da | design review | Implementacija nije odobrena ovim korakom |
| I3 | Prvo fajl, pa indeks | I3 | `matter-create.ts` piše fajlove prije rename-a; nema indeksa | djelimično file-first | DJELIMIČNO USKLAĐENO | nema opšteg write/index ugovora | divergentni indeks | transaction specification + test plan | 0E/1 | Da | Ne prije implementacije | crash/integration test | Za rokove nema odgode kad budu uvedeni |
| I4 | Nula aplikacijskih izlaznih internet konekcija | I4 | nema AI/cloud dependency-ja; postoje user-click ChatGPT/Claude linkovi | automatski API pozivi nisu nađeni | POTREBNA ODLUKA | tumačenje user-initiated browser otvaranja | neusklađen desktop network model | network capture i architecture review | 0C | Da | Da | capture + sign-off | Linkovi se sada ne mijenjaju |
| I5 | Prenos dokumenata je samo svjesna korisnikova radnja | I5 | local prompt generator; nema upload/API koda | nema automatskog prenosa | DJELIMIČNO USKLAĐENO | budući UX za eksterni browser nije odlučen | pogrešna privatnosna poruka | UX/threat-model review | 0C/5 | Da | Da | manual acceptance + sign-off | Link ne prenosi dokumente niti je AI API |
| I6 | Putanje relativne prema workspace-u | I6 | `sdj-workspace.ts` čuva apsolutni root; V1 API skriva izvedene putanje | V1 mješovit model | DJELIMIČNO USKLAĐENO | V2 relative path i external model ne postoje | move/relink problemi | data model review | 0B/1 | Da | Da | fixture move/relink test | Root config je odvojeno runtime pitanje |
| I7 | Sistem ne računa procesne rokove | I7 | V1 prima datum roka, bez kalkulacije | nema procesnog kalkulatora | USKLAĐENO | nema neradni dan upozorenja/potvrda | buduća pogrešna automatizacija | test specifikacija | 4 | Ne | Ne | unit/manual checklist | Nema tvrdnje da je V2 rok model implementiran |
| I8 | Tri oznake pouzdanosti i human confirmation | I8 | nema provenance/label modela | nije implementirano | NEUSKLAĐENO | nema potvrđeno/pretpostavljeno/potrebna odluka | pogrešna prezentacija prijedloga | model + fixtures | 2–5 | Da | Da | UI/integration tests | Nijedan zatečeni artefakt nema ove oznake |
| I9 | Uklanjanje ne mijenja originalni matter folder | I9 | `/api/matters/delete` radi archive rename | istorijski V1 archive/delete | NEUSKLAĐENO | nema `ignored.json` stable-ID modela | pogrešan remove semantički model | migration design | 1 | Da | Da | migration/reconciliation test | V1 ruta se sada ne mijenja |
| I10 | Rad bez aplikacije i potpuni export | I10 | CONTROL fajlovi su čitljivi | dio file-first cilja postoji | DJELIMIČNO USKLAĐENO | nema V2 export/backup obuhvata | lock-in ili nepotpun export | export/restore specifikacija | 0H/1 | Da | Da | restore rehearsal | Originalni dokumenti ostaju u workspace-u |
| I11 | Single Writer, heartbeat, lease, stale takeover | I11 | nema lease, lock, read-only režima | nije implementirano | NEUSKLAĐENO | TTL, heartbeat i reconciliation nisu određeni | concurrent data loss | isolated lease spike | 0D | Da | Da | double-device/crash simulation | Spike se ne spaja automatski |
| I12 | expected hash, temp, fsync, atomic replace, index update | I12 | staging+rename u matter create; direct config write/prompt append | djelimična transakcijska zaštita | DJELIMIČNO USKLAĐENO | nema opšta primitive ni optimistic concurrency | partial write/manual overwrite | isolated atomic-write spike | 0E | Da | Da | crash/hash tests | Windows mehanizam zamjene nije izabran |
| D1 | Desktop Windows aplikacija bez `npm run dev` | §4.2, §8A | samo Next `dev/build/start` skripte | browser aplikacija | NEUSKLAĐENO | packaging/lifecycle nedostaje | nema interni desktop release | architecture alternatives | 0C | Da | Da | packaged smoke test | Model nije odobren |
| D2 | Lokalni server, loopback i token ako je potreban | I4, §8A | relativni `/api` fetch; nema desktop server/tokena | zavisi od modela | POTREBNA ODLUKA | bind/token threat model | LAN exposure/CSRF | desktop design | 0C | Da | Da | process/network inspection | Nije unaprijed pretpostavljen Electron |
| D3 | Restart i double-launch | §8A, I11 | nema app lifecycle kontrole | nepotvrđeno | NEUSKLAĐENO | nema single-instance procesni model | orphan process / dual writer | packaged lifecycle test | 0C/0D | Da | Da | restart + double-launch test | Ne testira se sada |
| D4 | OneDrive placeholder ponašanje | §8A, §4.4 | audit nije otvorio OneDrive/workspace; nema implementacije ni izvršenog testa | potrebno ponašanje nije dokazano | NEUSKLAĐENO | implementacija, fixture i test strategija nedostaju | online-only/missing pogrešna obrada | posebno odobren kontrolisani testni model | 0B/2 | Da, uz posebno odobren kontrolisani testni model | Da, prije testa | controlled fixture test u posebno odobrenom kontrolisanom modelu | Stvarni SDJ i OneDrive workspace-i su zabranjeni |
| D5 | `.msg` / `.eml` prijem sa stagingom | §4.2, §8A | nema parser dependency-ja/modula | nije implementirano | NEUSKLAĐENO | parser i safe staging | Golden Path nije potpun | isolated parser spike | 0F | Ne | Da | synthetic fixture | Ne dodavati dependency sada |
| D6 | `.docx` generisanje / TemplatePair | §8A, §14 | nema generatora | nije implementirano | NEUSKLAĐENO | generator i pair model | Word rezultat nije dokazan | isolated generator spike | 0G | Da | Da | synthetic docx inspection | Nije Word add-in zahtjev |
| D7 | Control Backup i Document Backup upozorenje | §3 | nema backup/restore modula | nije implementirano | NEUSKLAĐENO | manifest, retention, restore | data loss / false sigurnost | backup design + rehearsal | 0H | Da | Da | restore rehearsal | Originali nisu dio Control Backupa |
| D8 | Stabilni identifikatori | I9, §8A | V1 se oslanja na client/matter folder segmente | nije V2 stable-ID model | DJELIMIČNO USKLAĐENO | IDs/schema version nisu uvedeni | rename/move identitet | data model decision | 1 | Da | Da | migration fixture | Folder putanja nije primarni ključ |
| D9 | ExternalFolderFingerprint i dvije statusne ose | I6, §4.4 | nema modela | nije implementirano | NEUSKLAĐENO | availability/fingerprint status | netačno uklanjanje vanjskih linkova | data model spike/design | 0B/2 | Da | Da | controlled fixtures | Ne pretpostavljati connection status |
| D10 | Migration dry-run i rollback | §8A, §14 | nema migration modula | nije implementirano | NEUSKLAĐENO | journal, preflight, rollback | gubitak pri V2 prelazu | migration architecture | 0H/1 | Da | Da | dry-run/recovery test | Ne pokretati migraciju sada |
| D11 | Ručne izmjene se ne prepisuju tiho | I12 | nema expected-hash skladišta ili conflict UI | nije implementirano | NEUSKLAĐENO | conflict/reparse protokol | overwrite korisničkog rada | atomic/concurrency spike | 0E/1 | Da | Da | hash conflict test | Važi za ručno izmjenjive autoritativne fajlove |
| D12 | Zero-outbound verifikacija | I4, §8A | pregledom nije nađen AI/cloud API; capture nije izvršen | nepotvrđeno | POTREBNA ODLUKA | metod mjerenja i procesni obuhvat | nedokazana privatnosna tvrdnja | network test plan | 0C | Da | Da | cijelodnevni capture | Budući test nije izvršen |
| D13 | Node filesystem je server-only | AGENTS.md; V1 architecture | fs importi su u lib/route server tokovima; client koristi fetch | potvrđeno za pregledani kod | USKLAĐENO | desktop bridge nije dizajniran | accidental client exposure u budućnosti | static boundary test | 0B | Ne | Ne | import audit | Ne znači da je filesystem sloj centralizovan |
| D14 | Centralizovan filesystem boundary | §8A | direktni fs importi u 11 produkcijskih fajlova | djelimično centralizovan domain path, razasut IO | DJELIMIČNO USKLAĐENO | nema jedinstveni adapter/write coordinator | nedosljedne mutacije | boundary audit | 0B | Da | Ne | import map + design | Refaktor nije odobren ovim korakom |
| D15 | Faze 1–6 tek poslije prihvatanja Faze 0 | §12, §14 | AGENTS.md, baseline i trenutni scope | produkcijska implementacija nije započeta | USKLAĐENO | Phase 0 approval gates tek slijede | prerani scope creep | status/diff review | 0A–0I | Da | Da | naručilac acceptance | Tehnički spike nije odobren ovim korakom |

## Decision Log

### Potvrđeno

- Testni workspace `C:\SDJ_TEST\SDJ_LEGAL_TEST\` ostaje jedini dozvoljeni workspace.
- Stvarni SDJ i OneDrive workspace-i su zabranjeni.
- V1 archive/delete se sada ne mijenja.
- ChatGPT/Claude linkovi se sada ne mijenjaju.
- Linkovi ne prenose dokumente i nijesu AI API integracija.
- Produkcijske faze 1–6 nijesu odobrene.
- Tehnički spike-ovi nijesu odobreni ovim korakom.
- Nema commit-a i push-a bez posebne odluke.

### Potrebna odluka

- Konačno tumačenje I4/I5 za user-initiated external browser link.
- Izbor desktop packaging modela.
- Loopback/token arhitektura.
- Grane za tehničke spike-ove.
- Način migracije archive/delete ponašanja.
- Izbor odobrenog V2 specifikacionog dokumenta i Aneksa A nakon §5.
- Konačni stable-ID model.
- Lokacija i format odbacivog SQLite indeksa.
- Backup retention i recovery politika.

### Pretpostavljeno

Nema materijalnih pretpostavki korišćenih kao potvrđene činjenice u ovom dokumentacionom koraku.
