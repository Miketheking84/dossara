# DOSSARA — WP VLA-1A Persistence Boundary, Rebuildability and Invariants

## 1. Document Control and scope

| Polje | Vrijednost |
|---|---|
| Work package | VLA-1A — Domain Contracts and Persistence Boundary |
| Dokument | Persistence Boundary, Rebuildability and Invariants |
| Status | Documentation-only acceptance draft |
| Datum | 7. avgust 2026. |
| Baseline | Prihvaćeni VLA-0A–E i prateći VLA-1A domain contract |
| Ne zaključava | JSON/YAML/JSONL, schema, physical layout, SQLite schema, hashing, locking ili filesystem transaction algorithm |

Ovaj dokument određuje šta mora biti trajno i autoritativno, šta je izvedeno, kako se izvedeni slojevi mogu obnoviti i koja logical atomicity/recovery pravila svaki budući persistence mehanizam mora zadovoljiti.

## 2. Four-layer persistence model

### Layer 1 — Authoritative Domain Records

Canonical semantic objects, stable identities, immutable exact revisions, currentness/lifecycle veze i authoritative source content. Layer 1 je direktni dokaz sadržaja i semantičkih relacija; Matter State nije njegov zamjenski autoritet.

### Layer 2 — Immutable Semantic / Audit History

Append-oriented istorija relevantnih proposal-a, reviewa, approval-a, decisions, conflict dispositions, apply attempts/results, Apply Receipts, recovery findings, reconciliation, state effects i Semantic Events. Layer 2 ne mora biti Event Sourcing i ne mora biti jedini izvor current object sadržaja. Mora sa Layer 1 omogućiti audit i reconstruction.

### Layer 3 — Matter State Projection

Matter State je **derived, deterministic, purpose-aware, version-aware and rebuildable projection** iz kompletnih primjenjivih Layer 1–2 inputa i identifikovane reconstruction-rule version. Može biti materialized i UI ga može primarno čitati; persistence ili praktičnost čitanja ga ne čine independent authority.

### Layer 4 — Disposable Technical Index / Cache

SQLite projection/index, FTS/search index, dashboard counters, recent-items index, cached relations i derived lookup tables. Potpuni gubitak Layer 4 ne smije izgubiti authoritative semantic, source ili audit informaciju. Layer 4 se obnavlja iz Layers 1–3 ili neposredno iz 1–2 prema definisanom contract-u.

## 3. Authoritative versus derived matrix

| Record/artifact | Klasifikacija | Autoritet i granica |
|---|---|---|
| original PDF/DOCX/EML/MSG | authoritative source content/evidence artifact | autoritativan za sačuvani sadržaj i provenance, ne za VLA semantički zaključak |
| Source Item | Layer 1 authoritative VLA record | identitet/provenance; nije potvrda istine/autentičnosti |
| Source Content Version | Layer 1 immutable authoritative source state | exact historical content identity; hash nije stable identity |
| Assertion | Layer 1 authoritative semantic record | precizna tvrdnja i ose; nije automatski Verified Fact |
| Verified Fact | Layer 3 derived membership/qualification | autoritativni basis je exact Assertion/Evidence/Review/Apply/history u Layers 1–2 |
| Decision | Layer 1 record + Layer 2 history | odluka authority-ja; neposredni projection input |
| Conflict Record | Layer 1 relation/record + Layer 2 dispositions | scope-specific autoritativni konflikt i istorija |
| Legal Action | Layer 1 record + Layer 2 history | current sadržaj/status po exact revisions/effects |
| Change Set | Layer 1 proposal/revisions + Layer 2 apply history | proposed/approved effect nije actual effect |
| Change Item | Layer 1 proposal/revisions + Layer 2 apply history | exact content-bound approval i actual receipt odvojeni |
| Review Record | Layer 2 append-only authority record | exact subject revision/purpose; current review status može biti projection |
| Apply Receipt | Layer 2 append-only authority record | stvarni pokušaj/ishod; nije zamjena za resulting records |
| Semantic Event | Layer 2 immutable authority record | istorijska radnja/rezultat; nije object revision |
| Matter State | Layer 3 derived projection | nije canonical authority; mora biti rebuildable |
| historical Matter State | Layer 3 reconstructed projection/snapshot | rezultat exact historical reconstruction; snapshot može dokazati šta je generisano, ne zamijeniti inputs |
| SQLite | Layer 4 disposable | nikad jedini dom authoritative podatka |
| FTS/search | Layer 4 disposable | discovery aid, ne dokaz potpunosti/istinitosti |
| dashboard counters | Layer 4 disposable | izvedeni indikatori |
| AI proposals | neauthoritative proposal artifact dok nije prošao VLA tok | generator provenance se čuva; nema direct effect |
| Work Products | output artifact, van Matter State authority-ja | sadržaj ne postaje semantic state; treba downstream provenance |

