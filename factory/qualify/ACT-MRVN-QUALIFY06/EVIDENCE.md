# ACT-MRVN-QUALIFY06 — EVIDENCE.md

This document records the technical qualification of MRVN-06 against
the bounded question in ACT §1.

> **CORRECTION02 (post-reviewer-disposition, CURRENTLY AUTHORITATIVE)** —
> This evidence is the post-CORRECTION02 run.  The CORRECTION01
> artifact-verify gate is tightened: every authoritative MRVN-06
> artifact verification path invokes MRVN-05 without
> `--allow-toolchain-drift`, so the hash-bound toolchain closure
> MRVN-05 deliberately made adversarial cannot be waived.  The
> `toolchain_tamper` attack (Test 6 in authority_attacks) is added.
> See E.32..E.36 below.  All counts (law_satisfied=20,
> equivalent_survivors=2, specification_gaps=18, law_refuted=8,
> canonical_proof_survivors=20) are unchanged.

> **CORRECTION01 (post-reviewer-disposition, HISTORICAL /
> NON-AUTHORITATIVE)** — The CORRECTION01 section (E.27..E.30)
> captured the artifact-verify gate (P0), regression hygiene (P0),
> and intent-provenance gate (🟠).  It was an interim defense that
> still used `--allow-toolchain-drift` to permit toolchain drift
> between ACT05 and ACT06 to be ignored; that waiver is the bug
> CORRECTION02 removes.

## E.0 — Source state and toolchain identity

- **Act ID**: ACT-MRVN-QUALIFY06
- **Prior acts**:
  - MRVN-01 (FULL_QUALIFICATION)
  - MRVN-02 (FULL_QUALIFICATION)
  - MRVN-03 (FULL_QUALIFICATION / FROZEN)
  - MRVN-04 (FULL_QUALIFICATION / FROZEN)
  - MRVN-05 (FULL_QUALIFICATION / PORTABLE PROOF-CARRYING ARTIFACT)
  - MRVN-EXT-01 (LOCKED)
- **Subject under test**: `factory/qualify/ACT-MRVN-QUALIFY06/authority-kernel/main.bend`
- **Canonical law book**: `factory/qualify/ACT-MRVN-QUALIFY06/authority-kernel/LAWS.bend`
- **Canonical proof**: `factory/qualify/ACT-MRVN-QUALIFY06/authority-kernel/PROOF.bend`
- **Runner**: `bun bend2/main.ts` (Bend 2.0.5)
- **Bun version**: 1.3.14

Frozen identities:

```text
canonical_laws_sha256      = 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9
canonical_impl_sha256      = eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb
canonical_proof_sha256     = c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8
INTENT_TEXT_SHA256         = 1e21d2f56e2d587ef08499a0f58aac47960a6d5c5b4b899a39e972e92985d274
INTENT_ORACLE_SHA256       = a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9
INTENT_CELL_COUNT          = 180

toolchain_closure:
  bend2/main.ts            = 34a8a791b02ce92f247bda4cabcd3ff4eabe500002fedbec4867b5db77ee1feb
  bend2/bend.ts            = fe3c2b0b306fccbe44efec349d8f339b6efdaceb090b3d3049c74a1a6015c859
  bend2/comp.ts            = c181ac038d7f7d4ed0e1bb81c513e64285347627e0b3a13a98cb86a1d1568f54
  bend2/base.bend          = b2d53bbd83639c3ae27260b318efa09de9df6006a556ac6ef41c104ea164917a
```

## E.1 — Canonical law freeze

```text
$ sha256sum factory/qualify/ACT-MRVN-QUALIFY06/authority-kernel/LAWS.bend \
                 factory/qualify/ACT-MRVN-QUALIFY06/authority-kernel/main.bend \
                 factory/qualify/ACT-MRVN-QUALIFY06/authority-kernel/PROOF.bend
2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9  LAWS.bend
eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb  main.bend
c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8  PROOF.bend

$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY06/authority-kernel/PROOF.bend
All terms check.
```

The canonical PROOF discharges against the canonical implementation.
No law or proof content has been altered since MRVN-04 acceptance.

## E.2 — Intent freeze

`intent/INTENT.md` and `intent/oracle.json` were authored and hashed
before any candidate was generated.

```text
$ bun factory/qualify/ACT-MRVN-QUALIFY06/lab/build_oracle.ts \
    --out factory/qualify/ACT-MRVN-QUALIFY06/intent/oracle.json
=== ACT-MRVN-06 oracle builder ===
cells:         180
allow_count:   25
deny_by_reason: {"InsufficientEvidence":8,"Terminal":36,"WrongActor":30,"WrongLifecycle":81}
intent_sha256: 1e21d2f56e2d587ef08499a0f58aac47960a6d5c5b4b899a39e972e92985d274
oracle_sha256: 625408dab52937de124b282d83335e486695b016933ef070fc10ed207c6ecd2e
```

The on-disk oracle.json sha256 (after pretty-printing) is:
`a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9`.

## E.3 — Canonical 180/180 baseline

```text
$ bun factory/qualify/ACT-MRVN-QUALIFY06/lab/canonical_compare.ts
=== ACT-MRVN-06 canonical vs intent baseline ===
oracle_cells: 180
bend_cells:   180
diff_count:   0
oracle_sha256: a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9
intent_text_sha256: 1e21d2f56e2d587ef08499a0f58aac47960a6d5c5b4b899a39e972e92985d274
oracle allow:    25
oracle deny_by_reason: {"InsufficientEvidence":8,"Terminal":36,"WrongActor":30,"WrongLifecycle":81}
PASS: canonical implementation agrees with intent oracle at 180/180 cells.
```

## E.4 — Candidate generator

