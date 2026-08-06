# DOSSARA — WP VLA-0B Source Relation and Integrity Matrix

## 1. Document Control and Reading Rule

| Polje | Vrijednost |
|---|---|
| Dokument | WP VLA-0B — Source Relation and Integrity Matrix |
| Status | Documentation-only draft za pregled naručioca |
| Datum | 6. avgust 2026. |
| Normativni baseline | WP VLA-0A i prateći VLA-0B traceability dokument |

Matrice su normativni pregled, ne implementaciona šema. „Review“ znači eksplicitnu ljudsku odluku za target, verziju i namjenu. Sistem/AI može samo predložiti.

## 2. Object and Component Applicability

| Koncept | SI | CV | Rep | Scope | Assertion | Kategorija / napomena |
|---|---:|---:|---:|---:|---:|---|
| stabilni identitet | DA | DA | DA | DA | DA | SI je primarni VLA objekat; ostalo prema konceptualnom modelu |
| matter association | DA | preko SI | preko SI | kontekst EL | DA | multi-matter bez storage odluke |
| location | posredno | posredno | DA | locator nije location record | NE | audit record, ne identitet |
| provenance event | DA | DA | DA | po potrebi | porijeklo assertion odvojeno | audit record |
| recorded hash | NE kao identitet | MAY | MAY | NE | NE | konkretni digitalni sadržaj |
| evidence link | NE direktno | preko scope-a | preko CV | source kraj | target | relation record |
| source relation | DA | DA | DA | MAY za preciziranje | NE | odvojeno od EL |
| assessment | DA | DA | DA | DA | zasebni assertion review | assessment record |
| conflict | uključuje | uključuje | po potrebi | DA | DA | audit/relation record |

## 3. Source Classification Axes

| Osa | Odgovara na pitanje | Primjeri | Normativni status | Zabranjena prečica |
|---|---|---|---|---|
| carrier | kakvo je osnovno oličenje | file, email, image, web reference, physical reference | odvojena osa | jedan `source_type` za sve |
| format | koji tehnički format | PDF, DOCX, EML, JPG, unknown | opisno | format = pravna priroda |
| origin | odakle sadržaj potiče | client, court, office, unknown | reviewable provenance | metadata = potvrđeno porijeklo |
| documentary nature | kakva je dokumentarna/pravna priroda | public/private instrument, correspondence | ljudska klasifikacija | public = tačno/autentično |
| intake channel | kako je evidentirano | import, receipt, scan, note, reference | audit podatak | kanal = autor |

## 4. Same Item, New Version or New Item

| Događaj | Podrazumijevani kandidat | Preduslov/review | Audit | Ne smije značiti |
|---|---|---|---|---|
| rename/move bez promjene sadržaja | isti SI/CV, novi location record | identitet veze dovoljno potvrđen | stara/nova lokacija, akter, vrijeme | novi SI |
| izmjena sadržaja u kontinuitetu | nova CV istog SI | H potvrđuje kontinuitet | stara/novа CV i hash rezultati | overwrite stare CV |
| nova dostava sa zasebnom evidencijskom ulogom | novi SI, mogući `REPLACES`/`CORRECTS` | provenance i namjena | oba prijema i relation review | samo nova CV po automatizmu |
| identičan hash | prijedlog `DUPLICATES` | H potvrđuje | oba SI i provenance ostaju | merge |
| izvedeni format | Rep/SI `DERIVED_FROM` | transformacija identifikovana | source/target, metod, vrijeme | isti fajl ili isti evidence učinak |

## 5. Rename, Move, Missing and Location

| Stanje | Location posljedica | Availability | Trust/EL učinak | Audit / zabrana |
|---|---|---|---|---|
| renamed | history + current name | `AVAILABLE` ako provjeren | nema automatskog | ne mijenja SI |
| moved | history + current path | `FOUND_AT_NEW_LOCATION`; current availability može biti `AVAILABLE` | nema automatskog | `RELOCATED` je samo izvedena UI oznaka, ne availability |
| not found | expected path ostaje | `NOT_FOUND_AT_EXPECTED_LOCATION`; availability se procjenjuje odvojeno | istorijski EL ostaje | nije dokaz delete/move/unavailability |
| external only | URL/reference | `EXTERNAL_REFERENCE_ONLY` | EL nosi limitation | URL nije snapshot |
| damaged | location može biti pronađena | accessibility `DAMAGED_OR_UNREADABLE`/`PARTIALLY_ACCESSIBLE` | samo čitljivi scope | readability nije location ili availability rezultat |

