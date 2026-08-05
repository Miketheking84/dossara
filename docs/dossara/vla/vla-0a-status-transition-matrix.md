# DOSSARA — WP VLA-0A Status Transition Matrix

## 1. Document Control

| Polje | Vrijednost |
|---|---|
| Dokument | WP VLA-0A — Status Transition Matrix |
| Status | Dokumentacioni baseline za pregled naručioca |
| Datum | 5. avgust 2026. |
| Repository branch | `spike/phase-0c-electron-forge-webpack` |
| Početni repository HEAD | `166d92dbf4151f815c754e611fb9b090dabac3c6` |
| Normativni terminološki par | `vla-0a-terminology-and-trust-model.md` |
| Formalni kontrolni akt | `docs/dossara/decision-alignment-register-v1.2.md` |
| Vrsta rada | Documentation-only; matrica nije implementaciona state-machine šema |

## 2. Purpose

Ovaj dokument određuje semantički dozvoljene i zabranjene statusne prelaze za VLA objekte. Matrice štite razdvajanje trust, review, lifecycle i decision osa, ljudski autoritet, nepromjenjiv audit trag i zabranu tihog prepisivanja.

**Normative:** Dozvoljen prelaz ne znači da ga sistem smije samostalno izvršiti. Potrebni authority, preduslovi, Review Record ili drugi audit zapis moraju postojati prije trajne primjene kroz budući kontrolisani Change Set tok.

## 3. Actors and Authority

| Oznaka u matrici | Akter | Ovlašćenje |
|---|---|---|
| Predlagač | sistem, budući AI ili čovjek | kreira prijedlog i porijeklo; nema konačni review/decision authority |
| Član kancelarije | ovlašćeni neadvokatski korisnik | unos, povezivanje i priprema za pregled |
| Reviewer advokat | advokat sa ovlašćenjem za konkretni objekat/scope | prihvata, odbija ili ponovo otvara pregled |
| Nadležni advokat / partner | viši authority prema internoj matrici | eskalirane pravne/procesne odluke i korektivni pregled |
| Klijent | identifikovani klijentski authority | klijentske ili poslovne odluke, ne pravne kvalifikacije |
| Tehnički administrator | poseban tehnički authority | samo buduća izuzetna administrativna procedura; nije redovni reviewer |

**Normative:** Sistem i AI nikad nijesu finalni review ili decision authority. Svaki `DECISION_REQUEST` identifikuje konkretnog authority-ja ili authority ulogu prije prelaza u `DECIDED`.

## 4. Status Axes

| Osa | Kontrolisane vrijednosti u VLA-0A | Ne smije se koristiti za |
|---|---|---|
| Trust / Epistemic | `UNASSESSED`, `CONFIRMED_FROM_SOURCE`, `ASSUMED` | review, konflikt, decision ili lifecycle |
| Review | `PROPOSED`, `IN_REVIEW`, `ACCEPTED`, `REJECTED` | istinitost, trust ili supersession |
| Lifecycle | `ACTIVE`, `SUPERSEDED`, `WITHDRAWN`, `VOIDED` | acceptance, refutation ili decision |
| Decision | `PENDING_DECISION`, `DECIDED`, `DEFERRED`, `CANCELLED` | trust ili review objekta |
| Operational | objektno-specifično, nije zaključano u VLA-0A | zamjenu bilo koje gornje ose |

`DECISION_REQUIRED` nije usvojeni trust status. Potreba za odlukom modeluje se `DECISION_REQUEST` objektom sa `PENDING_DECISION`. `SUPERSEDED` je isključivo lifecycle status.

UI oznaka „Potrebna odluka“ iz Registra I8 može biti izvedeni indikator povezanog `DECISION_REQUEST` objekta. Ne predstavlja treću trust vrijednost i ne zamjenjuje autoritativno pitanje, decision authority ili decision status.

## 5. Object-Type Applicability Matrix

Legenda: **O** obavezna osa, **U** uslovno primjenjiva, **—** ne primjenjuje se direktno, **K** kasniji WP definiše vocabulary.

