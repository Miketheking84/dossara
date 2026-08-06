# DOSSARA — WP VLA-0C Matter State Architecture

## 1. Document Control

| Polje | Vrijednost |
|---|---|
| Dokument | WP VLA-0C — Matter State Architecture |
| Status | Dokumentacioni nacrt za pregled naručioca |
| Datum | 6. avgust 2026. |
| Normativni baseline | Prihvaćeni VLA-0A i VLA-0B |
| Formalni kontrolni akt | `docs/dossara/decision-alignment-register-v1.2.md` |
| Vrsta rada | Documentation-only; bez šeme, storage formata ili runtime implementacije |

## 2. Purpose

Ovaj dokument definiše file-first, obnovljiv i auditabilan model stanja predmeta. Njegova svrha je da razdvoji autoritativne zapise, trenutno primijenjeno stanje, istoriju, radne procjene i izvedene prikaze, uz trajno pravilo: **Automation proposes. The lawyer decides.**

**Normative:** Matter State je kontrolisana i obnovljiva projekcija aktivnih, pregledanih i primijenjenih VLA objekata i njihovih odnosa u deklarisanom matter scope-u, izvedena iz autoritativnih file-first zapisa i audit događaja.

## 3. Scope

VLA-0C definiše:

- konceptualne segmente Matter State-a;
- eligibility, inclusion, exclusion i historical-retention pravila;
- odnos current, historical, effective i recorded state-a;
- projection inpute, provenijenciju i validaciju;
- prikaz konfliktnog, nepotpunog i stale stanja;
- konceptualni rebuild, snapshot/cache i manual-edit boundary;
- obaveznu vidljivost bez aplikacije;
- vezu prema budućem Change Set apply rezultatu.

## 4. Out of Scope

Ovaj WP ne projektuje niti implementira Change Set workflow ili atomic apply, Review Workspace, UI, bazu, SQLite, event store, indeks, cache, snapshot fajl, storage format, JSON/TypeScript šemu, filesystem writer, watcher, recovery ili merge algoritam, intake, OCR, parser, LLM/RAG/API, email sync, deadline calculation, Client Action Pack, Matter Registry, migraciju, Word generisanje ili pravne autoritete kao poseban model.

## 5. Normative Language

- **Normative** označava obavezno pravilo.
- **Recommendation** označava preferirani pravac bez implementacione odluke.
- **Open decision** ostaje za naručioca ili kasniji WP.
- **Out of scope** označava namjerno prenesenu temu.

„Mora“, „ne smije“ i „isključivo“ su normativni. „Može“ je dozvola, ne automatizam.

## 6. Alignment with VLA-0A and VLA-0B

VLA-0C ne mijenja terminologiju ili autoritet VLA-0A/VLA-0B. Object Type, Assertion Kind, Trust, Review, Lifecycle, Operational, Decision i Authority ostaju odvojene ose. `REVIEW_RECORD` je autoritativan i append-only. Source Item, Source Content Version, Source Representation, Source Scope, Evidence Link, Source Relation, integrity zapis i conflict disposition ostaju u autoritetu VLA-0B.

`ACCEPTED` je odluka o konkretnoj verziji i namjeni; nije univerzalna istina niti apply. `CONFIRMED_FROM_SOURCE` opisuje odnos assertion-a prema identifikovanom scope-u izvora; nije Verified Fact. `SUPPORTS` ne mijenja trust automatski. Multi-matter Source Item ne prenosi evidence ili access kontekst.

Nije utvrđena kontradikcija sa prihvaćenim baseline-om koja onemogućava ovaj model.

## 7. Matter State Definition

Matter State nije novi primarni VLA objekat, mutable master dokument, tabela, snapshot niti skup bez pravila. To je projekcija članstva i odnosa postojećih objekata za eksplicitni `matter_id`, scope, namjenu i vremenski pogled.

Treba razlikovati:

| Koncept | Značenje | Autoritet |
|---|---|---|
| Authoritative Matter Records | verzionisani objekti, relacije i audit događaji iz kojih se stanje obnavlja | autoritativni file-first zapisi |
| Active Matter State | trenutno primijenjeni, neterminalni objekti i relacije u scope-u | izvedeno članstvo sa autoritativnom apply osnovom |
| Historical State | temporalna rekonstrukcija ranijih članstava, odluka, pregleda, conflict ograničenja i primjena | autoritativna istorija + izvedeni istorijski prikaz |
| Derived Projection | deterministički obnovljiv rezultat pravila | nije samostalni izvor istine |
| UI view | selekcija i prezentacija projekcije | neautoritativno |
| Snapshot | evidentirana slika projekcije u trenutku | pomoćni, validabilni artefakt |
| Index/cache | odbaciva tehnička struktura | nikad autoritativno |