`factory/qualify/ACT-MRVN-QUALIFY06/lab/build_manifest.ts` produces
`lab/candidates.json` from a compact inline spec.  `lab/make_candidate.ts`
generates each candidate's `main.bend` from its descriptor.

Determinism verified:

```text
$ bun factory/qualify/ACT-MRVN-QUALIFY06/lab/make_candidate.ts \
    --descriptor factory/qualify/ACT-MRVN-QUALIFY06/candidates/CAND-MRVN06-CONTROL-KNOWN/descriptor.json \
    --out /tmp/A.bend
wrote /tmp/A.bend (sha256:9d4cc31ddc26a2de0a224852ba49f6b438cc4baea8a0a8502361983186967420)

$ bun factory/qualify/ACT-MRVN-QUALIFY06/lab/make_candidate.ts \
    --descriptor factory/qualify/ACT-MRVN-QUALIFY06/candidates/CAND-MRVN06-CONTROL-KNOWN/descriptor.json \
    --out /tmp/B.bend
wrote /tmp/B.bend (sha256:9d4cc31ddc26a2de0a224852ba49f6b438cc4baea8a0a8502361983186967420)

$ sha256sum /tmp/A.bend /tmp/B.bend
9d4cc31d...  /tmp/A.bend
9d4cc31d...  /tmp/B.bend
DETERMINISTIC: bytes identical
```

## E.5 — Classifier

`factory/qualify/ACT-MRVN-QUALIFY06/lab/classify.ts` implements the
ACT §23 algorithm:

1. Verify law-hash binding (Phase 1).
2. Run canonical PROOF; on fail, REPROOF.bend; on fail, COUNTEREXAMPLE.bend.
3. Generate behavior dump (always) — `_behavior/_dump.bend` produced
   by `gen_behavior_driver.ts` and run via `bun bend2/main.ts`.
4. Compare 180-cell behavior to oracle.
5. Final classification per ACT §10.

Behavior dump integrity checks:
- exactly 180 rows,
- no duplicate rows,
- no missing rows.

Violations trigger `BEHAVIOR_EVIDENCE_MISMATCH` and exit 1.

## E.6 — Classifier self-tests [HISTORICAL — pre-CORRECTION01 transcript; post-CORRECTION01 self_test grew to 19 tests with 9b-9e artifact-verify cases; post-CORRECTION02 still 19 tests, see E.32..E.36]

```text
$ bun factory/qualify/ACT-MRVN-QUALIFY06/lab/self_test.ts
=== ACT-MRVN-06 Classifier Self-Tests ===
  PASS  1.identical_equiv                          EQUIVALENT_SURVIVOR
  PASS  2.law_refuted                               LAW_REFUTED
  PASS  3.unresolved_no_positive                    UNRESOLVED
  PASS  4.reproof_pass_equiv                        EQUIVALENT_SURVIVOR
  PASS  5.reproof_pass_divergent                    SPECIFICATION_GAP
  PASS  6.canonical_pass_divergent                  SPECIFICATION_GAP
  PASS  7.different_law_hash                        DIFFERENT_SPECIFICATION
  PASS  8.wrong_intent_hash                         AUTHORITY_BINDING_FAILURE
  PASS  9.artifact_verify_fail                      NO_GAP_CLASSIFICATION
  PASS  10.behavior_179_cells                       BEHAVIOR_EVIDENCE_MISMATCH
  PASS  11.duplicate_cell                           BEHAVIOR_EVIDENCE_MISMATCH
  PASS  12.unexpected_181st_cell                    BEHAVIOR_EVIDENCE_MISMATCH
  PASS  13.result_hash_mismatch                     RESULT_HASH_MISMATCH
  PASS  14.expected_does_not_influence_classification  SPECIFICATION_GAP
  PASS  14b.expected_mismatch_detected              true

Results: 15 pass, 0 fail
```

## E.7 — CONTROL-01 (identical implementation)

```text
CAND-MRVN06-CTRL-IDENT
  mutations: []  (no-op)
  classification: EQUIVALENT_SURVIVOR
  diff_count:     0
  proof.canonical: pass
  proof.canonical_sha256: c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8
  artifact_id:    sha256:0829edeb2f3f64b28c3839ac3d8f5afc311482a88cce4bc29495ac78dd7764e9
  verify:         PASS
```

## E.8 — CONTROL-02 (semantics-preserving refactor)

Skipped from the manifest as CONTROL-02's "structural refactor" variant
was folded into the canonical MRVN-04 MUT-05 case (which already
qualifies semantics-preserving refactor + REPROOF via MRVN-04 §3).  MRVN-06
retains the canonical control shape.  The proof-shape coupling
observation is recorded: **20/20 law-compliant candidates use the
canonical PROOF, no REPROOF was required.**

## E.9 — Negative control

```text
CAND-MRVN06-CTRL-NEG  (Agent + Freeze + Active + Live -> Allow)
  mutations: DENY_TO_ALLOW on freeze_decision Agent+Active+Live
  classification: LAW_REFUTED
  diff_count:     3       (Frozen lifecycle case applies to all 3 evidence values)
  proof.canonical: fail   (LAW-002 / LAW-004 catch this)
  proof.counterexample: pass  (auto-generated witness)
  law_status:    REFUTED
```

The counterexample was auto-generated via `make_counterexample.ts`
against the witness cell `Agent,Freeze,Active,Live` with expected
`Deny{WrongActor}`.

## E.10 — Known-gap control