| Object Type | Assertion Kind | Trust | Review | Lifecycle | Operational | Decision | Authority napomena |
|---|---:|---:|---:|---:|---:|---:|---|
| `SOURCE_ITEM` | — | — | U | O | K / VLA-0B | — | advokat određuje pravnu relevantnost; source ne postaje istinit pregledom |
| `MATTER_ASSERTION` | O | O/U | O | O | U | — | trust zavisi od assertion kind-a; samo `FACTUAL_CLAIM` može biti Verified Fact |
| `DECISION_REQUEST` | — | — | U | O | U | O | decision authority obavezan; review prijedloga nije sama odluka |
| `LEGAL_ACTION` | — | — | O | O | K | U preko linka | izvršenje slijedi odluku/odobrenje, ne zamjenjuje ga |
| `DEADLINE` | — | U preko assertion/source veze | O | O | K / VLA-0F | U preko linka | korisnik/advokat ručno potvrđuje; sistem ne računa rok |
| `EXPECTED_OUTPUT` | — | — | O | O | K | U preko linka | acceptance definiše očekivanje, ne ostvarenje |
| `REVIEW_RECORD` | — | — | — | — | — | — | standardne statusne ose nijesu primjenjive |
| `CHANGE_SET` | — | — | O | O | K / VLA-0D | U | primjena nije definisana u VLA-0A |
| `CLIENT_ACTION_PACK` | — | — | O | O | K / VLA-0G | U | zahtijeva poseban client-facing approval scope |

Za `REVIEW_RECORD`, Trust, Review, standardna Lifecycle osa i Operational nijesu primjenjivi. Njegovo audit ponašanje je append-only / immutable; korekcija je dozvoljena isključivo novim povezanim zapisom.

Samo `MATTER_ASSERTION` sa `assertion_kind = FACTUAL_CLAIM` može neposredno biti Verified Fact. `ATTRIBUTED_STATEMENT` može podržati zaseban factual claim da je određeno lice dalo izjavu, ali ne i istinitost njenog sadržaja. `FACTUAL_INFERENCE`, `LEGAL_CHARACTERIZATION`, `LEGAL_OPINION` i `PARTY_POSITION` mogu biti pregledani i prihvaćeni za određenu namjenu, ali ne postaju činjenice. Za `LEGAL_CHARACTERIZATION` i `LEGAL_OPINION`, `CONFIRMED_FROM_SOURCE` ne smije predstavljati pravnu ispravnost.

## 6. Trust Status Definitions

### 6.1 `UNASSESSED`

Trust procjena još nije izvršena. `UNASSESSED` je normativni početni trust status. Ne znači nepouzdano, sumnjivo, pretpostavljeno, konfliktno niti da trust status nije primjenjiv.

### 6.2 `CONFIRMED_FROM_SOURCE`

Identifikovani izvor neposredno podržava precizno definisanu tvrdnju u navedenom obimu. Potrebni su Source Item, atomska assertion, scope podrške i ljudska potvrda procjene. Ne potvrđuje autentičnost, pouzdanost, istinitost, pravnu dokazanost, odsustvo konflikta, review acceptance ili Verified Fact kvalifikaciju.

### 6.3 `ASSUMED`

Tvrdnja se koristi kao eksplicitna radna pretpostavka bez dovoljne neposredne potvrde. Potrebni su razlog, namjena i vidljiva ograničenja. `ACCEPTED` može dozvoliti ograničenu upotrebu, ali trust ostaje `ASSUMED`.

## 7. Trust Transition Matrix

| Početni status | Ciljni status | Dozvoljeno | Dozvoljeni akter | Preduslovi | Obavezni audit zapis | Posljedica | Zabranjena prečica | Primjer |
|---|---|---|---|---|---|---|---|---|
| `UNASSESSED` | `ASSUMED` | DA | čovjek potvrđuje; sistem/AI može predložiti | atomska tvrdnja, razlog i namjena | trust assessment događaj, proposer, confirmer, razlog | vidljiva radna pretpostavka | automatski tretman kao činjenice | klijent navodi potpis bez ugovora |
| `UNASSESSED` | `CONFIRMED_FROM_SOURCE` | DA | ovlašćeni ljudski reviewer | Source Item, neposredni scope, assertion kind | source link, scope, reviewer, vrijeme | izvor neposredno podržava tvrdnju | potvrda samo na osnovu naziva dokumenta | ugovor navodi datum |
| `ASSUMED` | `CONFIRMED_FROM_SOURCE` | DA | ovlašćeni ljudski reviewer | novi ili ranije neocijenjeni Source Item neposredno podržava isti atomski claim | novi trust assessment sa prethodnim statusom | trust procjena se mijenja; review ostaje odvojen | prelaz samo zato što je assertion `ACCEPTED` | dostavljen je ugovor koji navodi potpis |
| `CONFIRMED_FROM_SOURCE` | `ASSUMED` | USLOVNO — korekcija | reviewer advokat ili nadležni reviewer | dokaz da ranija source-scope procjena nije bila valjana; nije dovoljno da novi izvor samo proturječi | korektivni zapis sa razlogom i vezom na stari assessment | ispravlja procjenu bez brisanja istorije | tihi downgrade ili downgrade zbog konflikta koji ne mijenja šta prvi izvor navodi | pogrešno povezan pasus izvora |
| `ASSUMED` | `UNASSESSED` | NE | — | — | zadržati postojeći assessment | pretpostavka ostaje istorijski vidljiva | reset da bi nestalo upozorenje | brisanje assumed statusa |
| `CONFIRMED_FROM_SOURCE` | `UNASSESSED` | NE | — | — | zadržati assessment; korekcija ide u auditabilan status | nema gubitka provenijencije | reset bez razloga | uklanjanje source veze |
| bilo koji | isti status | NIJE STATUSNI PRELAZ | ovlašćeni reviewer može dodati novi dokaz | status ostaje isti | novi evidence/audit događaj | bogatiji trag, ista semantika | prepisivanje starog audit zapisa | dodatni izvor potvrđuje isti claim |

