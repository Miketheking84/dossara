# WAC-1 — Canonical Matter Mutation Authority Closure

## 1. Document control and decision

| Field | Decision |
|---|---|
| Work package | WAC-1 — Canonical Matter Mutation Authority Closure |
| Date | 2026-08-18 |
| Branch | `spike/phase-0c-electron-forge-webpack` |
| Starting HEAD | `752d71c530c8febdba75bac490f129768c409935` |
| Starting condition | WRITE-1 outcome D — authority gap |
| Formal control act | `docs/dossara/decision-alignment-register-v1.2.md` |
| Work type | Documentation-only authority closure |
| Outcome | **GO — WAC-1 AUTHORITY CLOSED / WRITE-1 READY** |

WAC-1 closes the normative contract for mutation of an existing matter operational-control document. It does not select or implement a concrete Node/Windows replacement primitive, modify production code, create tests or accept the existing dirty writer.

The following terms are normative: **MUST**, **MUST NOT**, **SHALL**, **SHALL NOT**, **REQUIRED**, **CONFLICT** and **RECOVERY_REQUIRED**.

## 2. Scope and non-goals

WAC-1 governs mutation of:

```text
<matter>/00 CONTROL/command-center.md
```

for fields explicitly covered by the accepted command-center contract.

WAC-1 does not introduce:

- automatic or three-way merge;
- distributed locks or multi-machine writer arbitration;
- database transactions or SQLite authority;
- cloud coordination;
- UI or Matter Board implementation;
- operational active/waiting/actionable/due semantics;
- general-purpose document versioning;
- production code or a production acceptance decision.

## 3. Authority model

### 3.1 Current operational authority

For V1, `command-center.md` remains a human-readable, human-editable, file-first **authoritative current operational control document** for fields covered by its contract. It is not a disposable projection and MUST remain usable without the application.

Manual editing remains permitted. The application MUST treat the exact bytes it finds on disk as the currently observed operational document and MUST NOT silently restore older application state over them.

### 3.2 Immutable authority and currentness proof

`command-center.md` MUST NOT be the only historical or mutation evidence. Every application-accepted baseline and every successful application mutation MUST be represented by an immutable structured revision and transaction evidence under the accepted VLA-1B envelope/history model.

The healthy-state invariant is:

```text
SHA-256(exact command-center.md bytes)
  == resultingContentHash of the current successful Matter Control Revision/Receipt
```

The Markdown file is authority for the current human-operational content. The immutable revision chain is authority for exact historical bytes, lineage and application-recognized currentness. Neither SQLite nor UI-cached state is authority.

When current Markdown bytes differ from the last successful revision/receipt, the manual bytes are not overwritten or silently promoted into immutable history. The system records/detects an external-baseline mismatch and requires explicit review/acknowledgment before a later application mutation may use those bytes as its accepted base.

### 3.3 Compatibility with VLA-1B

This is not the rejected “Markdown-only authority” model. Each accepted revision stores the exact operational bytes in a structured immutable VLA envelope. Markdown remains the directly editable current document; structured revisions and receipts provide exact history and currentness proof.

## 4. Exact-byte read token

### 4.1 Token definition

The V1 read token is:

```text
readToken = "sha256:" + lowercaseHex(SHA-256(exact file bytes))
```

“Exact file bytes” includes every byte in the file, including:

- UTF-8 BOM when present;
- CRLF versus LF choices;
- trailing whitespace;
- blank lines;
- comments, manual notes and unknown content;
- final-newline presence or absence.

No semantic normalization occurs before hashing.

### 4.2 Read response

An edit-capable read MUST return at least:

- matter identity;
- canonical workspace-relative path;
- exact `readToken`;
- current recognized field values;
- last accepted Matter Control Revision identity when one exists;
- whether the bytes match that accepted revision;
- `EXTERNAL_CHANGE_DETECTED` when they do not.

### 4.3 Mutation request

Every mutation request MUST include:

- target matter identity and relative control-file path;
- `expectedReadToken`;
- actor/source identity;
- exactly declared fields/operations and proposed values;
- the last accepted revision identity observed by the caller, when available;
- explicit external-baseline acknowledgment when the read reported an external change.

