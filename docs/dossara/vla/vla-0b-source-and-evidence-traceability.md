# DOSSARA — WP VLA-0B Source and Evidence Traceability

## 1. Document Control

| Polje | Vrijednost |
|---|---|
| Dokument | WP VLA-0B — Source and Evidence Traceability |
| Status | Documentation-only draft za pregled naručioca |
| Datum | 6. avgust 2026. |
| Repository branch | `spike/phase-0c-electron-forge-webpack` |
| Normativni baseline | WP VLA-0A, prihvaćen commitom `d78cfd4f255d01795a7a9d59e9a387ac38fa6fb4` |
| Formalni kontrolni akt | `docs/dossara/decision-alignment-register-v1.2.md` |
| Vrsta rada | Konceptualna dokumentacija; bez šeme, registra i runtime ponašanja |

## 2. Purpose and Scope

Ovaj dokument definiše file-first i auditabilan model kojim se može utvrditi koji izvor postoji, odakle potiče, koja je njegova evidentirana sadržajna verzija, šta sadrži, koji je dio relevantan i kakav je odnos tog dijela prema konkretnoj `MATTER_ASSERTION`.

Model obuhvata identitet, verzije, reprezentacije, lokacije, provenijenciju, scope, evidence i source relacije, konflikte, integritet, dostupnost, procjene, authority, povjerljivost i ljudski čitljiv audit trag. Ne utvrđuje objektivnu istinu, autentičnost po automatizmu, pravnu dokaznu snagu niti model pravnih autoriteta.

**Out of scope:** fizički Source Registry, CONTROL fajl, Markdown serialization template, JSON/TypeScript ili baza šema, migracija, intake, watcher, OCR, parser, email sync, storage dizajn, access enforcement i aplikacioni kod.

## 3. Normative Language

- **MUST / mora** označava obavezno pravilo.
- **MUST NOT / ne smije** označava zabranu.
- **SHOULD / treba** označava preporuku.
- **MAY / može** označava dozvolu, ne automatsko ponašanje.
- **Open decision** označava kasniju implementacionu ili ADR odluku koja ne mijenja ovdje zaključanu semantiku.

## 4. Alignment with VLA-0A

`SOURCE_ITEM` i `MATTER_ASSERTION` ostaju različiti objekti. Jedan izvor može biti povezan sa više assertions, a jedna assertion sa više izvora. `UNASSESSED`, `CONFIRMED_FROM_SOURCE` i `ASSUMED` ostaju trust statusi assertion-a. `CONFIRMED_FROM_SOURCE` nije source status. Samo `FACTUAL_CLAIM` može neposredno biti kandidat za Verified Fact; `ATTRIBUTED_STATEMENT` potvrđuje postojanje atribuirane izjave, ne istinitost njenog sadržaja.

Sistem ili budući AI može predložiti klasifikaciju, scope, relaciju, konflikt, atribuciju ili duplikat. Kritičnu source/evidence procjenu potvrđuje ovlašćeni čovjek, a pravno relevantnu procjenu ovlašćeni advokat. Nije pronađena kontradikcija između ovog modela i VLA-0A.

## 5. Conceptual Model

| Koncept | Kategorija | Normativno značenje |
|---|---|---|
| `SOURCE_ITEM` | primarni VLA objekat | stabilni logički identitet evidencijskog materijala |
| `SOURCE_CONTENT_VERSION` | konceptualna komponenta | nepromjenjivo evidentirano sadržajno stanje Source Item-a |
| `SOURCE_REPRESENTATION` | konceptualna komponenta | tehničko ili fizičko oličenje izvora ili verzije |
| `SOURCE_LOCATION_RECORD` | audit record | trenutna ili istorijska lokacija reprezentacije |
| `PROVENANCE_EVENT` | audit record | događaj nastanka, dostave, prijema, evidentiranja ili transformacije |
| `SOURCE_SCOPE` | konceptualna komponenta | relevantni dio konkretne content version |
| `EVIDENCE_LINK` | relation record | veza scope-a sa konkretnom assertion u matter kontekstu |
| `SOURCE_RELATION` | relation record | eksplicitna veza izvora, verzija ili reprezentacija |
| `SOURCE_ASSESSMENT` | assessment record | ograničena procjena određenog predmeta i namjene |
| `CONFLICT_RECORD` | audit/relation record | eksplicitna evidencija neslaganja i njegovog disposition-a |

Cardinality, ID format i fizička serialization forma ostaju implementacione odluke. Semantičke granice iz tabele nijesu otvorene.

## 6. Source Classification Axes

Jedan nediferencirani `source_type` enum ne smije objediniti sljedeće ose:

| Osa | Primjeri | Status odluke |
|---|---|---|
| carrier / osnovna reprezentacija | local file, email message, image, spreadsheet, web reference, web snapshot, internal note, technical record, physical item reference | normativno odvojena osa; vocabulary kasnije |
| format | PDF, DOCX, XLSX, EML, MSG, JPG, PNG, text, unknown | opisna/tehnička osa |
| origin | client, counterparty, court, public authority/register, internal office, third party, system generated, unknown | normativno odvojena provenance klasifikacija nakon pregleda |
| documentary/legal nature | public/private instrument, correspondence, internal note, statement record, technical log | opisna i pravno relevantna ljudska klasifikacija |
| intake channel | manual import, email receipt, scan, photograph, manual note, external reference, system generation | normativni audit podatak o načinu prijema |