```text
CAND-MRVN06-CONTROL-KNOWN  (reproduces MRVN-04 MUT-08)
  mutations: DENY_REASON_SUBSTITUTE on close_decision
             Reviewer+Frozen+Replay InsufficientEvidence -> Terminal
  classification: SPECIFICATION_GAP
  diff_count:     1
  proof.canonical: pass
  law_status:     SATISFIED
  intent_status:  DIVERGENT
  artifact_id:    sha256:f832f53cc5add6130028f3680775add76a2b74e9d7fe4aba2e615d564b805a5b
  verify:         PASS
  diff witness:   Reviewer+Close+Frozen+Replay
                  expected: Deny{InsufficientEvidence}
                  observed: Deny{Terminal}
```

The MRVN-04 MUT-08 gap **persists** in the current law book.  The lab
successfully re-discovered it.

## E.11 — Family A (DENY_REASON, 8 candidates)

```text
A01  Reviewer+Halt+Active+None  IE->WA   LAW_REFUTED  (LAW-012)
A02  Agent+Halt+Active+None     WA->IE   LAW_REFUTED  (LAW-012)
A03  Reviewer+Close+Frozen+None  IE->WL   SPECIFICATION_GAP (1 diff)
A04  Reviewer+Freeze+Active+Replay IE->WA  SPECIFICATION_GAP (1 diff)
A05  Agent+Close+Frozen          WA->WL   SPECIFICATION_GAP (3 diffs)
A06  Automation+Halt+Active+None IE->WA   SPECIFICATION_GAP (1 diff)
A07  Agent+Work+Frozen           WL->WA   SPECIFICATION_GAP (3 diffs)
A08  Reviewer+Freeze+Frozen+Live WL->WL   EQUIVALENT_SURVIVOR (no-op substitute)
```

## E.12 — Family B (EVIDENCE, 4 candidates)

```text
B01  Reviewer+Close+Frozen+Replay  IE->WA  SPECIFICATION_GAP (1)
B02  Reviewer+Close+Frozen+None    IE->WA  SPECIFICATION_GAP (1)
B03  Reviewer+Freeze+Active+None   IE->WL  SPECIFICATION_GAP (1)
B04  Reviewer+Freeze+Halted+None   IE->WL  SPECIFICATION_GAP (1)
```

## E.13 — Family C (ACTOR, 4 candidates)

```text
C01  Agent+Close+Frozen+Live       WA->WL  SPECIFICATION_GAP (3)
C02  Automation+Freeze+Active+Live WA->WL SPECIFICATION_GAP (3)
C03  Agent+Freeze+Halted+Live      WA->WL  SPECIFICATION_GAP (3)
C04  Automation+Close+Frozen+Live  WA->WL  SPECIFICATION_GAP (3)
```

## E.14 — Family D (LIFECYCLE, 4 candidates)

```text
D01  Agent+Work+Frozen+Live       WL->WA  SPECIFICATION_GAP (3)
D02  Reviewer+Halt+Halted+Live    WL->IE  SPECIFICATION_GAP (3)
D03  Automation+Halt+Draft+Live   WL->IE  SPECIFICATION_GAP (3)
D04  Agent+Halt+Halted+Live       WL->IE  SPECIFICATION_GAP (3)
```

## E.15 — Family E (PRECEDENCE, 5 candidates)

All 5 candidates are LAW_REFUTED — they mutate Allow↔Deny and are
caught by the iff-laws (LAW-002..007).

```text
E01  Reviewer+Halt+Active+Live  Allow -> Deny{WA}   LAW_REFUTED  (LAW-006)
E02  Agent+Halt+Active+Live     Deny{WA} -> Allow   LAW_REFUTED  (LAW-006)
E03  Reviewer+Work+Frozen+Live  Deny{WL} -> Allow   LAW_REFUTED  (LAW-007)
E04  Reviewer+Close+Frozen+Replay Deny{IE} -> Allow  LAW_REFUTED  (LAW-005)
E05  Agent+Work+Active+Live     Allow -> Deny{WL}   LAW_REFUTED  (LAW-007)
```

Each carries an auto-generated COUNTEREXAMPLE.bend that returns
True{} when the candidate diverges from the canonical behavior.

## E.16 — Portable survivor artifacts

20 artifacts built and independently verified:

```text
$ bun factory/qualify/ACT-MRVN-QUALIFY06/lab/build_candidate_artifacts.ts

CAND-MRVN06-CTRL-IDENT       | EQUIVALENT_SURVIVOR    | sha256:0829edeb... | verify=PASS
CAND-MRVN06-CONTROL-KNOWN    | SPECIFICATION_GAP      | sha256:f832f53c... | verify=PASS
CAND-MRVN06-A03              | SPECIFICATION_GAP      | sha256:8cfbd1bc... | verify=PASS
CAND-MRVN06-A04              | SPECIFICATION_GAP      | sha256:89b81a38... | verify=PASS
CAND-MRVN06-A05              | SPECIFICATION_GAP      | sha256:e429925a... | verify=PASS
CAND-MRVN06-A06              | SPECIFICATION_GAP      | sha256:92809f8c... | verify=PASS
CAND-MRVN06-A07              | SPECIFICATION_GAP      | sha256:5b409f2b... | verify=PASS
CAND-MRVN06-A08              | EQUIVALENT_SURVIVOR    | sha256:5529fee1... | verify=PASS
CAND-MRVN06-B01              | SPECIFICATION_GAP      | sha256:5d19bd5a... | verify=PASS
CAND-MRVN06-B02              | SPECIFICATION_GAP      | sha256:3bbdd92c... | verify=PASS
CAND-MRVN06-B03              | SPECIFICATION_GAP      | sha256:7a95fd57... | verify=PASS
CAND-MRVN06-B04              | SPECIFICATION_GAP      | sha256:3e91a5f0... | verify=PASS
CAND-MRVN06-C01              | SPECIFICATION_GAP      | sha256:66b14cc9... | verify=PASS
CAND-MRVN06-C02              | SPECIFICATION_GAP      | sha256:3c777b3e... | verify=PASS
CAND-MRVN06-C03              | SPECIFICATION_GAP      | sha256:7d603d30... | verify=PASS
CAND-MRVN06-C04              | SPECIFICATION_GAP      | sha256:f100408f... | verify=PASS
CAND-MRVN06-D01              | SPECIFICATION_GAP      | sha256:b09312c6... | verify=PASS
CAND-MRVN06-D02              | SPECIFICATION_GAP      | sha256:6785ebe9... | verify=PASS
CAND-MRVN06-D03              | SPECIFICATION_GAP      | sha256:2c332aa7... | verify=PASS
CAND-MRVN06-D04              | SPECIFICATION_GAP      | sha256:ae5e8edb... | verify=PASS

total artifacts: 20
verify PASS:     20
verify FAIL:     0
```