Fizički human-readable prikaz može biti regenerisan, ali ne smije prepisivanjem postati jedini nosilac istorije ili apply autoriteta.

## 8. Authoritative Records and Derived State

Autoritativni inputi obuhvataju konkretne verzije VLA objekata, njihove matter veze, Review Records, lifecycle događaje, source/evidence i conflict zapise, decision zapise i buduće uspješne Change Set apply rezultate. Projection rules i identitet njihove verzije moraju biti poznati.

Active membership, Verified Fact eligibility, zbirni conflict/stale/incomplete indikatori, „waiting on“, „urgent“ i dashboard selekcije su izvedeni. Izvedena vrijednost uvijek mora voditi do autoritativne osnove. Ako input nedostaje, nije čitljiv, ima nerazriješen mismatch ili pravila nijesu poznata, projekcija mora biti označena kao incomplete, stale ili invalid; sistem ne smije popuniti prazninu pretpostavkom.

## 9. Matter State Segments

Nazivi u tabeli su konceptualni segmenti, ne usvojeni enum-i ili fizički fajlovi.

| Segment | Svrha i dozvoljeni sadržaj | Minimalni preduslovi / authority | Izlaz iz aktivnog prikaza, istorija i upozorenje | Client-facing |
|---|---|---|---|---|
| `VERIFIED_FACTUAL_STATE` | `MATTER_ASSERTION` + `FACTUAL_CLAIM` koji je Verified Fact | active verzija; relevantni source scope; `CONFIRMED_FROM_SOURCE`; ovlašćeni review za namjenu; bez blocking konflikta; odobren i uspješno primijenjen budući Change Set | supersede/withdraw/void, opoziv relevantne primjene ili novi material conflict uklanja/blokira current članstvo; istorija ostaje | samo kroz zasebno odobren client-facing prikaz |
| `WORKING_ASSUMPTIONS` | isključivo `FACTUAL_CLAIM` sa `ASSUMED` koji se kontrolisano koristi kao pretpostavka | active; Review Record za internu namjenu; primijenjen Change Set; razlog, scope i ograničenje | terminal lifecycle, zamjena, uklanjanje primjenom ili istek namjene; uvijek oznaka „nije Verified Fact“ | podrazumijevano NE |
| `FACTUAL_INFERENCES` | `MATTER_ASSERTION` + `FACTUAL_INFERENCE` kao izvedeni činjenični zaključak ili decision support | active; inference osnov, ograničenja, purpose-aware Review Record i primijenjen Change Set | terminal lifecycle, supersession ili purpose-specific uklanjanje primjenom; uvijek oznaka „inference, nije činjenica ni pretpostavka“ | podrazumijevano NE |
| `LEGAL_ASSESSMENTS` | `LEGAL_CHARACTERIZATION`, `LEGAL_OPINION`, pravna preporuka | active verzija; autor, authority, scope, verzija, review/apply osnova | supersession/withdrawal/void ili uklanjanje primjenom; činjenice se ne mijenjaju automatski | samo posebno odobrena verzija |
| `PARTY_POSITIONS` | `PARTY_POSITION`; po potrebi veza ka `ATTRIBUTED_STATEMENT` | identifikovana stranka, scope, verzija, review/apply osnova | povlačenje, supersession, void ili uklanjanje primjenom; labela strane obavezna | samo uz namjensko odobrenje |
| `OPEN_DECISIONS` | aktivni `DECISION_REQUEST` koji je pending ili deferred | authority, pitanje, scope i current status poznati; primijenjen zapis | decided/cancelled/superseded; istorija i razlog ostaju | prema confidentiality i odobrenju |
| `RECORDED_DECISIONS` | evidentirani ishodi odluka i veza ka zahtjevu | identifikovan authority, scope, vrijeme i audit osnova | ne briše se; kasnija reconsideration je novi povezani zapis | prema namjeni |
| `ACTIVE_LEGAL_ACTIONS` | primijenjeni `LEGAL_ACTION` objekti koji nijesu terminalni | active lifecycle, authority/apply osnova; odgovornost ili vidljivo upozorenje | completion/cancellation/withdrawal/supersession prema kasnijem modelu; istorija ostaje | selektivno |
| `DEADLINES` | samo ručno uneseni i ljudski potvrđeni `DEADLINE` objekti | ljudska potvrda, osnov, scope, odgovornost i primijenjen Change Set | lifecycle/operational ishod prema VLA-0F; sistemski prijedlog ostaje van segmenta | selektivno |
| `EXPECTED_OUTPUTS` | primijenjene definicije `EXPECTED_OUTPUT` | svrha, veze, authority i apply osnova | povlačenje/supersession/void ili kasniji status; definicija nije isto što i dokument ili approval | samo odobren output je client-facing |
| `OPEN_CONFLICTS` | aktivni source/assertion/manual-edit konflikti i discrepancies | identifikovan uzrok, scope, materiality kada je procijenjena, status i reference | samo scope-aware disposition ili uklanjanje uzroka; audit ostaje | redigovano/odobreno po potrebi |
| `WAITING_ON` | izvedene zavisnosti i attention stavke | autoritativni osnov, povezani objekat, odgovorni/akter, početak i uslov prestanka | prestanak osnova ili novija validna projekcija; provenance ostaje dostupna | selektivno |
| `HISTORICAL_RECORDS` | superseded, withdrawn, voided, rejected, ranije primijenjeni i drugi auditno relevantni zapisi | očuvan identitet, verzija, događaj i vrijeme | ne uklanja se fizički redovnim workflowom | podrazumijevano NE |