UI grupisanje i konačni kontrolisani rječnici ostaju kasnija odluka. Nepoznata vrijednost se mora označiti kao nepoznata, a ne pogoditi.

## 7. Stable Source Identity

`SOURCE_ITEM` je stabilno identifikovani evidencijski materijal. `source_item_id` nije path, filename niti hash. Rename ili move ne stvara automatski novi Source Item. Identičan hash ne spaja automatski zapise jer provenance, prijem, matter uloga, access klasifikacija, pravna priroda kopije i ručne napomene mogu biti različiti.

Novi Source Item je potreban kada se evidentira semantički zaseban materijal ili zaseban provenance događaj koji mora ostati nezavisno auditabilan. Odluka „isti item / nova verzija / novi item“ mora navesti osnov i review authority kada je sporna.

## 8. Source Content Version

`SOURCE_CONTENT_VERSION` predstavlja sadržaj Source Item-a evidentiran u određenom trenutku. Svaka evidentirana verzija mora ostati nepromjenjiva u audit tragu. Nova verzija ne prepisuje raniju verziju, njen recorded hash, scope, evidence links, assessments ili review zapise.

Legitimno izmijenjen dokument obično dobija novu content version istog Source Item-a kada kontinuitet materijala i provenance to opravdavaju. Nova dostava koja ima zasebnu evidencijsku ulogu može biti novi Source Item povezan relacijom `REPLACES` ili `CORRECTS`. Sistem ne donosi tu odluku samo iz hasha ili imena.

## 9. Source Representation

`SOURCE_REPRESENTATION` opisuje DOCX, PDF export, sken, fotografiju, EML, MSG, snapshot, običnu ili ovjerenu kopiju i fizički item reference. Reprezentacija nije automatski novi Source Item niti ista content version. Odnos se mora eksplicitno evidentirati, npr. `DERIVED_FROM` ili `COPY_OF`, sa tipom transformacije/kopije, poznatim ograničenjima i reviewerom.

**Normative:** Više representations može pripadati istoj `SOURCE_CONTENT_VERSION` samo ako je za deklarisanu namjenu potvrđeno da transformacija nije promijenila relevantni sadržaj. Ako je relevantni sadržaj promijenjen ili očuvanje nije potvrđeno, representation mora biti povezana sa zasebnom content version, ili sa zasebnim Source Item-om kada provenance i nezavisna evidencijska uloga to zahtijevaju. `DERIVED_FROM` sam ne određuje da li dvije representations pripadaju istoj content version.

Provjera očuvanja mora prema namjeni razmotriti najmanje tracked changes, komentare, formule, potpise, priloge, paginaciju kada je locator relevantan, metadata kada je dokazno relevantna i izostavljeni ili nečitljivi sadržaj.

Original, ovjerena kopija, obična kopija i fotografija moraju ostati razlikovani. Oznaka kopije ne potvrđuje potpunost, vjernost, autentičnost ili pravnu snagu.

## 10. Location and Location History

`SOURCE_LOCATION_RECORD` vezuje reprezentaciju za lokaciju i vrijeme važenja/evidentiranja. Mora razlikovati current ili last-known location, istorijske lokacije, očekivanu lokaciju i rezultat provjere. Path je lokator, ne identitet.

Rename i move dodaju auditabilni location događaj; ne prepisuju istoriju. Rezultat provjere očekivane lokacije odvojen je od current availability stanja. Nedostupnost na očekivanoj putanji ne briše Source Item niti dokazuje premještanje ili brisanje.

## 11. Provenance, Intake and Attribution

Moraju se razlikovati: ko je dostavio, sastavio, izdao, poslao, primio i evidentirao izvor; kome se pripisuje izjava; ko ili šta je generisalo strukturisani zapis; document date, receipt date, recorded date i intake channel. Jedno lice može imati više uloga, ali one se ne spajaju.

`PROVENANCE_EVENT` treba da navede event type, target item/version/representation, poznate aktere i njihove uloge, vrijeme, kanal, recorder, osnov i ograničenja. File/email metadata može biti evidentirana kao metadata ili prijedlog; nije automatski potvrđena provenance ili autentičnost.

`statement_attribution` pripada konkretnoj izjavi/scope-u. `provided_by`, `authored_by`, `issued_by`, `sent_by`, `received_by`, `recorded_by` i `generator_type` primjenjuju se samo kada imaju semantičkog smisla; nijesu univerzalno obavezna polja.

## 12. Non-file, Email and Web Sources

Fizički predmet, usmena izjava zabilježena internom bilješkom i eksterni web reference mogu biti Source Items bez lokalnog izvornog fajla. Mora biti jasno šta je stvarni izvor, a šta bilješka, fotografija ili snapshot koji ga reprezentuje. Hash tada može biti neprimjenjiv na izvorni događaj/predmet.

