# WRITE-PROD-1A — Minimal Safe V1 Production Editing

## 1. Outcome

**A — WRITE-PROD-1A MINIMAL SAFE V1 EDITING READY**

The production command-center path now integrates the accepted WRITE-1V and
BASE-1 primitive without weakening its concurrency, identity, publication,
receipt or recovery rules. An existing matter must first accept the exact raw
bytes that the user reviewed. An ordinary edit then requires both that exact
read token and the accepted revision ID.

This is a no-commit review result. It does not accept FIELD-1A, OneDrive, a
Matter Board mutation path, or any operational heuristic.

Starting accepted HEAD:

`af28eb1c69ec89412691c18b3c2fe73b8bedc39b`

## 2. Accepted authority chain used

The candidate applies the following accepted chain:

`WAC-1 → ACA-1 → WAC-1A → WRITE-1V → FSE-1A → BASE-1`

It imports and calls the accepted WRITE-1V/BASE-1 primitive. It does not copy
or reimplement the mutation algorithm.

The V1 limitation
`UNSUPPORTED_CONCURRENT_EXTERNAL_MUTATION_DURING_ACTIVE_SAVE` remains in
force. The integration does not claim destination-object CAS or oplock
coordination.

## 3. Production architecture

The write path is:

`Matter cockpit UI`
→ `command-center Route Handler`
→ `server-only canonical mutation adapter`
→ `accepted WRITE-1V / BASE-1 primitive`
→ `command-center.md + immutable VLA evidence`

The adapter:

- resolves the canonical file only from a trusted `ResolvedActiveMatter`;
- derives a contained relative canonical path;
- uses a stable client/matter path identity;
- reads raw bytes and calculates `sha256:<lowercase-sha256>`;
- exposes current accepted revision state;
- delegates baseline acceptance and mutation to the accepted primitive;
- exposes whether the accepted Windows publication helper exists in the
  current runtime so the UI can fail closed before an edit attempt.

Node filesystem code remains server-only. No AI API, network service or future
SQLite index is introduced.

## 4. Read contract

`GET /api/matters/command-center` requires exactly:

- `clientFolder`;
- `matterFolder`.

It returns:

- exact raw-byte `readToken`;
- `baselineState`;
- current `acceptedRevisionId`, when one exists;
- current `matterType` and `nextStep` values;
- `publicationReady` for the accepted Windows helper.

The GET handler is request-bound and uncached. Extra query parameters fail
closed with `400 INVALID_REQUEST`.

Baseline states are:

- `BASELINE_REQUIRED` — no accepted baseline exists;
- `CURRENT` — canonical bytes match the current successful receipt;
- `EXTERNAL_BASELINE_REVIEW_REQUIRED` — bytes differ from accepted
  currentness and ordinary editing is blocked.

## 5. Exact-token onboarding

`POST /api/matters/command-center` is no longer a general Matter Work writer.
It accepts exactly:

- `clientFolder`;
- `matterFolder`;
- `expectedReadToken`.

The request is rejected before filesystem mutation when the token is absent,
malformed or accompanied by a legacy `values` payload.

The accepted BASE-1 result mapping is:

- `BASELINE_ACCEPTED` → HTTP 200;
- `BASELINE_ALREADY_ACCEPTED` → HTTP 200 with the reused revision;
- `CONFLICT` → HTTP 409;
- `EXTERNAL_BASELINE_REVIEW_REQUIRED` → HTTP 409.

Successful baseline acceptance does not change canonical business bytes.
Conflict does not create accepted currentness.

## 6. Mutation contract

`PATCH /api/matters/command-center` requires exactly:

- `clientFolder`;
- `matterFolder`;
- `field`;
- `value`;
- `expectedReadToken`;
- `acceptedRevisionId`.

Only `matterType` and `nextStep` are accepted. Each request targets one field.
Matter Type must be one of the accepted MTC-1 values. Empty, multiline,
oversized, unsupported and extra-field payloads fail closed before mutation.

Stable result mapping:

| Canonical result | HTTP |
|---|---:|
| `CANONICAL_SUCCESS` | 200 |
| `CANONICAL_SUCCESS_DERIVED_REBUILD_REQUIRED` | 202 |
| `CONFLICT` | 409 |
| `EXTERNAL_BASELINE_REVIEW_REQUIRED` | 409 |
| `VALIDATION_FAILED` | 422 |
| `IO_FAILED` | 500 |
| `RECOVERY_REQUIRED` | 503 |

Same-target requests use the accepted primitive's Single Writer boundary. A
writer queued behind a successful writer retains its original token and is
rejected as stale.

## 7. Minimal UI boundary

The Matter Cockpit shows all existing work fields, but only Matter Type and
Next Step have edit controls.

Before either editor opens, the UI performs a new uncached canonical read. If
no baseline exists, it explains the review requirement and offers an explicit
"accept reviewed version" action bound to the returned exact token. If the
file differs from accepted currentness, editing remains blocked.

