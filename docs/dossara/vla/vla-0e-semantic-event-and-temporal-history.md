# DOSSARA — WP VLA-0E Semantic Event and Temporal History

## 1. Document Control

| Polje | Vrijednost |
|---|---|
| Dokument | WP VLA-0E — Semantic Event and Temporal History |
| Status | Dokumentacioni baseline za human review |
| Datum | 7. avgust 2026. |
| Repository branch | `spike/phase-0c-electron-forge-webpack` |
| Početni repository HEAD | `8d87bdf264dd18afe699df4b1399a7bea330706c` |
| Formalni kontrolni akt | `docs/dossara/decision-alignment-register-v1.2.md` |
| Autoritativni prethodnici | VLA-0A (`d78cfd4`), VLA-0B (`cf7051a`), VLA-0C (`9a464e5`), VLA-0D (`8d87bdf`) |
| Vrsta rada | Documentation-only; storage-neutral; bez implementacione šeme |

## 2. Purpose and Boundary

VLA-0E definiše kako DOSSARA opisuje semantički značajne događaje, razdvaja vrijeme znanja od vremena dejstva i čuva osnov za istorijsku rekonstrukciju. Ne redefiniše objekte, trust/review/lifecycle ose, Source/Evidence model, Matter State, Change Set, Controlled Apply ili Apply Receipt iz VLA-0A–D.

**Normative:** istorijski zapis mora omogućiti odgovor šta se dogodilo, kada se dogodilo, kada je postalo poznato, kada je evidentirano, kada je proizvodilo dejstvo, ko je djelovao, u kom authority kontekstu i koje tačne revizije ili state effects su nastale.

## 3. Scope and Out of Scope

U scope-u su Semantic Event, temporalne ose, korekcija bez prepisivanja, future-effective stanje, apply/recovery istorija, authority-at-time, conflict disposition istorija, projection audit i temporalni osnov downstream staleness analize.

Van scope-a su SQLite i druge šeme, tabele, JSON/Zod/TypeScript ugovori, UUID format, Event Sourcing, CQRS, filesystem raspored, atomic write, fsync, temp fajlovi, locking, WAL, scheduler, sinhronizacija, authentication, RBAC/ACL matrice, potpisi, enkripcija, retention, rokovi, kalendarska pravila, Work Product arhitektura, AI/API/MCP i aplikacioni kod.

## 4. Alignment with VLA-0A–D

- **VLA-0A** daje terminologiju, odvojene trust/review/lifecycle/decision ose, Review Record i ljudski authority. VLA-0E događaj samo istorijski referencira te rezultate; ne pretvara event u status niti sistem u decision authority.
- **VLA-0B** daje stabilni Source Item, Content Version, Source Scope, Evidence Link, provenance, integrity i conflict trag. VLA-0E dodaje kada su ti zapisi nastali, postali poznati, provjereni ili dobili disposition.
- **VLA-0C** daje Matter State kao rebuildable, purpose-aware projekciju nad file-first autoritativnim zapisima. VLA-0E zaključava dva različita istorijska pogleda i njihove cut-off kriterijume.
- **VLA-0D** daje Change Set/Item revision, review, approval, Controlled Apply, item-level rezultat i Apply Receipt. VLA-0E povezuje njihov redoslijed, vremena i ambiguous/recovery ishode bez izmjene VLA-0D kataloga rezultata.

Nema fundamentalne kontradikcije sa A–D. Tamo gdje je VLA-0C ostavio effective-time engine otvoren, ovaj WP zaključava semantiku, ali ne implementaciju.

## 5. Three Distinct Historical Concepts

### 5.1 VLA Object Identity

Stabilni identitet semantičkog objekta kroz njegov život. Promjena path-a, prikaza, projekcije ili sadržaja ne smije automatski stvoriti novi object identity. Pravila kada je potreban novi objekat ostaju object-specific prema A–D.

### 5.2 VLA Object Revision

