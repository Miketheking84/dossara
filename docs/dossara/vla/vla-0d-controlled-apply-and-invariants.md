# DOSSARA — WP VLA-0D Controlled Apply and Invariants

## 1. Document Control

| Polje | Vrijednost |
|---|---|
| Dokument | WP VLA-0D — Controlled Apply and Invariants |
| Status | Dokumentacioni nacrt za pregled naručioca |
| Datum | 6. avgust 2026. |
| Normativni baseline | Prihvaćeni VLA-0A, VLA-0B i VLA-0C + prateća VLA-0D arhitektura |
| Formalni kontrolni akt | `docs/dossara/decision-alignment-register-v1.2.md` |
| Vrsta rada | Documentation-only; konceptualni proces bez implementacionog formata |

## 2. Controlled Apply Definition

Controlled Apply je zaseban, auditabilan proces koji nakon review/approval odluka pokušava da odabrane Change Item-e pretvori u autoritativne file-first promjene i provjeren Matter State rezultat. Approval daje dozvolu pod određenim uslovima; Controlled Apply utvrđuje da li su uslovi još ispunjeni i šta je stvarno nastalo.

Apply ne potvrđuje istinitost, pravnu ispravnost niti potpunost projekcije. On potvrđuje samo dokazivi ishod kontrolisanog pokušaja nad određenim input baseline-om.

## 3. Approval-to-Apply Boundary

Odobreni item nije automatski applied. Prelaz je dozvoljen samo kada su istovremeno dokazani:

1. tačan `matter_id`, Change Set revision i Change Item content identity;
2. item-level approval za deklarisani scope/purpose i još važeći authority;
3. apply authority za vrstu operacije;
4. neistekli ili ispunjeni uslovi approval-a;
5. dependency closure svih odabranih itema;
6. zadovoljene preconditions i dozvoljen operation/object-type par;
7. expected target/base state i odsustvo nerazriješenog manual-edit mismatch-a;
8. ponovljena source/evidence, conflict, temporal i semantic validacija;
9. plan redosljeda i semantičkih atomic grupa;
10. plan tehničkog durable upisa, provjere i recovery-ja;
11. potvrda da partial plan ne krši VLA-0A/B/C/D invarijante;
12. rezervisan jedinstveni `apply_attempt_id` i stabilni item apply/idempotency identiteti.

Nedostatak bilo kojeg obaveznog uslova proizvodi lokalizovani validation/pre-apply nalaz `STALE` ili `NOT_ELIGIBLE` i, za item koji je u apply scope-u, konačni item-level rezultat `BLOCKED`. `STALE` i `NOT_ELIGIBLE` nijesu konačni item-level apply rezultati. Sistem ne smije pretvoriti blocker u warning radi nastavka.

## 4. Validation Layers

| Sloj | Provjerava | Blocking primjeri |
|---|---|---|
| structural | identitete, reference, obavezna polja, poznatu revision/rules verziju | missing target; broken reference; duplicate item identity |
| authorization | reviewer, approval i apply authority za matter/scope/purpose | sistem/AI kao authority; pogrešan matter authority |
| review binding | approval vezan za isti content identity, target baseline, purpose i uslove | promijenjen item; approval drugog purpose-a |
| provenance/evidence | potrebne Source/Scope/Evidence i contradicting reference | nedostaje obavezni Evidence Link; shared source context prenesen između matters |
| lifecycle/operation | target lifecycle i dozvoljena operacija | update `VOIDED` verzije kao da je current; nedozvoljen status prelaz |
| staleness/concurrency | base projection, expected target version/hash i manual edits | target promijenjen; expected hash mismatch |
| conflict | material conflict, disposition, scope i purpose | unresolved material conflict za Verified Fact inclusion |
| dependency/ordering | requires, exclusivity, cycles i atomic groups | prerequisite rejected; dvije ekskluzivne grane izabrane |
| temporal | `recorded_at`, `effective_at`, retroactivity i future effect | nevalidan interval; future item planiran kao immediate current |
| semantic/invariant | VLA i Matter State pravila nad projected result-om | assumption u Verified Factual State; action bez assignee-ja kao ready |
| durability/recovery | plan upisa, backup/baseline i mogućnost determinističkog recovery-ja | nedokaziva parcijalna faza; nema načina za verifikaciju rezultata |

