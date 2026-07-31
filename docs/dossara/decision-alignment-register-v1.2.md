
# DOSSARA — Decision & Alignment Register

**Verzija:** 1.2  
**Status:** kontrolni akt projekta  
**Učesnici:** ChatGPT / Codex (implementacija) · Claude (proizvod, pregled, dokumentacija) · senior programer (kritične kontrolne tačke) · naručilac (odluke)  
**Datum:** _______

Ovaj dokument ne zamjenjuje specifikaciju. On utvrđuje strateški cilj, šta je zaključano, kako se odlučuje o izmjenama i šta je i dalje otvoreno. Kod se ne piše protiv ovog dokumenta.

## 0. Strateški cilj

Neposredni cilj nije komercijalni proizvod.

### DOSSARA — SDJ Internal Office Edition — Single Writer

Prvo se razvija interna verzija koju naručilac i kancelarija SDJ koriste svakodnevno na stvarnim predmetima. Odluka o komercijalizaciji donosi se tek nakon 4–8 sedmica stabilne interne upotrebe.

### Track A — SDJ Internal Office Edition

Obuhvata:

- migraciju postojećih foldera;
- prijem `.msg`, `.eml` i dokumenata, sa stagingom;
- klijente i predmete;
- Document Register i Chronology;
- radnje, čekanja i ručno potvrđene rokove;
- ročišta i osnovni kalendar;
- Pripremu analize prijema;
- strukturisani AI povrat i potvrdu prijedloga;
- jedan kompletan Word par;
- pretragu;
- backup i oporavak;
- stabilno lokalno desktop pakovanje.

### Track B — Commercial Hardening

Obuhvata:

- komercijalnu godišnju licencu;
- code signing i SmartScreen reputaciju;
- javni update kanal i automatsko preuzimanje;
- sajt i hosting;
- onboarding drugih kancelarija;
- komercijalnu dokumentaciju i podršku;
- podršku širem skupu Windows i Outlook konfiguracija.

Track B nije kriterijum prijema Track A. Nijedna stavka iz Track B ne smije biti uslov da SDJ počne koristiti aplikaciju.

## 1. Hijerarhija projektnih izvora

Kada se dokumenti razlikuju, važi ovim redom:

1. Zaključani invarijanti iz §2 ovog registra.
2. Posljednja izričito odobrena tehnička specifikacija.
3. Posljednji izričito odobreni aneksi.
4. Odobrene odluke o izmjenama evidentirane u §7.
5. Odobreni plan konkretne faze.
6. Kod i tehnička dokumentacija.

Dva pravila koja se ne zaobilaze:

- Nalaz Faze 0 sam po sebi ne mijenja invarijant ni specifikaciju. On otvara odluku koju naručilac mora izričito odobriti.
- Kod nikada nije argument da je zahtjev prećutno promijenjen. Ako kod odstupa od specifikacije, kod je pogrešan dok naručilac ne odluči drugačije.

## 2. Tehnički invarijanti

Zaključano. Svaka izmjena traži zapis o odluci po §7.

### I1 — Izvor istine

Fajlovi u workspace-u su izvor istine. SQLite je odbaciv indeks.

Nijedan autoritativni podatak o klijentu, predmetu, dokumentu, roku, ročištu, radnji, čekanju, AI radu ili korisničkoj odluci ne postoji samo u indeksu.

Izvedeni, pretraživački, UI i drugi odbacivi tehnički podaci mogu postojati samo u indeksu.

Odbacivim se smatraju:

- pretraživački tokeni i FTS struktura;
- izračunati status pažnje;
- keš;
- spisak posljednje otvaranih predmeta;
- performansni metapodaci;
- `mtime` i hash vrijednosti za otkrivanje izmjena.

Ako se indeks obriše, nijedan autoritativni podatak se ne gubi.

### I2 — Lokacija indeksa

Indeks je u `%LOCALAPPDATA%`, nikad u sinhronizovanom ili mrežnom folderu.

### I3 — Redoslijed upisa

Prvo fajl, pa indeks.

Bez odgode za rokove, ročišta, radnje i čekanja.

Odgoda je dozvoljena samo za generisane zbirne preglede koji ne nose podatak koji ne postoji drugdje.

### I4 — Mrežni izlaz

DOSSARA ne poziva AI servise, ne šalje dokumente, sadržaj predmeta, promptove niti identifikacione podatke klijenata.

