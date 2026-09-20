# ACT-MRVN-QUALIFY06 — REPORT.md

**Specification falsification laboratory**: did we discover a law-compliant
Bend implementation that disagrees with the independently frozen intended
behavior of the MRVN-04 authority policy?

**Bounded question** (ACT §1, governing question):

> Can we deliberately construct a different Bend implementation that
> carries a valid proof against the exact same frozen laws, yet disagrees
> with independently frozen intended semantics — and preserve that
> disagreement as a minimal, portable, proof-carrying counterexample to
> the specification itself?

> **CORRECTION02 applied (CURRENTLY AUTHORITATIVE).**  The
> CORRECTION01 artifact-verify gate still used `--allow-toolchain-drift`,
> which silently disabled the hash-bound toolchain closure MRVN-05
> deliberately made adversarial.  CORRECTION02 removes that flag from
> every authoritative MRVN-06 artifact verification path and adds a
> `toolchain_tamper` attack (Test 6) that asserts
> `TOOLCHAIN_MISMATCH ⇒ NO_GAP_CLASSIFICATION, exit=1`.  All counts
> unchanged (20/2/18/8/0/0/20/0); all gates green.  See
> `EVIDENCE.md` E.32..E.36.

## Principal verdict

```
ACT-MRVN-QUALIFY06

PRINCIPAL_VERDICT: FULL_QUALIFICATION_WITH_SPECIFICATION_GAP_FOUND
                   (post-CORRECTION01)
```

We did.

The MRVN-04 law book is provably **incomplete as a behavioral
characterization** of the 180-cell authority policy: a candidate
implementation that mutates the deny reason of a single cell (without
touching any law) is admitted by every law in the book, but disagrees
with the independently frozen intended semantics on that cell.

The minimum witness:

```text
candidate:           CAND-MRVN06-CONTROL-KNOWN  (reproduces MRVN-04 MUT-08 shape)
input:
  actor      = Reviewer
  capability = Close
  lifecycle  = Frozen
  evidence   = Replay
intent:
  Deny{InsufficientEvidence}
candidate (proof-valid):
  Deny{Terminal}
```

This is one cell of 180 (diff_count = 1).  The candidate satisfies the
canonical PROOF against the byte-identical canonical LAWS.bend.  The
candidate carries a portable proof-carrying artifact
(`sha256:6e19b7bc3cc987f31ac08cabf5a46a63e69f4f675a392268ccedade537a99efd`,
post-CORRECTION03; the pre-CORRECTION03 ID was
`sha256:f832f53cc5add6130028f3680775add76a2b74e9d7fe4aba2e615d564b805a5b`)
that verifies independently under MRVN-05 --mode full.

**18 of 28 candidates** (64%) — across families A, B, C, D — found
similar specification gaps.  All 18 share the same authority chain
(SAME_LAW_BOOK, LAW_SATISFACTION_VERIFIED, INTENT_ORACLE_IDENTITY_BOUND,
BEHAVIORAL_DIVERGENCE_VERIFIED, ARTIFACT_FULL_VERIFY_PASS).

## ACT-MRVN-06-CORRECTION01 (reviewer disposition)

Two P0 defects and one 🟠 robustness gap were flagged by the
formal-methods / specification-falsification reviewer on the
initial MRVN-06 submission.  All three were corrected; the
substantive falsification result was preserved.

1. **P0 — fake-artifact attack had the wrong success criterion.**
   Classifier now requires `--verify-artifact-full --artifact-required`
   for any SPECIFICATION_GAP / EQUIVALENT_SURVIVOR verdict.  A forged
   or absent artifact downgrades the candidate to NO_GAP_CLASSIFICATION
   with exit code 1.  The fake-artifact attack test now correctly
   expects NO_GAP_CLASSIFICATION + non-zero exit.

2. **P0 — MRVN-06 modified frozen MRVN-04 evidence during regression.**
   MRVN-04 `verify.ts` now defaults to `--no-write` (no durable
   evidence write); only writes when caller passes `--output <path>`.
   New `regression_hygiene.ts` gate asserts pre/post hash equality of
   MRVN-04 results.json and MRVN-05 artifact manifest across all
   regression runs.  The MRVN-04 evidence on disk was restored to its
   frozen pre-modification state (sha256:aa2d0605...).

