# WRITE-1E — Executable Canonical Mutation Safety Proof

## 1. Document control and outcome

| Field | Evidence |
|---|---|
| Work package | WRITE-1E — Executable Canonical Mutation Safety Proof |
| Date | 2026-08-18 |
| Branch | `spike/phase-0c-electron-forge-webpack` |
| Starting HEAD | `752d71c530c8febdba75bac490f129768c409935` |
| Authority | `docs/dossara/persistence/wac-1-canonical-mutation-authority.md` |
| Authority identity | 517 lines; SHA-256 `C827FBEEC55B5049A4834270DD9F35DD6381C5C6E6756EFCF9B805CC415A0AD8` |
| Work type | Isolated server-only executable proof; not production acceptance |
| Outcome | **A — WRITE-1 EXECUTABLE SAFETY PROOF READY** |

The central invariant is executable and passing:

> A stale editor cannot overwrite a newer canonical file.

The proof does not change Matter Board, any API route, production mutation code, Client Profile, Inbox, operational heuristics or MVS-0.

## 2. Candidate scope

The candidate consists of:

- `spikes/write-1-executable/contracts.ts`;
- `spikes/write-1-executable/canonical-mutation.ts`;
- `spikes/write-1-executable/canonical-mutation.test.ts`;
- this evidence document.

The proof imports only the accepted MTC-1 classifier from production source. All persistence, publication and test-harness behavior remains isolated under `spikes/write-1-executable/`.

## 3. Runtime and test boundary

The executable proof ran on:

