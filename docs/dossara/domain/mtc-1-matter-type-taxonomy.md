# MTC-1 — Matter Type Taxonomy Authority Closure

## 1. Decision identity

- Date: 2026-08-17
- Authority: owner decisions recorded in MTC-1
- Predecessor evidence: PCR-1 — Matter Classification / Domain Contract Production Review
- Outcome: **GO — MATTER TYPE TAXONOMY LOCKED**
- Recommendation: **TAXONOMY ACCEPTANCE READY**
- Contract identifier: `mtc-1/v1`

This document closes only the Matter Type taxonomy authority blocker identified by PCR-1. It does not change PCR-1 findings for operational semantics, Matter Board behavior or the mutation/I12 write path.

## 2. Purpose

Matter Type answers one question:

> Kojoj glavnoj pravnoj ili praktičnoj oblasti ovaj predmet pripada?

It is canonical matter metadata selected by a user. It supports stable grouping, filtering and future practice-specific behavior without claiming anything about the matter's current operational condition.

V1 deliberately uses one small, closed vocabulary and one primary type per matter. It is not a comprehensive legal ontology.

## 3. Taxonomy is not operational state

Matter Type is independent from:

- matter lifecycle or active/non-active classification;
- actionable work and waiting dependencies;
- status, priority, urgency and attention;
- next action;
- due/deadline authority;
- completion and historical operational state.

For example, `Radni spor` may simultaneously be active, waiting, urgent and without current actionable work. Changing its Matter Type must not automatically change any of those dimensions.

Operational classifications remain governed by VOC-1 and the MVS-1 executable proof. MTC-1 neither accepts nor repairs production heuristics based on a single status, `startsWith("Čeka")`, `urgent/attention/ok`, host-local dates or treating every `Rok` as an authoritative deadline.

## 4. Approved V1 vocabulary

The following exact, case-sensitive values are the complete approved `mtc-1/v1` vocabulary, in stable display order:

1. `Parnični spor`
2. `Privredni spor`
3. `Radni spor`
4. `Upravni spor`
5. `Izvršni postupak`
6. `Vanparnični postupak`
7. `Krivični postupak`
8. `Prekršajni postupak`
9. `Arbitraža`
10. `Medijacija / mirenje`
11. `Ugovorni predmet`
12. `Pravna usklađenost`
13. `Pravno savjetovanje`
14. `Drugo`

Decision: **KEEP — all 14 values.** No rename, merge or removal is required for V1.

## 5. Per-value review

| Exact value | V1 meaning | Overlap / potential ambiguity | Decision and selection guidance |
|---|---|---|---|
| `Parnični spor` | General civil contentious matter before a court | Can overlap with commercial and employment litigation | **KEEP.** Use when the dispute is civil/contentious and no more specific `Privredni spor` or `Radni spor` category is dominant. |
| `Privredni spor` | Commercial dispute whose dominant context is business/commercial relations | Often procedurally contentious and may also involve a contract | **KEEP.** Prefer over `Parnični spor` and `Ugovorni predmet` when the dominant matter is a commercial dispute. |
| `Radni spor` | Employment/labour dispute | May also be a civil proceeding or involve an employment contract | **KEEP.** Prefer when the employment relationship is the dominant legal context. |
| `Upravni spor` | Judicial review/challenge concerning an administrative act or administrative authority | Can be confused with non-contentious administrative advice or procedure | **KEEP.** Use for the administrative-dispute matter; general regulatory advice belongs under `Pravna usklađenost` or `Pravno savjetovanje`. |
| `Izvršni postupak` | Enforcement/execution matter | May follow a civil, commercial or arbitral merits matter | **KEEP.** Use when enforcement is the current primary mandate; the originating merits field may remain in description or future tags. |
| `Vanparnični postupak` | Court or statutory non-contentious proceeding | Can share facts with property, family or corporate work | **KEEP.** Use when the non-contentious procedure is the dominant form of the mandate. |
| `Krivični postupak` | Criminal proceeding/representation | Can coexist with civil damages or compliance work | **KEEP.** Use when criminal procedure is the dominant mandate; split genuinely separate mandates into separate matters where appropriate. |
| `Prekršajni postupak` | Misdemeanour/offence proceeding | May arise from regulatory or compliance facts | **KEEP.** Prefer over `Pravna usklađenost` when representation in the offence proceeding is primary. |
| `Arbitraža` | Arbitral dispute or arbitral proceeding | Can also be commercial, contractual or employment-related | **KEEP.** Use when arbitration is the dominant procedural/practice context. |
| `Medijacija / mirenje` | Structured mediation or conciliation mandate | Can concern any underlying substantive field | **KEEP.** Use when mediation/conciliation itself is the primary engagement. |
| `Ugovorni predmet` | Primarily non-contentious contract drafting, review, negotiation or contract administration | Overlaps with contract-based litigation and general advice | **KEEP.** Do not use merely because a dispute involves a contract; choose the applicable dispute type when contentious representation is dominant. |
| `Pravna usklađenost` | Compliance, regulatory alignment, policy/control review or implementation | Can overlap with general advice and administrative matters | **KEEP.** Use when ongoing or project-based compliance is the central purpose. |
| `Pravno savjetovanje` | Advisory mandate not more specifically represented by another approved type | Broad and potentially overlapping by design | **KEEP.** Use only after considering the more specific categories; it is not a substitute for `Drugo` when the mandate belongs to an unlisted practice area. |
| `Drugo` | Controlled fallback for a legitimate matter not reasonably represented by the other 13 values | Could be overused and hide useful classification | **KEEP.** Select only when no listed type reasonably fits. It does not reopen the field to arbitrary free text. |