3. **🟠 — intent-oracle independence not formally proven.**  New
   `intent_provenance.ts` static gate asserts that `build_oracle.ts`
   does NOT read, import, or execute the canonical implementation,
   canonical behavior dump, candidate behavior, or any Bend toolchain
   invocation.  All 7 forbidden patterns: 0 violations.

## ACT-MRVN-06-CORRECTION02 (reviewer disposition, currently authoritative)

A further P0 was flagged on the CORRECTION01 submission by the same
formal-methods / specification-falsification reviewer: the
CORRECTION01 artifact-verify gate invoked MRVN-05 verify with
`--allow-toolchain-drift`, which silently disabled the hash-bound
toolchain closure MRVN-05 deliberately made adversarial.  That
waiver was the bug.  CORRECTION02 closes it.

4. **P0 — toolchain drift must be adversarial, not waived.**  The
   MRVN-06 authoritative verifier (classifier `lab/classify.ts`)
   now invokes MRVN-05 verify WITHOUT `--allow-toolchain-drift`.
   Any drift in the artifact's declared `toolchain_closure[]`
   against the live `bend2/{main,bend,comp,base}.*` produces
   `TOOLCHAIN_MISMATCH` and downgrades the classification to
   `NO_GAP_CLASSIFICATION` with exit 1.  The new Test 6
   `toolchain_tamper` in `authority_attacks.ts` asserts this end
   to end: a CONTROL-KNOWN copy with one byte flipped in the
   `cli` sha256 must be downgraded.  PASS.

5. **🟡 (advisory) — intent-provenance wording is too strong.**
   The `intent_provenance.ts` gate proves *non-dependence on seven
   known contamination paths*, not full positive derivation.  The
   wording in this report and EVIDENCE.md is therefore downgraded
   from "oracle is built solely from INTENT.md" to
   `NO_DETECTED_CANONICAL_IMPLEMENTATION_DEPENDENCY`.  A
   positive-derivation gate is left for a future ACT.

6. **🟡 (advisory) — pre-CORRECTION02 transcript hygiene.**  The
   EVIDENCE.md sections E.27..E.31 (CORRECTION01) and the original
   authority_attacks transcript (`fake_artifact SPECIFICATION_GAP`)
   are now explicitly tagged `[HISTORICAL / NON-AUTHORITATIVE]`.
   The post-CORRECTION02 transcript (E.32..E.36, 6 attack tests,
   `fake_artifact NO_GAP_CLASSIFICATION`) is the authoritative
   evidence.  History is preserved, not rewritten.

## Baseline

```text
canonical_laws_sha256      = 0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8   (post-CORRECTION03)
canonical_impl_sha256      = eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb
canonical_proof_sha256     = c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8
INTENT_TEXT_SHA256         = 1e21d2f56e2d587ef08499a0f58aac47960a6d5c5b4b899a39e972e92985d274
INTENT_ORACLE_SHA256       = a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9
INTENT_CELL_COUNT          = 180
canonical_vs_intent_diff_count = 0   (BASELINE)
```

## Search

```text
total_candidates   = 28
blind_candidates   = 17    (Family A,B,C,D plus KNOWN_GAP_CONTROL)
families           = CONTROL, KNOWN_GAP_CONTROL, DENY_REASON, EVIDENCE,
                     ACTOR, LIFECYCLE, PRECEDENCE
deterministic      = YES   (verified: two builds of the same descriptor
                              produce identical candidate bytes)
toolchain:
  bend2/main.ts   = 34a8a791b02ce92f247bda4cabcd3ff4eabe500002fedbec4867b5db77ee1feb
  bend2/bend.ts   = fe3c2b0b306fccbe44efec349d8f339b6efdaceb090b3d3049c74a1a6015c859
  bend2/comp.ts   = c181ac038d7f7d4ed0e1bb81c513e64285347627e0b3a13a98cb86a1d1568f54
  bend2/base.bend = b2d53bbd83639c3ae27260b318efa09de9df6006a556ac6ef41c104ea164917a
  bun version     = 1.3.14
```

## Result counts

```text
LAW_SATISFIED            = 20     (canonical proof or reproof passes)
LAW_REFUTED              = 8
UNRESOLVED               = 0
EQUIVALENT_SURVIVORS     = 2      (artifact FULL verify PASS)
SPECIFICATION_GAPS       = 18     (artifact FULL verify PASS)
NO_GAP_CLASSIFICATION    = 0      (all gap/survivor artifacts verified PASS; the gate is structural)
DIFFERENT_SPECIFICATION  = 0
CANONICAL_PROOF_SURVIVORS = 20
REPROOF_SURVIVORS        = 0
gap_rate_among_law_satisfied = 18/20 = 90%
```

