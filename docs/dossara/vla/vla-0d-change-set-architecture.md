# DOSSARA — WP VLA-0D Change Set Architecture

## 1. Document Control

| Polje | Vrijednost |
|---|---|
| Dokument | WP VLA-0D — Change Set Architecture |
| Status | Dokumentacioni nacrt za pregled naručioca |
| Datum | 6. avgust 2026. |
| Normativni baseline | Prihvaćeni VLA-0A, VLA-0B i VLA-0C |
| Formalni kontrolni akt | `docs/dossara/decision-alignment-register-v1.2.md` |
| Vrsta rada | Documentation-only; bez šeme, storage formata ili runtime implementacije |

## 2. Purpose and Boundary

Change Set je identifikovan, verzionisan i auditabilan paket predloženih promjena za jedan predmet. On opisuje šta bi se promijenilo, na kojoj osnovi, prema kojem baznom stanju, uz koje odluke, zavisnosti i moguće posljedice. Njegov nastanak, validacija ili review ne mijenjaju autoritativne zapise niti Matter State.

**Normative:** Novi input prvo može proizvesti Change Set i Change Item prijedloge. Pozitivna promjena autoritativnog stanja nastaje isključivo kroz odobreni Change Item i uspješni Controlled Apply. Trajno uklanjanje ili zamjena takođe zahtijeva auditabilan apply osnov. Zaštitni warning/blocking/suspension efekti iz VLA-0C ostaju neposredni kada postoji autoritativni konflikt, integrity problem, manual edit, stale/incomplete input ili terminalni lifecycle događaj; oni nijesu prećutni trajni apply.

Change Set nije Matter State, Source Item, Evidence Link, assertion, dokaz, odluka, Review Record, izvršena Legal Action, generički log, UI formular niti dozvola za automatsku promjenu. Projekcija ostaje izvedena; Change Set i njegovi audit zapisi ostaju autoritativni file-first inputi samo za ono što stvarno evidentiraju.

## 3. Scope and Out of Scope

Ovaj WP definiše identitet, revizije, Change Item operacije, statusne ose, review i decision pravila, dependencies, staleness, konflikte, temporalnost, downstream impact i konceptualne tokove.

Van scope-a su TypeScript, UI, baza, JSON Schema, migrations, fizički event format, file locking, atomic-write kod, recovery implementacija, AI/LLM, OCR, ingestion, cloud, multi-user collaboration, konkretni ekran i potpuni Event Log. VLA-0E nije započet.

## 4. Baseline Alignment and Locked Terms

VLA-0D preuzima sljedeća pravila bez redefinisanja:

- Object Type, Assertion Kind, Trust, Review, Lifecycle, Operational, Decision i Authority su odvojene ose.
- `ACCEPTED` je purpose-aware review konkretne verzije; nije istina, approval Change Item-a niti apply.
- `CONFIRMED_FROM_SOURCE` nije Verified Fact; `SUPPORTS` ne mijenja trust automatski.
- Review Record je autoritativan, append-only i vezan za target/version/purpose/authority.
- Source Item, Source Content Version, Source Representation, Source Scope, Evidence Link, Source Relation, integrity i conflict disposition ostaju prema VLA-0B.
- Verified Fact nije object type. Samo eligible `MATTER_ASSERTION` + `FACTUAL_CLAIM` može ući u Verified Factual State nakon odgovarajućeg reviewa i uspješnog apply-ja.
- Matter State je obnovljiva projekcija; snapshot i indeks nijesu autoritet.
- Odluka/disposition je projection input čim je autoritativno evidentirana, ali ne stvara automatski downstream članstvo ili Legal Action.
- Sistem i AI mogu predložiti, ali nijesu finalni review, decision ili apply authority.
- File-first, Single Writer, expected-state kontrola, atomic write, recovery, no-silent-overwrite i istorijska vidljivost ostaju obavezni.