Svi segmenti su izvedene projekcije članstva. Autoritativni su njihovi ulazni objekti, odnosi i audit/apply zapisi, ne tabela segmenta.

## 10. Verified Factual State

Verified Fact nije objekat. Samo `MATTER_ASSERTION` + `FACTUAL_CLAIM` može neposredno biti član ovog segmenta, i to tek kada svi sljedeći uslovi važe za istu verziju, matter, scope i namjenu:

1. tvrdnja je atomska i `ACTIVE`;
2. ima relevantan Source Scope i Evidence Link;
3. trust je ljudski potvrđen kao `CONFIRMED_FROM_SOURCE`;
4. ovlašćeni reviewer je kroz Review Record prihvatio konkretnu verziju za uključivanje;
5. nema neriješenog materijalnog konflikta koji blokira tu upotrebu i scope;
6. authority je dovoljan i razriješen;
7. budući odobreni Change Set je uspješno primijenio članstvo.

`ATTRIBUTED_STATEMENT` može podržati zaseban factual claim da je određeno lice dalo određenu izjavu. Istinitost sadržaja izjave zahtijeva zaseban `FACTUAL_CLAIM` i zasebnu dokaznu osnovu.

`ASSUMED`, `FACTUAL_INFERENCE`, `LEGAL_CHARACTERIZATION`, `LEGAL_OPINION` i `PARTY_POSITION` ne mogu biti Verified Fact. Client-facing approval je posebna namjena i ne nastaje automatski.

## 11. Working Assumptions

Prihvaćena pretpostavka može ući samo u `WORKING_ASSUMPTIONS`, sa stalno vidljivim `ASSUMED`, razlogom, scope-om, ograničenjem, reviewerom, namjenom i apply osnovom. Prihvatanje za internu analizu ne potvrđuje istinu niti dozvoljava prikaz kao Verified Fact. Upotreba u draftu mora sačuvati upozorenje i vezu ka pretpostavci.

`FACTUAL_INFERENCE` nije Working Assumption. Može ući u zasebni konceptualni segment `FACTUAL_INFERENCES` kao pregledana i primijenjena interna procjena ili podrška odluci, sa vidljivim osnovom i ograničenjima, ali nikada kao pretpostavka ili Verified Fact. Naziv segmenta nije implementacioni enum. Nepregledana assertion ostaje candidate/proposal izvan aktivnog Matter State-a.

## 12. Legal Assessments

`LEGAL_CHARACTERIZATION` i `LEGAL_OPINION` pripadaju isključivo `LEGAL_ASSESSMENTS`. Moraju prikazati autora, authority, matter i purpose scope, verziju, osnovne činjenice/izvore, ograničenja, review i apply osnovu. Promjena pravne procjene ne mijenja trust niti factual membership povezanih tvrdnji. Superseded mišljenje ostaje istorijsko.