Dozvoljeni su isključivo unaprijed dokumentovani i tehnički ograničeni mrežni pozivi za provjeru verzije i preuzimanje ažuriranja, bez sadržaja korisničkog workspace-a.

Svaki mrežni izlaz mora biti evidentiran u tehničkoj dokumentaciji i provjeren u Fazi 0.

U Track A provjera ažuriranja je isključena po defaultu.

Kriterijum prijema je nula aplikacijski iniciranih odlaznih internet konekcija iz DOSSARA procesa i njegovih child procesa, mjereno nadzorom saobraćaja tokom jednog radnog dana upotrebe.

Lokalni loopback saobraćaj, kao `127.0.0.1`, ne smatra se spoljnim internet izlazom ako ga zahtijeva odobreni desktop model.

### I5 — Prenos dokumenata je isključivo korisnikova radnja

DOSSARA nikada automatski ne šalje niti prenosi dokumente izvan korisnikovog računara.

Korisnik može, izvan DOSSARE i svojom svjesnom odlukom, prenijeti odabrane dokumente u ChatGPT, Claude ili drugi servis.

DOSSARA taj prenos ne izvršava, ne prikriva i ne podrazumijeva.

Ručni prenos nije automatski privatniji od programskog.

Dokument koji korisnik prenese u spoljni AI alat izašao je iz kancelarije jednako kao da ga je poslala aplikacija, samo bez automatske evidencije o tome šta je tačno poslato.

Nijedan materijal proizvoda ne smije sugerisati suprotno.

### I6 — Putanje

Putanje su relativne u odnosu na korijen workspace-a.

Folderi van workspace-a imaju `ExternalFolderFingerprint` i vidljivu oznaku spoljne lokacije.

### I7 — Rokovi

Sistem ne računa procesne rokove.

Rok unosi i potvrđuje korisnik.

Dozvoljeno je samo upozorenje da uneseni datum pada u neradni dan, prema:

`holidays-{workspace.jurisdiction}.json`

Nepotvrđen rok ne ulazi u računanje statusa pažnje.

### I8 — Potvrda podataka

Sistem ne potvrđuje podatke umjesto korisnika.

Svaki sistemski prijedlog nosi jednu od tri oznake, uz boju i tekst:

- Potvrđeno iz izvora;
- Pretpostavljeno;
- Potrebna odluka.

Kod kontradiktornih nalaza sistem ne bira, nego prikazuje sve pronađene vrijednosti i traži odluku.

Bez OCR-a, iz skeniranog dokumenta smiju se čitati samo:

- naziv;
- tip;
- veličina;
- datum;
- drugi tehnički metapodaci.

Zabranjeno je predlaganje suda, stranaka, činjenica, iznosa i rokova iz sadržaja skena.

Status takvog dokumenta je:

`OCR potreban`

Ako lokalni OCR kasnije bude uključen, podaci iz OCR teksta uvijek nose oznaku `Pretpostavljeno` dok ih korisnik ne provjeri prema originalnom skenu.

Oznaka „Potvrđeno iz izvora“ potvrđuje samo da je vrijednost doslovno pronađena u označenom izvoru.

Ne potvrđuje autentičnost izvora, pravnu tačnost podatka niti njegovu važenost.

Pravno relevantan podatak korisnik i dalje provjerava i potvrđuje.

### I9 — Brisanje

DOSSARA nikada automatski ne briše originalne dokumente ni folder predmeta.

„Ukloni iz DOSSARE“ uklanja predmet iz aktivnog prikaza upisom u:

`04 ADMIN_SDJ_MIKE/ignored.json`

Folder se ne dira.

Marker fajl `.dossara-ignore` upisuje se u sam folder samo na izričit izbor korisnika.

Identitet uklonjenog zapisa je stabilni `matter_id`, a kod spoljne lokacije i `external_link_id`.

Putanja i otisak čuvaju se kao stanje u trenutku uklanjanja — dokazno-pomoćna polja, ne identitet.

Putanja se ne koristi kao primarni ključ jer se folder može premjestiti, nakon čega bi se uklonjeni predmet ponovo pojavio.

Struktura zapisa u `ignored.json` sadrži najmanje:

- `schema_version`;
- `ignored_matters[].matter_id`;
- `ignored_matters[].external_link_id`;
- `ignored_matters[].relative_folder_path_at_removal`;
- `ignored_matters[].fingerprint_at_removal`;
- `ignored_matters[].removed_at`;
- `ignored_matters[].removed_by_user_id`.

