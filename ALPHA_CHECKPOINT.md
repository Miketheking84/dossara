# DOSSARA — Alpha Checkpoint

Date: 2026-10-07 (Europe/Belgrade). Stage E: freeze and checkpoint planning only.

## 1. Freeze decision and scope

The owner has functionally accepted the bounded Next.js and local Electron Alpha with non-blocking limitations. Freeze the existing implementation:

`one evidence item → one proposed nextStep → lawyer approve/modify/reject → controlled canonical update → durable provenance and explicit recovery`.

This is a local test-environment checkpoint, not production-root authorization, full Track A acceptance or packaging acceptance. The controlling project act remains `docs/dossara/decision-alignment-register-v1.2.md`. Earlier Stage A proposals are historical recommendations; broader architecture in them is not the freeze scope.

Stage E creates only `ALPHA_CHECKPOINT.md`. No business, mutation, review, recovery, lifecycle, renderer, dependency or configuration code is changed. No observed implementation blocker requires a fix. No staging, commit, push, stash, reset, cleanup or migration is authorized/performed.

## 2. Repository snapshot and exact change inventory

- Repository: `C:\SDJ_TOOLS\sdj-mike-v1`.
- Branch: `spike/phase-0c-electron-forge-webpack`.
- HEAD: `24c5e2fefd6c7364b8318a61287803a8c153a2f2` (`fix: close FIELD-1A preflight safety gaps`).
- Before Stage E: 21 modified tracked files + 43 untracked files = 64 dirty paths; staged set empty. This document is the 65th dirty path afterward.
- Accepted Next footprint: 8 runtime files, 6 tests, 2 mixed locale files. Electron footprint: 3 runtime files and 4 test/tooling files. Unrelated work: 28 paths. Existing documentation: 13 paths.
- Ownership and file role are separate: an Alpha test belongs to Alpha but is test-only; a historical document is not runtime or proof of current feature acceptance.

The following groups cover all 64 pre-existing dirty paths exactly once. Paths are repository-relative. Classification concerns the current delta against HEAD; it does not reclassify already committed baseline code.

### Accepted Next.js Alpha: runtime

- `src/lib/sdj-next-step-review.ts`
- `src/lib/sdj-canonical-mutation.ts`
- `spikes/write-1v-v1-mutation/canonical-mutation.ts`
- `src/app/api/matters/next-step-review/route.ts`
- `src/app/api/matters/command-center/route.ts`
- `src/app/api/matters/delete/route.ts`
- `src/app/matters/[clientFolder]/[matterFolder]/next-step-review-panel.tsx`
- `src/app/matters/[clientFolder]/[matterFolder]/page.tsx`

### Accepted Next.js Alpha: tests only

- `src/lib/sdj-next-step-review.test.ts`
- `src/lib/sdj-canonical-mutation.test.ts`
- `spikes/write-1v-v1-mutation/write-1v-v1-mutation.test.ts`
- `src/app/api/matters/next-step-review/route.test.ts`
- `src/app/api/matters/command-center/route.test.ts`
- `src/app/api/matters/delete/route.test.ts`

### Mixed locale files: Alpha namespace only accepted

- `src/i18n/messages/en.json`
- `src/i18n/messages/sr-Latn.json`

### Accepted Electron bridge: runtime

- `desktop/main/index.ts`
- `desktop/main/next-runtime.ts`
- `desktop/main/security/next-runtime-policy.ts`

### Accepted Electron bridge: tests/acceptance tooling only

- `desktop/main/next-runtime.test.ts`
- `desktop/main/security/next-runtime-policy.test.ts`
- `scripts/desktop/b0-smoke.cjs`
- `scripts/desktop/alpha-runtime-acceptance.cjs`

### Unrelated pre-existing application work

- `src/app/api/clients/profile/route.ts`
- `src/lib/sdj-client-profile.ts`
- `src/app/api/inbox/file/route.ts`
- `src/app/api/inbox/files/route.ts`
- `src/app/api/inbox/open-folder/route.ts`
- `src/lib/sdj-inbox.ts`
- `src/app/inbox/page.tsx`
- `src/app/matters/[clientFolder]/[matterFolder]/matter-file-browser.tsx`
- `src/app/matters/client-matter-manager.tsx`
- `src/app/api/matters/route.ts`
- `src/app/globals.css`
- `src/lib/sdj-command-center-update.ts`

### Unrelated pre-existing tests only

