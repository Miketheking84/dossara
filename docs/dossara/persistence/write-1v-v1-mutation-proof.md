# WRITE-1V — V1 Mutation Proof Under Accepted Concurrency Boundary

## 1. Decision and scope

Outcome:

**A — WRITE-1V V1 MUTATION PROOF READY**

WRITE-1V consolidates the accepted V1 canonical-mutation semantics and the
necessary technical findings into one self-contained executable candidate. It
is an isolated proof primitive. It does not integrate with a production API,
Matter Board, UI, Client Profile, Inbox, OneDrive, FIELD, or OPS-PROD-1.

The candidate consists of:

- `spikes/write-1v-v1-mutation/contracts.ts`
- `spikes/write-1v-v1-mutation/canonical-mutation.ts`
- `spikes/write-1v-v1-mutation/windows-handle-publication.ps1`
- `spikes/write-1v-v1-mutation/windows-hold-open.ps1`
- `spikes/write-1v-v1-mutation/write-1v-v1-mutation.test.ts`
- this evidence document

No production `src/` file was changed by WRITE-1V. The candidate does not
import WRITE-1E, WRITE-1R, WRITE-1R2, or FSE-1 implementation code.

## 2. Authority baseline

WRITE-1V is evaluated under these accepted authorities:

| Authority | Commit | Status |
| --- | --- | --- |
| WAC-1 | `28d92d5469dc3f655b0326ba2dd20544ba75a3e0` | accepted canonical mutation authority |
| ACA-1 | `65af84bc95351a1a40877897889ee37270524d04` | accepted V1 external-concurrency amendment |
| WAC-1A | `6b044be9a88b869acd15a54ce83e6e6951a47b4d` | accepted V1 concurrency successor closure |
| WRITE-1E | `f79e7fa0eb9352b501f25f98b18b5719f842913d` | accepted historical executable proof |

The later FSE-1, WRITE-1R, and WRITE-1R2 artifacts remain investigation
evidence. Their code is not accepted wholesale as a production primitive.

## 3. Successor relation

The operative authority chain is:

`WAC-1 → ACA-1 → WAC-1A → WRITE-1V executable candidate`

WAC-1 defines the retained mutation-safety model. ACA-1 narrowly amends the
external-concurrency promise for V1. WAC-1A closes the successor contract by
making the supported and unsupported concurrency boundaries mutually
consistent. WRITE-1V executes that combined contract; it does not reopen or
broaden it.

The supported rule is:

> SDJ MIKE must not knowingly overwrite a stale or externally modified
> canonical state.

The accepted V1 negative capability is:

`UNSUPPORTED_CONCURRENT_EXTERNAL_MUTATION_DURING_ACTIVE_SAVE`

WRITE-1V therefore does not claim destination-object compare-and-swap after
the last accepted precondition check and before publication completion.

## 4. Source-to-candidate primitive matrix

| Primitive / behavior | WRITE-1E | R/R2 improvement | Needed in WRITE-1V? |
| --- | --- | --- | --- |
| Exact raw-byte `sha256:` read token | proved | unchanged | yes; retained |
| Server-side reread and fail-closed mismatch | proved | unchanged | yes; retained |
| Same-target application Single Writer | proved | unchanged | yes; retained |
| Lossless targeted span replacement | proved | unchanged | yes; retained |
| Prepared revision, attempt, outcome, receipt | proved | unchanged | yes; retained |
| Final reread and resulting-hash verification | proved | unchanged | yes; retained |
| Cold recovery decision table | proved | unchanged | yes; retained |
| Node pathname-based destination publication | used by historical proof | R/R2 identified parent/source identity gaps | no |
| Trusted directory-handle chain | absent | R/R2 held and reverified the directory chain | yes; consolidated |
| Reparse/junction rejection | preflight only | R/R2 bound checks to trusted handles | yes; consolidated |
| Trusted source-file handle | absent | R2 proved source pathname substitution resistance | yes; consolidated |
| Handle-relative rename under trusted parent | absent | R2 proved continuous local namespace publication | yes; consolidated |
| Bounded Windows sharing retry | partial | FSE/R2 characterized retryable sharing failures | yes; consolidated |
| `ReplaceFileW` candidate | absent from accepted WRITE-1E | investigated and rejected for this candidate | no; removed |
| `MoveFileExW` fallback | historical publication path | not needed after handle-relative consolidation | no; removed |
| Destination CAS / oplock | absent | investigation proved it was not closed without native destination coordination | no; prohibited by accepted V1 boundary |
| Vulnerability hooks in normal execution | generic failure injection only | investigation used boundary hooks | no; boundary hooks removed |

