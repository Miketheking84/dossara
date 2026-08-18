# ACA-1 — V1 External-Concurrency Authority Amendment

## 1. Document control and outcome

| Field | Value |
|---|---|
| Work package | ACA-1 — V1 External-Concurrency Authority Amendment |
| Date | 2026-08-18 |
| Formal baseline | `docs/dossara/decision-alignment-register-v1.2.md` |
| Accepted WAC-1 | `28d92d5469dc3f655b0326ba2dd20544ba75a3e0` |
| Accepted WRITE-1E | `f79e7fa0eb9352b501f25f98b18b5719f842913d` |
| Trigger | WAC-1A NO-GO — accepted baseline required stronger concurrency guarantee |
| Work type | Documentation-only normative successor amendment |
| Outcome | **GO — ACA-1 V1 AUTHORITY AMENDMENT READY** |

ACA-1 records the owner's explicit product and architecture decision that SDJ MIKE V1 will not introduce a Windows native/oplock destination-CAS subsystem. It narrowly amends the accepted authority chain for one proven external-concurrency interval. It does not remove the no-blind-overwrite or no-known-stale-overwrite principles.

ACA-1 is **ready for a separate owner acceptance decision**. It does not become accepted authority merely because this review is GO, and it does not authorize executable or production work before acceptance and the later WAC-1A successor closure.

## 2. Owner decision

For V1:

1. SDJ MIKE is the only supported application-controlled automated writer of a canonical matter-control file.
2. Human/manual editing remains supported between application save transactions.
3. Application-controlled requests for the same canonical file remain serialized and expected-state protected.
4. Independent external mutation or replacement of that same canonical file during an active application save/publication transaction is outside the supported V1 writer model.
5. V1 does not claim kernel-level destination-object compare-and-swap against that unsupported actor.
6. Native/oplock destination coordination is deferred to a possible WRITE-V2 hardening track.
7. OneDrive and other synced-filesystem environments remain unqualified and blocked.

This is a bounded V1 product contract, not a claim that the residual filesystem race is impossible or technically solved.

## 3. Technical evidence requiring the amendment

Historical FSE-1, WRITE-1R and WRITE-1R2 evidence remains valid and is not rewritten.

WRITE-1R2 proved:

| Proof boundary | Result |
|---|---|
| Trusted parent identity | **PASS** |
| Prepared source/temp identity | **PASS** |
| Junction/reparse/wrong-matter redirection protection | **PASS in the qualified local scenarios** |
| Source-path substitution protection | **PASS** |
| Stale manual edit observable before the publication precondition | **CONFLICT; newer bytes preserved** |
| Two stale application writers | **One success; one conflict** |
| Local 300-cycle publication visibility | **300/300; zero ENOENT, hash mismatch, unexpected I/O or temp leftovers** |
| Destination-object CAS after the last precondition | **FAIL** |

The deterministic residual sequence is:

1. canonical V1 satisfies the last expected-state/file-identity verification;
2. an independent actor installs canonical V2 under the same valid trusted parent;
3. before application publication completes, the handle-relative source rename replaces V2;
4. final reread verifies the application result and the current prototype returns success.

The race is real. ACA-1 changes the supported V1 writer model rather than mischaracterizing this result as a successful destination CAS.

## 4. Scope of amendment and successor precedence

When separately accepted, ACA-1 supersedes earlier authority wording **only** for this question:

> Does V1 guarantee protection against an independent external actor replacing the same destination canonical object after the last valid expected-state/file-identity precondition and before completion of the active application publication transaction?

The amended answer is **no; that concurrent external operation is outside the supported V1 writer model**.

Original Register, VLA and WAC-1 artifacts remain historical authority evidence. They are not edited or rewritten. For the narrow boundary above, an accepted ACA-1 is the later controlling successor. Every unrelated invariant and every retained guarantee in this document continues unchanged.

ACA-1 does not supersede:

- no blind overwrite;
- no knowingly stale-state overwrite;
- expected-state conflict before mutation;
- manual-edit reconciliation;
- Single Writer for application-controlled requests;
- semantic atomicity and immutable audit/currentness evidence;
- parent/source identity and safe-path requirements;
- failure/recovery classification;
- OneDrive prohibition pending qualification.

## 5. Affected-authority amendment matrix