Each artifact preserves:
- `payload/LAWS.bend` byte-identical to canonical
- `payload/main.bend` candidate bytes (different from canonical)
- `payload/PROOF.bend` (canonical, since REPROOF was not required)
- `manifest.json` with `artifact_id` and a `FORMAL_LAW_SATISFACTION` claim
- `evidence/proof-run.json` REPLAYABLE proof execution record

The MRVN-05 verifier (`verify_artifact.ts --mode full`) accepts all 20
artifacts with `integrity=pass proof=pass supplemental=pass` and exits 0.

## E.17 — Gap minimization

```text
$ bun factory/qualify/ACT-MRVN-QUALIFY06/lab/minimize_gaps.ts
records: 18
  CAND-MRVN06-A05: 3 -> 3 (Implementation's lifecycle case has no nested evidence match; ...)
  CAND-MRVN06-A07: 3 -> 3 (...)
  CAND-MRVN06-C01: 3 -> 3 (...)
  CAND-MRVN06-C02: 3 -> 3 (...)
  CAND-MRVN06-C03: 3 -> 3 (...)
  CAND-MRVN06-C04: 3 -> 3 (...)
  CAND-MRVN06-D01: 3 -> 3 (...)
  CAND-MRVN06-D02: 3 -> 3 (...)
  CAND-MRVN06-D03: 3 -> 3 (...)
  CAND-MRVN06-D04: 3 -> 3 (...)
```

The diff=3 candidates cannot be reduced to diff=1 by a textual
substitution: the canonical implementation's lifecycle case
(`case Lifecycle.X{}: Decision.Y` without a nested evidence match)
covers all 3 evidence values for that lifecycle.  The natural minimum
semantic surface is one lifecycle case applied to all 3 evidence
values.

All diff=1 candidates are already minimal.

## E.18 — Gap deduplication

```text
$ cat factory/qualify/ACT-MRVN-QUALIFY06/lab/gap_index.json
{
  "act": "ACT-MRVN-QUALIFY06",
  "raw_gaps": 18,
  "unique_gap_classes": 16
}
```

The 18 raw gaps deduplicate to **16 unique gap classes** (A05/C01,
A07/D01 share an underlying candidate implementation because they
target the same canonical line with the same substitution).

## E.19 — Law-coverage analysis

For each unique gap, the affected dimensions are:

```text
GAP-MRVN06-001 (CONTROL-KNOWN, Reviewer+Close+Frozen+Replay):
  LAW-005 constrains: Deny at this cell iff !(Reviewer && Frozen && Live)
  LAW-005 does NOT constrain: the reason at this cell
  LAW-012 does NOT cover: this cell

GAP-MRVN06-002..010 (Family A, B DENY_REASON candidates):
  LAW-005/006/007 constrain: Deny at these cells
  No LAW constrains: the reason at these cells
  Reason is unconstrained at all 155-3 = 152 Deny cells

GAP-MRVN06-011..016 (Family C, D ACTOR/LIFECYCLE candidates):
  These candidates test reason precedence (WrongLifecycle > WrongActor,
  WrongActor > InsufficientEvidence) at cells where the canonical
  implementation's choice is unstated as a law.
  LAW does NOT constrain: the precedence rule at multi-wrong-dimension cells
```

## E.20 — Intent/law tamper attacks [HISTORICAL — pre-CORRECTION01 transcript; post-CORRECTION01 see E.27..E.31; post-CORRECTION02 see E.32..E.36]

```text
$ bun factory/qualify/ACT-MRVN-QUALIFY06/lab/authority_attacks.ts
=== ACT-MRVN-06 Authority Attack Tests ===
  PASS  intent_tamper       tampered_sha=460358ad6f15... (differs from canonical)
  PASS  law_tamper          DIFFERENT_SPECIFICATION
  PASS  fake_artifact       SPECIFICATION_GAP (classifier independent of fake artifact)
  PASS  behavior_tamper     diff_count=0 (classifier overwrites tampered behavior.json)
  PASS  oracle_contamination SPECIFICATION_GAP (expected_class=LAW_REFUTED does not influence classification)

Results: 5 pass, 0 fail
```

### E.20.a — Intent tamper details

```text
Tampered oracle = canonical oracle with one cell flipped:
  Reviewer + Work + Active + None  Allow -> Deny{Terminal}

Tampered oracle sha256 = 460358ad6f15...  (canonical: a9c2df5a...)
Audit signal: tampered_sha != canonical_sha  → INTENDED TAMPER DETECTED
```

### E.20.b — Law tamper details

```text
Tampered candidate LAWS.bend = canonical LAWS.bend with
  "LAW-MRVN04-001" -> "LAW-MRVN04-XXX" (rename)
Classifier: DIFFERENT_SPECIFICATION  (LAW hash mismatch, exit 1)
```

### E.20.c — Fake artifact details

```text
Candidate: CONTROL-KNOWN (real SPECIFICATION_GAP candidate).
Forged:  /candidates/.../artifact/manifest.json with bogus artifact_id
         "sha256:0000000000000000000000000000000000000000000000000000000000000000"
Classifier: SPECIFICATION_GAP (independent of fake manifest)
```

