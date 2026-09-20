# ACT-MRVN-QUALIFY07 EVIDENCE (CORRECTION03)

## E.0 Source, Toolchain, Frozen Authority

Source tree:
- bend2/{main,bend,comp,base.bend}  -- 4 files, sha256-bound.
- factory/qualify/ACT-MRVN-QUALIFY04/{authority-kernel,lab}
- factory/qualify/ACT-MRVN-QUALIFY06/{authority-kernel,lab,intent}
- factory/qualify/ACT-MRVN-QUALIFY07/{baseline,lab,candidates,evidence,negative_controls}

Live toolchain sha256 (frozen in FREEZE.md):
```
34a8a791b02ce92f247bda4cabcd3ff4eabe500002fedbec4867b5db77ee1feb  bend2/main.ts
fe3c2b0b306fccbe44efec349d8f339b6efdaceb090b3d3049c74a1a6015c859  bend2/bend.ts
c181ac038d7f7d4ed0e1bb81c513e64285347627e0b3a13a98cb86a1d1568f54  bend2/comp.ts
b2d53bbd83639c3ae27260b318efa09de9df6006a556ac6ef41c104ea164917a  bend2/base.bend
```

Canonical authority sha256 (frozen from MRVN-06):
- canonical_impl_sha256:  `eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb`
- canonical_laws_sha256:  `0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8`
- canonical_proof_sha256: `c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8`
- intent_oracle_sha256:   `a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9`

## E.1 Baseline (copied verbatim from MRVN-06)
- baseline/main.bend     221 LOC, sha256: eea5d84f...
- baseline/LAWS.bend     ~5.4 KB, sha256: 0feed5f8...
- baseline/PROOF.bend    478 LOC, sha256: c6479516...
- baseline/oracle.json   180 cells (3×4×5×3), sha256: a9c2df5a...

## E.2 Corpus (CORRECTION03)

Primary candidates: 37 (families A-J + controls + CONTROL_PBREAK)
- A: 7 candidates (branch reorder)
- B: 5 candidates (catchall contract)
- C: 4 candidates (helper extraction)
- D: 1 candidate (helper inlining — inliner bug prevented more)
- E: 3 candidates (wrapper)
- F: 3 candidates (decomposition)
- G: 3 candidates (condition factoring)
- H: 3 candidates (branch merging)
- I: 2 candidates (recursion shape)
- J: 2 candidates (declaration order)
- CONTROL: 2 (REF-MRVN07-CTRL-IDENT, REF-MRVN07-CTRL-WS)
- CONTROL_PBREAK: 1 (REF-MRVN07-CTRL-PBREAK; documents INTERFACE_BINDING_RENAME, see §E.14)
- NEGATIVE_SEMANTIC: 1 (REF-MRVN07-CTRL-NEG)

Sum: 33 family refactors + 4 controls = 37 primary.

Agent corpus (DETERMINISTIC_REFACTOR_SIMULATOR, not live ClineMM): 16
- AGENT-MRVN07-001..016, including 3 deliberate-violation candidates
  (AGENT-003 SEMANTIC_DRIFT, AGENT-013 AGENT_AUTHORITY_VIOLATION,
  AGENT-004 escape-hatch attempt).

Additional negative controls: 2 (NEG-MRVN07-001, NEG-MRVN07-002).

**Canonical total: 55 = 37 primary + 16 simulator + 2 negative controls.**

**Classification buckets (post-CORRECTION03):**
- ROBUST:                       43 (29 primary + 14 simulator)
- SEMANTIC_DRIFT:                4 (1 CTRL-NEG + 1 AGENT-003 + 2 NEG-MRVN07)
- BEHAVIOR_EVIDENCE_MISMATCH:    7 (D:1 + F:2 + H:3 + CTRL-PBREAK:1)
- AGENT_AUTHORITY_VIOLATION:     1 (AGENT-MRVN07-013; law-edit caught)
- **TOTAL:                       55**

## E.3 Family Results (CORRECTION01)

For each family: see lab/metrics.json.  Summary:
- ROBUST: 29 primary (A: 7, B: 5, C: 4, E: 3, F: 1, G: 3, I: 2, J: 2, CONTROL: 2)
- SEMANTIC_DRIFT: 1 (REF-MRVN07-CTRL-NEG)
- BEHAVIOR_EVIDENCE_MISMATCH: 7 (D: 1, F: 2, H: 3, CTRL-PBREAK: 1)