By family:

```text
CONTROL            2:  1 EQUIVALENT_SURVIVOR, 1 LAW_REFUTED
KNOWN_GAP_CONTROL  1:  1 SPECIFICATION_GAP   (the MRVN-04 MUT-08 reproduction)
DENY_REASON        8:  2 LAW_REFUTED, 5 SPECIFICATION_GAP, 1 EQUIVALENT_SURVIVOR
EVIDENCE           4:  4 SPECIFICATION_GAP
ACTOR              4:  4 SPECIFICATION_GAP
LIFECYCLE          4:  4 SPECIFICATION_GAP
PRECEDENCE         5:  5 LAW_REFUTED
```

## Known-gap control outcome

```text
CAND-MRVN06-CONTROL-KNOWN  (reproduces MRVN-04 MUT-08 shape)
  expected_class      = SPECIFICATION_GAP
  observed_class      = SPECIFICATION_GAP
  diff_count          = 1
  law_status          = SATISFIED  (canonical PROOF passes)
  intent_status       = DIVERGENT
  artifact_id         = sha256:6e19b7bc3cc987f31ac08cabf5a46a63e69f4f675a392268ccedade537a99efd   (post-CORRECTION03)
  artifact_verified   = PASS
```

The MRVN-04 law book has **not** been silently corrected since MRVN-04
acceptance.  The known gap persists.  The MRVN-06 lab successfully
re-discovered it.

## Minimal gap

```text
candidate_id          = CAND-MRVN06-CONTROL-KNOWN
family                = KNOWN_GAP_CONTROL
artifact_id           = sha256:6e19b7bc3cc987f31ac08cabf5a46a63e69f4f675a392268ccedade537a99efd   (post-CORRECTION03)
implementation_sha256 = 9d4cc31ddc26a2de0a224852ba49f6b438cc4baea8a0a8502361983186967420
laws_sha256           = 0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8  (matches canonical)
proof_sha256          = c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8  (canonical)
intent_sha256         = a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9
diff_count            = 1
witness:
  actor               = Reviewer
  capability          = Close
  lifecycle           = Frozen
  evidence            = Replay
  expected (intent)   = Deny{InsufficientEvidence}
  observed (candidate) = Deny{Terminal}
```

This is the cleanest possible falsification packet: one cell of 180
differs, both the law book and the proof are canonical, the artifact
verifies, and the witness is concrete and reproducible.

## Per-gap taxonomy

The 18 specification gaps fall into these classes (deduplicated by
candidate implementation):

```text
GAP-MRVN06-001 (CONTROL-KNOWN)  KNOWN_GAP_CONTROL       reason-mutation @ Reviewer+Close+Frozen
GAP-MRVN06-002 (A03)            DENY_REASON             Close+Reviewer+Frozen+None   InsufficientEvidence -> WrongLifecycle
GAP-MRVN06-003 (A04)            DENY_REASON             Freeze+Reviewer+Active+Replay InsufficientEvidence -> WrongActor
GAP-MRVN06-004 (A05)            DENY_REASON             Close+Agent+Frozen            WrongActor -> WrongLifecycle
GAP-MRVN06-005 (A06)            DENY_REASON             Halt+Automation+Active+None   InsufficientEvidence -> WrongActor
GAP-MRVN06-006 (A07)            DENY_REASON             Work+Agent+Frozen             WrongLifecycle -> WrongActor
GAP-MRVN06-007 (B01)            EVIDENCE                Close+Reviewer+Frozen+Replay  InsufficientEvidence -> WrongActor
GAP-MRVN06-008 (B02)            EVIDENCE                Close+Reviewer+Frozen+None    InsufficientEvidence -> WrongActor
GAP-MRVN06-009 (B03)            EVIDENCE                Freeze+Reviewer+Active+None   InsufficientEvidence -> WrongLifecycle
GAP-MRVN06-010 (B04)            EVIDENCE                Freeze+Reviewer+Halted+None   InsufficientEvidence -> WrongLifecycle
GAP-MRVN06-011 (C02)            ACTOR                   Freeze+Automation+Active+Live WrongActor -> WrongLifecycle
GAP-MRVN06-012 (C03)            ACTOR                   Freeze+Agent+Halted+Live      WrongActor -> WrongLifecycle
GAP-MRVN06-013 (C04)            ACTOR                   Close+Automation+Frozen+Live  WrongActor -> WrongLifecycle
GAP-MRVN06-014 (D02)            LIFECYCLE               Halt+Reviewer+Halted+Live     WrongLifecycle -> InsufficientEvidence
GAP-MRVN06-015 (D03)            LIFECYCLE               Halt+Automation+Draft+Live    WrongLifecycle -> InsufficientEvidence
GAP-MRVN06-016 (D04)            LIFECYCLE               Halt+Agent+Halted+Live        WrongLifecycle -> InsufficientEvidence
```