Nepromjenjiva identifikovana verzija sadržaja ili semantičkih atributa objekta. Nova revizija čuva vezu sa stabilnim object identity-jem i prethodnom revizijom. Review, approval, evidence veza i apply moraju referencirati tačnu relevantnu reviziju.

### 5.3 Semantic Event

`SEMANTIC_EVENT` je nepromjenjivi, autoritativni istorijski zapis da se desila semantički relevantna radnja, opažanje, odluka, pokušaj, rezultat ili state effect u identifikovanom matter/scope/purpose kontekstu.

Event može referencirati postojeću ili novu reviziju, ali nije revizija. Revizija opisuje stanje sadržaja; event opisuje istorijsku činjenicu o radnji ili rezultatu. Jedna revizija može biti predmet više događaja (proposal, review, approval, apply), a jedan događaj može referencirati više revizija (npr. atomic apply rezultat).

**Normative:** tehnički UI klik, render, autosave ili cache refresh nije Semantic Event bez legalnog, evidentiary, review, decision, authority, state-transition, apply ili audit značaja.

## 6. Minimal Semantic Event Envelope

Svaki Semantic Event konceptualno mora imati:

- stabilni `semantic_event_id` i `event_type`;
- `matter_id` ili eksplicitno obrazložen cross-matter/administrative scope;
- target object identity i tačnu revision referencu kada je revision relevantna;
- actor identitet ili jasno označen deterministički system actor;
- authority-context snapshot/reference iz §10;
- purpose i scope;
- `occurred_at`, `known_at` i `recorded_at`, ili eksplicitno `unknown`/`not applicable` gdje je dozvoljeno;
- uzročne/reference veze na proposal, review, approval, decision, conflict, apply attempt/result/receipt ili recovery osnov kada postoje;
- nastale object revisions, relations i state effects, ili eksplicitni dokaz da nijesu nastali;
- correction, supersession ili reconciliation vezu ako event naknadno kvalifikuje raniji event;
- provenance i recorder odgovornost dovoljnu za ljudski čitljiv audit.

Ovo je konceptualni minimum, ne serialization schema. Nepoznata vrijednost se ne izmišlja. Nepoznat `occurred_at` ne sprečava evidentiranje poznatih `known_at` i `recorded_at`.

## 7. Semantic Event Classes

| Klasa | Semantički dokaz | Tipične reference |
|---|---|---|
| `PROPOSAL_EVENT` | prijedlog je nastao ili je materijalno revidiran | Change Set/Item revision, generator, basis |
| `REVIEW_EVENT` | određena revizija je pregledana za određenu namjenu | Review Record, reviewer, scope |
| `APPROVAL_EVENT` | authority je odobrio content-bound scope | approval record, tačna revision |
| `REJECTION_EVENT` | authority je odbio target/revision za scope | Review Record, razlog |
| `DECISION_EVENT` | ovlašćeni akter je donio evidentiranu odluku | Decision Request/outcome |
| `CONFLICT_DISPOSITION_EVENT` | konflikt je dobio scope-specific disposition | Conflict Record, evidence, rationale |
| `APPLY_ATTEMPT_EVENT` | Controlled Apply je započet nad tačnim planom/baseline-om | attempt ID, expected state, authority |
| `APPLY_RESULT_EVENT` | utvrđen je item/group rezultat pokušaja | VLA-0D result, actual diff, receipt |
| `STATE_EFFECT_EVENT` | dokazivi semantic state effect je nastao, prestao ili aktiviran | resulting revisions/memberships/effective interval |
| `PROJECTION_GENERATION_EVENT` | projekcija/snapshot je generisan iz navedenih inputa i rules | input refs, rules version, validation |
| `PROJECTION_INVALIDATION_EVENT` | projekcija ili dio nje više nije pouzdano current | target/scope, razlog, relevantno vrijeme |
| `RECOVERY_EVENT` | izvršena je semantička provjera nejasnog ishoda | ambiguous attempt, evidence, outcome |
| `RECONCILIATION_EVENT` | razlika autoritativnih zapisa i expected state-a je razriješena | oba opažena stanja, authority, rezultat |

