# DOSSARA — WP VLA-0C Matter State Projection and Invariants

## 1. Document Control

| Polje | Vrijednost |
|---|---|
| Dokument | WP VLA-0C — Matter State Projection and Invariants |
| Status | Dokumentacioni nacrt za pregled naručioca |
| Datum | 6. avgust 2026. |
| Normativni baseline | Prihvaćeni VLA-0A, VLA-0B i prateći VLA-0C arhitektonski dokument |
| Vrsta rada | Konceptualne normativne matrice; nije runtime state machine niti šema |

## 2. Purpose

Ovaj dokument normativno određuje inpute, rezultate, eligibility, validaciju, rebuild i invarijante Matter State projekcije. Matrice opisuju dozvoljeno značenje, ne fizičku implementaciju.

## 3. Projection Inputs

| Input | Potrebna preciznost | Autoritativna uloga |
|---|---|---|
| matter association | `matter_id`, scope, verzija i lifecycle | ograničava projekciju na predmet |
| VLA objekti/verzije | stabilni ID, type/kind, sadržaj, lifecycle, provenance | sadržaj kandidata i istorija |
| Review Records | target verzija, purpose, status, reviewer, authority, vrijeme | review odluka; append-only |
| Source/Evidence zapisi | SI/CV/Representation/Scope, Evidence Link, relations, assessments | traceability i ograničenja iz VLA-0B |
| lifecycle događaji | target verzija, status, razlog, authority i vrijeme | current naspram historical |
| decision zapisi | request, status, authority, outcome i veze | decision projekcija |
| conflict/disposition | pogođeni assertion/source/matter/scope/purpose, materiality, status | scope-aware blocking |
| budući Change Set rezultat | odobrenje, target/input reference, uspješan apply i vrijeme | autoritativna osnova aktivnog članstva |
| projection rules | identitet/verzija i deklarisani temporalni pogled | determinističko tumačenje |

Nedostajući obavezni input ne smije se sintetisati iz indeksa, snapshot-a ili UI-ja.

## 4. Projection Outputs

Output mora sadržati deklarisani matter/scope/time/rules version, segmente, reference na inpute, validation rezultat, stale/incomplete/conflict indikatore i rebuild rezultat. Output može biti current, state-as-recorded-at-T ili budući effective-at-T pogled. Nijedan output nije samostalni autoritativni zapis.

## 5. State Segment Applicability Matrix

| Segment | Dozvoljeni primarni sadržaj | Priroda | Isključen sadržaj |
|---|---|---|---|
| Verified factual | active applied `MATTER_ASSERTION` + `FACTUAL_CLAIM` | izvedeno članstvo | assumptions, inference, law, positions |
| Working assumptions | applied `ASSUMED` factual claim | interno, izvedeno | inference i Verified Fact label |
| Factual inferences | reviewed/applied `FACTUAL_INFERENCE` sa osnovom i ograničenjima | interno, izvedeno; nije enum odluka | assumption i Verified Fact label |
| Legal assessments | applied `LEGAL_CHARACTERIZATION` / `LEGAL_OPINION` | izvedeno, odvojeno od činjenica | neutral factual prikaz |
| Party positions | applied `PARTY_POSITION` | attributed/derived segment | neutral factual prikaz |
| Open decisions | current `DECISION_REQUEST` pending/deferred | izvedeno | decided/cancelled current request |
| Recorded decisions | authoritative outcome references | izvedeni prikaz zapisa | automatizam prema drugim osama |
| Active legal actions | applied nonterminal `LEGAL_ACTION` | izvedeno | terminalna verzija kao active |
| Deadlines | applied, human-confirmed `DEADLINE` | izvedeno | system proposal |
| Expected outputs | applied `EXPECTED_OUTPUT` definition/status references | izvedeno | implied approval/client release |
| Open conflicts | unresolved scoped conflict/discrepancy | izvedeno iz audit zapisa | globalizovani conflict bez scope-a |
| Waiting/attention | dependency/attention calculation | potpuno izvedeno | izmišljena action/authority |
| Historical records | terminal, rejected, ranije applied/reviewed verzije i događaji | auditabilni istorijski prikaz | fizičko brisanje |

## 6. Inclusion Eligibility Matrix