Svaka pojedinačna email poruka je Source Item. Svaki attachment je zaseban Source Item i povezuje se sa konkretnom porukom relacijom `ATTACHED_TO`. Thread je prvenstveno agregacija poruka; `MEMBER_OF_THREAD` se ne usvaja kao normativna source relacija jer thread membership može biti opisna agregaciona metadata. `CONTAINS_MESSAGE` se ne usvaja jer export cijelog thread-a zahtijeva dokumentovanje slučaja kao reprezentacije ili izvedenog Source Item-a, a ne univerzalnu semantiku sadržavanja.

Web stranica ili javni registar bez snapshot-a može biti `EXTERNAL_REFERENCE_ONLY`. Zapis mora navesti da istorijski sadržaj nije stabilno sačuvan, da ranije viđeni sadržaj možda nije naknadno provjerljiv i da URL ili današnji prikaz ne dokazuju raniji sadržaj. Snapshot je zasebna sačuvana reprezentacija ili izvedeni item sa vremenom capture-a.

## 13. Source Scope

`SOURCE_SCOPE` je relevantni dio konkretne `SOURCE_CONTENT_VERSION`. Mora sadržati scope type, version vezu, tehnički locator kada postoji, ljudski čitljiv opis dovoljan za pronalazak bez aplikacije, opcioni kratki excerpt ili paraphrase i ograničenja čitljivosti.

Dozvoljeni konceptualni tipovi obuhvataju cijeli dokument, stranicu/range, naslov/odjeljak, pasus, klauzulu, tabelu, red/kolonu, sheet i ćeliju/range, email subject, body segment, attachment, timestamp, vizuelni region i ručno opisani segment. Attachment kao scope identifikuje relevantnu vezu, ali sam attachment ostaje zaseban Source Item.

Cijeli dokument je dovoljan samo kada je cijeli neposredno relevantan, precizniji locator objektivno nije dostupan ili assertion zavisi od dokumenta kao cjeline. Široka ili sporna assertion zahtijeva precizniji scope. Model ne zahtijeva OCR, parser anchor ni kopiranje velikih zaštićenih odlomaka.

## 14. Evidence Links and Assertion-facing Relations

`EVIDENCE_LINK` mora identifikovati source scope, target assertion i njenu verziju, matter kontekst, relation type, obim (full/partial i opis), generator/predlagača, review stanje, reviewera/authority, vrijeme, ograničenja i conflict reference kada postoji.

| Relacija | Značenje | Ne znači |
|---|---|---|
| `SUPPORTS` | scope neposredno ide u prilog cijeloj ili opisanom dijelu assertion | autentičnost, istinitost, pravnu dokazanost, trust tranziciju ili odsustvo konflikta |
| `CONTRADICTS` | scope je neposredno nesaglasan sa cijelom ili dijelom assertion | da je assertion definitivno opovrgnuta, izvor tačan ili konflikt materijalan |
| `ATTRIBUTES_STATEMENT` | scope potvrđuje da je izjava pripisana određenom licu | istinitost sadržaja izjave |
| `PROVIDES_CONTEXT` | scope daje pozadinu, slijed ili pomoć pri razumijevanju | samostalni osnov za `CONFIRMED_FROM_SOURCE` |

`PROVIDES_LEGAL_BASIS` se ne usvaja kao opšta evidence relacija jer bi miješala dokazivanje činjenica, izvore prava, pravnu argumentaciju i pravnu kvalifikaciju. Model pravnih autoriteta pripada kasnijem WP-u ili ADR-u.

### 14.1 Partial support

Djelimični `SUPPORTS` mora tačno opisati podržani dio i nepodržani ostatak. Preširoka assertion treba da se atomizuje u skladu sa VLA-0A; partial flag ne smije prikriti neodređenu vezu. Trust procjena se donosi zasebno za preciznu assertion i scope.

### 14.2 `SUPPORTS` versus `CONFIRMED_FROM_SOURCE`

**Normative:** `SUPPORTS` je relation record `SOURCE_SCOPE → MATTER_ASSERTION`; `CONFIRMED_FROM_SOURCE` je trust status assertion-a. Evidence link može biti predložen, potvrđen, djelimičan, osporen ili konfliktan. Assertion može dobiti `CONFIRMED_FROM_SOURCE` samo zasebnom auditabilnom odlukom ovlašćenog ljudskog reviewera uz VLA-0A preduslove. Ne postoji automatska tranzicija `SUPPORTS → CONFIRMED_FROM_SOURCE`.

## 15. Source-to-source Relations

| Relacija | Normativno značenje |
|---|---|
| `CORRECTS` | kasniji item/version ispravlja identifikovani dio ranijeg; raniji ostaje i nije nužno cijeli zamijenjen |
| `REPLACES` | novi item/version je namijenjen da zauzme mjesto ranijeg za buduću/važeću upotrebu; raniji nije automatski netačan |
| `DUPLICATES` | itemi ili reprezentacije imaju jednak/praktično jednak sadržaj bez verzijskog prvenstva; čovjek potvrđuje |
| `DERIVED_FROM` | item ili reprezentacija nastala je transformacijom drugog; nema automatski evidence učinak |
| `COPY_OF` | item/reprezentacija je određena vrsta kopije drugog; potpunost i vjernost se zasebno procjenjuju |
| `ATTACHED_TO` | attachment Source Item je bio vezan za konkretnu email poruku Source Item |