Validation nalaz navodi rule id/version, item/target/scope, severity, input reference, vrijeme i razlog. `VALID_WITH_WARNINGS` je apply-eligible samo kada nijedan warning nije blocker prema primjenjivom pravilu i authority ga ne mora posebno razriješiti.

## 5. Apply Plan and Selection

Apply plan bira samo approved iteme. Selekcija mora biti dependency-closed: uključuje sve potrebne approved prerequisites ili dokazuje da je željeni prerequisite rezultat već prisutan istim poslovnim identitetom. Plan izričito navodi:

- iteme i content identity;
- expected target/base state;
- ordering i atomic groups;
- planirane autoritativne zapise/relacije i projekcione efekte;
- future-effective iteme;
- invariant checks prije i poslije primjene;
- kriterijume za oba precizna no-op podtipa;
- failure i recovery granice;
- downstream impact/follow-up izlaze.

Apply plan nije novi approval i ne smije proširiti sadržaj itema. Ako je za siguran plan potrebna materijalna izmjena, kreira se nova revizija i novi review.

## 6. Execution Sequence

1. Otvoriti `apply_attempt_id` i evidentirati tačan plan/revision/baseline.
2. Pod Single Writer kontrolom ponovo očitati autoritativne targete i expected state.
3. Izvršiti sve validation slojeve i zamrznuti provjereni input baseline za pokušaj.
4. Klasifikovati već zadovoljene iteme kao kandidate za `NO_OP_ALREADY_APPLIED` ili `NO_OP_ALREADY_SATISFIED`, bez konačnog rezultata prije provjere osnova.
5. Topološki urediti items/atomic groups i potvrditi dependency closure.
6. Pripremiti autoritativne promjene bez objavljivanja nedozvoljenog parcijalnog current stanja.
7. Trajno primijeniti jednu dozvoljenu tehničku commit granicu prema budućem atomic-write/recovery modelu.
8. Ponovo očitati stvarne autoritativne zapise i evidentirati rezultat svakog itema.
9. Regenerisati Matter State projection iz autoritativnih inputa, ne iz proposed effect-a.
10. Izvršiti post-apply invariants i uporediti stvarni sa odobrenim/proposed efektom.
11. Ako je validno, finalizovati Apply Receipt i downstream review/follow-up.
12. Ako nije validno, spriječiti objavu nedozvoljenog stanja, izvršiti deterministički recovery i evidentirati stvarni ishod.

## 7. Ordering and Atomicity

Semantička atomic grupa mora ili u cjelini proizvesti validan autoritativni rezultat ili ne proizvesti nijedan njen poslovni efekat. Nezavisne grupe mogu imati zasebne ishode unutar istog Change Set-a samo ako je partial apply eksplicitno dozvoljen u apply planu/approval uslovima, njihova nezavisnost je validacijom dokazana i Matter State pojedinačno i zbirno ostaje invariant-safe.

Tehnička atomic write operacija je mehanizam trajnosti; semantička atomicity je poslovno/invariant pravilo. Buduća implementacija može koristiti više tehničkih koraka, ali nijedna crash/recovery tačka ne smije ostaviti objavljeno stanje koje predstavlja samo dio semantički nedjeljive grupe.

Ordering mora biti determinističan za isti plan i baseline. Ako graf ima nerazrješiv ciklus, nepoznat redosljed ili dvije konfliktne primjene nad istim targetom, pogođena grupa je blocked. Last-write-wins nije dozvoljeno konfliktno pravilo.

## 8. Partial Apply

Partial apply je dozvoljen samo kada:

- itemi/grupe su semantički nezavisni;
- svi primijenjeni itemi su odobreni;
- dependency closure je zadovoljen;
- nijedna međugrupna precondition nije prekršena;
- svaka commit grupa zasebno i zbirno poštuje Matter State invarijante;
- receipt jasno razlikuje svaki precizni item-level rezultat, uključujući oba no-op podtipa;
- neprimijenjeni itemi ne budu predstavljeni kao approved effect ostvaren u stanju.

Partial apply nije dozvoljen ako bi ostavio dangling relation, create bez obaveznog membership/authority zapisa, supersede bez validne replacement veze, nepotpun conflict disposition, nedozvoljeno Verified Fact članstvo ili bilo koju drugu povredu baseline-a.