**Invariant:** authoritative source content i authoritative VLA semantic record nisu isto. PDF može dokazivati šta sačuvani dokument sadrži; sam PDF nije Assertion, Evidence Link, Verified Fact, Review Record ili Decision.

## 4. Matter State projection contract

Svaka projection instanca mora konceptualno identifikovati:

- matter, purpose/scope i temporalni pogled;
- reconstruction/projection rules version;
- complete input boundary/frontier (exact revisions/events i cut-offs);
- generation time i validation result;
- completeness, validity i staleness stanje, lokalizovano gdje je moguće;
- recovery-affected i reconciliation-affected scope;
- razlog invalidation-a i vezu na rebuild/validation rezultat.

**Completeness** znači da su svi primjenjivi authoritative inputs do deklarisanog frontier-a dostupni i obrađeni. **Validity** znači da inputi, reference, rules i rezultat zadovoljavaju invarijante. **Stale** znači da je poznat noviji/promijenjeni primjenjivi input koji projection ne obuhvata. **Incomplete** znači da nedostaje potreban input ili nije moguće dokazati obuhvat. **Recovery-affected** znači da unknown completion sprečava pouzdani current zaključak.

Rebuild bira deklarisani rules version i frontier, učitava exact authoritative revisions/history, provjerava reference/authority/temporal/lifecycle/apply/conflict uslove, izračunava segmente deterministički, validira ih i objavljuje samo status koji dokazi podržavaju. Problem se lokalizuje kad je pouzdano izolovan; global invalidity je rezervisana za fundamentalno nedeterminističan ili nepouzdan rezultat.

## 5. Projection invalidation

**Invariant:** Authoritative semantic mutation koja utiče na Matter State čini prethodni pogođeni projection ne-current dok se ne rebuild-uje ili validira po odgovarajućim reconstruction rules.

Ovo važi i za novi konflikt, terminalni lifecycle, integrity/manual-edit problem, decision/disposition, recovery finding ili retroaktivni/future-effective effect. Invalidation može biti lokalizovan na segment/target/scope/purpose. VLA-1A ne bira dirty flag, hash, counter ili generation algoritam.

## 6. Historical reconstruction

Historical Matter State nije „current records filtered by date“. Rekonstrukcija koristi:

- exact revisions i content versions koje su pripadale izabranom frontier-u;
- tada primjenjive lifecycle/currentness i supersession veze;
- Semantic Events, Review Records, decisions, receipts, state effects i conflict/recovery stanje;
- purpose/scope;
- authority-at-event-time;
- `occurred_at`, `known_at`, `recorded_at`, review/approval/apply i effective vremena prema VLA-0E;
- identifikovanu reconstruction-rule version.

`as-known-at(Tk, Tr)` i `as-effective-at(Te, Tk, Tr)` ostaju različiti pogledi. Late discovery ne backdate-uje knowledge ili recorded time. Historical referenca na `latest` zabranjena je kada revision content utiče na rezultat.

## 7. Manual/external edit reconciliation

**Manual editing is not forbidden; silent semantic acceptance is forbidden.**

Konceptualni tok je:

```text
last accepted authoritative revision
↓
unexpected external/manual modification detected
↓
reconciliation required
↓
compare accepted state vs externally observed state
↓
human accept / reject / resolve
↓
new canonical revision where appropriate
↓
reconciliation/audit history
↓
projection rebuild
```

External observed state ostaje odvojeno opažanje dok se ne utvrde identity, referential, semantic, authority i temporalni uslovi. Prihvatanje stvara novu canonical revision gdje sadržaj pripada postojećem objektu; reject čuva nalaz bez semantic effect-a; resolve može zahtijevati korektivne relacije ili Controlled Apply.

Dok je relevantni reconciliation unresolved:

- last accepted authoritative state ostaje poznat i ne prepisuje se;
- observed state mora biti jasno označen kao neaccepted;
- dependent projection je stale, incomplete ili invalid prema lokalizovanom učinku;
- Controlled Apply se blokira gdje mismatch utiče na target, baseline, dependencies, authority ili preconditions;
- sistem ne bira verziju kao istinitu i ne radi normal retry preko konflikta.

Watcher i detection/hash algoritam ostaju van scope-a.

## 8. Referential integrity contract

| Veza | Obavezni semantic target |
|---|---|
| Source Item → Content Version | stable Source Item + exact immutable version; currentness odvojena |
| Evidence Link → Source/Version/Scope | exact Content Version i locator/scope + exact Assertion revision |
| Assertion → evidence/source basis | exact reviewed link/scope revisions; attribution odvojena od truth |
| Verified Fact → basis | exact eligible `FACTUAL_CLAIM`, Evidence Links, source scopes, trust assessment, Review Record i successful apply/state effect |
| Decision → basis | decision request/outcome, actor/authority, exact relevant revisions, purpose i times |
| Conflict → participants | exact scopes/revisions gdje sadržaj utiče; disposition je scope/purpose-specific |
| Change Item → target | exact expected target revision/state, operation, proposed effect i dependencies |
| Review → subject | exact subject revision + purpose/scope + reviewer authority/time |
| Approval → subject | exact revision, approved effect/scope/conditions i authority/time |
| Apply Receipt → apply | exact Set/Item revisions, attempt/idempotency identity, expected/actual state i result |
| Semantic Event → history | actor, authority-at-time, targets/exact revisions, temporal axes i causal chain |
| Matter State → inputs | kompletan primjenjivi authoritative frontier, rules version i validation result |

Missing, ambiguous ili wrong-matter reference nije prazna vrijednost koju projection smije preskočiti; to je referential/semantic validity problem sa lokalizovanim ili globalnim zaštitnim rezultatom.

## 9. Semantic transaction boundary

Logical atomicity je poslovni invariant, nezavisan od fizičkog broja fajlova i koraka. Za Controlled Apply jedna logical operation obuhvata najmanje:

1. expected-state/frontier i idempotency validation;
2. exact revision review/approval/authority validation;
3. dependency, conflict, lifecycle, temporal i invariant validation;
4. authoritative resulting revision/relation/state effect ili dokaz da effect nije nastao;
5. Apply Receipt sa stvarnim item/group rezultatom;
6. relevantne Semantic Events i causal links;
7. projection invalidation, zatim rebuild/validation kada je moguć.

Sistem ne smije objaviti stanje u kojem authoritative effect izgleda primijenjen, a nije moguće utvrditi da li je Controlled Apply završen. Semantic atomic group iz VLA-0D mora u cjelini proizvesti validan poslovni rezultat ili nijedan njen effect. Partial apply je dozvoljen samo za dokazano nezavisne grupe i eksplicitno odobren plan.

Ako partial physical failure ostavi completion nedokazivim, rezultat je `RECOVERY_REQUIRED`/`UNKNOWN_COMPLETION`, ne `FAILED`, success niti normal retry.

## 10. Recovery boundary

Recovery mora odvojeno posmatrati:

- **authoritative state** — dokazivi Layer 1–2 zapisi/effects;
- **expected state** — baseline i odobreni plan prije pokušaja;
- **physical persistence state** — šta je fizički pronađeno, bez automatske semantičke interpretacije;
- **projection state** — current/stale/incomplete/invalid/recovery-affected izvedeni rezultat;
- **unknown completion** — nedokaziv konačni ishod pokušaja;
- **recovery finding** — `RECONCILED_APPLIED`, `RECONCILED_NOT_APPLIED` ili i dalje `RECOVERY_REQUIRED` prema VLA-0E;
- **reconciliation result** — ljudski potvrđen odnos accepted i externally observed state-a.

Dok je `RECOVERY_REQUIRED` unresolved nema normalnog retry-ja. Recovery ne donosi novu poslovnu odluku, ne duplira effect i ne prepisuje originalni attempt/receipt/event. `RECONCILED_NOT_APPLIED` dozvoljava novi pokušaj tek nakon pune revalidation. Semantic rollback uspješnog effect-a je novi Change Item/review/approval/apply, ne technical recovery.

## 11. Migration and import trust boundary

Podaci iz postojećeg SDJ workspace-a, starih CONTROL fajlova, Import Existing Matter workflow-a ili budućih migracija ne postaju automatski `CONFIRMED_FROM_SOURCE`, `APPROVED` ili `APPLIED`.

