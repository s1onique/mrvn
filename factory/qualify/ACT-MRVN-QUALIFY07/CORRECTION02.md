# ACT-MRVN-07-CORRECTION02 — Bounded observation, not Bend-wide theorem

## Reviewer concern (verbatim, distilled)

> The claim `CONTROL_03_STATUS = STRUCTURALLY_IMPOSSIBLE_IN_BEND` is substantially
> too strong.  It conflates two distinct equalities:
>
> ```
> EXTENSIONAL (same values for every input)
> ≠
> DEFINITIONAL (reduces to the same term)
> ```
>
> Bend's guide makes the distinction explicitly: a `{==}` proof often needs
> induction or rewriting precisely because propositionally equal terms need
> not already be definitionally equal.
>
> Therefore "any semantics-preserving refactor produces the same WNF" is not
> established by 43 successful examples.

## What we actually have

For the **specific MRVN-04 finite kernel + the specific canonical proof**:

```
finite input domain (10⁵ × 6 = 600 closed actor × decision pairs)
total pure decision function
exhaustive constructor-splitting proof (PROOF.bend reduces every symbolic
  input to a closed constructor combination, then closes leaves with {==})

29 successfully constructed semantics-preserving refactors (primary)
14 successfully constructed semantics-preserving refactors (simulator)
─────────────────────────────────────────────────────────────────
43 semantics-preserving refactors
→ 43 / 43 = 100 % canonical-proof survival
```

This is a strong **empirical observation**, not a theorem about Bend.

## What we do NOT have

We do **not** have:

1. A `extensional-equivalent-and-propositionally-equal` refactor that
   nonetheless **breaks definitional equality** before the canonical proof
   adds induction/rewriting.  No such candidate was constructed.
2. Proof that no such candidate exists for this kernel.
3. Any claim about programs that use inductive propositions, rewriting,
   recursion schemes, helper lemmas whose identities depend on lemmas, etc.

## Corrected status

The previous (overclaim) text:

```
CONTROL_03_STATUS = STRUCTURALLY_IMPOSSIBLE_IN_BEND
```

is replaced by the bounded, scientifically correct text:

```
CONTROL_03_STATUS                = NOT_CONSTRUCTED_FOR_THIS_EXHAUSTIVE_FINITE_PROOF
OBSERVED_PROPERTY                = NO_EXTENSIONALLY_EQUIVALENT_PROOF_BREAK_FOUND
                                   IN 43 TESTED SEMANTICS-PRESERVING REFACTORS

HYPOTHESIS                       = EXHAUSTIVE_FINITE_CASE_PROOFS_MAY_BE
                                   CANONICAL-PROOF-INVARIANT_UNDER_TOTAL
                                   SEMANTICS-PRESERVING_REFACTORING

PROOF_OF_HYPOTHESIS              = NOT_ESTABLISHED

PROPOSED_FOLLOWUP_ACT            = ACT-MRVN-08-PROOF_BREAK_SEARCH
   - constructive search for propositionally-but-not-definitionally-equal
     refactors on this kernel
   - targets: identity-like reconstruction, double transformations,
     alternative recursive definitions, different elimination order,
     helper whose identity requires a lemma
   - success criterion: same frozen LAWS, 180/180 same closed behavior,
     canonical PROOF fails, new REPROOF passes
```

This is the **scientifically honest** wording.  The 43/43 result is preserved
unchanged; the overclaim is removed.

## CTRL-PBREAK reclassification

`REF-MRVN07-CTRL-PBREAK` (the rename `authorize` → `do_authorize` control) does
not demonstrate CONTROL-03.  It demonstrates **interface/spec binding**: the
LAWS reference the symbol by name, so renaming it simultaneously breaks the
LAWS.  Its classification `BEHAVIOR_EVIDENCE_MISMATCH` (mismatch_taxonomy:
`PROOF_BREAK_STRUCTURAL_IMPOSSIBILITY`) is therefore renamed to:

```
REF-MRVN07-CTRL-PBREAK mismatch_taxonomy =
  INTERFACE_BINDING_RENAME — not a proof-shape specimen
```

## Population reconciliation (CORRECTION02 draft, superseded by CORRECTION03)

> **CORRECTION03 notice:**  The numbers below (54, 36, 2 SEMANTIC_DRIFT)
> are stale.  See `CORRECTION03.md` for the canonical 55-count,
> 4 SEMANTIC_DRIFT + 1 AGENT_AUTHORITY_VIOLATION breakdown.
> This section is preserved verbatim here for audit; the
> experiment itself was always 55 (see `lab/metrics.json` and
> REPORT.md §Q1–Q16).

Reviewer noted the digest counts 57 while closure says 54.  The correct count:

| Corpus | Count |
|---|---|
| Primary candidates (auto + control) | 36 |
| Negative controls (NEG-MRVN07-001, -002) | 2 |
| Simulator candidates (AGENT-MRVN07-001..016) | 16 |
| Total artefacts classified | 54 |
| CTR-PBREAK + CTRL-IDENT + CTRL-WS + CTRL-NEG are all in "Primary" → no double-count |
| 43 ROBUST = 29 primary + 14 simulator |
| 7 BEHAVIOR_EVIDENCE_MISMATCH = D:1 + F:2 + H:3 + CTRL-PBREAK:1 |
| 1 + 1 = 2 SEMANTIC_DRIFT (1 CTRL-NEG primary + 1 AGENT-MRVN07-003 simulator) |

The 57 in some digest text was a miscount.  **Canonical count: 54 artefacts.**

**CORRECTION03 corrects this to 55 (37 + 16 + 2), with 4 SEMANTIC_DRIFT
(CTRL-NEG, AGENT-003, NEG-MRVN07-001, NEG-MRVN07-002) and
1 AGENT_AUTHORITY_VIOLATION (AGENT-MRVN07-013, law-edit caught by the
agent-authority guard).**  See `CORRECTION03.md` for the canonical table.

## What remains PARTIAL

The verdict `PARTIAL_QUALIFICATION_WITH_STRONG_PROOF_SURVIVAL_RESULT` is
preserved.  The qualifier changes from "structural-impossibility finding" to
"bounded-observation-with-hypothesis":

```
MRVN-07 PARTIAL = PARTIAL_QUALIFICATION_WITH_STRONG_PROOF_SURVIVAL_RESULT
WHERE  PARTIAL means:
       (a) CONTROL-03 specimen not constructed for this kernel
       (b) simulator is deterministic, not live ClineMM
       (c) Bend-wide impossibility claim REMOVED (CORRECTION02)
       WHERE  STRONG_PROOF_SURVIVAL_RESULT means:
       29/29 primary ROBUST, 14/14 simulator ROBUST,
       0 LOC proof churn, 0 amplification, full portable artefacts.
```

## Authority handling (no repo authority claimed)

Per the reviewer note that this digest's repo is dirty and the ACT07 tree is
untracked: this ACT is **a lab directory**, not a repo commit.  No repo
authority is asserted.  FREEZE.md binds only this ACT's evidence.