Privremeni tehnički fajlovi, keš, indeks, logovi i stare backup kopije uklanjaju se isključivo po pravilima zadržavanja iz §3.

### I10 — Rad bez aplikacije

Predmeti, hronologija, rokovi, čekanja i sljedeće radnje ostaju u čitljivim fajlovima u korisnikovom folderu.

Potpuni izvoz obuhvata:

- sve autoritativne kontrolne zapise;
- AI trag;
- konfiguraciju;
- registre;
- šablone.

Originalni dokumenti već ostaju u korisnikovom workspace-u i ne moraju se duplirati u izvozu.

Potpuni izvoz je dostupan u svakom trenutku, uključujući ograničeni režim poslije isteka buduće komercijalne licence.

### I11 — Single Writer, sekvencijalni rad sa više uređaja

U jednom trenutku samo jedan uređaj ima pravo upisa u workspace.

Pravila:

- drugi uređaj koji istovremeno otvori isti workspace dobija `Read-only`;
- interfejs stalno prikazuje režim:
  - `Read-write`;
  - `Read-only — workspace koristi drugi uređaj`;
- kada primarni korisnik zatvori aplikaciju i lease se uredno oslobodi, drugi uređaj pri sljedećem otvaranju dobija `Read-write`;
- nema istovremenog upisa sa dva računara;
- nema lokalnog reda izmjena za kasnije spajanje;
- nema centralnog Huba u Track A.

Lock koristi heartbeat i vremenski ograničeni lease.

Rušenje aplikacije, nestanak struje, restart računara ili trajno nedostupan uređaj mogu ostaviti lease koji istekne bez urednog oslobađanja.

Istekli lease ne daje automatski pravo tihog upisa.

Umjesto toga:

- prikazuje se uređaj koji je držao lock;
- prikazuje se vrijeme posljednjeg heartbeata;
- korisnik mora izričito izabrati „Preuzmi pravo upisa“;
- prije preuzimanja izvršava se reconciliation;
- prije preuzimanja izvršava se provjera integriteta kontrolnih fajlova;
- preuzimanje se evidentira u tehničkom logu.

Tačan TTL i interval heartbeata utvrđuje Faza 0.

Single Writer je obavezno operativno pravilo i zaštitni lease, a ne distribuirana brava.

Kada je svjež lease vidljiv, drugi uređaj mora otvoriti workspace u `Read-only` režimu.

Zbog kašnjenja sinhronizacije i offline rada nije moguće garantovati da će svaki uređaj odmah vidjeti lease drugog uređaja.

Korisnik ne smije svjesno otvoriti isti workspace za upis na dva offline uređaja.

Prije dodjele `Read-write` režima aplikacija izvršava reconciliation i provjeru integriteta.

Kada stanje nije pouzdano utvrđeno, podrazumijevani režim je `Read-only` do izričitog preuzimanja prava upisa.

Ako interna upotreba pokaže da kancelarija mora imati dva ili više istovremenih autora, to je zasebna odluka za Office Hub / Team verziju i nije mala dopuna.

### I12 — Zaštita ručnih izmjena

Prije prepisivanja ručno izmjenjivog fajla sistem provjerava trenutni hash i poredi ga sa posljednjim indeksiranim.

Kod nesaglasja fajl se ponovo parsira ili se prikazuje konflikt.

Nikada se ručna izmjena ne prepisuje tiho.

Obavezan redoslijed upisa:

1. `validate expected hash`;
2. upis privremenog fajla u istom folderu;
3. `flush/fsync` privremenog fajla;
4. `platform-appropriate atomic replace` ciljnog fajla;
5. provjera hasha konačnog fajla;
6. ažuriranje indeksa.

Tačan Windows mehanizam zamjene utvrđuje Faza 0.

Ako zamjena ne uspije:

- originalni fajl ostaje netaknut;
- indeks se ne ažurira;
- privremeni fajl se zadržava za oporavak ili kontrolisano uklanja;
- korisniku se prikazuje jasna greška.

Ako Codex predloži rješenje koje krši bilo koji invarijant, to je signal da je zadatak pogrešno shvaćen — ne da pravilo treba mijenjati.

## 3. Pravila zadržavanja

| Šta | Zadržavanje | Briše se |
|---|---|---|
| Staging za prijem | do potvrde ili odustajanja | odmah po ishodu; sve starije od 24 sata pri pokretanju |
| SQLite indeks | dok se ne obnovi | na zahtjev ili automatski ako je oštećen |
| Tehnički log | 30 dana | rotacijom |
| Dnevni backup | posljednjih 7 | najstariji pri novom |
| Sedmični backup | posljednja 4 | najstariji pri novom |
| Backup prije migracije ili ažuriranja | trajno | samo ručno |
| Neuspjeli privremeni fajlovi | odmah | pri pokretanju |