## 6. Original, Copies and Derived Formats

| Slučaj | Relacija | Preduslov | Review/audit | Zabranjeno tumačenje |
|---|---|---|---|---|
| obična kopija | `COPY_OF` + copy kind | identifikovan target/osnov | H; ograničenja potpunosti | vjerna/autentična po defaultu |
| sken/fotografija | `COPY_OF` ili Rep veza | poznat predmet snimanja | H; capture provenance | original je dostavljen |
| ovjerena kopija | `COPY_OF` + certification podatak | evidentiran certifier/osnov | L za pravni značaj | ista dokazna snaga svuda |
| PDF export iz DOCX | directional `DERIVED_FROM` | poznata transformacija; ista CV samo uz potvrđeno očuvanje relevantnog sadržaja | H; oba hasha, purpose i promjene | derivation sam ne znači istu CV/layout |
| nova sadržajna verzija | version/supersession, ne copy | potvrđena sadržajna promjena | H/L prema učinku | samo druga reprezentacija |

## 7. Email, Thread and Attachment

| Element | Identitet | Relacija/agregacija | Scope | Zabrana |
|---|---|---|---|---|
| pojedinačna poruka | SI | thread membership opisna agregacija | subject/body segment | thread kao jedan dokaz autentičnosti |
| attachment | zaseban SI | directional `ATTACHED_TO` konkretnoj poruci; sistem može evidentirati MIME observation | njegov vlastiti CV/scope | tehničko opažanje nije semantic/legal zaključak |
| isti attachment u folderu | zaseban SI dok H ne odluči | `DUPLICATES` ili `COPY_OF` | zasebni EL po potrebi | hash merge |
| saved thread export | Rep ili izvedeni SI prema slučaju | `DERIVED_FROM` samo kad je transformacija dokazana | export CV | dokaz potpunosti svih poruka |

`CONTAINS_MESSAGE` i `MEMBER_OF_THREAD` nijesu usvojene normativne source relacije; potrebu za strukturisanom agregacijom rješava kasniji WP/ADR.

## 8. Source Scope Applicability

| Carrier | Primjenjivi scopes | Minimalni locator | Kada whole-item nije dovoljan |
|---|---|---|---|
| PDF/image document | page/range, heading, paragraph, clause, table, visual region | page + opis/region | široka ili sporna assertion |
| spreadsheet | sheet, cell/range, row/column, table | sheet + range/opis | assertion zavisi od određenih ćelija |
| email | subject, body segment, timestamp; attachment je zaseban SI | field + ljudski opis | sporna atribucija/sadržaj |
| audio/visual/physical reference | timestamp, region, manually described segment | vrijeme/region/opis | samo dio je relevantan |
| web/snapshot | section, page state, manual segment | URL/snapshot time + opis | promjenjiv ili sporan sadržaj |

## 9. Assertion-facing Evidence Relations

| Relacija | Source → target | Preduslovi | Akteri/review | Trust učinak | Audit | Zabranjeno / primjer |
|---|---|---|---|---|---|---|
| `SUPPORTS` | scope → assertion | precizan scope/assertion i obim | sistem predlaže; H/L potvrđuje | nema automatskog; zasebna odluka | version, matter, full/partial, reviewer | ne znači istinu; ugovorna klauzula podržava tvrdnju o tekstu |
| `CONTRADICTS` | scope → assertion | neposredna nesaglasnost | H/L; L za materiality | ne mijenja automatski trust | tačan predmet/obim, conflict ref | ne znači refuted; drugi dokument navodi drugi datum |
| `ATTRIBUTES_STATEMENT` | scope → attributed assertion/position | lice i izjava identifikovani | H; L za pravni značaj | može podržati attribution trust review, ne sadržaj | attribution, scope, limitation | „X je rekao Y“ nije „Y je tačno“ |
| `PROVIDES_CONTEXT` | scope → assertion | kontekst opisan | H/L po namjeni | ne može sam opravdati confirmed | namjena i ograničenje | chronology email daje pozadinu |

