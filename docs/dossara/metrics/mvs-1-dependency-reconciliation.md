# MVS-1-DEP-1 — Accepted Proof Dependency Reconciliation

## 1. Decision identity

- Date: 2026-08-17
- Branch: `spike/phase-0c-electron-forge-webpack`
- Starting HEAD: `d226d0e80e6e5c990e1026eac9091b802bbe67aa`
- Historical MVS-1 acceptance: `b590e1738e88711f2d3aff5a0969190fe76e4cff`
- Controlling semantic authority: VOC-1 commit `09b74f514fcb56fbf20d74019ef2542aeb675b12`
- Accepted technical baseline: FH-1 `c9c8eb42cbc59f55df3da6b73fa8df7539dc1596`, GPP-0 `555c0196b120763c5ebe35d0f0ca2284a3b48acf`
- Outcome: **A — MVS-1 REPRODUCIBILITY CORRECTION READY**

The historical MVS-1 acceptance commit remains unchanged. This work package prepares a new corrective delta that makes its executable proof self-contained without accepting, committing or productionizing the historical MVS-0 spike.

## 2. Discovered reproducibility defect

Committed MVS-1 source imported two files that were not part of committed accepted repository state:

```text
spikes/mvs-0-metrics/contracts.ts
spikes/mvs-0-metrics/temporal.ts
```

Those files existed only in the dirty worktree as part of the explicitly experimental/historical MVS-0 spike. Therefore:

- dirty-worktree tests and TypeScript passed;
- a clean archive/check-out of accepted HEAD could not load the MVS-1 suite;
- TypeScript and Next build failed on missing modules;
- MVS-1 repository acceptance was not self-contained even though its VOC-1 semantics and accepted fixture results remained valid.

The defect is dependency/reproducibility, not a reversal of MVS-1 semantic acceptance.

## 3. Exact dependency map

| MVS-1 file | Imported MVS-0 symbol | Purpose | Classification | Accepted equivalent? | Disposition |
|---|---|---|---|---|---|
| `contracts.ts` | `AuthorityReference` | Exact `{recordId, revisionId}` provenance shape used by facts and results | Generic proof/result type | No identical exported FH/GPP type | Internalize minimal interface in MVS-1 contracts |
| `contracts.ts` | `Resolution<T>` | `RESOLVED`/`UNRESOLVED` result algebra with provenance | Generic proof/result type | No identical exported FH/GPP type | Internalize minimal generic union in MVS-1 contracts |
| `operational-metrics.ts` | `AuthorityReference` | Stable/deduplicated provenance handling | Generic proof/result type | No identical exported FH/GPP type | Import from local MVS-1 contracts |
| `operational-metrics.ts` | `Resolution<T>` | Resolver and metric return values | Generic proof/result type | No identical exported FH/GPP type | Import from local MVS-1 contracts |
| `operational-metrics.ts` | `ResolutionSeverity` | Fail-closed `UNAVAILABLE`/`INVALID` distinction | Generic proof/result type | No identical exported FH/GPP type | Internalize local two-value type |
| `operational-metrics.ts` | `UnresolvedReason` | Typed MVS-1 failure reasons | Proof contract vocabulary | No identical exported FH/GPP type | Internalize only eight reasons actually used by MVS-1 |
| `operational-metrics.ts` | `parseInstant` | Strict RFC3339 instant validation and epoch comparison | Temporal primitive | No accepted implementation equivalent found | Internalize local helper |
| `operational-metrics.ts` | `canonicalInstant` | Normalize an explicit-offset datetime to canonical UTC | Temporal primitive | No accepted implementation equivalent found | Internalize local helper |
| `operational-metrics.ts` | `resolveDateOnlyDueInstant` | Start of next local calendar day in explicit timezone | Temporal normalization implementing VOC-1 §6.5 | No accepted implementation equivalent found | Internalize local helper and add direct MVS-1 regression |

### Transitive helper map

`resolveDateOnlyDueInstant` depends only on MVS-1-local private helpers for:

- strict date-only validation;
- next Gregorian calendar date;
- fixed-offset parsing;
- IANA local-date observation with `Intl.DateTimeFormat`;
- deterministic search for the first instant of the target local date.

No MVS-0 resolver, metric, fixture, lifecycle enum, operational state enum, currentness rule or persistence module is imported transitively.

## 4. Hard semantic-stop assessment

**Hard STOP not triggered.**

MVS-1 did not depend on MVS-0 implementations of:

- active/non-active classification;
- lifecycle or terminal semantics;
- waiting/actionable status lists;
- governing deadline selection;
- `NO_DUE` interpretation;
- currentness/supersession resolver policy;
- historical/as-of behavior;
- metric formulas.

The imported date-only function is a normalization primitive whose behavior is identical to the later controlling VOC-1 rule:

```text
dueInstant = startOfNextLocalCalendarDay(dateOnly, authoritativeTimezone)
```

MVS-1 itself continues to decide whether a candidate is governing, which due kinds are eligible, whether timezone authority is present, and whether ambiguity must fail closed. The correction imports no provisional MVS-0 domain resolver logic.

## 5. Chosen remediation

### Option A — accepted primitive reuse

Already-used FH-1 primitives remain unchanged:

- canonical JSON;
- dependency frontier assessment;
- immutable revision/history persistence primitives;
- permitted test-root containment.

Audit found no accepted FH/GPP export equivalent to the small result algebra or temporal normalization helpers.

### Option B — minimal internalization

Chosen for the remaining dependencies:

1. define the MVS-1-used provenance/result types directly in `contracts.ts`;
2. add MVS-1-local `temporal.ts` containing only parsing/timezone normalization;
3. change `operational-metrics.ts` imports to local MVS-1 modules;
4. add an explicit date-only/DST boundary regression;
5. extend the source guard to cover `temporal.ts` and reject any `mvs-0-metrics` dependency.

No new shared framework was created. The helper provenance is explicitly documented in the local temporal source header and in this reconciliation record.

## 6. Exact changed files

1. `spikes/mvs-1-operational-metrics/contracts.ts`
   - removes the MVS-0 type import;
   - internalizes four small types and only the eight unresolved reasons used by MVS-1.
2. `spikes/mvs-1-operational-metrics/operational-metrics.ts`
   - redirects result/provenance imports to local contracts;
   - redirects temporal imports to local temporal helpers.
3. `spikes/mvs-1-operational-metrics/temporal.ts`
   - new MVS-1-local strict instant/date-only/timezone normalization helper;
   - contains no MVS-0 domain resolver or metric logic.
4. `spikes/mvs-1-operational-metrics/mvs-1-operational-metrics.test.ts`
   - adds a governing date-only DST boundary regression;
   - includes the temporal file in the source guard;
   - prevents reintroduction of `mvs-0-metrics` dependency.
5. `docs/dossara/metrics/mvs-1-dependency-reconciliation.md`
   - this evidence and proposed corrective acceptance record.

Source/test correction stat before this document:

```text
4 files changed, 216 insertions(+), 6 deletions(-)
```

The large insertion count is the self-contained 154-line temporal helper; it does not add a second semantic resolver.

## 7. Proof that MVS-0 remains unaccepted

- No file under `spikes/mvs-0-metrics/` was modified.
- No MVS-0 file is proposed for staging or commit.
- The clean validation candidate physically has no `spikes/mvs-0-metrics/` directory.
- MVS-1 import scan returns zero imports from `mvs-0-metrics`.
- The only remaining textual reference inside executable MVS-1 files is a negative test assertion that prevents dependency regression; the temporal provenance header names historical MVS-0 without importing it.
- MVS-0 lifecycle, operational state, due resolver, metrics and fixture code were not copied.

MVS-0 remains **EXPERIMENTAL / HISTORICAL**.

## 8. Clean-state validation

Validation candidate:

```text
C:\SDJ_TEST\SDJ_LEGAL_TEST\mvs1-dep1-candidate-d226d0e-20260817-1625
```

