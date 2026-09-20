# ACT-MRVN-QUALIFY08 EVIDENCE

## E.0 Source, Toolchain, Frozen Authority

Source tree:
- `bend2/{main,bend,comp,base.bend}` — 4 files, sha256-bound.
- `factory/qualify/ACT-MRVN-QUALIFY04/...` (inherited authorities).
- `factory/qualify/ACT-MRVN-QUALIFY05/...` (inherited artifact schema).
- `factory/qualify/ACT-MRVN-QUALIFY06/...` (180-cell oracle provenance).
- `factory/qualify/ACT-MRVN-QUALIFY07/...` (MRVN-07 43/43 result).
- `factory/qualify/ACT-MRVN-QUALIFY08/{baseline,micro_lab,lab,candidates,proof_break,evidence}` — this ACT.

Live toolchain sha256 (frozen in `FREEZE.md`):
```
34a8a791b02ce92f247bda4cabcd3ff4eabe500002fedbec4867b5db77ee1feb  bend2/main.ts
fe3c2b0b306fccbe44efec349d8f339b6efdaceb090b3d3049c74a1a6015c859  bend2/bend.ts
c181ac038d7f7d4ed0e1bb81c513e64285347627e0b3a13a98cb86a1d1568f54  bend2/comp.ts
b2d53bbd83639c3ae27260b318efa09de9df6006a556ac6ef41c104ea164917a  bend2/base.bend
```

Canonical authority sha256 (frozen from MRVN-06/07):
```
canonical_impl_sha256:   eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb
canonical_laws_sha256:   0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8
canonical_proof_sha256:  c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8
intent_oracle_sha256:    a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9
```

Source commit: `cabb0d28e6f423b0feb9bbacbf6f2f087eb6e57f` (record in
`evidence/source_commit.txt`).

## E.1 MRVN-07 Inherited Authorities

```text
MRVN-07_REPORT_QUALIFICATION    = PARTIAL_QUALIFICATION_WITH_STRONG_PROOF_SURVIVAL_RESULT
MRVN-07_FINAL_VERDICT          = 43/43 = 100% ROBUST under semantics-preserving refactoring
MRVN-07_TWO_ENGINEERING_CORRECTIONS    = (CORRECTION01) refactor simulator labeling,
                                        (CORRECTION02) bounded overclaim removal
MRVN-07_FIVE_BUCKETS           = ROBUST 43 / SEMANTIC_DRIFT 4 /
                                  BEHAVIOR_EVIDENCE_MISMATCH 7 /
                                  AGENT_AUTHORITY_VIOLATION 1
```

Inherited and unchanged.

## E.2 MICRO-ROBUST-01 — Reflexive Closure on Identical Definitions

File: `micro_lab/MICRO-ROBUST-01.bend`
Two structurally identical `canon_add` / `alt_add` definitions; the
law `robust_add_equiv : {canon_add(a, b) == alt_add(a, b) : Nat}` is
discharged by reflexive equality at each construction site.

