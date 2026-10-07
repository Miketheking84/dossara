# Stage C Runtime Acceptance

Date: 2026-10-07

## Environment

- Repository: `C:\SDJ_TOOLS\sdj-mike-v1`.
- Branch: `spike/phase-0c-electron-forge-webpack`; HEAD: `24c5e2fefd6c7364b8318a61287803a8c153a2f2`.
- Desktop entry: `npm run desktop:start` → Electron Forge/Webpack B0 renderer.
- Separate web runtime: Next.js 16.2.11 (`build` / `start`). It was not substituted for desktop acceptance.
- `.sdj-mike/settings.json` has both `allowedTestRoot` and `activeRootPath` set exactly to `C:\SDJ_TEST\SDJ_LEGAL_TEST`; no production root is configured there.
- Test matter: not selected. Preconditions stopped before opening any matter or inspecting its business records; sanitization of existing test matters was not assumed.
- Production data/root was never accessed. No runtime was launched, no acceptance fixtures were changed, and no build was executed after identifying the architectural blocker.
- Git was already dirty. Existing tracked/untracked changes include the Stage B Alpha implementation, earlier canonical mutation work, Inbox/client/matter UI work, and documentation. These were preserved. No commit or push.

## Scenarios

| Scenario | Result | Evidence |
|---|---|---|
| Runtime precondition | FAIL | Desktop entry renders only the B0 application-info screen; Alpha is absent from that runtime. |
| Approve | NOT QUALIFIED | Cannot enter the Alpha workflow through the desktop UI. |
| Modify + approve | NOT QUALIFIED | Same runtime blocker. |
| Reject | NOT QUALIFIED | Same runtime blocker. |
| Stale base | NOT QUALIFIED | No runtime interaction or canonical edit performed. |
| Duplicate/retry | NOT QUALIFIED | No runtime apply request performed. |
| Restart/cold reload | NOT QUALIFIED | No desktop Alpha state can be opened. |
| Recovery-required | NOT QUALIFIED | No fault was injected; desktop Alpha recovery controls are absent. |
| Manual external edit | NOT QUALIFIED | No matter/evidence bytes changed. |
| Archive/delete exclusion | NOT QUALIFIED | Matter controls are absent from B0. |
| UI usability | NOT QUALIFIED | Alpha panel was not rendered in the desktop runtime. |

Static evidence: `package.json`, `forge.config.ts`, `desktop/main/index.ts`, and `desktop/renderer/App.tsx` show that desktop loads the dedicated Webpack renderer, exposes application-info IPC, and restricts navigation to that renderer. `docs/dossara/phase-0c-b0-electron-forge-webpack.md` explicitly documents no Next runtime, business filesystem access, or workspace integration. The Alpha panel and API are implemented under `src/app/`, outside this renderer.

Previous Stage B automated results (96 distinct targeted tests covered after the final correction, TypeScript, lint, whitespace checks) remain implementation evidence only. They do not qualify any Stage C runtime scenario. Automated regression was not rerun in Stage C because the mandatory runtime precondition failed and instructions required stopping at the blocker.

## Defects

- **BLOCKER — Alpha is unavailable in the current desktop runtime.** Starting `desktop:start` cannot expose evidence registration, proposal review, canonical apply, or recovery. Desktop integration would require changes to desktop/main/renderer/configuration beyond the previously approved implementation area. No such changes were attempted. This is an acceptance integration gap; no new claim of an Alpha service defect is made.

## Changes made

Only this requested report was created. No production code, settings, dependencies, architecture documents, or test-workspace data changed.

## Remaining limits

All end-to-end Stage C scenarios remain unqualified. Authenticated lawyer identity, OneDrive, multi-device concurrency, actual power-loss recovery, production workspace, Electron/browser interaction, and platform-specific behavior remain unqualified. External writers racing canonical publication remain an existing limitation; no concurrency redesign was attempted.

## Final verdict

**MINIMUM ALPHA NOT ACCEPTED**

Desktop end-to-end acceptance cannot be demonstrated with the current B0 runtime. The next step requires an explicit decision: authorize separate Next.js browser runtime acceptance (which would not qualify Electron), or approve a separately scoped desktop integration before resuming desktop acceptance.


## Next.js Browser Acceptance

### Environment and scope

Stage C.1, 2026-10-07. Built production Next.js 16.2.11 with `npm run build`, then ran `npm run start -- -p 3100` bound to `127.0.0.1`. Settings still specify only `C:\SDJ_TEST\SDJ_LEGAL_TEST`. Edge was launched headlessly using already bundled Playwright; no dependencies were installed. Browser automation entry points failed initialization with “trusted Node process exited unexpectedly”, so bundled Playwright was used. Requests from the test browser were restricted to loopback.

