# WAC-1A — V1 Concurrency Boundary Amendment Review

> **Successor status notice (post-ACA-1):** Sections 1–14 preserve the original WAC-1A NO-GO review that identified the authority conflict. Accepted ACA-1 commit `65af84bc95351a1a40877897889ee37270524d04` subsequently resolved that blocker. Sections 15–24 are the later controlling successor-closure record; the final current outcome is **GO — WAC-1A CLOSED / WRITE-1V READY**.

## 1. Document control and outcome

| Field | Value |
|---|---|
| Work package | WAC-1A — V1 Concurrency Boundary Amendment |
| Date | 2026-08-18 |
| Formal control act | `docs/dossara/decision-alignment-register-v1.2.md` |
| Accepted predecessor | WAC-1, commit `28d92d5469dc3f655b0326ba2dd20544ba75a3e0` |
| Accepted executable predecessor | WRITE-1E, commit `f79e7fa0eb9352b501f25f98b18b5719f842913d` |
| Work type | Documentation-only authority compatibility review |
| Outcome | **NO-GO — ACCEPTED BASELINE REQUIRES NATIVE CAS** |

The owner proposed that SDJ MIKE V1 not introduce native/oplock destination coordination and instead classify same-parent destination replacement during the active publication interval as an unsupported concurrent external mutation.

That product trade-off is understandable and technically precise, but it cannot be locked by a WAC-1 successor alone. The current formal baseline contains an unconditional no-silent-overwrite invariant. WRITE-1R2 proved that the proposed V1 primitive can overwrite a newer externally installed canonical object and return success. Locking the proposed boundary without first amending the controlling baseline would directly contradict that invariant.

This document preserves the owner proposal and the technical evidence. It does not silently reinterpret the accepted baseline, approve native/oplock work, or authorize production integration.

## 2. Technical evidence retained

The historical FSE-1, WRITE-1R and WRITE-1R2 findings remain valid and are not rewritten.

WRITE-1R2 established:

| Capability | Result |
|---|---|
| Trusted parent directory identity | **PASS** |
| Prepared source/temp object identity | **PASS** |
| Destination file-object compare-and-swap | **FAIL** |
| Junction/wrong-matter redirection | **Closed in the investigated local scenario** |
| 300-cycle local publication visibility | **300/300; zero ENOENT, hash mismatch, unexpected I/O or temp leftovers** |
| Stale manual edit before the accepted precondition | **CONFLICT; newer bytes preserved** |
| Two stale SDJ MIKE writers | **One success; the other conflict** |

The material residual race is:

1. canonical V1 satisfies the final accepted content/file-identity precondition;
2. an independent filesystem actor replaces V1 with newer V2 under the same valid trusted parent;
3. handle-relative publication replaces V2 with the prepared application source;
4. the mutation returns `CANONICAL_SUCCESS` after final reread verifies the application result.

This is a real silent overwrite of an externally installed newer canonical object. Parent and source continuity do not supply destination continuity.

## 3. Proposed owner decision

The proposed V1 product decision is:

- do not implement Windows oplock/native destination coordination in V1;
- retain a local, single-user, file-first application model;
- treat native destination coordination as a WRITE-V2/future-hardening candidate;
- support SDJ MIKE as the only automated writer;
- permit human editing between application save transactions;
- declare simultaneous external modification of the same canonical file during an active save transaction unsupported;
- keep OneDrive and sync-client environments blocked pending separate qualification.

This proposal is recorded, but **not authority-locked by WAC-1A** because of the baseline conflict below.

## 4. Baseline compatibility review

### 4.1 Decision Register I12 — blocker

The formal Register states:

- before overwriting a manually editable file, compare the current hash with the accepted/indexed hash;
- on mismatch, reparse or show conflict;
- a manual edit is never silently overwritten;
- the mandatory order includes expected-hash validation, same-folder temp, flush, platform-appropriate atomic replace and final hash verification;
- a solution that violates an invariant is a misunderstanding of the task, not permission to weaken the rule.

The language contains no exception for an external replacement occurring after the last hash check and before publication. The deterministic WRITE-1R2 race produces the forbidden result. Therefore the proposed unsupported-race boundary is incompatible with Register I12 as currently accepted.

### 4.2 WAC-1 — blocker unless explicitly superseded

WAC-1 requires the application to treat exact bytes on disk as the currently observed operational document and **MUST NOT** silently restore older application state over them. It also requires the server-side reread/token calculation immediately before transformation, conflict on mismatch, and no weakening of WAC-1 merely because a concrete primitive cannot be proven.

