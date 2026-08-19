# FSE-1A — Local NTFS Requalification

## 1. Outcome

**A — LOCAL NTFS V1 ENVIRONMENT QUALIFIED**

The accepted WRITE-1V mutation primitive is qualified for the tested local
Windows/NTFS V1 environment and supported concurrency model.

This result is a local environment qualification. It is not OneDrive,
production API, Matter Board, or FIELD qualification.

## 2. Accepted authority

| Authority | Commit | Status |
| --- | --- | --- |
| WAC-1 | `28d92d5469dc3f655b0326ba2dd20544ba75a3e0` | accepted |
| ACA-1 | `65af84bc95351a1a40877897889ee37270524d04` | accepted V1 amendment |
| WAC-1A | `6b044be9a88b869acd15a54ce83e6e6951a47b4d` | accepted successor closure |
| WRITE-1V | `648f4b2bbafc2c962390a2168493bc6a6e3788a6` | accepted mutation safety proof |

FSE-1A qualifies the accepted primitive under that authority chain. It does
not reopen the concurrency architecture or change WRITE-1V.

## 3. Supported concurrency model

Qualified:

- one SDJ MIKE application-controlled writer per canonical target;
- same-target application Single Writer;
- manual editing between application save transactions;
- exact-byte expected token and server-side reread;
- fail-closed conflict before accepted publication;
- trusted parent and source identity;
- lossless targeted mutation;
- final reread/hash verification;
- immutable revision, outcome, and receipt evidence;
- fail-closed recovery.

Not supported:

`UNSUPPORTED_CONCURRENT_EXTERNAL_MUTATION_DURING_ACTIVE_SAVE`

Independent external destination replacement after the last accepted
precondition and before publication completion remains outside the supported
V1 model. FSE-1A does not claim destination CAS and does not use an oplock.

## 4. Environment profile