**Normative:** Novi konfliktni izvor ne briše činjenicu da je raniji izvor nešto naveo. On stvara conflict/refutation okolnost i novi review, a trust se mijenja samo ako se promijenila procjena neposredne podrške tog izvora.

## 8. Review Status Definitions

| Status | Definicija | Minimalni preduslov | Review Record |
|---|---|---|---|
| `PROPOSED` | objekat je prijedlog sa evidentiranim porijeklom | stabilna identifikovana verzija | creation/proposal audit; Review Record još nije odluka |
| `IN_REVIEW` | ovlašćeni reviewer pregleda konkretnu verziju za scope | reviewer i scope identifikovani | obavezan zapis početka/preuzimanja pregleda |
| `ACCEPTED` | reviewer prihvata objekat za evidentiranu namjenu | završen pregled i `accepted_for` značenje | obavezan autoritativni Review Record |
| `REJECTED` | reviewer odbija objekat za evidentiranu namjenu | reviewer i razlog | obavezan autoritativni Review Record |

**Normative:** Svaka review odluka odnosi se na konkretnu verziju objekta i konkretnu namjenu pregleda. `ACCEPTED` bez namjene nije dovoljan završeni review rezultat. Objekat može biti prihvaćen za jednu namjenu, a odbijen ili još nepregledan za drugu. Trenutni `review_status` je izvedena projekcija samo u odnosu na jasno definisani review scope.

`IN_REVIEW` nije obavezna ritualna tranzicija; označava stvarno započet i nezavršen pregled. Direktni `PROPOSED` → `REJECTED` je konačno dozvoljen kada ovlašćeni reviewer može neposredno odbiti prijedlog.

## 9. Review Transition Matrix

| Početni status | Ciljni status | Dozvoljeno | Dozvoljeni akter | Preduslovi | Obavezni audit zapis | Posljedica | Zabranjena prečica | Primjer |
|---|---|---|---|---|---|---|---|---|
| Novi objekat | `PROPOSED` | DA | predlagač | object identity, origin/generator, verzija | creation/proposal događaj | objekat čeka pregled | kreiranje kao `ACCEPTED` | sistem predlaže assertion |
| `PROPOSED` | `IN_REVIEW` | DA | reviewer advokat | stabilna verzija, scope i reviewer | Review Record/preuzimanje | sadržaj se pregleda | izmjena iste verzije tokom pregleda | advokat otvara prijedlog |
| `PROPOSED` | `REJECTED` | DA | reviewer advokat | neposredno odbijanje konkretne verzije za definisani scope | Review Record: target/version, reviewer/authority, razlog, scope i vrijeme | prijedlog ostaje u tragu | fizičko brisanje ili rejection bez namjene | očigledno nerelevantan prijedlog |
| `PROPOSED` | `ACCEPTED` | NE | — | mora prvo `IN_REVIEW` | — | nema prečice | one-click auto-accept | automatski prijedlog |
| `IN_REVIEW` | `ACCEPTED` | DA | reviewer advokat / nadležni authority | završen pregled, namjena, konflikti razmotreni | Review Record sa `accepted_for` | prihvaćeno samo za scope | izjednačavanje sa istinom | assumption prihvaćen za internu analizu |
| `IN_REVIEW` | `REJECTED` | DA | reviewer advokat | završen pregled i razlog | Review Record | objekat nije prihvaćen za scope | brisanje objekta | nepodržana kvalifikacija |
| `IN_REVIEW` | `PROPOSED` | DA | reviewer advokat | potrebna dorada ili nova verzija | Review Record sa zahtjevom za doradu | vraća se predlagaču | mijenjanje reviewed snapshot-a | assertion je preširok |
| `ACCEPTED` | `IN_REVIEW` | DA — ponovno otvaranje | reviewer advokat ili viši authority | novi izvor, konflikt, promjena namjene ili uočena greška | novi Review Record povezan sa prethodnim | acceptance nije izbrisan; novi pregled je otvoren | overwrite starog acceptance zapisa | pojavio se konfliktni datum |
| `REJECTED` | `IN_REVIEW` | DA — ponovno razmatranje | reviewer advokat ili viši authority | novi dokaz ili obrazložen zahtjev | novi Review Record | prethodno rejection ostaje istorijski | direktni flip u accepted | dostavljen je nedostajući ugovor |
| `ACCEPTED` | `REJECTED` | NE DIREKTNO | — | prvo ponovno otvoriti `IN_REVIEW` | — | auditabilan slijed | status flip bez novog pregleda | naknadno osporavanje |
| `REJECTED` | `ACCEPTED` | NE DIREKTNO | — | prvo `IN_REVIEW` | — | auditabilan slijed | status flip bez reviewa | novi dokaz |
| `ACCEPTED` ili `REJECTED` | `PROPOSED` | NE ZA ISTU VERZIJU | — | nova formulacija je nova verzija | supersession/version audit | stara odluka ostaje | reset istorije | preciznija assertion |