Svaka relacija mora navesti source i target sa odgovarajućom verzijom/reprezentacijom, osnov, vrijeme, predlagača, reviewera kada je potreban, ograničenja i audit vezu. Singularna prečica poput `duplicate_of_source_id` ne smije zamijeniti relation record niti 1:N/N:1 potrebe.

`DUPLICATES` je simetrična relacija sadržajne ili praktične jednakosti i ne zahtijeva poznat odnos nastanka kopije. `COPY_OF` je usmjerena relacija kojom se evidentira poznat ili procijenjen odnos kopije prema targetu. `COPY_OF` ne znači automatski potpuni duplicate, vjernost, potpunost, autentičnost ili jednaku pravnu snagu. Relacije mogu koegzistirati.

Directional nature je zaključana: `CORRECTS`, `REPLACES`, `DERIVED_FROM`, `COPY_OF` i `ATTACHED_TO` su usmjerene; `DUPLICATES` je simetrična.

**Normative:** Evidence Link i Source Relation su audit-relevantni relation records i ne smiju se tiho prepisivati. Korekcija se evidentira novom preciznijom relacijom uz `SUPERSEDED` prethodne relacije, kao `WITHDRAWN` kada je povučena, kao `VOIDED` kada je bila vezana za pogrešan target, duplikat zapisa ili proceduralno nevalidna, ili conflict zapisom kada joj novi izvor protivrječi. Novi konflikt ne čini prethodnu relaciju automatski `VOIDED`. Fizička šema relation versioning-a ostaje otvorena.

## 16. Conflict Model

- **source conflict** je neslaganje između identifikovanih source scope-ova;
- **assertion conflict** je nesaglasnost assertions koje se ne mogu istovremeno koristiti u istom preciznom kontekstu bez disposition-a;
- **material conflict** je neriješeno neslaganje koje može uticati na verifikovano stanje predmeta, pravnu kvalifikaciju, rok, odgovornost, pravnu radnju, očekivani output ili komunikaciju sa klijentom;
- **unresolved** znači da ovlašćeni disposition nije donesen;
- **resolved** znači da postoji eksplicitan, obrazložen i auditabilan disposition za evidentirani scope; ne znači da je suprotni izvor obrisan ili proglašen lažnim niti da je konflikt globalno riješen.

`CONFLICT_RECORD` i disposition moraju sadržati matter, uključene source scopes i assertions, namjenu, relevantni vremenski ili drugi kontekst, predmet i obim neslaganja, materiality procjenu, resolution status, disposition, rationale, reviewer, authority, vrijeme i posljedicu po assertion i Verified Fact eligibility. `RESOLVED` znači riješen samo u evidentiranom scope-u. Neriješen materijalni konflikt blokira Verified Fact eligibility samo za pogođenu assertion, scope i upotrebu; ne blokira automatski cijeli Source Item, sve njegove assertions ili cijeli matter. Sistem ne smije izabrati pobjednički izvor. Rješenje zahtijeva Review Record ili ekvivalentan disposition audit i ne briše izvore, links ni istoriju.

## 17. Correction, Replacement, Withdrawal and Lifecycle

Correction (`CORRECTS`) i replacement (`REPLACES`) su relacije, ne availability ili integrity statusi. Withdrawal je source-specific lifecycle događaj kojim izdavalac/ovlašćeni owner povlači item/version iz dalje namijenjene upotrebe; ne briše ga i ne dokazuje netačnost. Administrativno pogrešan zapis može biti `VOIDED` prema VLA-0A uz povišeni authority i očuvan trag.

VLA-0A lifecycle `ACTIVE`, `SUPERSEDED`, `WITHDRAWN`, `VOIDED` ostaje primjenjiv na verzionisane VLA objekte. Za Source Item prikaz „corrected“ ili „replaced“ treba izvesti iz relacija, a „unavailable“ iz availability ose; ne uvode se konkurentni lifecycle statusi. Povučena, zamijenjena ili voided verzija ostaje auditabilna.

`REPLACES` record mora, kada je relevantno, identifikovati matter context, scope, namjenu, effective time i source/target version ili representation. `REPLACES` ne proizvodi automatski globalni lifecycle status `SUPERSEDED`. Stari objekat može ostati aktivno relevantan za istoriju, drugi matter, drugu assertion, drugi period ili drugu pravnu/radnu namjenu. Globalni `SUPERSEDED` koristi se samo kada je objekat prestao biti aktuelan za cijeli deklarisani lifecycle scope i kada je identifikovana zamjena.

## 18. Availability, Location Verification, Accessibility and Integrity

Availability, rezultat provjere lokacije, accessibility/readability, hash baseline, integrity verification i lifecycle su odvojene ose/zapisi.

| Availability state | Značenje |
|---|---|
| `UNKNOWN` | current availability nije pouzdano poznata |
| `AVAILABLE` | relevantna representation je trenutno dostupna barem na jednoj potvrđenoj lokaciji ili putem evidentiranog pristupa |
| `UNAVAILABLE` | poznato je da trenutni pristup nije moguć, uz osnov kada je poznat |
| `EXTERNAL_REFERENCE_ONLY` | evidentirana je eksterna referenca bez lokalno sačuvane representation |