Tehnički log ne smije sadržati:

- sadržaj dokumenata;
- imena klijenata;
- brojeve predmeta.

DOSSARA Control Backup obavezno obuhvata:

- sve `00 CONTROL` foldere;
- sve `04 AI` foldere;
- `workspace.json`;
- `users/`;
- `clients/`;
- `external-links/`;
- `ignored.json`;
- `03 SABLONI/`;
- manifest sa hash vrijednostima.

Indeks se ne pakuje jer je odbaciv.

Originalni dokumenti se ne pakuju.

Document Backup je odvojena obaveza korisnika, preko:

- OneDrive-a;
- NAS-a;
- Windows Backupa;
- drugog odobrenog sistema.

Ako nije potvrđen spoljašnji backup, Workspace Health prikazuje:

„Originalni dokumenti nisu obuhvaćeni DOSSARA Control Backupom. Nije potvrđeno da postoji spoljašnji backup dokumenata.“

## 4. Zaključane proizvodne odluke

### 4.1 Golden Path — centralni tok proizvoda

Jedanaest stanica, ovim redom:

1. Klijent pošalje mejl i fajlove.
2. Prijem u DOSSARU — prevlačenje sačuvanog `.msg`, `.eml` ili dokumenata.
3. DOSSARA predlaže klijenta, broj predmeta, sud i vrstu akta, svaki podatak sa oznakom iz I8.
4. Pravnik potvrđuje ili ispravlja.
5. Nastaju predmet, folderi, hronologija i registar dokumenata.
6. Strukturisani intake — činjenice, nalog, pravni cilj i otvorena pitanja.
7. Priprema po oblasti prava — prompt, izbor dokumenata i pitanja za provjeru.
8. Kontrolisani izlazak iz DOSSARE — pravnik bira šta prenosi, kopira prompt u ChatGPT ili Claude, vodi razgovor i provjerava rezultat.
9. Povratak strukturisanog rezultata u DOSSARU i validacija sekcija.
10. Pravnik potvrđuje pojedinačne prijedloge i odobrava generisanje. DOSSARA generiše Word dokument na memorandumu. Pravnik ga pregleda i finalizuje u Microsoft Wordu.
11. Rok, ročište, čekanje i sljedeća radnja ostaju povezani sa predmetom.

Korak 8 je namjeran prekid.

Ne skriva se ni u proizvodu ni u materijalima.

DOSSARA ne piše sama pravni nacrt.

Ona priprema prompt, prima strukturisani rezultat koji korisnik vraća i formira Word dokument tek nakon korisničke potvrde.

Centralno pravilo:

**Automation proposes. The lawyer decides.**

### 4.2 Ostale zaključane odluke

| Odluka | Track |
|---|---|
| Desktop Windows aplikacija, bez oblaka za dokumente | A |
| Lokalno desktop pakovanje — rad bez `npm run dev`, pokretanje poslije restarta, ručna instalacija nove interne verzije | A |
| Potpisani installer, javni update kanal, automatsko preuzimanje | B |
| Komercijalna godišnja licenca | B |
| Šest odvojenih pojmova: Predmet · Radnja · Rok · Događaj · Ročište · Čeka se | A |
| ROK nije tip kalendarskog događaja; kalendar prikazuje objedinjeno | A |
| „Odloži ročište“ je prvorazredna radnja sa istorijom revizija | A |
| `.ics` izvoz bez tvrdnje da je eksterni kalendar sinhronizovan | A |
| Priprema i Word šablon su jedan upareni sistem po vrsti dokumenta | A |
| U interfejsu se koristi „Priprema“, nikad „Agent“ | A |
| Migracija: „Ostavi fajlove gdje jesu“ je podrazumijevano | A |
| Staging sa pregledom prije kopiranja bilo čega | A |
| Polazna varijanta za mejl su sačuvani `.msg` i `.eml` fajlovi | A |

### 4.3 Model eksternog kalendara

Polje `external_calendar_synced` se ne koristi.

DOSSARA ne zna da li je Outlook stvarno ažuriran.

Zna samo koju je verziju događaja korisnik posljednji put izvezao.

Koriste se:

- `last_exported_sequence`;
- `last_exported_at`.

Izvedena vrijednost:

`has_unexported_changes = true`

kada je:

- `ics_sequence > last_exported_sequence`; ili
- `last_exported_sequence` nije popunjen.

Poruka korisniku:

„Izmjene ovog događaja još nisu izvezene u eksterni kalendar.“

### 4.4 Statusi spoljne lokacije — dvije nezavisne ose

Ne koristi se jedan status za dostupnost i podudarnost otiska.

Polje `connection_status` se uklanja iz `ExternalFolderFingerprint`.

Prva osa:

`availability_status`

Dozvoljene vrijednosti:

- `available`;
- `temporarily_unavailable`;
- `online_only`;
- `missing_pending_confirmation`;
- `deleted_confirmed`.

Druga osa:

`fingerprint_status`

Dozvoljene vrijednosti:

- `not_checked`;
- `match`;
- `changed`;
- `relink_required`.

Pravila:

- `temporarily_unavailable` i `online_only` nikada ne uklanjaju autoritativni zapis iz indeksa ni iz prikaza;
- rok, ročište i radnja ostaju vidljivi;
- `changed` je informacija, ne greška;
- `relink_required` traži akciju „Ponovo poveži folder“;
- samo `deleted_confirmed`, nakon izričite odluke korisnika, omogućava uklanjanje autoritativnog zapisa.

Podrazumijevani otisak sadrži:

- ime foldera;
- broj fajlova;
- ukupnu veličinu;
- datum najnovije izmjene;
- hash manifesta relativnih naziva, veličina i datuma.

Hashiranje sadržaja dokumenata radi se samo kada je potrebno dodatno potvrditi ponovno povezivanje.

### 4.5 Granica izvršenja AI koraka

Zaključan je arhitektonski princip:

Ručni AI tok mora biti izolovan iza interne granice izvršenja, kako bi se budući opcioni provider mogao dodati bez promjene:

- TemplatePair modela;
- validacije sekcija;
- potvrde prijedloga;
- Word toka.

U Track A postoji jedan aktivan način izvršenja — ručni:

- kopiranje prompta;
- vraćanje rezultata.

Budući provider ostaje prazan placeholder bez ijednog mrežnog poziva.

`AIExecutionProvider` je preporučeni naziv interfejsa, ne obavezna implementaciona forma.

Ako Faza 0 obrazloži bolji raspored slojeva za izabrani desktop model, naziv i struktura se mogu promijeniti.

Princip izolacije ostaje obavezan.

### 4.6 Terminologija

Za lokalne operacije ne koristiti riječ „upload“.

Koristiti:

- Prijem;
- Uvoz;
- Kopiranje u predmet;
- Poveži folder.

### 4.7 Validacija šablona

Ručno izmijenjeni intake upitnik, priprema ili Word mapiranje moraju se validirati prije aktiviranja.

Ako šablon nije validan:

- prikazuje se naziv fajla;
- prikazuje se precizna greška;
- posljednja validna verzija ostaje aktivna;
- ostale pripreme nastavljaju da rade.

Word mapiranje koje nema obavezni stil ili sekciju ne može se aktivirati.

### 4.8 AI trag

Neprihvaćeni AI prijedlozi ne postaju operativni zapisi.

Ostaju u originalnom rezultatu sačuvanom u `04 AI` radi traga.

## 5. Status obima

**PRIVREMENO ZAKLJUČANO.**

Puno zamrzavanje Track A stupa na snagu nakon što naručilac izričito pisano odobri:

- DOSSARA V2 — tehnička specifikacija v1.3, dio I i dio II;
- DOSSARA V2 — Aneks A uz v1.3.

Verzija specifikacije ostaje v1.3.

Verzija 1.4 se ne izrađuje osim kroz zapis o odluci po §7.

## 6. Uloge

Nijedan model nema konačni autoritet nad činjenicom koju nije provjerio.

| Oblast | Primarna uloga |
|---|---|
| Repozitorijum, implementacija, testovi | ChatGPT / Codex |
| Windows, fajl-sistem, desktop pakovanje | ChatGPT / Codex, uz potvrdu senior programera |
| Proizvodni tok i informaciona arhitektura | Claude |
| Pripreme, strukturisani AI izlaz i Word parovi | Claude |
| UX, tekst za korisnika i demo narativ | Claude |
| Stvarno ponašanje aplikacije | testovi i Faza 0 |
| Product ownership i prijem | naručilac |
| Konačna poslovna i proizvodna odluka | naručilac |

### 6.1 Naručilac