`PROVIDES_LEGAL_BASIS` je zabranjena opšta vrijednost u VLA-0B; pravni autoriteti zahtijevaju zaseban model.

## 10. Source-to-source Relations

| Relacija | Nature / source → target | Preduslovi | Akteri/review | Trust učinak | Audit | Zabranjeno / primjer |
|---|---|---|---|---|---|---|
| `CORRECTS` | directional; kasniji SI/CV → raniji SI/CV | precizan ispravljeni dio | H; L ako pravno relevantno | nema automatskog | scope, rationale, dates | ne zamjenjuje cijeli izvor; ispravka datuma |
| `REPLACES` | directional; novi SI/CV/Rep → raniji SI/CV/Rep | matter, scope, purpose, effective time kada relevantno | owner/H/L | nema automatskog | context + source/target versions | nije globalni `SUPERSEDED`; raniji može ostati relevantan |
| `DUPLICATES` | symmetric; SI/Rep ↔ SI/Rep | sadržajna/praktična jednakost + ljudska odluka; lineage nije potreban | H obavezan | nema | signal, metod, reviewer | nije `COPY_OF`; hash nije merge |
| `DERIVED_FROM` | directional; SI/Rep → SI/Rep | dokumentovana transformacija | H | nema | transformacija, purpose, tool/actor | ne prenosi EL niti određuje istu CV |
| `COPY_OF` | directional; SI/Rep → target SI/Rep | poznat/procijenjen copy odnos i kind | H; L za značaj | nema | kind, provenance, limitations | nije nužno duplicate, vjeran, potpun ili iste pravne snage |
| `ATTACHED_TO` | directional; attachment SI → email SI | konkretna poruka/prijem | sistem bilježi observed result; H/L procjenjuje značenje | nema | method, message/attachment/version/time | nije `DERIVED_FROM`; observation nije pravna procjena |

`DUPLICATES` i `COPY_OF` mogu koegzistirati kada su oba značenja zasebno podržana i pregledana.

## 11. Relation-to-trust and Review Authority

| Stanje relacije | Trust posljedica | Minimalni authority | Obavezna radnja |
|---|---|---|---|
| sistemski prijedlog `SUPPORTS` | nijedna | H/L za potvrdu | review linka |
| potvrđeni `SUPPORTS` | još nema automatske tranzicije | ovlašćeni reviewer assertion-a | zasebna trust odluka |
| partial `SUPPORTS` | samo opisani dio kandidat | L kada je sporno/kritično | atomizacija ili precizno ograničenje |
| `CONTRADICTS` | trust ne flipuje automatski | L za material conflict | conflict record/reopen review |
| `ATTRIBUTES_STATEMENT` | može potvrditi attribution assertion | H/L prema namjeni | odvojiti factual claim |
| bilo koja source relation | nema direktnog trust učinka | H, L za pravni značaj | ne nasljeđivati EL |

## 12. Provenance Actors

| Uloga | Značenje | Može biti unknown | Ne izjednačavati sa |
|---|---|---:|---|
| provided by | lice koje je dostavilo | DA | autor/izdavalac |
| authored by | sastavljač/autorska uloga | DA | sender |
| issued by | formalni izdavalac | DA | recorder |
| sent/received by | komunikacioni akteri | DA | statement attribution |
| statement attribution | kome se izjava pripisuje | DA | truth/author dokumenta |
| recorded by | ko je evidentirao u DOSSARI | NE za autoritativni zapis | content origin |
| generator type | ručno/sistem/AI porijeklo zapisa | NE | authority |

## 13. Assessment Axes