Nije pronađena kontradikcija sa VLA-0A, VLA-0B ili VLA-0C koja onemogućava ovaj model.

## 5. Change Set Identity and Revision

### 5.1 Identity

Jedan Change Set pripada tačno jednom `matter_id`. Dijeljeni Source Item može biti input za Change Set-ove različitih predmeta, ali Change Set, review, authority, Evidence Link i apply rezultat ne prenose se između predmeta.

Minimalni konceptualni identitet obuhvata:

- stabilni `change_set_id`;
- `matter_id`;
- poslovnu svrhu i deklarisani purpose/scope;
- `proposer` i `generator_type`, bez dodjele authority-ja generatoru;
- `proposed_at`, `recorded_at` i porijeklo/input reference;
- base projection referencu: matter, projection/rules version, generation time i provjerljiv input baseline;
- listu obuhvaćenih target scope-ova i Change Item identiteta;
- trenutni revision identitet i veze sa prethodnom/narednom revizijom.

Change Set granica treba da okuplja koherentnu poslovnu namjeru koju reviewer može razumjeti i čije dependencies mogu biti eksplicitno provjerene. Ne smije spajati različite matters. Veliki paket se dijeli kada bi zajednički review sakrio nezavisne odluke, različite authorities ili nesrodne failure granice.

### 5.2 Revision

`change_set_id` označava kontinuitet prijedloga; `revision_id` označava nepromjenjivi sadržaj pregledane verzije. Svaka materijalna promjena sadržaja stvara novu reviziju sa diff-om, razlogom, autorom i vremenom. Stara revizija i njeni review/apply događaji ostaju čitljivi.

Materijalna promjena uključuje target, operaciju, before/after, provenance, scope, purpose, effective time, dependency, precondition, expected impact ili authority zahtjev. Čisto prezentaciona korekcija može biti nematerijalna samo ako ne mijenja značenje i ako je evidentirana. Nijedna izmjena ne prepisuje već pregledanu reviziju.

Nova revizija ne nasljeđuje approval izmijenjenih itema. Neizmijenjeni item može zadržati prethodnu odluku samo ako su njegov content identity, target baseline, purpose, dependencies, authority i impact nepromijenjeni i revalidation to eksplicitno potvrdi; inače je potreban novi review. Superseding Change Set ima novi `change_set_id` i eksplicitnu vezu ka zamijenjenom paketu.

## 6. Change Item Model

Change Item je najmanja pojedinačno razumljiva predložena operacija. Ima stabilni `change_item_id` unutar Change Set kontinuiteta i revision-bound sadržaj.

Svaki item mora opisati:

| Grupa | Obavezni konceptualni sadržaj |
|---|---|
| Target | target object type; target id/version ili precizni target scope; matter i purpose |
| Operation | imenovana operacija dozvoljena za taj object type; semantička atomicity grupa ako postoji |
| Before | očekivana prethodna vrijednost, relacija ili odsustvo; verzija/hash/baseline dovoljan za detekciju staleness-a |
| Proposed | nova vrijednost, relacija, status, članstvo ili eksplicitno uklanjanje |
| Basis | razlog; proposer/generator; Source Item/Scope/Evidence Link, assertion, decision, Review Record ili drugi provenance |
| Challenge | supporting i contradicting reference; otvoreni conflict/disposition; ograničenja |
| Control | trust/review/decision/apply authority zahtjevi; preconditions; validation pravila |
| Coordination | dependencies, ordering, mutually-exclusive veze i atomicity group |
| Consequence | direct effect, projected downstream impact, re-review/follow-up prijedlozi i effective time |
| Outcomes | append-only validation, review decision i apply result reference; nijedan se ne izvodi iz namjere |

Before i Proposed moraju biti dovoljno precizni da reviewer vidi razliku. Kada nema postojećeg target objekta, Before eksplicitno navodi očekivano odsustvo. Kada se mijenja članstvo ili relacija, obje strane i scope su navedeni.

## 7. Operation Families