Status, priority, waiting-for, waiting detail and deadline are display-only in
this V1 slice. They are not sent in any request.

The pre-existing dirty Matter Board inline status/type writer was disconnected
in the working tree and both cells are display-only. The accepted HEAD did not
contain those unaccepted inline controls, so a later isolated acceptance slice
must not stage the unrelated Matter Board/Client Profile hunks.

## 8. Legacy write-path disposition

`saveMatterWorkValues` and `saveMatterBoardChanges` remain only as pre-existing
dirty, unaccepted helper code. No production route or UI imports or invokes
them after this candidate.

This result does not productionize or accept:

- Matter Board PATCH;
- status, priority, waiting or deadline mutation;
- Client Profile or Inbox;
- active/waiting/actionable inference;
- due/overdue inference;
- MVS-0;
- OneDrive or FIELD-1A.

## 9. Executable proof

New WRITE-PROD-1A targeted tests use real files under the sole permitted root
`C:\SDJ_TEST\SDJ_LEGAL_TEST\` and cover:

- raw-byte token read;
- baseline onboarding without canonical byte change;
- `read V1 → T1 → manual V2 → accept(T1)` conflict;
- concurrent identical baseline idempotency;
- lossless Matter Type mutation;
- accepted-revision enforcement;
- stale editor versus manual V2 preservation;
- two same-target writers;
- strict API parsing and rejection of the legacy blind POST;
- stable HTTP result mapping;
- rejection of unsupported and extra fields.

Targeted result: **20/20 PASS** across **2/2 files**.

## 10. Built production-runtime proof

An optimized `next build` was started with `next start` against a new isolated
nested workspace under the permitted test root. The production bundle proved:

1. GET returned `BASELINE_REQUIRED`, the exact raw-byte token and
   `publicationReady=true`;
2. exact-token POST returned `BASELINE_ACCEPTED`;
3. token+revision PATCH returned `CANONICAL_SUCCESS`;
4. a subsequent GET returned `CURRENT` and the changed Next Step;
5. a manual V2 edit followed by a stale PATCH returned HTTP 409 `CONFLICT`;
6. manual V2 SHA-256 before and after the rejected PATCH was identical:
   `BFD3B4D87961AAF05EEA0DC06B0681A87C1399AC6C8E645C0CC1D311F752303F`.

The isolated runtime workspace and temporary settings backup were removed.
`.sdj-mike/settings.json` was restored byte-for-byte with SHA-256:

`5C63896C2A2CFAF06B8FBBF8D6D3D778B6D244190B9276D191FB9EF6B11D833F`

No real SDJ or OneDrive workspace was accessed.

## 11. Regression evidence

| Validation | Result |
|---|---:|
| WRITE-PROD-1A targeted | **20/20 PASS** |
| BASE-1 / WRITE-1V | **44/44 PASS** |
| FSE-1A | **16/16 PASS** |
| WRITE-1E | **23/23 PASS** |
| PCR-2 | **101/101 PASS** |
| MVS-1 | **17/17 PASS** |
| FH-1 | **18/18 PASS** |
| Combined acceptance regression | **239/239 PASS**, 11/11 files |
| Full Vitest | **531/531 PASS**, 28/28 files |
| TypeScript | **PASS** |
| ESLint | **PASS** |
| Next.js optimized build | **PASS** |
| Static generation | **19/19 PASS** |
| `git diff --check` | **PASS** |

The build retained one pre-existing Turbopack NFT warning in the unrelated
prompt-generation trace. It did not affect compilation, TypeScript, page data,
static generation or the built command-center runtime proof.

## 12. Dirty-tree isolation

The initial repository state contained 37 modified/untracked paths and an
aggregate SHA-256 manifest of:

`8C9CAEEE31006B5F4F06AA5C61BFF27EEDBA9C44EEE360738DFD2B9481B9AE83`

No staging or commit occurred. The WRITE-PROD-1A changes are restricted to the
declared ten-path allowlist. Mixed dirty paths require selective staging during
a later owner-authorized acceptance step. All other pre-existing dirty paths
remain out of scope.

Final repository accounting:

- total modified/untracked paths: **43**;
- WRITE-PROD-1A allowlist paths: **10**;
- pre-existing out-of-scope paths: **33**;
- out-of-scope manifest SHA-256:
  `C283DE2A8561D10E522364AC702DBCC02618173FE9FD47542DE0E0A0166AFDA7`;
- index entries: **0**.

All 33 out-of-scope files were checked individually against their pre-run
SHA-256 snapshot: **33/33 byte-identical**.

## 13. Final recommendation

**A — WRITE-PROD-1A MINIMAL SAFE V1 EDITING READY**

Recommended next action after owner review and a separate scoped acceptance
decision:

**FIELD-1A ACCEPTANCE GATE READY**

Do not start FIELD-1A automatically.