| Property | Qualified value |
| --- | --- |
| Platform | Windows (`win32`) |
| Windows release | `10.0.19045` |
| Observed OS build | Microsoft Windows `10.0.19045.6466` |
| Architecture | `x64` |
| Node.js | `v24.13.0` |
| libuv | `1.51.0` |
| Volume | `C:\`, fixed drive |
| Filesystem | NTFS |
| Test root | `C:\SDJ_TEST\SDJ_LEGAL_TEST\` |
| Test-root reparse/symlink status | regular directory; not a symbolic link/reparse target |
| Synced-folder status | local path; not within a OneDrive pathname |
| Owner | `LAPTOP-MJ\Jocovic` |
| Relevant ACL | authenticated users have Modify; administrators and SYSTEM have Full Control |

`System.IO.DriveInfo` supplied the fixed-drive and NTFS facts without requiring
administrative access. The test root is deliberately separate from any real
SDJ or OneDrive workspace.

This profile qualifies only the environment actually tested. The fact that the
path is local and not named OneDrive is not evidence that any OneDrive root is
safe.

## 5. Qualification matrix

| Scenario | Required result | Observed result |
| --- | --- | --- |
| A — normal mutation | success and exact final hash | PASS — `CANONICAL_SUCCESS` and final token match |
| B — stale manual edit | conflict; manual bytes preserved | PASS |
| C — two application writers | exactly one success and one conflict | PASS |
| D — wrong-matter junction | no outside write; no false success | PASS — rejected before baseline acceptance |
| D — trusted parent substitution | held identity prevents directory replacement | PASS |
| E — trusted source | pathname substitution cannot change published source object | PASS |
| F — unknown/manual preservation | unrelated bytes remain unchanged | PASS |
| G — legacy Matter Type | `Nasljedno pravo` survives unrelated mutation | PASS |
| H — missing Matter Type | remains missing; does not become `Drugo` | PASS |
| I — transient sharing contention | bounded retry can publish after release | PASS |
| I — exhausted sharing contention | safe I/O failure; canonical unchanged | PASS |
| J — read-only destination | fail closed without attribute bypass | PASS |
| K — final verification mismatch | no ordinary success; recovery required | PASS — `RECOVERY_REQUIRED` |
| L — derived failure | canonical success retained; rebuild required | PASS — `CANONICAL_SUCCESS_DERIVED_REBUILD_REQUIRED` |

FSE-1A targeted result: **16/16 PASS**.

The initial qualification run had one environment-reporting harness error:
`process.getSystemVersion()` is an Electron API and is unavailable in the
standard Node test process. It was replaced with the standard `os.release()`.
All 15 filesystem/concurrency scenarios in that initial run had already
passed; the complete corrected run then passed 16/16. No WRITE-1V code changed.

## 6. Namespace and path safety

The qualification confirms:

- the canonical target must be a regular file;
- the workspace and canonical parent remain contained under the permitted test
  root;
- a junction redirecting Matter-1 to Matter-2 is rejected;
- the outside matter remains byte-identical;
- held directory handles prevent supported parent substitution;
- directory identity is reverified across the mutation;
- the verified temp/source handle, not a later pathname occupant, is published;
- source and result hashes are verified;
- ACL and read-only behavior is not bypassed.

These are parent/source/path guarantees. They are not destination-object CAS.

## 7. Publication stress

The final targeted run executed 300 successful local publications with a
concurrent reader.

| Measurement | Result |
| --- | ---: |
| Publications | 300 |
| Reader observations | 1,233 |
| ENOENT observations | 0 |
| Invalid/partial reads | 0 |
| Hash mismatches | 0 |
| Unexpected I/O outcomes | 0 |
| Unexpected temp leftovers | 0 |
| Measured publication-loop elapsed time | 2,990.187 ms |

All namespace-continuity acceptance thresholds pass.

## 8. Recovery qualification

The accepted recovery behavior was requalified:

| Condition | Observed classification |
| --- | --- |
| Orphan same-directory temp | `ORPHAN_TEMP_NOT_PUBLISHED` |
| PREPARED revision without receipt | `PREPARED_NOT_CURRENT` |
| Final publication verification mismatch | `RECOVERY_REQUIRED` |
| Canonical bytes inconsistent with successful receipt | `RECOVERY_REQUIRED` |

No scenario guesses that an indeterminate state is committed. No orphan temp
is auto-published. A PREPARED revision does not become current without the
accepted receipt/currentness evidence.

## 9. Performance sanity

One representative final targeted run recorded these approximate local phase
latencies:

| Phase | Observed latency |
| --- | ---: |
| Raw read and exact hash | 1.620 ms |
| Lossless transform and resulting hash | 0.514 ms |
| Same-directory staged write and file sync | 3.297 ms |
| Trusted-handle helper startup and publication | 769.708 ms |
| Final reread and exact hash | 1.666 ms |
| End-to-end mutation including immutable evidence and receipt | 790.845 ms |

The end-to-end result is below the qualification sanity ceiling of 10 seconds
and is practical for the tested interactive legal workflow. The dominant cost
is PowerShell/.NET helper startup, not file read, transform, sync, or hashing.

Receipt writing is included in the end-to-end value. It is not separately
instrumented because FSE-1A does not add phase callbacks or vulnerability hooks
to accepted WRITE-1V merely to obtain a microbenchmark.

This is a sanity measurement, not a performance SLA. Optimization was not part
of FSE-1A.

## 10. Negative capability

The qualification explicitly reproduces the accepted active-save external
replacement window. After the low-level helper's last accepted target
precondition, an independent external destination replacement can be replaced
by the application publication because V1 has no destination CAS.

That test passing means the limitation remains known and executable as a
negative capability. It does not mean the protection was resolved.

Classification:

**SUPPORTED ENVIRONMENT EXCLUSION — NOT A QUALIFICATION BLOCKER UNDER ACA-1
AND WAC-1A**

Native destination coordination/oplock remains outside the V1 critical path.

## 11. Regression validation

| Validation | Result |
| --- | --- |
| FSE-1A targeted | 16/16 PASS |
| WRITE-1V regression | 31/31 PASS |
| WRITE-1E regression | 23/23 PASS |
| PCR-2 regression | 101/101 PASS |
| MVS-1 regression | 17/17 PASS |
| FH-1 regression | 18/18 PASS |
| Combined required qualification/regression | 206/206 PASS across 9/9 files |
| Full Vitest | 498/498 PASS across 26/26 files |
| TypeScript | PASS |
| ESLint | PASS |
| Next.js production build | PASS |
| Static generation | 19/19 PASS |

The production build emitted the pre-existing Turbopack NFT trace warning
through `src/lib/sdj-prompts.ts`. FSE-1A does not import or change that path,
and the build completed successfully.

## 12. OneDrive and production boundaries

OneDrive was not tested. Status remains:

**NOT QUALIFIED / BLOCKED**

FSE-1A does not authorize:

- a real SDJ or OneDrive workspace;
- OneDrive mutation qualification;
- production API or Matter Board integration;
- UI save-flow integration;
- WRITE-PROD-1 implementation;
- FIELD-1A.

No production `src/` file changed. Accepted WRITE-1V remained unchanged.

## 13. Residual risks

- `UNSUPPORTED_CONCURRENT_EXTERNAL_MUTATION_DURING_ACTIVE_SAVE` remains an
  accepted V1 limitation.
- Full crash/power-loss-proof directory metadata durability is not claimed.
- PowerShell/.NET helper startup dominates local latency and will require a
  production packaging/operational decision in WRITE-PROD-1.
- Local NTFS success does not transfer automatically to synced, remote,
  removable, network, or non-NTFS filesystems.
- Recovery UX, telemetry, packaging identity, and deployment permissions are
  production integration concerns, not FSE-1A qualification claims.

## 14. Recommendation

**WRITE-PROD-1 READY**

This recommendation means the accepted primitive is technically ready for a
separately scoped production-integration review after owner acceptance of
FSE-1A. It is not authorization to start WRITE-PROD-1 automatically.

No commit was created in this qualification pass.
