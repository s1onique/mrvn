# ACT-MRVN-QUALIFY07 — Frozen identities (CORRECTION01)

The following identifiers are bound at the start of MRVN-07 and are
immutable for the duration of the primary experiment.  Any drift in
these values after a candidate is generated triggers
`AUTHORITY_FAILURE`.

## Source: MRVN-06 canonical authority kernel

The subject under test is the same finite MRVN-04/MRVN-06 authority
kernel.  We adopt its frozen authority unchanged.

```text
canonical_impl_sha256       = eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb
canonical_laws_sha256       = 0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8
canonical_proof_sha256      = c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8
law_count                   = 15
```

These are identical to the MRVN-06 FREEZE values; we copy them here
to make MRVN-07 self-contained.

## Frozen intent (independent authority)

```text
INTENT_TEXT_SHA256          = 1e21d2f56e2d587ef08499a0f58aac47960a6d5c5b4b899a39e972e92985d274
INTENT_ORACLE_SHA256        = a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9
INTENT_CELL_COUNT           = 180
```

## CORRECTION01 frozen invariants

Per ACT-MRVN-07-CORRECTION01, the following invariants are now mandatory
for the closure to remain PARTIAL_QUALIFICATION_WITH_STRONG_PROOF_SURVIVAL_RESULT:

```text
mandatory_artifact_gate     = true (no ROBUST without FULL artifact PASS)
simulator_label             = DETERMINISTIC_REFACTOR_SIMULATOR (NOT live ClineMM)
control_03_status           = NOT_CONSTRUCTED_FOR_THIS_EXHAUSTIVE_FINITE_PROOF
                              (CORRECTION02: see below)
family_reclassification     = D->REFACTOR_GENERATOR_FAILURE
                              F->LANGUAGE_WELL_FORMEDNESS_LIMIT
                              H->UNSUPPORTED_SYNTAX
e2e_authority_attacks       = toolchain_tamper, artifact_payload_tamper
authority_attack_count      = 11 (was 8)
self_test_count             = 18 (unchanged)
```

## CORRECTION02 amendment — bounded observation replaces Bend-wide claim

Per ACT-MRVN-07-CORRECTION02, the overclaim is **removed** and replaced with
the scientifically correct bounded wording:

```text
control_03_status            = NOT_CONSTRUCTED_FOR_THIS_EXHAUSTIVE_FINITE_PROOF
observed_property            = NO_EXTENSIONALLY_EQUIVALENT_PROOF_BREAK_FOUND
                               IN 43 TESTED SEMANTICS-PRESERVING REFACTORS

hypothesis                   = EXHAUSTIVE_FINITE_CASE_PROOFS_MAY_BE
                               CANONICAL-PROOF-INVARIANT_UNDER_TOTAL
                               SEMANTICS-PRESERVING_REFACTORING

proof_of_hypothesis          = NOT_ESTABLISHED

proposed_followup_act        = ACT-MRVN-08-PROOF_BREAK_SEARCH

ctrl_pbreak_classification   = INTERFACE_BINDING_RENAME
                               (NOT a proof-shape specimen;
                               refactor renaming a public symbol that LAWS
                               reference simultaneously breaks the LAWS)
```

Why the previous wording was overclaim: Bend's proof model distinguishes
**extensional** equality (same values for every input) from **definitional**
equality (reduces to the same term).  `{==}` closes the gap only when both
sides **already compute to the same term**; the canonical `add_zero` example
needs induction because symbolic equality is not yet definitional.  Therefore
"semantics-preserving ⇒ same WNF ⇒ same proof" is not a theorem about
arbitrary Bend programs.  What is observed is the bounded property for the
specific exhaustive-finite-case proof on this specific kernel.

The 43/43 result itself is preserved unchanged.  Only the framing is
corrected.

## CORRECTION03 amendment — population + classification reconciliation

Per ACT-MRVN-07-CORRECTION03, the population/classification accounting
in `CORRECTION02.md` is patched to the canonical 55-count, with an
additional `AGENT_AUTHORITY_VIOLATION` bucket.  The substantive
CORRECTION02 (Bend-wide overclaim removal, bounded wording,
`INTERFACE_BINDING_RENAME` for CTRL-PBREAK) is preserved unchanged.

### Scope of CORRECTION03 (precise)

CORRECTION03 is **bounded** and falls into two categories:

1. **Documentation repair** (no behavioural change):
   - `CORRECTION02.md` stale section rewritten
   - `FREEZE.md` (this amendment)
   - `REPORT.md` (`§CORRECTION03`, classification table 5th column,
     Q13/Q14, Doctrine/Residual Risks, Board Transition,
     reviewer-disposition table)
   - `EVIDENCE.md` (`§E.2`, `§E.15`, `§E.16`)

2. **Lab bookkeeping/orchestration** (bounded behavioural, end-to-end
   consistent, no new exit conditions):
   - `lab/agent_refactor.ts` — when the agent-authority guard catches
     a law-edit attempt, the pipeline now also pushes the candidate
     into `summary.candidates` and increments
     `summary.classifications["AGENT_AUTHORITY_VIOLATION"]`.
   - `lab/run_all.ts` — orchestrator now includes `agent_refactor`
     and `metrics` as pipeline stages (stages 02 and 04) so a single
     `bun run_all.ts` invocation regenerates the canonical
     population/classification accounting.
   - `lab/metrics.ts` — comment block updated; no behaviour change.