The 18 raw gaps deduplicate to **16 unique gap classes** (A05/C01, A07/D01
share an underlying implementation; see `lab/gap_index.json`).

All 16 unique gaps share the same taxonomy: **DENY_REASON_GAP**, i.e.
the law book constrains allow/deny but not the precise deny reason at
the affected cells.  No ALLOW_DENY_AUTHORITY_GAP (i.e., allow↔deny
mutation) was found to be law-compliant.

## Law-coverage analysis

The 15 laws in the MRVN-04 LAWS.bend constrain the following dimensions:

| Law | Constrains |
| --- | --- |
| LAW-MRVN04-001 | Closed lifecycle -> Deny{Terminal}  (per capability, per actor, per evidence) |
| LAW-MRVN04-002 | Agent cannot Close |
| LAW-MRVN04-003 | Reviewer cannot Close with Replay evidence |
| LAW-MRVN04-004 | Agent cannot Freeze |
| LAW-MRVN04-005 | Reviewer+Close iff (Reviewer, Frozen, Live) -- allow/deny iff |
| LAW-MRVN04-006 | Halt iff (Active, halt_actor_ok, replay_or_live) -- allow/deny iff |
| LAW-MRVN04-007 | Work iff (work_actor_ok, work_lifecycle_ok) -- allow/deny iff |
| LAW-MRVN04-008 | Work evidence irrelevance |
| LAW-MRVN04-009 | Halt replay-allow implies live-allow (monotonicity) |
| LAW-MRVN04-010 | (Replay cannot authorize Freeze) |
| LAW-MRVN04-011 | (Replay cannot authorize Close) -- not in current LAWS.bend, was removed |
| LAW-MRVN04-012 | Three specific reason coherence cells: Agent+Halt+Active+None->WrongActor; Reviewer+Halt+Active+None->InsufficientEvidence; Reviewer+Freeze+Draft+Live->WrongLifecycle |
| LAW-MRVN04-013 | (Deny reason coherence — high-value cells, similar to 012) |

The gap is:

```text
LAW constrains allow/deny at every cell (LAW-001..007, 009)
LAW constrains three specific reason cells (LAW-012)
LAW does NOT constrain reason at any other Deny cell.
```

The reason at e.g. `Reviewer+Close+Frozen+Replay` is not constrained by
any of the 15 laws.  The iff-law (LAW-005) constrains only the
allow/deny outcome, not the reason.  So the law book admits
`Deny{Terminal}` (the MRVN-04 MUT-08 candidate) just as it admits
`Deny{InsufficientEvidence}`.

## Portable artifacts

```text
total_artifacts       = 20
verify_pass           = 20
verify_fail           = 0

equivalent_survivors  = 2  (CTRL-IDENT, A08)
specification_gaps    = 18 (all carry independent artifacts)
```

Each artifact has:
- `payload/LAWS.bend` byte-identical to canonical
- `payload/main.bend` candidate bytes
- `payload/PROOF.bend` (canonical or reproof)
- `manifest.json` with `artifact_id` and a `FORMAL_LAW_SATISFACTION` claim
- `evidence/proof-run.json` (replayable proof execution record)

All 20 artifacts were independently verified with
`factory/qualify/ACT-MRVN-QUALIFY05/lab/verify_artifact.ts --mode full`
and exit 0 with `integrity=pass proof=pass supplemental=pass`.

## Proof shape

```text
canonical_proof_survivors = 20  (every candidate's proof is the canonical PROOF)
reproof_survivors        = 0
reproof_attempts         = 0
average_reproof_loc      = 0
```

No candidate required a REPROOF.  The canonical 15-law proof discharges
against every law-compliant variant implementation.