Matter: `C:\SDJ_TEST\SDJ_LEGAL_TEST\01 KLIJENTI\STAGE_C1_SYNTHETIC\SDJ_STAGE_C1_ALPHA`. This freshly constructed synthetic fixture has no client data. An earlier existing acceptance fixture was inspected, but its document list contained real-looking names; no evidence or business data from that fixture was used or changed. Initial canonical `Sledeći korak`: `Synthetic initial step`. The existing UI explicitly accepted its initial baseline. Original input document: 53 bytes, hash `sha256:c6a07b1bc981c5d15bd04a8bcf97b2fd8cdf66bb667a3b04bf1037867f69dc5e`.

Evidence directory: `C:\SDJ_TEST\SDJ_LEGAL_TEST\stage-c1-browser`. Scripts, response/state JSON, original-byte snapshots, screenshots, and fault harness records are preserved there. `stage1-evidence.json` covers modify/reject/stale; `stage4-evidence.json` covers lost-response UI retry; `stage5-evidence.json` covers cold reload, provenance and record integrity; `fault-recovery-evidence.json` and `ambiguous-evidence.json` cover recovery. `receipt-audit.json` verifies one canonical receipt per successful Alpha review. Evidence registration was repeated for independent cases; every proposal still references exactly one preserved evidence item.

### Scenarios

| Scenario | Result | User steps, UI and filesystem evidence |
|---|---|---|
| Approve | PASS | Upload `evidence.txt` → Register evidence → paste original result and `Synthetic approved step` → Save proposal → Review against accepted version → Approve. HTTP 200; only the next-step line changed. Evidence/original result/proposal/review/intent/result and canonical receipt exist. Proposal `2836998e-4bbd-4361-b32c-b13a13cbbfe5`, review `68b81200-41bb-481c-a855-278a98aff676`, transaction `f2c9cd23-6f43-428b-baae-7e79ec42772e`. `approve-review.png`, `approve-result.png`; final reload confirms plain-language success. |
| Modify + approve | PASS | Create proposal → Review → replace final value with `Synthetic lawyer modified step` → “Izmijeni i odobri”. Only next-step bytes changed; original proposed text/result stayed unchanged. Review retains decision `modify` and lawyer value. Proposal `dd8070bb-9989-4efe-b72c-5839e1a4b2df`; `modify-result.png` and final UI show both values. |
| Reject | PASS | Create proposal → Review → “Odbij”. HTTP 200 `REJECTED`; canonical bytes unchanged; rejection has durable review/result and no apply intent/canonical transaction. Reload displays rejection and disables further final review. |
| Stale base | PASS | Open review; externally edit only the synthetic canonical next-step line; click Approve. HTTP 409 `CONFLICT`; external bytes preserved, review decision retained, no silent rebase. Explicitly accept the external baseline through the existing editor before later cases. `stale-result.png`; final panel explains reload/review against current version. |
| Duplicate/retry | PASS | First repeat the exact completed review through actual server HTTP: same success/transaction, no byte changes; altered payload under the same review ID returns 400. Then browser interception discards a response only after the real server successfully applies; panel’s explicit retry returns the same transaction. `stage4-evidence.json`, `retry-success.png`. Receipt audit finds exactly one receipt per successful review. |
| Restart/cold reload | PASS | Stop/restart `next start` with unresolved apply; reopen and load Alpha. Recovery state reconstructed. Stop/restart again with completed decisions and an unreviewed proposal; reopen and load. Persisted state exactly equals the pre-stop snapshot. Pending proposal subsequently rejected through UI. `cold-recovery-pending.png`, `cold-pending-completed.png`, `stage5-evidence.json`. |
| Recovery-required | PASS | Isolated harness invokes existing `RECEIPT_WRITE` fault option on this synthetic matter; no production API fault switch was added. After actual server restart, UI displays pending operation and explicit recovery. Existing baseline acceptance is refused with 409. Click explicit recovery: missing receipt/result finalized, canonical bytes AND mtime unchanged. Review `b13c73eb-3cd2-475a-a3ba-da211298801a`, transaction `31e21db9-161d-4d3d-9c15-7950ebcc5f68`. `recovery-success.png`. Repeat fault then externally edit canonical next-step: UI recovery returns 409 `RECOVERY_REQUIRED`, edited bytes remain unchanged and unresolved state stays blocked. `ambiguous-blocked.png`, `ambiguous-evidence.json`. |
| Manual external edit/hash mismatch | PASS | Register evidence and open review; change only that synthetic source file externally; click Approve. HTTP 409 `CONFLICT`, no canonical change. Original test evidence bytes restored after the assertion. `evidence-mismatch.png`. Canonical token mismatch and ambiguous recovery independently verified above. |
| Archive/delete exclusion | NOT QUALIFIED | Browser/UI path cannot be completed: current `/matters` renders `ClientMatterManager`, which has no archive/delete control. The older `MattersWorkspace` containing that control is not rendered. Actual archive API was exercised from the browser while an apply was unresolved: HTTP 409, matter path and business bytes unchanged. API exclusion is verified; normal UI movement and post-resolution UI archive behavior are not qualified. No out-of-scope archive UI was added. |
| UI usability | PASS | Final Edge UI displays source/original-result links, current value, proposed value, lawyer-reviewed value, explicit approve/modify/reject buttons, and plain-language success/rejection/conflict/recovery outcomes. `final-success.png`, `recovery-success.png`, `ambiguous-blocked.png`. Browser DOM assertions verified current value and readable success text with no raw success code; no page exceptions were observed in final cold-run validation. Cosmetics are basic and remain later work. This is interaction acceptance, not independent lawyer usability research. |