Katalog je minimalni zajednički vocabulary. Object-specific događaj smije biti uži podtip samo ako ne uvodi sinonim i čuva obaveznu semantiku roditeljske klase.

## 8. Immutability, Correction and Supersession

Historical Semantic Event se ne prepisuje zato što je bio pogrešan, nepotpun ili zasnovan na kasnije opovrgnutom razumijevanju. Ispravka nastaje novim corrective/superseding eventom, disposition-om, object revision-om ili reconciliation događajem, prema prirodi promjene.

Novi event mora referencirati šta koriguje, razlog, actor/authority, vrijeme saznanja i evidentiranja i downstream scope. Original ostaje čitljiv sa tadašnjim sadržajem. `VOIDED` iz VLA-0A može označiti proceduralno nevažeći zapis, ali ne fizički ukloniti događaj niti tvrditi da se nije desio.

## 9. Temporal Axes

| Osa | Precizno značenje | Primjenjivost |
|---|---|---|
| `occurred_at` | kada se spoljašnji ili semantički događaj stvarno desio prema trenutno evidentiranoj tvrdnji; može biti nepoznat ili interval | source događaj, radnja, odluka, opažanje |
| `known_at` | najraniji evidencijski podržan trenutak kada je informacija postala dostupna unutar relevantnog DOSSARA/kancelarijskog informacionog scope-a; ne dokazuje da ju je određeni čovjek pročitao, razumio ili subjektivno znao | knowledge reconstruction |
| `recorded_at` | kada je autoritativni zapis trajno evidentiran u DOSSARI | svaki autoritativni event/record |
| `proposed_at` | kada je konkretna proposal revision ponuđena na razmatranje | proposal |
| `reviewed_at` | najbolje dokazano vrijeme kada je konkretni review rezultat stvarno završen/dostignut; nije vrijeme kada je rezultat samo naknadno evidentiran | review |
| `approved_at` | kada je authority odobrio tačnu revision/scope/purpose | approval |
| `attempted_at` | kada je konkretni Controlled Apply pokušaj započet | apply attempt |
| `applied_at` | najbolje dokazano vrijeme kada je uspješni apply effect stvarno uspostavljen; nije vrijeme kada je rezultat samo naknadno otkriven ili evidentiran | successful apply evidence prema VLA-0D |
| `effective_at` | jedan trenutak od kojeg relevantni sadržaj ili state effect važi; shorthand kada nije potreban interval | temporal state |
| `effective_from` | uključiva donja granica perioda dejstva | intervalno dejstvo |
| `effective_to` | isključiva gornja granica perioda dejstva, ako postoji; otvoren kraj znači da nije poznat prestanak | intervalno dejstvo |

Ni objekat ni event ne moraju imati sva polja. Posebna vremena moraju odgovarati događaju koji tvrde da mjere; ne popunjavaju se kopiranjem `recorded_at` bez dokaza. Ako stvarni `reviewed_at` ili `applied_at` nije dokaziv, ostaje `unknown` ili dokazivi interval. Kasniji recovery smije navesti raniji `applied_at` samo kada dokaz podržava taj raniji trenutak; inače `applied_at` ostaje nepoznat/interval, dok recovery event čuva sopstvene kasnije `known_at` i `recorded_at`.

Dostupnost informacije kancelariji, mailbox-u, intake sistemu ili DOSSARI sama po sebi ne dokazuje da ju je određeni advokat pročitao, razumio ili subjektivno znao. Tvrdnja o individualnoj ljudskoj awareness zahtijeva sopstveni dokaz, event ili record kada je pravno ili operativno relevantna; ovaj WP ne uvodi user-awareness subsystem.

**Normative separations:**