The server MUST reread raw bytes and recalculate the token after it acquires the same-file writer serialization and immediately before transformation.

## 5. Conflict contract

V1 uses optimistic concurrency without automatic merge.

If the current exact-byte token differs from `expectedReadToken`:

- result is `CONFLICT`;
- canonical bytes remain untouched;
- no prepared resulting revision is published as current;
- no success receipt is written;
- a terminal conflict outcome is recorded for a structurally valid mutation attempt;
- API uses a stable conflict response, mapped to HTTP 409 when exposed through HTTP;
- caller must reload, review and submit a new request based on the new token.

Expected-hash protection remains mandatory even with intra-process Single Writer serialization.

### 5.1 Conflict decision table

| Current token | Expected token | External-baseline acknowledgment | Outcome |
|---|---|---|---|
| equal | equal | not needed when current revision matches | continue validation/transform |
| unequal | any older/different token | any | `CONFLICT`; no mutation |
| equal, but bytes differ from last accepted revision | equal | absent | `EXTERNAL_BASELINE_REVIEW_REQUIRED`; no mutation |
| equal, but bytes differ from last accepted revision | equal | explicit and bound to same token | accept external baseline as a new immutable revision, then continue |
| malformed/missing token | n/a | n/a | `VALIDATION_FAILED`; no mutation |

Acknowledgment never means automatic merge. It means the user explicitly reviewed the exact externally changed bytes identified by the supplied token.

## 6. Lossless preservation grammar

### 6.1 Raw-byte and text validity

The writer reads a raw byte buffer first. A mutable command-center file MUST decode as strict UTF-8 without replacement characters. An optional UTF-8 BOM is allowed and preserved. The read token always covers the raw bytes.

### 6.2 Recognized field boundary

A field occurrence is recognized only when an exact accepted label begins a logical line and is followed by the contract separator `:`. For a targeted field:

- exactly one unambiguous occurrence is required, unless an accepted field-specific insertion rule exists;
- duplicate target labels are contradictory and block mutation;
- only the value span on the target line is replaced;
- the line-ending bytes are preserved;
- bytes before and after every targeted span remain byte-identical.

The V1 transformer MUST be surgical over a lossless source representation. It MUST NOT reconstruct the document solely from known fields.

### 6.3 Unknown and manual content

The following content is valid and MUST be preserved byte-for-byte when it is not the explicit mutation target:

- unknown labels and fields;
- continuation lines;
- manual paragraphs and notes;
- comments and headings;
- legacy labels and values;
- blank lines and section spacing;
- newline style and final-newline state;
- unknown Matter Type values;
- missing optional fields.

Unknown content alone never makes the file invalid.

### 6.4 Field insertion

Missing fields MUST remain missing during unrelated mutation. Insertion is allowed only when the request explicitly targets that field and an accepted deterministic anchor exists.

For Matter Type only, the V1 accepted insertion anchor is immediately after the unique `Oblast prava:` line. Missing or duplicate anchors cause `VALIDATION_FAILED`; the writer MUST NOT guess another location.

### 6.5 Multi-field requests

A request may declare one or more fields only when every field has an independent unambiguous mutation span and all transformations form one expected-token-bound atomic group. Undeclared fields MUST remain unchanged. Partial application of declared fields is forbidden.

## 7. Invalid-file criteria

Mutation fails closed when any of the following holds:

- target is missing, not a regular file or is a symlink/reparse target outside the accepted safe-path contract;
- target/parent containment cannot be proven;
- file exceeds the accepted maximum size;
- bytes are not valid strict UTF-8 under section 6.1;
- current token differs from `expectedReadToken`;
- targeted label occurs more than once;
- target boundary or required insertion anchor is absent/ambiguous;
- parser cannot identify every declared mutation span without touching unrelated bytes;
- request contains unknown operations/fields or invalid new values;
- accepted revision/frontier state is inconsistent or recovery is pending.

Unknown manual content, a legacy unknown Matter Type or a missing optional Matter Type does not by itself make the file invalid.