Rejection ili staleness prerequisite-a blokira njegove dependente. Nezavisni itemi mogu nastaviti samo ako se ta nezavisnost validacijom dokazuje. Sistem ne smije automatski smanjiti atomic grupu da bi dobio parcijalni uspjeh.

### 8.1 Set-level aggregation

Set-level rezultat izvodi se iz preciznih item-level rezultata definisanih u pratećoj VLA-0D arhitekturi: `APPLIED`, `APPLIED_SCHEDULED`, `NO_OP_ALREADY_APPLIED`, `NO_OP_ALREADY_SATISFIED`, `SKIPPED`, `BLOCKED`, `FAILED` i `RECOVERY_REQUIRED`. Koriste se zbirni rezultati `NOT_APPLIED`, `APPLIED`, `PARTIALLY_APPLIED`, `APPLY_BLOCKED`, `APPLY_FAILED` i `RECOVERY_REQUIRED`, uz vidljivu scheduled-effects karakteristiku kada postoji `APPLIED_SCHEDULED`.

Agregacija mora biti deterministička i rekonstruisiva iz Apply Receipt-a. `RECOVERY_REQUIRED` ima prioritet dok stanje nije potvrđeno. `BLOCKED` nije `FAILED`; `SKIPPED` nije rejected, withdrawn ili blocked. `NO_OP_ALREADY_APPLIED` završava idempotent retry istog itema, dok `NO_OP_ALREADY_SATISFIED` može završiti item samo uz eksplicitno potvrđenu semantičku ekvivalentnost i nikada ne postaje dokaz da je taj item ranije primijenjen. `APPLIED_SCHEDULED` je uspješan apply, ne current efekat. Atomic grupa se agregira kao cjelina kada ne dozvoljava item-level parcijalni ishod. Nijedan zbirni rezultat ne sakriva pojedinačne rezultate niti uključuje rejected, withdrawn, deferred, neodobrene ili van-scope iteme kao primijenjene.

## 9. Idempotency and Retry

Svaki Change Item ima stabilni poslovni apply identitet izveden iz item identity, revision content identity, matter, operation, target/scope i odobrenog efekta. Svaki pokušaj ima novi `apply_attempt_id`, ali koristi isti idempotency identitet kada je zaista retry istog odobrenog poslovnog efekta.

| Situacija | Rezultat |
|---|---|
| nema dokaza ranijeg commit-a | pokušaj može nastaviti nakon potpune revalidation |
| durable receipt kaže applied i stanje potvrđuje efekat | retry vraća `NO_OP_ALREADY_APPLIED`; ne ponavlja promjenu |
| receipt nije finalan, ali autoritativno stanje dokazivo sadrži isti efekat | recovery finalizuje/vezuje stvarni rezultat; nema duplikata |
| željeno stanje postoji iz drugog validnog poslovnog uzroka | `NO_OP_ALREADY_SATISFIED` uz referencu; ne prisvaja tuđi audit osnov |
| stanje je samo djelimično ili kontradiktorno | `RECOVERY_REQUIRED`; nema novog apply-ja |
| sadržaj, target ili poslovna namjera promijenjeni | nije retry; nova revision/Change Set i novi review |

Create, relation i membership operacije moraju imati način prepoznavanja poslovnog duplikata. Oba precizna no-op podtipa su stvarni apply ishodi, ne prećutno proglašen uspjeh; receipt navodi zašto nije bilo novog upisa i čiji poslovni osnov postoji.

## 10. Failure and Recovery Semantics

Technical recovery vraća sistem u jedno od dokazivih dozvoljenih stanja: commit nije nastao; cijela semantička grupa je committed i validna; ili sistem je eksplicitno `RECOVERY_REQUIRED` i pogođeni scope nije predstavljen kao pouzdano current. Recovery ne donosi novu poslovnu odluku.

Semantic rollback je nova poslovna promjena koja poništava ili supersede-uje ranije uspješan efekat. Zahtijeva novi Change Item, authority, review i apply; ne smije brisati originalni receipt ili istoriju.

