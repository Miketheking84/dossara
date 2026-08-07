# DOSSARA — WP VLA-0E Historical Reconstruction and Audit Invariants

## 1. Document Control and Reading Rule

Ovaj dokument je normativni pratilac `vla-0e-semantic-event-and-temporal-history.md`. Čita se zajedno sa autoritativnim VLA-0A–D paketima. Ako sažeta matrica djeluje šire od osnovnog dokumenta, uža normativna granica osnovnog dokumenta i A–D ima prednost. Dokument ne predstavlja šemu ni implementaciju.

## 2. Reconstruction Coordinates

Svaka istorijska rekonstrukcija mora eksplicitno ili kroz jasno dokumentovan default identifikovati:

| Koordinata | Pitanje |
|---|---|
| `matter/scope` | za koji predmet, segment, target i purpose se rekonstruiše |
| knowledge cut-off `Tk` | koje informacije i evente je dozvoljeno znati |
| recorded cut-off `Tr` | koji autoritativni zapisi su do tada postojali u DOSSARI |
| effective instant/interval `Te` | za koji trenutak ili period dejstva se pita |
| rules/policy vantage | koja istorijski primjenjiva pravila tumače inpute |
| validation posture | da li je rezultat valid, stale, incomplete, invalid ili recovery-blocked |

`Tk` i `Tr` mogu biti isti u jednostavnom intake-u, ali se konceptualno ne spajaju. Shorthand smije postaviti `Tk = Tr`, dok puni historical reconstruction mora dozvoliti da se razlikuju kada je to obrazloženo. Upit bez navedenog knowledge vantage-a ne smije tvrditi da predstavlja ono što je bilo informaciono dostupno u istorijskom trenutku.

## 3. As-known-at T Reconstruction

Shorthand `as-known-at(T)` znači `as-known-at(Tk = T, Tr = T)`. Puni oblik `as-known-at(Tk, Tr)` dozvoljava različite cut-off-e:

1. lokalizovati matter/scope/purpose;
2. uključiti samo autoritativne record/event revizije sa `known_at ≤ Tk` i `recorded_at ≤ Tr`;
3. za svaki objekat izabrati revision koja je do relevantnih cut-off-a postojala i bila relevantna, bez gledanja u kasniji sadržaj;
4. primijeniti samo review, decision, approval, conflict disposition, lifecycle i apply rezultate koji zadovoljavaju oba relevantna cut-off-a i tada su važeći za scope;
5. rekonstruisati tada dostupni Matter State/projection rezultat ili ga označiti incomplete/invalid ako nema dovoljno podataka;
6. prikazati uncertainty, conflicts i pending/rejected/scheduled stanja koja su tada postojala;
7. isključiti kasnije discovery, correction, recovery finding i re-review čak i kada danas znamo da su retroaktivno relevantni.

Ako je informacija bila informaciono dostupna prije `Tk`, ali nije bila evidentirana do `Tr`, standardni shorthand sa `Tk = Tr` je ne prikazuje kao evidentiranu; puni upit smije razdvojiti ose. Dostupnost kancelariji/sistemu ne dokazuje subjektivnu svijest određenog čovjeka. Poseban evidentiary prikaz može pokazati naknadno dokazanu tvrdnju o ranijoj individualnoj awareness, sa stvarnim kasnijim `recorded_at` i bez rewriting-a.

## 4. As-effective-at T Reconstruction

Puni oblik je `as-effective-at(Te, Tk, Tr)`. Shorthand `as-effective-at(Te, Tk)` znači samo `Tr = Tk`:

1. izvršiti zasebni knowledge cut prema `Tk` i recorded cut prema `Tr`;
2. zadržati samo revisions/state effects koji imaju validan review/authority/apply osnov potreban po A–D;
3. primijeniti `effective_at` ili interval `[effective_from, effective_to)` na `Te`;
4. razriješiti supersession, correction i conflict samo u njihovom deklarisanom scope-u i prema informacijama dozvoljenim sa `Tk`;
5. ne tretirati `APPLIED_SCHEDULED` kao current prije effective granice;
6. lokalizovati stale/incomplete/invalid/recovery stanje;
7. vratiti i effective rezultat i provenance do exact revisions/events/receipts.

Isti `Te` može dati različit rezultat sa različitim `Tk` ili `Tr`. To nije kontradikcija nego temporalna posljedica: današnje autoritativno razumijevanje istorije nije isto što i tadašnja informaciona dostupnost ili tada evidentirani trag.

## 5. Reconstruction Result Requirements