| Authority | Existing rule | Proposed amendment | Retained guarantee | Reason |
|---|---|---|---|---|
| Register I12 | Current hash is checked before overwrite; mismatch reparses or conflicts; manual edit is never silently overwritten; same-folder temp, flush, platform-appropriate atomic replace and final hash are mandatory | Limit the V1 guarantee to application-controlled writers and external/manual changes observable before the final mutation precondition; classify independent same-destination replacement during the active publication interval as unsupported V1 concurrency | Exact expected hash, fail-closed mismatch, staging/flush, safe publication, final hash, no blind or known-stale overwrite | Windows rename supports replacement and handle-relative parent resolution but no destination-file-ID CAS precondition |
| Register I11 | Single Writer is mandatory but is not a distributed lock; concurrent devices and delayed/offline lease visibility remain constrained | Clarify that V1's supported writer set is one application-controlled writer plus manual edits between transactions, not concurrent external mutation during save | Same-file application serialization and read-only/lease discipline remain | The amendment is consistent with I11's non-distributed-lock boundary |
| VLA-0C §25 | Manual changes must be detectable; application must not overwrite a manually changed authority merely because it has an older projection; expected-hash mismatch blocks and reconciles | “Must not overwrite” remains absolute for a known/observable mismatch; concurrent external replacement inside the unsupported interval is outside the V1 operation contract, not an accepted reconciliation path | Manual editing, detection, stale/incomplete/invalid projection and reconciliation remain | VLA-0C defines logical protection but does not select a kernel CAS mechanism |
| VLA-0D §§4, 11 | File-first, Single Writer, expected-state, atomic write, recovery and no-silent-overwrite are mandatory; manual edit/hash mismatch blocks; no last-write-wins | Preserve all rules for supported writers and observable preconditions; add the exact unsupported external interval and prohibit describing it as solved | No last-write-wins, stale item block, expected-state and semantic atomicity remain | VLA-0D separates semantic atomicity from technical write mechanics and defers locking/atomic-write implementation |
| VLA-1A §§7, 9, 17 | External/manual observations require reconciliation; unresolved mismatch blocks apply; unknown completion is recovery-required; locks/process/OneDrive concurrency are deferred | No change to reconciliation or recovery; clarify that V1 does not coordinate a new external write begun inside the active publication interval | Accepted vs observed separation, human disposition, logical atomicity and recovery remain | VLA-1A explicitly defers process/OneDrive concurrency and physical rename/locking choices |
| VLA-1B §§3, 14, 18 | Manual in-place changes are not accepted revisions; atomic rename/fsync/locking and OneDrive concurrency are deferred | No storage-authority change; carry the same unsupported interval into later technical qualification | Immutable revisions, typed records, currentness, reconstruction and manual inspection remain | The selected persistence architecture does not make native destination CAS a non-waivable feature |
| WAC-1 §§3–5 | Exact disk bytes are current observed content; expected token is mandatory; mismatch is conflict; older application state must not silently replace current bytes | Limit the executable promise to states observable at the last valid precondition and application-controlled concurrency; retain conflict for every detected mismatch | Exact-byte token, server reread, conflict, external-baseline review and no automatic merge remain | WAC-1's prior wording exceeded the V1 mechanism proven by WRITE-1R2 |
| WAC-1 §§9, 11 | Same-target application requests are serialized; server rereads after acquisition; logical order leads through publication and receipt | Keep unchanged; explicitly state that Single Writer does not serialize an independent external actor | One-success/remaining-conflict behavior and full mutation order remain | This is already the proven application-controlled concurrency model |
| WAC-1 §§12, 21, 22 | WRITE must prove Windows publication semantics; failure to prove the prior contract is NO-GO and cannot silently weaken WAC-1 | ACA-1 is the explicit authority amendment that WAC-1A found necessary; successor WAC-1A must bind acceptance criteria to the amended supported-writer model | Continuous visibility, failure integrity, final verification, recovery and all existing executable cases remain | The contract is being changed transparently by owner authority, not weakened by implementation convenience |

No unrelated domain, authority, temporal, provenance, Matter Type or operational-semantics rule is amended.

## 6. Amended Register I12 wording

Upon ACA-1 acceptance, the following is the controlling V1 clarification/successor text for Register I12:

> **I12-A — V1 application-controlled mutation and external-concurrency boundary**
>
> Application-controlled mutation of an existing canonical file MUST verify the expected exact-byte state after acquiring its same-file Single Writer boundary and immediately before constructing and publishing the mutation. Every detected expected-state mismatch MUST fail closed as conflict or reconciliation-required. SDJ MIKE MUST NOT knowingly overwrite a stale or externally modified canonical state.
>
> V1 guarantees this protection for application-controlled writers and for external/manual modifications observable before the final accepted mutation precondition. Two application requests based on the same initial token MUST NOT both succeed.
>
> V1 supports human/manual editing between application save transactions. A completed manual edit MUST receive a new exact-byte read token and, where it differs from the last accepted revision, MUST pass external-baseline review before a later successful application mutation.
>
> Independent external mutation or replacement of the same canonical destination object while an application save/publication transaction for that file is active is outside the supported V1 writer model. If such an actor replaces the destination after the last valid expected-state/file-identity verification but before publication completes, V1 does not claim kernel-level destination-object compare-and-swap protection. Stronger cross-process protection requires a separately accepted native destination-coordination architecture.
>
> This limitation MUST NOT be interpreted as permission for blind overwrite, last-writer-wins behavior, omission of the expected-token/server-reread precondition, pathname redirection, junction/reparse or parent substitution, wrong-matter publication, source-path substitution, loss of unrelated/manual/legacy content, omission of final reread/hash verification, or success without immutable revision/receipt and recovery evidence.
>
> The required supported V1 write sequence remains: validate expected exact-byte state; create a unique same-directory temp; write completely and flush; publish using the qualified platform-appropriate primitive with trusted parent and source identity; reread and hash-verify the final canonical file; persist immutable currentness evidence; then update derived state.