| Component | Observed value |
|---|---|
| OS | Microsoft Windows NT 10.0.19045.0 |
| Node | `v24.13.0` |
| libuv | `1.51.0` |
| Architecture | `x64` |
| Filesystem proof root | `C:\SDJ_TEST\SDJ_LEGAL_TEST\` only |

Every test uses a unique `write1e-*` child directory below the permitted root. The harness does not use `os.tmpdir()`, the real SDJ root or a OneDrive matter.

## 4. Exact mutation algorithm

The successful flow is:

1. validate request identity, timestamp, fields and new values;
2. prove the workspace and canonical relative path are contained below the sole test root;
3. reject a non-regular target, symlink, escaping real parent or oversized file;
4. acquire the in-process writer key derived from the resolved canonical target;
5. durably write the immutable mutation attempt;
6. reread exact raw bytes after lock acquisition;
7. calculate `sha256:<lowercase hex>` over the raw bytes;
8. compare the observed token to `expectedReadToken`;
9. compare the observed bytes/token to the current successful receipt;
10. parse strict UTF-8 while preserving an optional BOM;
11. identify exactly one target value span, or the accepted Matter Type insertion anchor;
12. construct proposed bytes by replacing only that span;
13. durably write the immutable `PREPARED` Matter Control revision containing exact bytes as base64;
14. create a unique same-directory temp with `wx`;
15. write all proposed bytes, call `FileHandle.sync()`, close and reread/hash the temp;
16. publish with the proven Windows primitive;
17. reread the canonical target and compare its exact token to the prepared token;
18. durably write the success/currentness receipt;
19. update derived state;
20. durably write the linked final outcome;
21. return the precise result.

No normal success is returned before final canonical reread/hash and the success receipt.

## 5. Exact-byte token proof

The proof calculates:

```text
"sha256:" + lowercaseHex(SHA-256(raw file Buffer))
```

Tests demonstrate that the token changes when any of these change:

- UTF-8 BOM presence;
- CRLF versus LF;
- trailing whitespace;
- unknown/manual bytes.

No parser output or normalized string is hashed.

## 6. Conflict and Single Writer proof

### Manual edit after read

The test reads a token, changes canonical bytes manually, then submits the stale token. Result:

- `CONFLICT`;
- no temp publication;
- no success receipt;
- manually changed canonical bytes remain exact.

### Two stale application writers

Two requests with the same expected token execute concurrently against the same canonical path. The keyed writer serializes their critical sections:

- first writer succeeds;
- second writer rereads after acquiring the key;
- second writer receives `CONFLICT`;
- second value never overwrites the first.

This proves that Single Writer is not used as a substitute for the expected hash.

## 7. Lossless preservation proof

The transformer operates over source spans rather than reconstructing the document from recognized fields.

For an existing field it replaces only the non-whitespace value span on the exact label line. It preserves:

- BOM;
- newline bytes;
- prefix and trailing whitespace;
- unknown labels;
- unknown continuation lines between recognized labels;
- headings, paragraphs, notes and blank lines;
- final-newline state;
- every untargeted field.

The WRITE-1 evidence defect involving unknown continuation lines is covered by an executable assertion against the final canonical bytes.

Duplicate targets, a missing required target, an ambiguous Matter Type insertion anchor, invalid UTF-8 and invalid request values fail closed.

## 8. MTC-1 compatibility proof

The proof uses the accepted `isMatterType` classifier.

Executable cases prove:

- `Vrsta predmeta: Nasljedno pravo` survives an unrelated next-step mutation;
- a missing Matter Type remains missing;
- a missing Matter Type does not become `Drugo`;
- explicit replacement with `Radni spor` succeeds;
- explicit replacement with legacy unknown `Nasljedno pravo` is rejected as a new value.

No operational state, lifecycle, waiting, active, actionable, due or priority value is derived.

## 9. Immutable evidence and currentness

WRITE-1E reuses the accepted FH-1/VLA `CanonicalEnvelope` and validation registry. It introduces no parallel envelope.

The local registry contains only the four WAC-1 record types:

1. `MATTER_CONTROL`;
2. `MATTER_CONTROL_MUTATION_ATTEMPT`;
3. `MATTER_CONTROL_MUTATION_OUTCOME`;
4. `MATTER_CONTROL_MUTATION_RECEIPT`.

Each stored envelope is canonical JSON, SHA-256 integrity wrapped, created with `wx`, written completely and synced before close.

A prepared Matter Control revision records:

- matter identity;
- transaction identity;
- canonical relative path;
- previous token;
- proposed/resulting token;
- changed fields;
- timestamp, actor and source in its envelope;
- exact proposed bytes as base64;
- `PREPARED` state;
- previous revision reference.

A prepared revision is not current. Currentness resolution follows the latest valid success/baseline receipt. Tests inject failures after preparation and confirm that the earlier accepted baseline remains current.

The publication receipt records a `PENDING` derived state because it precedes derived work. A following immutable outcome records either:

- `CANONICAL_SUCCESS`; or
- `CANONICAL_SUCCESS_DERIVED_REBUILD_REQUIRED`.

This preserves WAC-1 ordering without rewriting immutable evidence.

## 10. Windows publication proof

### 10.1 Candidate investigation

Two candidates were tested.

#### Rejected: `ReplaceFileW`

A small P/Invoke bridge was exercised against the permitted Windows test workspace. Under a concurrent reader loop, 8 replacement attempts produced 7 observable `ENOENT` reads. The candidate therefore failed the WAC-1 no-missing-target-window requirement and was removed from the candidate diff.

Microsoft also documents several `ReplaceFileW` partial failure layouts, including states in which the replaced file no longer has its original name. These states require conservative recovery and did not improve the observed reader contract.

#### Selected: Node `fs.rename()` on the pinned runtime

This selection is based on source and runtime proof, not an assumption from the method name.

The installed stack reports Node `v24.13.0` and libuv `1.51.0`. The matching libuv Windows source implements `fs__rename` as one call:

```text
MoveFileExW(oldPath, newPath, MOVEFILE_REPLACE_EXISTING)
```

Microsoft defines `MOVEFILE_REPLACE_EXISTING` as replacement of the existing destination contents with the existing source contents, subject to ACL requirements.

The executable test performs eight same-directory replacements while a concurrent reader samples the canonical path. Result:

- 8/8 resulting versions verified;
- 0 observed `ENOENT` reads;
- final bytes equal the eighth proposed version.

Windows readers can temporarily cause `EPERM`, `EBUSY` or `EACCES`. The primitive uses a bounded 50-attempt, 5 ms retry for only those sharing/contention codes. Exhaustion is an I/O failure, not success. No retry bypasses the hash precondition because publication occurs inside the expected-token-bound writer critical section.

### 10.2 Primary technical references

- Node filesystem documentation: `https://nodejs.org/docs/latest-v24.x/api/fs.html#filehandlesync`
- libuv 1.51.0 Windows implementation: `https://raw.githubusercontent.com/libuv/libuv/v1.51.0/src/win/fs.c`
- Microsoft `MoveFileEx` contract: `https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-movefileexa`
- Microsoft `ReplaceFileW` contract and failure states: `https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-replacefilew`

## 11. Durability boundary

Proven on the supported stack:

- immutable attempt/prepared evidence uses complete write plus `FileHandle.sync()` before close;
- same-directory temp uses exclusive create;
- all proposed bytes are written;
- `FileHandle.sync()` maps through libuv to `FlushFileBuffers` on Windows;
- temp is closed and cold reread/hash verified before publication;
- canonical is cold reread/hash verified after publication;
- receipt is synced before success/currentness;
- final derived outcome is synced before the API result.

Not claimed:

- directory metadata fsync;
- fully durable behavior across every hardware/controller/power-loss combination;
- OneDrive, SMB or multi-machine writer arbitration;
- behavior through arbitrary reparse points;
- a general Windows filesystem guarantee beyond the tested supported runtime/filesystem conditions.

An indeterminate publication or final hash mismatch is `RECOVERY_REQUIRED`, never normal success.

## 12. Failure injection results

| Injected stage | Expected canonical/currentness result | Executable result |
|---|---|---|
| temp create | old canonical; prepared noncurrent | PASS — `IO_FAILED` |
| temp write | old canonical; prepared noncurrent | PASS — `IO_FAILED` |
| temp sync | old canonical; prepared noncurrent | PASS — `IO_FAILED` |
| publication before OS call | old canonical; prepared noncurrent | PASS — `IO_FAILED` |
| final reread/hash mismatch | no success receipt/currentness | PASS — `RECOVERY_REQUIRED` |
| receipt write after verified publication | no normal success | PASS — `RECOVERY_REQUIRED` |
| derived update after receipt | canonical remains current | PASS — `CANONICAL_SUCCESS_DERIVED_REBUILD_REQUIRED` |

## 13. Recovery decision-table proof

| Case | Fixture | Result |
|---|---|---|
| R1 | canonical old + orphan temp + no receipt for temp | `ORPHAN_TEMP_NOT_PUBLISHED`; no automatic publication |
| R2 | canonical hash equals successful receipt | `COMMITTED` |
| R3 | canonical hash contradicts receipt chain | `RECOVERY_REQUIRED` |
| R4 | prepared revision without success receipt | `PREPARED_NOT_CURRENT` |

Recovery never guesses which unreceipted bytes should become current.

## 14. I12 / WAC-1 executable mapping

| Authority requirement | Executable proof |
|---|---|
| exact-byte precondition | raw Buffer SHA-256 including BOM/newlines/whitespace |
| conflict before write | stale manual and two-writer cases |
| lossless targeted mutation | source-span replacement and exact expected bytes |
| validation fail-closed | duplicate/missing target and MTC-1 invalid value |
| prepared immutable revision | durable VLA envelope before temp publication |
| durable temp preparation | `wx`, complete write, sync, close, reread/hash |
| Windows-safe publication | pinned libuv `MoveFileExW(REPLACE_EXISTING)` plus runtime reader proof |
| final verification | canonical reread and exact resulting-token comparison |
| immutable attempt/outcome/receipt | four WAC-1 record types in canonical synced envelopes |
| currentness transition | only success receipt advances current revision |
| derived separation | rebuild-required result without canonical rollback |
| recovery without guessing | R1–R4 cold filesystem decision tests |

## 15. Validation results

| Validation | Result |
|---|---|
| WRITE-1E targeted | **23/23 PASS** |
| PCR-2 Matter Type regression | **101/101 PASS** |
| MVS-1 regression | **17/17 PASS** |
| FH-1 regression | **18/18 PASS** |
| Full Vitest candidate | **425/425 PASS** |
| TypeScript | **PASS** |
| ESLint | **PASS** |
| Next.js production build | **PASS** |
| Static generation | **19/19 PASS** |
| `git diff --check` | **PASS** |

The production build reports one pre-existing Turbopack NFT tracing warning through `next.config.ts` → `src/lib/sdj-prompts.ts` → `src/app/api/prompts/save/route.ts`. It does not originate in WRITE-1E and does not fail the build.

## 16. Residual risks and productionization recommendation

Residual risks are technical and bounded:

- Node/libuv does not request `MOVEFILE_WRITE_THROUGH`; the accepted claim therefore relies on pre-publication temp flush, final verification and recovery evidence, not directory metadata durability;
- the empirical no-missing-window result is for the pinned local Windows/Node/libuv stack and permitted local test filesystem;
- sustained hostile reader contention can exhaust bounded retry and return safe `IO_FAILED`;
- network shares, OneDrive synchronization, antivirus interference, ACL variants and reparse-point topologies require separate environment qualification;
- the isolated schema registry and file layout require review before production placement;
- no HTTP 409 route mapping is included in this proof.

Recommendation:

1. accept WAC-1 separately as documentation authority;
2. review this four-file WRITE-1E candidate as one isolated executable proof package;
3. retain `MoveFileExW` stack pinning and the documented durability boundary in any productionization plan;
4. qualify the intended production filesystem environment before connecting the primitive to Matter Board;
5. implement API/HTTP mapping only in a later separately accepted production work package.

## 17. Final decision

**A — WRITE-1 EXECUTABLE SAFETY PROOF READY**

The central stale-editor invariant, lossless mutation, prepared/current separation, final verification, derived failure behavior and non-guessing recovery table are executable and passing. This outcome does not itself accept or productionize the primitive.