| Failure tačka | Dozvoljeni ishod | Zabranjeno |
|---|---|---|
| prije durable upisa | item `FAILED`, set `APPLY_FAILED`; autoritativno stanje dokazivo nepromijenjeno | receipt tvrdi applied |
| tokom pripreme | odbaciti staging/pripremu; audit pokušaja | objaviti pripremljen parcijalni state |
| nejasno nakon prekida | recovery provjerava durable zapise/idempotency prije retry-ja | slijepi ponovljeni create/link |
| tehnički commit potpun, receipt nedovršen | rekonstruisati stvarni receipt iz durable osnove | ponoviti poslovni efekat |
| post-apply projection invalid | lokalizovati scope, zaustaviti current objavu, recovery prema commit granici | proglasiti proposed projection current |
| invariant failure unutar atomic grupe | nema parcijalnog poslovnog efekta ili recovery do pre-apply baseline-a | ostaviti polovinu grupe |
| independent grupa uspješna, druga nije | prva ostaje samo ako partial apply dozvoljen i zbirno validan; receipt razdvaja | set označiti fully applied |
| manual edit otkriven | protective block, reconciliation i failure/no attempt | overwrite ručne izmjene |

## 11. Apply Receipt

Apply Receipt je append-only autoritativni audit objekat o pokušaju i stvarnom ishodu. Ne zamjenjuje promijenjene autoritativne objekte, Review Records niti Matter State projection.

Za svaki item ili semantic atomic group minimalno evidentira:

- `change_set_id`, Change Set `revision_id`, `change_item_id`, Change Item revision/content identity, matter i rules version;
- approval referencu, actor/apply authority, target referencu i provjeren expected/base-state;
- `apply_attempt_id` i item-level idempotency/apply identitet;
- `attempted_at`, `recorded_at`, vrijeme završetka, `applied_at` kada postoji i `effective_at` kada postoji;
- ordering i semantic atomic group identitet;
- proposed effect sažetak, prethodni relevantni autoritativni state i stvarno nastali state ili potvrđeni precizni no-op podtip;
- precizan item-level rezultat: `APPLIED`, `APPLIED_SCHEDULED`, `NO_OP_ALREADY_APPLIED`, `NO_OP_ALREADY_SATISFIED`, `SKIPPED`, `BLOCKED`, `FAILED` ili `RECOVERY_REQUIRED`;
- za `NO_OP_ALREADY_APPLIED`, referencu na raniji uspješni Apply Receipt/item rezultat; za `NO_OP_ALREADY_SATISFIED`, osnov postojećeg state-a i rezultat provjere semantičke ekvivalentnosti;
- skip razlog; ili blocking razlog, rule/validation referencu, affected scope i uslov deblokiranja; ili failure fazu i razlog;
- nastale object/version/relation/audit reference i sačuvane prethodne verzije;
- recovery status i reference kada postoje;
- downstream potential impact, confirmed invalidation, review-required, recommended-follow-up i mandatory-follow-up rezultate;
- projection regeneration identity/rezultat, stvarni diff i post-apply invariant rezultat.

Generički `NO_OP` nije dozvoljen kao konačni receipt rezultat; mora se navesti precizni podtip. Receipt ne smije popuniti expected rezultat kao actual. Ako stvarni rezultat nije dokaziv, rezultat mora biti `RECOVERY_REQUIRED`, uz opis nepoznatog aspekta, a pogođeni scope ne smije biti predstavljen kao uredno applied.

## 12. Projection Regeneration and Verification

Matter State se poslije commit-a regeneriše iz kompletnog autoritativnog inputa i primjenjivih rules, uključujući stvarne apply rezultate, Review Records, decisions, conflicts, lifecycle i source/evidence zapise. Proposed/approved efekat služi za poređenje, ne kao projekcioni autoritet.

Za svaki item provjerava se:

1. da li je očekivani autoritativni object/version/relation nastao ili uklonjen;
2. da li je istorijska verzija i supersession/withdrawal veza sačuvana;
3. da li je projected segment/membership tačan za purpose i vrijeme;
4. da li protective conflict/stale efekti ostaju vidljivi;
5. da li future-effective rezultat nije current prije vremena;
6. da li downstream impact odgovara stvarnim promjenama;
7. da li rebuild sa istim inputima/rules daje isti semantički rezultat.