| Location verification result | Značenje |
|---|---|
| `FOUND_AT_RECORDED_LOCATION` | target je pronađen na provjerenoj evidentiranoj lokaciji |
| `NOT_FOUND_AT_EXPECTED_LOCATION` | target nije pronađen na konkretnoj očekivanoj lokaciji; razlog nije utvrđen |
| `FOUND_AT_NEW_LOCATION` | target je pronađen na novoj lokaciji koja se dodaje u location history |
| `LOCATION_CHECK_INCONCLUSIVE` | provjera konkretne lokacije nije dala pouzdan rezultat |

Rename i move su location događaji. `RELOCATED` nije normativni availability status; može biti samo izvedena UI oznaka iz location history-ja. Izvor može istovremeno imati `NOT_FOUND_AT_EXPECTED_LOCATION` za staru lokaciju, `FOUND_AT_NEW_LOCATION` za novu i current availability `AVAILABLE`.

| Accessibility/readability assessment | Značenje |
|---|---|
| `NOT_ASSESSED` | čitljivost/dostupnost sadržaja nije procijenjena |
| `FULLY_ACCESSIBLE` | deklarisani sadržaj i scope su dostupni i čitljivi za navedenu namjenu |
| `PARTIALLY_ACCESSIBLE` | samo identifikovani dio sadržaja je dostupan/čitljiv |
| `DAMAGED_OR_UNREADABLE` | representation je oštećena ili nečitljiva u evidentiranom obimu |

| Hash baseline/applicability | Značenje |
|---|---|
| `RECORDED_HASH_AVAILABLE` | postoji identifikovani recorded hash primjenjiv kao baseline za target |
| `NO_RECORDED_HASH` | nema istorijske referentne hash vrijednosti za target |
| `HASH_CHECK_NOT_APPLICABLE` | hash provjera nije smislena za predmet procjene |

| Integrity verification result | Značenje |
|---|---|
| `NOT_CHECKED` | provjera prema baseline-u nije izvršena |
| `MATCHES_RECORDED_HASH` | verification hash se podudara sa identifikovanim recorded hashom |
| `DOES_NOT_MATCH_RECORDED_HASH` | vrijednosti se ne podudaraju; razlog nije utvrđen |
| `CHECK_INCONCLUSIVE` | pokušaj provjere nije dao pouzdan rezultat |

`NO_RECORDED_HASH` i `HASH_CHECK_NOT_APPLICABLE` nijesu verification rezultati. Svaki verification zapis mora identifikovati konkretni recorded hash korišćen kao baseline kada je baseline primjenjiv. Novi check ili assessment ne prepisuje prethodni, nego dodaje audit zapis; current status je samo izvedena projekcija posljednjeg relevantnog zapisa za target i scope.

### 18.1 Recorded and verification hash

Recorded hash je autoritativni istorijski audit podatak evidentiran u određeno vrijeme za konkretan digitalni sadržaj, file representation ili content version. Verification hash/result je kasniji rezultat provjere i ne prepisuje recorded hash.

Hash nije Source Item identitet i ne dokazuje autentičnost, istinitost, pravnu snagu, autora ni izdavaoca. Mismatch može poticati od legitimne nove verzije, ponovnog snimanja, metadata promjene, exporta, neovlašćene izmjene, oštećenja ili pogrešno povezanog fajla; sistem evidentira rezultat, ne razlog. Folder nije content version i ne dobija jedan dokazni hash. Algoritam ostaje tehnička odluka.

## 19. Source Assessments, Review and Authority

Ne postoji `VERIFIED_SOURCE` niti boolean `authentic`. Odvojeni assessment-i su identity, provenance, integrity, relevance, authenticity, source-to-assertion relation, confidentiality/access i legal significance. Svaki `SOURCE_ASSESSMENT` mora konceptualno razdvojiti `assessed_by`, `assessment_method`, `assessment_result`, `reviewed_or_accepted_by`, `authority_scope`, `purpose` i `limitations`, uz target/verziju, vrijeme i prethodni zapis kada je ponovno otvoren. Ovo nije konačna field schema.

Procjenu ili nalaz može proizvesti deterministički sistem, član kancelarije, IT stručnjak, vještak, notar, izdavalac ili drugi identifikovani eksterni autoritet. Advokat procjenjuje pravni značaj i odobrava pravnu upotrebu kada je potrebno, ali se ne smije prikazati kao da je lično izvršio tehničku procjenu drugog aktera.

Tri nivoa moraju ostati odvojena:

1. **Observed technical relation/result** — sistem može autoritativno evidentirati deterministički opaženu tehničku činjenicu uz metod, target, vrijeme i audit;
2. **Semantic assessment** — čovjek procjenjuje značenje, identitet, odnos kopije, duplikat, provenance ili relevantnost;
3. **Legal significance** — ovlašćeni advokat procjenjuje pravni značaj, materiality, dokaznu upotrebu i uticaj na assertion ili matter.

Primjer: sistem može evidentirati da je fajl bio MIME attachment konkretne email poruke; čovjek procjenjuje da li je isti dokument kao folder fajl; advokat procjenjuje pravni značaj. Sistem i AI ne mogu finalno utvrditi autentičnost, istinitost, pravnu dokaznu snagu, material conflict disposition, trust status assertion-a ili Verified Fact eligibility.

