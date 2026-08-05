# DOSSARA — WP VLA-0A Terminology and Trust Model

## 1. Document Control

| Polje | Vrijednost |
|---|---|
| Dokument | WP VLA-0A — Terminology and Trust Model |
| Status | Dokumentacioni baseline za pregled naručioca |
| Datum | 5. avgust 2026. |
| Repository branch | `spike/phase-0c-electron-forge-webpack` |
| Početni repository HEAD | `166d92dbf4151f815c754e611fb9b090dabac3c6` |
| Formalni kontrolni akt | `docs/dossara/decision-alignment-register-v1.2.md` |
| Tehnička osnova | WP 0C-B0: `GO — WP 0C-B0 ACCEPTED` |
| Vrsta rada | Documentation-only; bez implementacione šeme i runtime ponašanja |

## 2. Purpose

Ovaj dokument uspostavlja zajednički jezik i normativni trust model za DOSSARA Verified Legal Action System. Cilj je da kasniji VLA paketi koriste odvojene semantičke ose, dokazivu provenijenciju i ljudsku pravnu odgovornost bez pretvaranja sistemskog prijedloga u činjenicu ili odluku.

**Normative:** DOSSARA može identifikovati, strukturisati, povezivati, predlagati i upozoravati. Ne može samostalno utvrditi kritičnu činjenicu, potvrditi procesni rok, donijeti pravnu odluku ili trajno primijeniti promjenu stanja predmeta.

## 3. Scope

Dokument definiše:

- primarne VLA objekte i njihove granice;
- assertion, trust, review, lifecycle, operational i decision ose;
- aktere i autoritete;
- zajednička i objektno-specifična konceptualna polja;
- autoritativne i izvedene podatke;
- kvalifikaciju Verified Fact stanja;
- konflikt, djelimičnu potvrdu, ispravku, opovrgavanje i supersession;
- retention, audit i edge-case pravila.

## 4. Out of Scope

**Out of scope:** Ovaj WP ne projektuje niti implementira:

- Source Registry iz VLA-0B;
- Matter State engine iz VLA-0C;
- Change Set engine iz VLA-0D;
- Review Workspace ili UI specifikaciju;
- rokove i automatski obračun iz VLA-0F;
- Client Action Pack workflow iz VLA-0G;
- ADR odluke iz VLA-0H;
- JSON/TypeScript šemu, bazu, CONTROL format ili filesystem ponašanje;
- LLM, RAG, OCR, API ili mrežnu integraciju.

## 5. Normative Language

Oznake u ovom dokumentu imaju sljedeće značenje:

- **Normative** — obavezno semantičko ili kontrolno pravilo.
- **Recommendation** — preporučeni pravac koji još nije implementaciona odluka.
- **Open decision** — tema koju mora potvrditi naručilac prije zaključavanja modela.
- **Out of scope** — tema namjerno prenesena u kasniji WP.

Riječi „mora“, „ne smije“ i „isključivo“ označavaju normativno pravilo. Riječ „može“ označava dozvolu, ne automatsko ponašanje sistema.

## 6. Product and Authority Model

**Normative:** DOSSARA je Verified Legal Action System, a ne generički chatbot i ne autonomni donosilac pravnih odluka. Centralno pravilo ostaje: **Automation proposes. The lawyer decides.**

| Akter | Dozvoljena uloga | Nije dozvoljeno |
|---|---|---|
| Advokat | unos, pravna analiza, pregled, prihvatanje za određenu namjenu, pravna ili procesna odluka u okviru ovlašćenja | pripisivanje objektivne istine samo zato što je objekat prihvaćen |
| Nadležni advokat / partner | konačni autoritet kada interna pravila traže viši nivo; ponovno otvaranje ili eskalacija pregleda | tiho prepisivanje prethodnog Review Record-a |
| Drugi član kancelarije | unos, povezivanje izvora, prijedlog klasifikacije i priprema za pregled | konačna pravna odluka ili samostalna potvrda kritične činjenice |
| Klijent | autoritet za identifikovanu klijentsku ili poslovnu odluku | pravna kvalifikacija umjesto advokata |
| Sistem | deterministička provjera, povezivanje, upozorenje i prijedlog | review ili decision authority |
| Budući AI generator | prijedlog uz jasno porijeklo i obaveznu ljudsku provjeru | potvrda činjenice, roka ili odluke; trajna primjena |
| Tehnički administrator | izuzetna tehnička intervencija prema posebnoj proceduri | redovni pravni pregled ili neauditabilno brisanje |

Decision authority mora biti identifikovan po konkretnom `DECISION_REQUEST` objektu. Za pravne i procesne odluke konačni autoritet je ovlašćeni advokat. Za poslovnu odluku klijenta autoritet može biti identifikovani klijent, dok advokat daje pravnu preporuku, a ne zamjenjuje klijentovu volju.

## 7. Semantic Axes

**Normative:** Sljedeće ose su odvojene i ne smiju se objediniti u jedno polje:

| Osa | Pitanje na koje odgovara | Primjer |
|---|---|---|
| Object Type | Šta je objekat? | `MATTER_ASSERTION` |
| Assertion Kind | Kakva je tvrdnja? | `ATTRIBUTED_STATEMENT` |
| Trust / Epistemic Status | Kakav je odnos tvrdnje prema identifikovanom izvoru? | `CONFIRMED_FROM_SOURCE` |
| Review Status | Šta je ovlašćeni reviewer uradio sa objektom za određenu namjenu? | `ACCEPTED` |
| Lifecycle Status | Da li je ova verzija aktuelna, zamijenjena, povučena ili poništena? | `SUPERSEDED` |
| Operational Status | Gdje je objekat u svom operativnom toku? | objektno-specifično; definiše kasniji WP |
| Decision Status | Da li je tražena odluka donesena, odložena ili otkazana? | `PENDING_DECISION` |
| Decision / Review Authority | Ko ima ovlašćenje da odluči ili pregleda? | nadležni advokat |

Primjer: pretpostavka može biti `MATTER_ASSERTION` + `FACTUAL_CLAIM` + `ASSUMED` + `ACCEPTED` za internu radnu analizu + `ACTIVE`. Nijedna od tih vrijednosti ne mijenja značenje druge ose.

## 8. Core Terminology