Snapshot generation ili uspješan rebuild ne dokazuju semantičku istinitost. Oni dokazuju samo da je projekcija proizvedena i, kada je validna, konzistentna sa pravilima i inputima.

## 13. Normative Invariants

1. Nijedan Change Set ne mijenja autoritativno stanje samim nastankom.
2. Nijedan Change Item bez važećeg item-level approval-a ne smije biti primijenjen.
3. Approval i apply moraju ostati zasebno dokazivi događaji.
4. Materijalno promijenjen Change Item ne zadržava automatski raniji approval.
5. Apply nad materijalno promijenjenim target/baseline stanjem zahtijeva novu validaciju i, kada utiče na odluku, novi review.
6. Supersede, unlink, removal ili corrective promjena ne smiju izbrisati prethodnu vrijednost, članstvo, relaciju ili audit istoriju; withdrawal važi samo za još neprimijenjeni prijedlog, sprečava njegov budući apply i ne može poništiti uspješno primijenjeni efekat, koji se mijenja samo novim odobrenim Change Item-om, Controlled Apply-em i Apply Receipt-om.
7. Partial apply ne smije prekršiti Matter State niti druge VLA invarijante.
8. Rejected item i item povučen prije uspješnog apply-ja ne smiju proizvesti positive current Matter State efekat; withdrawal djeljivog djelimično primijenjenog prijedloga obuhvata samo neprimijenjeni dio i ne smije prekršiti dependencies, atomicity ili invariants.
9. Retry istog poslovnog apply identiteta ne smije proizvesti duplikat; `NO_OP_ALREADY_APPLIED` mora referencirati isti raniji apply, dok `NO_OP_ALREADY_SATISFIED` čuva različit poslovni osnov i ne smije spojiti različite odluke zbog jednakog površinskog efekta.
10. Proposed, approved, attempted i applied efekti moraju biti odvojeno prikazani.
11. `APPLIED_SCHEDULED` dokazuje uspješno uspostavljen future-effective zapis, ali nije current efekat prije `effective_at` i ne smije biti prikazan kao pending ili immediate apply.
12. Apply Receipt mora item-level preciznim i rekonstruisivim katalogom odražavati stvarni, a ne namjeravani rezultat, uključujući razloge za skipped, blocked, failed i recovery stanje.
13. Sistem ne smije tiho riješiti konflikt izborom jedne vrijednosti ili last-write-wins pravilom.
14. Downstream potential impact nije confirmed invalidation; invalidation zahtijeva rule/authority basis i precizan target/scope/purpose/effective time, review required ostaje zaseban, a recommended follow-up ne smije biti prikazan kao mandatory follow-up Change Set bez normativnog osnova.
15. Failed apply ne smije ostaviti objavljeno nedozvoljeno parcijalno stanje.
16. Projection/snapshot generation ne dokazuje semantičku istinitost ili potpunost.
17. Change Set revision ne smije retroaktivno promijeniti review/apply događaje starije revizije.
18. Set-level apply status mora biti deterministički rekonstruisiv iz item-level rezultata, nikad ih ne smije sakriti, a `RECOVERY_REQUIRED` ima prioritet dok završno autoritativno stanje nije pouzdano potvrđeno.
19. Source provenance, evidence scope i authority odluke moraju ostati povezivi sa svakim applied rezultatom.
20. Brisanje audit traga nije dozvoljeni withdrawal, rejection, rollback ili recovery.
21. Apply authority ne smije se izvesti samo iz review ili approval authority-ja.
22. Set-level approval ne obuhvata item koji nije eksplicitno naveden i content-bound.
23. Validation success nije approval, a approval nije garancija tehničkog ili semantičkog uspjeha.
24. Stale item se ne smije primijeniti zato što je cijeli set ranije odobren.
25. Dependency nije zadovoljen samo zato što je prerequisite odobren; mora biti applied ili dokazivo već prisutan.
26. Atomic grupa ne smije biti smanjena ili parcijalno primijenjena bez nove revision/review odluke.
27. No-op mora biti dokaziv i auditabilan preciznim `NO_OP_ALREADY_APPLIED` ili `NO_OP_ALREADY_SATISFIED` podtipom; generički no-op ne smije sakriti različit poslovni osnov, failure ili nepoznat rezultat.
28. Technical recovery ne smije poništiti validan poslovni efekat bez dokaza niti donositi novu poslovnu odluku.
29. Uklanjanje, deaktiviranje, korekcija ili supersede uspješno primijenjenog efekta je novi corrective/superseding Change Item sa novim proposal basis-om, reviewom, approval-om, Controlled Apply-em i receipt-om, ne withdrawal ili izmjena originalnog receipt-a.
30. Manual edit ili expected-state mismatch mora zaustaviti pogođeni write do reconciliation-a.
31. Change Set jednog matter-a ne smije mijenjati drugi matter niti prenijeti njegov review/evidence/access kontekst.
32. Conflict disposition važi samo za navedeni conflict, scope, purpose i authority.
33. Decision outcome može odmah postati autoritativni projection input, ali ne stvara automatski downstream Legal Action ili članstvo.
34. Protective warning/blocking/suspension effect ne smije biti pogrešno evidentiran kao positive apply niti čekati positive apply kada ga baseline zahtijeva odmah.
35. Applied Legal Action bez assignee-ja ne smije biti prikazana kao operationally ready.
36. State-as-recorded-at-T ne smije koristiti kasnije recorded retroaktivni Change Set ili apply događaj.