- `occurred_at ≠ known_at`;
- `known_at ≠ recorded_at`;
- `recorded_at ≠ effective_at`;
- `approved_at ≠ applied_at`;
- `applied_at` nije nužno `effective_at`.

Jednake vrijednosti su dozvoljene kada se događaji stvarno podudaraju, ali jednak timestamp ne spaja njihova značenja.

## 10. Authority at Event Time

Event mora sačuvati dovoljno konteksta da se kasnije utvrdi: ko je djelovao; deklarisana uloga/capacity; svrha; matter/target/scope; authority basis ili policy reference; relevantni action time; ko/šta je authority provjerio; rezultat provjere i poznata ograničenja.

Authority se procjenjuje za vrijeme relevantne radnje — npr. `reviewed_at`, `approved_at` ili `attempted_at` — a ne prema današnjoj ulozi aktera. Kasnija promjena role/policy-ja ne prepisuje istorijski nalaz. Ako naknadna provjera pokaže da authority nije bio validan, nastaje novi corrective/reconciliation event i zaštitni state effect; originalna radnja ostaje u istoriji.

Ovaj WP ne definiše kancelarijske role, RBAC, authentication ili ACL.

## 11. Knowledge Time and Effective Time

### 11.1 As-known-at reconstruction

Odgovara na: **šta je do relevantnih cut-off-a bilo dokazivo informaciono dostupno DOSSARI/kancelariji i evidentirano, sa review/authority stanjem koje je tada postojalo?** Shorthand `as-known-at(T)` znači `Tk = T` i `Tr = T`, gdje je `Tk` knowledge cut-off, a `Tr` recorded cut-off. Puni upit `as-known-at(Tk, Tr)` smije ih razdvojiti kada je to obrazloženo. Koristi samo evente i autoritativne zapise čiji su zasebni `known_at ≤ Tk` i `recorded_at ≤ Tr` uslovi zadovoljeni, bez kasnije nastalih reviewa, correction-a ili disposition-a.

### 11.2 As-effective-at reconstruction

Odgovara na: **šta prema autoritativno prihvaćenim podacima iz izabranih knowledge i recorded cut-off-a važi ili je važilo u efektivnom trenutku `Te`?** Puni oblik je `as-effective-at(Te, Tk, Tr)` i filtrira prihvatljive revizije/state effects prema `effective_at` ili `[effective_from, effective_to)` i pravilima purpose/scope-a.

Shorthand `as-effective-at(Te, Tk)` podrazumijeva samo `Tr = Tk`; to je default, ne spajanje osa. Puni historical reconstruction mora dozvoliti `Tk ≠ Tr` kada je obrazloženo. Podrazumijevani današnji pogled može koristiti `Tk = Tr = now`, ali to mora biti jasno.

**Normative example:** dokaz informaciono dostupan 20. avgusta i evidentiran 21. avgusta može, nakon review/apply-ja, podržati činjenicu efektivnu od 1. juna. `as-effective-at(1. jun, Tk poslije 20. avgusta, Tr poslije 21. avgusta)` može je prikazati. `as-known-at(5. jun)` i `as-effective-at(1. jun, Tk = 5. jun, Tr = 5. jun)` ne smiju je prikazati kao tada dostupnu ili evidentiranu.

## 12. Late Discovery and Retroactive Correction

Late-discovered evidence dobija stvarni `known_at` i `recorded_at`, dok source/assertion može navesti raniji `occurred_at` ili, nakon potrebnog review/approval/apply-ja, raniji `effective_from`. Retroaktivna factual correction ili legal effect:

1. ne mijenja stari event ili revision;
2. stvara novi source/evidence/assertion/review/change/apply trag prema A–D;
3. navodi retroaktivni effective scope i authority basis;
4. označava pogođene projekcije i downstream outpute za purpose-aware impact procjenu;
5. čuva oba pogleda: šta se danas smatra da je važilo i šta je tada bilo poznato.