Operacije su object-type specific; njihovo postojanje u ovoj listi ne znači da su dozvoljene za svaki VLA objekat.

| Porodica | Značenje | Obavezna zaštita |
|---|---|---|
| `PROPOSE_CREATE` | novi objekat sa novim identitetom | idempotency identitet; provjera duplikata; bez active članstva prije apply-ja |
| `PROPOSE_UPDATE` | nova verzija postojećeg objekta | expected target version; stara verzija ostaje |
| `PROPOSE_SUPERSEDE` | nova vrijednost/verzija zamjenjuje prethodnu u scope-u | dvosmjerna veza; bez brisanja istorije; nova verzija zasebno eligible |
| `PROPOSE_WITHDRAW` / `PROPOSE_DEACTIVATE` | eksplicitni prestanak buduće/current upotrebe prema dozvoljenom lifecycle/membership pravilu | authority, razlog, scope i istorijsko zadržavanje |
| `PROPOSE_LINK` / `PROPOSE_UNLINK` | dodavanje/uklanjanje relacije ili članstva | oba endpointa, relation type, scope i expected membership |
| `PROPOSE_RECORD_CONFLICT` | kreiranje eksplicitnog conflict objekta/veze | conflict type, targets, scope, inputs; nikad samo napomena |
| `PROPOSE_RESOLVE_CONFLICT` | autoritativni scoped disposition | decision authority, purpose i posljedice; nema globalizacije |
| `PROPOSE_CLOSE_GAP` / `PROPOSE_REOPEN_GAP` | promjena identifikovanog nedostatka | gap target, razlog i preconditions |
| `PROPOSE_ACTION_CHANGE` | create/update/supersede Legal Action | authority; assignee/readiness odvojeni; odluka nije izvršenje |
| `PROPOSE_DEADLINE_CHANGE` | create/update/supersede ljudski potvrđenog roka | ljudska potvrda, osnov, jurisdiction/scope i downstream impact |
| `PROPOSE_ASSIGNMENT_CHANGE` | promjena odgovornog lica | ljudski authority; bez automatske dodjele |
| `PROPOSE_READINESS_CHANGE` | operativna readiness promjena | objektivni preconditions; ne mijenja review/trust |
| `PROPOSE_DECISION_RECORD` | evidentiranje decision outcome/disposition | identifikovani decision authority; odluka odmah postaje projection input |
| `PROPOSE_STATUS_TRANSITION` | dozvoljeni review/lifecycle/decision prelaz | primjenjiva VLA-0A matrica; zasebna osa; potreban audit record |

`PROPOSE_DECISION_RECORD` može biti Change Set čiji je neposredni rezultat samo autoritativna evidencija odluke. Povezana Legal Action ili drugo downstream članstvo ostaju zasebni itemi ili naknadni Change Set.

## 8. Independent Status Axes

Ne postoji jedan agregatni status koji zamjenjuje item-level rezultate.

### 8.1 Change Set lifecycle

`DRAFT` → `READY_FOR_REVIEW` → `CLOSED`, uz odvojene terminalne/bočne ishode `WITHDRAWN` i `SUPERSEDED_BY_REVISION`. `CLOSED` znači da paket više ne prima odluke u toj reviziji; ne znači da je odobren ili primijenjen. `WITHDRAWN` je dozvoljen samo za Change Set, Change Item ili odobrenu reviziju koja još nije uspješno primijenjena; ne može retroaktivno promijeniti uspješni apply rezultat.

### 8.2 Review status

Na item nivou: `NOT_REVIEWED`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `DEFERRED`, `CHANGES_REQUESTED`. Na set nivou: izvedeno `NOT_REVIEWED`, `IN_REVIEW`, `PARTIALLY_REVIEWED`, `APPROVED_ALL_ELIGIBLE`, `PARTIALLY_APPROVED`, `REJECTED_ALL`, ili `MIXED_COMPLETE`.