| Uslov | Candidate | Approved | Applied active | Posljedica ako nedostaje |
|---|---:|---:|---:|---|
| target verzija postoji i pripada matter/scope-u | DA | obavezno | obavezno | invalid target |
| lifecycle `ACTIVE` | zavisi | obavezno | obavezno | historical/excluded |
| primjenjivi trust/evidence uslovi | zavisi od segmenta | obavezno gdje se traži | obavezno | blocked/incomplete |
| Review Record za istu verziju i purpose | NE | obavezno | obavezno | missing review |
| dovoljan authority | NE | obavezno | obavezno | unresolved authority |
| nema blocking konflikta u istom scope/use | kandidat može postojati | obavezno | obavezno | conflict-blocked |
| odobreni uspješni Change Set apply | NE | NE | obavezno | approved, not applied |
| projection input/rules validni | — | — | obavezno za prikaz current | projection invalid/stale |

## 7. Exclusion and Historical Retention Matrix

| Događaj/stanje | Active state | Historical state | Audit pravilo |
|---|---|---|---|
| `PROPOSED` ili `IN_REVIEW` | ne ulazi | proposal/review trag ostaje | target/version/purpose |
| `ACCEPTED`, bez apply-ja | ne ulazi | review ostaje | ne fabrikovati membership |
| `REJECTED` za purpose P | ne ulazi za P; nema globalni učinak na druge purpose-e | purpose-specific review ostaje | target/version/purpose/reason/authority |
| `SUPERSEDED` | uklanja staru verziju u pogođenom scope-u | ostaje sa replacement vezom | nema globalizacije scope-a |
| `WITHDRAWN` | uklanja | ostaje | actor/reason/time |
| `VOIDED` | ne koristi | ostaje kao poništen zapis | korektivna veza |
| blocking conflict | suspenduje/ne uključuje pogođenu upotrebu | ranije članstvo ostaje istorijski | conflict scope/disposition |
| validni remove apply | uklanja | ranija primjena ostaje | novi Change Set rezultat |
| source unavailable | ne uklanja automatski | evidence history ostaje | limitation/warning |

## 8. Verified Fact Eligibility Matrix

| Kriterijum | Mora važiti | Zabranjena zamjena |
|---|---:|---|
| `MATTER_ASSERTION` + `FACTUAL_CLAIM` | DA | drugi assertion kind |
| atomska konkretna verzija | DA | zbirna ili promijenjena assertion |
| lifecycle `ACTIVE` | DA | terminalna verzija |
| relevantan Source Scope + Evidence Link | DA | filename/path ili opšta reputacija izvora |
| `CONFIRMED_FROM_SOURCE` ljudski potvrđen | DA | `SUPPORTS`, `ASSUMED` ili system proposal |
| Review Record za Verified Fact inclusion purpose | DA | acceptance za drugi purpose |
| ovlašćeni ljudski reviewer | DA | sistem/AI |
| nema unresolved material conflict za isti scope/use | DA | globalno „nema konflikta“ |
| uspješan budući approved Change Set apply | DA | samo `ACCEPTED` |
| provenance/reference dostupni projekciji | DA | snapshot-only zapis |

## 9. Assertion Kind Projection Matrix

| Assertion kind | Dozvoljeni current segment | Verified Fact | Obavezno razgraničenje |
|---|---|---:|---|
| `FACTUAL_CLAIM` | verified factual ili working assumptions | samo uz sve §8 uslove | trust, review i apply odvojeni |
| `ATTRIBUTED_STATEMENT` | party/working kontekst; može osnovati zaseban factual claim o izjavi | NE neposredno | postojanje izjave ≠ istinitost sadržaja |
| `FACTUAL_INFERENCE` | zasebni Factual Inferences / decision support | NE | nije assumption; inference label, osnov i ograničenje |
| `LEGAL_CHARACTERIZATION` | legal assessments | NE | pravo ≠ činjenica |
| `LEGAL_OPINION` | legal assessments | NE | autor, authority, scope i verzija |
| `PARTY_POSITION` | party positions | NE | identitet strane; nije neutralna činjenica |

## 10. Review/Trust/Lifecycle Cross-axis Matrix