| Srpski UI | English UI | Tehnički naziv |
|---|---|---|
| Izvorna stavka | Source item | `SOURCE_ITEM` |
| Tvrdnja predmeta | Matter assertion | `MATTER_ASSERTION` |
| Zahtjev za odluku | Decision request | `DECISION_REQUEST` |
| Pravna radnja | Legal action | `LEGAL_ACTION` |
| Rok | Deadline | `DEADLINE` |
| Očekivani rezultat | Expected output | `EXPECTED_OUTPUT` |
| Zapis pregleda | Review record | `REVIEW_RECORD` |
| Skup promjena | Change set | `CHANGE_SET` |
| Paket za postupanje klijenta | Client action pack | `CLIENT_ACTION_PACK` |
| Potvrđeno iz izvora | Confirmed from source | `CONFIRMED_FROM_SOURCE` |
| Pretpostavljeno | Assumed | `ASSUMED` |
| Nije procijenjeno | Unassessed | `UNASSESSED` |
| Predloženo | Proposed | `PROPOSED` |
| U pregledu | In review | `IN_REVIEW` |
| Prihvaćeno | Accepted | `ACCEPTED` |
| Odbijeno | Rejected | `REJECTED` |
| Aktivno | Active | `ACTIVE` |
| Zamijenjeno | Superseded | `SUPERSEDED` |
| Povučeno | Withdrawn | `WITHDRAWN` |
| Poništeno | Voided | `VOIDED` |

### 8.1 Generator i porijeklo objekta

**Normative:** Autor zapisa, način generisanja, porijeklo sadržaja i lice kojem se izjava pripisuje predstavljaju različite podatke:

| Konceptualno polje | Semantika | Autoritativnost |
|---|---|---|
| `created_by` | identitet čovjeka ili sistemskog aktera odgovornog za kreiranje zapisa u DOSSARI | autoritativni audit podatak |
| `generator_type` | da li je zapis nastao ručno, kao sistemski prijedlog ili kao budući AI prijedlog | autoritativno porijeklo generisanja; AI ne dobija authority |
| `origin_type` | vrsta spoljnog ili internog porijekla sadržaja | autoritativna klasifikacija provenijencije nakon ljudske provjere |
| `statement_attribution` | identitet ili opis lica/organizacije kojoj se konkretna izjava pripisuje | autoritativno za attribution; ne potvrđuje istinitost izjave |

Početne semantičke kategorije koje kasniji WP treba da pretvori u kontrolisani rječnik su:

| Porijeklo | Obavezno razgraničenje |
|---|---|
| sistemski prijedlog | deterministički prijedlog sistema; nije ljudska potvrda |
| budući AI prijedlog | generisani prijedlog sa vidljivim generatorom; nije autoritet |
| ručni unos advokata | advokat je kreirao zapis; sadržaj nije automatski Verified Fact |
| ručni unos drugog člana kancelarije | unos/priprema bez konačnog pravnog authority-ja |
| klijentska tvrdnja | sadržaj se pripisuje klijentu; postojanje izjave i istinitost se odvajaju |
| tvrdnja druge strane | sadržaj se pripisuje drugoj strani; nije neutralna činjenica |
| javna ili službena isprava | izvor može neposredno navoditi podatak; službeni karakter ne garantuje tačnost |
| privatna isprava | evidentira se dokument i relevantni scope bez automatske potvrde autentičnosti |
| mejl | evidentira pošiljaoca, sadržaj i relevantni scope; atribucija nije potvrda istinitosti |
| interna bilješka | interni radni izvor sa poznatim autorom i ograničenom namjenom |

**Open decision:** Tačni tehnički nazivi i cardinality ovih kategorija nijesu usvojeni. VLA-0B treba da razradi source/origin vocabulary, a VLA-0H da potvrdi konačnu implementacionu odluku.

## 9. Source Item

`SOURCE_ITEM` / **Izvorna stavka** / **Source item** je identifikovani materijal koji može podržati ili osporiti tvrdnju: dokument, mejl, službena ili privatna isprava, interna bilješka ili drugi dozvoljeni izvor.

- **Svrha:** stabilna traceability veza između tvrdnje i izvora.
- **Jeste:** evidencija identiteta, porijekla i relevantnog obima izvora.
- **Nije:** potvrda autentičnosti, pouzdanosti ili istinitosti sadržaja.
- **Relevantne ose:** Object Type i Lifecycle; Review samo ako kasniji workflow zahtijeva pregled izvora; operational vocabulary pripada VLA-0B.
- **Akteri:** član kancelarije evidentira; advokat procjenjuje pravnu relevantnost; sistem može predložiti vezu.
- **Minimalno obavezno:** `id`, `matter_id`, `object_type`, prikazni naziv, origin/provenance opis, file-first referenca, `created_at`, `created_by`, `lifecycle_status`.
- **Opciono:** datum izvora, autor/pošiljalac, statement attribution, opis relevantnog dijela, source links ka povezanim objektima.
- **Autoritativno:** identitet, file-first referenca, zabilježeno porijeklo, audit događaji i istorijski hash evidentiran kao dokaz integriteta u određenom trenutku.
- **Izvedeno:** dostupnost, prikazni naziv izveden iz fajla i obnovljivi tehnički metapodaci. Ponovo izračunati hash je verifikacioni rezultat, ne zamjena za istorijski hash.
- **Primjer:** mejl druge strane evidentiran je kao `SOURCE_ITEM`; on potvrđuje da je poruka primljena i šta u njoj piše, ali ne potvrđuje istinitost sporne tvrdnje.

**Normative:** Hash se može ponovo izračunati, ali hash evidentiran u određenom trenutku kao dokaz integriteta predstavlja autoritativni audit podatak. Ponovo izračunata vrijednost predstavlja verifikacioni rezultat i ne prepisuje istorijski hash. Puna source-integrity pravila pripadaju VLA-0B.

## 10. Statement, Attribution and Assertion

**Normative:** Moraju se razlikovati:

1. sadržaj dokumenta — šta zapis sadrži;
2. postojanje izjave — da je određeno lice nešto izjavilo;
3. istinitost sadržaja izjave — da je izjava činjenično tačna;
4. činjenični zaključak — izveden iz jednog ili više izvora;
5. pravna kvalifikacija — primjena pravne kategorije na činjenice;
6. pravno mišljenje — stručna procjena advokata;
7. odluka — izbor ovlašćenog aktera između opcija.

Dozvoljene formulacije su: „Izvor navodi…“, „Potvrđeno je postojanje izjave…“ i „Istinitost sadržaja izjave nije potvrđena…“. Nije dozvoljeno preći sa „lice je izjavilo X“ na „X je istinito“ bez zasebne tvrdnje i zasebne podrške.

## 11. Matter Assertion and Assertion Kinds

`MATTER_ASSERTION` / **Tvrdnja predmeta** / **Matter assertion** je atomska, identifikovana propozicija relevantna za predmet. Assumption i Verified Fact nijesu zasebni primarni objekti; oba se izražavaju stanjem ili kvalifikacijom `MATTER_ASSERTION` objekta.