Set-level paketno odobrenje stvara pojedinačnu approval odluku za svaki eksplicitno obuhvaćeni item content identity. Izuzeci moraju biti navedeni; neobuhvaćeni item nije odobren. Set status nikad ne prepisuje item status.

### 8.3 Validation status

Na oba nivoa, izvedeno iz konkretnih nalaza: `NOT_RUN`, `VALID`, `VALID_WITH_WARNINGS`, `BLOCKED`, `STALE`. Set može biti djelimično blokiran ako su problem i dependency closure pouzdano izolovani.

### 8.4 Apply status

Item-level apply rezultat koristi jedan konceptualni katalog u oba VLA-0D dokumenta:

| Rezultat | Normativno značenje |
|---|---|
| `APPLIED` | nova poslovna promjena je uspješno proizvela current autoritativni efekat |
| `APPLIED_SCHEDULED` | future-effective zapis je uspješno uspostavljen, ali efekat nije current prije `effective_at`; nije pending apply |
| `NO_OP_ALREADY_APPLIED` | isti item/revizija/idempotent apply identitet već je uspješno primijenjen; retry ne proizvodi novu poslovnu promjenu i referencira raniji receipt |
| `NO_OP_ALREADY_SATISFIED` | target stanje već postoji iz drugog ili nedokazanog poslovnog osnova; item se ne proglašava ranije primijenjenim, osnov se evidentira i ekvivalentnost može zahtijevati review |
| `SKIPPED` | item nije pokušan u ovom run-u iz eksplicitnog neblocking razloga; nije rejected, withdrawn niti blocked |
| `BLOCKED` | apply nije dozvoljeno pokušati ili završiti zbog authority, precondition, dependency, staleness, conflict, validation ili invariant prepreke; nije failure |
| `FAILED` | apply je pokušan, ali nije uspješno završen; failure faza i dokazani autoritativni ishod moraju biti navedeni |
| `RECOVERY_REQUIRED` | invariant-safe završno stanje nije pouzdano potvrđeno; redovni apply pogođenog scope-a je blokiran do recovery-ja ili autoritativnog razrješenja |

`NO_OP` može biti samo nenormativna nadkategorija dva precizna no-op rezultata; Apply Receipt uvijek koristi podtip. `NOT_ELIGIBLE`, `READY` i `ATTEMPTED` mogu opisivati pre-apply/procesno stanje, ali nijesu konačni item-level apply rezultati.

Set-level apply status je isključivo izveden i rekonstruisiv iz item-level Apply Receipt rezultata u odobrenom apply scope-u:

| Zbirni rezultat | Pravilo agregacije |
|---|---|
| `NOT_APPLIED` | nijedan item nije `APPLIED` ili `APPLIED_SCHEDULED`; apply još nije uspješno izvršen |
| `APPLIED` | svi itemi u odobrenom apply scope-u su `APPLIED`, `APPLIED_SCHEDULED`, `NO_OP_ALREADY_APPLIED` ili eksplicitno semantički prihvaćeni `NO_OP_ALREADY_SATISFIED` |
| `PARTIALLY_APPLIED` | najmanje jedna dozvoljena grupa je uspješna, a drugi apply-eligible item ima `SKIPPED`, `BLOCKED` ili `FAILED`; završno stanje je dokazivo invariant-safe i partial apply je bio eksplicitno dozvoljen |
| `APPLY_BLOCKED` | nijedan relevantni item nije primijenjen jer je apply bio blokiran prije dozvoljenog pokušaja |
| `APPLY_FAILED` | apply je pokušan i nije uspio, ali je dokazano da nema nepoznatog ili nedozvoljenog parcijalnog stanja |
| `RECOVERY_REQUIRED` | najmanje jedan item/grupa ima taj rezultat ili završno stanje nije pouzdano; ovaj status ima prioritet nad `PARTIALLY_APPLIED` i `APPLY_FAILED` |