## 10. Lifecycle Status Definitions

| Status | Definicija | Authority | Terminalan u redovnom workflowu |
|---|---|---|---:|
| `ACTIVE` | aktuelna verzija objekta | creator uz audit; dalje promjene ovlašćeni akter | NE |
| `SUPERSEDED` | zamijenjen identifikovanom novijom verzijom | ovlašćeni owner/reviewer | DA za tu verziju |
| `WITHDRAWN` | povučen iz dalje upotrebe | autor ili ovlašćeni owner, prema pravilima objekta | DA za tu verziju |
| `VOIDED` | zapis nije smio proizvoditi pravno ili operativno dejstvo zbog greške u kreiranju, duplikata, pogrešnog targeta ili druge proceduralne nevalidnosti | povišeni authority | DA za tu verziju |

`VOIDED` ne znači nužno činjenično netačno, opovrgnuto, review-odbijeno, povučeno niti dozvoljeno brisanje istorije.

## 11. Lifecycle Transition Matrix

| Početni status | Ciljni status | Dozvoljeno | Dozvoljeni akter | Preduslovi | Obavezni audit zapis | Posljedica | Zabranjena prečica | Primjer |
|---|---|---|---|---|---|---|---|---|
| Novi objekat | `ACTIVE` | DA | creator/ovlašćeni predlagač | stabilni identitet i verzija | creation događaj | aktuelna verzija | kreiranje bez porijekla | nova assertion |
| `ACTIVE` | `SUPERSEDED` | DA | ovlašćeni owner/reviewer | nova `ACTIVE` verzija, razlog, dvosmjerna veza | supersession događaj | stara verzija ostaje čitljiva, nije aktuelna | overwrite sadržaja stare verzije | preciznija formulacija |
| `ACTIVE` | `WITHDRAWN` | DA | autor ili ovlašćeni owner | eksplicitan razlog | withdrawal događaj | ne koristi se dalje; review trag ostaje | fizičko brisanje | autor povlači prijedlog |
| `ACTIVE` | `VOIDED` | DA, strogo | nadležni/povišeni authority | evidentirana greška/nevaženje i korektivni razlog | void događaj i veza na korekciju ako postoji | verzija je nevažeća, ali ostaje u auditu | void radi skrivanja nepovoljnog sadržaja | duplirani pogrešan zapis |
| `SUPERSEDED` | `ACTIVE` | NE | — | koristiti novu verziju | — | stara ostaje superseded | reaktivacija stare verzije bez novog objekta | povratak staroj formulaciji |
| `WITHDRAWN` | `ACTIVE` | NE U REDOVNOM TOKU | — | stvoriti novu verziju uz vezu | novi object/version audit | istorija ostaje jasna | uklanjanje withdrawal traga | ponovna upotreba povučenog prijedloga |
| `VOIDED` | bilo koji drugi | NE U REDOVNOM TOKU | — | samo posebna buduća korektivna procedura | novi audit zapis, ne izmjena voided objekta | void ostaje vidljiv | oživljavanje poništenog zapisa | administrativna greška |
| bilo koji terminalni | drugi terminalni | NE | — | novi odnos ili objekat umjesto mutacije | — | jednoznačna lifecycle istorija | `SUPERSEDED` → `VOIDED` bez korektivnog događaja | naknadna procjena |

## 12. Decision Status Definitions