Naručilac je:

- product owner;
- pravni arhitekta;
- acceptance tester.

Upravlja Codex zadacima, pregleda funkcionalne rezultate, piše acceptance scenarije, testira na stvarnim SDJ predmetima i odobrava svaki commit i svaku fazu.

Vezno ograničenje projekta nije brzina pisanja koda nego kapacitet prijema.

Codexu se dodjeljuju zadaci koje naručilac može pregledati i testirati u razumnom roku.

Kod koji čeka pregled nije napredak nego dug.

### 6.2 Codex

Codex radi:

- implementaciju malih, ograničenih zadataka;
- testove;
- diff;
- TypeScript;
- ESLint;
- build.

Codex ne smije:

- samostalno širiti obim;
- praviti commit bez odluke naručioca;
- raditi push bez odluke naručioca.

### 6.3 Claude

Claude radi:

- proizvodnu logiku;
- UX;
- TemplatePair;
- pripreme;
- strukturisane rezultate;
- drugi pregled specifikacije.

### 6.4 Senior programer

Tri obavezne kontrolne tačke:

1. Faza 0 i desktop arhitektura.
2. Migracija, atomic write, backup i recovery.
3. Završni data-loss i security pregled prije pune kancelarijske upotrebe.

Okvir od 5–9 senior dana je početna, neobavezujuća planska procjena.

Ne zaključava se kao zahtjev ni kao budžet.

Stvarna procjena se utvrđuje nakon Faze 0.

### 6.5 Zapis o dosadašnjim ispravkama

Čuva se kao dokaz, ne kao ocjena.

Ispravljeno u ranijim Claudeovim tvrdnjama:

- indeks u sinhronizovanom folderu;
- neizmjerena tvrdnja o brzini čitanja Markdown fajlova;
- kriterijum prijema koji zavisi od Outlooka;
- „deseti klijent košta isto koliko i stoti“;
- potcijenjeno godišnje održavanje;
- pretpostavka da prevlačenje iz Outlooka radi;
- invarijant I5 u preširokoj formulaciji;
- „ništa se ne briše“ bez izuzetaka;
- tvrdnja da Track A nema troškove;
- I1 formulisan preširoko, bez izuzetka za izvedene podatke.

Ispravljeno u ranijim ChatGPT tvrdnjama:

- `previous_date` umjesto istorije revizija;
- nedostajuće uparivanje priprema i Word šablona;
- nedostajući rezervni put kada JSON izlaz nije ispravan;
- `.dossara-ignore` u folderu koji treba ostati nepromijenjen.

Ranije procjene cijena budućih AI API modela bile su vremenski osjetljive i ne predstavljaju projektni izvor.

Prije eventualne API faze cijene i uslovi provjeravaju se ponovo.

## 7. Kontrola izmjena

Nema tihih izmjena specifikacije, ni kada djeluju tehnički očigledno.

Svako odstupanje dobija zapis sa sljedećim poljima:

| Polje | Sadržaj |
|---|---|
| Odluka | `DEC-2026-001` |
| Datum | datum predlaganja |
| Predložena izmjena | šta se tačno mijenja |
| Razlog | zašto |
| Dotiče invarijant ili odjeljak | na primjer I4 ili §4.4 |
| Uticaj na rok | u danima |
| Uticaj na cijenu | u eurima |
| Uticaj na podatke i migraciju | da li traži migraciju postojećih zapisa |
| Odluka naručioca | tekst odluke |
| Status | predloženo · odobreno · odbijeno |

Registar odluka se popunjava po potrebi.

## 8. Otvorena pitanja

### 8A — Blokirajuće za Track A, rješava Faza 0

- mapa svih `fs` / `node:fs` pristupa i da li su izdvojeni u jedan sloj;
- izbor desktop modela i način pokretanja serverskog dijela;
- minimalno lokalno pakovanje;
- ponašanje poslije restarta računara;
- ponašanje pri dvostrukom pokretanju aplikacije;
- pristup lokalnom workspace-u;
- ponašanje na OneDrive workspace-u, uključujući mrežne čuvare mjesta;
- file-first + SQLite model nad postojećim kodom;
- `.msg` / `.eml` prototip;
- način generisanja `.docx`;
- backup i recovery arhitektura;
- TTL lease-a i interval heartbeata za I11;
- potvrda nula internet konekcija kada je provjera ažuriranja isključena;
- rizici u postojećem kodu;
- procjena internih faza 1–6.

### 8B — Informativno, ne blokira Track A