`command-center.md`, `chronology.md`, `next-actions.md`, `document-register.md` i `ai-work-log.md` nisu retroaktivno VLA canonical records. Oni mogu biti import provenance/basis i izvor candidate records koji se moraju mapirati, atomizovati, povezati, pregledati, potvrditi i primijeniti prema VLA pravilima. Importer je unutar Semantic Write Boundary-a kada predloženi rezultat treba postati authoritative; sam parsing/mapping nije authority.

## 12. Validation layers

Validacije su odvojene i nijedna niža ne dokazuje višu:

1. **Syntax/schema validity** — representation je čitljiva i odgovara tehničkom obliku.
2. **Referential validity** — svi obavezni targeti/exact revisions postoje i odgovaraju scope-u/matter-u.
3. **Semantic validity** — kombinacija osa, relacija i efekata poštuje VLA invarijante.
4. **Authority validity** — actor je imao authority za scope u relevantno action time.
5. **Temporal validity** — cut-offs, intervals, ordering i currentness su koherentni.
6. **Apply eligibility** — svi prethodni nivoi, exact approval, expected state, conflicts, dependencies i recovery preconditions dopuštaju apply.

Schema-valid zapis može biti semantički ili apply-invalid ako revision ne postoji, approval pripada staroj revision, actor nije imao authority, conflict je unresolved, expected revision je stale, recovery je otvoren ili reconstruction input nedostaje. VLA-1A ne bira Zod/JSON Schema.

## 13. Rebuildability contract

| Derived layer | Authoritative inputs | Rules awareness / completeness | Missing input | `RECOVERY_REQUIRED` / unresolved reconciliation |
|---|---|---|---|---|
| Matter State current | kompletni primjenjivi Layer 1–2 records/events do frontier-a | obavezna rules version; svi relevantni inputs i validacije | lokalizovan incomplete/invalid ili global invalid ako se ne može izolovati | pogođeni scope recovery-affected/stale; unsafe positive membership/apply blokiran |
| Historical Matter State | exact historical revisions/events, lifecycle, authority, temporal cut-offs | reconstruction rules version + `Tk/Tr/Te` parametri | rezultat mora označiti neizvodljiv ili incomplete pogled; ne koristi `latest` | prikazuje tadašnje unknown/reconciliation stanje, ne izmišljeni ishod |
| Materialized Matter State/snapshot | isti inputi kao odgovarajući projection + snapshot provenance | input frontier, rules, time, validation | odbaciti/rebuild ili jasno označiti nevalidno | ne smije se objaviti kao current |
| SQLite/FTS/search/cache/counters | deklarisani Layer 1–3 inputi | indexer/rules version i obuhvat | rebuild/partial unavailable; authority ostaje netaknut | označiti rezultate incomplete/stale ili ih ne nuditi kao potpune |

Gubitak bilo kojeg derived sloja ne smije uništiti authority. Ako derived podatak nije deterministički obnovljiv, njegova neophodna informacija pripada Layer 1 ili 2 i mora tamo biti sačuvana.

## 14. Markdown/file-first storage assessment

Ocjene su arhitektonske, ne izbor fizičkog formata.

| Kriterijum | A Markdown-only AR | B Structured sidecar + Markdown view | C Structured AR + generated Markdown | D Hybrid by object type |
|---|---|---|---|---|
| human readability/inspectability | visoka | visoka uz jasnu authority oznaku | visoka za view | visoka, prilagođena objektu |
| human editability | visoka, ali teško kontrolisiva | rizik dual-authority-ja | strukturisani AR zahtijeva reconciliation | kontrolisana prema vrsti |
| deterministic parsing | srednja/slaba za kompleksne records | visoka za sidecar | visoka | visoka gdje integritet traži strukturu |
| stable IDs/revision integrity | mogući, ali krhki pri ručnim izmjenama | dobri uz jednu deklarisanu authority stranu | jaki | jaki za high-integrity records |
| append-only audit | nezgrapan | ostvariv | jak | jak uz specijalizovanu reprezentaciju |
| manual edit detection | složena | složena zbog duplikata | jasna acceptance granica | jasna po contract-u objekta |
| schema evolution | teška | srednja | upravljiva | upravljiva po kategoriji |
| rebuildability | moguća, parsing-rizična | dobra ako sidecar ostaje authority | jaka | jaka |
| offline survivability | jaka | jaka | jaka | jaka |
| OneDrive/file-first compatibility | moguća, ali konfliktna | moguća uz reconciliation | moguća | najbolji balans, bez obećanja concurrency mehanike |