| Status | Definicija | Minimalni preduslov |
|---|---|---|
| `PENDING_DECISION` | odluka je potrebna i nije donesena | precizno pitanje i authority |
| `DECIDED` | authority je donio evidentiranu odluku | decision content, authority, vrijeme i razlog/scope |
| `DEFERRED` | authority je izričito odložio odluku | razlog i uslov ili vrijeme ponovnog razmatranja |
| `CANCELLED` | potreba za odlukom je prestala bez odluke | authority i razlog otkazivanja |

## 13. Decision Transition Matrix

| Početni status | Ciljni status | Dozvoljeno | Dozvoljeni akter | Preduslovi | Obavezni audit zapis | Posljedica | Zabranjena prečica | Primjer |
|---|---|---|---|---|---|---|---|---|
| Novi request | `PENDING_DECISION` | DA | čovjek; sistem može predložiti request | pitanje, context i authority | creation događaj | odluka je vidljivo otvorena | `DECISION_REQUIRED` kao trust status | treba odluka o poravnanju |
| `PENDING_DECISION` | `DECIDED` | DA | identifikovani decision authority | odluka, scope, vrijeme; pravni savjet odvojen kada odlučuje klijent | decision zapis | odluka je autoritativno evidentirana | sistem/AI kao authority | klijent prihvata poravnanje |
| `PENDING_DECISION` | `DEFERRED` | DA | decision authority | razlog i review trigger/date | defer događaj | request ostaje otvoren, ali odložen | tiho ostavljanje bez razloga | čeka se dokument |
| `PENDING_DECISION` | `CANCELLED` | DA | decision authority ili ovlašćeni owner | razlog da potreba više ne postoji | cancellation događaj | nije donesena odluka | prikaz kao decided | spor je već riješen |
| `DEFERRED` | `PENDING_DECISION` | DA | decision authority/owner | ispunjen trigger ili eksplicitno ponovno otvaranje | reopen događaj | odluka ponovo čeka | brisanje defer istorije | stigao je dokument |
| `DEFERRED` | `CANCELLED` | DA | decision authority | potreba za odlukom prestala je tokom odlaganja | cancellation događaj sa authority-jem, razlogom, vremenom i eventualnom vezom na uzročni događaj/objekat | request se zatvara bez odluke | implicitni decided | opcija više ne postoji |
| `DEFERRED` | `DECIDED` | NE DIREKTNO | — | prvo vratiti `PENDING_DECISION` | — | jasan reopen slijed | skrivena odluka tokom defer statusa | odluka nakon odlaganja |
| `DECIDED` | bilo koji drugi | NE ZA ISTI REQUEST | — | reconsideration je novi povezani Decision Request | novi request i veza | originalna odluka ostaje u auditu | prepisivanje odluke | promijenjene okolnosti |
| `CANCELLED` | bilo koji drugi | NE ZA ISTI REQUEST | — | nova potreba je novi request | novi request i veza | razlog otkazivanja ostaje | reaktivacija bez traga | spor se ponovo otvara |

## 14. Cross-Axis Constraints

| Pravilo | Normativna posljedica |
|---|---|
| `ASSUMED` + `ACCEPTED` je dozvoljeno | samo za eksplicitni `accepted_for`; nije Verified Fact |
| `CONFIRMED_FROM_SOURCE` + `PROPOSED` je dozvoljeno | source podrška ne zamjenjuje review |
| `ACCEPTED` + `SUPERSEDED` je dozvoljeno istorijski | acceptance zapis ostaje; verzija više nije aktuelna |
| `REJECTED` + `ACTIVE` je moguće | rejection je review ishod, lifecycle može ostati active radi ponovnog otvaranja |
| `DECIDED` ne mijenja review/trust povezanih objekata | odluka se ne prenosi kao epistemic potvrda |
| `SUPERSEDED` ne znači refuted | refutation se evidentira posebnom relacijom/rezultatom pregleda |
| Verified Fact eligibility | samo `FACTUAL_CLAIM`; zahtijeva `CONFIRMED_FROM_SOURCE`, `ACCEPTED` za odgovarajuću namjenu, `ACTIVE`, source scope, bez blokirajućeg konflikta i budući odobren Change Set |
| Client Action Pack eligibility | zahtijeva poseban client-facing approval; obično `ACCEPTED` nije dovoljno |
| Deadline proposal | ne utiče na attention dok ga korisnik ne potvrdi; sistem ne računa procesni rok |
| Terminalni lifecycle | sprečava novu redovnu operativnu primjenu te verzije, ali ne briše istoriju |

## 15. Preconditions

Prije bilo kog trajnog statusnog prelaza moraju biti poznati:

1. stabilni object i version identitet;
2. trenutni status na relevantnoj osi;
3. identitet i uloga aktera;
4. authority za konkretni scope;
5. razlog, namjena i relevantni povezani izvori/objekti;
6. očekivani hash autoritativnog zapisa kada se kasnije implementira upis;
7. odsustvo neobrađenog concurrent ili manual-edit konflikta;
8. audit zapis koji će biti upisan file-first prije odbacive projekcije/indeksa;
9. odobreni Change Set kada VLA-0D utvrdi da je potreban za primjenu.

## 16. Required Review Records

| Događaj | Review Record obavezan | Minimalni sadržaj |
|---|---:|---|
| `PROPOSED` → `IN_REVIEW` | DA | target/version, reviewer, scope, vrijeme |
| `PROPOSED` → `REJECTED` | DA | target/version, reviewer/authority, razlog, scope, vrijeme |
| `IN_REVIEW` → `ACCEPTED` | DA | target/version, reviewer/authority, `accepted_for`, razlog/uslovi, vrijeme |
| `IN_REVIEW` → `REJECTED` | DA | target/version, reviewer/authority, razlog, vrijeme |
| `IN_REVIEW` → `PROPOSED` | DA | zahtijevana dorada i razlog |
| `ACCEPTED` ili `REJECTED` → `IN_REVIEW` | DA, novi zapis | reopen razlog, novi scope/dokaz, veza na prethodni Review Record |
| Trust korekcija | DA ili zaseban autoritativni assessment record | prethodno/novo stanje, izvor, scope, reviewer, razlog |
| Lifecycle promjena pregledanog objekta | DA ili zaseban lifecycle audit record | prethodno/novo stanje, authority, razlog, povezani objekat |

Review Record se ne prepisuje. Polja `reviewed_at`, `reviewed_by` i `review_note` na objektu nijesu zamjena za njega; mogu biti samo izvedena projekcija posljednjeg relevantnog zapisa.

## 17. Prohibited Transitions

Izričito su zabranjeni:

- `PROPOSED` → `ACCEPTED` bez `IN_REVIEW`;
- `ACCEPTED` ↔ `REJECTED` bez ponovnog otvaranja;
- `ASSUMED` → `CONFIRMED_FROM_SOURCE` samo zbog review acceptance-a;
- `CONFIRMED_FROM_SOURCE` → Verified Fact bez ostalih kvalifikacionih uslova;
- bilo šta → `SUPERSEDED` bez identifikovane novije verzije;
- `SUPERSEDED`, `WITHDRAWN` ili `VOIDED` → `ACTIVE` iste verzije u redovnom workflowu;
- `DEFERRED` → `DECIDED` bez ponovnog otvaranja;
- `DECIDED` ili `CANCELLED` → drugi decision status istog requesta;
- `DECISION_REQUIRED` kao vrijednost trust ose;
- fizičko brisanje kao statusni prelaz;
- statusni prelaz čiji je jedini authority sistem ili AI;
- promjena statusa bez očuvanja prethodnog audit zapisa.

## 18. Supersession Rules

1. Supersession je konceptualno relacija koja mora podržati najmanje 1:1, 1:N i N:1 odnose.
2. Nova verzija ili verzije moraju postojati kao identifikovani `ACTIVE` objekti prije ili u istoj kontrolisanoj promjeni kojom prethodni objekat ili objekti postaju `SUPERSEDED`.
3. Relacije `supersedes` i `superseded_by` moraju biti dosljedne i auditabilne, ali singularna polja nijesu usvojena univerzalna šema.
4. Review nove verzije ne nasljeđuje se automatski iz stare.
5. Trust nove verzije ne nasljeđuje se automatski ako je promijenjen sadržaj ili scope.
6. Stari Review Records i source veze ostaju vezani za staru verziju.
7. Supersession ne označava refutation, rejection, withdrawal, void ili deletion.
8. Tihi overwrite sadržaja radi „ispravke“ je zabranjen.

Relacije 1:N su potrebne kada se preširoka assertion atomizuje u više novih assertions; N:1 kada se više ranijih assertions objedini u jednu precizniju verziju. Tehnička reprezentacija ostaje za kasniji WP/ADR.

## 19. Reopening and Reconsideration

Ponovno otvaranje reviewa koristi novi Review Record i vraća trenutnu projekciju u `IN_REVIEW`, bez brisanja prethodnog `ACCEPTED`/`REJECTED` zapisa. Razlog može biti novi izvor, materijalni konflikt, promjena namjene ili uočena greška.

Reconsideration donesene odluke ne mijenja `DECIDED` request. Kreira se novi povezani `DECISION_REQUEST` koji objašnjava promijenjene okolnosti i vezu sa prethodnom odlukom.

## 20. Conflict and Refutation Scenarios

