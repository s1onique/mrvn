# MRVN-09 — Independent-agent adversarial replication

You are an independent LLM agent (model `MiniMax-M3`) performing an
adversarial replication of an earlier MRVN-08 proof-break search on
the MRVN-04/06/07 finite authority kernel.

## Frozen authority

You are given FOUR files plus this INSTRUCTIONS plus a Bend guide
summary plus a frozen intent text.  The four files are byte-identical
to the canonical MRVN-04/06/07/08 baseline:

* `main.bend`   — the canonical implementation.
* `LAWS.bend`   — the immutable specification.  You MUST NOT modify it.
* `PROOF.bend`  — the canonical proof.  You will run it byte-identical
                  against any candidate you generate.
* `oracle.json` — the 180-cell semantic oracle.  Every candidate must
                  agree with it on all 180 inputs.

The exact intent text is in `INTENT.md`; the summary of the
proof-relevant parts of the Bend guide is in `guide_index.md`.

You MUST NOT modify:

* `LAWS.bend` (different specification → not eligible)
* `bend2/main.ts`, `bend2/bend.ts`, `bend2/comp.ts`, `bend2/base.bend`
* the canonical PROOF until you have run it and discovered a genuine
  failure (then you may author a REPROOF.bend, but the canonical
  PROOF remains in the candidate directory unchanged).

You MUST NOT introduce any of: `?TODO`, `?name` final-proof stubs,
`@unsafe`, foreign imports, checker patches, toolchain patches.

## Goal

Construct a new `main.bend` (in a candidate directory) that:

1. preserves byte-identical `LAWS.bend`,
2. matches the frozen oracle on all 180 input cells,
3. remains valid stock Bend (parses, type-checks, affine-checks),
4. changes implementation/reduction structure enough that the
   canonical `PROOF.bend` may fail for a genuine proof/definitional
   reason.

If the canonical proof fails on your candidate, you may attempt
`REPROOF.bend` using stock Bend mechanisms (`match`, induction, `%e`
rewrite, `Equal.sym`, `Equal.trans`, `Equal.cong`, helper lemmas,
`Empty` elimination).  The micro-lab pattern
`%f_zero(p) : {f(p) == _ : Nat} {==}` is one such stock Bend
discharge technique, but you should derive whatever your candidate
requires; do not copy prior recipes.

If the canonical proof survives, your candidate simply classifies as
`CANONICAL_PROOF_SURVIVED`.  That is the most common outcome and is
not a failure on your part.

## Diversity

You are asked to be **diverse**.  Avoid merely renaming public
symbols, changing match-case order trivially, or re-shuffling the
same overall reduction shape.  Consider:

* different match-tree orderings (lifecycle-outer vs. evidence-outer
  vs. capability-outer)
* intermediate decision helpers / dispatch helpers
* recursive encodings (e.g. foldl / fold over the surface)
* identity transformations (`identity : Decision -> Decision`)
* different elimination orders
* derived boolean predicates that pre-classify inputs
* equivalence lemmas stated as local `def`s
* tables / projections
* propositional wrappers
* capability-keyed first / actor-keyed first / evidence-keyed first
* use of `Maybe`-style `Deny{reason}` for everything (returning
  `Deny{Some}` vs. `Deny{None}` mapped to `Allow` vs. `Deny{r}`)
* direct single-comprehensive match returning Decision
* nested helpers that mirror the surface in different ways

The above is a **non-exhaustive** set.  Invent your own strategies;
do not copy the ones in MRVN-08 (which you have NOT seen).

## What you produce

For each attempt, create a directory:

```
independent/IND-MRVN09-NNN/
  PROMPT.md          # the actual prompt that produced this attempt
  TRANSCRIPT.md      # or transcript reference
  descriptor.json    # ONLY observed construction facts
  main.bend          # your candidate
  LAWS.bend          # byte-identical to canonical
  PROOF.bend         # byte-identical to canonical
  REPROOF.bend       # only when canonical PROOF failed AND you attempted reproof
  behavior.json      # the 180-cell dump + diff_count
  result.json        # classification
  artifact/          # MRVN-05 portable artifact payload
```

`descriptor.json` MUST contain only:

```json
{
  "candidate_id": "IND-MRVN09-NNN",
  "agent_instance": "MiniMax-M3",
  "agent_model": "MiniMax-M3",
  "attempt": N,
  "description": "...",
  "files_created": ["main.bend", ...]
}
```

It MUST NOT contain `expected_classification` or
`expected_proof_result`.  This is a real search, not a labelled
fixture.

## Number of attempts

Produce AT LEAST 12 distinct attempts.  Construction failures
(parse, type, affine, or semantics drift) STILL count as attempts
but do not satisfy the valid-candidate minimum; record them as
`construction_failure.json` and move on.

## Independence rule

You MUST NOT inspect prior MRVN-08 candidate implementations,
descriptors, transformation recipes, or commentary.  If you are
given any such content in your input bundle, refuse it and report
the contamination in `INDEPENDENCE_VIOLATION.md`.  The bundle you
have here contains only the five frozen files above plus this
INSTRUCTIONS plus the guide summary plus the intent text.

## Start

Begin by reading:

1. `INTENT.md` (the natural-language specification)
2. `oracle.json` (the 180-row table form)
3. `main.bend` (the canonical implementation)
4. `LAWS.bend` (the laws you must keep satisfied)
5. `PROOF.bend` (the proof you will run byte-identical)
6. `guide_index.md` (Bend proof-relevant guide summary)

Then design your first independent strategy and create
`independent/IND-MRVN09-001/main.bend`.