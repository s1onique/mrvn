# ACT-MRVN-QUALIFY07 REPORT (CORRECTION03)

## Subject
Measure the Bend proof robustness of the finite MRVN-04/06 authority kernel
(3×4×5×3 = 180 decision cells) under semantics-preserving refactoring.

## Frozen Authority (byte-identical to MRVN-06)
- canonical_impl_sha256:  `eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb`
- canonical_laws_sha256:  `0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8`
- canonical_proof_sha256: `c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8`
- intent_oracle_sha256:   `a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9`
- toolchain: bend2/{main,bend,comp,base.bend} (4 files byte-for-byte bound)

## Principal Verdict
**PARTIAL_QUALIFICATION_WITH_STRONG_PROOF_SURVIVAL_RESULT**

(Bounded finite-kernel finding is FULL.  Mandatory artifact gate, real
E2E tamper attacks, simulator labelling, and D/F/H reclassification are
all implemented and correct.  The closure is PARTIAL because (a)
CONTROL-03 was not constructed for this kernel and (b) the agent path
is a deterministic simulator, not live ClineMM.  Per CORRECTION02, the
previous CORRECTION01 wording "CONTROL-03 = STRUCTURALLY IMPOSSIBLE IN
BEND" was an overclaim and is replaced with the bounded wording below.)

## CORRECTION01 — four engineering corrections (preserved)

The original closure claimed `FULL_QUALIFICATION_WITH_ROBUST_PROOFS`.  The
formal-methods reviewer flagged four P0 engineering issues.  All four
remain corrected:

1. **Mandatory artifact gate**: artifact verification is now mandatory by
   default; missing/failing artifact → `NO_ROBUSTNESS_CLASSIFICATION`.
2. **Deterministic simulator labelling**: `lab/agent_refactor.ts` is
   labelled `DETERMINISTIC_REFACTOR_SIMULATOR` (NOT live ClineMM).
3. **D/F/H reclassification**: reclassified as REFACTOR_GENERATOR_FAILURE /
   LANGUAGE_WELL_FORMEDNESS_LIMIT / UNSUPPORTED_SYNTAX, not proof coupling.
4. **Real E2E authority attacks**: `artifact_payload_tamper` and
   `toolchain_tamper` execute against the live toolchain (not synthetic
   self-tests).  Total attacks: 11/11 PASS.

## CORRECTION02 — overclaim removed

### The reviewer's challenge

The CORRECTION01 report claimed:

```
CONTROL_03_STATUS = STRUCTURALLY_IMPOSSIBLE_IN_BEND
```

with the argument:

```
same semantics
→ same reduction
→ same WNF
→ same definitional proof
```

The first implication is false in intensional / dependent type theory.
Bend's own guide (`guide/GUIDE.md`) makes the distinction explicit:

- **EXTENSIONAL** equality: `f(x) == g(x)` for every `x`.
- **DEFINITIONAL** equality: `f` and `g` **reduce to the same term**.

`{==}` closes the gap only when both sides **already compute to the
same term**.  The canonical `add_zero` example needs induction because
symbolic equality is not yet definitional.  Therefore the chain
"semantics-preserving ⇒ same WNF ⇒ same proof" is **not** a theorem
about arbitrary Bend programs.

### What we actually have

For the **specific MRVN-04 finite kernel + the specific canonical proof**:

```
finite input domain (10⁵ × 6 = 600 closed actor × decision pairs)
total pure decision function
exhaustive constructor-splitting proof (PROOF.bend reduces every symbolic
  input to a closed constructor combination, then closes leaves with {==})

29 primary + 14 simulator = 43 semantics-preserving refactors
─────────────────────────────────────────────────────────────────
43 / 43 = 100 % canonical-proof survival
```

### Corrected wording

The CORRECTION01 overclaim is **removed** and replaced with the bounded,
scientifically correct wording (FREEZE.md §CORRECTION02):

```
control_03_status            = NOT_CONSTRUCTED_FOR_THIS_EXHAUSTIVE_FINITE_PROOF
observed_property            = NO_EXTENSIONALLY_EQUIVALENT_PROOF_BREAK_FOUND
                               IN 43 TESTED SEMANTICS-PRESERVING REFACTORS
hypothesis                   = EXHAUSTIVE_FINITE_CASE_PROOFS_MAY_BE
                               CANONICAL-PROOF-INVARIANT_UNDER_TOTAL
                               SEMANTICS-PRESERVING_REFACTORING
proof_of_hypothesis          = NOT_ESTABLISHED
proposed_followup_act        = ACT-MRVN-08-PROOF_BREAK_SEARCH
```

### CTRL-PBREAK reclassified

`REF-MRVN07-CTRL-PBREAK` (rename `authorize` → `do_authorize`) **does
not** demonstrate CONTROL-03.  It demonstrates **interface/spec binding**:
the LAWS reference `Gate.authorize` directly, so renaming the symbol
simultaneously breaks the LAWS.  Its classification is therefore
relabelled:

```
mismatch_taxonomy:
  PROOF_BREAK_STRUCTURAL_IMPOSSIBILITY  →  INTERFACE_BINDING_RENAME
```

### Why this is the more interesting finding

What we have actually observed is not "Bend cannot break this proof" but
"**an exhaustive finite case proof may have a remarkably large
proof-stability basin**."  This is a hypothesis worth investigating in
ACT-MRVN-08, with constructive search for propositionally-but-not-
definitionally-equal refactors (identity-like reconstruction, double
transformations, alternative recursive definitions, different
elimination order, helper whose identity requires a lemma).

## CORRECTION03 — population + classification reconciliation

Per the formal-methods reviewer's hygiene note, the population and
classification accounting in the original CORRECTION02 draft used
stale counts (54, 36 primary, 2 SEMANTIC_DRIFT).  The experiment
itself was always 55 (see `lab/metrics.json` and EVIDENCE.md §E.13).
CORRECTION03 reconciles to the canonical 55-count with five
classification buckets:

| Bucket                       | Count | Source                                                |
|------------------------------|------:|-------------------------------------------------------|
| ROBUST                       |    43 | 29 primary + 14 simulator                             |
| SEMANTIC_DRIFT               |     4 | 1 CTRL-NEG + 1 AGENT-003 + 2 NEG-MRVN07-001/-002     |
| BEHAVIOR_EVIDENCE_MISMATCH   |     7 | D:1 + F:2 + H:3 + CTRL-PBREAK:1                       |
| AGENT_AUTHORITY_VIOLATION    |     1 | AGENT-MRVN07-013 (law-edit caught by agent guard)     |
| **TOTAL**                    | **55**|                                                       |

`43 + 4 + 7 + 1 = 55`. ✓  See `CORRECTION03.md` for the full
canonical table and the rationale for the 5th bucket.

### Scope of CORRECTION03 (precise)

CORRECTION03 is **bounded** and falls into two categories:

**Documentation repair** (no behavior change):
- `CORRECTION02.md` — stale 54-count section rewritten as the
  5-bucket canonical table.
- `FREEZE.md` — CORRECTION03 frozen-invariants amendment.
- `REPORT.md` (this section + table 5th column + Q13/Q14 +
  Doctrine/Residual Risks).
- `EVIDENCE.md` — title, §E.2 Corpus, §E.15 retitled, new §E.16.

**Lab bookkeeping/orchestration (bounded behavioral, end-to-end consistent):**
- `lab/agent_refactor.ts` — when the agent-authority guard catches
  a law-edit attempt, the pipeline now also pushes the candidate into
  `summary.candidates` AND increments
  `summary.classifications["AGENT_AUTHORITY_VIOLATION"]`, so the
  simulator population count reconciles end-to-end (16 declared ==
  16 listed == 14 ROBUST + 1 SEMANTIC_DRIFT + 1 AGENT_AUTHORITY_VIOLATION).
- `lab/run_all.ts` — orchestrator now includes `agent_refactor` and
  `metrics` as pipeline stages (stages 02 and 04), so a single
  `bun run_all.ts` invocation regenerates the canonical
  population/classification accounting.  No new exit condition.
- `lab/metrics.ts` — comment block updated to CORRECTION03 wording;
  no behavioral change to the metrics computation.

**Not changed** (and what is preserved by CORRECTION03):
- Authority kernel, classifier semantics, proof, law book,
  frozen toolchain closure (`bend2/{main,bend,comp,base.bend}` hashes
  all match FREEZE.md).
- 43/43 proof-survival result.
- 18/18 self-tests PASS / 11/11 authority attacks PASS / 0 drift.
- Principal verdict: `PARTIAL_QUALIFICATION_WITH_STRONG_PROOF_SURVIVAL_RESULT`.

The scientific result and the principal verdict are unchanged.

## Corpus (reconciled)

- primary candidates:    37  (CTRL-IDENT + CTRL-WS + CTRL-NEG + CTRL-PBREAK
                              + 33 family refactors A01–J02)
- blind-agent corpus:    16  (deterministic simulator, not live ClineMM)
- negative controls:     2   (NEG-MRVN07-001, NEG-MRVN07-002)
- **Total artefacts classified: 55**

## Classification Results

| Family / corpus                | count | ROBUST | SEMANTIC_DRIFT | BEHAVIOR_EVIDENCE_MISMATCH | AGENT_AUTHORITY_VIOLATION |
|--------------------------------|------:|-------:|---------------:|---------------------------:|--------------------------:|
| A (branch reorder)             |     7 |      7 |              0 |                          0 |                         0 |
| B (catchall contract)          |     5 |      5 |              0 |                          0 |                         0 |
| C (helper extraction)          |     4 |      4 |              0 |                          0 |                         0 |
| D (helper inlining)            |     1 |      0 |              0 |                          1 |                         0 |
| E (wrapper)                    |     3 |      3 |              0 |                          0 |                         0 |
| F (decomposition)              |     3 |      1 |              0 |                          2 |                         0 |
| G (condition factoring)        |     3 |      3 |              0 |                          0 |                         0 |
| H (branch merging)             |     3 |      0 |              0 |                          3 |                         0 |
| I (recursion shape)            |     2 |      2 |              0 |                          0 |                         0 |
| J (declaration order)          |     2 |      2 |              0 |                          0 |                         0 |
| CONTROL (IDENT + WS)           |     2 |      2 |              0 |                          0 |                         0 |
| CONTROL_PBREAK (rename)        |     1 |      0 |              0 |                          1 |                         0 |
| NEGATIVE_SEMANTIC (CTRL-NEG)   |     1 |      0 |              1 |                          0 |                         0 |
| Blind-agent simulator          |    16 |     14 |              1 |                          0 |                         1 |
| Negative controls (NEG-*)      |     2 |      0 |              2 |                          0 |                         0 |
| **TOTAL**                      | **55** | **43** | **4** | **7** | **1** |

## Proof Survival (the bounded finding)

| Population                                            | N  | survived | failed | rate |
|-------------------------------------------------------|---:|---------:|-------:|-----:|
| parseable + 180/180 semantic-equivalent primary       | 29 |       29 |      0 | 1.00 |
| blind-agent simulator ROBUST subset                   | 14 |       14 |      0 | 1.00 |
| **Combined ROBUST**                                   | **43** | **43** | **0** | **1.00** |

**Bounded result**: The MRVN-04 finite authority kernel exhibits perfect
canonical-proof survival across all 43 semantics-preserving refactors
that were successfully constructed and verified in this corpus.

## Churn

- Implementation churn:
  median = 1 LOC, p90 = 8 LOC, max = 15 LOC, n = 29
- Proof churn: 0 LOC (canonical PROOF.bend survives every ROBUST candidate)
- Amplification (proof_lines_added / impl_lines_changed):
  median = 0, p90 = 0, max = 0

## Family Reclassification (per ACT-MRVN-07-CORRECTION01)

The 7 BEHAVIOR_EVIDENCE_MISMATCH cases (originally labelled "proof-shape
coupling") have been reclassified:

| Family | Old label           | New label (correct)               | Reason |
|--------|---------------------|-----------------------------------|--------|
| D      | PROOF_SHAPE_COUPLING| REFACTOR_GENERATOR_FAILURE        | inliner indentation bug — fixed |
| F      | PROOF_SHAPE_COUPLING| LANGUAGE_WELL_FORMEDNESS_LIMIT    | Bend affine binder-order constraint |
| H      | PROOF_SHAPE_COUPLING| UNSUPPORTED_SYNTAX                | Bend lacks `case A{} | B{}` disjunctive patterns |

These candidates never reach a parseable state, so no proof term was
checked against them — there is no evidence of proof coupling.

## Authority Attacks (11/11 PASS)

| Attack                          | Result |
|---------------------------------|--------|
| altered_laws                    | PASS   |
| fake_behavior_regenerated       | PASS   |
| fake_proof_pass                 | PASS   |
| artifact_absent_mandatory       | PASS   |
| artifact_absent_allow_optout    | PASS   |
| toolchain_intact                | PASS   |
| oracle_contamination            | PASS   |
| semantic_regression             | PASS   |
| law_weakening                   | PASS   |
| artifact_payload_tamper         | PASS   |
| toolchain_tamper                | PASS   |

## Classifier Self-Tests (18/18 PASS)

All classifier behaviours verified, including the new mandatory-artifact gate.

## Regression Hygiene

0 drift across MRVN-04/05/06 evidence. MRVN-04 verify exit=0, MRVN-06
classify exit=0.

## MRVN Regressions

None. All prior ACTs (MRVN-04/05/06) re-run non-mutating; 0 regressions.

## Q1–Q16 (ACT §53, updated for CORRECTION03)

- Q1: 29 primary + 14 simulator = 43 semantics-preserving refactors qualified ROBUST.
- Q2: 100% preserved canonical proof (43/43).
- Q3: 0 required reproof (canonical proof never fails on the constructed corpus).
- Q4: N/A (no reproof).
- Q5: amplification median=0, p90=0, max=0; impl churn median=1 LOC.
- Q6: A/B/C/E/G/I/J families 100% ROBUST.
- Q7: D, F, H families are NOT proof-shape coupling — reclassified as
      REFACTOR_GENERATOR_FAILURE / LANGUAGE_WELL_FORMEDNESS_LIMIT /
      UNSUPPORTED_SYNTAX.
- Q8: None observed.
- Q9: REF-MRVN07-CTRL-IDENT (byte-identical).
- Q10: 0 repairs needed.
- Q11: 0 unresolved.
- Q12: NO CHECKER_CAPABILITY_GAP justified for this corpus.  MRVN-EXT-01
       stays LOCKED.  The previous justification ("structural impossibility
       in Bend") is REMOVED per CORRECTION02; the bound is now "not
       constructed for this exhaustive finite proof".
- Q13: DETERMINISTIC_REFACTOR_SIMULATOR 14/16 ROBUST + 1 SEMANTIC_DRIFT
       + 1 AGENT_AUTHORITY_VIOLATION (AGENT-013 law-edit caught by
       agent-authority guard).
- Q14: 1 law-edit, 1 escape-hatch, 1 drift detected by the simulator.
       Per CORRECTION03, AGENT-013 (law-edit) is in its own
       AGENT_AUTHORITY_VIOLATION bucket; not counted under any of the
       four implementation-level classifications.
- Q15: N/A (no repairs needed).
- Q16: PROMISING for finite kernels (with explicit caveat: we did NOT
       test richer recursive / higher-order / dependent programs; the
       bounded result does not generalise to all of Bend).

## Board Transition

```
MRVN-01..06  🟢 FULL (unchanged)
MRVN-07      🟡 PARTIAL  (bounded finite-kernel proof-survival result FULL;
                          CONTROL-03 not constructed for this kernel;
                          agent path is deterministic simulator, not live
                          ClineMM; CORRECTION02 overclaim removed;
                          CORRECTION03 reconciles population/classification
                          accounting + lab pipeline end-to-end)
MRVN-08      🔒 HOLD  (proposed: PROOF_BREAK_SEARCH, see CORRECTION02)
MRVN-09A/B   🔒 LOCKED
MRVN-EXT-01  🔒 LOCKED (no CHECKER_CAPABILITY_GAP)
```

### Reviewer-disposition table (final)

```
MRVN-07 FINITE-KERNEL RESULT        FULL
PROOF SURVIVAL                      43/43
PROOF CHURN                         0 LOC
POPULATION                          55/55 RECONCILED
CLASSIFICATION BUCKETS              55/55 RECONCILED
CONTROL-03                          NOT CONSTRUCTED
BEND-WIDE CLAIM                     REMOVED
ARTIFACT GATE                       FAIL-CLOSED
AUTHORITY ATTACKS                   11/11 PASS
REGRESSION DRIFT                    0

MRVN-07 OVERALL =
  PARTIAL_QUALIFICATION_WITH_STRONG_PROOF_SURVIVAL_RESULT
```

## Doctrine

- The 43/43 result is a *bounded finite-kernel finding*, not a universal
  claim about Bend proofs.  CORRECTION02 removed the prior
  "structurally impossible" overclaim and replaced it with the bounded
  `NOT_CONSTRUCTED_FOR_THIS_EXHAUSTIVE_FINITE_PROOF` framing.
- Mandatory artifact gate is the correct authority model for downstream
  certifications.
- Agent authority must be enforced separately from semantic equivalence
  (CORRECTION03: AGENT_AUTHORITY_VIOLATION is its own bucket).

## Residual Risks

- ClineMM live run remains unexecuted.  Synthetic agent violations were
  detected by the deterministic simulator; a live agent might find more.
- We did not exercise proof repair because no canonical proof failed on
  the constructed corpus.  A larger corpus with recursive / higher-order
  programs (where extensional ≠ definitional) could change this — see
  ACT-MRVN-08-PROOF_BREAK_SEARCH.
