# BASE-1 — Exact-Token External Baseline Acceptance

## 1. Outcome

**A — EXACT-TOKEN BASELINE ACCEPTANCE READY**

BASE-1 closes the production-onboarding blocker for an existing or copied
matter that does not yet have an immutable accepted Matter Control baseline.
The baseline primitive now accepts only the exact raw-byte state previously
reviewed by the caller.

This is an executable correction to accepted WRITE-1V. It does not integrate a
production API or UI and does not resume WRITE-PROD-1A automatically.

## 2. Discovered production blocker

WRITE-1V mutation correctly requires an `acceptedRevisionId`. Existing and
copied matters have no accepted revision until their current canonical state
is explicitly reviewed and admitted into immutable history.

The prior `BaselineRequest` did not contain an expected token. Consequently,
the primitive could accept bytes observed during execution without proving
that they were the same bytes reviewed by the user. That was incompatible with
the WAC-1 exact-state acknowledgment contract and blocked production mapping.

## 3. Authority mapping

| Authority | BASE-1 compatibility |
| --- | --- |
| WAC-1 | Exact-byte acknowledgment is bound to the reviewed token |
| ACA-1 | Every observable precondition mismatch fails closed |
| WAC-1A | Same-target application serialization remains mandatory |
| WRITE-1V | Existing mutation, evidence, guard and recovery semantics are retained |
| FSE-1A | Correction remains qualified only on the accepted local NTFS boundary |
| MTC-1 | Baseline acceptance never normalizes or replaces Matter Type |

No concurrency, persistence, taxonomy or operational-semantics authority was
added or weakened.

## 4. Corrected request contract

`BaselineRequest` now requires:

```text
expectedReadToken = "sha256:" + lowercaseHex(SHA-256(exact canonical bytes))
```

The hash includes BOM, newline representation, whitespace, final-newline
state, manual content, unknown content and legacy values. It is never computed
from a parsed or normalized model.

Malformed expected tokens fail validation before baseline processing.

## 5. Exact-token verification boundary

Baseline acceptance executes inside the existing normalized-target Single
Writer boundary and Windows target-identity guard:

1. resolve and validate the contained canonical target;
2. acquire the same-target application serialization boundary;
3. acquire and verify the trusted filesystem guard;
4. reread exact canonical bytes;
5. validate strict UTF-8 without re-encoding the source;
6. calculate the exact raw-byte token;
7. compare it with `expectedReadToken`;
8. only on equality, inspect accepted currentness and write baseline evidence.

A mismatch returns `CONFLICT`. It writes no Matter Control revision and no
baseline receipt, and it does not change canonical bytes.

## 6. Successful immutable evidence

A first successful baseline acceptance reuses the accepted WRITE/VLA envelope
and evidence structure:

- one immutable `MATTER_CONTROL` exact-content revision;
- one immutable `MATTER_CONTROL_MUTATION_RECEIPT` with
  `BASELINE_ACCEPTED` state;
- matter identity and canonical relative path;
- transaction and revision identities;
- exact resulting read token;
- actor, source and canonical timestamp;
- exact canonical bytes stored as base64 in the accepted revision.

The successful result returns `BASELINE_ACCEPTED`, the accepted revision ID and
the exact read token. `currentMatterControl` then exposes that same revision and
token for the next WRITE-1V mutation.

## 7. Race and conflict proof

BASE-R1 was reproduced on the real filesystem:

```text
read V1 -> token T1
manual write V2
accept baseline with T1
```

Observed result:

- `CONFLICT`;
- V2 remained byte-identical canonical content;
- V2 was not accepted under T1;
- no baseline revision or receipt was created;
- no current accepted revision appeared.

This proves protection for every external change observable before the final
baseline precondition. The accepted
`UNSUPPORTED_CONCURRENT_EXTERNAL_MUTATION_DURING_ACTIVE_SAVE` limitation is not
changed and no destination-CAS claim is introduced.

## 8. Idempotency and existing history

Two concurrent application baseline requests with the same exact token are
serialized. The first returns `BASELINE_ACCEPTED`; the second observes the
accepted identical current state and returns `BASELINE_ALREADY_ACCEPTED` with
the first revision identity. Only one revision/receipt pair exists.

If an accepted baseline already exists but canonical bytes differ, BASE-1
returns `EXTERNAL_BASELINE_REVIEW_REQUIRED`. It does not create a second
“initial baseline” or diverging currentness chain. Later external-change
admission remains a separate explicit reconciliation operation under WAC-1.

## 9. Canonical-byte preservation

Baseline acceptance never performs a field mutation. Successful acceptance:

- does not normalize Markdown;
- does not change line endings, whitespace or BOM;
- does not add missing labels;
- does not repair or replace Matter Type;
- does not change `Sledeći korak`;
- leaves unknown/manual/continuation content byte-identical.

Legacy unknown Matter Type remains unchanged. Missing Matter Type remains
missing. Both states remain compatible with a later unrelated `nextStep`
mutation.

## 10. Executable proof

The BASE-1 targeted suite contains 13 tests:

- exact-token success;
- wrong-token conflict;
- manual edit between read and acceptance;
- absence of accepted evidence on conflict;
- canonical-byte preservation;
- usable accepted revision/currentness;
- following `nextStep` mutation;
- following accepted `matterType` mutation;
- unknown/manual continuation preservation;
- legacy unknown Matter Type preservation;
- missing Matter Type preservation;
- deterministic concurrent same-token idempotency;
- refusal to create a new initial baseline over existing accepted history.

Critical success, conflict, race, evidence, preservation and following-mutation
cases ran against the real filesystem under:

`C:\SDJ_TEST\SDJ_LEGAL_TEST\`

No OneDrive or real SDJ workspace was used.

## 11. Validation results

| Validation | Result |
| --- | --- |
| BASE-1 targeted | 13/13 PASS |
| WRITE-1V including BASE-1 | 44/44 PASS |
| FSE-1A regression | 16/16 PASS |
| WRITE-1E regression | 23/23 PASS |
| PCR-2 regression | 101/101 PASS |
| MVS-1 regression | 17/17 PASS |
| FH-1 regression | 18/18 PASS |
| Combined required regression | 219/219 PASS across 9/9 files |
| Full Vitest | 511/511 PASS across 26/26 files |
| TypeScript | PASS |
| ESLint | PASS |
| Next.js production build | PASS |
| Static generation | 19/19 PASS |
| Scoped `git diff --check` | PASS |

The build retained the pre-existing Turbopack NFT trace warning through
`src/lib/sdj-prompts.ts`. BASE-1 does not import or modify that path, and the
build completed successfully.

## 12. Scope and residual limitations

BASE-1 changes only the accepted baseline request/result contract, baseline
primitive, executable tests and this evidence document. The FSE-1A test change
only supplies the now-mandatory expected token and asserts successful baseline
acceptance.

BASE-1 does not modify:

- production `src/`;
- API or UI behavior;
- Matter Board;
- supported mutation fields;
- OneDrive status;
- destination publication semantics;
- FIELD-1A.

OneDrive remains **NOT QUALIFIED / BLOCKED**.

## 13. Production readiness implication

**WRITE-PROD-1A UNBLOCKED AFTER SEPARATE BASE-1 OWNER ACCEPTANCE**

After BASE-1 is reviewed and accepted in its own commit, a production adapter
can expose a review-token-bound initial baseline action and then use the
returned accepted revision ID for ordinary WRITE-1V `matterType` or `nextStep`
mutation. No production integration is authorized by this evidence alone.

No commit was created in this BASE-1 implementation pass.