Family reclassification per ACT-MRVN-07-CORRECTION01:
- D: REFACTOR_GENERATOR_FAILURE (inliner indentation bug)
- F: LANGUAGE_WELL_FORMEDNESS_LIMIT (Bend affine binder-order)
- H: UNSUPPORTED_SYNTAX (no disjunctive case patterns)

## E.4 Blind-Agent Corpus Results (DETERMINISTIC_REFACTOR_SIMULATOR)

```
classifications: {"ROBUST": 14, "SEMANTIC_DRIFT": 1}
violations:
  law_edit_attempts:    1 (AGENT-MRVN07-013, tampered LAWS.bend)
  semantic_drift_count: 1 (AGENT-MRVN07-003, changed Allow->Deny)
  escape_hatch_attempts: 1 (AGENT-MRVN07-004, ?TODO marker)
```

**This is NOT a live ClineMM result.**  Per ACT-MRVN-07-CORRECTION01,
this corpus is labelled `DETERMINISTIC_REFACTOR_SIMULATOR`.  A live ClineMM
run is a follow-up.

## E.5 Proof Survival

For parseable + 180/180 semantic-equivalent primary candidates (29):
- canonical_proof_survived: 29
- canonical_proof_failed:    0
- survival_rate: 1.00

For blind-agent ROBUST subset (14):
- canonical_proof_survived: 14
- canonical_proof_failed:    0
- survival_rate: 1.00

## E.6 Churn

Implementation churn (29 ROBUST primary):
- median: 1 LOC, p90: 8 LOC, max: 15 LOC, n: 29

Proof churn (29 ROBUST primary):
- median: 0 LOC, p90: 0 LOC, max: 0 LOC, n: 0

Amplification (proof_lines_added / impl_lines_changed):
- median: 0, p90: 0, max: 0

## E.7 Minimal Witnesses

- minimal_proof_break: null (none exist in this corpus)
- minimal_robust_witness: REF-MRVN07-CTRL-IDENT (byte-identical, 0 LOC delta)

## E.8 Portable Artifacts (post-CORRECTION01)

- Total artifacts built: 43 (29 primary ROBUST + 14 agent ROBUST)
- Verify PASS: 43 / 43
- Verify FAIL: 0
- Each artifact's manifest.json contains the canonical_hash,
  laws_hash, intent_hash, and proof_kind.

## E.9 Authority Attacks (CORRECTION01, 11/11 PASS)

```
PASS  altered_laws
PASS  fake_behavior_regenerated
PASS  fake_proof_pass
PASS  artifact_absent_mandatory         (NEW — artifact gate is mandatory)
PASS  artifact_absent_allow_optout      (NEW — --allow-no-artifact opt-out)
PASS  toolchain_intact
PASS  oracle_contamination
PASS  semantic_regression
PASS  law_weakening
PASS  artifact_payload_tamper           (NEW — end-to-end, not synthetic)
PASS  toolchain_tamper                  (NEW — end-to-end, not synthetic)
```

The two new E2E attacks:
- `artifact_payload_tamper`: builds via MRVN-05, mutates `payload/PROOF.bend`,
  verifies → exit 1 (PASS).
- `toolchain_tamper`: appends a sentinel byte to `bend2/main.ts`, runs
  classifier → TOOLCHAIN_MISMATCH (PASS).  File is restored before exit.

## E.10 Classifier Self-Tests (18/18 PASS)

All synthetic classifier self-tests pass, including new ones that exercise
the mandatory artifact gate.

## E.11 Regression Hygiene

- MRVN-04 verify: exit 0
- MRVN-06 classify (CTRL-IDENT): exit 0
- drift count: 0

## E.12 MRVN Regressions

None. MRVN-04/05/06 evidence unchanged; no drift.

## E.13 Economics

- Total pipeline wall time: ~35 seconds.
- Total artifact build time: ~10 seconds.
- Total candidates processed: 55 (37 primary + 16 simulator + 2 negative controls).

## E.14 CONTROL-03 (Proof-Break Control) — bounded observation, not Bend-wide claim

Per **ACT-MRVN-07-CORRECTION02**, the CORRECTION01 claim
`STRUCTURALLY IMPOSSIBLE IN BEND` was an overclaim.  The corrected
finding:

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

The previous "same WNF" argument conflated extensional and definitional
equality.  Bend's guide makes the distinction explicit (`{==}` needs
both sides to already compute to the same term; `add_zero` needs
induction).  Therefore the bounded observation does not imply a
Bend-wide theorem.