### E.20.d — Behavior tamper details

```text
Candidate: CTRL-IDENT (real EQUIVALENT_SURVIVOR).
Round 1:  classifier writes behavior.json (diff_count=0).
Tamper:   behavior.json edited to diff_count=99, diffs=[].
Round 2:  classifier re-runs, recomputes behavior, overwrites tampered file.
Result:   behavior.json diff_count=0 (recomputed, not trusted from disk)
```

### E.20.e — Oracle contamination details

```text
Candidate: CONTROL-KNOWN (real SPECIFICATION_GAP, observed_class=SPECIFICATION_GAP).
Pass --expected-class=LAW_REFUTED.
Classifier output: classification=SPECIFICATION_GAP, expected_mismatch=true.
The classifier did NOT trust the expected_class for its decision.
```

## E.21 — Anti-oracle-contamination

See E.20.e.  The classifier emits SPECIFICATION_GAP (the observed
classification) and reports expected_mismatch=true (the test oracle
disagrees).  No candidate classification was overridden by the
expected-results oracle.

## E.22 — MRVN regressions

```text
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/PROOF.bend
All terms check.

$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY03/lifecycle-kernel/PROOF.bend
All terms check.

$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY04/authority-kernel/PROOF.bend
All terms check.

$ bun factory/qualify/ACT-MRVN-QUALIFY04/lab/matrix_compare.ts
BEND_MATRIX_CELLS = 180
TS_MATRIX_CELLS   = 180
DIFF_COUNT        = 0
PASS: matrix.ts matches canonical Bend impl at all 180 cells.

$ bun factory/qualify/ACT-MRVN-QUALIFY04/lab/verify.ts
MRVN-04 qualification PASS: 0 gates failed.

$ bun factory/qualify/ACT-MRVN-QUALIFY04/lab/self_test.ts
Results: 14 pass, 0 fail

$ bun factory/qualify/ACT-MRVN-QUALIFY05/lab/verify_artifact.ts \
    --artifact factory/qualify/ACT-MRVN-QUALIFY05/artifact \
    --bend-runner bend2/main.ts
artifact_id:  sha256:848a89bdc7e14bec6423bf10ed78e31479cf678b46d8cfd12e6a201635b0df24
integrity:    pass
proof:        pass
supplemental: pass
failures:     0
exit: 0

$ bun factory/qualify/ACT-MRVN-QUALIFY05/lab/self_test.ts
Results: 39 pass, 0 fail
```

## E.23 — Final metrics

```text
TOTAL_CANDIDATES         = 28
LAW_SATISFIED            = 20
LAW_REFUTED              = 8
UNRESOLVED               = 0
EQUIVALENT_SURVIVORS     = 2
SPECIFICATION_GAPS       = 18
DIFFERENT_SPECIFICATION  = 0
UNIQUE_GAP_CLASSES       = 16
MIN_DIFF_COUNT           = 1   (CONTROL-KNOWN, A03, A04, A06, B01-B04)
MAX_DIFF_COUNT           = 3   (lifecycle-case mutations)
CANONICAL_PROOF_SURVIVORS = 20
REPROOF_SURVIVORS        = 0
PROVE_SHAPE              = (canonical PROOF discharges every gap)

gap_rate_among_law_satisfied = 18/20 = 90%
```

## E.24 — Final hashes / status

```text
canonical_laws_sha256      = 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9
canonical_impl_sha256      = eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb
canonical_proof_sha256     = c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8
INTENT_TEXT_SHA256         = 1e21d2f56e2d587ef08499a0f58aac47960a6d5c5b4b899a39e972e92985d274
INTENT_ORACLE_SHA256       = a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9

canonical_artifact_id      = sha256:848a89bdc7e14bec6423bf10ed78e31479cf678b46d8cfd12e6a201635b0df24  (MRVN-05)
min_gap_artifact_id        = sha256:f832f53cc5add6130028f3680775add76a2b74e9d7fe4aba2e615d564b805a5b  (CONTROL-KNOWN)

candidate_law_sha256       = ALL 28 candidates == 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9
candidate_intent_sha256    = ALL 28 candidates == a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9

candidate_proof_sha256 (canonical) = c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8 (ALL 20 law-satisfied)
candidate_reproof_sha256            = (none; no REPROOF was required)
```

## E.25 — Raw transcripts

### E.25.a — run_all.ts final summary

```
=== ACT-MRVN-06 summary ===
total candidates: 28
law_satisfied:    20
equivalent_survivors: 2
specification_gaps:    18
law_refuted:      8
unresolved:       0
different_specification: 0
canonical_proof_survivors: 20
reproof_survivors:        0
```

## E.26 — Closing

```text
ACT-MRVN-06 VERDICT: FULL_QUALIFICATION_WITH_SPECIFICATION_GAP_FOUND

The MRVN-04 law book is incomplete as a behavioral characterization of
the 180-cell authority policy.  The gap is concrete, reproducible,
artifactual, and minimized.

The 16 unique gap classes share the same taxonomy: DENY_REASON_GAP.
The 18 specification-gap candidates each carry a portable proof-
carrying artifact (MRVN-05 substrate) with full verification PASS.

No regression to MRVN-01..05.
```

## E.27 — ACT-MRVN-06-CORRECTION01: artifact-verify gate (P0) [HISTORICAL / NON-AUTHORITATIVE]

The classifier `lab/classify.ts` now runs a Phase 4.5 portable
artifact verification BEFORE the final classification.  For every
candidate classified as `EQUIVALENT_SURVIVOR` or `SPECIFICATION_GAP`
by the provisional run, `run_all.ts` invokes
`build_candidate_artifacts.ts --only <candidate>` to build the
artifact, then re-classifies with `--verify-artifact-full
--artifact-required`.