WAC-1 section 21 explicitly says that failure to prove a concrete primitive produces WRITE-1 NO-GO and does not authorize weakening WAC-1. A successor can amend WAC-1 only through an explicit accepted authority change, but it cannot by itself override the higher formal Register.

### 4.3 VLA-0 / VLA-1

VLA-0C and VLA-0D require manual-edit/expected-hash mismatch to stop overwrite/apply and require reconciliation. VLA-0D retains file-first, Single Writer, expected-state control, atomic write, recovery and no-silent-overwrite as mandatory. VLA-1A states that manual editing is permitted but silent semantic acceptance is forbidden. VLA-1B keeps externally observed state distinct until reconciliation.

These documents intentionally defer physical locking and Windows mechanisms, but they do not affirmatively authorize silent overwrite inside a declared publication interval. Their logical conflict and preservation requirements align with I12 and WAC-1.

### 4.4 FH-1 and GPP-0

FH-1 supplies integrity/digest and immutable-history foundations without claiming production cross-process publication. GPP-0 proves stale-base rejection and manual integrity-mismatch preservation in an isolated harness and expressly defers production atomic publication, locking, OneDrive and recovery mechanics.

They do not independently mandate an oplock implementation, but neither supplies authority to weaken I12/WAC-1.

### 4.5 WRITE-1E

WRITE-1E proves the accepted stale-editor invariant for its executable scenarios, including expected-token conflict, same-process writer serialization, verified final content and recovery evidence. Later WRITE-1R2 evidence narrows the unproven boundary; it does not retroactively invalidate WRITE-1E or make the demonstrated destination race acceptable.

### 4.6 MTC-1

MTC-1 remains compatible. The proposed concurrency decision does not change its 14-value vocabulary, single primary type, legacy-unknown preservation, missing-value behavior or absence of operational derivation.

### 4.7 Compatibility conclusion

| Baseline | Result |
|---|---|
| Decision Register I11 | Compatible with single supported automated writer; it is not a distributed-lock guarantee |
| Decision Register I12 | **DIRECT CONFLICT** — unconditional no-silent-overwrite rule |
| VLA-0C / VLA-0D | **Conflict risk** — manual/expected-state mismatch blocks overwrite and no-silent-overwrite remains mandatory |
| VLA-1A / VLA-1B | Compatible with manual baseline workflow; do not authorize the residual silent overwrite |
| FH-1 | Compatible but does not close or waive the race |
| GPP-0 | Compatible but explicitly defers physical concurrency/publication mechanics |
| WAC-1 | **DIRECT CONFLICT** unless explicitly amended after the Register is reconciled |
| WRITE-1E | Historical proof remains valid; acceptance boundary cannot be weakened implicitly |
| MTC-1 | Compatible |

Because at least Register I12 and WAC-1 directly conflict, WAC-1A cannot return GO in this scope.

## 5. Proposed V1 concurrency boundary — not locked

If the controlling authority is explicitly amended later, the intended boundary would be:

> SDJ MIKE is the only supported automated writer of canonical matter-control files. Human editing is supported between save transactions. Simultaneous external mutation or replacement of the same canonical file during an active SDJ MIKE mutation/publication transaction is unsupported in V1.

This text is a recorded proposal, not the current accepted operating contract.

## 6. Guarantees that the proposal retains

Any later authority amendment and executable acceptance must retain:

1. exact-byte `expectedReadToken`;
2. server-side reread and hash comparison;
3. stale read/manual edit before the accepted precondition produces `CONFLICT` with no overwrite;
4. in-process same-target Single Writer and one-success/remaining-conflict behavior;
5. trusted-parent identity and junction/reparse protection;
6. verified prepared-source handle binding;
7. lossless preservation of unrelated, manual, unknown and legacy bytes;
8. same-directory exclusive temp creation, complete write, sync and staged hash verification;
9. continuous target visibility in the qualified local environment;
10. final canonical reread and exact result-hash verification before success;
11. immutable baseline/revision/attempt/outcome/receipt currentness evidence;
12. fail-closed `RECOVERY_REQUIRED` semantics where completion is indeterminate;
13. no automatic merge or heuristic recovery.

The proposal is not permission for blind or last-write-wins overwrite.

## 7. Explicit excluded race — proposed only

The proposed exclusion is limited to an independent filesystem actor replacing the destination canonical object under the same valid trusted parent after the last accepted precondition verification and before canonical publication.

It must be labeled:

```text
unsupported concurrent external mutation during active save transaction
```

It must not be described as solved, impossible or protected by expected hash alone. The WRITE-1R2 vulnerability reproduction must remain part of the audit trail.