## 13. Party Positions

`PARTY_POSITION` je stav imenovane stranke, ne neutralna činjenica. Review može potvrditi da je zapis vjeran prikaz stava, ne da je sadržaj stava istinit. Projekcija mora uvijek prikazati čiji je stav, scope, verziju i attribution/evidence osnovu.

## 14. Decisions

Decision State razlikuje `pending`, `deferred`, `decided`, `cancelled` i istorijsku reconsideration bez spajanja u review/trust osu. Deferred zahtjev ostaje u `OPEN_DECISIONS` sa razlogom i uslovom ponovnog razmatranja. Decided/cancelled prelazi u `RECORDED_DECISIONS` i istoriju. Reconsideration je novi povezani zahtjev ili događaj, ne prepisivanje odluke.

Donesena poslovna ili pravna odluka ne stvara automatski `LEGAL_ACTION`, ne mijenja trust drugih objekata i ne primjenjuje druge promjene bez njihovih kontrolnih osnova.

**Normative:** Jednom autoritativno evidentirana odluka, cancellation, reconsideration ili conflict disposition odmah postaje projection/validation input i ne smije biti ignorisana do sljedećeg Change Set-a. Projekcija mora odvojeno pokazati da je odluka ili disposition evidentirana, da povezane downstream promjene članstva ili radnji još nijesu primijenjene i da je potrebna nova radnja ili Change Set. Ovaj zahtjev ne definiše VLA-0D workflow.

## 15. Legal Actions

VLA-0C određuje samo projekciono mjesto `LEGAL_ACTION`. Planned/active/blocked/completed/withdrawn/cancelled značenja ne zaključavaju se kao konačni statusni rječnik. U aktivnom segmentu radnja mora imati apply osnovu i vidljivu odgovornost. `LEGAL_ACTION` bez identifikovanog odgovornog lica nije operativno spremna niti se smije prikazati kao uredno izvršiva aktivna radnja; može biti prikazana kao applied but blocked, assignment required ili incomplete action dok konačni rječnik ostaje otvoren. Sistem ne smije automatski dodijeliti odgovorno lice. Završetak radnje ne odobrava automatski Expected Output.

## 16. Deadlines

Samo ručno uneseni i ljudski potvrđeni rok, prema budućem VLA-0F modelu, može ući u `DEADLINES`. Sistemski prijedlog ostaje prijedlog i mora biti vidljivo odvojen. Ovaj WP ne računa rokove i ne zaključava operational statuse. Deadline authority i audit osnova moraju biti vidljivi.

## 17. Expected Outputs

Moraju se razlikovati: definicija očekivanog outputa, rad na njemu, finalizovan dokument, odobren output i client-facing output. Nijedan od ovih ishoda ne implicira drugi bez odgovarajućeg zapisa i authority-ja. VLA-0C ne projektuje document generation ili Word export.

## 18. Conflicts and Incomplete State

Ne postoji generički status „problem“. Svaka oznaka mora imati tip, target, scope, uzrok, vrijeme i reference:

| Oznaka | Projekciono značenje | Učinak |
|---|---|---|
| open/material conflict | suprotni relevantni inputi; materiality potvrđena | blokira samo pogođenu Verified Fact upotrebu/scope |
| open/non-material conflict | konflikt postoji, ali nije materijalan za deklarisanu upotrebu | vidljivo upozorenje; ne blokira nepogođeno |
| unresolved source discrepancy | tehničko ili sadržajno odstupanje još nije dispositioned | upozorenje/incomplete; bez samostalnog truth zaključka |
| incomplete evidence / missing source | potreban evidence input nedostaje | blokira eligibility koja ga zahtijeva |
| unavailable representation | current pristup Representation-u nije moguć | ne briše istorijski Evidence Link; označava ograničenje provjere |
| pending review | nema završenog relevantnog Review Record-a | blokira aktivno inclusion za tu namjenu |
| pending decision | postoji otvoren Decision Request | ostaje vidljiv; ne mijenja druge ose |
| stale projection | noviji ili promijenjeni input nije obuhvaćen | projekcija se ne predstavlja kao current |
| manual-edit conflict | file-first input se razlikuje od expected baseline-a ili postoje concurrent promjene | zaustavlja overwrite/apply do reconciliation-a |