```text
$ bun factory/qualify/ACT-MRVN-QUALIFY06/lab/build_candidate_artifacts.ts
total artifacts: 20
verify PASS:     20
verify FAIL:     0
```

The reclassifier runs `verify_artifact.ts --mode full --bend-runner
bend2/main.ts --allow-toolchain-drift` against the candidate's
artifact.  If verification fails OR the artifact is absent, the
candidate is downgraded to `NO_GAP_CLASSIFICATION` (exit code 1).
If verification passes, the original classification stands.

```text
$ bun factory/qualify/ACT-MRVN-QUALIFY06/lab/authority_attacks.ts
  PASS  intent_tamper:      expected="tampered_sha != canonical_sha"          actual="tampered_sha=460358ad6f15..."
  PASS  law_tamper:         expected="DIFFERENT_SPECIFICATION"                  actual="DIFFERENT_SPECIFICATION"
  PASS  fake_artifact:      expected="NO_GAP_CLASSIFICATION (exit=1)"          actual="NO_GAP_CLASSIFICATION (exit=1)"
  PASS  behavior_tamper:    expected="recomputed behavior diff_count=0"        actual="diff_count=0"
  PASS  oracle_contamination: expected="SPECIFICATION_GAP (expected_class=LAW_REFUTED)"  actual="SPECIFICATION_GAP"
Results: 5 pass, 0 fail
```

Note the `fake_artifact` test now expects `NO_GAP_CLASSIFICATION +
exit=1`, replacing the previous (incorrect) `SPECIFICATION_GAP` 
expectation.

The classifier self_test has 4 new cases:

```text
$ bun factory/qualify/ACT-MRVN-QUALIFY06/lab/self_test.ts
  PASS  9b.artifact_full_verify_fail_downgrades_gap_to_NO_GAP_CLASSIFICATION: NO_GAP_CLASSIFICATION
  PASS  9c.artifact_full_verify_fail_exit_is_1: 1
  PASS  9d.artifact_full_verify_pass_preserves_SPECIFICATION_GAP: SPECIFICATION_GAP
  PASS  9e.artifact_absent_with_required_downgrades_to_NO_GAP_CLASSIFICATION: NO_GAP_CLASSIFICATION
Results: 19 pass, 0 fail
```

## E.28 — ACT-MRVN-06-CORRECTION01: regression hygiene (P0) [HISTORICAL / NON-AUTHORITATIVE]

MRVN-04's `lab/verify.ts` no longer writes durable evidence by
default.  New CLI flags:

* `--no-write` — never write `lab/results.json`
* `--output <path>` — write summary to <path> instead of lab/results.json

The MRVN-04 evidence on disk that was overwritten during the
initial MRVN-06 regression was restored from the frozen
pre-modification state (sha256:aa2d06058643e64bf8ad7cb32cc21c594dd5c075cdbbb2fbb590b86e307750c8).

The new `lab/regression_hygiene.ts` gate asserts pre/post hash
equality of MRVN-04 `results.json` and MRVN-05 `artifact/manifest.json`
across all regression runs.

```text
$ bun factory/qualify/ACT-MRVN-06-CORRECTION01/lab/regression_hygiene.ts --run
=== ACT-MRVN-06 regression hygiene gate ===
mode: executed
  MRVN-04 verify --no-write:                              exit=0
  MRVN-05 verify_artifact --result-out /tmp/...:          exit=0
  MRVN-04 results.json:                                    pre=aa2d06058643 post=aa2d06058643 stable
  MRVN-05 artifact manifest:                               pre=53df2b9c274a post=53df2b9c274a stable
drift_count: 0
PASS: no durable evidence was mutated by regression runs
```

The MRVN-04 evidence remains byte-identical across every regression
run invoked during MRVN-06.

---

Generated 2026-09-20 by ACT-MRVN-QUALIFY06 lab machinery (CORRECTION01 applied). [HISTORICAL]



## E.29 — ACT-MRVN-06-CORRECTION01: intent provenance (🟠) [HISTORICAL / NON-AUTHORITATIVE]

The new `lab/intent_provenance.ts` static gate asserts that
`build_oracle.ts` does NOT depend on any canonical implementation
artifact.  7 forbidden patterns are checked:

* `authority-kernel/main.bend`
* `authority-kernel/PROOF.bend`
* `authority-kernel/LAWS.bend`
* canonical behavior dump references
* candidate behavior references
* Bend toolchain spawning
* Bend toolchain importing

```text
$ bun factory/qualify/ACT-MRVN-QUALIFY06/lab/intent_provenance.ts
=== ACT-MRVN-06 intent provenance gate ===
build_oracle:    factory/qualify/ACT-MRVN-QUALIFY06/lab/build_oracle.ts
sha256:          312bc3c610a3b64482c0c6f99a0b0249c3cb163d9a00e1a25822d09c91644e37
loc:             201
forbidden patterns: 7
violations:      0
PASS: build_oracle.ts has no canonical-implementation dependency
```

The oracle is built solely from `INTENT.md` over the fixed
3x4x5x3 cell enumeration.  No dependence on the canonical Bend
implementation or any prior lab evidence.

## E.30 — Post-CORRECTION01 final hashes / status [HISTORICAL / NON-AUTHORITATIVE]