- code signing i njegov trošak;
- javni update kanal;
- komercijalna licenca;
- puna Outlook matrica;
- direktni Outlook drag-and-drop;
- lokalni OCR i njegova tačnost;
- komercijalni installer.

### 8C — Odluke naručioca

Donesene odluke:

- Prvi reprezentativni Word par je **Pravno mišljenje**.
- Odgovor na tužbu je sljedeći par, van Track A acceptance-a.
- Početna jurisdikcija je **RS**.
- Arhitektura mora podržavati kasnije dodavanje **ME** bez izmjene modela podataka, kroz:
  - `holidays-{workspace.jurisdiction}.json`;
  - polje `jurisdiction` u `workspace.json`.

Otvorene odluke:

- koliko predmeta ulazi u prvi rollout i koji;
- cijena i obim prve komercijalne ponude, kada Track B postane aktuelan.

## 9. Poslovni model

Odnosi se na Track B.

Ne uslovljava Track A.

Početni model je:

- softver;
- uvođenje;
- obuka;
- podrška.

Nije masovna pretplata.

Uvođenje se naplaćuje zasebno.

Cijena se brani uvođenjem reda u kancelariju, ne brojem funkcija.

Prvi komercijalni cilj je tri do pet kancelarija koje plaćaju i koriste proizvod redovno.

Nema značajnog varijabilnog infrastrukturnog troška po korisniku za skladištenje dokumenata u oblaku ili AI pozive, jer ih DOSSARA ne koristi.

Troškovi uvođenja, podrške, testiranja po konfiguracijama, distribucije ažuriranja i upravljanja licencama rastu sa brojem korisnika.

Track A nema komercijalne infrastrukturne troškove:

- domena;
- javnog update kanala;
- code signing-a;
- komercijalnog licenciranja.

I dalje postoje troškovi:

- razvoja;
- stručnog pregleda;
- popravki;
- tehničkog održavanja interne verzije.

Track B dodaje približno:

- infrastrukturu 300–1.000 EUR godišnje;
- tehničko održavanje 2.500–6.000 EUR godišnje;
- ukupno približno 3.000–7.000 EUR godišnje.

Vrijedi pri malom broju korisnika i bez razvoja novih modula.

Razlika koja se brani u prodaji:

- tabla čekanja sa starenjem;
- upareni tok priprema → Word;
- dokumenti ostaju kod korisnika.

Vođenje sa „imamo predmete i kalendar“ ne razlikuje proizvod od jeftinije domaće konkurencije.

## 10. Legaltech praksa

| Praksa | Primjena |
|---|---|
| Čovjek u petlji za svaku pravnu ocjenu | I5, I7, I8 |
| Vidljiva provenijencija podatka | I8 |
| Trag AI upotrebe | `ai-work-log.md`, prompt i rezultat u `04 AI` |
| Bez zaključavanja klijenta | I10 |
| Minimizacija podataka kod proizvođača | §11 |
| Rokovi kao odgovornost pravnika | I7 |
| Nepromjenjiv trag odluka | revizije ročišta, hronologija, potvrde rokova |
| Oporavak od greške | backup sa manifestom i provjerom, obnova indeksa |
| Zaštita od tihog gubitka podataka | I11, I12, §4.4 |

Nije primijenjeno, svjesno:

- pretraga sadržaja dokumenata.

Ostaje van obima.

Ulazi kao zaseban modul samo ako interna upotreba pokaže da je uslov za rad.

## 11. Odnos prema podacima korisnika

Proizvođač DOSSARE ne prima niti čuva klijentske dokumente.

Dokumenti koje korisnik unese ostaju u njegovom lokalnom ili OneDrive workspace-u, zajedno sa evidencijom i čitljivim kontrolnim fajlovima.

DOSSARA obrađuje samo ono što je potrebno za lokalni workflow.

Ne koristiti formulaciju:

„u sistemu evidencija, ne dokumenti“

DOSSARA kopira dokumente u `01 ULAZ`, ali ih proizvođač nikada ne dobija.

## 12. Pravila rada dok se piše kod

Specifikacija v1.3 i Aneks A su izvor zahtjeva nakon odobrenja po §5.

Codex ne odlučuje o obimu.

Nejasnoća ide naručiocu i ne rješava se pretpostavkom.

Prije završetka Faze 0 dozvoljeni su samo:

- audit;
- testni prototipi;
- izolovani tehnički spike-ovi koji se ne spajaju automatski u produkcionu granu.