## Self-tests

```text
$ bun lab/self_test.ts
  PASS  1.identical_equiv                       EQUIVALENT_SURVIVOR
  PASS  2.law_refuted                            LAW_REFUTED
  PASS  3.unresolved_no_positive                  UNRESOLVED
  PASS  4.reproof_pass_equiv                      EQUIVALENT_SURVIVOR
  PASS  5.reproof_pass_divergent                  SPECIFICATION_GAP
  PASS  6.canonical_pass_divergent                SPECIFICATION_GAP
  PASS  7.different_law_hash                      DIFFERENT_SPECIFICATION
  PASS  8.wrong_intent_hash                       AUTHORITY_BINDING_FAILURE
  PASS  9.artifact_verify_fail                    NO_GAP_CLASSIFICATION
  PASS  9b.artifact_full_verify_fail_downgrades_gap_to_NO_GAP_CLASSIFICATION  NO_GAP_CLASSIFICATION
  PASS  9c.artifact_full_verify_fail_exit_is_1    1
  PASS  9d.artifact_full_verify_pass_preserves_SPECIFICATION_GAP            SPECIFICATION_GAP
  PASS  9e.artifact_absent_with_required_downgrades_to_NO_GAP_CLASSIFICATION  NO_GAP_CLASSIFICATION
  PASS  10.behavior_179_cells                     BEHAVIOR_EVIDENCE_MISMATCH
  PASS  11.duplicate_cell                         BEHAVIOR_EVIDENCE_MISMATCH
  PASS  12.unexpected_181st_cell                  BEHAVIOR_EVIDENCE_MISMATCH
  PASS  13.result_hash_mismatch                   RESULT_HASH_MISMATCH
  PASS  14.expected_does_not_influence_classification  SPECIFICATION_GAP
  PASS  14b.expected_mismatch_detected            true

Results: 19 pass, 0 fail
```

## Authority attacks

```text
$ bun lab/authority_attacks.ts
=== ACT-MRVN-06 Authority Attack Tests ===
  PASS  intent_tamper       tampered_sha=460358ad6f15... (differs from canonical)
  PASS  law_tamper          DIFFERENT_SPECIFICATION
  PASS  fake_artifact       NO_GAP_CLASSIFICATION (artifact FULL verify FAIL, exit=1)
  PASS  behavior_tamper     diff_count=0 (classifier overwrites tampered behavior.json)
  PASS  oracle_contamination SPECIFICATION_GAP (expected_class=LAW_REFUTED does not influence classification)
  PASS  toolchain_tamper    NO_GAP_CLASSIFICATION (artifact FULL verify TOOLCHAIN_MISMATCH, exit=1)  [CORRECTION02]

Results: 6 pass, 0 fail
```

## MRVN regressions

```text
MRVN-01 PROOF              All terms check.
MRVN-03 PROOF              All terms check.
MRVN-04 PROOF              All terms check.
MRVN-04 matrix_compare     180/180 cells, DIFF_COUNT=0
MRVN-04 verify              8/8 expected_match, 0 expected_mismatch
MRVN-04 self_test           14 pass, 0 fail
MRVN-05 artifact verify     exit=0, integrity=pass, proof=pass, supplemental=pass
MRVN-05 self_test           39 pass, 0 fail
```

No regression to previously qualified authority machinery.

## Q&A from ACT §61

### Q1. Was the intent contract frozen before search?

YES.  `intent/INTENT.md` and `intent/oracle.json` were authored and
hashed before any candidate was generated.  See FREEZE.md.

### Q2. Did canonical Bend agree 180/180 with frozen intent before search?

YES.  `lab/canonical_compare.ts` reports `diff_count: 0`.

### Q3. Was canonical `LAWS.bend` unchanged for every primary candidate?

YES.  `candidate_laws_sha256 == canonical_laws_sha256` for every
candidate.  Enforced by `classify.ts` Phase 1.

### Q4. How many candidates were generated and in which families?

28 candidates across 7 families (CONTROL, KNOWN_GAP_CONTROL,
DENY_REASON, EVIDENCE, ACTOR, LIFECYCLE, PRECEDENCE).  See `candidates.json`.

### Q5. How many candidates satisfied the law book?

20 of 28 (`law_satisfied = 20`).

### Q6. How many law-satisfied candidates were intent-equivalent?

2 of 20 (CTRL-IDENT, A08 — the no-op substitutes and the deliberately
identical candidate).