| Srpski UI | English UI | Tehnički naziv | Razgraničenje |
|---|---|---|---|
| Činjenična tvrdnja | Factual claim | `FACTUAL_CLAIM` | neposredno provjerljiva tvrdnja o događaju, licu, stvari, iznosu ili datumu |
| Izjava lica | Attributed statement | `ATTRIBUTED_STATEMENT` | tvrdnja da je identifikovano lice izjavilo određeni sadržaj |
| Izvedeni činjenični zaključak | Factual inference | `FACTUAL_INFERENCE` | zaključak izveden povezivanjem više činjenica ili izvora |
| Pravna kvalifikacija | Legal characterization | `LEGAL_CHARACTERIZATION` | pravno svrstavanje činjenica; nije činjenica |
| Pravno mišljenje | Legal opinion | `LEGAL_OPINION` | stručno pravno mišljenje ovlašćenog advokata |
| Stav stranke | Party position | `PARTY_POSITION` | procesni ili materijalni stav klijenta, druge strane ili učesnika |

- **Minimalno obavezno:** identitet, predmet, assertion kind, atomski tekst tvrdnje, lifecycle, porijeklo/generator, autor i vrijeme nastanka.
- **Objektno-specifično:** trust status ili neprocijenjeno stanje, source links, attribution, scope neposredne podrške, conflict links, review status.
- **Osnovni akteri:** čovjek ili sistem predlaže; član kancelarije povezuje izvore; ovlašćeni advokat potvrđuje trust procjenu i vrši review.
- **Autoritativno:** tekst konkretne verzije, assertion kind, veze na izvore, audit istorija, Review Record veze i lifecycle relacije.
- **Izvedeno:** „posljednji reviewer“, eligibility za Verified Fact i zbirni conflict indicator.
- **Primjer:** „Dana 3. maja klijent je poslao obavještenje“ može biti `FACTUAL_CLAIM`; „Klijent navodi da je poslao obavještenje“ je `ATTRIBUTED_STATEMENT` ako postoji samo njegova izjava.

## 12. Trust / Epistemic Model

Trust osa se primarno primjenjuje na `MATTER_ASSERTION`. Ona opisuje odnos precizne tvrdnje prema izvoru, ne opštu reputaciju izvora i ne review odluku.

### 12.1 `UNASSESSED`

**Normative definition:** Trust procjena još nije izvršena.

`UNASSESSED` je normativni početni trust status. Ne znači nepouzdano, sumnjivo, pretpostavljeno, konfliktno niti da trust status nije primjenjiv. Status ostaje vidljiv dok ovlašćeni ljudski reviewer ne potvrdi `ASSUMED` ili `CONFIRMED_FROM_SOURCE` procjenu.

- **Preduslovi:** nova assertion za koju još nema završene trust procjene.
- **Predlaže/potvrđuje:** sistem ga postavlja kao početno stanje nastanka primjenjive assertion; čovjek potvrđuje narednu trust procjenu.
- **Dozvoljeni prelazi:** `UNASSESSED` → `ASSUMED`; `UNASSESSED` → `CONFIRMED_FROM_SOURCE`.
- **Zabranjeni prelazi:** automatski prelaz samo zbog review acceptance-a; skriveno tretiranje kao confirmed ili assumed.
- **Audit:** nastanak assertion i svaki kasniji prelaz moraju sačuvati prethodno stanje, aktera, razlog i vrijeme.
- **Primjer 1:** novounesena činjenična tvrdnja još nije povezana sa izvorom niti procijenjena.
- **Primjer 2:** statement je izdvojen iz mejla, ali reviewer još nije provjerio attribution i scope.

### 12.2 `CONFIRMED_FROM_SOURCE`

**Normative definition:** Identifikovani izvor neposredno podržava precizno definisanu tvrdnju u navedenom obimu.

- **Preduslovi:** atomska tvrdnja, identifikovani Source Item, evidentiran relevantni dio/scope i pregled veze tvrdnja–izvor.
- **Predlaže:** sistem, budući AI ili član kancelarije, uvijek kao prijedlog sa porijeklom.
- **Potvrđuje:** ovlašćeni ljudski reviewer; sistem ne potvrđuje kritičnu činjenicu.
- **Znači:** izvor neposredno sadrži ili podržava upravo navedenu tvrdnju u evidentiranom obimu.
- **Ne znači:** autentičan ili pouzdan izvor; istinit sadržaj; pravno dokazana činjenica; odsustvo konflikta; advokatsko prihvatanje; uključivanje u verifikovano stanje.
- **Dozvoljeni prelazi:** iz `UNASSESSED` ili iz `ASSUMED` uz novi dokaz i audit; korekcija pogrešne klasifikacije samo auditabilno.
- **Zabranjeni prelazi:** automatski iz `ACCEPTED`, iz reputacije izvora ili bez Source Item-a; nema tihog prepisivanja statusa.
- **Audit:** ko je predložio i potvrdio, kada, izvor, scope, razlog i prethodna vrijednost.
- **Primjer 1:** ugovor neposredno navodi datum 5. maj; tvrdnja o tekstu datuma je potvrđena iz izvora, ne i nužno pravna valjanost ugovora.
- **Primjer 2:** mejl neposredno potvrđuje da je pošiljalac napisao određenu rečenicu; ne potvrđuje istinitost te rečenice.

### 12.3 `ASSUMED`

**Normative definition:** Tvrdnja se privremeno koristi kao eksplicitna radna pretpostavka bez dovoljne neposredne potvrde iz identifikovanog izvora.

- **Preduslovi:** precizan tekst, razlog pretpostavke, namjena i poznata ograničenja.
- **Predlaže:** advokat, član kancelarije, sistem ili budući AI uz jasno porijeklo.
- **Potvrđuje za upotrebu:** ovlašćeni reviewer kroz review osu; trust ostaje `ASSUMED`.
- **Znači:** pretpostavka je vidljiva i može se kontrolisano koristiti u navedenom radnom kontekstu.
- **Ne znači:** činjenica, potvrda iz izvora, pravna dokazanost ili Verified Fact.
- **Dozvoljeni prelazi:** iz `UNASSESSED`; u `CONFIRMED_FROM_SOURCE` tek nakon identifikovane neposredne podrške; auditabilna korekcija.
- **Zabranjeni prelazi:** automatski u `CONFIRMED_FROM_SOURCE` nakon `ACCEPTED`; skrivanje oznake u izlazu koji bi je predstavio kao činjenicu.
- **Audit:** predlagač, razlog, `accepted_for` ako je prihvaćena, reviewer, vrijeme i kasniji dokaz ili ishod.
- **Primjer 1:** klijent kaže da je ugovor potpisan, ali ugovor nije dostavljen.
- **Primjer 2:** za internu analizu se privremeno pretpostavlja datum uručenja, uz upozorenje da procesni rok nije potvrđen.

## 13. Review Model