Backdating `known_at`, `recorded_at`, review, approval ili apply vremena radi usklađivanja sa ranijim effective datumom je zabranjen.

## 13. Future-effective State

Kada je Change Item odobren i uspješno primijenjen danas, a dejstvo počinje kasnije:

- objekat/revizija i Apply Receipt postoje prije effective datuma;
- item rezultat ostaje VLA-0D `APPLIED_SCHEDULED` i prikazuje `effective_at/effective_from`;
- zapis je autoritativni future-effective input, ali nije positive current Matter State membership prije početka dejstva;
- future-effective prikaz mora razlikovati approved, applied-scheduled, validation/blocking stanje i datum dejstva;
- nastupanjem datuma projekcija uključuje već uspostavljeni effect ako su sve prethodno odobrene temporalne preconditions i dalje zadovoljene;
- samo protok vremena ne zahtijeva novi human approval i ne predstavlja novi Controlled Apply;
- aktiviranje može proizvesti `STATE_EFFECT_EVENT` i projection-generation audit, ali ne novu poslovnu odluku;
- material conflict, withdrawal, supersession, authority condition ili invalidacija prije datuma može blokirati aktiviranje prema postojećim pravilima i zahtijevati novi review/change, ne silent activation.

Scheduler i tehnički trigger nijesu definisani.

## 14. Apply Attempt, Result, Receipt and State Effect

Rekonstrukcija mora čuvati lanac:

`Change Set/Item revision → pre-apply expected state → APPLY_ATTEMPT_EVENT → item/group APPLY_RESULT_EVENT → Apply Receipt → resulting object revisions/relations → STATE_EFFECT_EVENT → regenerated Matter State projection`.

- **Apply Attempt** dokazuje da je određeni actor, sa navedenim apply authority-jem, pokušao Controlled Apply nad određenim planom i baseline-om. Ne dokazuje uspjeh ni failure.
- **Apply Result Event** bilježi dokazivi item/group rezultat iz VLA-0D kataloga.
- **Apply Receipt** je append-only autoritativni audit objekat koji agregira stvarni, ne očekivani ishod i reference; nije sam pokušaj niti zamjena za nastale objekte.
- **State Effect Event** identifikuje šta je stvarno postalo, prestalo ili će postati važeće u Matter State-u; ne izmišlja effect kada receipt kaže blocked, failed ili unknown.

## 15. Unknown Completion and Recovery

Ako je pokušaj počeo, a prekid ostavlja nedokazivo konačno stanje, event/receipt rezultat je VLA-0D `RECOVERY_REQUIRED`. Njegova semantička interpretacija je `UNKNOWN_COMPLETION`: sistem ne tvrdi ni success ni failure, pogođeni scope nije pouzdano current i novi redovni apply/retry je blokiran do provjere.

Semantic recovery ispituje autoritativne zapise, idempotency identity, expected/actual state i nastale revizije. Završni recovery event daje jedan od dokazivih nalaza:

- `RECONCILED_APPLIED` — efekat je dokazivo nastao; novi recovery finding povezuje se sa postojećim zaključnim Apply Receipt-om ili kreira/povezuje dodatni receipt/addendum/finding dozvoljen VLA-0D kada prvobitni pokušaj nije imao zaključni receipt, bez duplikata poslovnog efekta;
- `RECONCILED_NOT_APPLIED` — efekat dokazivo nije nastao; dozvoljava novi pokušaj tek poslije pune revalidation;
- i dalje `RECOVERY_REQUIRED` — dokaz nije dovoljan ili je stanje parcijalno/kontradiktorno.

Ovi nazivi su recovery findings, ne zamjena za item-level katalog VLA-0D. Recovery finding je novi auditabilni zapis: ne smije mutirati, finalizovati prepisivanjem niti zamijeniti već autoritativni append-only Apply Receipt. Originalni ambiguous attempt i svako prethodno receipt stanje ostaju sačuvani. Semantic recovery utvrđuje poslovno značenje stvarnog ishoda; technical persistence recovery uređuje transakciju/fajlove. Ovo poglavlje definiše samo prvo.