Prisustvo `APPLIED_SCHEDULED` mora proizvesti vidljivu karakteristiku `APPLIED_WITH_SCHEDULED_EFFECTS` ili semantički ekvivalent, bez tvrdnje da je efekat current. `NO_OP_ALREADY_APPLIED` zadovoljava idempotent completion istog itema. `NO_OP_ALREADY_SATISFIED` se računa kao completion samo uz eksplicitno potvrđenu semantičku ekvivalentnost i ne postaje dokaz ranijeg apply-ja tog itema. `BLOCKED` se ne agregira kao `FAILED`; `SKIPPED` ostaje različit od rejected, withdrawn, deferred i out-of-scope. Atomic grupa se agregira kao cjelina kada ne dozvoljava parcijalni rezultat. Zbirni status nikad ne prepisuje item rezultate niti sugeriše da su rejected, withdrawn, deferred, neodobreni ili van-scope itemi primijenjeni. Partial approval nije partial apply.

### 8.5 Orthogonal flags

`STALE`, `WITHDRAWN`, `SUPERSEDED`, `CONFLICT_BLOCKED` i `DEPENDENCY_BLOCKED` opisuju zasebno stanje/ograničenje, ne trust ili review. Withdrawal je odluka proposer-a/ovlašćenog owner-a da još neprimijenjeni prijedlog više ne traži primjenu; sprečava svaki budući apply te revizije. Ne mijenja istoriju reviewa, approval-a ili apply attempt-a. Uspješno primijenjeni item ne može biti naknadno povučen niti statusom `WITHDRAWN` ukloniti, deaktivirati ili prepisati svoj autoritativni efekat. Takav efekat može ukloniti, korigovati, deaktivirati ili supersede-ovati samo novi Change Item sa novim proposal basis-om, potrebnim reviewom/approval-om, Controlled Apply-em i novim Apply Receipt-om. Ako je samo dozvoljeno djeljivi dio itema ili grupe primijenjen, withdrawal može obuhvatiti samo još neprimijenjeni dio i samo ako dependencies, semantic atomicity i invariants ostaju zadovoljeni. Rejection je reviewer odluka o konkretnoj reviziji. Supersession povezuje staru i novu reviziju/paket, bez brisanja; audit uvijek pokazuje raniji approval i uspješni apply čak i kada kasniji corrective Change Set promijeni njihov efekat.

## 9. Review and Decision Model

Reviewer prvo provjerava item content identity, target/before/proposed diff, provenance, contradicting inpute, purpose, impact, dependencies, effective time i potreban authority. Review Change Set-a može organizovati rad, ali odluka je uvijek dokaziva po itemu.

| Odluka | Učinak |
|---|---|
| approve | item je odobren samo za identitet sadržaja, target baseline, scope, purpose i uslove u odluci; još nije applied |
| reject | item neće biti primijenjen iz te revizije; razlog i authority ostaju |
| defer | odluka je odložena do uslova/datuma; nije approval |
| changes requested | potrebna je nova revizija; postojeća ostaje istorijska |
| withdraw | prijedlog se povlači bez reviewer zaključka; ranije odluke ostaju istorijske |

Authority to review, authority to approve i authority to apply moraju biti zasebno dokazani. Jedno lice može imati više uloga prema budućoj matrici, ali sistem ih ne smije izjednačiti. Sistem/AI nijesu finalni authority.

Odobrenje postaje stale za item kada se materijalno promijeni njegov sadržaj, target baseline, relevantni Source/Evidence scope, conflict/disposition, purpose, authority, dependency closure, effective time ili downstream rizik. Revalidation može potvrditi da nebitna bazna promjena ne utiče na approval, uz eksplicitni nalaz.

## 10. Dependencies, Ordering and Semantic Atomicity

Veze između itema mogu biti:

- `REQUIRES`: prethodni item mora biti uspješno applied ili dokazivo već zadovoljen;
- `ORDER_AFTER`: oba mogu biti validna, ali apply redosljed je obavezan;
- `MUTUALLY_EXCLUSIVE`: najviše jedna grana može biti odobrena/applied;
- `ATOMIC_WITH`: grupa je semantički nedjeljiva;
- `INVALIDATES_IF_REJECTED`: rejection/skipping prethodnika blokira zavisni item;
- `FOLLOW_UP`: nije precondition, nego obavezni naknadni prijedlog/attention.

Dependency graf mora biti acikličan za apply ordering ili imati eksplicitno definisanu atomic grupu koja se validira kao cjelina. Rejection prerequisite-a blokira dependency closure, ali ne mijenja review odluke nepovezanih itema. Atomic grupa se odobrava i primjenjuje u cjelini; pojedinačno approval može postojati, ali grupa nije apply-ready dok svi članovi i authorities nijesu spremni.

Semantička atomicity određuje koje promjene ne smiju biti parcijalno vidljive jer bi prekršile VLA/Matter State invariant. Tehnička atomic write granica određuje kako se file-first zapisi trajno upisuju. One nijesu isto, ali Controlled Apply mora mapirati semantičku grupu na tehnički plan koji ne može ostaviti nedozvoljeno parcijalno stanje.

## 11. Staleness and Concurrent Change

Single Writer sprečava simultani nekontrolisani upis, ali ne čini stari prijedlog aktuelnim. Svaki item nosi expected target version/state; Change Set nosi base projection/input reference.

| Nalaz | Učinak |
|---|---|
| baza ista | redovna revalidation |
| promjena van target/dependency/impact scope-a | evidentirana kao nematerijalna; approval može ostati uz dokaz |
| isti item/revizija/idempotent identitet već uspješno primijenjen | `NO_OP_ALREADY_APPLIED`, bez duplikata, uz referencu na raniji receipt |
| željeni rezultat prisutan iz drugog ili nedokazanog poslovnog osnova | `NO_OP_ALREADY_SATISFIED`; osnov i semantička ekvivalentnost se evidentiraju bez spajanja odluka |
| target ili relevantna osnova materijalno promijenjeni | stale item; apply zabranjen do nove revizije/reviewa |
| base projection zastario, ali targeti dokazivo nepromijenjeni | set stale indikator može biti razriješen item-level revalidation nalazom |
| manual edit/expected-hash mismatch | protective block i reconciliation; nema overwrite-a |
| dvije semantički protivrječne validne namjere | eksplicitni conflict; ne bira se last-write-wins |

Rebase nije tiha zamjena baseline-a. On proizvodi novu reviziju sa rekonstruisanim before/proposed diff-om i procjenom koje odluke moraju biti obnovljene. Ako je poslovna namjera materijalno drugačija, koristi se superseding Change Set.

Tehnička konkurentnost je mismatch verzije/hash-a ili writer/recovery stanje. Semantički konflikt su inkompatibilne tvrdnje, odluke ili efekti. Jedno može postojati bez drugog i mora se zasebno evidentirati.

## 12. Conflicts and Blocking

Source Conflict, Assertion Conflict, Decision Conflict i manual-edit/integrity conflict ostaju eksplicitni objekti ili autoritativna stanja prema baseline-u. Change Item ih referencira i može predložiti njihovo evidentiranje ili scoped disposition, ali ih ne zamjenjuje tekstualnom napomenom.

Blocking se određuje po item/target/scope/purpose-u. Conflict može dozvoliti review radi razumijevanja prijedloga, a istovremeno zabraniti approval ili apply za pogođeni scope. Nepogođeni itemi mogu napredovati samo ako nijesu u dependency closure-u blokiranog itema i partial apply ne krši invariant.

Disposition navodi authority, conflict, scope, purpose, odluku, razlog i vrijeme. Interna disposition ne važi automatski client-facing. Sistem ne smije prećutno izabrati jednu konfliktnu vrijednost niti proglasiti konflikt riješenim zato što je jedan item odobren.