Autentičnost je samo eksplicitna, ograničena i auditabilna ljudska procjena. Hash, filename, path i metadata nijesu dokaz autentičnosti. Sistem/AI može predložiti procjenu, ali nije finalni authority. Pravna relevantnost, značaj, privilege i client-facing upotreba zahtijevaju ovlašćenog advokata; administrativnu klasifikaciju može potvrditi ovlašćeni član kancelarije prema budućoj authority matrici.

Review odluka važi za konkretan target/version i namjenu. Novi sadržaj, materijalni konflikt ili promjena namjene zahtijeva novi assessment/Review Record; prethodni se ne prepisuje.

## 20. Confidentiality, Access and Multi-matter Sources

Confidentiality classification i access restrictions moraju biti odvojeni od source identity-ja, provenance i legal significance. Zapis treba da pokaže klasifikaciju, matter kontekst, osnov, classifier/reviewer, authority, vrijeme, ograničenja dijeljenja i reference na posebna pravila bez izlaganja zaštićenog sadržaja.

Jedan Source Item može biti eksplicitno povezan sa više matters. Svaki `EVIDENCE_LINK` mora ostati vezan za konkretni scope, assertion i matter kontekst. Povjerljivost i pristup procjenjuju se zasebno po matter kontekstu; zajednički item ne daje automatski pristup svim učesnicima. Fizički storage i enforcement nijesu dio ovog WP-a.

## 21. Conceptual Field Classification

| Grupa | Kandidati i klasifikacija |
|---|---|
| univerzalno obavezno i autoritativno | `id`, `object_type`, `display_name`, najmanje jedna `matter_associations` veza ili eksplicitno pending association, `created_at`, `created_by`, `recorded_at`, `recorded_by`, `generator_type`, `lifecycle_status`; Markdown-visible |
| uslovno obavezno | `carrier_type`, `format_type`, `origin_type`, `documentary_nature`, `intake_channel`, relevantni provenance akteri/datumi; obavezno kada je primjenjivo/poznato, unknown se ne izmišlja |
| location | `current_path/current_filename` izvedena current projekcija; `original_filename` provenance podatak ako je poznat; `previous_paths` audit izveden iz location records; Markdown-visible |
| version/representation | `content_version` autoritativna komponenta; `source_version` ne usvaja se kao paralelni nejasni pojam; representation identitet/type uslovno obavezan |
| hash/integrity | `content_hash`, `hash_recorded_at`, `hash_algorithm` čine recorded-hash audit zapis i baseline reference kada postoji; `verification_hash/result/checked_at` zaseban audit rezultat koji identifikuje baseline; baseline/applicability i verification projekcije su odvojene |
| relations | `derived_from_source_id`, `duplicate_of_source_id`, `copy_of_source_id`, `replaces_source_id`, `replaced_by_source_id`, `corrects_source_id`, `attached_to_source_id` nijesu usvojena singularna polja; predstavljaju kasniju serialization relacijskih zapisa |
| status/procjena | availability, location verification, accessibility/readability, integrity verification i `review_status` jesu odvojene izvedene projekcije relevantnih zapisa; `confidentiality_classification`, `access_restrictions`, `assessment_records`, `review_records` autoritativni/audit podaci |
| opcionalno | `document_date`, `received_at`, actor roles, `statement_attribution`, `notes`; postaju autoritativni samo kao evidentirani podaci/procjene sa porijeklom |
| implementaciono/kasniji WP | konkretni `matter_id` naspram associations strukture, ID format, cardinality, serialization, enforcement, indeks i schema |

Autoritativni podaci ne smiju postojati samo u budućem indeksu. Izvedena current polja ne smiju zamijeniti istorijske zapise.

## 22. Markdown-visible Requirements

Human-readable file-first prikaz mora konceptualno pokazati Source Item ID i naziv; carrier/format/representation; matter associations; current/last-known i auditno relevantne prethodne lokacije; provenance summary i relevantne datume; content version; recorded hash i vrijeme kada postoje; hash baseline/applicability; posljednje location, readability i integrity verification rezultate; availability i lifecycle; source relations, evidence links i konflikte; confidentiality/access ograničenja; review/assessment reference. Prikaz mora biti razumljiv bez aplikacije, ali ovaj WP ne projektuje konačni template.

## 23. Required Edge Cases

Skraćenice: **SI** = Source Item; **CV** = content version; **Rep** = representation; **EL** = evidence link; **H** = ovlašćeni čovjek; **L** = ovlašćeni advokat.