The overlaps are intentional and manageable because Matter Type records the dominant primary practice context, not every legal characteristic of the matter.

## 6. Primary-type rule

V1 permits exactly one selected primary Matter Type per matter.

When several categories could apply:

1. select the category that best describes the dominant current professional mandate;
2. prefer a specific category over a general one where the specific category accurately represents that mandate;
3. do not change the type automatically because operational state, priority, deadline or next action changes;
4. record additional legal dimensions in description/key questions, or in future tags after a separate authority decision.

Multi-select and secondary types are not part of `mtc-1/v1`.

## 7. Canonical authority contract

### 7.1 Vocabulary authority

This document is the normative authority for the V1 vocabulary and its meanings. `src/lib/sdj-matter-classification.ts` is the production implementation mirror of the exact values and order; it is not an independent source of domain authority.

Any addition, rename, merge or removal requires a later versioned owner/domain decision and an explicit compatibility/migration disposition.

### 7.2 Per-matter authority

The user-selected `Vrsta predmeta` value in the canonical matter metadata is the authoritative value for that matter. It is not derived from status, folder name, dates, documents, actions or UI heuristics.

The API DTO, list, filter, dashboard and cockpit display are read models/projections. They may display or filter the canonical metadata but must not silently become a separate source of truth.

### 7.3 Independence invariant

Writing or changing Matter Type must have no automatic state effect on status, active/non-active, priority, actionability, waiting, next action, due, lifecycle or history.

## 8. Validation behavior

Normal creation and any future approved edit flow may write only:

- one exact value from the approved 14-value vocabulary; or
- an explicit unclassified/missing state supported for incomplete or legacy metadata.

An empty/missing value is not a fifteenth Matter Type and does not mean `Drugo`. Whether a future UI requires selection before completing creation is a presentation/workflow policy outside this taxonomy contract.

Arbitrary free text must be rejected in normal creation/edit flows. Validation must not use case folding, fuzzy matching or automatic synonym conversion to create an apparently valid canonical value.

## 9. Legacy and unknown behavior

An existing non-empty value outside the approved vocabulary is `LEGACY_UNKNOWN`, not automatically invalid data to delete.

Fail-safe rules:

1. preserve the existing value during parsing and reading;
2. do not coerce it to `Drugo`, an empty value or the nearest approved label;
3. do not silently overwrite it during unrelated updates;
4. display it faithfully where the current read surface supports Matter Type;
5. require an explicit user choice before replacing it with an approved value;
6. keep migration/reconciliation auditable when such a workflow is later approved.

`LEGACY_UNKNOWN` is a classification of input validity, not a persisted taxonomy member. MTC-1 does not authorize the inline edit or migration write path needed to resolve it.

## 10. Fallback rule

`Drugo` is the controlled V1 fallback. It is selected deliberately when none of the other 13 values reasonably represents the primary mandate.

`Drugo` does not permit arbitrary text in the Matter Type field. A future optional detail field or tag model requires a separate scoped decision.

## 11. Existing production-candidate alignment

The reviewed implementation is aligned with this authority contract for the separable taxonomy create/read slice:

- `MATTER_TYPES` contains the exact approved values in the approved order;
- `isMatterType` enforces exact membership;
- request parsing carries a single trimmed value;
- POST rejects an unknown non-empty value;
- initial creation stores the selected value as `Vrsta predmeta` in canonical matter metadata;
- parsing preserves existing textual values rather than deleting unknown legacy content;
- API/cockpit reads display the persisted metadata.

Initial creation adds this metadata inside the existing staging transaction: CONTROL files are created with `wx`, verified in staging and published by final directory rename. This is not a new overwrite protocol and does not require MTC-1 to approve Matter Board PATCH or an I12 mutation design.

The shared creation/board UI file remains outside this authority closure and must be split/reviewed before a scoped production acceptance commit.

## 12. Explicit non-goals

MTC-1 does not:

- accept or modify Matter Board/inline editing;
- define or implement I12 mutation behavior;
- accept current active/closed filters or attention heuristics;
- define actionable, waiting, priority, urgency, next-action or due semantics;
- treat every `Rok` as a governing deadline;
- implement VOC-1/MVS-1 operational projections;
- add multi-select types, secondary types or tags;
- add a free-text detail field;
- define a taxonomy migration UI;
- change PCR-1 findings;
- authorize staging, commit, push or production rollout.

## 13. Validation evidence

Targeted existing tests were run with `TEMP` and `TMP` restricted to `C:\SDJ_TEST\SDJ_LEGAL_TEST`:

```text
npm.cmd test -- src/app/api/matters/matter-request.test.ts src/app/api/matters/route.test.ts
```

Result:

```text
Test Files  2 passed (2)
Tests       82 passed (82)
Duration    1.38s
```

The tests cover JSON/multipart request compatibility, preservation of the new field in input shape, selected-type serialization into the file-first command center, the existing staging transaction and its failure/collision behavior. No production code was changed by MTC-1.

## 14. Closure

All 14 existing values are reasonable for the deliberately small V1 practice/matter taxonomy when interpreted with the specificity and primary-mandate rules above. Their overlaps do not require a vocabulary change or another owner decision.

```text
GO — MATTER TYPE TAXONOMY LOCKED
TAXONOMY ACCEPTANCE READY
```

This closes the taxonomy authority blocker only. OPS-PROD-1, WRITE-1 and BOARD-1 remain separate, not accepted work packages.