## 8. Matter Type preservation

MTC-1 remains controlling:

- `Vrsta predmeta: Nasljedno pravo` is a readable `LEGACY_UNKNOWN` value;
- unrelated mutation MUST preserve its exact bytes and value;
- missing Matter Type MUST remain missing and MUST NOT become `Drugo`;
- replacing Matter Type is a separately declared explicit mutation;
- a newly selected Matter Type MUST belong to the accepted 14-value vocabulary;
- an explicit Matter Type replacement may replace a legacy unknown only through the user-requested field operation.

Read-preserve and validate-new-value are distinct rules.

## 9. Single Writer semantics

V1 requires an in-process keyed serialization boundary for mutation of the same canonical control file.

- Key is the normalized safe canonical target identity, not a user-supplied raw path.
- At most one mutation for the same key may execute the reread-through-receipt critical section at a time.
- Independent matters may execute independently when their safety/recovery state allows it.
- Queue acquisition MUST NOT reuse a stale read token.
- After acquiring the key, the server MUST reread and compare the expected token.

This is not a distributed lock and does not solve multi-machine coordination. External/manual edits and stale UI requests are still protected by exact-byte expected tokens.

## 10. Immutable revision and transaction evidence

### 10.1 Existing envelope reuse

WAC-1 uses the accepted VLA-1B `CanonicalEnvelope`; it does not define a parallel persistence envelope. Concrete JSON schemas and registry entries remain implementation artifacts to be proposed in WRITE-1 and reviewed against this contract.

The following conceptual record types are locked:

1. `MATTER_CONTROL` — immutable exact content revision;
2. `MATTER_CONTROL_MUTATION_ATTEMPT` — durable mutation intent/baseline;
3. `MATTER_CONTROL_MUTATION_OUTCOME` — terminal non-success or recovery outcome;
4. `MATTER_CONTROL_MUTATION_RECEIPT` — successful verified publication/currentness evidence.

If a mutation is initiated by a VLA Controlled Apply, its Matter Control receipt MUST link to the controlling Change Item and Apply Receipt. A direct human operational edit uses a Matter Control Mutation Receipt and MUST NOT falsely claim Change Set approval.

### 10.2 Matter Control Revision

Every accepted baseline and proposed resulting revision MUST contain at least:

- matter identity;
- stable Matter Control object identity;
- new opaque exact `revisionId` and previous revision reference;
- `recordedAt`, actor/source and generator type;
- canonical workspace-relative file path;
- content encoding;
- exact content bytes in a lossless representation, such as base64;
- exact previous and resulting SHA-256 tokens;
- explicitly changed field keys;
- operation purpose/source;
- transaction/mutation identity.

Storing exact bytes makes historical reconstruction independent of mutable current Markdown.

### 10.3 Attempt and terminal outcome

After basic request shape/identity validation and before canonical publication, the system writes an immutable attempt/intent bound to:

- mutation/attempt identity;
- target matter/path;
- actor/source;
- expected token and observed accepted revision;
- requested field operations;
- transaction time;
- recovery/idempotency identity.

An attempt may terminate as:

- `SUCCESS`;
- `CONFLICT`;
- `VALIDATION_FAILED`;
- `IO_FAILED`;
- `RECOVERY_REQUIRED`.

Structurally unreadable network requests that cannot identify a safe matter/operation need not create authoritative attempts. Once a durable attempt exists, its terminal outcome is append-only and linked; the intent is never rewritten.

### 10.4 Success receipt

A Matter Control Mutation Receipt exists only after:

1. canonical publication completed;
2. final bytes were reread;
3. final token equals the prepared revision token;
4. prepared exact revision and transaction identities are valid.

The receipt contains at least:

- mutation/attempt identity;
- matter, path, actor/source and time identities;
- previous/current revision identities;
- previous/resulting tokens;
- changed fields;
- publication and final-verification result;
- derived/index result;
- exact API-level result;
- recovery references when applicable.

The receipt marks the prepared Matter Control Revision current. A prepared revision without a success receipt is immutable but not current.

## 11. Logical mutation order

The required V1 order is:

1. resolve safe matter/control target and acquire same-file Single Writer key;
2. validate request shape, actor/source, operation and new values;
3. reread raw canonical bytes and validate file/path/size/encoding;
4. calculate current token and compare `expectedReadToken`;
5. compare current bytes with last accepted revision and require explicit external-baseline acknowledgment when needed;
6. losslessly parse and prove every declared mutation boundary;
7. allocate stable mutation/attempt/idempotency identity;
8. durably write immutable attempt/intent;
9. when explicitly acknowledged, write an immutable accepted external-baseline revision/outcome before using manual bytes as mutation base;
10. construct new bytes through surgical transformation;
11. write the prepared immutable resulting Matter Control Revision; it is not yet current;
12. exclusively create a unique same-directory temp file;
13. write complete bytes, flush file buffers, close the temp handle and verify staged bytes/token;
14. publish through the WRITE-1-proven Windows replacement primitive;
15. reread final target and verify exact resulting token;
16. write the immutable success receipt that marks the prepared revision current;
17. update/invalidate/rebuild derived state;
18. write/link derived result and return the precise API result;
19. release the same-file writer key.

No success may be returned before step 16. Derived failure after step 16 does not reverse canonical truth.

## 12. Windows publication semantics

WAC-1 locks observable semantics, while WRITE-1 must prove the concrete primitive on the supported Windows/Node stack.

The publication primitive MUST demonstrate:

- same-directory exclusive temporary creation;
- complete write and file-buffer flush before publication;
- temp close before replacement when required by the selected API;
- replacement of an existing regular target without an observable missing-target window under supported conditions;
- original canonical target remains intact when replacement fails before commit;
- precise classification when completion cannot be proven;
- no success before final reread and token verification;
- deterministic handling of remaining temp/recovery artifacts.

Plain `rename()` is neither accepted nor rejected by WAC-1. WRITE-1 must prove that the selected Node/native mechanism satisfies this semantic contract on supported Windows. If it cannot, WRITE-1 is NO-GO until a suitable primitive is approved.

## 13. Durability boundary

The minimum V1 claim is limited to what can be proven:

- prepared revision/attempt records required for recovery are durably written before canonical publication;
- complete temp content is flushed before publication;
- canonical bytes are reread and hash-verified after publication;
- success receipt is persisted before API success;
- derived status is persisted/linked before the final response.

WRITE-1 MUST document whether the selected Windows/Node stack can flush directory metadata or provide an equivalent replacement durability guarantee. If directory metadata durability cannot be proven, the accepted claim MUST explicitly retain that residual crash risk and MUST NOT use “fully durable.”

An indeterminate crash boundary is `RECOVERY_REQUIRED`, not success.

## 14. Publication failure table

| Stage | Failure | Canonical state | Required result |
|---|---|---|---|
| before durable attempt | request not accepted | unchanged | validation error; no mutation claim |
| after attempt, before prepared revision | unchanged | unchanged | terminal `IO_FAILED` or `VALIDATION_FAILED` |
| after prepared revision, before temp publication | unchanged; prepared revision not current | unchanged | terminal failure; orphan revision remains noncurrent |
| temp create/write/flush/verify | unchanged | unchanged | `IO_FAILED`; retain or controlled-clean temp per recovery policy |
| replacement reports failure before commit | original must remain | original | `IO_FAILED`; no receipt/index update |
| replacement completion is indeterminate | unknown until recovery | do not claim either version current | `RECOVERY_REQUIRED` |
| final reread/token mismatch | actual bytes preserved for recovery inspection | unverified | `RECOVERY_REQUIRED`; no success receipt |
| success-receipt write fails after verified publication | new canonical bytes may be committed; prepared revision exists | derived unchanged | `RECOVERY_REQUIRED`; recovery may finalize receipt from exact evidence |
| derived/index update fails after receipt | new canonical revision remains current | stale/rebuild required | canonical success with derived rebuild required |

## 15. Derived/index semantics

Derived UI, projections and indexes are never authority. They update only after canonical final verification and success receipt.

Allowed successful API results are:

- `CANONICAL_SUCCESS` — canonical revision/receipt verified and derived update succeeded or no derived update was required;
- `CANONICAL_SUCCESS_DERIVED_REBUILD_REQUIRED` — canonical revision/receipt verified, but rebuildable derived update failed or remains pending.

The system MUST NOT roll back or rewrite a verified canonical mutation only because a disposable index/projection update failed. It MUST mark the affected derived scope stale and provide a deterministic rebuild/reconciliation path.

## 16. Receipt decision table

| Canonical publication | Success receipt | Derived state | API result |
|---|---|---|---|
| not attempted due conflict/validation | absent | unchanged | `CONFLICT` or `VALIDATION_FAILED` |
| failed before commit | absent; terminal attempt outcome exists | unchanged | `IO_FAILED` |
| completion indeterminate | absent | not advanced | `RECOVERY_REQUIRED` |
| verified, receipt missing | recovery pending | not advanced | `RECOVERY_REQUIRED` |
| verified | valid and currentness-linked | updated/valid | `CANONICAL_SUCCESS` |
| verified | valid and currentness-linked | failed/stale | `CANONICAL_SUCCESS_DERIVED_REBUILD_REQUIRED` |

## 17. Startup and pre-mutation recovery

Recovery runs at startup and before a new mutation for a target with pending artifacts or nonterminal attempts.

Rules:

- an orphan temp is never auto-published merely because it exists;
- exact canonical bytes, immutable prepared revisions, attempts and receipts determine completion;
- hashes and identities, not timestamps or filename order, determine matching;
- a prepared revision is not current without a valid success receipt;
- recovery may finalize a missing receipt only when final canonical bytes exactly match the prepared revision and all transaction identities/preconditions are provable;
- ambiguous or contradictory evidence yields `RECOVERY_REQUIRED` and blocks new writes;
- cleanup never deletes the only evidence needed to determine completion.

### 17.1 Recovery decision table

| Canonical target | Temp | Prepared revision / attempt | Success receipt | Outcome |
|---|---|---|---|---|
| matches last successful receipt | absent | none pending | valid | clean; writes allowed |
| matches last successful receipt | orphan exists | no matching pending attempt | valid | never publish temp; quarantine/controlled cleanup |
| matches last successful receipt | exists | matching nonpublished attempt | absent | canonical unchanged; close attempt as failed/recovered, then cleanup |
| matches prepared resulting token | any | matching durable attempt + prepared revision | absent | verify all evidence; finalize receipt or `RECOVERY_REQUIRED` |
| matches prepared resulting token | any | missing/contradictory intent | absent | `RECOVERY_REQUIRED` |
| differs from last receipt, no pending attempt | any | none | older valid receipt | `EXTERNAL_CHANGE_DETECTED`; preserve bytes; require review |
| missing/unreadable | any | any | any | `RECOVERY_REQUIRED`; no heuristic recreation |
| receipt claims success but canonical hash differs | any | any | present | external change or corruption finding; block mutation pending review/recovery |
| multiple plausible prepared outcomes | any | conflicting | absent | `RECOVERY_REQUIRED` |

## 18. Manual-edit reconciliation boundary

V1 reconciliation is intentionally simple and has no automatic merge:

1. read detects exact-byte mismatch from the last accepted revision;
2. UI/API reports `EXTERNAL_CHANGE_DETECTED` and returns the new read token/content for review;
3. user reloads and explicitly acknowledges the exact token;
4. server rereads and verifies the same token;
5. immutable external-baseline revision/outcome captures the exact manual bytes;
6. a later declared field mutation may proceed from that accepted baseline.

Rejecting or postponing acknowledgment leaves manual bytes untouched and blocks application mutation. Acknowledgment does not assert legal truth; it accepts those exact bytes as the operational baseline for the requested edit.

## 19. Historical and temporal compatibility

Each accepted Matter Control Revision has a new exact revision identity and recorded context. Regular V1 operational mutation uses:

- `recordedAt` equal to the durable transaction record time;
- `knownAt` no later than receipt finalization and explicitly recorded when the schema distinguishes it;
- `effectiveAt` equal to the mutation’s declared effective context, defaulting to receipt/application time only when the field contract allows immediate effect.