Rezultat mora omogućiti pregled:

- koordinata i generation time-a upita;
- uključenih i isključenih exact revisions/state effects i razloga;
- relevantnih Source Scope/Evidence Link/Review Record/Decision/Conflict/Apply Receipt referenci;
- poznatih temporalnih neizvjesnosti i intervala;
- authority context-a primijenjenog na događaje;
- validation/staleness/recovery ograničenja;
- da li je rezultat generisana projekcija ili sačuvani historical snapshot;
- reproduktivnosti iz autoritativnih file-first zapisa ili jasno navedenog nedostatka.

Current state sam po sebi nije dokaz ovog rezultata.

## 6. Normative Invariants

1. **Event immutability invariant.** Historical Semantic Event se ne smije tiho prepisati; ispravka je novi povezani audit događaj.
2. **Knowledge-time invariant.** Kasnije znanje se ne smije prikazati kao znanje koje je postojalo ranije.
3. **Effective-time invariant.** Effective time i knowledge/recorded time su odvojene ose; retroaktivno dejstvo ne backdate-uje znanje.
4. **Revision/event distinction invariant.** Object revision nije Semantic Event; nijedno samo po sebi ne zamjenjuje drugo.
5. **Stable-reference invariant.** Istorijski review, approval, evidence i apply moraju ostati vezani za tačnu target revision, ne za budući „latest“.
6. **Apply evidence invariant.** Positive state effect mora biti sljediv do ovlašćenog Controlled Apply-a ili do eksplicitno dozvoljenog sistemskog temporalnog/protective transition-a iz A–D.
7. **Attempt/result distinction invariant.** Apply attempt ne dokazuje apply result, a Apply Receipt nije sinonim za pokušaj.
8. **Unknown-completion invariant.** Neizvjestan persistence ishod ne smije biti protumačen ni kao success ni kao failure; pogođeni scope ostaje `RECOVERY_REQUIRED`.
9. **Recovery audit invariant.** Recovery daje novi auditabilni finding i ne briše ambiguous attempt, njegove dokaze ili prethodno receipt stanje; već autoritativni append-only Apply Receipt ne smije biti mutiran ili prepisan.
10. **Historical reconstruction invariant.** Current state nije dovoljan dokaz šta je bilo poznato, pregledano, odobreno ili efektivno u prošlosti.
11. **Authority-at-time invariant.** Authority se ocjenjuje za relevantno vrijeme radnje, scope i purpose; današnja uloga ne prepisuje istorijski nalaz.
12. **Conflict-history invariant.** Riješen konflikt, izvori, argumenti, review i raniji zaštitni efekti ostaju istorijski rekonstruabilni.
13. **Projection non-authority invariant.** Odbaciva projekcija/indeks ne postaje semantički autoritet zato što je aplikacija čita ili zato što je brža.
14. **No silent retroactivity invariant.** Retroaktivna effective correction ne smije izmijeniti istorijski knowledge state, recorded chronology, review ili approval.
15. **Future-effect invariant.** Future-effective applied zapis postoji i auditabilan je prije dejstva, ali nije positive current membership prije effective granice.
16. **No reapproval-by-clock invariant.** Sam nastup već odobrenog effective datuma ne zahtijeva novu ljudsku odluku; nova odluka je potrebna samo ako materijalno promijenjen kontekst ili pravilo to zahtijeva.
17. **No invented time invariant.** Nepoznato vrijeme ostaje nepoznato/interval; ne kopira se drugi timestamp radi popunjavanja.
18. **Scope/purpose invariant.** Temporalni rezultat, review, authority i conflict disposition ne smiju se globalizovati van evidentiranog matter/scope/purpose-a.
19. **Recorded-history invariant.** State as recorded at T ne smije koristiti zapis evidentiran poslije T, čak ni kada ima raniji `effective_from`.
20. **Effective-interval invariant.** `effective_to` završava samo deklarisani scope; ne briše revision niti događaj i ne implicira globalni lifecycle prestanak.
21. **Late-evidence invariant.** Late-discovered evidence čuva stvarni discovery/knowledge/recorded trag i odvojeni raniji occurred/effective kontekst.
22. **Corrective-chain invariant.** Correction, refutation, supersession, reconciliation i semantic rollback moraju referencirati prethodni osnov i ostaviti cijeli lanac čitljivim.
23. **Review-history invariant.** Kasniji review ili reopening ne mijenja ono što je prethodni reviewer odlučio za tadašnju revision/purpose.
24. **Approval-history invariant.** Approval ostaje content-bound; kasnija revision ili retroaktivni effect ne nasljeđuje ga bez pravila VLA-0D.
25. **Recovery authority invariant.** Technical ili semantic recovery ne smije donijeti novu poslovnu odluku niti poništiti dokazivi validni effect bez novog odobrenog change-a.
26. **Reconciliation invariant.** Manual/expected-state mismatch čuva oba opažena stanja i blokira overwrite/apply dok novi reconciliation event ne utvrdi ishod.
27. **Projection provenance invariant.** Svaka auditabilna projekcija/snapshot navodi inpute, rules version, scope, generation time i validation status.
28. **Projection regeneration invariant.** Regenerabilni current/historical prikaz mora poticati iz kompletnog primjenjivog autoritativnog inputa; proposed ili expected effect nije actual input samo zato što je odobren.
29. **Downstream time invariant.** Retroaktivni effective datum i vrijeme kada je downstream impact postao poznat ostaju odvojeni.
30. **Staleness distinction invariant.** Potential impact, material relevance, confirmed invalidation, review-required i follow-up nijesu sinonimi.
31. **File-first authority invariant.** Autoritativni object/revision/event/review/decision/apply/recovery podaci ne smiju postojati samo u SQLite indeksu, cache-u ili drugoj odbacivoj projekciji.
32. **Storage-neutrality invariant.** Semantički rezultat ne zavisi od Event Sourcing-a, CQRS-a, SQL tabele, konkretnog fajl formata ili transporta.
33. **Causal-chain invariant.** State effect mora biti poveziv sa uzrokom, tačnim input revisions, relevantnim authority/review osnovom i actual result-om.
34. **No status collapse invariant.** Proposal, review, approval, attempt, apply result, effect, effective activation i projection generation ostaju zasebno dokazivi.
35. **Unknown-not-false invariant.** `unknown`, `not recorded`, `not applicable`, `blocked`, `failed` i `not effective yet` ne smiju se svesti na jednu false/null vrijednost u semantičkom tumačenju.
36. **Audit readability invariant.** Ključni istorijski lanac mora ostati ljudski čitljiv bez aplikacije u skladu sa file-first principom.
37. **Informational-availability invariant.** Dostupnost informacije kancelariji, mailbox-u, intake sistemu ili DOSSARI i dokaziva subjektivna awareness određenog čovjeka nijesu sinonimi.