- `src/lib/sdj-client-profile.test.ts`
- `src/lib/sdj-inbox.test.ts`
- `src/lib/sdj-command-center-update.test.ts`

### Unrelated earlier experimental code, helpers and tests

- `spikes/write-1-executable/canonical-mutation.ts`
- `spikes/write-1-executable/canonical-mutation.test.ts`
- `spikes/write-1-executable/fse-1-hold-open.ps1`
- `spikes/write-1-executable/fse-1-windows-environment.test.ts`
- `spikes/write-1-executable/write-1r-race-resistant-target.test.ts`
- `spikes/write-1-executable/write-1r-target-guard.ps1`
- `spikes/write-1-executable/write-1r2-handle-relative-publication.test.ts`
- `spikes/mvs-0-metrics/contracts.ts`
- `spikes/mvs-0-metrics/metrics.ts`
- `spikes/mvs-0-metrics/mvs-0-metrics.test.ts`
- `spikes/mvs-0-metrics/projection-store.ts`
- `spikes/mvs-0-metrics/resolvers.ts`
- `spikes/mvs-0-metrics/temporal.ts`

### Documentation only

- `CURRENT_ARCHITECTURE.md`
- `GAP_ANALYSIS.md`
- `PROPOSED_ARCHITECTURE.md`
- `IMPLEMENTATION_PLAN.md`
- `STAGE_C_RUNTIME_ACCEPTANCE.md`
- `ELECTRON_INTEGRATION_PREFLIGHT.md`
- `docs/dossara/field/field-1a-real-matter-pilot.md`
- `docs/dossara/governance/recon-0-repository-state.md`
- `docs/dossara/persistence/fse-1-filesystem-environment-qualification.md`
- `docs/dossara/persistence/write-1-canonical-matter-mutation.md`
- `docs/dossara/persistence/write-1r-race-resistant-target-enforcement.md`
- `docs/dossara/persistence/write-1r2-handle-relative-publication.md`
- `docs/dossara/production/pcr-1-matter-classification-review.md`

### Mixed changes and dependencies

In each locale file, only the complete `AlphaNextStep` JSON namespace belongs to accepted Alpha (including readable C.1 outcomes/current/reviewed values). Changes in `Inbox` and the Inbox additions in `MatterFiles` are unrelated. Do not stage either locale file wholesale. Preserve valid JSON and the structural comma needed to add the Alpha namespace; inspect the staged diff rather than assuming hunk boundaries equal namespace boundaries.

`src/app/matters/[clientFolder]/[matterFolder]/page.tsx` currently has only the Alpha import/render delta, so its whole current diff is in scope. The command-center and delete routes' current deltas are the Alpha pending-operation gates. All current `sdj-canonical-mutation` and WRITE-1V deltas listed above belong to the bounded review/replay/recovery adapter; they do not authorize a generalized engine.

The unrelated group includes client profiles; Inbox filesystem/API/browser integration; matter-list attention/filter/priority/style changes; legacy board rewrites and their tests; earlier WRITE-1E/WRITE-1R experiments; and MVS-0 experiments. Preserve them without staging them for Alpha. Their presence in the accepted runtime working tree does not accept their capabilities. Historical RECON/PCR reports refer to older HEADs and are not current commit blockers or new feature approvals by themselves.

`spikes/write-1v-v1-mutation/` is a **real runtime dependency**: the server adapter imports its canonical primitive; its tracked `contracts.ts` and `windows-handle-publication.ps1` are required baseline assets. These unchanged assets are already in HEAD and need no new commit. The dirty `spikes/write-1-executable/` experiment is a separate implementation, not an imported Alpha prerequisite. Other unchanged HEAD dependencies include the safe matter resolver, workspace settings reader, initial-document validator, file-preview routes and foundation envelope primitives. No missing untracked business dependency was found in the Alpha import chain. Location normalization remains deferred.

The four Stage A documents are historical audit/planning documents. `STAGE_C_RUNTIME_ACCEPTANCE.md` and `ELECTRON_INTEGRATION_PREFLIGHT.md` are directly relevant Alpha evidence/planning. The remaining seven `docs/dossara/` documents are historical reviews/pilot or persistence evidence, not newly accepted features. No historical document is rewritten or deleted in this freeze.

## 3. Accepted capabilities