| Status | Definicija | Dozvoljeni akteri i preduslovi | Posljedica |
|---|---|---|---|
| `PROPOSED` | objekat postoji kao prijedlog, bez odluke review authority-ja | sistem, budući AI ili čovjek može kreirati; porijeklo obavezno | ne postaje verifikovano ni operativno samo po sebi |
| `IN_REVIEW` | ovlašćeni reviewer je preuzeo konkretan objekat i namjenu na pregled | reviewer mora biti identifikovan; snapshot/version mora biti stabilan | izmjene sadržaja zahtijevaju novu verziju ili povratak u prijedlog |
| `ACCEPTED` | ovlašćeni reviewer prihvatio je konkretan objekat za jasno evidentiranu namjenu | obavezan prihvaćeni Review Record i `accepted_for` značenje | objekat je prihvaćen samo u tom scope-u |
| `REJECTED` | ovlašćeni reviewer je odbio konkretan objekat za evidentiranu namjenu | obavezan Review Record sa razlogom | objekat i trag ostaju; nema fizičkog brisanja |

**Normative:** `ACCEPTED` ne znači objektivno istinito, pravno dokazano, bez konflikta, uključeno u verifikovano stanje, odobreno klijentu niti pretvoreno iz pretpostavke u činjenicu.

**Normative:** Svaka review odluka odnosi se na konkretnu verziju objekta i konkretnu namjenu pregleda. `ACCEPTED` bez evidentirane namjene nije dovoljan završeni review rezultat. Isti objekat može biti prihvaćen za jednu namjenu, a odbijen ili još nepregledan za drugu. Trenutni `review_status` može biti izvedena projekcija samo u odnosu na jasno definisani review scope.

Direktni prelaz `PROPOSED` → `REJECTED` je dozvoljen kada ovlašćeni reviewer može neposredno odbiti prijedlog. Review Record mora identifikovati target objekat i verziju, reviewera i authority, razlog, scope i vrijeme. `IN_REVIEW` nije ritualna tranzicija, nego stvarno stanje započetog i nezavršenog pregleda.

`accepted_for` mora evidentirati namjenu, npr. „interna radna analiza“, „osnova za nacrt pitanja“ ili „kandidat za verifikovano stanje“. **Open decision:** da li će kasnije biti kontrolisani rječnik, strukturisani opis ili kombinacija; VLA-0A ga ne zaključava kao enum.

Ponovno otvaranje `ACCEPTED` ili `REJECTED` objekta zahtijeva novi Review Record sa razlogom. Prethodni Review Record ostaje nepromijenjen. `reviewed_at`, `reviewed_by` i `review_note` na samom objektu mogu biti samo izvedeni prikaz posljednjeg relevantnog Review Record-a.

## 14. Lifecycle Model

| Status | Definicija | Autoritet i preduslovi | Terminalnost |
|---|---|---|---|
| `ACTIVE` | aktuelna verzija objekta u redovnom workflowu | kreiranje sa audit identitetom | nije terminalan |
| `SUPERSEDED` | verzija je zamijenjena identifikovanom novijom verzijom | obavezna dvosmjerna supersession veza i razlog | terminalan za tu verziju u redovnom workflowu |
| `WITHDRAWN` | autor/ovlašćeni akter povukao je objekat iz dalje upotrebe | razlog i audit zapis | terminalan za tu verziju; nova verzija je moguća |
| `VOIDED` | objekat kao zapis nije smio proizvoditi pravno ili operativno dejstvo zbog dokumentovane proceduralne nevalidnosti | povišeni autoritet i korektivni audit zapis | terminalan za tu verziju |

**Normative:** `SUPERSEDED` nije review status i ne znači netačno, opovrgnuto, odbijeno, povučeno, poništeno ili izbrisano. Lifecycle ne briše review istoriju. Pregledani, prihvaćeni, odbijeni, primijenjeni, povučeni ili zamijenjeni objekti ne smiju se fizički brisati u redovnom workflowu.

**Normative:** `VOIDED` označava da objekat kao zapis nije smio proizvoditi pravno ili operativno dejstvo zbog dokumentovane greške u kreiranju, duplikata, pogrešnog targeta ili druge proceduralne nevalidnosti. Ne znači nužno činjenično netačno, opovrgnuto, review-odbijeno, povučeno niti dozvoljeno brisanje istorije.

**Normative:** Supersession je konceptualno relacija koja mora podržati najmanje 1:1, 1:N i N:1 odnose. Ovo obuhvata atomizaciju jedne preširoke assertion u više novih assertions i objedinjavanje više ranijih assertions u jednu precizniju verziju. Tehnička reprezentacija ostaje za kasniji WP/ADR.

Nova formulacija nastaje kao novi objekat/verzija; stara ostaje čitljiva i povezana. Tihi overwrite je zabranjen. Eventualno fizičko brisanje može postojati samo kao zasebna administrativna ili zakonska procedura sa audit tragom, van VLA-0A.

## 15. Decision Model

`DECISION_REQUEST` je zaseban primarni objekat. `DECISION_REQUIRED` nije trust status i nije usvojeni decision status.

Korisnička oznaka „Potrebna odluka“ iz Registra I8 ostaje dozvoljena kao vidljivi indikator da postoji otvoreni `DECISION_REQUEST` u statusu `PENDING_DECISION`. Ona nije treća trust vrijednost i ne smije se čuvati kao zamjena za pitanje, authority ili decision status.

| Status | Značenje |
|---|---|
| `PENDING_DECISION` | odluka je potrebna, authority i pitanje su identifikovani, odluka nije donesena |
| `DECIDED` | identifikovani authority je donio i evidentirao odluku |
| `DEFERRED` | authority je izričito odložio odluku uz razlog i uslov/vrijeme ponovnog razmatranja |
| `CANCELLED` | potreba za odlukom je prestala uz evidentiran razlog; odluka nije donesena |

**Normative:** Direktni prelaz `DEFERRED` → `CANCELLED` je dozvoljen kada je potreba za odlukom prestala tokom odlaganja. Audit mora sadržati decision authority, razlog, datum/vrijeme i, kada postoji, vezu ka događaju ili objektu zbog kojeg je potreba prestala.

Razgraničenja:

- advokat donosi pravnu preporuku i odluke za koje je pravno ovlašćen;
- partner ili nadležni advokat odlučuje kada interna pravila zahtijevaju eskalaciju;
- klijent donosi identifikovanu klijentsku ili poslovnu odluku, npr. prihvatanje poravnanja;
- procesna odluka mora imati odgovarajućeg advokatskog authority-ja;
- kod žalbe i drugih pravnih lijekova odvojeni su pravni zaključak o postojanju osnova, pravna/procesna preporuka advokata, procesna odluka u okviru punomoćja i profesionalnih pravila, instrukcija ili poslovna odluka klijenta i izvršenje kroz `LEGAL_ACTION`;
- konkretni decision authority zavisi od vrste odluke, punomoćja, profesionalnih pravila i instrukcija klijenta;
- sistemski ili AI prijedlog je opcija, ne odluka;
- izvršenje već donesene odluke je odvojena `LEGAL_ACTION` ili drugi operativni objekat.

## 16. Verified Fact Qualification

Verified Fact nije zaseban primarni objekat. To je kvalifikovano stanje ili projekcija isključivo `MATTER_ASSERTION` objekta sa `assertion_kind = FACTUAL_CLAIM`.