| Kombinacija | Projekcioni rezultat |
|---|---|
| `CONFIRMED_FROM_SOURCE` + `PROPOSED` + `ACTIVE` | candidate; nije active/verified |
| `ASSUMED` + `ACCEPTED` za internu analizu + `ACTIVE` | eligible za working assumptions; apply i warning obavezni |
| `CONFIRMED_FROM_SOURCE` + `ACCEPTED` za inclusion + `ACTIVE`, bez apply-ja | approved, not applied |
| bilo koji trust + `ACCEPTED` + `WITHDRAWN` | excluded current; historical accepted/withdrawn |
| `CONFIRMED_FROM_SOURCE` + `REJECTED` za purpose A + `ACTIVE` | excluded samo za A; može biti accepted/proposed za drugi purpose; trust ostaje odvojen |
| ista `ACTIVE` verzija + `ACCEPTED` interno + `REJECTED` client-facing + `PROPOSED` final output | tri purpose-specific review projekcije; nema globalnog review statusa |
| bilo koji review/trust + `SUPERSEDED`/`VOIDED` | historical, ne current |
| `UNASSESSED` + bilo koji review | nije Verified Fact; review ne mijenja trust |

## 11. Decision Projection Matrix

| Decision stanje | Segment | Active? | Pravilo |
|---|---|---:|---|
| pending | Open Decisions | DA nakon apply-ja | authority i pitanje vidljivi |
| deferred | Open Decisions | DA | razlog/uslov ponovnog razmatranja |
| decided | Recorded Decisions + history | ne kao open | outcome ne mijenja druge objekte automatski |
| cancelled | Recorded Decisions/history | ne | razlog i authority ostaju |
| reconsideration | novi/povezani open request + stara istorija | prema novom requestu | ne prepisuje staru odluku |

Jednom autoritativno evidentirana odluka, cancellation, reconsideration ili conflict disposition odmah je obavezni projection/validation input. Njena evidencija mora biti vidljiva i kada downstream članstvo ili radnja još čeka novi Change Set/apply.

## 12. Action/Deadline/Output Projection Matrix

| Objekat/scenario | Current segment | Blocker/upozorenje | Ne smije se zaključiti |
|---|---|---|---|
| applied nonterminal Legal Action sa assignee-jem | Active Legal Actions, operationally ready prema ostalim pravilima | ostala validation ograničenja | konačni statusni rječnik koji WP nije usvojio |
| applied Legal Action bez assignee-ja | Active Legal Actions kao blocked/incomplete/assignment required | nije operationally ready; assignment attention | automatski assignee ili uredna izvršivost |
| completed/withdrawn/cancelled action | Historical | veza ka ishodu | output odobren |
| system-proposed deadline | proposal, van Deadlines | human confirmation missing | rok potvrđen/overdue |
| human-confirmed, applied deadline | Deadlines | osnov i authority vidljivi | automatski obračun ispravan |
| Expected Output definition | Expected Outputs | status/reference ograničenje | dokument postoji |
| work/finalized/approved/client-facing output | odvojeni kasniji zapisi/statusi | authority po svakoj fazi | jedna faza implicira drugu |

## 13. Conflict Blocking Matrix

| Conflict/ograničenje | Verified factual | Ostali segmenti | Scope pravilo |
|---|---|---|---|
| unresolved material conflict | blokira pogođeni claim/use | upozorenje ili blokada prema namjeni | samo evidentirani scope |
| unresolved non-material conflict | upozorenje | upozorenje | ne globalizovati |
| partial support | blokira preširoku claim verziju | podržani dio može biti zaseban candidate | atomizovati ili ograničiti |
| source discrepancy | incomplete/warning dok se ne procijeni | warning | target-specific |
| unavailable representation | ne poništava istorijski status; može blokirati novu provjeru | limitation | Representation-specific |
| hash mismatch | stale/incomplete/manual-edit conflict prema targetu | upozorenje/blokada write-a | nije dokaz tamperinga ili neistine |
| disposition za internu upotrebu | može razriješiti samo internu eligibility | nema client-facing učinka | purpose-specific |

Novi autoritativni material conflict odmah proizvodi protective suspension/block pogođenog current scope-a bez čekanja positive apply-ja. Raniji validni membership i apply osnov ostaju istorijski vidljivi; trajna downstream membership promjena zahtijeva budući audit/apply osnov.

## 14. Temporal Rules

1. `recorded_at` određuje kada je sistem imao zapis; `effective_at` opisuje navedeno dejstvo; `applied_at` označava kontrolisanu primjenu.
2. `superseded_at`, `withdrawn_at` i `voided_at` ne brišu raniji period niti review/apply istoriju.
3. Projection generation time nije nijedno od navedenih vremena.
4. Current projection koristi validne inpute poznate i primijenjene do generation time-a.
5. State-as-recorded-at-T ne koristi kasnije evidentirane zapise, čak i ako imaju raniji `effective_at`.
6. Effective-at-T pogled ne smije retroaktivno izmijeniti recorded history; implementacija ostaje otvorena.
7. Retroaktivni zapis mora otkriti downstream odluke, akcije i outpute kojima može promijeniti osnovu i zahtijeva authority/review.
8. Zapis ili Change Set recorded/applied prije budućeg `effective_at` može biti future-effective/scheduled, ali nije current i nema pravno ili operativno dejstvo prije tog vremena.