- Preserve original evidence bytes and original returned result, with exact hashes, matter/source references and durable proposal identity.
- Review one proposed `nextStep`; preserve approve/modify/reject decisions and lawyer-supplied attribution. Rejection leaves canonical bytes unchanged.
- Apply through the existing canonical boundary with the reviewed base revision and exact read token. Unrelated canonical content is preserved; stale bases/external source mismatches refuse apply.
- Persist review, apply intent, operation/revision identity, result and canonical receipt. Exact retries reuse successful operation identity without another successful publication.
- Reconstruct pending/completed state after a cold restart. Recover only on explicit user action; refuse ambiguous post-publication external changes. Pending applies exclude competing canonical/baseline/archive writes.
- Electron owns one direct Node/Next launch on `127.0.0.1:3100`, verifies listener/process ownership and bounded readiness, and loads the same accepted Next UI in a sandbox without legal preload/IPC business APIs.
- Single-instance behavior avoids another server on a second Electron launch. Local navigation, request, popup, permission and download restrictions remain in place. Restricted TXT source viewing and blocked viewer mutations/navigation were exercised.
- Port collision, server crash and orphan refusal fail closed. No runtime-failure path silently retries a legal mutation or adopts an existing listener.

## 4. Current runtime modes and rollback

| Mode | Selection | Behavior |
|---|---|---|
| Electron B0 rollback | `DOSSARA_ALPHA` unset or any value other than exact `1`; `npm run desktop:start` | Existing Webpack application-information screen with its original preload/IPC/navigation/CSP; no Next startup. |
| Electron local Alpha | `DOSSARA_ALPHA=1`; `npm run desktop:start` | Own approved external Node/Next production runtime on exact loopback port 3100; show existing Next UI. |
| Standalone Next browser Alpha | `npm run start -- -p 3100` with approved settings/build | Same bounded workflow through the browser. Electron does not adopt this independently running listener. |

Do not run standalone Next and Electron Alpha together on port 3100. `DOSSARA_TEST_PROFILE=1` only selects a test-root technical profile for B0; it does not enable Alpha. Alpha selects its test-root profile itself. The Next workflow is already available in Next; `DOSSARA_ALPHA` selects the Electron bridge only.

Rollback: close Electron normally and verify owned listener termination; then launch B0 with Alpha disabled. Keep original evidence/history/pending recovery records. B0 does not resolve legal recovery or change canonical data. Reverting shell files later is a separate approved code action, not a data rollback.

## 5. Required environment assumptions