**Normative:** Samo `MATTER_ASSERTION` sa `assertion_kind = FACTUAL_CLAIM` može neposredno biti kvalifikovan kao Verified Fact. `ATTRIBUTED_STATEMENT` može podržati zaseban `FACTUAL_CLAIM` da je određeno lice dalo određenu izjavu, ali istinitost sadržaja izjave zahtijeva drugi, zaseban `FACTUAL_CLAIM`. `FACTUAL_INFERENCE`, `LEGAL_CHARACTERIZATION`, `LEGAL_OPINION` i `PARTY_POSITION` mogu biti pregledani i prihvaćeni za odgovarajuću namjenu, ali ne mogu postati Verified Fact.

**Normative:** Minimalni konceptualni uslovi su:

1. precizna, atomska assertion sa `assertion_kind = FACTUAL_CLAIM`;
2. najmanje jedan identifikovan `SOURCE_ITEM`;
3. evidentiran scope neposredne podrške;
4. razlikovanje postojanja izjave od istinitosti njenog sadržaja;
5. pregled ovlašćenog advokata;
6. odgovarajući prihvaćeni `REVIEW_RECORD`;
7. nema neriješenog materijalnog konflikta koji sprečava kvalifikaciju;
8. objekat nije `REJECTED`, `WITHDRAWN`, `VOIDED` ili `SUPERSEDED`;
9. kasnije kontrolisano uključivanje kroz odobreni `CHANGE_SET` nakon definisanja VLA-0D.

`CONFIRMED_FROM_SOURCE` sam nije dovoljan. `ACCEPTED` sam nije dovoljan. Prihvaćena pretpostavka ne postaje automatski Verified Fact.

## 17. Object Taxonomy

| Tehnički naziv | Srpski UI | English UI | Svrha | Relevantne ose |
|---|---|---|---|---|
| `SOURCE_ITEM` | Izvorna stavka | Source item | identitet i provenijencija izvora | lifecycle; kasniji operational |
| `MATTER_ASSERTION` | Tvrdnja predmeta | Matter assertion | atomska pravno relevantna propozicija; samo `FACTUAL_CLAIM` može biti Verified Fact | assertion, trust, review, lifecycle |
| `DECISION_REQUEST` | Zahtjev za odluku | Decision request | eksplicitna potreba za odlukom i authority | decision, lifecycle; review po potrebi |
| `LEGAL_ACTION` | Pravna radnja | Legal action | planirano ili izvršeno postupanje | review, lifecycle, operational |
| `DEADLINE` | Rok | Deadline | ručno unesen i ljudski potvrđen datum/obaveza | review, lifecycle, operational |
| `EXPECTED_OUTPUT` | Očekivani rezultat | Expected output | definisan izlaz radnje ili workflowa | review, lifecycle, operational |
| `REVIEW_RECORD` | Zapis pregleda | Review record | autoritativni, nepromjenjivi audit pregleda | append-only audit; korekcija novim zapisom |
| `CHANGE_SET` | Skup promjena | Change set | buduća kontrolisana primjena odobrenih promjena | review/lifecycle/operational, detalji VLA-0D |
| `CLIENT_ACTION_PACK` | Paket za postupanje klijenta | Client action pack | budući kontrolisani paket odobren za klijenta | review/lifecycle/operational, detalji VLA-0G |

### 17.1 `DECISION_REQUEST`

- **Jeste:** precizno pitanje, opcije/kontekst, authority i decision status.
- **Nije:** sama odluka, trust oznaka ili pravna radnja izvršenja.
- **Obavezno:** identitet, predmet, pitanje, decision authority, `PENDING_DECISION`, lifecycle, autor/vrijeme.
- **Opciono:** opcije, preporuka advokata, povezani izvori/tvrdnje, due context bez automatskog roka.
- **Osnovni akteri:** član kancelarije ili sistem predlaže request; identifikovani advokat, partner ili klijent odlučuje prema vrsti pitanja.
- **Autoritativno:** pitanje, authority, odluka i njen zapis, status istorija.
- **Izvedeno:** UI sažetak ili „čeka odluku“ indikator.
- **Primjer:** klijent odlučuje da li prihvata poravnanje.

### 17.2 `LEGAL_ACTION`

- **Jeste:** identifikovana pravna ili operativna radnja poslije odgovarajućeg pregleda/odluke.
- **Nije:** odluka, rok ili automatska preporuka.
- **Obavezno:** identitet, predmet, naziv/opis, odgovorni akter, lifecycle i audit porijeklo.
- **Opciono:** povezani Decision Request, Deadline, Expected Output i source/assertion veze.
- **Osnovni akteri:** advokat odobrava pravnu radnju; odgovorni član kancelarije je priprema ili izvršava u okviru ovlašćenja.
- **Autoritativno:** odobreni sadržaj i statusni događaji.
- **Izvedeno:** attention indicator i zbirni prikaz.
- **Primjer:** „Pripremiti žalbu“ nakon što su odvojeno evidentirani pravni zaključak, preporuka, konkretni decision authority i odgovarajuća odluka/instrukcija.

### 17.3 `DEADLINE`

- **Jeste:** datum/obaveza koju korisnik unosi i potvrđuje prema Registru I7.
- **Nije:** sistemski izračun procesnog roka niti tvrdnja da je datum pravno tačan.
- **Obavezno:** identitet, predmet, datum, opis, ljudska potvrda i odgovorni akter; detaljna polja pripadaju VLA-0F.
- **Opciono:** veza na izvor, Decision Request ili Legal Action.
- **Osnovni akteri:** sistem može upozoriti ili prikazati prijedlog; ovlašćeni korisnik unosi, a advokat potvrđuje procesno relevantan rok.
- **Autoritativno:** korisnički potvrđeni datum i istorija izmjena.
- **Izvedeno:** upozorenje na neradni dan ili attention status.
- **Primjer:** advokat ručno unosi i potvrđuje datum za žalbu; sistem ga nije izračunao.

### 17.4 `EXPECTED_OUTPUT`

- **Jeste:** jasno definisan rezultat koji radnja treba da proizvede.
- **Nije:** dokaz da je rezultat ostvaren niti dokument sam po sebi.
- **Obavezno:** identitet, predmet, opis izlaza, lifecycle, autor/vrijeme.
- **Opciono:** acceptance uslovi, veza na Legal Action i rezultat.
- **Osnovni akteri:** owner radnje predlaže; reviewer/odgovorni advokat odobrava očekivanje kada je pravno relevantno.
- **Autoritativno:** odobren opis očekivanog izlaza i revizije.
- **Izvedeno:** progress prikaz.
- **Primjer:** „Pregledan nacrt pravnog mišljenja u Wordu“.

### 17.5 `REVIEW_RECORD`