All original I12 requirements not expressly narrowed above remain controlling.

## 7. Amended WAC-1 concurrency wording

Upon ACA-1 acceptance, a later WAC-1A successor must incorporate the following normative contract:

### 7.1 Supported writer model

SDJ MIKE V1 supports exactly one application-controlled writer for a canonical matter-control file at a time. Same-target requests MUST pass through the keyed Single Writer boundary. A queued request MUST reread the canonical file and revalidate its exact expected token; it MUST NOT reuse the earlier request's successful precondition.

Human/manual editing is supported between application mutation transactions. It is not an application-controlled writer and requires a new read token plus external-baseline review when exact bytes differ from the accepted revision.

### 7.2 Precondition

The server MUST reread the exact canonical bytes while holding the same-target application serialization boundary. A token mismatch, accepted-revision mismatch without acknowledgment, safe-path/identity discontinuity or unresolved recovery state MUST fail closed. Final verification MUST NOT substitute for this precondition.

### 7.3 Publication

Publication MUST use the qualified trusted-parent and verified-source object model. Junction/reparse redirection, parent substitution, wrong-matter publication and source-path substitution remain prohibited. Local qualification MUST prove continuous destination visibility and exact final result bytes for supported conditions.

### 7.4 Unsupported external interval

An independent external actor MUST NOT mutate or replace the same canonical file while an SDJ MIKE save/publication transaction for that file is active. V1 does not serialize or provide destination-object CAS against such an actor after the last valid precondition. Detection or reproduction of this unsupported race remains technical evidence and MUST NOT be converted into a success claim for cross-process CAS.

### 7.5 Postcondition and evidence

Success MUST NOT be returned without final reread/result-hash verification and the required immutable revision/receipt currentness evidence. A matching final application result proves the published bytes; it does not retroactively prove that no unsupported external destination replacement occurred inside the publication interval.

## 8. Retained no-silent-overwrite guarantees

ACA-1 retains all of the following:

1. **No blind overwrite.** Every supported mutation is bound to an exact expected token and accepted revision state.
2. **No known stale overwrite.** Any mismatch observable at an accepted precondition blocks mutation.
3. **Stale UI protection.** If UI holds V1 and canonical is already V2, result is conflict and V2 remains untouched.
4. **Application concurrency protection.** From one initial token, at most one same-target application request succeeds.
5. **Manual editing.** Completed manual edits remain readable, preservable and eligible for explicit baseline acceptance.
6. **No automatic merge.** Conflict requires reload/review/new request.
7. **Lossless transformation.** Unrelated, manual, unknown and legacy bytes remain byte-identical.
8. **Namespace safety.** Trusted parent identity and junction/reparse/wrong-matter protections remain mandatory.
9. **Source safety.** Publication uses the verified prepared source object, not a later pathname substitution.
10. **Staged-write safety.** Unique same-directory temp creation, complete write, sync and staged hash verification remain mandatory.
11. **Publication visibility.** Qualified local stress must have zero missing-target and partial/mismatched reads.
12. **Final verification.** Application success requires exact final canonical reread/hash verification.
13. **Immutable history/currentness.** Attempt, revision, outcome/receipt and recovery evidence remain authoritative.
14. **Fail-closed ambiguity.** Indeterminate completion remains `RECOVERY_REQUIRED`, never guessed success.

ACA-1 does not establish a last-writer-wins model.

## 9. Supported manual-edit model

The supported V1 workflow is:

```text
accepted canonical V1
→ user finishes and saves manual V2 between application transactions
→ application reads exact V2 and returns token(V2)
→ user reviews/accepts V2 as the new external baseline when required
→ later application mutation supplies token(V2)
→ server rereads and verifies token(V2)
→ mutation may proceed
```

If an application request supplies token(V1) after V2 is already observable, the required result is `CONFLICT` with no canonical overwrite. If manual bytes differ from the last accepted immutable revision, they are not silently promoted; explicit external-baseline review remains required.