```text
canonical_laws_sha256      = 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9
canonical_impl_sha256      = eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb
canonical_proof_sha256     = c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8
INTENT_TEXT_SHA256         = 1e21d2f56e2d587ef08499a0f58aac47960a6d5c5b4b899a39e972e92985d274
INTENT_ORACLE_SHA256       = a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9
build_oracle_sha256        = 312bc3c610a3b64482c0c6f99a0b0249c3cb163d9a00e1a25822d09c91644e37

canonical_artifact_id      = sha256:848a89bdc7e14bec6423bf10ed78e31479cf678b46d8cfd12e6a201635b0df24  (MRVN-05)
min_gap_artifact_id        = sha256:f832f53cc5add6130028f3680775add76a2b74e9d7fe4aba2e615d564b805a5b  (CONTROL-KNOWN)

candidate_law_sha256       = ALL 28 candidates == 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9
candidate_intent_sha256    = ALL 28 candidates == a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9

candidate_proof_sha256 (canonical) = c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8 (ALL 20 law-satisfied)
candidate_reproof_sha256            = (none; no REPROOF was required)

mrvn04_results_sha256 (frozen, post-CORRECTION01) = aa2d06058643e64bf8ad7cb32cc21c594dd5c075cdbbb2fbb590b86e307750c8
```

## E.31 — Post-CORRECTION01 closing [HISTORICAL / NON-AUTHORITATIVE]

```text
ACT-MRVN-06 VERDICT: FULL_QUALIFICATION_WITH_SPECIFICATION_GAP_FOUND
                    / CORRECTION01 APPLIED

The MRVN-04 law book is incomplete as a behavioral characterization
of the 180-cell authority policy.  The gap is concrete, reproducible,
artifactual, and minimized.

The 16 unique gap classes share the same taxonomy: DENY_REASON_GAP.
The 18 specification-gap candidates each carry a portable proof-
carrying artifact (MRVN-05 substrate) with full verification PASS.

The lab is now closed under its own authority gates:
  * artifact FULL verification is a mandatory prerequisite for any
    SPECIFICATION_GAP / EQUIVALENT_SURVIVOR verdict,
  * the intent oracle is statically proven independent of the
    canonical implementation,
  * no regression run can mutate prior-ACT durable evidence,
  * all 5 authority attack tests pass with the corrected criteria.

No regression to MRVN-01..05.
```

## E.32 — ACT-MRVN-06-CORRECTION02: toolchain-bound artifact gate (P0)

CORRECTION01 invoked the MRVN-05 portable artifact verifier with
`--allow-toolchain-drift` from `lab/classify.ts`.  The reviewer
(formal methods / proof-carrying artifacts) identified that this
flag explicitly disables the hash-bound toolchain closure MRVN-05
deliberately made adversarial.  Its purpose: if any component of
`bend2/{main,bend,comp,base}.*` was modified between when the
artifact was built and when it was verified, MRVN-05 must report
`TOOLCHAIN_MISMATCH` and exit 1.  CORRECTION01 was silently
waiving that check.

CORRECTION02 removes the flag:

```diff
- factory/qualify/ACT-MRVN-QUALIFY06/lab/classify.ts (line 317)
-       "--allow-toolchain-drift",  // regression hygiene: toolchain drift between ACT05 and ACT06 is not the issue here
+       // ACT-MRVN-06-CORRECTION02:
+       // The --allow-toolchain-drift flag is REMOVED from every
+       // authoritative MRVN-06 artifact verification path.
```

`grep -rn 'allow-toolchain-drift\|allowToolchainDrift' factory/qualify/ACT-MRVN-QUALIFY06/`
returns **zero matches**.

The classifier is the ONLY authoritative verifier in MRVN-06; no
other path invokes MRVN-05 (verified by code inspection).  Every
authoritative MRVN-06 artifact verification now fails closed on
toolchain drift, matching MRVN-05's own self-test case 36
(`toolchain_unknown_extra exit=1`) and case 37
(`toolchain_role_swap exit=1`).

The CORRECTION02 authoritative run re-executed the same 28
candidates through the classifier's `--verify-artifact-full
--artifact-required` path.  All 20 surviving artifacts still pass
the strict toolchain-bound FULL verify (their declared
toolchain_closure matches the live `bend2/{main,bend,comp,base}.*`
hashes byte-for-byte).  No count changed.

```text
$ bun factory/qualify/ACT-MRVN-QUALIFY06/lab/build_candidate_artifacts.ts
total artifacts: 20
verify PASS:     20
verify FAIL:     0

$ bun factory/qualify/ACT-MRVN-QUALIFY06/lab/run_all.ts --verify-artifact-full --artifact-required
=== ACT-MRVN-06 summary ===
total candidates: 28
law_satisfied:    20
equivalent_survivors: 2
specification_gaps:    18
law_refuted:      8
unresolved:       0
different_specification: 0
canonical_proof_survivors: 20
reproof_survivors:        0
```

## E.33 — ACT-MRVN-06-CORRECTION02: toolchain_tamper attack (P0)

A new attack test is added to `lab/authority_attacks.ts` (Test 6):

```text
toolchain_tamper:
  expected: NO_GAP_CLASSIFICATION (artifact FULL verify TOOLCHAIN_MISMATCH, exit=1)
```

The attack:

1. Copy the CONTROL-KNOWN candidate (whose semantic classification
   is `SPECIFICATION_GAP`).
2. Copy the CONTROL-KNOWN artifact verbatim via `cp -R`.
3. Mutate one byte of the `cli` (main.ts) sha256 in the copied
   `manifest.json`'s `provenance.toolchain.toolchain_closure[]`,
   so it disagrees with the live toolchain.
4. The artifact's payload is byte-identical (so integrity/proof
   would still pass), but `TOOLCHAIN_MISMATCH` must trigger.
5. Invoke the classifier with `--verify-artifact-full
   --artifact-required`.

```text
$ bun factory/qualify/ACT-MRVN-QUALIFY06/lab/authority_attacks.ts
=== ACT-MRVN-06 Authority Attack Tests ===
  PASS  intent_tamper:        ...
  PASS  law_tamper:           ...
  PASS  fake_artifact:        ...
  PASS  behavior_tamper:      ...
  PASS  oracle_contamination: ...
  PASS  toolchain_tamper:     expected="NO_GAP_CLASSIFICATION (artifact FULL verify TOOLCHAIN_MISMATCH, exit=1)"
                              actual="class=NO_GAP_CLASSIFICATION artifact.verify=fail failures=-1 exit=1"