- **Jeste:** autoritativni audit zapis odluke review authority-ja o konkretnoj verziji objekta i namjeni.
- **Nije:** prepisivo polje „posljednji reviewer“.
- **Obavezno:** identitet, target object/version, prethodni i novi review status, reviewer/authority, konkretni review scope/namjena, vrijeme, razlog ili bilješka, `accepted_for` kada je relevantno.
- **Opciono:** conflict disposition, uslovi, link na prethodni Review Record.
- **Osnovni akteri:** ovlašćeni reviewer stvara odluku pregleda; sistem samo pouzdano zapisuje i prikazuje audit.
- **Autoritativno:** cijeli zapis; naknadna korekcija se dodaje novim zapisom.
- **Izvedeno:** `reviewed_at`, `reviewed_by`, `review_note` prikaz na objektu.
- **Primjer:** advokat prihvata `ASSUMED` tvrdnju samo za internu radnu analizu.

### 17.6 `CHANGE_SET`

- **Jeste:** budući kontrolisani omotač za pregled i primjenu grupe promjena.
- **Nije:** implementiran engine niti dozvola za trajnu promjenu u VLA-0A.
- **Obavezni koncepti:** identitet, predmet, predložene promjene, proposer, review/approval trag i rezultat primjene; konkretna polja definiše VLA-0D.
- **Opciono:** povezani Decision Requests, Review Records, obrazloženje i sažetak uticaja; VLA-0D odlučuje tačan minimum.
- **Osnovni akteri:** sistem ili čovjek priprema; ovlašćeni reviewer odobrava; budući writer primjenjuje tek poslije odobrenja.
- **Autoritativno:** odobrenje i rezultat primjene kada bude implementiran.
- **Izvedeno:** sažetak uticaja.
- **Primjer:** odobreno uključivanje više pregledanih tvrdnji u stanje predmeta.

### 17.7 `CLIENT_ACTION_PACK`

- **Jeste:** budući eksplicitno pregledan skup materijala namijenjen klijentu.
- **Nije:** svaki `ACCEPTED` objekat niti automatski export.
- **Obavezni koncepti:** identitet, predmet, namjena, sadržaj, reviewer/approver i verzija; detalji pripadaju VLA-0G.
- **Opciono:** rok za odgovor, uputstvo, povezani Expected Outputs i Decision Requests; ništa od toga se ne zaključava u VLA-0A.
- **Osnovni akteri:** član kancelarije priprema; ovlašćeni advokat posebno odobrava sadržaj za klijenta; klijent postupa ili odlučuje.
- **Autoritativno:** tačno odobren sadržaj i approval trag.
- **Izvedeno:** prikaz paketa.
- **Primjer:** paket sa pitanjima i dokumentima koje klijent treba da dostavi.

## 18. Review Record

**Normative:** Review Record je jedini autoritativni audit zapis pregleda. Novi pregled dodaje novi zapis. Ne mijenja niti briše prethodni.

Minimalno mora omogućiti odgovor: ko je pregledao koju verziju objekta, kada, iz kog statusa u koji status, za koju namjenu, sa kojim razlogom i pod kojim ovlašćenjem. Ako se pregled ponovo otvori, novi Review Record povezuje se sa prethodnim, ali ga ne poništava retroaktivno.

## 19. Change Set Boundary

**Out of scope:** VLA-0D definiše sadržaj, validaciju, atomic primjenu i recovery Change Set-a. VLA-0A zaključava samo da trajna primjena prijedloga i konačno uključivanje u verifikovano stanje zahtijevaju kasnije odobreni Change Set. Nema prečice iz review statusa direktno u file-first stanje.

## 20. Client Action Pack Boundary

**Normative:** `ACCEPTED` ne znači „odobreno za klijenta“. Uključivanje u `CLIENT_ACTION_PACK` zahtijeva poseban, auditabilan scope pregleda. VLA-0G određuje workflow, sadržaj i zaštite.

## 21. Minimal Common Metadata

Jedna univerzalna implementaciona bazna šema se ne usvaja. Kandidati se klasifikuju konceptualno:

| Polje | Klasifikacija | Autoritet / napomena | Vidljivo u budućem Markdownu |
|---|---|---|---|
| `id` | univerzalno obavezno | autoritativni stabilni identitet | da |
| `matter_id` | univerzalno obavezno osim workspace-level objekta | autoritativna veza na predmet | da |
| `object_type` | univerzalno obavezno | autoritativno | da |
| `title` | univerzalno opciono; za neke objekte obavezno | autoritativno po verziji | uglavnom da |
| `summary` | univerzalno opciono | autoritativno ako ga korisnik odobri; inače izvedeno | označiti porijeklo |
| `created_at` | univerzalno obavezno audit polje | autoritativno | da |
| `created_by` | univerzalno obavezno audit polje | autoritativno | da |
| `generator_type` | univerzalno obavezno kada generator nije isto što i autor | autoritativno porijeklo | da |
| `lifecycle_status` | obavezno za verzionisane primarne objekte | autoritativno kroz audit događaje | da |
| `trust_status` | objektno-specifično za assertions | autoritativna procjena; može biti neprocijenjeno | da kada je primjenjivo |
| `review_status` | objektno-specifično | autoritativno preko Review Record-a; trenutna vrijednost je izvedena projekcija samo za definisani review scope | da kada je primjenjivo |
| `source_links` | objektno-specifično | veze su autoritativne; prikaz može biti izveden | da za assertions |
| `reviewed_at/by/note` | izvedeno | ne usvajati kao primarni autoritet objekta | samo kao izvedeni prikaz |
| `supersedes_id` / `superseded_by_id` | kandidati za objektno-specifična lifecycle polja | ne usvajaju singularnu šemu; relacija mora podržati 1:1, 1:N i N:1 | da |
| `created_change_set_id` | kasniji WP | VLA-0D | odluka VLA-0D |
| `last_change_set_id` | kasniji WP; vjerovatno izvedeno | ne zaključavati | odluka VLA-0D |

## 22. Object-Specific Metadata

| Objekat | Objektno-specifični minimum |
|---|---|
| `SOURCE_ITEM` | origin/provenance, file-first referenca, source kind, relevantni scope |
| `MATTER_ASSERTION` | assertion text, assertion kind, trust assessment ili neprocijenjeno, source links, attribution kada postoji |
| `DECISION_REQUEST` | pitanje, decision authority, decision status, odluka/razlog kada je donesena |
| `LEGAL_ACTION` | odgovorni akter, opis radnje, operativni status kasnije |
| `DEADLINE` | korisnički unesen datum, potvrđujući korisnik, veza na osnov; VLA-0F razrađuje |
| `EXPECTED_OUTPUT` | opis izlaza i veza na radnju/workflow |
| `REVIEW_RECORD` | target version, transition, reviewer, authority, time, purpose, note |
| `CHANGE_SET` | predložene promjene, review i rezultat primjene; VLA-0D razrađuje |
| `CLIENT_ACTION_PACK` | namjena, sadržaj, verzija i posebno odobrenje; VLA-0G razrađuje |