| Assessment | Target | Final authority | Minimalni osnov | Ne znači |
|---|---|---|---|---|
| identity | SI/Rep | H | evidencijski kontinuitet | autentičnost |
| provenance | SI/CV/event | H; L za pravni značaj | dokumentovan origin/event | istina sadržaja |
| integrity | CV/Rep | sistem/IT može evidentirati tehnički rezultat; H/L odobrava relevantnu upotrebu | identifikovani recorded-hash baseline | razlog mismatcha |
| relevance | scope/matter | L kada pravno relevantno | precizna namjena | support/truth |
| authenticity | SI/CV/Rep | ovlašćeni čovjek, tipično L za pravni značaj | metod, osnov, ograničenja | boolean ili hash zaključak |
| relation review | EL/relation | H/L prema učinku | target/version/scope | trust automatizam |
| confidentiality/access | SI + matter context | ovlašćeni classifier/L | osnov i restrictions | fizički enforcement |
| legal significance | SI/scope/use | L | pravna namjena i ograničenja | objektivna istina |

Svaki assessment mora razdvojiti `assessed_by`, `assessment_method`, `assessment_result`, `reviewed_or_accepted_by`, `authority_scope`, `purpose` i `limitations`. Assessor može biti sistem, član kancelarije, IT stručnjak, vještak, notar, izdavalac ili drugi identifikovani eksterni autoritet; legal approver ne smije biti prikazan kao tehnički assessor ako to nije bio.

| Nivo | Dozvoljeni zapis/procjena | Tipični akter | Ne može finalno utvrditi |
|---|---|---|---|
| observed technical relation/result | deterministički hash/location/MIME attachment rezultat uz metod i audit | sistem, IT recorder | autentičnost, istinu, pravnu snagu |
| semantic assessment | identitet, provenance, copy/duplicate značenje, relevantnost | ovlašćeni čovjek/stručnjak | legal significance bez odgovarajućeg authority-ja |
| legal significance | materiality, dokazna upotreba, uticaj na assertion/matter | ovlašćeni advokat | da je lično izvršio tuđi tehnički assessment |

## 14. Availability, Location, Readability and Integrity States

| Osa | Status/result | Trigger | Audit | Zabranjeno tumačenje |
|---|---|---|---|---|
| availability | `UNKNOWN` | current pristup nije poznat | target/scope/time | unavailable/missing |
| availability | `AVAILABLE` | current pristup potvrđen barem jednim putem | target/access/time | location history ili integrity match |
| availability | `UNAVAILABLE` | current pristup potvrđeno nije moguć | target/reason/time | withdrawn/deleted |
| availability | `EXTERNAL_REFERENCE_ONLY` | nema lokalne Rep | URL/reference/time | snapshot postoji |
| location result | `FOUND_AT_RECORDED_LOCATION` | target pronađen na provjerenom recorded path-u | target/path/method/time | sve Rep su available |
| location result | `NOT_FOUND_AT_EXPECTED_LOCATION` | target nije pronađen na konkretnom path-u | target/path/method/time | deleted/unavailable |
| location result | `FOUND_AT_NEW_LOCATION` | target pronađen na novom path-u | old/new path, method/time | novi SI; tretiranje `RELOCATED` kao availability statusa |
| location result | `LOCATION_CHECK_INCONCLUSIVE` | check nepouzdan | target/path/method/error | found/not found |
| readability | `NOT_ASSESSED` | nema procjene | target/scope | unreadable |
| readability | `FULLY_ACCESSIBLE` | deklarisani scope čitljiv/dostupan | target/scope/purpose/method | autentičan/potpun za drugu namjenu |
| readability | `PARTIALLY_ACCESSIBLE` | dio scope-a čitljiv/dostupan | accessible/inaccessible scope | cijeli sadržaj poznat |
| readability | `DAMAGED_OR_UNREADABLE` | oštećen/nečitljiv u navedenom obimu | target/scope/method | sadržaj netačan |
| hash baseline | `RECORDED_HASH_AVAILABLE` | baseline zapis postoji | hash record ID/target/value/time | verification match |
| hash baseline | `NO_RECORDED_HASH` | baseline ne postoji | target/time | failed verification |
| hash baseline | `HASH_CHECK_NOT_APPLICABLE` | hash nije smislen za target | target/reason | nebitan source |
| integrity result | `NOT_CHECKED` | nema check-a prema baseline-u | target/baseline state | mismatch |
| integrity result | `MATCHES_RECORDED_HASH` | computed hash odgovara identifikovanom baseline-u | baseline ID, method/value/time | autentično/istinito |
| integrity result | `DOES_NOT_MATCH_RECORDED_HASH` | computed hash ne odgovara baseline-u | baseline ID, method/value/time | razlog ili tampering |
| integrity result | `CHECK_INCONCLUSIVE` | provjera nepouzdana | baseline ID kada postoji, method/error | match/mismatch |