## 15. Rebuild Sequence

1. Identifikovati matter, projection scope, temporalni pogled i rules version.
2. Učitati autoritativne objekte, verzije, relacije i audit zapise.
3. Provjeriti identitete, matter associations, verzije, čitljivost i integrity baseline.
4. Primijeniti lifecycle događaje bez prepisivanja istorije.
5. Povezati važeće Review Records po target verziji, purpose-u i authority-ju.
6. Primijeniti VLA-0B source/evidence, assessment i scope-aware conflict ograničenja.
7. Obuhvatiti autoritativne odluke, cancellation/reconsideration i conflict disposition kao immediate projection inpute; odvojeno označiti njihove još neprimijenjene downstream posljedice.
8. Primijeniti samo validne uspješne rezultate budućih odobrenih Change Set-ova za positive membership i trajne downstream promjene.
9. Primijeniti protective warning/block/suspension efekte novih autoritativnih conflict, lifecycle, integrity, manual-edit, association i validation inputa bez čekanja positive apply-ja.
10. Izgraditi aktivne segmente.
11. Izgraditi purpose-aware temporalni historical projection.
12. Izračunati Waiting On i attention projekcije sa osnovom.
13. Provjeriti invarijante i forbidden combinations.
14. Objaviti globalno ili lokalizovano valid/incomplete/stale/invalid stanje i rebuild rezultat sa greškama.

Ovo je konceptualni redoslijed, ne algoritam ili storage dizajn.

## 16. Projection Validation

| Provjera | Valid rezultat | Failure rezultat |
|---|---|---|
| matter/scope isolation | svaki član ima valjanu association | invalid membership |
| version integrity | sve reference rješive na konkretnu verziju | incomplete/invalid |
| review binding | version + purpose + authority odgovaraju | excluded/blocked |
| apply binding | uspješan apply referencira očekivani input | invalid ili conflict |
| lifecycle | terminalne verzije nijesu current; protective effect je immediate | pogođeni target blocked; global invalid samo ako nije izolovano |
| evidence/conflict | scope i use pravilno primijenjeni | invalid/blocking warning |
| segment type | object/kind je dozvoljen | forbidden combination |
| provenance | current element vodi ka inputima/auditu | invalid/incomplete |
| determinism | isti input/rules daje isti rezultat | invalid rebuild |
| freshness | nema novijeg/neobuhvaćenog inputa | stale |

Validation rezultat mora navesti matter, segment, target, scope/purpose, pravilo, uzrok i potrebnu ljudsku radnju; ne smije se svesti na „problem“.

Validity je scope-aware: projekcija može biti globally valid, globally invalid ili partially invalid; pojedinačni segment ili target/scope može biti invalid ili blocked dok nepogođeni segmenti ostaju validni. Pouzdano izolovan problem ne proglašava cijeli Matter State invalidnim. Globalni invalid rezultat ograničen je na fundamentalne probleme: nepouzdan matter identitet, nepoznatu projection rules version, nerazrješivu globalnu apply/ordering istoriju, nemoguć deterministički rebuild ili fundamentalnu povredu projekcionih invarijanti.

## 17. Stale and Incomplete Projection Rules

`stale` znači da je poznat noviji/promijenjen input ili rules version koji projekcija ne obuhvata. `incomplete` znači da obavezni input nije dostupan, čitljiv ili razrješiv. `invalid` znači da inputi ili rezultat krše invarijantu ili imaju nerazrješivu konfliktnu primjenu. Oznake se mogu pojaviti zajedno i moraju imati reference na uzrok.

Pending review/decision, missing source, unavailable representation, hash mismatch i manual edit zadržavaju svoje zasebne oznake. Sistem ne smije samo zato što je projekcija incomplete proglasiti sve članove netačnim niti sakriti pouzdano nepogođene segmente.

## 18. Snapshot Validation