## 16. Conflict Disposition History

Rješenje konflikta ne briše konflikt, source scopes, arguments, reviews niti ranije zaštitne efekte. `CONFLICT_DISPOSITION_EVENT` referencira Conflict Record, tačan scope/purpose/time, pregledane evidence/argumente, authority, rationale i nastale revisions/state effects. `RESOLVED` ostaje scope-specific prema VLA-0B. Kasnije ponovno otvaranje ili drugačiji disposition je novi event.

## 17. Projection Semantics

DOSSARA ostaje file-first: autoritativni human-readable objekti/revizije, semantic history/audit zapisi i odbacive projekcije/indeksi mogu koegzistirati. Autoritativni istorijski i event podaci ne smiju postojati samo u SQLite indeksu ili cache-u.

`PROJECTION_GENERATION_EVENT` može dokazati da je rezultat generisan iz navedenih inputa, rules version-a, scope-a i vremena sa određenim validation statusom. Ne dokazuje semantičku istinitost ili potpunost. `PROJECTION_INVALIDATION_EVENT` lokalizuje koji projection/segment/target/purpose više nije pouzdano current i zašto. Projekcija regenerabilna iz autoritativnih podataka nije autoritet samo zato što je aplikacija čita.

Ovaj model ne zahtijeva Event Sourcing: current objektne revizije i human-readable zapisi mogu biti direktni autoritativni zapisi; Semantic Events pružaju audit i rekonstrukcione činjenice, a ne obavezno jedini mehanizam izgradnje stanja. CQRS nije propisan.

## 18. Downstream Provenance and Staleness Basis

Svaki generisani ili pregledani downstream output koji će kasnije biti predmet Work Product arhitekture treba moći referencirati:

- purpose i matter/scope;
- korišćeni Matter State/projection identity, generation time i rules version;
- tačne relevantne object revisions, source/evidence/review i apply osnove;
- knowledge cut-off, recorded cut-off i effective-time parametre;
- generation/review/approval događaje.

Kasniji event može evidentirati `downstream potential impact` od trenutka kada je nova informacija poznata/evidentirana ili novi effect nastao. Material relevance, confirmed invalidation i review-required ostaju odvojeni prema VLA-0D. Retroaktivni `effective_from` ne backdate-uje trenutak kada je output postao poznato potencijalno stale; oba vremena se čuvaju.

## 19. Identity and Cross-reference Boundary

Historical reference mora sadržati stabilni object identity i tačnu revision/content identity kada je sadržaj relevantan. Referenca samo na „latest“ ili current projection nije dovoljna za audit. Kasnija revision ne mijenja target ranijeg reviewa, approval-a, eventa ili Apply Receipt-a. UUID format i fizičko versioniranje ostaju otvoreni.

## 20. Storage-neutral Contract

Ovaj dokument zaključava značenje, obavezne veze i rekonstrukcione rezultate, ne fizičku reprezentaciju. Ista semantika mora biti ostvariva ljudski čitljivim file-first zapisima i odbacivim indeksima. Implementacija smije denormalizovati izvedene current vrijednosti samo ako se mogu provjeriti prema autoritativnim objektima, revizijama i događajima i ako ručne izmjene nijesu tiho prepisane.

## 21. Open Implementation Decisions

- fizički format i raspored event/audit zapisa;
- ID i timestamp format, clock precision i timezone serialization;
- način dokazivanja `known_at` za različite intake kanale;
- projection/reconstruction query API i performance strategija;
- tehnički trigger za future-effective projection refresh;
- authority policy vocabulary i evaluacioni engine;
- recovery journal, atomic write i persistence algoritam.

Nijedna otvorena odluka ne dozvoljava silent history rewrite, gubitak file-first autoriteta, spajanje temporalnih osa ili pretpostavljanje ishoda bez dokaza.