`RELOCATED` nije normativni availability status, nego samo moguća izvedena UI oznaka iz location history-ja. `NO_RECORDED_HASH` i `HASH_CHECK_NOT_APPLICABLE` nijesu integrity verification rezultati.

### 14.1 Transition reading rule

**Normative:** Novi check ili assessment ne prepisuje prethodni. Dodaje novi audit zapis. Current status je samo izvedena projekcija posljednjeg relevantnog zapisa za određeni target i scope. Sljedeće matrice definišu dozvoljene konceptualne zapise i projekcije, ne runtime state machine.

### 14.2 Availability state transitions

| Početno | Novo | Dozvoljeno | Akter/recorder | Preduslov | Audit | Zabranjen zaključak |
|---|---|---:|---|---|---|---|
| novi target | `UNKNOWN` | DA | recorder/system | nema dovoljne current provjere | target, time, basis | unavailable |
| `UNKNOWN`/`UNAVAILABLE` | `AVAILABLE` | DA | system/H recorder | potvrđen current pristup | target, access basis, time | integrity/readability match |
| `UNKNOWN`/`AVAILABLE` | `UNAVAILABLE` | DA | H ili pregledan system result | potvrđena current nemogućnost pristupa | target, reason/basis, time | deleted/withdrawn |
| bilo koje | `EXTERNAL_REFERENCE_ONLY` | DA za odgovarajući target | H recorder | potvrđeno odsustvo lokalne Rep | reference, scope, time | istorijski snapshot ne postoji |
| bilo koje | bilo koje | DA kao novi zapis | ovlašćeni recorder | novija relevantna provjera | previous ref + novi zapis | overwrite prethodnog stanja |

### 14.3 Location verification result/history

| Prethodni rezultat | Novi rezultat | Dozvoljeno | Akter/recorder | Preduslov | Audit | Zabranjen zaključak |
|---|---|---:|---|---|---|---|
| nema | bilo koji location result | DA | deterministički sistem ili H | identifikovan target, path i metod | path, method, time, result | source identity/truth |
| `FOUND_AT_RECORDED_LOCATION` | `NOT_FOUND_AT_EXPECTED_LOCATION` | DA kao novi check | system/H | kasnija provjera istog path-a | oba zapisa i vremena | deleted/unavailable svuda |
| `NOT_FOUND_AT_EXPECTED_LOCATION` | `FOUND_AT_NEW_LOCATION` | DA kao novi check/event | system/H | target dovoljno povezan sa novim path-om | old/new path, basis, time | novi SI |
| bilo koji | `LOCATION_CHECK_INCONCLUSIVE` | DA | system/H | check nije pouzdan | method/error/time | found/not found |
| bilo koji | bilo koji | DA kao history | recorder | novi check | append audit | prepisivanje starog result-a |

### 14.4 Accessibility/readability assessment transitions

| Početno | Novo | Dozvoljeno | Assessor | Preduslov | Audit | Zabranjen zaključak |
|---|---|---:|---|---|---|---|
| nema | `NOT_ASSESSED` | DA | recorder | nema procjene | target/scope/time | unreadable |
| `NOT_ASSESSED`/raniji assessment | `FULLY_ACCESSIBLE` | DA kao novi assessment | H/stručnjak/system za determinističko opažanje | target, scope, purpose i metod | assessed_by, method, scope, time | authentic/complete for all purposes |
| bilo koji | `PARTIALLY_ACCESSIBLE` | DA kao novi assessment | H/stručnjak | čitljivi i nečitljivi dio identifikovani | oba scope-a, method, limitations | cijeli content poznat |
| bilo koji | `DAMAGED_OR_UNREADABLE` | DA kao novi assessment | H/stručnjak | damage/readability opažen za scope | scope, method, limitations | content false |
| bilo koji | bilo koji | DA kao novi assessment | identifikovani assessor | nova Rep, metod ili stanje | previous ref + novi zapis | overwrite ranijeg nalaza |