Snapshot je upotrebljiv samo ako su matter/scope, generation time, rules version, input references/hashes i validation rezultat poznati. Može biti autoritativni audit dokaz da je određeni projekcioni rezultat sa upravo tim referencama, pravilima, vremenom i validation statusom bio generisan ili sačuvan. Nije dokaz pravne ili činjenične tačnosti svakog člana, potpunosti inputa, odsustva skrivenog konflikta ili current statusa i ne zamjenjuje autoritativne VLA/audit zapise. Poređenje mora otkriti novije Review Records, lifecycle/conflict/apply događaje i promijenjene inpute. Stari snapshot može ubrzati rebuild ili poređenje, ali se ne prikazuje kao current i nikad ne popunjava nedostajući autoritativni audit.

## 19. Manual Edit and Mismatch Scenarios

| Scenario | Projekcioni rezultat | Obavezna kontrola |
|---|---|---|
| validna ručna promjena, još neobrađena | stale/incomplete do validacije | identitet, authority, audit/reconciliation |
| nepoznata promjena | manual-edit conflict | zaustaviti silent overwrite/apply |
| concurrent promjena | expected-input conflict | sačuvati oba opažena stanja; reconciliation |
| expected-hash mismatch | stale/invalid prema učinku | ne zaključiti tampering; ne pisati preko |
| Representation hash mismatch | source integrity warning | VLA-0B assessment; ne mijenjati trust automatski |
| starija projekcija naspram novijeg fajla | stale | rebuild tek iz provjerenog inputa |

## 20. Multi-matter Isolation Rules

1. Svaka projekcija ima tačan `matter_id` i scope.
2. Shared Source Item ne prenosi Evidence Link, access, confidentiality, review ili conflict disposition.
3. Assertion review za matter A nema učinak u matter B bez eksplicitnog odgovarajućeg zapisa.
4. Lifecycle ili replacement sa context scope-om ne globalizuje se.
5. Pogrešna matter association mora biti auditabilno ispravljena; pogođene projekcije su stale/invalid do rebuilda.
6. Ista verzija može biti active/applied u jednom scope-u, a proposed, blocked ili historical u drugom.

## 21. Projection Invariants

1. Nijedan objekat ne ulazi u active state samo zato što postoji.
2. Nijedan objekat ne ulazi u active state samo zato što je `ACCEPTED`.
3. Verified Factual State ne sadrži `ASSUMED`.
4. Verified Factual State ne sadrži `LEGAL_CHARACTERIZATION`, `LEGAL_OPINION`, `FACTUAL_INFERENCE` ili `PARTY_POSITION`.
5. Verified Factual State ne sadrži lifecycle terminalne verzije.
6. Neriješen material conflict blokira samo pogođeni scope i upotrebu.
7. Istorijski Review Record se ne prepisuje.
8. Superseded objekat ne nestaje iz istorije.
9. Withdrawn ili voided objekat se ne koristi u aktivnoj projekciji.
10. Izvedena projekcija nije jedini autoritativni zapis.
11. Brisanje indeksa ne smije uništiti Matter State.
12. Snapshot ne smije prepisati audit istoriju.
13. Ručna izmjena autoritativnog zapisa mora biti detektabilna i auditabilna.
14. Multi-matter Source Item ne prenosi automatski evidence ili access kontekst.
15. Client-facing projekcija nije isto što i interni Matter State.
16. Rebuild mora biti determinističan za isti autoritativni input i ista pravila.
17. Nevažeća ili nepotpuna projekcija mora biti vidljivo označena.
18. Current state ne smije sakriti active conflict ili open decision.
19. Current state mora voditi ka objektima i audit zapisima iz kojih je izveden.
20. Sistem ne smije samostalno promijeniti authority odluku.
21. Recorded time i effective time ne smiju se izjednačiti.
22. Apply članstvo mora biti vezano za uspješan budući approved Change Set rezultat.
23. Source unavailability ne briše istorijski Evidence Link.
24. Scope-specific disposition nema učinak izvan svog scope-a/purpose-a.
25. Attention projekcija bez identifikovanog osnova nije validna.
26. Protective warning/blocking/suspension effect ne čeka positive Change Set apply.
27. Protective effect ne izvršava tiho trajnu zamjenu ili uklanjanje membership-a.
28. Purpose-specific rejection ne čini active verziju globalno istorijskom ili rejected za drugi purpose.
29. `FACTUAL_INFERENCE` nije assumption i mora ostati zasebno označen.
30. Validation se lokalizuje na segment/target/scope kada je problem pouzdano izolovan.
31. Historically verified claim ostaje istorijski vidljiv sa ranijim apply osnovom nakon current conflict block-a.
32. Future-effective zapis ili apply nije current prije `effective_at`.
33. Autoritativna odluka/disposition je projection input prije downstream apply-ja.
34. Legal Action bez assignee-ja nije operationally ready.
35. Snapshot audit dokazuje generisanje/snimanje rezultata, ne semantičku istinitost projekcije.