| # | Identitet / version / representation | Scope i evidence | Integrity / provenance | Authority, audit i zabranjen zaključak |
|---:|---|---|---|---|
| 1 | Dva SI dok H ne potvrdi `DUPLICATES`; isti hash nije merge | zasebni scopes/EL po matter ulozi | oba prijema i hasha ostaju | H potvrđuje relaciju; sistem ne spaja niti izjednačava provenance |
| 2 | isti SI i CV ako je samo rename; novi location event | postojeći scope/EL ostaju version-bound | `FOUND_AT_RECORDED_LOCATION` ili drugi rezultat zapisuje se zasebno | audit starog/novog naziva; availability se ne izvodi iz samog rename-a |
| 3 | isti SI; old/new location history | scope/EL ne mijenjaju target | `NOT_FOUND_AT_EXPECTED_LOCATION` + `FOUND_AT_NEW_LOCATION`; current `AVAILABLE` je moguće | recorder bilježi checks; move nije availability status niti missing dokaz move-a |
| 4 | nova CV ili mismatch za istragu; stara CV ostaje | postojeći EL ostaje uz staru CV; novi zahtijeva pregled | baseline mora biti identifikovan; `DOES_NOT_MATCH_RECORDED_HASH` ne daje razlog | sistem bilježi rezultat, H klasifikuje događaj, L pravni učinak |
| 5 | novi CV istog SI ili novi SI, context-aware `REPLACES`/`CORRECTS` | scope/EL se ponovo uspostavljaju za relevantnu namjenu | novi recorded hash i receipt event | H/L potvrđuje odnos; `REPLACES` nije globalni `SUPERSEDED` niti „noviji“ automatski važeći |
| 6 | PDF Rep `DERIVED_FROM` DOCX Rep/SI; ista CV samo nakon potvrde relevantnog očuvanja | zasebni scope locatori; nema prenosa EL po automatizmu | hash/baseline za svaku digitalnu Rep | H provjerava tracked changes, komentare, formule, potpise, priloge, paginaciju i relevantnu metadata; derivation ne određuje CV |
| 7 | fotografija kao Rep ili SI `COPY_OF` fizičkog item reference-a | vizuelni region; samo ono vidljivo | hash fotografije, ne originala; provenance fotografisanja | H/L procjena; sistem ne tvrdi da je original dostavljen/autentičan |
| 8 | email SI + tri attachment SI, svaki `ATTACHED_TO` | scopes i EL zasebno | sistem može auditabilno evidentirati MIME attachment observation | čovjek procjenjuje semantiku, L pravni značaj; email nije jedan četvorodijelni SI |
| 9 | attachment SI i folder fajl ostaju zasebni; symmetric `DUPLICATES` i directional `COPY_OF` mogu koegzistirati | zasebni EL dok je potrebno | oba intake događaja ostaju | H procjenjuje relacije; isti hash ne dokazuje copy lineage niti briše evidenciju |
| 10 | svaka poruka SI; thread je agregacija; export posebno dokumentovan | body/subject scope po poruci | sender/receiver/time po poruci | H; thread ne dokazuje autentičnost, potpunost ni attachments |
| 11 | email druge strane je SI | `ATTRIBUTES_STATEMENT`; eventualno `SUPPORTS` za postojanje izjave | sent/received metadata je ograničena provenance | L za factual use; sistem ne pretvara sporni sadržaj u činjenicu |
| 12 | ispravka je novi SI/CV `CORRECTS` ili context-aware `REPLACES`; stari ostaje | scope precizira ispravljeni dio/upotrebu; conflict disposition je scope-specific | oba baseline-a/provenance događaja | L; nema globalnog supersession-a bez cijelog lifecycle scope-a |
| 13 | dva SI/CV | `SUPPORTS`/`CONTRADICTS` uz matter/scope/purpose/time conflict record | integrity svake strane zasebno | L daje scope-specific disposition; blokirana je samo pogođena eligibility |
| 14 | isti SI/CV, precizan scope | partial `SUPPORTS`, podržani obim opisan; atomizacija | nema posebnog integrity efekta | H/L review; dio ne potvrđuje cijelu assertion |
| 15 | jedan SI sa dvije matter associations | zaseban scope/EL po matter kontekstu | zajednička provenance, context-specific access | L/access authority; nema automatskog cross-matter pristupa |
| 16 | snapshot Rep ostaje istorijski; live web reference odvojen | scope veže snapshot CV/vrijeme | snapshot može imati `RECORDED_HASH_AVAILABLE`; live reference `HASH_CHECK_NOT_APPLICABLE` | availability/reference i snapshot readability odvojeni; današnji URL ne dokazuje raniji sadržaj |
| 17 | SI ostaje; expected location record ne briše se | scopes/EL ostaju istorijski čitljivi | `NOT_FOUND_AT_EXPECTED_LOCATION`; availability može biti `UNKNOWN`, `UNAVAILABLE` ili `AVAILABLE` drugdje | audit konkretnog check-a; sistem ne zaključuje delete/move |
| 18 | SI ostaje, pogrešna association se void/correct auditabilno | EL u pogrešnom matteru se povlači/void uz trag | provenance SI se ne mijenja | povišeni H/L prema učinku; nema tihog relinkovanja |
| 19 | dva SI mogu biti `DUPLICATES`, bez merge-a | ručne napomene i EL ostaju uz svoje zapise | oba intake/provenance traga ostaju | H; sadržajna jednakost ne znači evidencijsku jednakost |
| 20 | interna bilješka SI reprezentuje zapis usmene izjave | `ATTRIBUTES_STATEMENT` ka klijentu; ne factual truth | provenance bilješke, autora, vremena i ograničenja sjećanja | L za factual use; bilješka nije snimak niti dokaz istine |
| 21 | external-reference SI bez snapshot-a | ručno opisani scope uz ograničenje | `EXTERNAL_REFERENCE_ONLY`; hash N/A | H/L; trenutni registar ne dokazuje raniji prikaz |
| 22 | mismatch ostaje rezultat prema identifikovanom baseline-u; moguća nova CV tek nakon pregleda | EL stare CV ostaju; novi scope po odluci | korisnikova tvrdnja o ponovnom snimanju je attribution/provenance input | tehnički recorder ≠ semantic/legal reviewer; mismatch ne utvrđuje razlog |
| 23 | isti SI/CV; posebna klasifikacija/access record | scope minimizuje izlaganje | integrity odvojen od confidentiality | L/ovlašćeni access reviewer; klasifikacija ne smije procuriti sadržaj |
| 24 | SI je relevantan bez authenticity assessmenta | EL može postojati/reviewati uz ograničenje | integrity/provenance ne popunjavaju authenticity | L procjenjuje pravni značaj; relevantno ne znači autentično |
| 25 | isti ili različiti scopes | `ATTRIBUTES_STATEMENT` podržava statement; `CONTRADICTS` factual claim | bez automatskog integrity efekta | L; potvrđena atribucija nije potvrđen sadržaj |
| 26 | SI/CV dobija `WITHDRAWN`; istorija ostaje | raniji EL ostaju istorijski, review se reopen samo za pogođenu upotrebu | withdrawal provenance event | L/owner authority; relation/lifecycle trag se ne prepisuje |
| 27 | SI/CV ne mora da se mijenja | nova precizna EL supersede staru široku; `VOIDED` samo za proceduralnu grešku | nema integrity promjene | H/L; novi konflikt sam ne voiduje raniju relaciju |
| 28 | Rep ostaje; može postojati druga bolja Rep | samo čitljivi scopes, uz limitation | accessibility `PARTIALLY_ACCESSIBLE`/`DAMAGED_OR_UNREADABLE`; location/availability i hash check ostaju odvojeni | assessor i legal reviewer se razdvajaju; nečitljiv dio se ne rekonstruiše |
| 29 | original reference i dvije directional `COPY_OF` relacije; symmetric `DUPLICATES` samo ako zasebno potvrđen | scopes se vezuju za konkretnu CV/Rep | hash baseline svake digitalne Rep; provenance/certification zasebno | copy lineage nije automatski duplicate, vjernost, potpunost ili ista pravna snaga |
| 30 | prijedlog ne mijenja broj/identitet SI | EL ostaju nezavisni | hash je signal; oba provenance traga ostaju | H mora potvrditi `DUPLICATES`; sistemski prijedlog nije finalna relacija |