REF-MRVN07-CTRL-PBREAK (rename `authorize` → `do_authorize`) classifies
as `BEHAVIOR_EVIDENCE_MISMATCH` because **LAWS.bend references the
renamed symbol by name**, so the refactor simultaneously breaks the
LAWS.  This demonstrates **INTERFACE_BINDING_RENAME**, not a proof-shape
specimen.

The descriptive documentation for REF-MRVN07-CTRL-PBREAK remains in the
candidate's descriptor.json and result.json.

## E.15 Final Hashes (post-CORRECTION03)

- lab/metrics.json sha256: see lab/metrics.json
- lab/results.json sha256: see lab/results.json
- lab/candidates.json sha256: see lab/candidates.json
- lab/artifact_index.json sha256: see lab/artifact_index.json
- lab/agent_results.json sha256: see lab/agent_results.json
- lab/authority_attacks_result.json sha256: see lab/authority_attacks_result.json
- lab/regression_hygiene_result.json sha256: see lab/regression_hygiene_result.json
- 8 evidence/proof_transcripts/*.txt: see evidence/proof_transcripts/ (one sample per ROBUST family + CTRL-IDENT)

## E.16 CORRECTION03 — population + classification reconciliation

Per the formal-methods reviewer's hygiene note, `CORRECTION02.md`'s
"Population reconciliation (54 vs 57)" section used stale counts.
The experiment itself was always 55 (see `lab/metrics.json` and
REPORT.md §CORRECTION03).  CORRECTION03 reconciles to the canonical
55-count with five classification buckets:

```
ROBUST                       = 43   (29 primary + 14 simulator)
SEMANTIC_DRIFT               = 4    (CTRL-NEG, AGENT-003, NEG-001, NEG-002)
BEHAVIOR_EVIDENCE_MISMATCH   = 7    (D:1, F:2, H:3, CTRL-PBREAK:1)
AGENT_AUTHORITY_VIOLATION    = 1    (AGENT-MRVN07-013)
─────────────────────────────────
TOTAL                        = 55
```

`43 + 4 + 7 + 1 = 55`. ✓

`AGENT-MRVN07-013` is a deliberate law-edit attempt by the agent:
the agent's edit touches `LAWS.bend` itself, not the implementation.
The agent-authority guard in `lab/agent_refactor.ts` catches this
and labels it `AGENT_AUTHORITY_VIOLATION`.  It is neither a successful
refactor nor an implementation-level drift; it is its own bucket.

The earlier CORRECTION02 draft's "Canonical count: 54 artefacts" /
"2 SEMANTIC_DRIFT" section is preserved in `CORRECTION02.md` for
audit but is superseded by this appendix.  See `CORRECTION03.md`
for the full canonical table and rationale.

### E.16.1 Scope of CORRECTION03 (precise)

CORRECTION03 falls into two distinct categories; the reviewer's
disposition explicitly notes that "documentation repair and machinery
repair should not masquerade as one another":

**Documentation repair** (no behavioral change):
- `CORRECTION02.md` stale section rewritten
- `FREEZE.md` CORRECTION03 amendment appended
- `REPORT.md` (this section + §CORRECTION03 + classification table
  5th column + Q13/Q14 + Doctrine/Residual Risks + Board Transition)
- `EVIDENCE.md` (this appendix)

**Lab bookkeeping/orchestration** (bounded behavioral, end-to-end
consistent, no new exit conditions):
- `lab/agent_refactor.ts` — when the agent-authority guard catches
  a law-edit attempt, the pipeline now also pushes the candidate
  into `summary.candidates` and increments
  `summary.classifications["AGENT_AUTHORITY_VIOLATION"]`.
- `lab/run_all.ts` — orchestrator now includes `agent_refactor` and
  `metrics` as pipeline stages (stages 02 and 04) so a single
  `bun run_all.ts` invocation regenerates the canonical accounting.
- `lab/metrics.ts` — comment block updated; no behavior change to
  the metrics computation.

**Not changed** (preserved by CORRECTION03):
- Authority kernel (`candidates/REF-MRVN07-*` and `candidates/AGENT-MRVN07-*`)
- Classifier semantics (no new class, no re-mapping)
- Proof, law book, frozen toolchain closure
- 43/43 proof-survival result, 18/18 self-tests, 11/11 authority
  attacks, 0 drift, principal verdict