- **Only permitted data/test root: `C:\SDJ_TEST\SDJ_LEGAL_TEST\`.** No production SDJ or OneDrive root is authorized.
- Local Windows checkout at exact `C:\SDJ_TOOLS\sdj-mike-v1`; local filesystem supports the accepted Windows publication helper. No symlink/reparse redirect of approved setup/assets/root is accepted by the bridge.
- Approved Node at `C:\Program Files\nodejs\node.exe`, exact `v24.13.0`; installed Next `16.2.11`, Electron `43.2.0` and existing lockfile dependencies. These are local qualified prerequisites, not a portable package contract.
- Existing production `.next` build is required; snapshot BUILD_ID: `WQsIAjagCyh6RePsgRlv1`. Startup requires a nonempty build ID, not this pinned literal ID. Forge compiles existing TypeScript helpers with unchanged configuration.
- `.sdj-mike/settings.json` must retain both `allowedTestRoot` and `activeRootPath` equal to the test root. Snapshot locale is `sr-Latn`. Settings/native helper/runtime metadata are read-only audit prerequisites; business test data stays under the test root.
- Port 3100 must be free before Electron Alpha launch. It binds exact `127.0.0.1`; `localhost`, wildcard or alternate ports are not silently substituted by the bridge.
- Fixed Windows netstat, PowerShell/CIM and taskkill tooling must function. Ownership verification failure blocks the runtime; process identity must be verifiable before termination.
- `00 CONTROL/alpha-next-step/` remains bounded Alpha workflow state. It is not universal facts/issues/events/changes authority. Single local writer is the qualified model.
- Existing native WRITE-1V helper and Node server-only filesystem boundaries must remain intact. No external provider, network service or new dependency is required.
- The acceptance harness uses already bundled Playwright, optionally located through `DOSSARA_PLAYWRIGHT_PATH`; it is test tooling, not a new application dependency.
- Legacy tests using `os.tmpdir()` must not be rerun without directing/verifying TEMP and TMP beneath the approved test root. Stage E runs only the two read-only/pure desktop suites and does not rerun those legacy filesystem suites.

## 6. Acceptance evidence and qualification boundaries

Browser report: `STAGE_C_RUNTIME_ACCEPTANCE.md`, section **Next.js Browser Acceptance**, verdict **NEXT.JS MINIMUM ALPHA ACCEPTED WITH NON-BLOCKING LIMITATIONS**. Its earlier B0-only failure is historical and remains valid for B0 alone; later Electron bridge evidence qualifies Alpha mode, not B0 as a legal workflow runtime.

Browser evidence root: `C:\SDJ_TEST\SDJ_LEGAL_TEST\stage-c1-browser`. Presence checked in Stage E: `stage1-evidence.json`, `stage4-evidence.json`, `stage5-evidence.json`, `fault-recovery-evidence.json`, `ambiguous-evidence.json`, `receipt-audit.json`. The report records actual browser steps, API results, exact hashes/IDs and screenshots. C.1 reported 97 targeted tests, production build, TypeScript, lint and diff checks passing.

Electron workflow evidence: `C:\SDJ_TEST\SDJ_LEGAL_TEST\stage-d-electron\2026-10-07T13-45-22-687Z\acceptance.json`.

- SHA-256: `78a0bb3831641abea2f38001a4ffa7799fd7d598b9c05f39f7ed71ad0df4214f`.
- PASS: approve, modify, reject, exact retry/changed identity refusal, lost-response explicit UI retry, TXT source viewer restrictions, stale base, cold completed/pending reconstruction, cold interrupted-apply recovery, pending API exclusions and ambiguous external-hash refusal. No recorded acceptance errors or page exceptions.
- Archive/delete **UI** remains NOT QUALIFIED: no control in the accepted rendered UI. Archive/delete and baseline **API exclusion** was exercised through the Electron renderer and passed; it is not claimed as UI movement acceptance.
- Same directory preserves DOM text, screenshots, supported fault-hook fixtures/logs, operation IDs, hashes and a durable-record manifest. Its final synthetic matter intentionally remains recovery-required after the ambiguity case; it is evidence, not a fresh clean fixture.

Electron lifecycle evidence: `C:\SDJ_TEST\SDJ_LEGAL_TEST\stage-d-electron\2026-10-07T13-41-31-781Z\acceptance.json`.

- SHA-256: `9cf10f3ca5b8cebd6bf9cc95a78d8b14af3ff3dc4712f2fde88984748288910c`.
- PASS: one owned server/sandbox, second launch suppression, verified normal shutdown, unrelated occupied-port refusal, server crash and orphan refusal. No recorded acceptance errors.

Complete seven-file Electron diff: `C:\SDJ_TEST\SDJ_LEGAL_TEST\stage-d-electron\2026-10-07T13-45-22-687Z\complete-diff.patch`; SHA-256 `206e5e4b1228fa9895d3338b807f867063a29f79660c114b66da07090c1cf676`. Stage E reverse-check matches current source, including the five new files. Local bridge completion reported 113 tests in nine targeted suites plus TypeScript, targeted lint, B0 smoke, Forge compilation and whitespace checks. This is retained historical validation, not a Stage E rerun or proof that every legacy test used the root without a TEMP/TMP override.

Evidence is machine-local under the test root and is **not included in Git commits**. A source checkpoint alone will not contain these artifacts; preserve them separately. No fixtures, browser profile, `.next`, `.webpack`, node_modules or local settings should be staged. No new evidence export/infrastructure is introduced here.

## 7. Known orphan limitation and other unqualified behavior

A forced Electron-main termination can leave its directly spawned Next server running on Windows. A surviving Electron child can also retain the singleton lock. A subsequent launch refuses either the occupied port or the instance lock; it never adopts/kills an unverified listener. Normal owned shutdown was qualified and verifies listener closure. Test harness cleanup used saved PID/executable/command/creation identity for only its own test processes.

There is **no automatic orphan cleanup**, Windows job object or watchdog infrastructure. No claim of orphan-free forced termination or graceful server-side Windows draining is made. Normal close permits bounded in-flight response completion, then terminates only the verified owned tree; interrupted work relies on durable explicit Alpha recovery.

Other unqualified/deferred limits:

- Authenticated lawyer identity: names/IDs are attributable local input only.
- External simultaneous canonical/settings writers, workspace leases, hostile local listener replacement while the server remains alive, OneDrive/multi-device use and production roots. Ownership monitoring/parser rejection exists; live listener replacement is not runtime-qualified.
- Physical power loss and actual kill timing at every publication boundary. Recovery uses supported fault hooks with the runtime stopped; it is not a physical power-loss simulation.
- Electron PDF/image visual preview qualification; TXT viewer is qualified. Built-in PDF component policy is not itself a PDF acceptance result.
- Other platforms/browsers, mobile/responsive usability, independent lawyer usability research and full legal-office rollout.
- Self-contained packaging, ASAR/native helper closure, installation/update/signing, Node bundling, strict Next nonce CSP and the existing prompt tracing warning.
- Independent acceptance of the unrelated dirty client/Inbox/board/metrics/older experiment work. Alpha acceptance is not a blanket approval of those flows visible in the current working tree.

## 8. Proposed clean commit plan — not executed

1. **`feat: freeze bounded Next Alpha next-step review`** — exactly the 8 Next runtime files and 6 Next tests listed in section 2, plus only the `AlphaNextStep` namespaces in the two mixed locale files. Keep the service, adapter, replay support, competing-write gates and UI together so this commit is self-consistent. Do not include Inbox locale changes.
2. **`feat: expose accepted Alpha through owned local Electron runtime`** — exactly the 3 Electron runtime files and 4 Electron tests/tooling files in section 2. Depends on commit 1 and the committed WRITE-1V/native helper baseline. No Forge/Webpack/renderer/preload/package changes.
3. **`docs: record bounded Alpha acceptance and checkpoint`** — exactly `STAGE_C_RUNTIME_ACCEPTANCE.md`, `ELECTRON_INTEGRATION_PREFLIGHT.md`, `ALPHA_CHECKPOINT.md`. Preserve historical B0/Stage C findings and clearly distinct runtime verdicts. Stage A audit documents and older review/pilot/persistence documents are separate optional historical-document work, not silently included.

Leave all 28 unrelated paths and the 11 other historical documents unstaged. Do not use `git add .`, `git add -A` or whole-file locale staging. No commit/push commands are run in Stage E. A later approval must permit staging/commit explicitly.

Before the later authorized commit: inspect the exact staged path list and staged diff; verify namespace-only locale staging and valid JSON; then validate the selected candidate tree. Current browser/Electron acceptance ran on the full dirty working tree, so do not present a HEAD-plus-selective-Alpha tree as already rebuilt/runtime-qualified. If a clean candidate exposes a missing dependency, stop for a decision rather than silently including unrelated work. No temporary clean checkout, rebuild or extra runtime acceptance is created in this documentation-only freeze.

## 9. Minimum Stage E validation

Because Stage E changes only documentation and current Electron source exactly matches the delivered diff, broad filesystem regressions, runtime crash injection and builds are not repeated.

| Check | Stage E result |
|---|---|
| `node scripts/desktop/b0-smoke.cjs` | PASS: B0 boundaries, rollback path, exact Alpha opt-in and local bridge guards. |
| Two desktop Vitest suites, `--no-cache` | PASS: 7 tests in 2 files; settings, listener ownership and navigation/request/failure policy. No server/writer is launched. |
| Desktop TypeScript, `tsc --noEmit -p tsconfig.desktop.json` | PASS. |
| Delivered Electron patch, `git apply --reverse --check` | PASS; read-only match to current seven-file implementation. |
| Recorded acceptance JSON and referenced browser evidence | PASS: both Electron verdicts successful, no errors; six named browser artifacts present. |
| Complete current tracked diff and untracked-path classification | PASS: all 64 pre-existing paths assigned once; mixed locale staging explicitly identified. |
| Final document/diff whitespace and repository preservation | PASS: no whitespace errors; pre-existing file bytes and index unchanged; only this document added. |

The historical 113-test run is not rerun or relabeled as a Stage E result. Pure/read-only checks are enough to confirm the documentation freeze did not change executable code. Full candidate build/runtime validation remains a gate for the later selectively staged commit.

## 10. Explicit deferrals and checkpoint readiness

No packaging, automatic orphan cleanup, authentication, OneDrive/multi-device work, RAG, agents, OCR, email ingestion, provider APIs, facts/issues/chronology automation, new proposal types, generalized ChangeSets/workflow engines, repository-wide IDs, Word/template expansion, native helper relocation, dependencies or unrelated refactors are authorized by this freeze.

**READY FOR AN ALPHA CHECKPOINT PLAN AND DOCUMENTATION FREEZE.** The accepted implementation is unchanged and its bounded capabilities are operational in both qualified runtimes. It is a candidate for the three scoped commits above after separate approval, selective locale staging and candidate-tree validation. **NOT READY FOR A BLANKET DIRTY-WORKTREE COMMIT**, and no clean Alpha-only staged tree has yet been validated. Preserve unrelated work and local acceptance evidence. No production root/data accessed during Stage E; no application server or browser was started; no commit or push.

## Appendix — frozen current Alpha file identities

SHA-256 of current full-file bytes, not the future staged delta. The two mixed locale hashes include unrelated Inbox content and do not accept it. These identities support detection of later changes; this document is not self-hashed.

| Path | SHA-256 |
|---|---|
| `desktop/main/index.ts` | `9d57203b122b4857d9b41dcbd020a4439d9ec402b48a650f9af51c777973fd53` |
| `desktop/main/next-runtime.test.ts` | `1a4a4d1605a52c5bfa8adbe9673780d10d4b273ee67c2da130bcd061e2efa70a` |
| `desktop/main/next-runtime.ts` | `a4e4edeeb5bce4a8014b7ef3174455b9fa99ecddf147f935a086eabf65d39d11` |
| `desktop/main/security/next-runtime-policy.test.ts` | `73d499f0811a39b1889b8a62e916ba80462a898faea05593210080534db1e9ff` |
| `desktop/main/security/next-runtime-policy.ts` | `5a88e9a1a20b6749a5598d6874a1388c4bf6132a9ff4e51162d872b25ed7a378` |
| `scripts/desktop/alpha-runtime-acceptance.cjs` | `cad1fe9d55962664e94eb927da73f6b43743d2d600e189fbe8a7cd4cdc3525ef` |
| `scripts/desktop/b0-smoke.cjs` | `f266250599da318b0401ff1d3dbc2cc872ac1fce4ea0bfaea11cfb4e49c93347` |
| `spikes/write-1v-v1-mutation/canonical-mutation.ts` | `f4cc812ead8de2c3b9a60fd72a84adf942198f26b5accad11d78fb4d084c47ca` |
| `spikes/write-1v-v1-mutation/write-1v-v1-mutation.test.ts` | `16b409e4b809181d23719b80263e2ea00bb79e57fee50856951e2b45542675a7` |
| `src/app/api/matters/command-center/route.test.ts` | `8e9fda920fee41f3977f3c5d2813df63041f9b35e95e419713e5fe27f8a4a767` |
| `src/app/api/matters/command-center/route.ts` | `39d476e3ffbf304cf67d3d7d78518eac7f765d764932dc3ebae6b4755780a25b` |
| `src/app/api/matters/delete/route.test.ts` | `d3a458d02b1010a2d1556a2dca92f9755e14bf690ed4303c269ca710d40c6e4d` |
| `src/app/api/matters/delete/route.ts` | `01d92ff5ce5c8317b9ac910fd888244eed651753ffcbcccb063816090e631f32` |
| `src/app/api/matters/next-step-review/route.test.ts` | `e18cbf698d795a3db467c2e6b9b303de5076f1f232949206394a541b26f0029d` |
| `src/app/api/matters/next-step-review/route.ts` | `5b546c8afaaf4f768a4b63ec1af3f6c00fa9c4e61102c1de152ec28b9c1f1569` |
| `src/app/matters/[clientFolder]/[matterFolder]/next-step-review-panel.tsx` | `51d43646dfc60fe4082935ab5cf272206079f4a879da0e7d761b8dbee6eaa2f0` |
| `src/app/matters/[clientFolder]/[matterFolder]/page.tsx` | `9a0aa4447b0ee4e408dd7e3fcef250d00cd32ed999b6110e91a9831170567a73` |
| `src/i18n/messages/en.json` | `1d7d64591417f69ed7ae7d00f7e058fc5c5c0b16f0dc9a2bd484dc5831b11dac` |
| `src/i18n/messages/sr-Latn.json` | `511e40768b4fcea3994ccaebbc7d17b7f9ec69e45c45ce6052bf9643e224a7e7` |
| `src/lib/sdj-canonical-mutation.test.ts` | `3e4c347b96223cfc4631e79fb0845dd2d157c0ab29da3aa4c9acde9ab3e79953` |
| `src/lib/sdj-canonical-mutation.ts` | `67b52fb21e1302473acbb33c1c6f0db17f956ee178933cd03f8f1804441da363` |
| `src/lib/sdj-next-step-review.test.ts` | `b648381b8e4055b3fffb62af0ce5563c6db6be9f2c768238f5a1b9546cbc3af6` |
| `src/lib/sdj-next-step-review.ts` | `d164565a60c976e74365cdc8eb9ac4e1a26108315778162b91ef1f88cca7b363` |