**Normative:** Materijalni konflikt je neriješeno neslaganje koje može uticati na verifikovano stanje predmeta, pravnu kvalifikaciju, rok, odgovornost, pravnu radnju, očekivani output ili komunikaciju sa klijentom. Sistem ne određuje samostalno koji je izvor tačan. Detaljna evidence i conflict arhitektura ostaje za VLA-0B.

| Scenario | Trust posljedica | Review posljedica | Lifecycle posljedica | Zabranjen zaključak |
|---|---|---|---|---|
| Dva izvora navode različite datume | oba claims mogu ostati `CONFIRMED_FROM_SOURCE` u odnosu na svoje izvore | otvoriti/reopen review i evidentirati konflikt | nema automatske promjene | sistem bira „vjerovatniji“ datum |
| Novi izvor opovrgava ranije prihvaćen claim | source-support stare tvrdnje ne nestaje automatski | `ACCEPTED` može biti reopen u `IN_REVIEW` | nova preciznija verzija može supersede staru nakon pregleda | tihi overwrite stare tvrdnje |
| Izvor je bio pogrešno povezan | trust korekcija može `CONFIRMED_FROM_SOURCE` → `ASSUMED` uz audit | review se ponovo otvara ako je materijalno | po potrebi nova verzija ili void pogrešnog zapisa | brisanje starog assessmenta |
| Službeni registar ispravlja podatak | dva source stanja i dva atomska claim-a | reviewer procjenjuje ispravku i vremenski scope | ranija formulacija može biti superseded, ne automatski voided | da službeni izvor nikad ne griješi |
| Potvrđena je samo atribucija | attributed statement može biti confirmed | factual claim se razmatra odvojeno | nema automatske promjene | da je sadržaj izjave istinit |

## 21. Audit Requirements

Svaki autoritativni statusni događaj mora omogućiti odgovor na pitanja:

- koji object i koja verzija;
- koja osa;
- prethodno i novo stanje;
- ko je predložio i ko je odobrio;
- pod kojim authority-jem;
- kada;
- za koju namjenu/scope;
- na osnovu kojih izvora ili povezanih objekata;
- razlog, uslovi i poznati konflikti;
- koji prethodni Review Record ili decision zapis je relevantan;
- koji Change Set je kasnije primijenio promjenu;
- rezultat upisa i recovery podatak kada VLA-0D uvede mehaniku.

**Normative:** Audit je file-first, append-oriented i čitljiv bez aplikacije. Nijedan autoritativni događaj ne smije postojati samo u budućem indeksu. Upis mora poštovati Single Writer, expected-hash, atomic write i recovery pravila Registra I11–I12 kada bude implementiran.

## 22. Worked Transition Examples

### 22.1 Pretpostavka prihvaćena za ograničenu namjenu

1. `MATTER_ASSERTION` nastaje kao `PROPOSED`, `ACTIVE`, trust `ASSUMED`.
2. Reviewer je otvara: `PROPOSED` → `IN_REVIEW`.
3. Reviewer je prihvata samo za internu analizu: `IN_REVIEW` → `ACCEPTED` sa `accepted_for` opisom.
4. Trust ostaje `ASSUMED`; nema Verified Fact kvalifikacije.

### 22.2 Izvor kasnije neposredno podržava assertion

1. Dostavljen je novi `SOURCE_ITEM`.
2. Source scope se povezuje sa istom atomskom assertion.
3. Ovlašćeni reviewer auditabilno mijenja trust `ASSUMED` → `CONFIRMED_FROM_SOURCE`.
4. Raniji Review Record se ne mijenja; ako je namjena bitno drugačija, review se ponovo otvara.

### 22.3 Konflikt poslije acceptance-a

1. Novi izvor podržava kontradiktoran datum.
2. Kreira se zasebna atomska assertion i conflict relacija.
3. Ranije `ACCEPTED` assertion ide u `IN_REVIEW` kroz novi Review Record.
4. Sistem prikazuje oba datuma; advokat odlučuje o kvalifikaciji i daljem postupanju.

### 22.4 Preciznija verzija

1. Preširoka assertion se razlaže na atomske nove objekte.
2. Novi objekti počinju `PROPOSED` + `ACTIVE`; ne nasljeđuju review automatski.
3. Nakon kontrolisanog pregleda, stara verzija `ACTIVE` → `SUPERSEDED` uz veze na novije objekte.
4. Stari sadržaj i Review Records ostaju čitljivi.

### 22.5 Klijentska odluka