### 14.5 Hash baseline transitions

| Početno | Novo | Dozvoljeno | Akter/recorder | Preduslov | Audit | Zabranjen zaključak |
|---|---|---:|---|---|---|---|
| nema | `NO_RECORDED_HASH` | DA | recorder/system | target identifikovan, baseline odsutan | target/time | failed check |
| nema | `HASH_CHECK_NOT_APPLICABLE` | DA | H/tehnički assessor | obrazloženje neprimjenjivosti | target, reason, assessor, time | source irrelevant |
| `NO_RECORDED_HASH` | `RECORDED_HASH_AVAILABLE` | DA dodavanjem baseline-a | ovlašćeni recorder/system | hash evidentiran za konkretan digitalni target | hash record ID, value, method/time | retroaktivni verification ranijeg stanja |
| `RECORDED_HASH_AVAILABLE` | novi `RECORDED_HASH_AVAILABLE` | DA samo kao dodatni baseline za novu CV/Rep ili novi zapis | recorder | target/scope i razlog jasno razlikovani | oba baseline zapisa | overwrite ranijeg hasha |
| bilo koje | drugo | DA samo uz novi obrazloženi zapis | H/recorder | promjena applicability/targeta | previous ref, reason, time | mutacija istorije |

### 14.6 Integrity verification result transitions

| Prethodni rezultat | Novi rezultat | Dozvoljeno | Akter/recorder | Preduslov | Audit | Zabranjen zaključak |
|---|---|---:|---|---|---|---|
| nema | `NOT_CHECKED` | DA | recorder | target/baseline state identifikovan | target/time | mismatch |
| `NOT_CHECKED`/raniji check | `MATCHES_RECORDED_HASH` | DA kao novi check | deterministički sistem/IT recorder | konkretni baseline i metod | baseline ID, value, method, time | authentic/true |
| `NOT_CHECKED`/raniji check | `DOES_NOT_MATCH_RECORDED_HASH` | DA kao novi check | deterministički sistem/IT recorder | konkretni baseline i metod | baseline ID, both values, method, time | razlog mismatcha/tampering |
| bilo koji | `CHECK_INCONCLUSIVE` | DA kao novi check | system/IT/H | rezultat nepouzdan | baseline ID kada postoji, method/error | match/mismatch |
| bilo koji | bilo koji | DA kao novi check | recorder | kasnija provjera | previous ref + novi zapis | overwrite starog check-a |

## 15. Lifecycle, Correction, Replacement and Withdrawal

| Scenario | Lifecycle | Relation/availability | Authority/audit | Posljedica |
|---|---|---|---|---|
| current source/version | `ACTIVE` | — | creation audit | aktuelan, ne automatski reviewed |
| identifikovana nova važeća verzija | stara može `SUPERSEDED` samo za cijeli lifecycle scope | context-aware `REPLACES` ne daje status automatski | owner/H/L; matter/scope/purpose/time | stara može ostati aktivna u drugom kontekstu |
| djelimična ispravka | obično oba ostaju prema namjeni | `CORRECTS` | precizan scope/reason | stari nije cijeli zamijenjen |
| issuer withdrawal | `WITHDRAWN` | provenance event | issuer/owner authority + L review po učinku | EL/history ostaju |
| pogrešno evidentiran zapis | `VOIDED` | korektivna veza | povišeni authority | nema brisanja |
| file unavailable | lifecycle bez automatske promjene | availability status | check audit | nije withdrawn/superseded |

## 16. Conflict and Materiality