## 23. Authoritative and Derived Data

**Normative:** Autoritativni podaci moraju ostati u čitljivom file-first zapisu. Indeks ili UI projekcija su odbacivi.

Autoritativni su najmanje: identiteti, verzionisani sadržaj objekta, source veze, attribution, statusni događaji, odluke, Review Records, supersession relacije i Change Set trag kada bude definisan. Izvedeni su: „posljednji reviewer“, zbirni attention/conflict indikator, search tokeni, posljednji prikazni status i eligibility projekcije koje se mogu obnoviti iz autoritativnih zapisa.

## 24. Source Conflict

Konflikt izvora nije trust status. To je evidenciona okolnost ili relacija između Source Item-a i/ili Assertions.

**Normative:** Sistem prikazuje sve konfliktne vrijednosti i traži ljudski pregled; ne bira pobjednika. Konflikt mora identifikovati zahvaćene atomske tvrdnje, izvore i materijalnost za konkretnu namjenu. Puna evidence arhitektura pripada VLA-0B.

**Normative:** Materijalni konflikt je neriješeno neslaganje koje može uticati na verifikovano stanje predmeta, pravnu kvalifikaciju, rok, odgovornost, pravnu radnju, očekivani output ili komunikaciju sa klijentom. Sistem ne određuje samostalno koji je izvor tačan. Detaljna evidence i conflict arhitektura ostaje za VLA-0B.

## 25. Partial Confirmation and Atomic Assertions

Djelimična potvrda nije automatski novi trust status. Preširoka tvrdnja se razlaže na atomske tvrdnje.

Primjer: „Ugovor je potpisan 5. maja i cijena je 10.000 EUR“ razlaže se najmanje na tvrdnju o potpisu, datumu i cijeni. Svaka dobija sopstveni source scope, trust procjenu i review trag.

## 26. Correction, Refutation and Supersession

- **Ispravka:** nova verzija precizno popravlja grešku; stara postaje `SUPERSEDED` ili, kod nevažećeg zapisa, `VOIDED` uz audit.
- **Opovrgavanje:** novi izvor podržava kontradiktornu tvrdnju; to je relacija/evidencioni rezultat, ne lifecycle status.
- **Supersession:** novija formulacija ili verzija zamjenjuje staru; ne tvrdi da je stara bila netačna.
- **Rejection:** reviewer nije prihvatio objekat za namjenu; to je review osa.
- **Withdrawal:** ovlašćeni akter povlači objekat; to je lifecycle osa.

Ranije prihvaćena tvrdnja opovrgnuta novim izvorom ne smije biti tiho prepravljena. Mora se evidentirati novi Source Item/assertion, konflikt ili refutation relacija, novi pregled i, po potrebi, superseding verzija.

## 27. Deletion and Retention Principles

**Normative:** Nema fizičkog brisanja pregledanih, prihvaćenih, odbijenih, primijenjenih, povučenih ili zamijenjenih objekata u redovnom workflowu. Nema tihog overwrite-a. Lifecycle i Review Records čuvaju trag.

Izuzetna administrativna ili zakonska procedura fizičkog brisanja mora imati zaseban authority i audit model; ona nije projektovana ovdje.

## 28. Serbian–English–Technical Glossary

| Srpski UI | English UI | Tehnički naziv |
|---|---|---|
| Činjenična tvrdnja | Factual claim | `FACTUAL_CLAIM` |
| Izjava lica | Attributed statement | `ATTRIBUTED_STATEMENT` |
| Izvedeni činjenični zaključak | Factual inference | `FACTUAL_INFERENCE` |
| Pravna kvalifikacija | Legal characterization | `LEGAL_CHARACTERIZATION` |
| Pravno mišljenje | Legal opinion | `LEGAL_OPINION` |
| Stav stranke | Party position | `PARTY_POSITION` |
| Potvrđeno iz izvora | Confirmed from source | `CONFIRMED_FROM_SOURCE` |
| Pretpostavljeno | Assumed | `ASSUMED` |
| Potrebna odluka | Decision required indicator | nije trust status; predstavlja potrebu za `DECISION_REQUEST` |
| Odluka na čekanju | Pending decision | `PENDING_DECISION` |
| Odlučeno | Decided | `DECIDED` |
| Odloženo | Deferred | `DEFERRED` |
| Otkazano | Cancelled | `CANCELLED` |
| Verifikovana činjenica | Verified fact | kvalifikacija/projekcija `MATTER_ASSERTION`; nije object type |
| Prihvaćeno za | Accepted for | `accepted_for` koncept; implementacioni oblik otvoren |

## 29. Worked Examples

### 29.1 Izvor potvrđuje postojanje izjave

Mejl navodi: „Roba je predata 3. maja.“ Jedan `ATTRIBUTED_STATEMENT` može glasiti: „Druga strana je izjavila da je roba predata 3. maja.“ Izvor neposredno podržava tu izjavu. Poseban `FACTUAL_CLAIM` „Roba je predata 3. maja“ ne dobija automatski isti trust status.

### 29.2 Prihvaćena pretpostavka

Advokat prihvata `ASSUMED` datum samo za pripremu liste pitanja klijentu. Review Record navodi `accepted_for: interna priprema pitanja`. Trust ostaje `ASSUMED`; tvrdnja nije Verified Fact i ne ulazi automatski u rok.

### 29.3 Pravna kvalifikacija

Iste činjenice mogu ostati nepromijenjene dok nova `LEGAL_CHARACTERIZATION` zamjenjuje raniju. Stara kvalifikacija postaje `SUPERSEDED`; činjenice se ne mijenjaju i supersession ne znači da je stara kvalifikacija bila neprofesionalna ili lažna.

## 30. Edge Cases