Results: 6 pass, 0 fail
```

Note `failures=-1` indicates the verifier exited non-zero with no
structured failure JSON (because the artifact gate short-circuits
on `verifyProc.exitCode !== 0`); the classification is
`NO_GAP_CLASSIFICATION` and the process exit is 1, satisfying the
attack's success criterion.

The closed loop is now:

```text
candidate semantic classification = provisional SPECIFICATION_GAP
   ↓
portable artifact build (real bend2/main.ts runs PROOF.bend)
   ↓
portable artifact FULL verify (MRVN-05 --mode full, NO --allow-toolchain-drift)
   ↓
toolchain_closure[] sha256 must equal live bend2/{main,bend,comp,base}.* sha256
   ↓
mismatch ⇒ TOOLCHAIN_MISMATCH ⇒ verify FAIL ⇒ NO_GAP_CLASSIFICATION, exit=1
match    ⇒ verify PASS ⇒ classification stands
```

## E.34 — ACT-MRVN-06-CORRECTION02: all gates green

```text
=== canonical_compare ===
PASS: canonical implementation agrees with intent oracle at 180/180 cells.

=== self_test ===
Results: 19 pass, 0 fail

=== authority_attacks ===
Results: 6 pass, 0 fail

=== intent_provenance ===
violations: 0
PASS: build_oracle.ts has no canonical-implementation dependency

=== regression_hygiene --run ===
  MRVN-04 results.json:    pre=aa2d06058643 post=aa2d06058643 stable
  MRVN-05 artifact manifest: pre=53df2b9c274a post=53df2b9c274a stable
drift_count: 0
PASS: no durable evidence was mutated by regression runs

=== MRVN regressions ===
MRVN-04 verify --no-write: PASS
MRVN-05 verify_artifact --mode full: integrity=pass proof=pass supplemental=pass failures=0
```

## E.35 — Post-CORRECTION02 final hashes / status

```text
canonical_laws_sha256      = 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9
canonical_impl_sha256      = eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb
canonical_proof_sha256     = c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8
INTENT_TEXT_SHA256         = 1e21d2f56e2d587ef08499a0f58aac47960a6d5c5b4b899a39e972e92985d274
INTENT_ORACLE_SHA256       = a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9
build_oracle_sha256        = 312bc3c610a3b64482c0c6f99a0b0249c3cb163d9a00e1a25822d09c91644e37

live_bend2_toolchain_sha256 (now part of every authoritative artifact verify):
  bend2/main.ts   = 34a8a791b02ce92f247bda4cabcd3ff4eabe500002fedbec4867b5db77ee1feb
  bend2/bend.ts   = fe3c2b0b306fccbe44efec349d8f339b6efdaceb090b3d3049c74a1a6015c859
  bend2/comp.ts   = c181ac038d7f7d4ed0e1bb81c513e64285347627e0b3a13a98cb86a1d1568f54
  bend2/base.bend = b2d53bbd83639c3ae27260b318efa09de9df6006a556ac6ef41c104ea164917a

canonical_artifact_id      = sha256:848a89bdc7e14bec6423bf10ed78e31479cf678b46d8cfd12e6a201635b0df24  (MRVN-05)
min_gap_artifact_id        = sha256:f832f53cc5add6130028f3680775add76a2b74e9d7fe4aba2e615d564b805a5b  (CONTROL-KNOWN)

candidate_law_sha256       = ALL 28 candidates == 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9
candidate_intent_sha256    = ALL 28 candidates == a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9

candidate_proof_sha256 (canonical) = c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8 (ALL 20 law-satisfied)
candidate_reproof_sha256            = (none; no REPROOF was required)
candidate_artifact_verify           = (20/20) pass (FULL, toolchain-bound, no drift waiver)

mrvn04_results_sha256 (frozen, post-CORRECTION02) = aa2d06058643e64bf8ad7cb32cc21c594dd5c075cdbbb2fbb590b86e307750c8
```

## E.36 — Post-CORRECTION02 closing

```text
ACT-MRVN-06 VERDICT: FULL_QUALIFICATION_WITH_SPECIFICATION_GAP_FOUND
                    / CORRECTION02 APPLIED (CURRENTLY AUTHORITATIVE)

The MRVN-04 law book is incomplete as a behavioral characterization
of the 180-cell authority policy.  The gap is concrete, reproducible,
artifactual, and minimized.

The 16 unique gap classes share the same taxonomy: DENY_REASON_GAP.
The 18 specification-gap candidates each carry a portable proof-
carrying artifact (MRVN-05 substrate) with full toolchain-bound
verification PASS.

The lab is now closed under its own authority gates:
  * artifact FULL verification is a mandatory prerequisite for any
    SPECIFICATION_GAP / EQUIVALENT_SURVIVOR verdict,
  * artifact verification is hash-bound to the live bend2 toolchain;
    toolchain drift is an adversarial failure (no waiver),
  * the intent oracle is statically proven independent of the
    canonical implementation,
  * no regression run can mutate prior-ACT durable evidence,
  * all 6 authority attack tests pass (incl. toolchain_tamper),
  * every authoritative verdict is reproducible from the same
    inputs in the same order.

No regression to MRVN-01..05.
```

---

Generated 2026-09-20 by ACT-MRVN-QUALIFY06 lab machinery (CORRECTION02 applied).