| Scenario | Record | Materiality/review | Trust/Verified Fact | Zabranjeno |
|---|---|---|---|---|
| scopes navode različite datume | source + assertion conflict sa matter/scope/purpose/time | L procjenjuje | unresolved material blokira samo pogođenu eligibility | sistem bira datum ili blokira cijeli matter |
| source ispravlja raniji | `CORRECTS` + mogući conflict disposition | L prema učinku | zasebna trust/review odluka | brisanje starog EL |
| samo dio assertion podržan | partial EL | H/L + atomizacija | cijela assertion nije confirmed po automatizmu | sakriti nepodržani dio |
| konflikt riješen | scope-specific disposition + Review Record | ovlašćeni L | pogođena eligibility se ponovo procjenjuje | „resolved“ globalno ili suprotni izvor lažan |

## 17. Multi-matter and Access

| Pitanje | Pravilo | Audit/authority | Zabranjeno |
|---|---|---|---|
| jedan SI, više matters | eksplicitne associations | recorder + H/L review | fizički duplikat kao obavezni model |
| EL | zaseban matter context, scope i assertion | relation review | prenos linka u drugi matter |
| confidentiality | klasifikacija po relevantnom kontekstu | ovlašćeni classifier/L | shared SI = shared access |
| access | restrictions vidljive bez otkrivanja sadržaja | authority/time/basis | VLA-0B kao enforcement dizajn |

## 18. Audit Requirements

| Događaj | Minimalni audit sadržaj |
|---|---|
| kreiranje SI/CV/Rep | stabilni ID, type, creator/generator, time, provenance summary |
| location promjena/provjera | target Rep, old/expected/new location, result, actor, time |
| recorded hash | target digital content, value, recorded time/actor, algorithm kao evidentirani podatak |
| verification | target i baseline, result/value, time, method, actor/system; bez overwrite-a |
| provenance | event type, roles, target, channel, dates, recorder, limitations |
| EL/source relation | source/target/version/scope, type, proposer, reviewer, purpose, time, limitations |
| assessment/review | target/version, axis, purpose, method/basis, result, authority, time, limitations |
| conflict | scopes/assertions, issue, scope, materiality, status, disposition, rationale, authority, time |
| lifecycle | old/new state, reason, authority, linked replacement/correction, time |

Evidence Link i Source Relation su audit-relevantni relation records. Korekcija dodaje novu precizniju relaciju uz `SUPERSEDED` prethodne, `WITHDRAWN` povlači relaciju, a `VOIDED` se koristi samo za pogrešan target, duplikat relation zapisa ili proceduralnu nevalidnost. Novi konflikt dodaje conflict record i ne voiduje automatski raniju relaciju. Prethodni relation zapis se ne prepisuje.

Audit mora biti file-first, append-oriented i čitljiv bez aplikacije. Current projekcije i budući indeks nijesu zamjena.

## 19. Forbidden Shortcuts

| Prečica | Rezultat provjere |
|---|---|
| path/filename/hash kao SI ID | ODBIJENO |
| hash match kao autentičnost/istina | ODBIJENO |
| `SUPPORTS` automatski mijenja trust | ODBIJENO |
| attribution potvrđuje sadržaj | ODBIJENO |
| system/AI finalno potvrđuje relation/conflict | ODBIJENO |
| mismatch automatski znači tampering | ODBIJENO |
| copy/derived format/nova CV spojeni | ODBIJENO |
| rename/move stvara SI | ODBIJENO |
| identičan hash briše provenance zapis | ODBIJENO |
| lifecycle, availability i integrity u jednom statusu | ODBIJENO |
| istorijski hash/CV/EL/review overwrite | ODBIJENO |
| auditno relevantni source fizički obrisan | ODBIJENO |
| availability kao rename/move/location result | ODBIJENO |
| readability kao availability ili location result | ODBIJENO |
| hash baseline/applicability kao verification result | ODBIJENO |
| novi check/assessment prepisuje prethodni | ODBIJENO |
| `DERIVED_FROM` automatski određuje istu CV | ODBIJENO |
| `DUPLICATES` i `COPY_OF` kao sinonimi | ODBIJENO |
| `REPLACES` automatski daje globalni `SUPERSEDED` | ODBIJENO |
| conflict disposition važi izvan evidentiranog scope-a | ODBIJENO |
| technical observation kao semantic/legal conclusion | ODBIJENO |
| relation record bez očuvane istorije | ODBIJENO |