**Option A** je čitljiv, ali kompleksne immutable revisions, exact links i audit čini krhkim. **Option B** može stvoriti nejasnoću da li sidecar ili Markdown pobjeđuje; mora imati jednu eksplicitnu authority stranu. **Option C** daje determinističan high-integrity core i generated human view, ali nije optimalan za svaku običnu bilješku. **Option D — hybrid by object type** je preporučeni VLA-1A arhitektonski smjer:

```text
Original evidence → native PDF/DOCX/EML/MSG/etc.
High-integrity VLA records → structured authoritative representation.
Immutable audit/history → structured append-only representation.
Matter State / cockpit → generated human-readable projection.
Ordinary operational notes → Markdown where appropriate.
```

Ne bira se JSON, YAML, JSONL niti drugi fizički format. VLA-1B mora spriječiti dual authority i za svaki object type označiti authoritative representation, generated view i reconciliation ponašanje.

## 15. File-first definition

File-first znači da authoritative source, semantic i audit informacije ostaju u durable workspace files pod kontrolom korisnika, dostupne offline u propisanom inspectable obliku i preživljavaju potpuni gubitak disposable database/index slojeva.

File-first ne znači Markdown-only, one-file-per-object, freely editable authority, zabranu strukturisanih records niti zabranu SQLite projekcije. Autoritativna informacija ne smije postojati samo u SQLite-u. Ručna izmjena durable fajla je dozvoljena kao observed input, ali postaje semantic authority samo kroz reconciliation i Semantic Write Boundary.

## 16. Persistence invariants

1. Layers 1–2 nose authority; Layers 3–4 ga ne stvaraju.
2. Exact persisted revisions, reviews, receipts i events se ne prepisuju.
3. Currentness se izvodi iz autoritativnih lifecycle/temporal/effect pravila, ne iz filename-a ili „latest“ prečice.
4. Matter State je deterministički rebuildable za deklarisani rules version/frontier ili jasno označen incomplete/invalid.
5. Mutation koja utiče na state invalidira pogođeni projection.
6. Approval je content-bound i ne prelazi automatski na novu revision.
7. AI, importer, manual edit, indexer i Work Product nisu semantic authority.
8. Jedan conceptual Semantic Write Boundary primjenjuje jedinstvene validity/authority/audit/invalidation kontrole.
9. Semantic atomic group nikad se ne objavljuje parcijalno.
10. Unknown completion proizvodi `RECOVERY_REQUIRED`; normal retry je blokiran.
11. Physical deletion nije normalni lifecycle autoritativnog VLA zapisa.
12. Potpuni gubitak Layer 4 ne gubi authoritative ili audit informaciju.

## 17. Gap classification and deferrals

| Klasa | Otvoreno | Disposition |
|---|---|---|
| A — Domain semantic blocker | nijedan | VLA-1A invarijante su potpune za implementacioni handoff |
| B — Persistence architecture | structured format, physical layout, file-per-record/aggregate, journal/manifest, snapshot representation, migration serialization | VLA-1B |
| C — Security/concurrency | authentication, RBAC, encryption, locks, process/OneDrive concurrency | kasniji technical WP |
| D — Product functionality | reconciliation/recovery UI, projection status UX, Work Product UX | kasniji product/UX WP |
| E — Implementation detail | UUID/ULID/GUID, hashes, atomic rename, fsync, staging, SQLite/FTS schema, watcher, cache invalidation mechanism | ne blokira VLA-1A |

Nema MATERIAL/BLOCKER nalaza. VLA-0E ne zahtijeva Event Sourcing; VLA-0C projection i VLA-0D recovery/atomicity su konzistentni sa četvoroslojnim modelom. Physical storage implementation ostaje replaceable.

## 18. VLA-1A conclusion

Canonical authority pripada stable identities, immutable exact revisions, lifecycle/currentness i immutable audit/history. Matter State i tehnički indeksi ostaju rebuildable derived products. Manual edits zahtijevaju reconciliation, import ne nasljeđuje trust/approval/apply, a Controlled Apply mora ostaviti dokaziv success, dokaziv non-effect ili `RECOVERY_REQUIRED`. Preporučeni smjer je Option D, bez izbora fizičkog storage formata.