## 14. Failure Matrix

| Uslov | Item rezultat | Set/apply rezultat | Required action |
|---|---|---|---|
| item nije approved | `BLOCKED` ili van apply scope-a, prema razlogu | `APPLY_BLOCKED` ako nijedan relevantni item ne može nastaviti | review ili izostaviti item; ne prikazati ga kao applied |
| approval vezan za staru revision | `BLOCKED`, razlog stale approval binding | `APPLY_BLOCKED` ili `PARTIALLY_APPLIED` samo van dependency closure-a | nova revision/review |
| target version mismatch, nematerijalan | `BLOCKED` dok revalidation nije završena | `APPLY_BLOCKED` dok nalaz nije evidentiran | eksplicitni non-material finding |
| target version mismatch, materijalan | `BLOCKED`, razlog stale target | `APPLY_BLOCKED` ili invariant-safe `PARTIALLY_APPLIED` za nezavisne grupe | rebase/reconstruct i review |
| unresolved material conflict | `BLOCKED` za scope | `APPLY_BLOCKED` ili invariant-safe `PARTIALLY_APPLIED` ako je izolovan | authority disposition ili izmjena prijedloga |
| prerequisite rejected | `BLOCKED`, razlog dependency | `APPLY_BLOCKED` ili invariant-safe `PARTIALLY_APPLIED` za nepovezane grupe | novi plan/revision |
| mutual exclusivity prekršena | oba itema `BLOCKED` | `APPLY_BLOCKED` | authority izbor + novi validan plan |
| desired result već applied istim id | `NO_OP_ALREADY_APPLIED` | completion istog itema bez novog efekta | receipt veza na raniji uspjeh |
| desired result postoji drugim osnovom | `NO_OP_ALREADY_SATISFIED` | completion samo uz potvrđenu ekvivalentnost | ne prisvajati raniji osnov; dodatni review po potrebi |
| failure prije autoritativne mutacije | `FAILED` | `APPLY_FAILED` | navesti failure fazu; siguran retry poslije revalidation |
| failure tokom transakcije ili nakon djelimičnog tehničkog zapisa | `FAILED` ili `RECOVERY_REQUIRED` prema dokazivosti | `RECOVERY_REQUIRED` ako završno stanje nije pouzdano | recovery prije redovnog apply-ja |
| nejasna crash tačka | `RECOVERY_REQUIRED` | `RECOVERY_REQUIRED` | utvrditi durable stanje prije retry-ja |
| failure tokom projection regeneration | `FAILED` ako autoritativno stanje i recovery ishod jesu dokazivi; inače `RECOVERY_REQUIRED` | `APPLY_FAILED` ili prioritetni `RECOVERY_REQUIRED` | ne objaviti nepouzdanu projekciju |
| failure tokom post-apply invariant provjere | `FAILED` ili `RECOVERY_REQUIRED` prema dokazivosti | nema current objave; `RECOVERY_REQUIRED` ima prioritet | recovery i audit |
| projection validan, actual diff drugačiji | `FAILED` ili `RECOVERY_REQUIRED` prema dokazivosti | `APPLY_FAILED`, invariant-safe `PARTIALLY_APPLIED` ili prioritetni `RECOVERY_REQUIRED` | receipt actual diff + follow-up |
| future-effective apply validan | `APPLIED_SCHEDULED` | applied, ne current | temporalni projection trigger |