| # | Slučaj | Object / assertion | Statusi i authority | Rezultat | Sistem ne smije zaključiti |
|---:|---|---|---|---|---|
| 1 | Mejl druge strane navodi spornu činjenicu | `SOURCE_ITEM`; `ATTRIBUTED_STATEMENT`; zaseban `FACTUAL_CLAIM` | izjava može podržati claim o postojanju izjave; claim o istinitosti ostaje `UNASSESSED`/`ASSUMED`; reviewer advokat | odvojene tvrdnje i review | da je sadržaj istinit |
| 2 | Klijent tvrdi da je ugovor potpisan, ugovor nije dostavljen | `MATTER_ASSERTION` / `ATTRIBUTED_STATEMENT` i eventualni claim | `ASSUMED`, `PROPOSED` ili `ACCEPTED` samo za radnu namjenu, `ACTIVE` | tražiti ugovor | da je potpis dokazan |
| 3 | Službena isprava možda sadrži netačan podatak | `SOURCE_ITEM` + `FACTUAL_CLAIM` | može `CONFIRMED_FROM_SOURCE`; review odvojen | izvor neposredno navodi podatak | da je službeni podatak nužno tačan |
| 4 | Dva izvora imaju konfliktne datume | dva Source Item-a i dvije atomske tvrdnje | oba mogu `CONFIRMED_FROM_SOURCE`; conflict relacija; advokat | prikaz oba i pregled | izabrati datum bez odluke |
| 5 | Složena tvrdnja potvrđena je djelimično | više `FACTUAL_CLAIM` objekata | trust po atomskom dijelu | razložiti tvrdnju | uvesti „partially confirmed“ kao prečicu |
| 6 | Advokat prihvata pretpostavku za internu analizu | `MATTER_ASSERTION` / odgovarajući kind | `ASSUMED` + `ACCEPTED`, `accepted_for` interna analiza, `ACTIVE` | dozvoljena ograničena upotreba | pretvoriti je u činjenicu |
| 7 | Ranije prihvaćena činjenica je opovrgnuta | novi Source Item i kontradiktorna assertion | novi review; stara može ostati accepted istorijski, zatim superseded/voided po razlogu | auditabilna korekcija i konflikt | tiho promijeniti staru tvrdnju |
| 8 | Preciznija formulacija zamjenjuje raniju | nova verzija `MATTER_ASSERTION` | nova `ACTIVE`; stara `SUPERSEDED`; review nove verzije | dvosmjerna veza verzija | izbrisati staru formulaciju |
| 9 | Advokat mijenja pravnu kvalifikaciju | dvije `LEGAL_CHARACTERIZATION` assertions | nova prolazi review; stara `SUPERSEDED`; nijedna nije Verified Fact | činjenice ostaju iste | mijenjati factual claims ili kvalifikaciju predstaviti kao činjenicu |
| 10 | Klijent odlučuje o poravnanju | `DECISION_REQUEST` | `PENDING_DECISION` → `DECIDED`; authority klijent | odluka klijenta se evidentira; advokatova preporuka odvojeno | odlučiti umjesto klijenta |
| 11 | Razmatra se žalba ili drugi pravni lijek | `LEGAL_OPINION`, `DECISION_REQUEST`, zatim eventualni `LEGAL_ACTION` | authority zavisi od vrste odluke, punomoćja, profesionalnih pravila i instrukcija klijenta | odvojiti pravni zaključak, preporuku, odluku/instrukciju i izvršenje | pretpostaviti da advokat ili sistem uvijek samostalno odlučuje o podnošenju |
| 12 | Sistem predlaže rok | prijedlog kandidata; kasnije `DEADLINE` tek nakon potvrde | proposal bez autoritativnog roka; authority advokat | datum ne utiče na attention prije potvrde | potvrditi ili izračunati procesni rok |
| 13 | Javni registar kasnije ispravlja podatak | dva Source Item stanja / dvije assertions | novi claim i source; review; supersession/refutation prema činjenicama | čuva se istorija i ispravka | prepisati raniji izvorni zapis |
| 14 | Jedan izvor potvrđuje izjavu, drugi osporava sadržaj | `ATTRIBUTED_STATEMENT` podržava zaseban `FACTUAL_CLAIM` o davanju izjave; drugi claim se odnosi na sadržaj | claim o postojanju izjave može biti confirmed; claim o istinitosti je odvojen i konfliktan | dvije odvojene procjene | prenijeti trust sa postojanja izjave na sadržaj |
| 15 | Prihvaćen objekat nije odobren za Client Action Pack | bilo koji reviewable objekat | `ACCEPTED` za internu namjenu; nema pack approval | ostaje van paketa | izjednačiti acceptance sa client approval |

## 31. Rejected Alternatives

Odbacuju se:

- jedan kombinovani status za trust, review, lifecycle i decision;
- `ASSUMPTION` kao zaseban primarni object type;
- `VERIFIED_FACT` kao zaseban primarni object type;
- `DECISION_REQUIRED` kao trust status;
- `SUPERSEDED` kao review status;
- automatska transformacija `ASSUMED` u činjenicu nakon `ACCEPTED`;
- mutable „last review“ polja kao zamjena za Review Record;
- „partial confirmation“ kao prečica umjesto atomizacije;
- fizičko brisanje istorijskih objekata u redovnom workflowu.

## 32. Open Decisions

Milovan treba da potvrdi prije odgovarajućeg implementacionog WP-a:

1. implementacioni oblik `accepted_for` i početni kontrolisani rječnik namjena;
2. kancelarijsku matricu reviewer/decision authority-ja i prag eskalacije partneru;
3. početne `origin_type`, `generator_type` i attribution kontrolisane rječnike;
4. objektno-specifične operational statuse u VLA-0B–0G;
5. detaljne kriterijume materijalnosti konflikta za Verified Fact eligibility;
6. prikaz autoritativnih i izvedenih polja i audit događaja u budućem Markdown formatu;
7. Change Set granularnost za pojedinačne i grupne statusne promjene;
8. policy za izuzetno fizičko brisanje, ako pravna obaveza ikad zahtijeva tu proceduru;
9. tehničku reprezentaciju 1:1, 1:N i N:1 supersession relacija.

## 33. Acceptance Criteria

Dokument je prihvatljiv kada:

- svih osam semantičkih osa ostaje odvojeno;
- definisano je svih devet obaveznih object type-ova;
- assertion kind rječnik sadrži šest odobrenih vrijednosti;
- `UNASSESSED` je normativni početni trust status i nije sinonim za nepouzdano, sumnjivo, assumed ili konfliktno;
- `DECISION_REQUIRED` nije trust status;
- `SUPERSEDED` je isključivo lifecycle status;
- `ACCEPTED` je ograničen evidentiranom namjenom;
- Verified Fact i Assumption nijesu primarni objekti;
- samo `FACTUAL_CLAIM` assertion može neposredno biti kvalifikovan kao Verified Fact;
- Review Record je autoritativan i append-only;
- svih 15 edge cases ima authority, statusni ishod i zabranjen sistemski zaključak;
- nema implementacione šeme, workspace pristupa ili izmjene B0 foundationa.

## 34. Relationship to Later VLA Work Packages

| Paket | Namjerno prenesena tema |
|---|---|
| VLA-0B | Source Registry, source identity, provenance, conflict/refutation relacije i operational status izvora |
| VLA-0C | Matter State projekcije, Verified Fact prikaz i izvedeni state bez gubitka file-first autoriteta |
| VLA-0D | Change Set sadržaj, validacija, approval, atomic primjena, recovery i audit |
| VLA-0E | Review Workspace i konkretan human-confirmation workflow |
| VLA-0F | Deadline model, ručna potvrda, upozorenje na neradni dan i zabrana automatskog računanja |
| VLA-0G | Client Action Pack sastav, poseban approval i izvoz |
| VLA-0H | ADR odluke, konačne šeme, authority policy i unresolved terminology odluke |

Desktop foundation iz WP 0C-B0 ostaje nepromijenjen. Ovaj dokument ne odobrava B1 niti bilo koju poslovnu ili filesystem implementaciju.