## 8. Manual-edit semantics

The supported manual-edit workflow proposed by the owner remains consistent with existing baseline rules outside the residual interval:

1. the user finishes and saves the manual edit;
2. the application reads the new exact bytes and returns a new token;
3. an external-baseline mismatch is explicitly reviewed and accepted as a new immutable baseline;
4. a later application mutation uses that accepted token/revision;
5. if the file changed after UI read but before server-side precondition verification, the save returns `CONFLICT`;
6. no automatic merge occurs.

This workflow remains required regardless of the WAC-1A outcome.

## 9. OneDrive restriction

**OneDrive remains BLOCKED.**

A sync client can act as an additional writer and namespace actor. Neither this review nor the proposed local V1 boundary qualifies a real SDJ/OneDrive root. A separate synced-filesystem qualification and explicit owner acceptance remain required.

## 10. FIELD restriction

FIELD-1A is not ready from this document alone. The proposed sequence remains conditional on:

1. a compatible accepted authority amendment;
2. executable WRITE primitive acceptance against that authority;
3. local NTFS FSE qualification;
4. WRITE-PROD-1 API integration acceptance;
5. use only of copies/de-identified matters under `C:\SDJ_TEST\SDJ_LEGAL_TEST\`.

Real SDJ and OneDrive workspaces remain prohibited.

## 11. Future native/oplock path

The non-implemented future-hardening placeholder is:

```text
WRITE-V2 — Native Destination Coordination
```

Possible scope includes Windows oplocks, asynchronous break coordination, destination-object lifecycle and stronger cross-process CAS semantics. WAC-1A does not authorize implementation or make it part of the V1 critical path.

## 12. Required authority action before reconsideration

If the owner still chooses the proposed product boundary, the next action must be a separately authorized amendment of the formal control baseline, at minimum:

- Decision Register I12's unconditional no-silent-overwrite language and write sequence;
- WAC-1 sections 3, 4, 5, 11, 12, 21 and 22 as affected;
- any VLA-0D/VLA-0C no-silent-overwrite statement whose intended scope is also being narrowed.

That amendment must state the unsupported interval plainly, preserve all retained guarantees, keep OneDrive blocked, and explain why the accepted product risk is appropriate. WAC-1A can be reconsidered only after that higher-order authority reconciliation.

## 13. Scope and changed files

This review creates only:

```text
docs/dossara/persistence/wac-1a-v1-concurrency-boundary.md
```

No executable proof, production source, Matter Board, API, OneDrive, FIELD, WAC-1, Register or historical FSE/WRITE evidence is modified. No staging or commit is authorized.

## 14. Final decision

```text
NO-GO — ACCEPTED BASELINE REQUIRES NATIVE CAS
```

This means the currently accepted baseline still requires a mechanism strong enough to prevent the proven destination replacement overwrite. It does not force native/oplock architecture forever; the owner may instead explicitly amend the controlling authority in a separately scoped decision.

STOP. Do not begin WRITE-1V, FSE-1A, WRITE-PROD-1, FIELD-1A or native/oplock implementation.

## 15. Post-ACA-1 successor closure control

| Field | Value |
|---|---|
| Closure work package | WAC-1A — Successor Closure After ACA-1 |
| Closure date | 2026-08-18 |
| Original WAC-1A outcome | **NO-GO — ACCEPTED BASELINE REQUIRES NATIVE CAS** |
| Accepted WAC-1 | `28d92d5469dc3f655b0326ba2dd20544ba75a3e0` |
| Accepted WRITE-1E | `f79e7fa0eb9352b501f25f98b18b5719f842913d` |
| Accepted ACA-1 | `65af84bc95351a1a40877897889ee37270524d04` |
| ACA-1 status | **GO — ACA-1 V1 AUTHORITY AMENDMENT ACCEPTED** |
| Current WAC-1A outcome | **GO — WAC-1A CLOSED / WRITE-1V READY** |

The original NO-GO in sections 1–14 remains valid historical evidence: at that time, accepted Register I12 and WAC-1 wording required a stronger concurrency guarantee than WRITE-1R2 could prove. ACA-1 was the explicit authority action required by section 12. Its acceptance resolves that authority blocker without changing the historical technical evidence.

This successor closure introduces no new product decision. It reads WAC-1 and accepted ACA-1 together and confirms that they now form one unambiguous, executable V1 canonical-mutation contract.

## 16. Authority precedence

The controlling relation is:

```text
WAC-1
  controls every canonical-mutation requirement
except the exact V1 external-concurrency interval amended by
ACA-1
  which is the later controlling successor for that narrow boundary.
