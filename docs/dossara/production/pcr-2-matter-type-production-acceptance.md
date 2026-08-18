# PCR-2 — Matter Type Production Acceptance Review

## 1. Review identity and decision

- Date: 2026-08-17
- Branch: `spike/phase-0c-electron-forge-webpack`
- Starting HEAD: `d226d0e80e6e5c990e1026eac9091b802bbe67aa`
- Accepted authority: MTC-1 commit `d226d0e80e6e5c990e1026eac9091b802bbe67aa`
- Starting index: empty
- Starting dirty state: 16 modified + 17 untracked = 33 file paths
- Outcome: **C — MIXED-DIFF ISOLATION BLOCKER**
- Recommendation: **NOT READY FOR ACCEPTANCE COMMIT — CLEAN-BASELINE DEPENDENCY RECONCILIATION REQUIRED**

The Matter Type source hunks themselves are safely separable and conform to MTC-1. Acceptance is nevertheless blocked because an isolated candidate built from accepted HEAD cannot complete mandatory full Vitest, TypeScript or Next build validation: committed MVS-1 files import `spikes/mvs-0-metrics/contracts` and `spikes/mvs-0-metrics/temporal`, while those dependencies exist only as out-of-scope untracked MVS-0 spike files. The dirty worktree passes because those unaccepted files are present. PCR-2 must not make MVS-0 an implicit dependency or include it in the taxonomy commit.

No production file was modified, staged or committed during PCR-2.

## 2. Candidate classification

### 2.1 Initial eight-file set

| File | Class | Finding |
|---|---|---|
| `src/lib/sdj-matter-classification.ts` | **T** | New exact 14-value vocabulary, type and membership validator only |
| `src/app/api/matters/matter-create.ts` | **T** | Adds only `Vrsta predmeta` serialization to the existing staged CONTROL content |
| `src/app/api/matters/matter-request.ts` | **T** | Adds one string field to JSON/multipart parsing; no operational derivation |
| `src/app/api/matters/matter-request.test.ts` | **T** | Adds Matter Type to existing request-shape/default assertions |
| `src/app/api/matters/route.ts` | **M** | Taxonomy import, GET exposure and POST validation are mixed in the same hunks with unrelated `priority` read-model additions |
| `src/app/api/matters/route.test.ts` | **T** | Adds input compatibility and creation-persistence coverage only |
| `src/lib/sdj-matters.ts` | **T** | Adds neutral metadata type, parser label and missing default only |
| `src/app/matters/[clientFolder]/[matterFolder]/page.tsx` | **T delta / shared file** | Dirty delta is one neutral header-display line; the baseline file already contains other matter-work UI |

`T` means the dirty delta is taxonomy-only, not that the whole pre-existing file defines only taxonomy behavior.

### 2.2 Required dependencies discovered by PCR-2

| File | Class | Required treatment |
|---|---|---|
| `src/i18n/messages/en.json` | **M** | Select only the `MatterCockpit.matterType` key; exclude Inbox keys |
| `src/i18n/messages/sr-Latn.json` | **M** | Select only the `MatterCockpit.matterType` key; exclude Inbox keys |
| `src/lib/sdj-matter-classification.test.ts` | **T** | New PCR-2 test file for exact vocabulary, invalid values, parser/read, missing and legacy unknown |

The shared manager, command-center PATCH route, command-center rewrite library/test and CSS are not candidate dependencies.

## 3. Exact accepted taxonomy slice

If the validation blocker is resolved in a separate authority-consistent work package, the production baseline candidate is:

1. exact approved `MATTER_TYPES` values and order;
2. exact membership validation for non-empty new values;
3. one trimmed `matterType` request field for JSON and multipart;
4. POST rejection of a non-empty value outside the vocabulary;
5. serialization of the selected value as `Vrsta predmeta: ...` during initial staged matter creation;
6. neutral parsing into `MatterCommandCenterMetadata.matterType`;
7. GET/read-model exposure without normalization;
8. neutral cockpit display with two locale labels;
9. focused executable tests for the MTC-1 contract.

For `src/app/api/matters/route.ts`, the candidate includes only seven taxonomy insertions: one import, three GET/read-model lines and the three-line POST validation block. The three unrelated `priority` additions remain unstaged.

For each locale file, only the single `matterType` key insertion in `MatterCockpit` is a candidate. All Inbox changes remain unstaged.