## 22. Forbidden State Combinations

| Kombinacija | Rezultat |
|---|---|
| Verified Fact + `ASSUMED`/`UNASSESSED` | INVALID |
| Verified Fact + non-`FACTUAL_CLAIM` | INVALID |
| Verified Fact + terminal lifecycle | INVALID |
| active membership + nema uspješnog apply rezultata | INVALID |
| current state + `WITHDRAWN`/`VOIDED` target | INVALID |
| `ACCEPTED` za purpose A korišćen kao acceptance za purpose B | INVALID |
| client-facing iz internog acceptance-a bez posebnog approval-a | INVALID |
| global conflict block iz scope-local konflikta | INVALID |
| source shared → evidence/access shared | INVALID |
| snapshot/index-only current member | INVALID |
| overwrite manual edit zbog stare projekcije | FORBIDDEN |
| system/AI kao final review/decision authority | FORBIDDEN |
| `FACTUAL_INFERENCE` prikazan kao Working Assumption | INVALID |
| purpose-specific `REJECTED` prikazan kao globalni rejection | INVALID |
| izolovani target problem proglašen globalno invalidnim bez osnova | INVALID |
| future-effective apply prikazan kao current prije vremena | INVALID |
| action bez assignee-ja prikazana kao operationally ready | INVALID |
| snapshot korišćen kao dokaz semantičke istinitosti ili potpunosti | INVALID |

## 23. Edge-case Result Matrix

Skraćenice: AR = autoritativni inputi; Ax = relevantne ose; Seg = segment; Hist = istorijsko zadržavanje; Auth = potreban authority. Svaki red je normativan.