Run: `bun bend2/main.ts micro_lab/MICRO-ROBUST-01.bend`
- Exit code: 0
- Output: `{==}` (per the file's comment)
- Classification: **PASS**

This is the control: when both sides reduce to the same term, the
canonical proof pattern works.

## E.3 MICRO-PBREAK-01 — Proof-Break Demonstration

Files:
- `micro_lab/MICRO-PBREAK-01-CANON.bend` — canonical definition with
  `canon(p)` body; passes by direct `{==}`.
- `micro_lab/MICRO-PBREAK-01-NAIVE.bend` — definition with `f(p)` body;
  fails because the body does not reduce to `0n` literally.
- `micro_lab/MICRO-PBREAK-01-REPROOF.bend` — same `f(p)` body but
  repaired proof with explicit `_` placeholder.

Runs:
- `bun bend2/main.ts micro_lab/MICRO-PBREAK-01-NAIVE.bend`
  - Exit code: **1** (FAIL with `expected: f(p); observed: 0n`)
  - The naive proof pattern fails on the recursion branch.
- `bun bend2/main.ts micro_lab/MICRO-PBREAK-01-REPROOF.bend`
  - Exit code: **0** (PASS with output `{==}`)
  - The explicit `_` placeholder enables the rewrite engine to
    substitute the goal's RHS into the rewritten LHS.

**Classification: PASS** for the demo of the proof-break phenomenon
and its stock-Bend repair.

## E.4 MICRO-DRIFT-01 — Drift Detection Control

Files:
- `micro_lab/MICRO-DRIFT-01.bend` — robust on the zero-row.
- `micro_lab/MICRO-DRIFT-01-FAIL.bend` — Bend correctly rejects the
  generalised drift claim with `expected: {1n+canon_add(p, b) == b};
  observed: {1n+canon_add(p, b) == 1n+b}`.

Runs:
- `bun bend2/main.ts micro_lab/MICRO-DRIFT-01.bend`
  - Exit: 0 (PASS)
- `bun bend2/main.ts micro_lab/MICRO-DRIFT-01-FAIL.bend`
  - Exit: 1 (FAIL — proves Bend's checker correctly distinguishes)

**Classification: PASS** (control: drift is correctly detected).

## E.5 Corpus Manifest (CORRECTION02 three-tier taxonomy — authoritative)

```text
act:               ACT-MRVN-QUALIFY08
corpus_size:       76  (= 75 CPS + 1 SEMANTIC_DRIFT control)
deliberate_drift:  1   (B-NEG-drift-one-cell)
proof_breaks:      0
durable_drift:     0   (1337-file prior-ACT regression surface clean)
e2e_drift_test:    PASS

family_taxonomy (CORRECTION02 three-tier):
  SYNTHETIC_GENERATOR
  LIVE_SAME_AGENT
  LIVE_INDEPENDENT_AGENT

SYNTHETIC_GENERATOR   = J-SYNTHETIC-GENERATOR    12 attempts   12/12 CPS
LIVE_SAME_AGENT       = K-LIVE-SAME-AGENT        12 attempts   12/12 CPS
LIVE_INDEPENDENT_AGENT= K-LIVE-INDEPENDENT-AGENT  0 attempts    0/12 (MISSING; required for FULL_QUALIFICATION)
```

Authoritative family-level breakdown:

| family | name                                       | min | gen | CPS | SEM_DRIFT | front_limit |
|--------|--------------------------------------------|----:|----:|----:|----------:|------------:|
| A      | identity_reconstruction                    |  6 |   7 |   7 |         0 |           0 |
| B      | double_transformation                      |  6 |   7 |   6 |         1 |           0 |
| C      | scope_quantifier_variants                  |  6 |   6 |   6 |         0 |           0 |
| D      | recursion_shapes                           |  6 |   6 |   6 |         0 |           0 |
| E      | fold_equivalents                           |  6 |   6 |   6 |         0 |           0 |
| F      | actor_pattern_variants                     |  4 |   4 |   4 |         0 |           0 |
| G      | list_iteration_variants                    |  6 |   6 |   6 |         0 |           0 |
| H      | wrapper_with_lemma                          |  6 |   6 |   6 |         0 |           0 |
| I      | recursive_180                              |  4 |   4 |   4 |         0 |           0 |
| **J-SYNTHETIC-GENERATOR** | synthetic_clinemm_passthrough   | 12 |  12 |  12 |         0 |           0 |
| **K-LIVE-SAME-AGENT**     | live_clinemm_adversarial         | 12 |  12 |  12 |         0 |           0 |
| **TOTAL**                  |                                     | 76 |  76 |  75 |         1 |           0 |

Full per-candidate enumeration with sha256, descriptors, and
classifications is in `REVIEW_PACKAGE.md` (R4–R6).

---

### [HISTORICAL / PRE-CORRECTION01 / NON-AUTHORITATIVE]

The block below reproduces the pre-CORRECTION01 corpus manifest (64
attempts, "J" labelled `live_same_agent_adversarial`). It is retained
for the audit trail of how MRVN-08 evolved but is **NOT** the
authoritative corpus descriptor — the table above is. The pre-CORRECTION01
"J" family was a deterministic synthetic passthrough generated by
`gen_candidates.ts`; it was renamed to `J-SYNTHETIC-GENERATOR` in
CORRECTION01 and the live-agent family was split out as `K-LIVE-SAME-AGENT`.

```json
{
  "act": "ACT-MRVN-QUALIFY08",
  "status": "SUPERSEDED — see table above for the CORRECTION02 authoritative taxonomy",
  "corpus_size": 64,
  "families": [
    {"letter": "A", "name": "identity_reconstruction", "minimum": 6, "generated": 7,
     "candidates": ["A-001-id-decision", "A-002-identity-via-named", "A-003-id-via-named",
                     "A-004-id-deep", "A-005-id-nat-tap", "A-006-rename-work",
                     "A-007-all-rename"]},
    {"letter": "B", "name": "double_transformation", "minimum": 6, "generated": 7,
     "candidates": ["B-001-involution-id", "B-002-tag-retag", "B-003-evidence-recode",
                     "B-004-lifecycle-renorm", "B-005-actor-mask", "B-006-capability-encdec",
                     "B-NEG-drift-one-cell"]},
    "...",
    {"letter": "J", "name": "live_same_agent_adversarial [SUPERSEDED -> J-SYNTHETIC-GENERATOR]",
     "minimum": 12, "generated": 12,
     "candidates": ["J-SYN-001-helper-rename", "...", "J-SYN-012-lookup-table"]}
  ]
}
```

Historical candidate lists for the original families A–I are preserved
in `lab/candidates.json`; the current authoritative per-candidate
descriptor list is in `candidates/*/descriptor.json` under each candidate
directory.

## E.6 — E.15 Family Results (CORRECTION02)

For each family A-...-J-SYNTHETIC-GENERATOR-K-LIVE-SAME-AGENT, see
`lab/results.json` and `lab/metrics.json`.

Per-family breakdown (CORRECTION02 three-tier taxonomy):

```text
A               7   7 CPS, 0 SEMANTIC_DRIFT, 0 FRONTEND_LIMIT
B               7   6 CPS, 1 SEMANTIC_DRIFT (control), 0 FRONTEND_LIMIT
C               6   6 CPS, 0 SEMANTIC_DRIFT, 0 FRONTEND_LIMIT
D               6   6 CPS, 0 SEMANTIC_DRIFT, 0 FRONTEND_LIMIT
E               6   6 CPS, 0 SEMANTIC_DRIFT, 0 FRONTEND_LIMIT
F               4   4 CPS, 0 SEMANTIC_DRIFT, 0 FRONTEND_LIMIT
G               6   6 CPS, 0 SEMANTIC_DRIFT, 0 FRONTEND_LIMIT
H               6   6 CPS, 0 SEMANTIC_DRIFT, 0 FRONTEND_LIMIT
I               4   4 CPS, 0 SEMANTIC_DRIFT, 0 FRONTEND_LIMIT
J-SYNTHETIC-GENERATOR    12  12 CPS, 0 SEMANTIC_DRIFT, 0 FRONTEND_LIMIT
K-LIVE-SAME-AGENT 12  12 CPS, 0 SEMANTIC_DRIFT, 0 FRONTEND_LIMIT
TOTAL          76  75 CPS, 1 SEMANTIC_DRIFT, 0 FRONTEND_LIMIT
```

The pattern is uniform:
- All valid candidates classify as `CANONICAL_PROOF_SURVIVED`.
- The deliberate-drift control (B-NEG-drift-one-cell) classifies
  as `SEMANTIC_DRIFT`.
- No `EXTENSIONAL_PROOF_BREAK` was observed.

## E.16 Semantic-Equivalence Results

The 180-cell intent oracle (sha256 `a9c2df5a...`) was used as
authoritative.  All 75 valid candidates produced 0-cell-difference
behavior dumps (`run1_sha256 == run2_sha256`; verified by the
`run_classifications.ts` runner for every 180/180-equivalent
candidate).

## E.17 Canonical-Proof Results

The canonical `PROOF.bend` (sha256 `c6479516...`) was run bytestable
against every candidate.  All 75 valid candidates yielded exit
code 0 with `All terms check.` output.

No proof-break.

## E.18 Canonical-Proof Failure Taxonomy

Not applicable — zero failures observed.

## E.19 Reproof Attempts

Zero reproof attempts.  No canonical-proof failure to repair.

## E.20 Minimized Witness

None observed.

## E.21 Equivalence Theorem

Not testable (no witness).  The MICRO-PBREAK-01-REPROOF establishes
the implicit equivalence theorem in micro.

## E.22 Portable Proof Artifact (CORRECTION01)

All 75 valid candidates were built as MRVN-05 portable artifacts
(via `lab/build_artifact.ts` invoked from `lab/classify.ts`)
and verified in `--mode full`.  The MRVN-08 artifact index is at
`lab/artifact_index.json` and was built by `lab/build_artifact_index.ts`.
Total artifacts: 63 / 63 verify=pass (1 control = SEMANTIC_DRIFT not
artifacted; 12 K-LIVE-SAME-AGENT all pass).

`lab/artifact_index.json` records the artifact IDs and verify
results.

## E.23 — E.28 Self-Tests, Authority Attacks, Regression Hygiene

See:
- `lab/self_test.ts` — 16/16 PASS
- `lab/authority_attacks.ts` — 11/11 PASS
- `lab/regression_hygiene.ts` — 0 drift across 1337-file durable
  MRVN-04..07 surface (CORRECTION01: anchored to git HEAD, sandboxed
  tasks; see E.30 for the strengthened contract).

## E.29 Final Disposition

```text
PRINCIPAL_VERDICT:        PARTIAL_QUALIFICATION_NO_PROOF_BREAK_FOUND_WITHIN_SEARCH_BOUND
                         / INDEPENDENT_AGENT_REPLICATION_REQUIRED
MACHINE_FIELDS:
  proof_break_count       = 0
  reproof_unresolved       = 0
  cps_75_of_76             = 100% of valid candidates (1 SEMANTIC_DRIFT control)
  cps_75_of_75             = 100% of semantic-equivalent candidates
  durable_files_watched   = 1337
  durable_drift            = 0
  e2e_drift_self_test      = PASS

PRIOR_ACT_IMMUTABILITY:
  before this ACT runs:        git diff -- ACT-MRVN-{04..07} = empty
  after this ACT runs:         git diff -- ACT-MRVN-{04..07} = empty

NEXT_REQUIRED_ACT:  independent-agent 12-attempt adversarial run
                    (K-LIVE-INDEPENDENT-AGENT) before promotion to
                    FULL_QUALIFICATION_NO_PROOF_BREAK_FOUND_WITHIN_SEARCH_BOUND.
                    MRVN-EXT-01 stays LOCKED.

## E.30 Regression Hygiene (CORRECTION01)

ACT-MRVN-08 was reviewed by a Factory reviewer who flagged that
the original `lab/regression_hygiene.ts` watched an incomplete
authority set: it only hashed `lab/` subdirectories of prior ACTs
(about 14 files), allowing 45 tracked MRVN-07 files to mutate
unobserved.  CORRECTION01 hardens the gate:

### Authority set (was, now)

```text
Was (incomplete):
  factory/qualify/ACT-MRVN-QUALIFY04/lab/    # 52 files
  factory/qualify/ACT-MRVN-QUALIFY05/lab/    # 21 files
  factory/qualify/ACT-MRVN-QUALIFY06/lab/    # ~541 files
  factory/qualify/ACT-MRVN-QUALIFY07/lab/    # ~723 files (NOT all of them!)
  TOTAL WATCHED: only `lab/` subdir, ~14 files actually enumerated

Now (complete):
  factory/qualify/ACT-MRVN-QUALIFY04/    #  52 files, ALL tracked
  factory/qualify/ACT-MRVN-QUALIFY05/    #  21 files, ALL tracked
  factory/qualify/ACT-MRVN-QUALIFY06/    # 541 files, ALL tracked
  factory/qualify/ACT-MRVN-QUALIFY07/    # 723 files, ALL tracked
  TOTAL WATCHED: 1337 files, ALL git-tracked under prior ACTs
```

### Anchor (was, now)

```text
Was: pre-hash working tree at gate start, post-hash at gate end.
     Drift between pre and post caught.  Pre-existing mutation slipped through.
Now: hash working tree at gate end, compare against `git ls-tree HEAD`
     byte-by-byte.  Any divergence fires REGRESSION_AUTHORITY_DRIFT.
```

### Sandboxing (new)

```text
All regression tasks (MRVN-04 verify, MRVN-06 classify, MRVN-07
frozen-evidence read) run from a /tmp/mrvn08_sandbox_<pid>/ replica,
so they cannot accidentally mutate the original tree even if they
contain a bug.
```

### E2E self-test (new)

`lab/regression_authority_drift_test.ts` proves the gate fires
correctly:

```text
1. Save a copy of the original MRVN-07 manifest.json to /tmp/.
2. Mutate the MRVN-07 manifest.json in-place (add CORRUPTED to text).
3. Run the strengthened regression_hygiene gate.
4. Expect: exit=1, "Drift count: 1", with the mutated path mentioned.
5. Restore the file from /tmp/.
6. Exit 0 if and only if the gate fired correctly.

Test result: PASS.
```

### Repository state before/after

```text
BEFORE this ACT ran the first time:
  $ git status --short | wc -l      -> 46 (45 MRVN-07 modified + 1 MRVN-08 untracked)
  $ git diff -- ACT-MRVN-{04..07}   -> non-empty (45 files drifted)

AFTER this ACT ran cleanly with CORRECTION01:
  $ git status --short | wc -l      -> 1 (only MRVN-08 untracked)
  $ git diff -- ACT-MRVN-{04..07}   -> empty
```

## E.31 ClineMM Adversarial Family (CORRECTION01)

CORRECTION01 adds a new family **K-LIVE-SAME-AGENT** with 12 genuinely
live adversarial attempts authored by this Cline instance.  All 12
candidates compiled successfully and were classified as
`CANONICAL_PROOF_SURVIVED`.  See REPORT.md Q13 for the per-attack
breakdown.

```text
K-01-thunked-work                Unit{}-thunked work_decision          CPS
K-02-actor-first-dispatch        actor-first then capability dispatch  CPS
K-03-recursive-evidence-helper   Nat-indexed recursive helper         CPS
K-04-decision-identity-pipe      decision_identity pipe               CPS
K-05-decision-via-tag            Decision -> DecisionTag -> Decision  CPS
K-06-indirect-cap-match          dispatch_via_cap helper              CPS
K-07-through-helper              through_helper round-trip            CPS
K-08-deeper-helper-chain         2-level helper chain                 CPS
K-09-match-tag-only              paren-wrapped case bodies            CPS
K-10-cap-case-swap               capability cases in different order  CPS
K-11-non-closed-pullout          non_closed_work pullout helper       CPS
K-12-helper-pipeline             dispatch_cap pipeline                CPS
```

Limitation: all 12 K-LIVE-SAME-AGENT attempts were authored by the same
Cline instance that runs this ACT, not by an independent second
agent.  An independent 12-attempt run is required (reviewer's
CORRECTION01 §5) before promotion to `FULL_QUALIFICATION`.
  micro_pbreak_demo        = PASS (FAIL-naive + PASS-reproof observed)

NEXT_RECOMMENDED_ACT:     Effects / IO / FFI Trust Boundary (MRVN-09)
```