Nova konfliktna evidencija može suspendovati current Verified Fact membership za pogođeni scope bez brisanja istorijske činjenice da je ranije bila verifikovana. Disposition za internu namjenu ne važi automatski za client-facing ili drugi scope.

Current prikaz mora razlikovati: currently verified and usable; historically verified, currently conflict-blocked; superseded; withdrawn; i voided. Kod historically verified/currently blocked stanja mora pokazati raniji membership i apply osnov, vrijeme nastanka block-a, razlog, pogođeni scope i source/conflict reference. Novi material conflict odmah suspenduje current upotrebu samo u pogođenom scope-u; ne briše ranije validno membership razdoblje i ne čeka positive apply da bi proizveo zaštitni block.

## 19. Historical State

Historical State je temporalna rekonstrukcija ranijih membership scope-ova, purpose-specific review odluka, conflict ograničenja, odluka i apply rezultata, a ne samo kolekcija terminalnih ili odbijenih objekata. Kada je relevantno, prikazuje membership scope i purpose, period važenja ili poznate vremenske granice, inclusion/apply osnov, razlog prestanka current članstva, povezane verzije i audit zapise.

`SUPERSEDED`, `WITHDRAWN`, `VOIDED`, purpose-specific `REJECTED` i ranije primijenjene verzije ili članstva ostaju u autoritativnoj istoriji. Active projection terminalne verzije ne koristi kao current sadržaj, osim kao eksplicitne istorijske reference. Objekat može ostati lifecycle `ACTIVE` dok je njegovo ranije purpose-specific članstvo istorijsko. `REJECTED` ili `ACCEPTED` za jedan purpose ne čini objekat globalno istorijskim niti određuje status za drugi purpose. Uklanjanje trajnog membership-a nastaje novim auditabilnim apply/lifecycle osnovom; ne fizičkim brisanjem ili prepisivanjem.

Ranije prihvaćen ili Verified Fact koji je opovrgnut prikazuje: raniji period i osnov članstva, novi konflikt ili korektivni zapis, vrijeme promjene, authority i current status. Sistem ne tvrdi da raniji reviewer nikada nije donio odluku.

## 20. Inclusion and Exclusion Rules

| Stanje | Normativno značenje |
|---|---|
| candidate for inclusion | postojeća verzija zadovoljava početne type/scope uslove; nema apply učinka |
| approved for inclusion | postoji odgovarajući `ACCEPTED` Review Record/authority; i dalje nema apply učinka |
| applied to active state | budući odobreni Change Set je uspješno primijenjen na očekivani input |
| excluded from active state | nije eligible, nije odobren, nije applied ili je eksplicitno isključen |
| removed from active state | kasniji validni apply/lifecycle događaj uklanja current članstvo |
| retained historically | verzija, review, relation, conflict i apply trag ostaju čitljivi |
| blocked by conflict | neriješen material conflict pogađa isti scope/upotrebu |
| blocked by missing review | nema važećeg Review Record-a za istu verziju/namjenu |
| blocked by missing traceability | potreban Source Scope/Evidence Link nedostaje ili je nedovoljan |
| blocked by lifecycle | verzija je `SUPERSEDED`, `WITHDRAWN` ili `VOIDED` |
| blocked by unresolved authority | reviewer/decision/apply authority nije dokazan za namjenu |
| invalid projection | pravila/invarijante ne mogu proizvesti pouzdan rezultat |

`ACCEPTED` sam ne primjenjuje objekat. VLA-0C definiše eligibility i rezultat apply-ja, a ne Change Set workflow.

### 20.1 Positive state membership and protective projection effect

**Positive state membership:** Novi objekat ulazi u odgovarajući aktivni segment samo ako, uz sve ostale eligibility uslove, postoji validan budući Change Set apply rezultat.

**Protective projection effect:** Autoritativni zapis ili događaj o novom konfliktu, terminalnom lifecycle statusu, source-integrity problemu, manual-edit ili expected-input konfliktu, stale/incomplete inputu, pogrešnoj matter association ili validation grešci može odmah proizvesti upozorenje, blocking/suspension oznaku ili lokalizovan stale, incomplete ili invalid rezultat bez čekanja na novi positive Change Set apply.