## 10. Explicitly unsupported race

The only concurrency guarantee removed from the V1 authority contract is:

> protection against an independent external filesystem actor that mutates or replaces the same canonical destination object under the same valid trusted parent after the last valid expected-state/file-identity verification and before completion of application publication.

The classification is:

```text
UNSUPPORTED_CONCURRENT_EXTERNAL_MUTATION_DURING_ACTIVE_SAVE
```

It is not a supported workflow, a conflict that V1 promises to detect atomically, or a race that final verification solves. Documentation, diagnostics and future tests MUST preserve this limitation visibly.

## 11. VLA compatibility conclusion

ACA-1 is compatible with the VLA architecture after application of its narrow successor scope:

- VLA-0C's manual-edit and reconciliation requirements remain fully enforced for detected/observable changes.
- VLA-0D's expected-state, Single Writer, semantic atomicity, no-last-write-wins and recovery rules remain unchanged for supported operations.
- VLA-1A explicitly defers process/OneDrive concurrency, locks and physical atomic-rename mechanisms to later technical work; destination CAS is not a declared immutable domain principle.
- VLA-1B likewise defers atomic publication, fsync, locking and OneDrive behavior while preserving immutable revisions, currentness and reconciliation.
- The amendment changes the supported V1 environment/concurrency contract, not the VLA authority, provenance, audit, semantic transaction or reconstruction model.

Therefore native destination CAS is an amendable V1 design choice, not a non-waivable foundational property of DOSSARA.

## 12. WAC-1 successor model

The authority chain after a future ACA-1 acceptance is:

```text
Register I12 / VLA no-silent-overwrite baseline
→ WAC-1 exact mutation authority
→ WRITE-1E executable proof
→ FSE-1 / WRITE-1R / WRITE-1R2 capability evidence
→ WAC-1A NO-GO identifying the authority conflict
→ ACA-1 narrow external-concurrency amendment
→ future WAC-1A successor closure against ACA-1
```

WAC-1 remains controlling for every unaffected mutation requirement. ACA-1 controls only the supported external-concurrency interval. The future WAC-1A successor must cite both and must not claim destination CAS.

## 13. OneDrive restriction

**OneDrive remains NOT QUALIFIED / BLOCKED.**

A sync client can be an additional filesystem writer and namespace actor and may operate inside the unsupported interval. ACA-1 does not establish that OneDrive honors the V1 operating contract. No real SDJ/OneDrive root may be used for mutation acceptance until a separately scoped synced-filesystem qualification and owner decision pass.

## 14. FIELD restriction

ACA-1 does not authorize FIELD-1A. FIELD readiness requires at least:

1. accepted ACA-1 authority amendment;
2. accepted WAC-1A successor closure;
3. accepted V1 mutation primitive against that contract;
4. accepted local NTFS FSE qualification;
5. accepted WRITE-PROD-1 API integration;
6. copies/de-identified matters only under `C:\SDJ_TEST\SDJ_LEGAL_TEST\`.

The real SDJ and OneDrive workspaces remain prohibited.

## 15. Future native hardening

The future candidate is:

```text
WRITE-V2 — Native Destination Coordination
```

Possible scope includes oplock coordination, asynchronous break handling, destination-object lifecycle, stronger cross-process CAS-like protection and a native helper/service. It is not implemented, accepted or placed on the V1 critical path by ACA-1.

## 16. Consistency test

| Requirement | Result |
|---|---|
| No internal Register contradiction after successor precedence is applied | **PASS** — I12-A states the exact narrowed boundary and preserves every other I12 step |
| No VLA authority-chain contradiction | **PASS** — logical protections remain; physical process concurrency and locking were deferred |
| Clear WAC-1 successor relation | **PASS** — affected sections and replacement wording are explicit |
| WRITE-1R2 evidence matches the amended contract | **PASS** — parent/source and supported concurrency pass; destination CAS is explicitly not claimed |
| Simple Core and human-editable file-first model preserved | **PASS** |
| No unrelated invariant changed | **PASS** |

## 17. Scope and changed files

ACA-1 creates only:

```text
docs/dossara/persistence/aca-1-v1-external-concurrency-amendment.md
```

No Register, VLA, WAC-1, WAC-1A, historical FSE/WRITE evidence, executable proof, production source, Matter Board, API, OneDrive or FIELD artifact is modified. No staging or commit is authorized.

## 18. Final decision and recommendation

```text
GO — ACA-1 V1 AUTHORITY AMENDMENT READY
```

Recommended next action: perform a separate owner acceptance/identity decision for this ACA-1 document. Only after acceptance should WAC-1A be rerun as a successor closure. Do not begin WRITE-1V, FSE-1A, WRITE-PROD-1, FIELD-1A or native/oplock implementation automatically.

STOP.