## 13. Temporal Rules

| Vrijeme | Značenje |
|---|---|
| `proposed_at` | kada je prijedlog formulisan |
| `recorded_at` | kada je zapis/revizija/audit događaj autoritativno evidentiran |
| `reviewed_at` | kada je review izvršen |
| `approved_at` | kada je approval odluka evidentirana |
| `attempted_at` | kada je Controlled Apply pokušaj počeo |
| `applied_at` | kada je konkretni efekat uspješno trajno primijenjen |
| `effective_at` | od kada primijenjeni sadržaj proizvodi deklarisano dejstvo/current eligibility |

`recorded_at`, `applied_at` i `effective_at` ne smiju se izjednačiti. Future-effective applied item je scheduled/future-effective i nije current prije `effective_at`. Aktiviranje u tom trenutku mora biti deterministički projekcioni rezultat ili zaseban kontrolisani događaj prema budućoj implementacionoj odluci; ne smije zahtijevati prepisivanje istorije.

Retroaktivna korekcija ima current `recorded_at`, može imati raniji `effective_at`, mora biti vidljivo označena i pokreće impact/re-review procjenu za odluke, radnje i outpute nastale između vremena. State-as-recorded-at-T ne koristi kasnije evidentiran retroaktivni zapis.

## 14. Downstream Impact and Invalidation

Svaki item klasifikuje impact:

- direct: target i neposredne relacije koje operacija mijenja;
- derived: projekcioni segmenti, chronology, deadline/readiness ili drugi izračunati prikazi;
- dependent-authoritative: odluke, Legal Actions, analyses, drafts, Client Action Pack ili drugi zapisi čija osnova može biti zastarjela;
- operational: assignee, rok, naredna radnja, upozorenje ili izvršivost.

Downstream analiza mora razlikovati sljedeće konceptualne ishode bez zaključavanja implementacionog enuma:

| Ishod | Značenje i minimalni osnov |
|---|---|
| Potential impact / potentially stale | postoji osnov da target može biti pogođen, ali invalidacija nije potvrđena; evidentira target, impact basis, scope, razlog i vezu sa Change Item-om ili Apply Receipt-om; sam ne uklanja current objekat osim kada ranije protection/blocking pravilo to zahtijeva |
| Confirmed invalidation | definisano pravilo ili autoritativna odluka potvrđuje da precizni target/scope više nije važeći za deklarisani purpose; evidentira razlog, rule/authority basis, effective time, provenance i da li je current, future-effective ili retroaktivna; ne nastaje iz same blizine ili generičke povezanosti |
| Review required | target mora biti ponovo pregledan prije navedene upotrebe, odluke ili apply-a; nije confirmed invalidation i target može ostati istorijski/informativno vidljiv uz purpose-aware warning ili block |
| Recommended follow-up | sistem ili reviewer preporučuje provjeru, odluku ili novi Change Set, ali normativna obaveza nije utvrđena; mora biti označeno kao preporuka |
| Mandatory follow-up Change Set | pravilo, authority odluka ili invariant zahtijeva novi Change Set; evidentira basis, target/scope, razlog, obavezni cilj, zavisnost od izvornog itema/receipta i da li je dalja upotreba/apply blokirana; generička AI preporuka nije dovoljan osnov |

`BLOCKED` opisuje zabranu određene operacije ili upotrebe, a ne semantičku invalidaciju targeta samu po sebi. Isti target može istovremeno biti `REVIEW_REQUIRED` i `BLOCKED` za određeni purpose. Confirmed invalidation je uvijek scope-aware i purpose-aware. Nijedan downstream ishod ne mijenja target tiho: kada su uklanjanje, deaktiviranje, korekcija ili supersede poslovna promjena, analiza preporučuje ili zahtijeva novi Change Set umjesto neposredne izmjene Matter State-a.