## 7. Apply and Recovery State Matrix

| Opažanje | Semantički rezultat | Current-state postupak | Dozvoljeni nastavak |
|---|---|---|---|
| attempt nije počeo | nema Apply Attempt eventa | state nepromijenjen | novi validan attempt |
| attempt počeo, dokazivo bez mutacije | `FAILED` ili drugi VLA-0D dokazivi rezultat | nema positive effect-a | revalidation pa retry |
| uspjeh i actual state dokazani | VLA-0D successful result + receipt | immediate ili scheduled effect prema vremenu | projection regeneration |
| desired effect ranije isti apply | `NO_OP_ALREADY_APPLIED` | referencira raniji receipt | bez duplikata |
| desired state postoji drugim osnovom | `NO_OP_ALREADY_SATISFIED` | čuva različit poslovni osnov | samo uz dokazanu ekvivalentnost |
| prekid, ishod nedokaziv | `RECOVERY_REQUIRED` / `UNKNOWN_COMPLETION` | affected scope nije pouzdano current | semantic recovery prije retry-ja |
| recovery dokazuje commit | novi `RECONCILED_APPLIED` finding | linkovati postojeći zaključni receipt ili kreirati/linkovati dozvoljeni dodatni receipt/addendum/finding; ne mutirati prethodni receipt | bez ponavljanja effect-a |
| recovery dokazuje no commit | `RECONCILED_NOT_APPLIED` finding | state ostaje pre-apply | puna revalidation pa novi attempt |
| parcijalno/kontradiktorno stanje | i dalje `RECOVERY_REQUIRED` | lokalizovan block/invalid | dodatna recovery/reconciliation procedura |

## 8. Temporal Scenario Matrix