## 24. Forbidden Shortcuts

Zabranjeno je: izjednačiti SI sa činjenicom; koristiti path/filename/hash kao trajni identitet; tretirati availability kao location događaj ili readability kao location rezultat; tretirati hash baseline/applicability kao verification rezultat; tretirati hash kao dokaz autentičnosti/istine; prepisati raniji check ili assessment; automatski prevesti `SUPPORTS` u `CONFIRMED_FROM_SOURCE`; iz atribucije zaključiti istinu; dozvoliti sistemu/AI da riješi konflikt ili bude finalni pravni reviewer; iz `DERIVED_FROM` zaključiti istu CV; tretirati `DUPLICATES` i `COPY_OF` kao sinonime; iz `REPLACES` proizvesti globalni `SUPERSEDED`; tretirati disposition kao globalan; prepisati istorijsku CV, hash, EL, source relation, assessment ili Review Record; fizički brisati auditno relevantan izvor; spojiti original, kopiju, izvedeni format i novu verziju; spojiti provenance, attribution i generator; naslijediti review/trust na novu verziju bez odluke; sakriti partial support ili material conflict.

## 25. Open Decisions and Later Work Packages

Open decisions: hash algoritam; ID format; Markdown serialization; fizički Source Registry; multi-matter storage; watcher i rename/move detekcija; inode/platform identifikatori; deduplication i near-duplicate pragovi; provider message IDs; OCR/parser locators; access enforcement i encryption; snapshot mehanizam; schema/index format; detaljna office authority matrica.

VLA-0C (Matter State), VLA-0D (Change Set), budući Review Workspace, Deadline model i model pravnih autoriteta nijesu započeti. VLA-0H ili tehnički WP treba da odluči implementacione detalje bez mijenjanja ovdje zaključane semantike.

## 26. Conceptual Acceptance Criteria

Dokument prolazi pregled samo ako: SI, CV, Rep, location, provenance, scope, EL, source relation, assessment i conflict ostaju razdvojeni; availability nije location event, a readability nije availability/location rezultat; hash baseline nije verification rezultat i novi check ne prepisuje stari; `DERIVED_FROM` ne određuje istu CV; `DUPLICATES` i `COPY_OF` nijesu sinonimi; `REPLACES` nije automatski globalni `SUPERSEDED`; conflict disposition je scope-specific; tehničko opažanje nije semantička ili pravna procjena; relation records čuvaju istoriju; svih 30 slučajeva imaju auditabilan ishod; `SUPPORTS` ne mijenja trust automatski; attributed statement ne potvrđuje sadržaj; recorded hash se ne prepisuje i ne dokazuje autentičnost; neriješen material conflict blokira samo pogođenu Verified Fact eligibility; system/AI nijesu finalni legal authority; source istorija ostaje čitljiva bez aplikacije; nijedan autoritativni podatak nije samo u budućem indeksu.