Promjena ranijeg Verified Fact membership-a mora najmanje: sačuvati raniji interval/osnov; identifikovati zavisne Legal Actions, deadlines, analyses, decisions i outputs; lokalizovati protective block gdje je potreban; i stvoriti eksplicitne re-review/follow-up zahtjeve. Ne proglašava sve povezano globalno nevažećim bez pravila.

## 15. Golden Path

1. Novi input se evidentira bez neposredne promjene Matter State-a.
2. Identifikuju se potencijalne promjene i kreira Change Set revizija prema poznatoj bazi.
3. Kreiraju se atomski Change Item-i sa before/proposed, provenance i target scope-om.
4. Povezuju se Source Item/Scope/Evidence Link, supporting i contradicting inputi.
5. Analiziraju se dependencies, authority, conflicts, temporalnost i downstream impact.
6. Validation proizvodi lokalizovane nalaze; ne donosi review odluku.
7. Advokat pregleda paket i odlučuje po itemima: approve/reject/defer/changes requested.
8. Iz odobrenih itema bira se dependency-closed apply plan.
9. Controlled Apply ponovo provjerava authority, preconditions, staleness, ordering i invariants.
10. Uspješno se primjenjuju samo dozvoljeni efekti i regeneriše Matter State projection.
11. Post-apply provjera potvrđuje stvarni rezultat ili pokreće recovery.
12. Apply Receipt evidentira precizan item-level rezultat iz jedinstvenog kataloga, novu projekcionu referencu i razdvojene downstream ishode.

## 16. Scenario Matrix

| Scenario | Normativni ishod |
|---|---|
| potpuno odbijen set | svi itemi rejected; ništa nije applied; prijedlog i review ostaju |
| djelimično odobren set | samo dependency-closed odobreni itemi mogu postati ready; ostali ostaju rejected/deferred/blocked |
| stale set | pogođeni itemi ne mogu u apply; nematerijalnost mora biti dokazana, ne pretpostavljena |
| konfliktni itemi | conflict eksplicitan; review može napredovati, apply pogođenog scope-a čeka disposition |
| future-effective change | može biti approved/applied kao scheduled; nije current prije `effective_at` |
| tehnički prekinut apply | rezultat se utvrđuje iz durable faze/receipta; recovery prije novog poslovnog apply-ja |
| retry | isti apply/item idempotency identitet; nema duplikata; novi attempt audit |
| superseding set | novi identitet i veza; stari se ne prepisuje; odobrenja se ne prenose automatski |
| decision-only set | decision outcome postaje autoritativni projection input; downstream action ostaje pending |
| Verified Fact membership promjena | stara istorija ostaje; target version kontrola; dependencies dobijaju re-review/follow-up |

## 17. Key Separations

- input ≠ Change Set; Change Set ≠ Change Item;
- proposal ≠ review ≠ approval ≠ apply ≠ result;
- review authority ≠ approval authority ≠ apply authority;
- approved effect ≠ attempted effect ≠ successful effect;
- validation failure ≠ review rejection;
- stale ≠ conflict;
- partial review ≠ partial approval ≠ partial apply;
- supersede ≠ delete; withdrawal ≠ rejection;
- retry ≠ nova poslovna promjena;
- technical recovery ≠ semantic rollback;
- projected impact ≠ stvarni rezultat;
- Change Set ≠ Matter State ≠ audit istorija.

## 18. Open Decisions Deferred Beyond VLA-0D

- fizički file format, folder layout, schema i serialization;
- konkretna authority matrica po object type-u, purpose-u i iznosu/riziku;
- materiality pragovi i kancelarijska escalation pravila;
- konačni operation/status enum-i u implementaciji;
- hash/version token format i projection rules version format;
- recovery journal, locking i atomic-write algoritam;
- UI za review, diff, rebase, conflict disposition i recovery;
- scheduler mehanizam za future-effective rezultate;
- detaljni Event Log model i retention format.

Ove odluke ne suspenduju normativne granice, invarijante i no-silent-overwrite pravila VLA-0D.