| # | Scenario i AR/Ax | Seg / active / Hist | Blocker, Auth i audit | Sistem ne smije zaključiti |
|---:|---|---|---|---|
| 1 | Claim `CONFIRMED_FROM_SOURCE`, `PROPOSED`; AR: assertion version, EL/scope, trust audit; Ax: trust/review/lifecycle | candidate; active NE; Hist DA | missing review + apply; ovlašćeni reviewer; sačuvati proposal/trust | confirmed znači Verified Fact |
| 2 | `ASSUMED`, `ACCEPTED` za internu analizu; AR: assertion, Review Record; Ax: trust/review | Working Assumptions tek nakon apply; Hist DA | apply nedostaje ako nije evidentiran; lawyer za purpose; warning trajno | acceptance mijenja trust |
| 3 | Factual claim reviewovan, nema Change Set; AR: assertion/review/evidence; Ax: review/apply | approved-not-applied; active NE; Hist DA | missing apply; budući Change Set authority; review audit ostaje | review je apply |
| 4 | Verified Fact dobija novi konfliktni izvor; AR: raniji apply, novi source/EL/conflict; Ax: conflict/lifecycle | immediately historically verified/currently conflict-blocked samo za pogođeni scope; raniji membership Hist DA | protective block bez positive apply-ja; reason/time/source/conflict/old apply vidljivi; disposition authority | brisati raniju verifikaciju, čekati novi apply za upozorenje ili blokirati cijeli matter |
| 5 | Verified Fact superseded preciznijim claim-om; AR: obje verzije, supersession, reviews/applies | nova verzija samo ako zasebno eligible/applied; stara Hist DA | authority + novi apply; dvosmjerna veza | naslijediti review/trust/apply |
| 6 | Pravna kvalifikacija promijenjena, facts isti; AR: legal versions/supersession, factual refs | Legal Assessments; nova active nakon apply; stara Hist DA | legal authority/review; činjenice ne mijenjati | facts su superseded |
| 7 | Party Position prihvaćen kao tačan prikaz; AR: position, attribution/evidence, review | Party Positions nakon apply; Hist DA | authority za purpose; labela stranke | sadržaj stava je neutralna činjenica |
| 8 | Source unavailable, historical EL postoji; AR: SI/CV/Rep availability audit, EL | postojeće pogođeno članstvo uz limitation prema pravilima; Hist DA | unavailable warning/review potreba; VLA-0B audit | EL nestaje ili izvor je povučen |
| 9 | Representation hash mismatch; AR: baseline/check/Rep | source integrity warning; active zavisi od scope/materiality; Hist DA | assess/reconcile; tehnički recorder + legal authority za učinak | tampering, neistina ili novi SI automatski |
| 10 | Decision Request deferred; AR: request/status/reason | Open Decisions active nakon apply; Hist DA | condition/date/authority visible | cancelled ili decided |
| 11 | Klijent donio poslovnu odluku, action nije otvorena; AR: decision/outcome/authority | odluka odmah u Recorded Decisions/inputu; downstream action NE; Hist DA | no-action/Change Set required attention; client authority audit | ignorisati odluku do Change Set-a ili automatski stvoriti action |
| 12 | Action završena, Expected Output nije odobren; AR: action outcome, output record/reviews | action Historical; output u svom stvarnom segment/statusu | output approval missing; odvojeni authorities/audit | completion odobrava output |
| 13 | Deadline system-proposed, bez human review; AR: proposal/provenance | van Deadlines; proposal/history DA | human confirmation + future apply | confirmed, urgent ili overdue rok |
| 14 | Assertion u dva matters, različit review scope; AR: associations i zasebni reviews | zaseban rezultat po matter-u; Hist DA | svaki matter authority/apply zasebno | review se prenosi |
| 15 | Source Item u dva matters, različiti EL; AR: SI + dvije associations/EL/access | source/evidence ograničenje po matter-u | review/access/context zasebni; oba audita | shared SI znači shared evidence/access |
| 16 | Stari snapshot nema noviji Review Record; AR: snapshot/input refs + novi review | snapshot stale; current rebuild koristi novi review | freshness validation; audit oba vremena | snapshot je current/authority |
| 17 | Indeks obrisan; AR: file-first records | rebuild svih segmenata; active prema audit inputima | rebuild/validation rezultat | Matter State izgubljen |
| 18 | Autoritativni Markdown ručno izmijenjen; AR: file, expected hash, observation | immediate protective stale/manual-edit conflict za pogođeni target; nepogođeni segmenti validni; active rezultat samo ako dokaziv | zaustaviti write bez čekanja apply-ja; reconciliation authority/audit | tiho vratiti staru projekciju ili globalno invalidirati izolovan problem |
| 19 | Dva Change Set rezultata primjenjuju konfliktne promjene; AR: oba approvals/inputs/apply results | invalid pogođeni scope; global invalid samo ako ordering istorija nije globalno razrješiva; Hist oba | expected-input/ordering reconciliation; authorized resolver | proizvoljno izabrati posljednji ili sakriti validne nepogođene segmente |
| 20 | `ACCEPTED` + `WITHDRAWN`; AR: review + lifecycle | active NE; Historical DA | withdrawal authority/reason; oba zapisa | accepted nadjačava lifecycle |
| 21 | istorijski `ACCEPTED`, sada `SUPERSEDED`; AR: review/supersession | old active NE; Historical DA | replacement veza; nova verzija zasebno review/apply | stari review nestaje ili važi za novu verziju |
| 22 | Material conflict riješen samo za internu namjenu; AR: scoped disposition | interni segment prema drugim uslovima; client-facing i drugi scope blocked | legal authority/purpose audit | disposition je globalan |
| 23 | Assertion podržana samo partial scope-om; AR: assertion/EL/source scope | preširoka claim nije Verified; podržani atom može biti candidate | atomizacija/preciziranje + review/apply | cijela assertion je confirmed |
| 24 | Verified Fact sa pogrešnim matter association-om; AR: assertion/apply/association correction | uklonjen/invalid u pogrešnom matter-u; Hist DA; drugi matter zahtijeva zaseban apply | correction/reconciliation authority; audit oba contexta | prenijeti status u pravi matter |
| 25 | Open Decision više nije potrebna; AR: request + cancellation/closure decision | ne active; Recorded/Historical DA | authority i razlog; apply po pravilima | tiho sakriti/obrisati |
| 26 | client-facing approval postoji, interni state kasnije promijenjen; AR: approval/version + noviji internal input | stari client-facing artifact ostaje istorijski; current client view stale/pending | novi approval za novu verziju; oba audita | stari approval pokriva novi state |
| 27 | Working Assumption korišćena u draftu; AR: assumption/review/apply + output dependency | Working Assumptions + draft relation; active prema apply-ju; Hist DA | warning u draft osnovi; reviewer/author | draft pretvara assumption u fact |
| 28 | Legal Action nema odgovorno lice; AR: action/apply | applied but blocked/incomplete/assignment required; nije operationally ready; Hist DA | immediate assignment attention; human assignment; audit warning/osnova | sistem izmišlja assignee ili prikazuje urednu izvršivost |
| 29 | Matter nema next action; AR: validna projekcija bez qualifying action | `no next action` attention; nije primarni record | validation/confidence i timestamp; owner review | predmet nema pravne potrebe ili je završen |
| 30 | Rebuild se razlikuje od snapshot-a; AR: snapshot refs/rules + current inputs/rebuild | rebuild rezultat current samo ako validan; snapshot stale/invalid; Hist DA | diff/provenance/validation; reconciliation ako isti inputs/rules | snapshot nadjačava rebuild ili tiho se prepisuje |

