# DOSSARA — WP VLA-1B Persistence Architecture and Storage Contract

## 1. Document control

| Polje | Vrijednost |
|---|---|
| Work package | VLA-1B — Persistence Architecture |
| Status | **VLA-1B COMPLETE — acceptance-ready architectural baseline** |
| Datum | 9. avgust 2026. |
| Branch | `spike/phase-0c-electron-forge-webpack` |
| Normativni baseline | Accepted VLA-0A–E; accepted VLA-1A commit `9b9ffaa09170804aac7bf75e9f619cf660dad536` |
| Formalni kontrolni akt | `docs/dossara/decision-alignment-register-v1.2.md` |
| Vrsta rada | Persistence architecture; bez runtime implementacije |

## 2. Purpose

VLA-1B bira fizičko-logički persistence smjer koji implementacija mora moći slijediti bez ponovnog odlučivanja o authority-ju, identity-ju, exact revisions, audit istoriji ili rebuildability-ju. Ovaj dokument konkretizuje VLA-1A Option D — hybrid by object type — i zadržava jedan conceptual Semantic Write Boundary.

**Central invariant:** Strukturisani workspace fajlovi nose authoritative domain records i immutable audit/history. Generated Matter State, Markdown views, SQLite, FTS i cache ostaju rebuildable derived slojevi. Nijedan convenience file ili indeks ne postaje authority.

## 3. Scope and non-scope

U scope-u su:

- formatne porodice po persistence sloju;
- matter-local logical layout;
- canonical record envelope;
- immutable revision i currentness model;
- tipizovane reference;
- audit/history container;
- dependency frontier;
- derived projection/index granica;
- schema evolution, unknown-type ponašanje i manual-edit reconciliation boundary;
- logical commit/recovery artifacts potrebni da se spriječi ambiguous semantic state.

Van scope-a ostaju:

- aplikacioni kod i TypeScript interfejsi;
- JSON Schema/Zod implementacija;
- konkretni UUID/ULID/GUID generator;
- hash algoritam;
- atomic rename, fsync, temp/staging algoritam i OS locking;
- OneDrive concurrency, lease, authentication, RBAC i encryption;
- SQLite tabela/FTS engine;
- migration executable i produkcijski rollout;
- izmjene stvarnog SDJ ili OneDrive workspace-a.

## 4. Selected persistence direction

| Informaciona kategorija | Odabrana authoritative/derived reprezentacija | Authority |
|---|---|---|
| original evidence | native PDF/DOCX/EML/MSG/JPG/PNG/etc. | authoritative source content, ne VLA semantic authority |
| canonical VLA object revisions | UTF-8 structured JSON, jedan immutable record po exact revision | Layer 1 authoritative |
| source content identity/metadata | UTF-8 structured JSON uz native content reference | Layer 1 authoritative |
| semantic/audit history | UTF-8 JSONL u immutable, sealed segments | Layer 2 authoritative |
| transaction/recovery evidence | structured JSON records i povezani audit events | Layer 2 authoritative |
| Matter State machine view | generated structured JSON projection | Layer 3 derived |
| Matter State human view | generated UTF-8 Markdown | Layer 3 derived |
| operational notes | Markdown gdje nisu canonical VLA authority | nonauthoritative ili object-specific prema deklaraciji |
| search/cache/dashboard | SQLite/FTS/derived files | Layer 4 disposable |

Ovim se biraju JSON i segmentirani JSONL kao formatne porodice za high-integrity records. Ne bira se jedna univerzalna šema za sve object types. Svaki record ima zajednički envelope i object-type-specific payload/schema.

## 5. Logical workspace layout

Authoritative VLA control podaci za matter nalaze se u postojećoj backup granici `00 CONTROL`:

```text
<matter>/
  00 CONTROL/
    vla/
      manifest.json
      registry/
        object-types.json
        schemas.json
        projection-rules.json
      objects/
        <objectType>/
          <objectId>/
            revisions/
              <revisionId>.json
      history/
        <segmentId>.jsonl
      transactions/
        <transactionId>.json
      reconciliation/
        observations/
        findings/
      projections/
        matter-state.json
        matter-state.md
      index/
        matter.sqlite
```

Ovo je logical layout contract. Character escaping, filename normalization, sharding, segment size, active-segment mechanics i atomic publication algoritam pripadaju Foundation Hardening/tehničkoj implementaciji. Implementacija smije fizički optimizovati layout samo ako zadrži iste authority, discovery, backup, reconstruction i manual-inspection osobine i dobije zasebnu odluku.