| Scenario | As-known rezultat | As-effective rezultat | Obavezni audit |
|---|---|---|---|
| dokument otkriven 20.8. opisuje događaj 1.6. | nije poznat prije 20.8. | poslije potrebnog review/apply-ja može važiti od 1.6. za današnji vantage | occurred/known/recorded odvojeni |
| pogrešan datum ispravljen retroaktivno | stari datum ostaje u ranijem knowledge pogledu | novi datum važi samo prema later vantage-u i effective scope-u | corrective chain + downstream impact |
| approved/applied danas, effective za mjesec | scheduled, vidljiv kao budući | nije current prije granice; current poslije nje ako validan | approval, receipt, effective time, activation/projection |
| approval danas, apply sjutra | approved-not-applied danas | nema effect-a do uspješnog apply-ja | approval i attempt/result odvojeni |
| apply danas, effect retroaktivan | današnja informaciona dostupnost/evidentiranje/apply se ne backdate-uju | raniji `Te` može uključiti effect samo sa odgovarajućim kasnijim `Tk` i `Tr` | receipt + retroactive authority basis |
| konflikt kasnije riješen | raniji pogled i dalje pokazuje open conflict | kasniji vantage koristi scope-specific disposition | conflict i disposition eventi oba ostaju |
| receipt nedovršen poslije crash-a | zna se samo da je attempt počeo | effect nije pretpostavljen | `RECOVERY_REQUIRED`, zatim recovery finding |
| memo M1 generisan iz S1, kasnije F2 | M1 provenance ostaje S1 | današnji historical effect može biti S2 | potential impact od discovery/effect vremena, ne silent invalidation |
| authority kasnije prestane | ranija validna radnja ostaje validno istorijski ocijenjena | buduće radnje koriste novi authority state | authority-at-event-time snapshot/reference |
| naknadno otkriven nevažeći authority | ranija radnja ostaje zabilježena | protective/corrective effect prema novom eventu | original + correction/reconciliation |

## 9. Conflict Reconstruction

Historical conflict prikaz mora vratiti:

1. event/record nastanka konflikta i tada pogođeni scope;
2. uključene source scopes, assertions i exact revisions;
3. review/argument/evidence događaje koji su postojali do cut-off-a;
4. protective blocking/stale effect i njegov period;
5. authority i disposition event, ako je do cut-off-a postojao;
6. nastale correction/supersession/state effect revizije;
7. eventualno reopening i kasniji disposition kao novi lanac.

Current `RESOLVED` projekcija bez ovog lanca nije dovoljna istorijska evidencija.

## 10. Downstream Impact Reconstruction

Za output M1 sistem mora moći odgovoriti:

- iz kog state/projection identity-ja i exact revision skupa je izveden;
- koji su `Tk`, `Tr`, `Te`, rules version, purpose i scope korišćeni;
- kada je F2 nastao, postao poznat, evidentiran, pregledan i applied/effective;
- od kada postoji potential downstream impact u knowledge osi;
- na koji historical effective interval se promjena odnosi;
- da li je material relevance potvrđen, output invalidiran ili je samo potreban review.

VLA-0E ne određuje sadržaj Work Product-a, materiality matricu niti automatski follow-up. Daje samo neophodnu provenance i temporalnu osnovu.

## 11. Reconstruction Failure Conditions

Rezultat se ne predstavlja kao pouzdan kada:

- nedostaje autoritativna event/revision ili causal referenca potrebna za zaključak;
- postoji `RECOVERY_REQUIRED` u relevantnom scope-u;
- manual edit ili expected-state mismatch nije reconciled;
- projection input/rules version nije dokaziv;
- timestamp je izmišljen ili su knowledge/effective ose spojene;
- authority ili review scope nije moguće istorijski utvrditi;
- unresolved material conflict blokira relevantnu eligibility;
- rekonstrukcija zavisi isključivo od odbacivog indeksa koji se ne može potvrditi file-first zapisima.

Gdje je moguće, failure se lokalizuje na target/segment/scope. Sistem ne proglašava cijeli matter invalidnim bez osnova.

## 12. Conceptual Acceptance Tests