### 23.1 Supplemental corrective edge cases

| # | Scenario i AR/Ax | Seg / active / Hist | Blocker, Auth i audit | Sistem ne smije zaključiti |
|---:|---|---|---|---|
| 31 | Applied zapis ima budući `effective_at`; AR: record/apply/effective time | future-effective/scheduled; current NE do vremena; Hist/audit DA | temporal validation i jasno vrijeme | apply znači immediate current effect |
| 32 | Validation greška izolovana na jedan target; AR: validation input/result | target/segment blocked ili invalid; ostali pouzdani segmenti validni | matter/segment/target/scope/rule/cause obavezni | cijeli Matter State invalid |
| 33 | Ista active verzija različito reviewovana po purpose-u; AR: tri Review Records | accepted interno, rejected client-facing, proposed final output; historical/exclusion purpose-aware | authority po purpose-u; svi reviews append-only | jedan globalni review status |
| 34 | Pregledani `FACTUAL_INFERENCE`; AR: assertion/inference basis/review/apply | Factual Inferences nakon apply-ja; nikad Working Assumptions; Hist DA | inference limitations i purpose authority | inference je assumption ili Verified Fact |

## 24. Conceptual Acceptance Tests

| Test | Očekivani rezultat |
|---|---|
| postojeći `ACCEPTED` claim bez Change Set apply-ja | nije active |
| eligible factual claim sa svim uslovima i apply-jem | Verified Factual State sa punim referencama |
| assumption prihvaćena za internu analizu | Working Assumptions, vidljivo nije Verified Fact |
| reviewed/applied factual inference | zasebni Factual Inferences, vidljivo nije assumption ni Verified Fact |
| legal opinion i party position | odvojeni segmenti, nikad factual |
| terminal lifecycle verzija | historical, ne current |
| novi material conflict jednog scope-a | immediate protective block; raniji verified membership istorijski vidljiv; samo pogođeni scope blokiran |
| source u dva matters | zasebni EL/access/review/apply ishodi |
| obrisan indeks | rebuild iz file-first audita bez gubitka |
| stari snapshot | detektovan kao stale prema novijem inputu |
| isti inputi i rules version, ponovljen rebuild | identičan semantički rezultat |
| missing input ili broken reference | vidljivo incomplete/invalid sa uzrokom |
| ručna concurrent izmjena | nema silent overwrite-a; reconciliation potreban |
| state-as-recorded-at-T | ne koristi kasnije recorded input |
| client-facing approval stare verzije | ne prenosi se na noviju internu verziju |
| no next action | attention signal sa osnovom, ne nova akcija |
| purpose-specific rejection uz acceptance za drugi purpose | zasebni rezultati; nema globalnog rejection-a |
| applied zapis sa budućim `effective_at` | future-effective/scheduled; nije current prije vremena |
| autoritativna odluka bez downstream apply-ja | odluka je odmah projection input; downstream promjena označena kao pending |
| action bez assignee-ja | applied but blocked/assignment required; nije operationally ready |
| izolovana validation greška | pogođeni target/segment invalid ili blocked; nepogođeni segmenti validni |
| snapshot sa validnim audit metapodacima | dokazuje generisanje/snimanje, ne truth/completeness/current status |

## 25. Open Decisions

- fizička reprezentacija projekcije i snapshot-a;
- projection rules version format;
- event/audit serialization, storage, database, index i cache;
- exact Change Set approval/apply/ordering/conflict format (VLA-0D);
- authority matrica po segmentu i purpose-u;
- operational statusi Action/Deadline/Expected Output;
- effective-time i retroactivity engine;
- rebuild/validation/snapshot implementation;
- manual-edit reconciliation/merge i recovery UI;
- dashboard queries i historical query format.

Nijedna otvorena odluka ne suspenduje normativne invarijante ovog dokumenta.