`manifest.json`, registry snapshots i transaction records mogu sadržati authoritative discovery/integrity podatke samo kada su i sami obuhvaćeni immutable revision/audit pravilima. Convenience current pointers i projekcioni manifesti moraju biti rebuildable i jasno označeni kao derived. Nijedna canonical revision ne smije biti izgubljena brisanjem manifesta ili indeksa.

## 6. Canonical record envelope

Svaka Layer 1 exact revision mora konceptualno imati najmanje:

| Polje | Uloga |
|---|---|
| `recordFormat` | identitet i major/minor verzija envelope formata |
| `schemaId` / `schemaVersion` | identitet object-specific validacionog ugovora |
| `objectType` | obavezni eksplicitni canonical object type discriminator |
| `objectId` | stable object identity; opaque string |
| `revisionId` | immutable exact revision identity; opaque string |
| `matterId` | matter authority/isolation scope, kada je primjenjiv |
| `revisionOf` | eksplicitna veza revision → stable object |
| `previousRevisions` | nula ili više tipizovanih exact revision referenci |
| `createdAt` / `recordedAt` | relevantna vremena nastanka/evidentiranja |
| `createdBy` | actor/system identity sa provenance značenjem |
| `generatorType` | manual/system/AI/import provenance, bez authority implikacije |
| `payload` | object-type-specific semantic content |
| `references` | tipizovane, imenovane semantic reference |
| `integrity` | zapis integriteta i canonicalization context; algoritam ostaje kasniji izbor |
| `extensions` | namespaced forward-compatible podaci koji ne mijenjaju core semantiku |

`objectId`, `revisionId` i event/transaction identiteti ostaju strings čiji format nije semantički tumačen. Implementacija ne smije iz prefiksa ili dužine ID-ja zaključiti `objectType`, ordering, matter ili vrijeme.

Unknown core polje ne smije se tiho odbaciti pri read-modify-write operaciji. Namespaced extension se mora sačuvati byte-semantically ili canonical-semantically prema registrovanom extension contract-u. Nepoznata vrijednost nije dozvola da se izmisli default.

## 7. `objectType` contract

`objectType` je obavezan u svakom canonical object revision record-u, reference targetu, registry entry-ju i svim audit eventima čije značenje zavisi od target type-a.

Početni canonical vocabulary uključuje zaključane VLA object types i VLA-0B/VLA-0E record types, najmanje:

```text
SOURCE_ITEM
SOURCE_CONTENT_VERSION
SOURCE_SCOPE
EVIDENCE_LINK
SOURCE_RELATION
SOURCE_ASSESSMENT
CONFLICT_RECORD
MATTER_ASSERTION
DECISION_REQUEST
LEGAL_ACTION
DEADLINE
EXPECTED_OUTPUT
REVIEW_RECORD
CHANGE_SET
CHANGE_ITEM
APPLY_RECEIPT
SEMANTIC_EVENT
CLIENT_ACTION_PACK
```

Ova lista ne pretvara Verified Fact ili Working Assumption u object type. `FACTUAL_INFERENCE` ostaje assertion kind.

Forward-compatible ponašanje:

1. Reader mora razlikovati **known-supported**, **known-unsupported-version** i **unknown objectType**.
2. Unknown `objectType` se ne mapira na najbliži poznati type, generic note ili `MATTER_ASSERTION`.
3. Record se čuva i prikazuje kao unsupported authoritative input; ne smije biti izgubljen pri round-trip-u.
4. Projection koji ne razumije potencijalno relevantan type ne smije tvrditi completeness/currentness za pogođeni scope.
5. Semantic writer ne smije mutirati unknown type osim kroz registrovani handler/schema; može ga samo očuvati, izolovati i evidentirati nalaz.
6. Dodavanje novog type-a zahtijeva registry/schema/rules version update, ali ne promjenu common envelope-a niti reference modela.

## 8. Immutable revisions and currentness

Jednom published exact revision file se ne mijenja. Semantic correction stvara novi `revisionId` pod istim `objectId` kada identity continuity ostaje validan. Atomizacija, reconsideration ili novi provenance predmet mogu zahtijevati novi `objectId` prema VLA-1A.

Currentness nije filename `latest.json`, filesystem modified time niti najveći lexical ID. Autoritativno se izvodi iz:

- immutable lifecycle/currentness events/records;
- supersession/replacement relacija;
- exact review/approval/apply results;
- temporal/effective semantics;
- conflict, recovery i reconciliation state-a;
- projection rules version-a.

Opcioni `current.json` ili manifest pointer smije postojati samo kao derived acceleration i mora biti validabilan/rebuildable.

## 9. Typed reference contract