## 15. Conceptual Acceptance Tests

| Test | Očekivani rezultat |
|---|---|
| kreiranje Change Set-a | nema promjene autoritativnog Matter State-a |
| set approved, jedan item eksplicitno izuzet | izuzeti item nije approved niti apply-eligible |
| item approved pa mu se promijeni proposed value | stari approval ne važi za novu revision |
| unrelated base change nakon approval-a | apply tek nakon evidentirane item-level non-material revalidation |
| target value promijenjena nakon reviewa | stale; nema silent apply-ja |
| tri itema, jedan rejected prerequisite | prerequisite i dependenti nijesu applied; nezavisni može biti applied ako validan |
| dva `ATOMIC_WITH` itema, drugi fail | nijedan poslovni efekat grupe nije current |
| retry poslije potvrđenog commit-a | `NO_OP_ALREADY_APPLIED`; nema duplikata; referenca na raniji receipt i novi attempt ostaju u auditu |
| crash poslije commit-a, prije finalnog receipta | recovery prepoznaje durable efekat i finalizuje receipt bez ponovnog apply-ja |
| create target već postoji iz drugog ili nedokazanog poslovnog osnova | `NO_OP_ALREADY_SATISFIED`; nema duplikata ni spajanja poslovnih odluka; osnov i ekvivalentnost su evidentirani |
| conflict samo za client-facing purpose | taj purpose blocked; nezavisni interni scope prema svojim pravilima ostaje moguć |
| system/AI pokušava approve/apply authority | validation blokira |
| Source Item shared u dva matters | Change Set/apply/review/evidence ostaju matter-specific |
| supersede Verified Fact membership | stara verzija i interval ostaju; nova ulazi samo uz zasebnu eligibility/review/apply osnovu |
| decision-only set | odluka vidljiva odmah kao projection input; Legal Action nije automatski kreirana |
| future-effective approved/applied item | receipt kaže scheduled; current projection ga ne uključuje prije `effective_at` |
| retroaktivna korekcija | current recorded time ostaje; raniji effective time vidljiv; zavisni objekti označeni za review |
| partial apply dvije nezavisne grupe | receipt precizno razdvaja uspješnu i neuspješnu; set nije fully applied |
| manual file edit prije apply-ja | protective block; write zaustavljen; nema overwrite-a |
| regenerated projection odstupa od proposed effect-a | receipt bilježi stvarni diff; proposed effect se ne prikazuje kao applied |
| snapshot uspješno generisan | ne koristi se kao dokaz semantičke istinitosti |
| semantic rollback tražen poslije uspješnog apply-ja | zahtijeva novi Change Set; stari receipt ostaje |

## 16. Acceptance Recommendation Gate

Preporuka `GO` za VLA-0D moguća je samo ako pregled potvrdi da:

- Change Set, Change Item, Matter State, review, approval, apply i receipt ostaju odvojeni;
- statusi nijesu spojeni u jednu osu;
- staleness, target version, dependencies, partial apply i atomicity imaju lokalizovana pravila;
- idempotency/retry/recovery ne mogu duplicirati ili sakriti poslovni efekat;
- source, evidence, authority, conflict i temporal traceability ostaju očuvani;
- downstream re-review je eksplicitan;
- svih 36 invariants je prihvatljivo i nema kontradikcije sa VLA-0A/B/C;
- nijedan implementacioni detalj nije neovlašćeno zaključan.

## 17. Open Decisions

- fizički Apply Receipt i recovery-journal format;
- tehnička commit granica za više file-first zapisa;
- konkretni idempotency key i expected-state/hash format;
- authority i materiality matrice;
- pravila za automatsko temporalno aktiviranje future-effective apply-ja;
- maksimalne granice Change Set-a i UI batching;
- detaljni rollback/correction operation katalog po object type-u;
- observability i tehnički log bez klijentskog sadržaja.

Nijedno otvoreno pitanje ne dozvoljava silent overwrite, auto-approval, auto-decision, neodobren apply ili gubitak istorije.