## 20. Edge-case Result Matrix

| # | Primarni rezultat | # | Primarni rezultat |
|---:|---|---:|---|
| 1 | dva SI + human-reviewed `DUPLICATES` | 16 | snapshot/history odvojen od live weba |
| 2 | isti SI/CV + rename location event/check | 17 | not-found result; availability odvojena |
| 3 | old not-found + new found; current available | 18 | void/correct matter association uz trag |
| 4 | baseline-specific mismatch ili nova CV | 19 | symmetric duplicate bez merge-a provenance |
| 5 | context-aware `REPLACES`, bez globalnog supersession-a | 20 | bilješka `ATTRIBUTES_STATEMENT` |
| 6 | `DERIVED_FROM`; ista CV samo uz potvrdu očuvanja | 21 | external reference + no-snapshot warning |
| 7 | photo/copy relation, original nije dostavljen | 22 | mismatch razlog ostaje neodređen |
| 8 | email + tri attachment SI | 23 | context-specific confidentiality/access |
| 9 | copy lineage i duplicate equality odvojeni | 24 | relevantnost bez authenticity zaključka |
| 10 | poruke SI; thread agregacija | 25 | attribution support + factual contradiction |
| 11 | attribution, ne truth | 26 | `WITHDRAWN`, bez brisanja/istine zaključka |
| 12 | scope-aware correction/replacement + istorija | 27 | relation lifecycle čuva široki EL |
| 13 | scope-specific conflict disposition | 28 | readability odvojena od availability/location |
| 14 | partial support + atomizacija | 29 | original/certified/ordinary copy razlikovani |
| 15 | zasebni matter EL/access | 30 | proposal only dok H ne potvrdi duplicate |

Detaljni authority, provenance, scope, integrity i audit ishodi za svih 30 slučajeva nalaze se u §23 glavnog dokumenta.

## 21. Conceptual Acceptance Tests

| Test | Očekivani rezultat |
|---|---|
| rename uz isti sadržaj | SI/CV ostaju; location audit dodat |
| hash mismatch | verification result dodat; recorded hash ostaje; razlog unknown |
| potvrđen `SUPPORTS` | assertion trust se ne mijenja bez zasebne odluke |
| email navodi spornu činjenicu | attribution može biti potvrđena; factual truth ne |
| partial support | podržani obim eksplicitan; preširoka assertion se atomizuje |
| dva konfliktna izvora | oba ostaju; system ne bira; material unresolved blokira eligibility |
| PDF izveden iz DOCX | derivation evidentiran; EL/trust se ne nasljeđuju |
| source povučen/ispravljen/zamijenjen | istorija, hashes, links i reviews ostaju |
| file missing | availability se mijenja; lifecycle/trust ne automatski |
| source u dva matters | zasebni context, EL i access assessment |
| AI predloži duplikat | nema finalne relacije bez H reviewa |
| budući indeks se obriše | autoritativni file-first audit ostaje čitljiv |
| rename/move ili location check | availability se ne koristi kao location event/result |
| djelimično čitljiv source | readability assessment je odvojen od availability i location check-a |
| nema recorded hash-a | `NO_RECORDED_HASH` je baseline state, ne verification result |
| ponovljeni check/assessment | dodat je novi audit zapis; prethodni nije prepisan |
| `DERIVED_FROM` postoji | ista CV zahtijeva zasebnu potvrdu relevantnog očuvanja |
| copy relation i praktična jednakost | `COPY_OF` directional i `DUPLICATES` symmetric ostaju odvojeni |
| context-specific `REPLACES` | ne nastaje globalni `SUPERSEDED` |
| conflict disposition | važi samo za evidentirani matter/scope/assertion/purpose/context |
| sistem bilježi MIME attachment/hash result | tehnički zapis nije semantic assessment ni legal significance |
| EL/source relation se ispravlja | nova lifecycle/audit relacija čuva prethodni zapis |

Prolaz zahtijeva očuvanje svih navedenih rezultata bez aplikacionog koda, storage šeme ili proširenja na VLA-0C.