### Durable verification

Before the final intentional ambiguity case, 36 bounded workflow JSON records passed content-hash integrity checks. Original evidence and returned-result hashes matched every persisted proposal. Five successful operations each had one attributable receipt linked to its review; retries reused existing IDs. Before ambiguity, canonical token was `sha256:9d0d4ba023e413f4dcf89cd320c74194aa6a376225b7a6dd188626a8f69af7d1`, accepted revision `683b2493-7f55-4d4c-8bd2-5156084a8dd2`. Final synthetic matter is intentionally left in the verified ambiguous, blocked recovery state; do not treat it as a clean working fixture. Its before/after bytes and hashes are preserved in the evidence directory.

### Observed defects and changes

- **BLOCKER, fixed:** actual browser multipart registration returned 403 because Next production normalized the internal request URL while browser Origin used loopback Host. `src/app/api/matters/next-step-review/route.ts` now validates both internal URL and browser Host as loopback, matching port and exact browser Origin. `route.test.ts` adds normalized-URL, foreign-Host and mismatched-port cases. Cross-origin safeguards remain enforced.
- **MEDIUM, fixed:** raw implementation status codes and lack of an explicit refreshed current value made review outcomes unclear. `src/app/matters/[clientFolder]/[matterFolder]/next-step-review-panel.tsx` now shows current and reviewed values and readable outcomes. Only Alpha strings were added to `src/i18n/messages/en.json` and `src/i18n/messages/sr-Latn.json`.
- **MEDIUM, qualification gap:** archive/delete is absent from the currently rendered matter-management UI. API guard works; adding a UI path would require a file outside the approved Alpha scope and was not attempted.
- **LOW, unchanged:** production build emits an existing Turbopack tracing warning from `sdj-prompts.ts`/prompt-generation route. Build succeeds; unrelated prompt code was not changed.

Only the five approved source/test/locale files above and this report changed in Stage C.1. Electron, dependencies, configuration, and architecture remained unchanged. All test fixture/script writes were confined to the designated test root. Initial unrelated repository changes were preserved.

### Automated regression

Final production build PASS. Six targeted suites PASS, **97 tests**: Alpha service, canonical adapter, next-step-review API, command-center API, archive API, and canonical mutation primitive. Two isolated fault-harness runs also PASS; these prepare fixtures and are not counted as browser acceptance. TypeScript (`--noEmit --incremental false`), targeted lint and `git diff --check` PASS. Existing CRLF conversion warnings are not whitespace errors.

### Remaining limits and browser verdict

Electron integration is outside this approval and remains unqualified. Lawyer attribution is not authentication. External simultaneous writers, OneDrive/multi-device operation, real power-loss recovery, production workspace, other browsers/platforms, mobile rendering, and packaged desktop behavior remain unqualified. Recovery evidence uses supported deterministic fault injection, not physical power interruption. Archive UI and normal post-resolution archive movement remain NOT QUALIFIED. No dependency additions, commit or push; no production root/data access.

**NEXT.JS MINIMUM ALPHA ACCEPTED WITH NON-BLOCKING LIMITATIONS**

The implemented evidence → proposal → lawyer decision → controlled update → provenance/recovery slice is operational in the real Next.js browser/server runtime. Archive UI qualification remains incomplete because no current UI path exists; the interfering server-side archive path is verified blocked. This verdict does not claim that every Stage C UI scenario or Electron acceptance is complete. The separate Electron B0 verdict above remains **MINIMUM ALPHA NOT ACCEPTED** for that runtime.