Zaštitni efekat sprečava nepouzdanu current upotrebu, ali ne smije tiho izvršiti trajnu zamjenu ili uklanjanje membership-a. Trajna downstream state promjena i dalje zahtijeva budući VLA-0D audit/apply osnov. Lifecycle događaj ostaje autoritativan input i terminalna verzija se odmah ne koristi kao current, dok se formalni downstream membership/apply trag čuva i razrješava kroz buduću kontrolnu granicu.

### 20.2 Purpose-aware review

Review rezultat uređuje isključivo konkretnu verziju i deklarisanu namjenu. `REJECTED` ili `ACCEPTED` za jedan purpose ne određuje globalni status objekta za druge purpose-e. Ista active verzija može biti accepted za internu analizu, rejected za client-facing upotrebu i proposed za finalni output. Exclusion i historical prikaz moraju navesti purpose. Lifecycle može učiniti verziju globalno neaktuelnom u svom lifecycle scope-u; review status sam to ne čini.

## 21. Temporal Model

| Vrijeme | Značenje |
|---|---|
| `recorded_at` | kada je zapis evidentiran u autoritativnom tragu |
| `effective_at` | od kada sadržaj tvrdi da proizvodi relevantno dejstvo |
| `applied_at` | kada je kontrolisana promjena uspješno primijenjena |
| `superseded_at` | kada je verzija zamijenjena u deklarisanom scope-u |
| `withdrawn_at` | kada je povučena |
| `voided_at` | kada je poništena kao nevažeći zapis/verzija |
| projection generation time | kada je izvedeni prikaz izračunat |

Recorded time i effective time nijesu isto. Current state se primarno određuje prema poznatim i validno primijenjenim zapisima do generation time-a. „State as recorded at T“ koristi samo zapise evidentirane do T. Eventualni „effective state at T“ zahtijeva posebna pravila za retroaktivni effect i ostaje otvoren za kasniji WP.

**Normative:** Zapis ili Change Set koji je recorded/applied prije svog budućeg `effective_at` ne proizvodi current pravno ili operativno dejstvo prije tog vremena. Može biti prikazan kao future-effective ili scheduled, sa jasnim `effective_at`, recorded/apply osnovom i validation statusom. Precizni temporalni engine ostaje otvoren.

Retroaktivna primjena ne smije prepisati ono što je sistem u ranijem trenutku znao. Mora čuvati recorded/applied hronologiju, upozoriti na downstream odluke i outpute i zahtijevati authority; implementacioni engine nije dio VLA-0C.

## 22. Multi-matter Context

Članstvo je uvijek matter- i scope-aware. Ista logička assertion ili Source Item može biti relevantna za više matters, ali review scope, Evidence Links, conflict disposition, access i apply rezultat moraju biti zasebni. Objekat može biti aktivan u jednom matter scope-u i neaktivan, blocked ili istorijski u drugom. Pogrešna matter association ispravlja se auditabilno i mora invalidirati pogođenu projekciju do reconciliation-a.

## 23. Waiting On and Attention Projections

`waiting on client`, `counterparty`, `court/authority`, `internal lawyer`, `decision`, `source` i `review`, kao i `no next action`, `urgent`, `overdue` i `blocked`, jesu izvedene projekcije. Svaka mora navesti:

- autoritativni osnov i povezani objekat;
- odgovorno lice ili očekivani spoljašnji akter;
- vrijeme nastanka;
- uslov prestanka;
- confidence/validation kada zaključak nije neposredno evidentiran;
- projection time/rules version.

Nedostatak sljedeće radnje proizvodi `no next action` upozorenje, ne automatski izmišljenu radnju. Radnja bez assignee-ja proizvodi assignment-required/blocked attention i ne prikazuje se kao operationally ready. „Overdue“ za rok nije dozvoljen dok rok nije ljudski potvrđen i temporalna pravila nijesu validna. Today dashboard treba izvedene otvorene odluke, aktivne ili blocked radnje, potvrđene rokove, waiting/attention, konflikte i validation upozorenja. Matter Cockpit treba sve segmente, provenance, istoriju i temporalni pogled. Konačni dashboard model i query-ji ostaju van scope-a.

## 24. Snapshot and Cache Boundary