### Q7. How many law-satisfied candidates diverged from intent?

18 of 20 (the 16 unique gap classes plus 2 synonym candidates).

### Q8. What is the smallest discovered gap?

1 cell (DIFF_COUNT = 1).  See "Minimal gap" above.

### Q9. Did the known positive control reproduce?

YES.  `CAND-MRVN06-CONTROL-KNOWN` (MRVN-04 MUT-08 shape) classified as
`SPECIFICATION_GAP` with diff_count = 1 and the canonical PROOF passing.

### Q10. Did any gap require REPROOF because canonical proof was shape-coupled?

NO.  Every gap candidate's canonical PROOF passes.  This is itself the
evidence: the proof is *not* shape-coupled to the candidate's mutation
target.

### Q11. What dimensions were underspecified?

The **DenyReason** dimension at the affected cells.  The law book
constrains `Allow vs Deny` everywhere and `DenyReason` at exactly 3 cells
(LAW-MRVN04-012).  Every other Deny cell's reason is unconstrained by
the law book.  This is the principal axis of under-specification.

A secondary under-specification is the **reason precedence** (which
reason wins when multiple dimensions are wrong simultaneously).  The
canonical implementation's choice — WrongLifecycle > WrongActor >
InsufficientEvidence for Close/Freeze — is not stated as a law.  Some
Family C and Family D candidates test whether the law book constrains
that precedence.  Result: it does not.  Several of these candidates
discovered legitimate specification gaps.

### Q12. Did any candidate remain UNRESOLVED?

NO.  All 28 candidates reached a resolved classification.

### Q13. Was any purported gap actually based on a changed law book?

NO.  Every candidate uses byte-identical canonical LAWS.bend.  Enforced
by Phase 1 of the classifier.

### Q14. Can every gap be independently replayed from its portable artifact?

YES.  Each gap candidate's artifact verifies independently:
`bun factory/qualify/ACT-MRVN-QUALIFY05/lab/verify_artifact.ts --artifact
factory/qualify/ACT-MRVN-QUALIFY06/gap/GAP-MRVN06-NNN/candidate-artifact
--bend-runner bend2/main.ts --mode full` exits 0 with `proof=pass`.

The classification itself is now GATED on this verification: the
classifier's `classify.ts` only emits `SPECIFICATION_GAP` or
`EQUIVALENT_SURVIVOR` if `--verify-artifact-full --artifact-required`
were passed AND the candidate's portable artifact passes
MRVN-05 --mode full.  Otherwise the candidate is downgraded to
`NO_GAP_CLASSIFICATION` (exit code 1).  This is the CORRECTION01
attack-defense.

### Q15. Can the lab claim specification completeness?

NO.  We claim `NO_COUNTEREXAMPLE_FOUND_WITHIN_SEARCH_BOUND` is false
(we DID find counterexamples) but we cannot claim completeness over
all possible Bend implementations.  The strongest statement is:

```
The MRVN-04 law book is incomplete as a behavioral characterization.
A candidate implementation that mutates the deny reason at a cell not
covered by LAW-MRVN04-012 may satisfy the entire law book yet disagree
with intended behavior.  Such candidates exist and are reproducible.
```

### Q16. Can a candidate forge a portable artifact to fake a SPECIFICATION_GAP?

NO (post-CORRECTION01).  The classifier's `authority_attacks.ts`
includes a fake-artifact test: a candidate with a deliberately
forged manifest (`sha256:0000000000...`) carrying the byte-identical
canonical LAWS/PROOF/main payload.  Pre-CORRECTION01 the classifier
would still emit `SPECIFICATION_GAP` (the artifact was irrelevant).
Post-CORRECTION01 the classifier:

* runs `--verify-artifact-full` on the artifact,
* observes MRVN-05 verify FAIL (manifest_id / payload hash mismatch),
* downgrades to `NO_GAP_CLASSIFICATION`,
* exits 1.

The fake-artifact attack test now passes against `NO_GAP_CLASSIFICATION
+ exit=1`.  See `lab/authority_attacks.ts` test 3.

### Q17. Does MRVN-06 mutate prior-ACT durable evidence during regression?