What is **NOT changed** (preserved by CORRECTION03):
- Authority kernel (`candidates/REF-MRVN07-*` and `candidates/AGENT-MRVN07-*`)
- Classifier semantics (no new class, no re-mapping)
- Proof, law book, frozen toolchain closure
- 43/43 proof-survival result, 18/18 self-tests, 11/11 authority
  attacks, 0 drift, principal verdict

```text
CORRECTION03 frozen invariants (additive on top of CORRECTION02):

population_total              = 55
  = 37 primary candidates
    (33 family refactors + 4 controls: CTRL-IDENT, CTRL-WS,
     CTRL-NEG, CTRL-PBREAK)
  + 16 simulator candidates (AGENT-MRVN07-001..016)
  + 2 negative controls (NEG-MRVN07-001, NEG-MRVN07-002)

classification_buckets:
  ROBUST                       = 43
    = 29 primary + 14 simulator
  SEMANTIC_DRIFT               = 4
    = 1 CTRL-NEG (primary)
    + 1 AGENT-MRVN07-003 (simulator, deliberate drift)
    + 2 NEG-MRVN07-001 / NEG-MRVN07-002 (negative controls)
  BEHAVIOR_EVIDENCE_MISMATCH   = 7
    = D:1 (REFACTOR_GENERATOR_FAILURE)
    + F:2 (LANGUAGE_WELL_FORMEDNESS_LIMIT)
    + H:3 (UNSUPPORTED_SYNTAX)
    + CTRL-PBREAK:1 (INTERFACE_BINDING_RENAME)
  AGENT_AUTHORITY_VIOLATION    = 1
    = AGENT-MRVN07-013 (law-edit attempt caught by agent-authority
      guard, classified as AGENT_AUTHORITY_VIOLATION; not a
      ROBUST / DRIFT / MISMATCH)

                                  ──
  total                          55
```

`43 + 4 + 7 + 1 = 55`.  The earlier CORRECTION02 draft's
"Canonical count: 54 artefacts" / "2 SEMANTIC_DRIFT" section is
preserved in `CORRECTION02.md` for audit but is superseded by this
amendment.

Why the 5th bucket exists: `AGENT-MRVN07-013` modifies `LAWS.bend`
(not the implementation).  The agent-authority guard catches this
and labels it `AGENT_AUTHORITY_VIOLATION`; it is neither a successful
refactor nor an implementation-level drift.  Counting it under any
of the other four buckets would be misleading.

## Baseline 180/180

```text
CANONICAL_BEND_CELLS        = 180
INTENT_ORACLE_CELLS         = 180
BASELINE_DIFF_COUNT         = 0
```

The canonical Bend implementation agrees with the intent oracle at
all 180 cells.  Re-verified by `lab/canonical_compare.ts` on every
run.

## Frozen toolchain closure

```text
bend2/main.ts    = 34a8a791b02ce92f247bda4cabcd3ff4eabe500002fedbec4867b5db77ee1feb   (cli)
bend2/bend.ts    = fe3c2b0b306fccbe44efec349d8f339b6efdaceb090b3d3049c74a1a6015c859   (trusted_kernel)
bend2/comp.ts    = c181ac038d7f7d4ed0e1bb81c513e64285347627e0b3a13a98cb86a1d1568f54   (compiler_runtime)
bend2/base.bend  = b2d53bbd83639c3ae27260b318efa09de9df6006a556ac6ef41c104ea164917a   (prelude)
```

Every authoritative MRVN-07 candidate artifact MUST verify against
this exact toolchain closure.  No `--allow-toolchain-drift` is
permitted anywhere in the pipeline.

## Discipline

* Every candidate must use `LAWS.bend` whose sha256 equals
  `canonical_laws_sha256`.  Drift → `DIFFERENT_SPECIFICATION`.
* Every candidate's intent comparison must use `intent/oracle.json`
  whose sha256 equals `INTENT_ORACLE_SHA256`.  Drift →
  `BEHAVIOR_EVIDENCE_MISMATCH`.
* Every candidate's behavior is generated by executing Bend, not by
  hand-written mirror code.  Drift →
  `BEHAVIOR_EVIDENCE_MISMATCH`.
* Canonical `PROOF.bend` (sha256 = `canonical_proof_sha256`) is run
  byte-identical.  If it fails, REPROOF.bend may be authored (up to
  `MAX_REPROOF_ATTEMPTS = 3`).
* Toolchain closure is byte-for-byte bound; drift → `TOOLCHAIN_MISMATCH`.

## Evidence package map

* `EVIDENCE.md` and `REPORT.md` are the human-facing summaries.
* `lab/results.json` is the authoritative machine record of every
  candidate's classification.
* `evidence/` is the durable evidence trail (proof transcripts,
  classifier runs, authority-attack results, regression hygiene).