Snapshot može služiti performansama, pregledu, recovery poređenju ili auditu. Mora referencirati projection inpute i njihove identitete/hash vrijednosti, rules version, scope, generation time i validation status; mora biti validabilan ili odbaciv i ne smije sakriti novije zapise. Može biti autoritativan audit dokaz da je upravo određeni projekcioni rezultat sa navedenim input referencama, pravilima, vremenom i validation statusom bio generisan ili sačuvan.

Snapshot nije autoritativan dokaz da je svaki član bio pravno ili činjenično tačan, da su inputi bili potpuni, da nije postojao skriveni konflikt, da je i dalje current ili da može zamijeniti autoritativne VLA i audit zapise. Ne prepisuje audit istoriju.

Indeks/cache je potpuno izveden i odbaciv. Njegovo brisanje ne smije izgubiti objekte, verzije, Review Records, source/evidence veze, conflict disposition ili primijenjene Change Set rezultate. Odluka da li snapshot fizički postoji ostaje otvorena.

## 25. Manual File Edits and Reconciliation Boundary

File-first autoritativni zapis mora biti čitljiv i uređiv bez aplikacije, ali promjena mora biti detektabilna. Validna ručna promjena mora proći identifikaciju, validaciju, authority i audit/reconciliation pravila; nepoznata ili concurrent promjena, expected-hash mismatch ili promjena nakon projection input baseline-a označava projekciju stale/incomplete ili invalid prema učinku.

**Normative:** Aplikacija ne smije prepisati ručno izmijenjeni autoritativni zapis samo zato što ima stariju projekciju.

Single Writer i expected-hash pravila štite write boundary, ali ne čine projekciju autoritativnom. Mismatch zaustavlja automatski write/apply, čuva oba opažena stanja i zahtijeva reconciliation. Merge/recovery UI i algoritam pripadaju kasnijem WP-u.

## 26. Conceptual Metadata

Ovo je klasifikacija, ne fizička šema:

| Polje | Klasifikacija | Markdown-visible |
|---|---|---:|
| `matter_id` | autoritativno | DA |
| `projection_id`, `projection_type`, `projection_scope` | izvedeno/audit identitet projekcije | DA |
| `projection_generated_at`, `projection_rules_version` | audit projekcije | DA |
| `projection_input_references`, `projection_input_hashes` | audit/provenance; representation je implementaciona odluka | sažetak/reference DA |
| `effective_at`, `recorded_at`, `applied_at` | autoritativno/audit prema događaju | kada je relevantno DA |
| `state_segment` | izvedeno | DA |
| `source_object_id`, `source_object_version` | autoritativna referenca | DA za važan element |
| `inclusion_basis`, `review_record_ids`, `conflict_record_ids` | izvedena veza ka autoritativnom auditu | DA |
| `inclusion_change_set_id` | kasniji WP; autoritativna apply referenca | DA |
| `state_validity`, `stale_indicator`, `incomplete_indicator` | izvedeno i scope-aware: global/partial/segment/target | DA |
| `rebuild_status`, `validation_errors` | izvedeno/audit rebuilda | DA kada nije validno |

Tačni tipovi, cardinality, hash politika, serialization i obaveznost po objektu ostaju implementacioni detalji.

## 27. Markdown-visible Requirements

Budući human-readable prikaz mora bez aplikacije pokazati matter identitet; projection time i rules version; globalno ili lokalizovano validity/stale/incomplete stanje; Verified Facts; Working Assumptions; Factual Inferences; Legal Assessments; Party Positions; Open i Recorded Decisions; Legal Actions; potvrđene Deadlines; Expected Outputs; Open Conflicts; Waiting On; istorijske/superseded stavke; te source object, review purpose, conflict i apply osnovu svakog važnog elementa.

Prikaz mora koristiti jasne sekcije i upozorenja, ne boju kao jedini signal. Ne smije sadržati samo zbirne brojeve bez referenci niti predstavljati client-facing subset kao cijeli interni state. VLA-0C ne uvodi workspace fajl niti mijenja `command-center.md`.

## 28. Edge Cases

Normativni rezultati za svih 30 obaveznih slučajeva nalaze se u §23 pratećeg dokumenta. Ključni obrasci su:

- trust/review bez apply-ja ostaje proposal/candidate;
- assumption, inference, legal assessment i party position imaju odvojene segmente;
- novi conflict može blokirati samo pogođeni current scope, uz očuvanu istoriju;
- supersession/withdrawal/void uklanja current upotrebu, ne audit trag;
- source unavailability ili hash mismatch ne briše Evidence Link niti sam određuje istinu;
- deadline proposal, stari snapshot i obrisan indeks nikada nijesu autoritet;
- multi-matter association ne prenosi review/evidence/access/apply;
- conflicting apply rezultati i manual edit čine projekciju invalid/stale do reconciliation-a.
- future-effective apply ostaje scheduled, a purpose-specific review i lokalni validation problem ne globalizuju status.

## 29. Forbidden Shortcuts

Odbijeno je:

- postojanje ili `ACCEPTED` kao automatski active membership;
- `CONFIRMED_FROM_SOURCE` ili `SUPPORTS` kao automatski Verified Fact;
- `ASSUMED`, inference, pravna procjena ili party position kao Verified Fact;
- skrivanje active konflikta, open decision-a ili validation ograničenja;
- globalno blokiranje zbog scope-lokalnog konflikta;
- terminalni lifecycle objekat u current aktivnom segmentu;
- fizičko brisanje istorije ili overwrite Review Record-a;
- snapshot, indeks, cache, baza ili UI kao jedini izvor istine;
- prenos evidence/access/review konteksta između matters;
- sistemska promjena authority odluke;
- silent overwrite ručne izmjene;
- finalni Change Set, storage, schema, dashboard ili recovery dizajn u ovom WP-u.
- nazivanje `FACTUAL_INFERENCE` pretpostavkom ili globalizovanje purpose-specific review rezultata;
- proglašavanje cijelog Matter State-a invalidnim kada je validation problem pouzdano izolovan.

## 30. Open Decisions

1. Fizički Matter State fajl ili folder, ako ga bude.
2. Snapshot postojanje i format.
3. Projection rules version format i distribucija.
4. Event log ili druga audit serialization.
5. Current-state cache, indeks, baza i storage.
6. Exact Change Set apply format i atomicity.
7. Reconciliation UI i manual-edit merge strategija.
8. Dashboard query/model detalji.
9. Authority matrica po namjeni i segmentu.
10. Operational statusi za Legal Action, Deadline i Expected Output.
11. Historical/effective-time query i retroactivity implementacija.
12. Validation/rebuild engine i snapshot validation mehanizam.

## 31. Acceptance Criteria

Dokument prolazi ako:

- Matter State ostaje rebuildable projection nad file-first autoritativnim zapisima;
- active, verified factual, working, legal, party, decision, action, deadline, output, conflict i historical segmenti su odvojeni;
- Verified Fact je ograničen na eligible i primijenjeni active `FACTUAL_CLAIM`;
- review, trust i lifecycle ne proizvode apply automatizam;
- svaki current element vodi ka versioned objektu i auditu;
- conflict/incomplete/stale/manual-edit stanja ostaju vidljiva i scope-aware;
- positive membership i protective effect su odvojeni, a zaštitni block ne čeka positive apply;
- factual inference i assumption ostaju odvojeni segmenti;
- review i historical članstvo su purpose-aware;
- validity se lokalizuje na segment/target/scope kada je moguće;
- future-effective apply nije current prije `effective_at`;
- autoritativna odluka/disposition odmah ulazi u projection input;
- action bez assignee-ja nije operationally ready;
- snapshot audit dokazuje generisanje/snimanje rezultata, ne njegovu semantičku istinitost;
- snapshot i indeks su validabilni/odbacivi, ne autoritet;
- rebuild je determinističan za iste inpute i ista pravila;
- istorija se ne prepisuje niti briše;
- teme kasnijih paketa ostaju otvorene.

## 32. Relationship to VLA-0D and Later Packages

VLA-0D mora definisati Change Set proposal, authority, approval, expected-input zaštitu, atomic apply, rezultat i failure/reconciliation boundary. VLA-0C mu predaje samo zahtjev da active membership nastaje dokazivim uspješnim apply rezultatom, nikada samim reviewom.

Kasniji paketi moraju razraditi Review Workspace; deadline model i ljudsku potvrdu (VLA-0F); Client Action Pack i client-facing approval (VLA-0G); ADR/implementacione odluke (VLA-0H); storage/schema, projection/rebuild/validation engine, snapshot/cache/index, effective-time upite, dashboarde, authority matricu, recovery i manual-edit reconciliation. Ovaj dokument ne započinje nijedan od tih dizajna.
