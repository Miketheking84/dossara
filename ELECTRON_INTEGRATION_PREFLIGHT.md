# Electron Integration Preflight

Date: 2026-10-07. Status: recommendation only; implementation is not authorized by this document.

**Recommendation: Option A — one Electron-owned Next.js production server, displaying the existing application directly in a sandboxed BrowserWindow.** Start with the already qualified local Node/Next build. Do not duplicate Alpha UI, review, mutation, provenance or recovery. The local bridge is MEDIUM complexity; self-contained packaging is a separate HIGH-complexity qualification gate, not an implied deliverable of that bridge.

## 1. Current desktop architecture

`desktop/main/index.ts` creates a single-instance Electron application and a BrowserWindow loading `MAIN_WINDOW_WEBPACK_ENTRY`. Forge/Webpack builds the dedicated `desktop/renderer/App.tsx` screen. The screen only requests six application-info values through `system:get-app-info`.

Main enables global sandboxing. Window settings are `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, `webSecurity: true`, and `allowRunningInsecureContent: false`. New windows are denied. Navigation and redirects must match the exact initial B0 renderer URL. IPC additionally checks the sender webContents, main frame and exact URL. Preload exposes only a frozen application-info API.

Packaged B0 uses ASAR and its own HTML CSP, including `connect-src 'none'`. Forge development uses its renderer server on port 3000, with localhost allowed. Desktop currently owns no legal filesystem service or Next process. `scripts/desktop/b0-smoke.cjs` explicitly rejects child-process use, HTTP URLs and filesystem access in desktop source; those are B0-specific assertions, not proof that a newly approved loopback bridge must remain impossible.

The separately accepted application lives under `src/app/`. Its scripts build with `next build` and serve with `next start -H 127.0.0.1`; development is also bound to loopback. Stage C.1 qualified the production server on port 3100 with Node `v24.13.0` at `C:\Program Files\nodejs\node.exe`. These are observations of this machine, not a portable installation contract.

## 2. Why Alpha is unavailable in Electron

Electron never loads the Next application or starts its runtime. The desktop renderer neither imports the Alpha panel nor has the server routes it needs. The current exact-URL navigation policy also rejects entering Next routes. Copying JSX would not supply server-only filesystem services, canonical publication or durable recovery, and would create a second workflow.

Canonical access remains `Next API → sdj-next-step-review → sdj-canonical-mutation → existing mutation primitive/native helper`. The spike folder is a real runtime dependency and must remain in place. Main/renderer must not import these business modules or write canonical/workflow records.

## 3. Option A/B/C comparison

| Assessment | A: Electron owns existing Next | B: independently controlled Next | C: renderer-only integration |
|---|---|---|---|
| Exact local files | Section 5 local allowlist. | Same main/policy files/tests and B0 smoke adaptation; `desktop/main/next-runtime.ts` would become a connector/ownership validator instead of a launcher. No renderer/business edits. | No viable renderer-only implementation exists. Candidate shell changes would be `desktop/main/index.ts`, `desktop/renderer/App.tsx`, `desktop/renderer/index.html`, `webpack.renderer.config.ts`; they still require A/B or an out-of-scope server adapter. Not recommended or proposed for approval. |
| Runtime/process model | Electron main supervises one existing Node process running the Next CLI directly; Next alone owns business writes. | Operator/supervisor starts the same server; Electron owns only its window. Must prove which runtime owns the listener. | Static B0 renderer cannot run Node APIs or Next server routes. Embedding a live Next view is still A/B, not a third business runtime. |
| Startup | Verify build, root/settings, Node path and free pinned port; start one child; verify its bind/readiness; load exact loopback origin. | Verify approved external launcher/process/build/root and exact listener, then connect. A page title or HTTP 200 is insufficient ownership evidence. | Loading accepted server-rendered UI requires server startup from A/B. Static export is impractical because Alpha has server-only, dynamic filesystem routes. |
| Shutdown | Close mutation-capable UI, stop only owned process, verify exit and listener closure; interruptions use accepted recovery. | Close UI only; independent owner is responsible for server drain/stop. Never terminate a process merely because it uses the port. | Local renderer exit does not resolve server lifecycle. |
| Crash/restart | Server crash closes/invalidates the window; no silent apply retry. Main crash may orphan a plain Node child on Windows: next launch refuses its occupied port pending verified cleanup. | Server can outlive Electron deliberately; loss/replacement requires refusal and renewed ownership verification. Two independently restarted applications complicate ownership. | No independent recovery path; process-memory state cannot replace durable Next records. |
| Port | Pin 3100 for the first bridge; fail on collision. Do not adopt whatever answers there. | Pin 3100 and verify external process identity; no discovery/scanning. | No server port only if server functionality is removed, which violates scope. |
| Loopback/origin | Reuse exact `http://127.0.0.1:3100` and current Host/Origin/fetch-site checks. | Same checks; additionally independent listener ownership. | `file:` origin and relative `/api` calls are incompatible with current trust assumptions. Do not weaken guards for file-origin requests. |
| Navigation | Replace exact B0-document policy only in Alpha mode with scoped same-origin app paths and document-viewer handling. | Identical policy. | A live embedded view needs the same policy; no safety simplification. |
| CSP/security | No preload/IPC bridge on Next window; retain sandbox and web security. B0 HTML CSP does not apply to HTTP Next responses. Scope new shell controls to Next session. | Same; connecting to an unrelated local server would be a meaningful trust failure. | Copying B0 `connect-src 'none'` breaks fetch; broad relaxations or Node integration would be unacceptable. |
| Filesystem | Only Next accesses canonical/workflow data. Main may read setup/build metadata; never legal records or import mutation modules. | Same, with external runtime as writer. | Cannot access canonical files while retaining sandbox; moving services into Electron duplicates/broadens accepted logic. |
| Pending Alpha recovery | Existing file records/PID gate; reopen and use explicit recovery. No automatic rebase, receipt repair or lock deletion by Electron. | Same; external server PID may still be alive, so lock recovery must continue refusing it. | New renderer cannot substitute for accepted review/intent/result semantics. |
| Browser behavior | Same HTML, routes, source links and API calls; Electron Chromium/close/popups need new acceptance. | Same, plus external lifecycle/disconnect acceptance. | Static rendering changes fetch/hydration and provenance/recovery behavior; browser qualification is not preserved. |
| Testability | Deterministic owned startup/failure injection, collision, child exit and restart tests. | Connector tests easy; actual external ownership/replacement/drain needs a separate controlled launcher/supervisor. | High regression burden; no demonstrated need because A/B are feasible locally. |
| Packaging | Existing local Node/checkout first. Self-contained distribution requires an explicit server/runtime payload and native helper asset qualification; B0 ASAR is insufficient. | B0 package plus separately installed/managed qualified Next runtime; fails self-contained launch unless another owner is packaged. | Static export cannot package the accepted server behavior; no packaging shortcut. |
| Complexity | MEDIUM local; HIGH self-contained packaging. Local lifecycle/security is real work, not a generalized framework. | LOW for an unverified URL loader; MEDIUM for a controlled local connector; HIGH if an independent installed supervisor must be supplied. | HIGH/non-viable within renderer-only scope; driven by real server/filesystem/origin constraints. |
| Migration risk | LOW for Alpha data and business code; MEDIUM for shell/lifecycle; HIGH if deployment moves runtime assets/settings without qualification. | LOW data risk; MEDIUM ownership/operator risk and two lifecycles; later A conversion still needed for owned desktop startup. | HIGH behavioral drift or business duplication if forced. |