Produkcijska implementacija faza 1–6 počinje tek nakon prihvatanja nalaza Faze 0 i odobrenja konkretnog plana.

Parser `.msg` i `.eml` može postojati kao prototip, ali se ne pretpostavlja da će taj kod ostati konačan.

Pregled koda ide po fazama, uz kriterijume prijema iz specifikacije.

Svaka izmjena invarijanta zaustavlja rad dok ne postoji zapis po §7.

Neslaganja savjetnika bilježe se u §6.5, ne rješavaju se u prolazu.

## 13. Zvanični dokumenti projekta

| Dokument | Uloga |
|---|---|
| DOSSARA V2 — tehnička specifikacija v1.3, dio I i II | zahtjevi |
| DOSSARA V2 — Aneks A uz v1.3 | razrade unutar obima |
| DOSSARA — Decision & Alignment Register v1.2 | kontrolni akt |
| DOSSARA Phase 0 — Zahtjev za fiksnu ponudu | nabavka |

Sve ostalo je radni materijal:

- makete;
- marketinški tekstovi;
- ranije verzije;
- neodobrene analize.

Plan edukacije naručioca nije dio tehničke dokumentacije.

Vodi se kao poseban operativni dokument.

## 14. Redoslijed internih faza

| Faza | Interni rezultat |
|---|---|
| 0 | Audit repozitorijuma, desktop prototip, odluka o pakovanju |
| 1 | File-first V2 zapisi, indeks, migracija, atomic write, osnova backupa |
| 2 | Uvoz foldera, klijenti, predmeti, dokumenti, pretraga |
| 3 | `.msg` / `.eml` prijem, staging, Document Register, Chronology |
| 4 | Radnje, čekanja, ručni rokovi, osnovno ročište i kalendar |
| 5 | Jedan puni Golden Path: intake → priprema → AI povrat → potvrda → Word |
| 6 | Danas, odlaganje ročišta, `.ics`, stabilizacija, interni rollout |
| Commercial | Licenca, code signing, javni update, sajt, distribucija |

Jedan potpuni vertikalni tok mora proraditi prije dodatnih šablona i naprednih kalendarskih funkcija.

Za prvi interni acceptance obavezna su samo tri TemplatePair para:

1. Priprema analize prijema — daje prijedloge zapisa u predmetu.
2. Priprema mejla klijentu — daje nacrt komunikacije.
3. Pravno mišljenje — reprezentativni Word par.

Engine podržava i ostale parove.

Njihov sadržaj nije uslov za internu verziju.

## 15. Interni rollout

Ne prelaziti odmah na sve predmete kancelarije.

Redoslijed:

1. Testni workspace:
   `C:\SDJ_TEST\SDJ_LEGAL_TEST\`
2. Sintetički fixture podaci.
3. Pet do deset stvarnih, anonimizovanih ili kontrolisanih predmeta.
4. Paralelno vođenje sa postojećim načinom rada.
5. Test backupa i oporavka.
6. Uključivanje najmanje još jednog korisnika iz kancelarije.
7. Četiri do osam sedmica svakodnevne upotrebe.
8. Tek zatim širenje na ostatak kancelarije.

Korak 6 testira sekvencijalni rad, ne simultani upis.

Provjerava se:

- da drugi korisnik razumije interfejs;
- da ispravno dobija `Read-only` dok je primarni uređaj aktivan;
- da poslije urednog oslobađanja lease-a može preuzeti `Read-write`;
- da poslije neurednog prekida preuzimanje prava upisa traži izričitu potvrdu po I11;
- da oba korisnika vide iste podatke;
- da nijedna izmjena nije izgubljena ni konfliktna.

Komercijalna odluka donosi se tek poslije ovog perioda.

## 16. Šta slijedi

1. Faza 0 nad stvarnim repozitorijumom.
2. Test jednog strukturisanog intake prompta na tri stvarna, anonimizovana predmeta.
3. Faze 1–6 po redoslijedu iz §14.
4. Četiri do osam sedmica interne upotrebe.
5. Tek zatim odluka o Track B.

Van dometa savjetnika:

- stvarne cijene sertifikata, hostinga i rada programera za konkretno pravno lice;
- stvarno ponašanje Outlooka, OneDrive-a i Windowsa na korisnikovoj mašini;
- kvalitet postojećeg koda dok se ne pregleda;
- da li će bilo koja druga kancelarija ovo platiti.

Nijedan dalji krug savjetovanja ne skraćuje ove stavke.