It was created from committed HEAD using `git archive`, then received only the four MVS-1 source/test corrections. `spikes/mvs-0-metrics/` was confirmed absent.

| Check | Result |
|---|---|
| MVS-0 directory absent | PASS |
| MVS-1 import scan | PASS — zero imports from `mvs-0-metrics` |
| MVS-1 targeted | PASS — 1 file, 17 tests |
| FH-1 regression | PASS — 2 files, 18 tests |
| Full Vitest | PASS — 16 files, 358 tests |
| TypeScript `tsc --noEmit` | PASS |
| ESLint | PASS |
| Next.js 16.2.11 production build | PASS using documented `--webpack` fallback for the validation-only external dependency junction |
| Build TypeScript phase | PASS |
| Static generation | PASS — 17/17 routes |

The Webpack fallback was selected from the installed Next 16 documentation because Turbopack rejects a `node_modules` junction that points outside an isolated project root. This is a validation harness constraint; the Webpack build completed compilation, type checking and static generation.

## 9. Semantic regression

The final MVS-1 targeted suite proves:

- active matter is not equivalent to actionable work;
- waiting is derived from dependency authority, not a lifecycle mutation;
- governing due selection remains explicit and fail-closed;
- `NO_DUE` remains distinct from unresolved/unknown;
- `operationalAsOf(T)` enforces `Te = Tk = Tr = T`;
- retrospective reconstruction remains explicitly separate;
- date-only governing due resolves at the start of the next local calendar day, including a Europe/Belgrade DST boundary;
- insertion-order determinism, exact provenance and FH frontier failure propagation remain intact.

Accepted fixture metrics remain exactly:

| Metric | Result |
|---|---:|
| `activeMatterCount` | 5 |
| `mattersWithActionableWorkCount` | 4 |
| `waitingMatterCount` | 1 |
| `openLegalActionCount` | 5 |
| `actionableLegalActionCount` | 4 |
| `overdueLegalActionCount` | 2 |
| `mattersWithoutNextActionableStepCount` | 1 |

No accepted fixture result changed.

## 10. Out-of-scope integrity

Before correction, 35 pre-existing dirty file paths outside the five-file MVS-1-DEP-1 scope had aggregate content SHA-256:

```text
2C1437C706C442B052B281DD9FC68EF0F9878E91CA1CA40010C6190C020E29DA
```

The post-correction calculation covered the same 35 paths and produced the same SHA-256. PCR-2 taxonomy candidate/evidence, Matter Board, Client Profile, Inbox, MTC-1, VOC-1, production operational UI, WRITE-1 paths and all MVS-0 files remain out of scope and content-identical.

## 11. Remaining limitations

- Historical MVS-1 commit `b590e173...` remains non-self-contained by itself; this is intentionally corrected by a new commit rather than amend/history rewrite.
- MVS-1 remains an isolated executable proof, not production metrics or UI.
- The local result types and temporal helpers are MVS-1 proof internals, not a new accepted shared framework.
- This work package does not resolve or accept MVS-0 disposition.
- PCR-2 remains parked until this correction receives a separate owner acceptance/commit decision.

## 12. Proposed commit scope

If separately accepted by the owner, one corrective documentation/proof commit should contain exactly:

1. `spikes/mvs-1-operational-metrics/contracts.ts`
2. `spikes/mvs-1-operational-metrics/operational-metrics.ts`
3. `spikes/mvs-1-operational-metrics/temporal.ts`
4. `spikes/mvs-1-operational-metrics/mvs-1-operational-metrics.test.ts`
5. `docs/dossara/metrics/mvs-1-dependency-reconciliation.md`

No MVS-0, PCR-2 or production file belongs in that commit.

## 13. Outcome

```text
A — MVS-1 REPRODUCIBILITY CORRECTION READY
```

The accepted proof can now be reproduced from committed accepted state plus this narrow corrective delta, with no hidden MVS-0 dependency and no semantic result change. No commit is authorized or created by MVS-1-DEP-1 first pass.