| Test | Očekivani rezultat |
|---|---|
| promjena sadržaja assertion-a | nova revision; poseban proposal/correction event; stara revision ostaje |
| ista revision pregledana i odobrena | najmanje odvojeni review i approval događaji/reference |
| UI samo otvara panel | nema Semantic Eventa bez semantičkog značaja |
| `occurred_at` nije poznat | event se bilježi sa unknown/interval; known/recorded ostaju tačni |
| discovery 20.8, event 1.6 | as-known 5.6 ne vidi kasnije znanje |
| današnji vantage pita stanje 1.6 | as-effective može uključiti retroaktivni effect uz provenance i današnji Tk |
| approved ali nije applied | nema positive Matter State effect-a |
| applied scheduled | objekat/receipt postoje; current membership čeka effective granicu |
| effective datum nastupi bez druge promjene | nema novog approval-a; temporal state/projection event može nastati |
| blocker nastane prije future date-a | nema silent activation; protective block i review/change prema A–D |
| crash poslije mogućeg commit-a | ni success ni failure se ne pretpostavljaju |
| recovery nađe potpuni commit | novi `RECONCILED_APPLIED` finding; prethodni attempt/receipt ostaju nepromijenjeni; nema duplicate apply-ja |
| recovery nađe da nema commit-a | `RECONCILED_NOT_APPLIED`; retry tek nakon revalidation |
| recovery potvrdi raniji apply, ali tačno vrijeme nije dokazivo | `applied_at` ostaje unknown/interval; recovery čuva sopstvene kasnije `known_at` i `recorded_at` |
| mailbox primi dokument, bez dokaza da ga je advokat otvorio | `known_at` može dokazati informacionu dostupnost u scope-u; ne tvrdi subjektivnu awareness advokata |
| `as-known-at(T)` shorthand | primjenjuje `Tk = T` i `Tr = T`; puni upit smije razdvojiti cut-off-e |
| konflikt resolved | open period, disposition i resulting state svi rekonstruabilni |
| actor danas ima drugu ulogu | istorijski authority se ocjenjuje prema event time-u |
| projection indeks obrisan | autoritativna istorija nije izgubljena; projection se može regenerisati ili se prijavi nedostatak |
| snapshot generisan | dokazuje generisanje sa inputima/statusom, ne istinitost |
| M1 iz S1, retroaktivni F2 stvara S2 | M1 zadržava S1 provenance; potential impact i effective interval su odvojeni |
| event referencira „latest“ bez revision ID-a | audit/reconstruction validation failure |
| kasniji correction pokuša izmijeniti stari event | odbija se; zahtijeva novi povezani event |
| storage implementiran bez event-sourced state-a | dozvoljeno ako su svi autoritativni audit i rekonstrukcioni zahtjevi ispunjeni |

## 13. Acceptance Criteria Cross-check

| # | Pitanje | Zaključan odgovor |
|---:|---|---|
| 1 | Šta je Semantic Event? | §5.3 i §6 osnovnog dokumenta |
| 2 | Kako se razlikuje od revision-a? | §5 i invariant 4 |
| 3 | Kako se razlikuju ključna vremena? | §9 osnovnog dokumenta |
| 4 | Kako se rekonstruiše as-known? | §3 ovog dokumenta |
| 5 | Kako se rekonstruiše as-effective? | §4; puni oblik uvijek čuva `Te`, `Tk` i `Tr` |
| 6 | Late-discovered evidence? | §12 osnovnog i §8 ovog dokumenta |
| 7 | Retroactive correction bez rewriting-a? | corrective chain + odvojene ose |
| 8 | Future-effective state? | §13 osnovnog dokumenta |
| 9 | Change Item/Attempt/Result/Receipt? | §14 osnovnog i §7 ovog dokumenta |
| 10 | `UNKNOWN_COMPLETION`? | `RECOVERY_REQUIRED`; nema pretpostavljenog ishoda |
| 11 | Auditabilan recovery? | novi recovery event/finding; ambiguous attempt ostaje |
| 12 | Authority context? | §10 osnovnog dokumenta |
| 13 | Conflict resolution history? | §16 osnovnog i §9 ovog dokumenta |
| 14 | Downstream stale analysis? | §18 osnovnog i §10 ovog dokumenta |
| 15 | Storage-neutralnost? | §20 osnovnog i invariant 32 |
| 16 | File-first kompatibilnost? | §17 osnovnog i invariant 31/36 |
| 17 | Bez Event Sourcing/CQRS obaveze? | eksplicitno u §17 osnovnog dokumenta |
| 18 | Spremnost za persistence/domain contracts? | temporalna semantika i reconstruction contracts su zaključani; fizički format ostaje implementaciona odluka |

## 14. Material Open Questions

Nema materialnog semantičkog pitanja koje blokira prijem ovog WP-a ili početak kasnijeg projektovanja persistence/domain contracts. Implementacione odluke iz §21 osnovnog dokumenta ostaju namjerno otvorene i ne smiju promijeniti ove invarijante.

## 15. Acceptance Recommendation

Ako human review potvrdi usklađenost ova dva dokumenta sa VLA-0A–D, preporuka je:

`GO — WP VLA-0E ACCEPTANCE READY`

Ova preporuka ne predstavlja prihvatanje Faze 0, ne odobrava produkcijsku implementaciju faza 1–6, ne otvara VLA-0F i ne odobrava commit.