1. Kreira se `DECISION_REQUEST` sa authority-jem klijent i statusom `PENDING_DECISION`.
2. Advokat može povezati odvojeni `LEGAL_OPINION` ili preporuku.
3. Klijent odlučuje: `PENDING_DECISION` → `DECIDED`.
4. Izvršenje odluke se evidentira kao zasebna `LEGAL_ACTION`; sistem nije authority.

### 22.6 Žalba ili drugi pravni lijek

1. `LEGAL_OPINION` evidentira pravni zaključak o postojanju osnova i pravnu/procesnu preporuku advokata; ne postaje Verified Fact.
2. `DECISION_REQUEST` identifikuje konkretnog authority-ja prema vrsti odluke, punomoćju, profesionalnim pravilima i instrukcijama klijenta.
3. Instrukcija ili poslovna odluka klijenta ostaje odvojena od stručne preporuke advokata.
4. Tek donesena odluka vodi ka zasebnoj `LEGAL_ACTION` za pripremu ili podnošenje pravnog lijeka.

### 22.7 Odložena odluka

1. Authority odlaže odluku zbog nedostajućeg dokumenta: `PENDING_DECISION` → `DEFERRED`.
2. Dolaskom dokumenta request ide `DEFERRED` → `PENDING_DECISION`.
3. Tek potom authority bira `DECIDED` ili `CANCELLED`.

## 23. Acceptance Tests

Ovo su konceptualni acceptance testovi za dokumentaciju, ne runtime testovi:

| Test | Očekivani rezultat |
|---|---|
| `ASSUMED` objekat postane `ACCEPTED` | trust ostaje `ASSUMED`; nije Verified Fact |
| nova assertion nema izvršenu trust procjenu | dobija normativni `UNASSESSED`; ne tretira se kao nepouzdana, sumnjiva, assumed ili konfliktna |
| mejl neposredno sadrži izjavu lica | `ATTRIBUTED_STATEMENT` može biti confirmed; istinitost sadržaja ne |
| `FACTUAL_INFERENCE`, `LEGAL_CHARACTERIZATION`, `LEGAL_OPINION` ili `PARTY_POSITION` je `ACCEPTED` | ne postaje Verified Fact; samo `FACTUAL_CLAIM` može neposredno biti kvalifikovan |
| dvije isprave navode različite datume | oba source-support odnosa se čuvaju; konflikt nije trust status |
| assertion je djelimično podržana | razlaže se na atomske assertions; nema automatski novi trust status |
| `PROPOSED` pokuša direktno u `ACCEPTED` | prelaz odbijen; potreban `IN_REVIEW` i Review Record |
| `ACCEPTED` pokuša direktno u `REJECTED` | prelaz odbijen; prvo ponovno otvaranje |
| `ACTIVE` postane `SUPERSEDED` bez novije verzije | prelaz odbijen |
| `SUPERSEDED` pokuša nazad u `ACTIVE` | prelaz odbijen za istu verziju |
| sistem pokuša `PENDING_DECISION` → `DECIDED` | prelaz odbijen; sistem nije authority |
| `DEFERRED` pokuša direktno u `DECIDED` | prelaz odbijen; prvo `PENDING_DECISION` |
| accepted interni objekat ide u Client Action Pack | zahtijeva poseban client-facing approval |
| stari Review Record se mijenja novim pregledom | radnja odbijena; dodaje se novi zapis |
| pregledani objekat se fizički briše | radnja odbijena u redovnom workflowu |
| deadline predlaže sistem | ne postaje potvrđen rok i ne utiče na attention |
| indeks se obriše | autoritativna statusna istorija ostaje u file-first zapisima |

Dokumentaciona provjera prolazi samo ako se `DECISION_REQUIRED` ne prikazuje kao trust status, `SUPERSEDED` se ne prikazuje kao review status i Verified Fact nije zaseban object type.

## 24. Open Decisions

Milovanova potvrda je potrebna za:

1. `accepted_for` vocabulary i da li se razlikuje po object type-u;
2. reviewer/decision authority matricu kancelarije i partner escalation pravila;
3. origin/generator/attribution kontrolisane rječnike;
4. objektno-specifične operational statuse i njihove terminalne vrijednosti;
5. detaljne material-conflict kriterijume koji blokiraju Verified Fact eligibility;
6. format append-only audit događaja i buduće Markdown reprezentacije;
7. Change Set granicu za pojedinačne naspram grupnih statusnih promjena u VLA-0D;
8. izuzetnu deletion politiku, ako bude pravno potrebna;
9. tehničku reprezentaciju 1:1, 1:N i N:1 supersession relacija.

Ove odluke ne mijenjaju trenutno normativno razdvajanje osa i ne odobravaju B1, VLA-0B niti bilo koju produkcijsku implementaciju.