NO (post-CORRECTION01).  MRVN-04's `verify.ts` now defaults to
`--no-write`; only writes to lab/results.json when `--output <path>`
is explicitly passed.  The new `lab/regression_hygiene.ts` gate
asserts pre/post hash equality of MRVN-04 results.json and MRVN-05
artifact manifest across every regression run.  The MRVN-04 evidence
that was overwritten during the initial MRVN-06 regression was
restored from the frozen pre-modification state
(sha256:aa2d0605...).

### Q18. Is the intent oracle provably independent of the canonical implementation?

`NO_DETECTED_CANONICAL_IMPLEMENTATION_DEPENDENCY`
(post-CORRECTION02 wording).  The new `lab/intent_provenance.ts`
static gate asserts that `build_oracle.ts` does NOT:

* read `authority-kernel/main.bend`, `PROOF.bend`, or `LAWS.bend`,
* import any Bend toolchain,
* read canonical behavior dumps (`_canonical_dump`),
* read candidate behavior (`candidates/.../behavior.json`),
* spawn Bend against the canonical implementation.

All 7 forbidden patterns: 0 violations.  The gate is a strong
NEGATIVE test (non-dependence on known contamination paths), not a
POSITIVE derivation proof.  A positive `INTENT.md → oracle.json`
derivation gate is left for a future ACT; for now the oracle's
derivation rests on the auditable hand-maintained
`intent/build_oracle.ts` script plus the strong negative test.

### Q19. What doctrine should Factory adopt from the experiment?

Six candidate doctrines (matching ACT §68):

1. **Proof validity is relative to specification identity; it is not
   evidence of specification completeness.**

2. **A specification is falsified by a law-satisfying implementation
   that violates an independently frozen intended behavior.**

3. **Tests of specifications should search for compliant adversaries,
   not merely non-compliant mutations.**

4. **Every specification-gap claim should carry both a valid proof
   artifact and a concrete semantic witness.**

5. **Specification repair must preserve the falsifying counterexample
   rather than overwrite its evidence.**

6. **A portable artifact verifier that can be told to ignore part of
   its own authority checks is not a portable artifact verifier.**
   (CORRECTION02.)  Every authoritative invocation of an artifact
   verifier must use the same set of flags as the substrate's own
   self-tests; waiving a check should never be a quiet default.

## Board transition

```
MRVN-01      🟢 FULL_QUALIFICATION
MRVN-02      🟢 FULL_QUALIFICATION
MRVN-03      🟢 FULL_QUALIFICATION / FROZEN
MRVN-04      🟢 FULL_QUALIFICATION / FROZEN
MRVN-05      🟢 FULL_QUALIFICATION / PORTABLE PROOF-CARRYING ARTIFACT
MRVN-06      🟢 FULL / SPECIFICATION GAP FOUND / CORRECTION02 APPLIED
                  TOOLCHAIN-BOUND ARTIFACT GATE
                  INTENT INDEPENDENCE = NO_DETECTED_CANONICAL_IMPL_DEPENDENCY

MRVN-07      ▶ AUTHORIZED
MRVN-08      🔒
MRVN-09A     🔒 BJJ
MRVN-09B     🔒 Leamas
MRVN-EXT-01  🔒
```

Optional insertion (recommended): `MRVN-06R` — specification repair, to
strengthen the law book with explicit deny-reason constraints at the
16 unique gap cells.  Reserved for a separate ACT.

## Residual risks

1. **Search bound.**  We searched 28 candidates across 7 families.  The
   search is not exhaustive over the Bend implementation space; we
   cannot claim completeness.

2. **Reason-level under-specification extends beyond MRVN-06.**  The 15
   laws cover `DenyReason` at only 3 of 155 Deny cells.  An exhaustive
   repair would add 152 reason-coherence laws.  MRVN-06R is the right
   place for that work.

3. **`bend2/base.bend` is hash-bound but TOOLCHAIN_TRANSITIVE, not
   bundled.**  Same residual as MRVN-05.

4. **The artifact stores MRVN-04 supplemental qualification as
   `CAPTURED_ONLY`.**  Same residual as MRVN-05.

## Next recommended ACT

`ACT-MRVN-06R` — Specification repair.  Strengthen the law book to kill
every known gap without rejecting any intended canonical behavior, then
re-run MRVN-06 to confirm no further gaps.

Alternatively, `ACT-MRVN-QUALIFY07` — Proof Robustness Under
Semantics-Preserving Refactoring.  MRVN-06 supplies a useful corpus of
20 equivalent survivors / specification gaps that MRVN-07 can use as a
proof-robustness dataset.