```

ACA-1 supersedes only earlier wording that required V1 to guarantee kernel-level destination-object compare-and-swap against an independent external replacement occurring after the last valid precondition and before publication completion.

All other WAC-1 requirements remain fully controlling, including exact-byte tokens, lossless transformation, immutable evidence, recovery, final verification, application Single Writer and the complete mutation order. The original Register, VLA and WAC-1 documents remain historical authority artifacts and are not rewritten.

## 17. Final executable V1 write contract

WRITE-1V must prove the combined WAC-1 + ACA-1 contract below.

### 17.1 Expected-state and application concurrency

1. Every edit-capable read returns the exact-byte `expectedReadToken`/read token required by WAC-1.
2. The server acquires the normalized same-target application Single Writer boundary and rereads the exact canonical bytes.
3. Every detected expected-token, accepted-revision, path/identity or recovery mismatch fails closed.
4. A stale UI or completed manual edit observable before the final accepted mutation precondition produces `CONFLICT` or the applicable external-baseline/reconciliation result, with no canonical overwrite.
5. Two application requests based on the same initial token cannot both succeed: at most one succeeds and every later stale request conflicts.
6. Final verification is a postcondition and never substitutes for expected-state validation.

### 17.2 Lossless transformation and manual content

1. Mutation is targeted and surgical over exact bytes.
2. Unrelated fields, headings, comments, continuation lines, whitespace, newline convention and final-newline state remain byte-identical.
3. Unknown, manual and legacy content is preserved unless it is the explicitly authorized mutation target.
4. Legacy unknown Matter Type is preserved during unrelated mutation; missing Matter Type does not become `Drugo`.
5. Ambiguous, duplicate or invalid target boundaries fail closed; there is no guessed rewrite or automatic merge.

### 17.3 Namespace, parent and source identity

1. Canonical matter/path containment must be proven.
2. Junction/reparse redirection, parent substitution and wrong-matter publication are prohibited.
3. The publication target is resolved relative to the held trusted-parent identity.
4. Publication uses the verified prepared source object and cannot be redirected by later source-path substitution.
5. Parent/source identity discontinuity is safe non-success or recovery-required, never canonical success.

### 17.4 Staging, publication and verification

1. Use a unique, exclusively created, same-directory temp.
2. Write the complete proposed bytes, flush/sync the file, close where required and cold-verify the staged token.
3. Publish with the locally qualified platform-appropriate primitive and bounded, explicit contention behavior.
4. Supported local publication must preserve continuous canonical-path visibility: zero `ENOENT`, partial-read and result-hash mismatch observations in the accepted stress boundary.
5. Reread final canonical bytes and require the exact prepared result token before any success.
6. Publication failure, indeterminate completion or final mismatch must preserve evidence and return `IO_FAILED` or `RECOVERY_REQUIRED` as applicable.

### 17.5 Immutable evidence, recovery and derived state

1. Every accepted baseline and resulting exact content has an immutable Matter Control Revision.
2. Mutation attempt, prepared revision, terminal outcome and success receipt remain append-only/currentness-linked evidence.
3. A prepared revision without a success receipt is not current.
4. No success is returned before canonical publication, final reread/hash verification and the required immutable receipt.
5. Recovery uses exact hashes, identities and durable records; it never guesses from timestamps or orphan filenames.
6. Unknown completion blocks normal retry and remains `RECOVERY_REQUIRED`.
7. Derived/index state is rebuildable and never authority.
8. Derived/index failure after verified canonical receipt does not roll back canonical truth; it returns the accepted canonical-success/rebuild-required result.

## 18. Accepted V1 limitation

The accepted operating-boundary classification is:

```text
UNSUPPORTED_CONCURRENT_EXTERNAL_MUTATION_DURING_ACTIVE_SAVE
```

An independent external actor replacing or mutating the same canonical destination object under the same valid trusted parent after the last accepted expected-state/file-identity precondition and before completion of application publication is not a supported V1 concurrency scenario.

V1 does not claim kernel-level destination-object CAS against that actor. The residual race is not technically eliminated, is not converted into a protected workflow and is not a blocker that WRITE-1V must close. WRITE-1V must instead retain the race as documented negative capability evidence and must not claim stronger cross-process protection.

This accepted limitation does not permit blind overwrite, known-stale overwrite, last-writer-wins behavior, omission of server reread/token checks, omission of parent/source identity, pathname redirection, loss of unrelated content, omission of final verification or success without immutable currentness evidence.

## 19. Manual-edit semantics

`command-center.md` remains human-readable and human-editable.

| Manual-edit timing | V1 contract |
|---|---|
| Completed between application save transactions | Supported; application rereads exact bytes and returns a new token |
| Differs from last accepted revision | Requires explicit external-baseline review/acceptance before later successful application mutation |
| Already present before final mutation precondition | Must be detected; stale token produces `CONFLICT`; manual bytes remain untouched |
| Occurs during the active publication interval | Unsupported concurrent external mutation; no kernel-level CAS claim |
| Automatic/three-way merge | Prohibited in V1 |

The supported manual workflow is reload, review, accept the exact new baseline where required, and submit a new expected-token-bound mutation. There is no retry over conflict using stale application state.

## 20. Register and VLA compatibility after ACA-1

| Authority | Post-ACA-1 result |
|---|---|
| Register I11 | **PASS** — one application-controlled writer remains mandatory; it is not misrepresented as a distributed external lock |
| Register I12 | **PASS** — ACA-1 I12-A is the accepted narrow successor; expected-state, staging, sync, publication and final verification remain mandatory |
| VLA-0C | **PASS** — detected manual changes remain stale/conflict/reconciliation inputs; older projection cannot knowingly overwrite them |
| VLA-0D | **PASS** — expected-state, Single Writer, no last-write-wins, semantic atomicity and recovery remain intact for supported operations |
| VLA-1A | **PASS** — manual/external reconciliation, logical atomicity and unknown-completion rules remain; process/OneDrive concurrency and locks were deferred |
| VLA-1B | **PASS** — immutable authority/currentness and reconciliation remain; physical atomic publication and OS locking were deferred |
| WAC-1 | **PASS with ACA-1 successor precedence** — every unaffected section remains controlling; only the external destination-CAS interval is narrowed |

The previous formal conflict no longer remains. Accepted ACA-1 is the explicit normative amendment, so this closure does not reopen or redetermine the V1 native-CAS product decision.

## 21. WRITE-1R and WRITE-1R2 interpretation

FSE-1, WRITE-1R and WRITE-1R2 remain investigation evidence, not accepted production code by implication.

Their continuing authority/evidence value is:

- proof of trusted-parent identity protection;
- proof of verified-source object binding;
- proof against the reproduced junction/wrong-matter redirection;
- local continuous-visibility evidence with zero missing-target/hash-mismatch results in the reported 300-cycle run;
- proof that normal stale manual edits and application writers retain conflict behavior;
- proof that destination-object CAS remains absent;
- technical reason ACA-1 was necessary.

Removal of the authority blocker does not productionize the current investigation candidate. WRITE-1V still requires a separate scoped executable review, acceptance decision and later commit boundary.

## 22. Remaining environment and implementation gates

### 22.1 OneDrive

**NOT QUALIFIED / BLOCKED.** A sync client can be an additional external writer/namespace actor and may operate inside the unsupported interval. ACA-1 and this closure do not qualify a real SDJ/OneDrive root.

### 22.2 FIELD-1A

**NOT YET AUTHORIZED.** Before FIELD-1A:

1. this WAC-1A closure must receive its separate owner acceptance;
2. WRITE-1V must accept a V1 mutation primitive against WAC-1 + ACA-1;
3. FSE-1A must qualify the local NTFS environment;
4. WRITE-PROD-1 must accept the API integration;
5. FIELD work must use only copies/de-identified matters under `C:\SDJ_TEST\SDJ_LEGAL_TEST\` until separately authorized.

The real SDJ and OneDrive workspaces remain prohibited.

### 22.3 Native hardening

`WRITE-V2 — Native Destination Coordination` remains an optional future-hardening track for oplocks, asynchronous break coordination and stronger cross-process protection. It is not in the V1 critical path and is not authorized by this closure.

## 23. Changed-file and commit boundary

This successor closure modifies only:

```text
docs/dossara/persistence/wac-1a-v1-concurrency-boundary.md
```

It does not modify ACA-1, WAC-1, Register/VLA artifacts, historical technical evidence, executable code, production source, Matter Board, API, OneDrive or FIELD. No commit is authorized by this documentation review.

## 24. Current final outcome and recommendation

```text
GO — WAC-1A CLOSED / WRITE-1V READY
```

WAC-1 + accepted ACA-1 now provide an unambiguous executable V1 mutation authority contract. Recommended next action: a separate owner acceptance/identity decision for this updated WAC-1A closure record. Only after that acceptance should WRITE-1V begin as a separately scoped executable acceptance work package.

STOP. Do not begin WRITE-1V, FSE-1A, WRITE-PROD-1, FIELD-1A or native/oplock implementation automatically.