Svaka semantic referenca je strukturisana i tipizovana. Minimalni oblik konceptualno je:

```json
{
  "referenceType": "SUBJECT_REVISION",
  "targetObjectType": "MATTER_ASSERTION",
  "targetObjectId": "opaque-object-id",
  "targetRevisionId": "opaque-revision-id",
  "matterId": "opaque-matter-id",
  "scope": "object-specific scope",
  "required": true
}
```

Pravila:

- `referenceType` određuje semantičku ulogu veze; nije zamjenjiv generičkim `relatedIds`.
- `targetObjectType` je obavezan i mora odgovarati stvarnom target record-u.
- `targetRevisionId` je obavezan kad sadržaj targeta utiče na istoriju, review, approval, evidence, conflict, apply, event ili reconstruction.
- Stable-object-only reference dozvoljena je samo kada contract reference type-a eksplicitno kaže da currentness, a ne exact content, predstavlja namjeru.
- Reference mora navesti matter/cross-matter scope i purpose gdje su relevantni.
- Type mismatch, missing required revision, wrong-matter target i disallowed reference cardinality su referential validity failures.
- Unknown `referenceType` ili target type mora se očuvati; ne smije se reinterpretirati.
- Circularity se validira prema object-specific dependency pravilima; nije univerzalno zabranjena za sve relation graphs.

Tipizovane reference omogućavaju da budući object type uđe u isti graph bez promjene common envelope-a, uz novu registry/schema/rules verziju.

## 10. Audit/history container

Layer 2 se čuva kao JSONL događaji grupisani u immutable sealed segments. Svaka linija predstavlja potpun, samostalno parsabilan record sa common audit envelope-om; multi-line JSON nije dozvoljen unutar JSONL segmenta.

Segment mora imati identitet, format/schema/rules context i verifikabilnu granicu. Sealed segment se ne append-uje niti prepisuje. Korekcija je novi event/record u novom ili aktivnom segmentu. Fizička mehanika aktivnog segmenta, seal-a, crash recovery-ja i rotacije ne zaključava se ovdje.

Audit event mora moći referencirati exact targets, actor, authority-at-event-time, purpose/scope, causal chain, occurred/known/recorded/effective times i resulting revisions/effects. Event Sourcing nije obavezan: current canonical revisions ostaju Layer 1 authority, a history Layer 2 daje audit i reconstruction facts.

## 11. Dependency frontier

`dependencyFrontier` je immutable, typed manifest kompletnog authoritative input boundary-ja korišćenog za projection, validation, review snapshot ili Controlled Apply. Nije samo timestamp, filesystem scan time, najveći event ID ili lista trenutno poznatih object types.

Minimalni frontier sadrži:

- `frontierId` i `frontierFormatVersion`;
- matter, purpose/scope i temporalni query (`Tk`, `Tr`, `Te` gdje je primjenjivo);
- `objectTypeRegistryVersion`, semantic schema set i projection/reconstruction rules version;
- pokrivene authoritative partitions/streams i njihov exact immutable head/segment identity;
- exact included revision/event/transaction heads ili verifikabilni dependency manifest;
- poznate exclusions i obrazloženje;
- unknown/unsupported object types, schemas, references ili segments;
- completeness/validity rezultat i generation/validation time;
- parent frontier kada novi frontier proširuje raniji.

**Closed-world rule for a declared frontier:** Projection smije tvrditi `complete/current` samo ako je dokazano da su sve authoritative partitions u deklarisanom matter/scope-u pregledane do exact heads, da registry/rules razumiju sve relevantne record types i da nema neobrađenog required inputa. Pojava novog ili unknown `objectType`, segmenta, reference type-a ili schema version-a nakon/izvan frontier-a čini staru projekciju stale; ako je unutar deklarisanog frontier-a i potencijalno relevantna, projekcija je incomplete/unsupported, ne complete.

Frontier ne zahtijeva globalni monotoni sequence niti centralnu bazu. Fizička head/manifest/hash strategija ostaje Foundation Hardening odluka, ali mora dokazati coverage bez oslanjanja na directory listing order ili wall-clock time.

## 12. Transaction and recovery records

Svaka semantic logical transaction/Controlled Apply mora imati stable transaction/attempt identity i immutable record koji veže:

- pre-apply dependency frontier i expected exact targets;
- approved Change Set/Item revisions;
- authority/review validation result;
- semantic atomic groups i dependency closure;
- intended effects, actual resulting revisions/effects i item/group results;
- Apply Receipt i Semantic Events;
- projection invalidation/rebuild rezultat;
- recovery state/finding kada completion nije dokaziv.