A is preferred because lifecycle ownership is explicit and no second installation/supervisor or listener-adoption scheme is necessary for the first local bridge. B remains a valid controlled testing fallback; this audit does not claim it is inherently unsafe. C is not justified: A and B are feasible locally and C would not remove the server dependency.

## 4. Recommended integration path

Implement only an opt-in local Alpha desktop mode, preserving B0 as a rollback mode. Use the current prebuilt Next application; never run a build or `next dev` on user launch. Main starts the already installed, explicitly validated Node executable with the absolute existing Next CLI, arguments `start <absolute repository path> -H 127.0.0.1 -p 3100`, explicit cwd `C:\SDJ_TOOLS\sdj-mike-v1`, and telemetry disabled. Spawn directly without a shell or npm intermediary; `process.execPath` in Electron points to Electron, so it cannot silently substitute for the qualified Node executable.

Only setup paths/process ownership/navigation belong in the shell. All evidence/proposal/decision/apply/recovery requests continue through the unchanged Next UI/API. Do not add an Electron mutation IPC channel, a file-backed legal service in main, a separate review screen, or a universal runtime framework.

Option A could later use Electron's built-in `utilityProcess` to run an entry script without shipping an external Node binary, but Next compatibility, Electron's Node version, native-helper behavior and shutdown would have to be requalified. It is not assumed equivalent to Stage C.1 and is not the initial path. The official API supports a script entrypoint, cwd and child lifecycle control. [Electron utilityProcess](https://www.electronjs.org/docs/latest/api/utility-process).

## 5. Exact proposed file allowlist

For a **local integration implementation**, propose only:

| File | Purpose |
|---|---|
| `desktop/main/index.ts` | Opt-in Alpha window, single-instance reuse, owned server startup/exit and quit handling; preserve B0 path. |
| `desktop/main/next-runtime.ts` — new | Narrow Node/Next launcher, setup checks, readiness/owned PID verification, timeout and teardown. No business imports. |
| `desktop/main/next-runtime.test.ts` — new | Startup/collision/exit/teardown tests with synthetic metadata under the test root. |
| `desktop/main/security/next-runtime-policy.ts` — new | Exact origin/path rules, no privileged preload, restricted source-viewer windows, permissions/request policy. |
| `desktop/main/security/next-runtime-policy.test.ts` — new | Navigation, redirects, forged origins, document windows and network rules. |
| `scripts/desktop/b0-smoke.cjs` | Preserve B0 security checks while explicitly distinguishing the approved Alpha launcher/setup policy from former global no-HTTP/no-process assertions. |
| `scripts/desktop/alpha-runtime-acceptance.cjs` — new | Actual desktop lifecycle and bounded Alpha acceptance runner; existing tooling only, fixtures/evidence under the test root. |

No `src/`, spike, renderer, preload, shared IPC, dependency manifest, Forge or Webpack changes are proposed for this local bridge. Existing main Webpack entry resolves relative TypeScript helpers; existing desktop TypeScript includes the new files. If that assumption fails, request approval before touching configuration. No file on this proposed allowlist is authorized for editing by this preflight request.

**Packaging is deferred, not silently included in this allowlist.** A subsequent packaging proposal would need at least `forge.config.ts`, `next.config.ts` if a standalone artifact is chosen, and a new `scripts/desktop/package-next-runtime.cjs`; dependency/manifest changes cannot be presumed. The exact artifact closure and writable-settings location must be inspected before approving that separate allowlist. No generic permission to add packaging files is granted here.

## 6. Security implications

- Alpha BrowserWindow retains sandboxing, disabled Node integration, context isolation, web security and insecure-content denial. It has **no B0 preload** and does not register/expose application-info IPC. B0 IPC sender validation remains unchanged in B0 mode.
- Accept only parsed URLs with exact scheme/host/port `http://127.0.0.1:3100`, no credentials, and approved top-level app paths. Deny external URLs, other loopback ports/host aliases, `file:`, `javascript:`, custom schemes and redirects outside that boundary. Restrict all navigation events, not just links. Application routes are permitted; arbitrary same-origin document content is not a privileged app page.
- Maintain deny-by-default new windows. The existing Alpha evidence/original-result links use `target="_blank"`; always denying them breaks provenance inspection. Permit only the existing `/api/matters/file` source-view path in a separate sandboxed window with no preload, no mutation requests and no outbound navigation. Server-side path validation and document CSP remain authoritative; shell policy does not reimplement evidence/matter validation. Qualify PDF/text/image behavior and the existing embedded preview. Do not add `shell.openExternal`, arbitrary filesystem opening or automatic downloads to solve it.
- Deny permission requests and outbound renderer requests except the exact local application origin and necessary non-network document resources. Shell request policy is not a Node-server egress firewall; qualify server egress separately. Loopback is not authentication and provides no defense against a hostile process with the same user's filesystem privileges.
- Preserve current Host/Origin/port/fetch-site safeguards exactly. Electron makes same-origin requests when loading the HTTP application directly. Do not add permissive CORS or exemptions for `Origin: null` as an integration workaround.
- B0's HTML meta CSP is not inherited by the Next document. A copied `script-src 'self'` or `connect-src 'none'` would break Next hydration/fetch; a global `frame-src 'none'` would break existing previews. Prefer narrowly scoped Electron network/navigation/permission controls and preserve server-provided document CSP for this bridge. A full Next nonce/hash CSP is separately deferred; do not introduce blanket `unsafe-eval`/Node access. Any proposed header policy must be tested against the built application rather than claimed from B0. Electron recommends sandboxing, isolation, restricted navigation and CSP for loaded web content. [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security/).
- B0 single-instance protection covers Electron only, not manually launched Node servers, multiple browsers or Register I11's workspace lease. Do not claim it solves accepted external-writer limitations.

## 7. Runtime lifecycle

1. Acquire Electron single-instance lock before spawning. A second launch focuses the existing window and starts no additional writer.
2. In Alpha mode validate absolute approved runtime/Node/CLI paths, prebuilt `.next/BUILD_ID`, native publication helper availability, and existing `.sdj-mike/settings.json`. Both roots must equal `C:\SDJ_TEST\SDJ_LEGAL_TEST`; mismatch/missing configuration stops startup without opening a matter. Main reads setup metadata only.
3. Refuse an occupied port 3100. Start the direct Node child, retain its identity, and watch error/exit/output. A precheck alone has a race: require successful child bind plus Windows listener ownership matching the launched PID before accepting HTTP readiness. If ownership cannot be established, fail closed; do not load a possibly unrelated server. Do not kill port occupants.
4. Use a bounded readiness timeout and same-origin HTTP probe, then create the sandboxed Next window at the existing matter entry route. No new health endpoint or business API is necessary. Lifecycle checks must not perform a mutation.
5. Child crash or loss/replacement of listener ownership invalidates/closes the mutation-capable window and reports a runtime error. No silent fallback to another port/runtime and no automatic retry of legal work. Explicit application restart runs preflight again.
6. On normal quit, disable/close the UI first, prevent a second server start, request supported child termination, wait a bounded interval for exit, and verify the listener is gone. Node/Next contains SIGINT/SIGTERM cleanup, but Windows process termination must not be represented as proven graceful request draining. If termination interrupts an apply, existing durable recovery is the correctness boundary. Do not add a second drain/mutation state engine.
7. If cleanup requires force, target only the verified owned process/tree; existing publication helper may be a descendant. Never kill all Node/PowerShell processes or anything based only on port. Test interruption across prepared/publication/receipt stages.
8. A forced main-process crash can orphan a directly spawned Node server on Windows. Do not claim automatic descendant cleanup without testing it. A later launch must refuse the occupied port; explicit verified cleanup is required before restarting. Orphan-free termination is a qualification gate, not something plain Node spawn guarantees. Windows job-object infrastructure is not added in this stage; if safe lifecycle acceptance requires it, stop and request a separately bounded decision.

No supervised runtime or lifecycle assumption was executed in Stage D; this is source-based preflight. The earlier Stage C.1 server is stopped.

## 8. Recovery implications

Electron does not open, repair, copy, delete or interpret Alpha intent/result/review records. PID locks refer to the **Next process**, not Electron. If that process remains alive, existing explicit recovery correctly refuses lock reclamation. After verified exit and restart, existing recovery may reclaim a dead owner and inspect durable records.

A saved successful operation remains replayable under the same review/transaction identity without publishing again. Receipt-only recovery must not touch business bytes. Stale or ambiguous canonical/source hashes remain blocked. Closing/reopening Electron is never implicit lawyer approval or a silent rebase. Active-PID/reused-PID or malformed lock uncertainty remains an existing manual-recovery limitation.

Stage C.1 left a synthetic ambiguous fixture under `STAGE_C1_SYNTHETIC/SDJ_STAGE_C1_ALPHA`; preserve it as evidence and use a fresh synthetic matter for ordinary desktop acceptance. `00 CONTROL/alpha-next-step/` remains bounded Alpha state. No schema migration or spike normalization is needed.

## 9. Test plan

All filesystem fixtures/evidence only under `C:\SDJ_TEST\SDJ_LEGAL_TEST`. Do not use production/OneDrive data or expand dependencies.

- Setup: wrong/missing root, missing build/helper/Node, invalid executable/version, occupied port including unrelated HTTP server, readiness timeout, child bind failure, forged listener response and listener ownership replacement. Every failure must stop before loading legal UI.
- Runtime: actual Electron starts exactly one Next process, second Electron launch only focuses; same-origin route navigation works; reload and window reopen do not spawn another server; closing stops only owned processes; main/server crashes and delayed/orphaned termination fail closed.
- Security: Node/preload APIs unavailable on Next page; external URLs/redirects/permissions/network denied; forged Host/Origin/fetch-site rejected; source links open only restricted document viewers; PDF/text/image preview and file input work without security weakening.
- Repeat accepted Alpha UI scenarios through Electron: approve, modify, reject, stale base, lost response/exact retry, external evidence mismatch, actual server restart with pending/completed state, supported fault-hook receipt recovery, ambiguous state. Record UI, full canonical-byte comparison, original hashes and receipt/operation IDs. Unit tests alone do not qualify desktop behavior.
- While unresolved, verify existing canonical mutation and archive API exclusions. Current Next matter-management page has no archive UI; preserve the Stage C.1 NOT QUALIFIED item rather than adding one here.
- Afterward run targeted Alpha/API/canonical and launcher/security tests, desktop TypeScript, lint, build and existing loopback qualification. Browser and Electron Chromium acceptance remain distinct.
- Packaging later: offline installed launch without checkout/npm, assets/helper physically available, writable settings location, repeated restarts and safe removal. Local bridge success does not qualify ASAR packaging or physical power-loss recovery.

## 10. Rollback plan

Keep B0 mode and its preload/IPC/security policy intact. Disable Alpha mode to restore B0; stop only the verified owned Next process. Existing Next browser application remains usable independently. Revert only approved shell/helper/test changes, leaving all canonical data, evidence and Alpha history untouched. There is no data migration to reverse and no rollback that rewrites legal files. Preserve unresolved records for accepted recovery.

## 11. Estimated implementation complexity

**MEDIUM for the local Option A bridge.** Actual constraints: Electron's executable differs from Node, exact B0 navigation/CSP rules conflict with a live app, Windows ownership/termination requires verification, and document links need restricted popups. The choice of a direct external Node process minimizes runtime drift but leaves an installed-Node prerequisite and possible orphan cleanup. Do not turn this into a generalized service manager.

**HIGH for self-contained packaging.** Reasons are concrete: B0 does not include a Next server artifact; accepted Node must be supplied or its replacement requalified; `.sdj-mike` is cwd-based; native `windows-handle-publication.ps1` is resolved relative to its module and must remain available outside unsuitable packaging boundaries; the production build currently warns about broad prompt-route tracing. A standalone artifact cannot be assumed complete. Defer packaging closure inspection and implementation rather than refactor business persistence.

Smallest useful implementation: one owned local production Next server, one sandboxed existing-app window, narrow lifecycle/security helpers and focused acceptance. No estimates of calendar duration are justified before lifecycle tests.

## 12. Explicit items deferred

Self-contained server/Node packaging, moving settings, standalone-output/tracing changes, strict Next nonce CSP, Windows job-object ownership, authenticated lawyer identity, workspace lease/multi-device/OneDrive qualification, production root, physical power-loss guarantees, archive UI restoration, broad shell redesign, new IPC business services and spike-location normalization. Also excluded: RAG, agents, OCR, email ingestion, provider APIs, new proposal types, facts/issues/chronology automation and generalized workflows.

Only this document was created. No production code/dependencies/settings changed; no runtime/build/test was started for Stage D, no production root/data accessed, and no commit or push. Existing unrelated changes were preserved. Approval of the local allowlist and lifecycle gates is required before implementation.