The isolated source/test candidate has this stat:

```text
11 files changed, 126 insertions(+), 3 deletions(-)
```

The three deletions are line replacements in `matter-create.ts` and the two one-line JSON objects, not removed behavior.

## 4. MTC-1 conformance

| MTC-1 rule | Production finding | Result |
|---|---|---|
| Exact vocabulary | `MATTER_TYPES` matches all 14 values and stable order | PASS |
| One primary type | Request and metadata shape carry one string value | PASS |
| No operational derivation | Value comes only from user input/persisted metadata | PASS |
| `Drugo` controlled | Exact member; arbitrary non-empty text fails validator | PASS |
| Missing is not `Drugo` | Missing parse result remains `null`; request default remains empty | PASS |
| Legacy unknown preserved | Parser returns the stored unknown text without coercion | PASS for read path |
| Independent dimensions | No taxonomy write changes status, priority, next action, waiting, due or lifecycle | PASS in candidate delta |

The future existing-matter edit path is not part of this result. Preservation during unrelated mutation remains a WRITE-1 requirement because the current PATCH path is excluded.

## 5. Create/read and legacy behavior

### Initial creation

Matter Type is added to the existing CONTROL-content map before the existing transaction writes files with `wx`, checks staged structure and publishes by final directory rename. It adds no overwrite of an existing matter and does not weaken collision or cleanup behavior. No new I12 mutation protocol is required for first creation.

### Read model

The parser treats `Vrsta predmeta` as neutral canonical metadata. GET copies the parsed value into its DTO, and the cockpit displays a non-empty value with a neutral localized label. No inference is made from folder name, status, date or actions.

### Missing and legacy unknown

- Absence of `Vrsta predmeta` returns `null` in the parser and an empty read-model value; it is never defaulted to `Drugo`.
- An unknown stored value such as `Nasljedno pravo` is returned unchanged and is not coerced to `Drugo`.
- PCR-2 does not accept the inline edit path. Explicit replacement and preservation during unrelated mutation remain blocked on WRITE-1.

## 6. Operational and write exclusions

The isolated candidate adds none of the following:

- `startsWith("Čeka")`;
- active/non-active inference;
- actionable or waiting resolution;
- overdue/due inference;
- `urgent/attention/ok` classification;
- host-local time logic;
- copied MVS-1 operational resolver logic;
- Matter Board PATCH or inline editing;
- an I12 mutation implementation.

The shared `client-matter-manager.tsx` still contains unaccepted status, attention and deadline heuristics, but no hunk from that file is in the candidate. Existing matter editing in `command-center/route.ts` and `sdj-command-center-update.ts` is also fully excluded.

## 7. Test evidence

All test commands used `TEMP` and `TMP` under `C:\SDJ_TEST\SDJ_LEGAL_TEST`.

### 7.1 Targeted current-worktree tests

```text
npm.cmd test -- src/lib/sdj-matter-classification.test.ts \
  src/app/api/matters/matter-request.test.ts \
  src/app/api/matters/route.test.ts
```

Final result:

```text
Test Files  3 passed (3)
Tests       101 passed (101)
Duration    2.03s
```

Coverage mapping:

- Test 1: exact list plus all 14 values accepted;
- Test 2: unknown, wrong-case and empty strings fail `isMatterType`; static route inspection confirms POST uses this validator before filesystem mutation;
- Test 3: existing route test persists `Vrsta predmeta: Ugovorni predmet` through the creation transaction;
- Test 4: parser/read model returns an approved stored value;
- Test 5: missing field stays `null`, not `Drugo`;
- Test 6: unknown legacy text is preserved and not normalized to `Drugo`.

The first new-test attempt exposed a Vitest alias-resolution issue before collection. A test-local mock for the existing workspace module resolved the harness issue; no production code changed.

### 7.2 Isolated candidate validation

An isolated copy of accepted HEAD was created at:

```text
C:\SDJ_TEST\SDJ_LEGAL_TEST\pcr2-candidate-d226d0e-20260817-1608
```

Only the exact 11-file candidate described above was applied. The unrelated `priority` and Inbox hunks were demonstrably absent.