Transaction record nije dozvola da se authoritative effect drži samo u journalu. Objavljeni effect mora biti rekonstruisiv iz Layers 1–2. Nepoznati physical completion proizvodi `RECOVERY_REQUIRED`; normal retry je blokiran.

## 13. Projection and index boundary

`projections/matter-state.json` i `.md` moraju sadržati projection identity, rules version, dependency frontier reference, generation time, completeness/validity/staleness i recovery/reconciliation flags. Markdown je human view istog declared projection-a, ne druga authority strana.

`index/matter.sqlite`, FTS, counters i lookup tables smiju sadržati samo rebuildable podatke ili kopije čiji authoritative source je eksplicitno referenciran. Brisanje cijelog `index/` mora biti podržan recovery scenario bez semantic data loss-a.

## 14. Manual edit and reconciliation boundary

Ručna izmjena immutable revision, sealed history segment, registry ili transaction record-a nije automatski prihvaćena revizija. Sistem mora razlikovati last accepted bytes/semantic content od externally observed content, označiti affected frontier/projection i zahtijevati reconciliation.

Human acceptance proizvodi novu canonical revision/event gdje je semantički ispravno; ne legalizuje in-place overwrite. Reject/resolve čuva observation i finding. Generated Markdown ili SQLite izmjena nikad ne mijenja Layer 1–2 authority i može biti odbačena rebuild-om, uz očuvanje korisničke ručne bilješke samo ako je eksplicitno izdvojena kao nonauthoritative input.

## 15. Schema and format evolution

Format i semantic schema imaju odvojene verzije:

- `recordFormat` verzionira common envelope/serialization contract;
- `schemaId/schemaVersion` verzionira payload ugovor za `objectType`;
- registry version određuje poznate types/reference types i schema mapping;
- rules version određuje projection/reconstruction semantics.

Major incompatibility ne smije biti silent-upgraded tokom čitanja. Migration je eksplicitna, auditabilna semantic/format operacija koja čuva originalni record ili dokazivu immutable pre-migration verziju. Import/migration ne dodjeljuje trust, approval ili applied status.

## 16. Backup and survivability

Smještanje pod `00 CONTROL/vla/` održava VLA authority unutar DOSSARA Control Backup granice Registra. Backup mora obuhvatiti Layers 1–2, registry/manifests potrebne za discovery i reconstruction, transaction/recovery/reconciliation records i po potrebi Layer 3 radi audit convenience-a. SQLite/FTS nije obavezan backup input.

Originalni evidence dokumenti ostaju predmet odvojenog Document Backup-a prema Registru. Backup kopija nije nova semantic revision niti dokaz currentness-a bez restore validation-a.

## 17. Rejected alternatives

| Alternativa | Razlog odbijanja |
|---|---|
| Markdown-only authority | krhko deterministic parsing/versioning/reference/audit ponašanje |
| jedan veliki mutable JSON po matter-u | veliki overwrite/conflict blast radius; slaba immutable exact revision granica |
| SQLite kao canonical authority | krši file-first i disposable-index invariant |
| generičke netipizovane ID liste | ne mogu dokazati target type, exactness ni future compatibility |
| timestamp-only frontier | ne dokazuje completeness, coverage ni unknown inputs |
| Event Sourcing kao jedini authority | nije potreban i nije propisan VLA-0E/VLA-1A |
| hidden `.dossara` authority van `00 CONTROL` | rizik propuštanja iz zaključane Control Backup granice |

## 18. Deferrals

Foundation Hardening ili kasniji technical WP mora odlučiti/testirati:

- canonical JSON serialization i Unicode/newline pravila;
- ID format/generator i collision testove;
- hash/canonical digest algoritam;
- schema registry i validator implementation;
- manifest/head/segment sealing i crash boundaries;
- atomic publication, fsync, staging i recovery mechanics;
- writer lease/locking i OneDrive behavior;
- SQLite schema/performance;
- migration tooling i backup/restore validation.

Nijedan deferral ne mijenja authority, `objectType`, typed reference ili dependency frontier contract.

## 19. VLA-1B architectural decision

VLA-1B bira structured JSON canonical revisions, sealed JSONL semantic/audit history, generated JSON/Markdown Matter State, disposable SQLite/FTS i matter-local `00 CONTROL/vla/` authority boundary. Common envelope obavezno nosi `objectType`; sve semantic veze su typed references; svaki projection/apply snapshot nosi dependency frontier koji dokazuje coverage i unknown-input stanje.

Ovaj rezultat je dovoljno precizan za Foundation Hardening bez zaključavanja OS-level write algoritma ili produkcijske implementacije.
