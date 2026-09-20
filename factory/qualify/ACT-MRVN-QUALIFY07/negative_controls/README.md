# ACT-MRVN-QUALIFY07 — Negative controls

The single negative semantic control is:

```text
candidates/REF-MRVN07-CTRL-NEG/
```

It is a copy of the canonical authority kernel with one deliberate semantic
edit: at the close_decision Reviewer arm Frozen branch Replay evidence, the
deny reason is changed from `Deny{InsufficientEvidence}` to
`Deny{Terminal}`.  This is exactly the same edit used by the MRVN-06
negative controls, deliberately out-of-spec for the law book.

Expected classification: `SEMANTIC_DRIFT` (1 cell off from intent oracle).

The control is included in `lab/results.json` under family `NEGATIVE_SEMANTIC`
and is **excluded** from the proof-robustness denominator.

These negative controls exist solely to prove the equivalence gate
detects semantic drift.  They are NOT a robustness population.