| Check | Result |
|---|---|
| Candidate diff inspection | PASS — exact 11 files; selective route/locale hunks verified |
| Operational contamination scan | PASS — none in taxonomy layer/delta |
| ESLint | PASS |
| Full Vitest | **BLOCKED** — 16 suites/361 tests pass; MVS-1 suite cannot load missing `../mvs-0-metrics/contracts` and `temporal` |
| TypeScript | **BLOCKED** — missing MVS-0 modules plus cascading MVS-1 type errors |
| Next build, Turbopack | Harness blocked because validation-only `node_modules` junction points outside candidate root |
| Next build, documented `--webpack` fallback | Source compilation PASS; type-check then blocked on the same missing MVS-0 module |

No untracked MVS-0 files were copied into the isolated candidate because that would falsely make an unaccepted historical spike part of PCR-2 validation.

### 7.3 Dirty-worktree comparison

With all pre-existing untracked files present:

| Check | Result |
|---|---|
| Full Vitest | PASS — 20 suites, 401 tests |
| TypeScript | PASS |
| ESLint | PASS |
| Next.js 16.2.11 build | PASS; one pre-existing NFT tracing warning |

This comparison proves the blocker: validation succeeds only when out-of-scope untracked MVS-0 files satisfy committed MVS-1 imports. It is not clean production-baseline evidence for PCR-2.

## 8. Files changed during PCR-2

Only these files were created by PCR-2:

1. `src/lib/sdj-matter-classification.test.ts`
2. `docs/dossara/production/pcr-2-matter-type-production-acceptance.md`

No production implementation file was edited. The index remains empty and no commit was created.

## 9. Residual dirty work and integrity

The pre-PCR-2 aggregate covers all 33 pre-existing dirty files, including PCR-1 and all production/spike groups, but excluding the two new PCR-2 files:

```text
SHA-256: 751D5F124E51168F261D18539BB5BF4D84AEE3660D3276CC376164A2224B1A2A
```

The post-review calculation covered the same 33 files and produced the same SHA-256. Matter Board, operational shared UI, Client Profile, Inbox, MVS-0, PCR-1, RECON-0 and WRITE-1-related changes remain out of scope and content-identical.

## 10. Proposed future acceptance commit scope

Do not stage this scope until the owner resolves the clean-baseline dependency blocker and issues a new commit instruction.

Full-file candidates:

1. `src/lib/sdj-matter-classification.ts`
2. `src/lib/sdj-matter-classification.test.ts`
3. `src/app/api/matters/matter-create.ts`
4. `src/app/api/matters/matter-request.ts`
5. `src/app/api/matters/matter-request.test.ts`
6. `src/app/api/matters/route.test.ts`
7. `src/lib/sdj-matters.ts`
8. `src/app/matters/[clientFolder]/[matterFolder]/page.tsx`

Selective-hunk candidates:

9. `src/app/api/matters/route.ts` — taxonomy import, `matterType` GET/read-model exposure and POST validation only; exclude `priority` additions.
10. `src/i18n/messages/en.json` — `MatterCockpit.matterType` only.
11. `src/i18n/messages/sr-Latn.json` — `MatterCockpit.matterType` only.

Evidence candidate:

12. `docs/dossara/production/pcr-2-matter-type-production-acceptance.md`

The 11 source/test files have the verified proposed stat `126 insertions(+), 3 deletions(-)`. The evidence document stat must be added only after its final identity is verified.

## 11. Recommendation

```text
C — MIXED-DIFF ISOLATION BLOCKER
NOT READY FOR ACCEPTANCE COMMIT
```

The taxonomy implementation does not conflict with MTC-1 and needs no production correction. Before returning to PCR-2 acceptance, reconcile why accepted/committed MVS-1 imports untracked, explicitly nonaccepted MVS-0 spike modules. The resolution must be a separate owner-authorized work package and must not silently commit or productionize MVS-0 through the Matter Type slice.

## 12. PCR-2R clean acceptance continuation

### 12.1 Continuation identity

- Date: 2026-08-18
- Accepted baseline HEAD: `4af8cf2cfd633f791098006161b604e9b7f5c9f9`
- MVS-1 reproducibility correction: `4af8cf2cfd633f791098006161b604e9b7f5c9f9`
- Validation candidate: `C:\SDJ_TEST\SDJ_LEGAL_TEST\pcr2r-candidate-4af8cf2-20260818-1120`
- Outcome: **A — MATTER TYPE PRODUCTION ACCEPTANCE READY**