No mutation rewrites an older revision or receipt. Historical reconstruction selects the currentness-linked immutable revision valid for the requested recorded/effective boundary and can retrieve its exact stored bytes. WAC-1 does not add operational active/waiting/actionable/due interpretation; VOC-1 and MVS-1 remain controlling for those semantics.

## 20. Baseline compatibility

| Accepted baseline | Compatibility result |
|---|---|
| Decision Register I12 | PASS — expected token, same-dir stage, flush, proven replace, final hash and derived update order are explicit |
| Decision Register I11 | PASS at V1 scope — in-process same-target serialization; no false distributed-lock claim |
| VLA-0D | PASS — expected baseline, attempt identity, prepared effect, receipt, no last-write-wins and recovery-required boundaries preserved |
| VLA-1A/1B | PASS — existing envelope, immutable exact revisions, typed records, audit/history and disposable derived index retained |
| FH-1 | PASS — immutable/digest concepts reused; its spike is not misrepresented as production mutable replacement |
| GPP-0 | PASS — prepared noncurrent revision and receipt/recovery currentness follow the accepted interrupted-apply proof pattern |
| VOC-1 / MVS-1 | PASS — mutation layer preserves neutral fields and does not infer operational semantics |
| MTC-1 / PCR-2 | PASS — legacy unknown and missing Matter Type preservation; explicit new value validation |
| WRITE-1 evidence | PASS — all ten listed authority decisions are closed normatively; technical proof remains required |

No direct baseline conflict was found. The owner decision that Markdown remains current operational authority is compatible because WAC-1 also requires exact structured immutable revisions/currentness receipts and does not treat Markdown as the only historical authority or as a generated disposable projection.

## 21. Remaining implementation questions, not authority gaps

WRITE-1 must experimentally determine and report:

- which concrete Node/native Windows replacement primitive satisfies section 12;
- actual `FileHandle.sync`/Windows buffer-flush behavior;
- whether directory metadata durability can be demonstrated and the exact residual crash claim;
- safe temp naming, ACL/attribute preservation and supported reparse/OneDrive behavior;
- concrete schema/registry serialization conforming to the locked conceptual record types;
- performance limits and recovery scanning boundaries.

Failure to prove a concrete primitive produces WRITE-1 NO-GO; it does not authorize weakening WAC-1.

## 22. WRITE-1 executable acceptance requirements

WRITE-1 is ready to resume as an isolated technical proof. It MUST demonstrate on the permitted test root:

1. normal expected-token-bound mutation;
2. manual edit after read returns `CONFLICT` and preserves newer bytes;
3. two app writers from one token allow only one success;
4. invalid/ambiguous current file fails closed;
5. legacy unknown Matter Type survives unrelated mutation;
6. missing Matter Type does not become `Drugo`;
7. unknown/manual/continuation content remains byte-identical outside target spans;
8. staged write/publication failures preserve or precisely recover canonical state;
9. post-write mismatch never returns success;
10. derived failure returns canonical success plus rebuild-required;
11. prepared revision without receipt remains noncurrent;
12. recovery finalizes only exact provable publication and blocks ambiguity;
13. same-file serialization plus expected token prevents stale overwrite;
14. exact historical bytes before and after mutation are reconstructible;
15. no test touches a real SDJ/OneDrive root.

WRITE-1 MUST remain independent of Matter Board UI and operational heuristic acceptance. Production integration requires a later separate review/commit decision.

## 23. Changed files and implementation boundary

WAC-1 creates only:

```text
docs/dossara/persistence/wac-1-canonical-mutation-authority.md
```

No production source, test, spike, Matter Board, Inbox, Client Profile, operational semantics, MVS-0 or accepted Matter Type file is modified. No commit is authorized by this documentation pass.

## 24. Final decision

```text
GO — WAC-1 AUTHORITY CLOSED / WRITE-1 READY
```

WRITE-1 may now resume as an isolated executable safety proof against this contract. It must stop again before production acceptance or commit and must not pull Matter Board/UI code into the proof for dependency convenience.