The retained WRITE-1E evidence schemas intentionally remain
`write-1e/1`-compatible. WRITE-1V internalizes those contracts instead of
importing historical proof code, so existing immutable evidence semantics are
not silently version-forked by this consolidation.

## 5. Candidate mutation protocol

The executable path performs these ordered steps:

1. resolve a contained canonical target only under
   `C:\SDJ_TEST\SDJ_LEGAL_TEST\`;
2. reject a symlink/reparse target or parent escaping the workspace;
3. acquire the same-target application Single Writer;
4. open and retain a trusted Windows directory-handle chain;
5. reread the canonical raw bytes on the server;
6. compare the exact raw-byte hash with `expectedReadToken`;
7. return `CONFLICT` before mutation on mismatch;
8. apply one lossless targeted span transformation;
9. write an immutable attempt and a PREPARED canonical revision;
10. exclusively create a same-directory temp file;
11. completely write and `FileHandle.sync()` the temp file;
12. verify the staged raw-byte hash;
13. reverify the trusted parent chain and canonical precondition;
14. open and retain the verified source/temp object handle;
15. publish that source handle relative to the held trusted-parent handle;
16. cold-reread the canonical target and verify the resulting exact hash;
17. write immutable success outcome and receipt evidence;
18. update derived state only after canonical success.

No success result exists before step 16. A derived-state failure after verified
canonical success does not roll canonical state back.

## 6. Publication mechanism

The Windows helper opens each directory component without traversing a reparse
point and records its volume/file identity. It opens the canonical target and
the staged source with explicit Windows sharing semantics. The source handle is
published using `NtSetInformationFile` with
`FileRenameInformationEx`, a held trusted-parent `RootDirectory`, and a simple
destination basename.

This mechanism was selected because it retains the parent and source identity
guarantees demonstrated by R/R2 while removing experimental fallbacks and
normal-path vulnerability hooks. It gives continuous local namespace
visibility in the tested normal publication path.

It is not described as destination CAS. It does not use an oplock. It does not
solve the accepted unsupported external replacement window.

## 7. Parent, source, and wrong-matter identity

The targeted proof demonstrates:

- matter-parent substitution is blocked while the trusted directory chain is
  held;
- a junction redirecting the canonical path to another matter is rejected;
- source pathname substitution after source-handle preparation still
  publishes the previously verified source object;
- no supported test writes into another matter;
- target, parent, and source hashes/identities are verified at the relevant
  accepted boundaries.

These checks are retained guarantees. They are distinct from destination CAS.

## 8. Conflict and application-writer behavior

The exact token is `sha256:<lowercase hex>` over raw bytes, including BOM,
newline style, whitespace, unknown fields, and all manual content.

Observed behavior:

- a manual edit visible before the accepted precondition produces `CONFLICT`;
- canonical bytes remain byte-identical after that conflict;
- two application writers starting from one token produce exactly one
  canonical success and one conflict;
- malformed tokens, duplicate targets, missing required targets, and invalid
  new Matter Type values fail closed;
- blind overwrite, last-writer-wins, and automatic merge are absent.

## 9. Preservation behavior

The transformer replaces only the value span of an explicitly targeted field.
The proof retains every byte outside that span. In particular:

- unknown/manual content survives an unrelated mutation;
- the legacy unknown Matter Type `Nasljedno pravo` survives an unrelated
  mutation;
- a missing Matter Type remains missing and does not become `Drugo`;
- an explicit accepted MTC-1 Matter Type replacement succeeds;
- an explicit non-MTC-1 new value is rejected before publication.

## 10. Windows sharing and permission behavior

The candidate proves:

- an ordinary open reader does not block verified canonical success;
- transient retryable sharing contention is retried and can succeed after the
  reader releases;
- exhausted bounded sharing contention returns safe `IO_FAILED` while leaving
  canonical bytes intact;
- read-only/permission failure returns safe failure;
- ACLs and read-only attributes are not bypassed.

The retry is bounded to 50 attempts with a 5 ms delay for the recognized
Windows sharing/access/delete-pending statuses.

## 11. Namespace stress

The required local stress ran only below
`C:\SDJ_TEST\SDJ_LEGAL_TEST\` with a concurrent reader.

| Measurement | Result |
| --- | ---: |
| Successful publications | 300 |
| Reader observations | 1,399 |
| ENOENT observations | 0 |
| Invalid/partial reads | 0 |
| Hash mismatches | 0 |
| Unexpected I/O outcomes | 0 |
| Unexpected temp leftovers | 0 |
| Publication-loop elapsed time | 4,799.298 ms |

The stress result satisfies the WRITE-1V namespace-continuity acceptance
criteria. It is local test-workspace evidence, not OneDrive qualification.

## 12. Immutable evidence and recovery

The candidate retains the accepted ordering and separation of:

- mutation attempt;
- PREPARED canonical revision;
- terminal outcome;
- successful receipt/currentness evidence.

The cold recovery table proves:

- orphan temp files are not auto-published;
- canonical bytes matching the successful receipt are COMMITTED;
- canonical bytes contradicting the receipt chain require recovery;
- a PREPARED revision without a receipt is not current;
- final hash mismatch or indeterminate publication returns
  `RECOVERY_REQUIRED` without guessing;
- verified canonical success is not rolled back when a derived update fails.

The proof does not claim full power-loss durability for directory metadata.
That remains an explicit filesystem/environment qualification concern.

## 13. Negative capability

The negative-capability test intentionally pauses the low-level helper after
its last accepted target precondition, independently replaces the destination,
and then completes publication. The application candidate replaces that new
destination because no kernel-level destination CAS exists.

That test passes when the limitation remains reproducible and named. It is not
a resolved-protection test and is not an acceptance failure under ACA-1 and
WAC-1A.

Classification:

**negative capability / unsupported environment behavior**

`UNSUPPORTED_CONCURRENT_EXTERNAL_MUTATION_DURING_ACTIVE_SAVE` remains outside
the supported V1 environment. Native destination coordination/oplock remains a
future WRITE-V2 hardening candidate and is absent from WRITE-1V.

## 14. Validation evidence

Final validation results:

| Validation | Result |
| --- | --- |
| WRITE-1V targeted | 31/31 PASS |
| WRITE-1E regression | 23/23 PASS |
| PCR-2 regression | 101/101 PASS |
| MVS-1 regression | 17/17 PASS |
| FH-1 regression | 18/18 PASS |
| Required combined targeted/regression run | 159/159 PASS |
| Full Vitest | 482/482 PASS across 25/25 files |
| TypeScript | PASS |
| ESLint | PASS |
| Next.js production build | PASS |
| Static generation | 19/19 PASS |

The build emitted the existing Turbopack NFT trace warning through
`src/lib/sdj-prompts.ts`. WRITE-1V does not import or change that path, and the
build completed successfully.

## 15. Residual risks and non-claims

WRITE-1V does not claim or authorize:

- destination-object CAS;
- safety for concurrent external mutation during the active-save window;
- oplock/native destination coordination;
- crash/power-loss-proof directory metadata durability;
- OneDrive mutation safety or qualification;
- a real SDJ workspace;
- production API or UI integration;
- FIELD-1A or WRITE-PROD-1 acceptance.

The PowerShell/P/Invoke helper is an executable qualification primitive, not a
production integration decision. Packaging, deployment identity, operational
telemetry, recovery UI, and the actual production adapter remain later work.

## 16. FSE-1A readiness recommendation

Recommendation:

**GO TO OWNER REVIEW FOR WRITE-1V ACCEPTANCE, THEN FSE-1A LOCAL NTFS
REQUALIFICATION**

FSE-1A should qualify this exact accepted candidate on the intended local NTFS
environment. It must keep the ACA-1/WAC-1A negative capability explicit and
must not reinterpret local NTFS success as OneDrive or FIELD qualification.

No acceptance commit was created in this pass.