The historical PCR-2 outcome in section 11 remains valid as the result reached on 2026-08-17. Its clean-baseline blocker was subsequently closed by the separately accepted MVS-1-DEP-1 corrective commit. PCR-2R did not rewrite that history; it repeated the required acceptance validation against the corrected committed baseline.

### 12.2 Exact clean candidate

The candidate was created from committed HEAD using `git archive`. Only the previously identified 11-file Matter Type patch was applied:

Full-file candidates:

1. `src/lib/sdj-matter-classification.ts`
2. `src/lib/sdj-matter-classification.test.ts`
3. `src/app/api/matters/matter-create.ts`
4. `src/app/api/matters/matter-request.ts`
5. `src/app/api/matters/matter-request.test.ts`
6. `src/app/api/matters/route.test.ts`
7. `src/lib/sdj-matters.ts`
8. `src/app/matters/[clientFolder]/[matterFolder]/page.tsx`

Selective-hunk candidates:

9. `src/app/api/matters/route.ts` — exactly seven taxonomy insertions: the `isMatterType` import, three `matterType` GET/read-model lines and the three-line POST validation block. The three dirty-worktree `priority` additions were absent.
10. `src/i18n/messages/en.json` — only `MatterCockpit.matterType: "Matter / dispute type"`.
11. `src/i18n/messages/sr-Latn.json` — only `MatterCockpit.matterType: "Vrsta predmeta / spora"`.

Candidate stat:

```text
11 files changed, 126 insertions(+), 3 deletions(-)
```

The candidate locale `Inbox` and `MatterFiles` objects were byte-semantically identical to committed baseline JSON. The only new `MatterCockpit` key in each locale was `matterType`. No Client Profile, Inbox, Matter Board, inline edit, WRITE-1 or priority hunk was included. `spikes/mvs-0-metrics/` was physically absent.

### 12.3 Clean validation results

| Check | Result |
|---|---|
| PCR-2 Matter Type targeted | PASS — 3 files, 101 tests |
| MVS-1 targeted regression | PASS — 1 file, 17 tests |
| FH-1 regression | PASS — 2 files, 18 tests |
| Full Vitest | PASS — 17 files, 378 tests |
| TypeScript `tsc --noEmit` | PASS |
| ESLint | PASS |
| Next.js 16.2.11 production build | PASS using `--webpack` for the validation-only external dependency junction |
| Static generation | PASS — 17/17 routes |
| Candidate diff check | PASS |
| MVS-0 required/imported | PASS — no MVS-0 directory or dependency |

The larger full-suite count relative to the original PCR-2 run is explained by the now self-contained committed MVS-1 suite and its accepted dependency-reconciliation regression. Every collected test passed.

### 12.4 MTC-1 and contamination result

The clean targeted suite reconfirmed all six required behaviors:

1. exact 14-value vocabulary and acceptance of every approved value;
2. rejection of new values outside the vocabulary in the create/request path;
3. initial persistence as `Vrsta predmeta` in canonical CONTROL metadata;
4. parser/API/read-model return of the persisted value;
5. missing value remains `null` and is not mapped to `Drugo`;
6. legacy unknown values such as `Nasljedno pravo` remain readable and unchanged.

The actual candidate additions contain no active/waiting/actionable inference, governing-due or overdue logic, urgency classification, operational heuristic, copied MVS-1 primitive, Matter Board PATCH or inline-edit mutation protocol. Matter Type remains a neutral single-value taxonomy dimension.

### 12.5 Out-of-scope integrity and commit boundary

PCR-2R fingerprinted 23 pre-existing dirty paths outside the 12-file source/test/evidence scope before validation:

```text
SHA-256: 8E38CBA9AF5DA3F915BBAB91E12DCC23F88108329E79A1B9DD2BF66BB68926C5
```

The post-update calculation covered the same 23 paths and produced the same SHA-256. MVS-0 remains experimental/historical and was not modified, copied into the candidate or proposed for acceptance.

No acceptance commit was created. A future owner-authorized commit should contain the exact 11-file selective production/test patch plus this evidence document. Proposed commit message:

```text
feat: accept Matter Type production taxonomy
```

### 12.6 Final recommendation

```text
A — MATTER TYPE PRODUCTION ACCEPTANCE READY
```

The Matter Type production slice is clean-baseline reproducible, MTC-1 conformant, selectively isolated from unrelated dirty work and ready for a separate owner acceptance commit decision.
