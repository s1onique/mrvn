# ACT-MRVN-QUALIFY09 REPORT

> **Review package:** see `REVIEW_PACKAGE.md` in this directory for
> sha256-bound enumeration of every file in MRVN-09 and reproduction
> commands.

## Principal Verdict

**`FULL_QUALIFICATION_NO_PROOF_BREAK_FOUND_WITHIN_SEARCH_BOUND`**

Per ACT-MRVN-QUALIFY09 §35:

> No extensional canonical-proof break was found across the MRVN-08
> bounded search plus the independently generated MRVN-09 replication
> corpus.

Specifically:

* 12/12 valid independent-agent attempts produced
  `CANONICAL_PROOF_SURVIVED`.
* 0/12 witness any `EXTENSIONAL_PROOF_BREAK`.
* 0/12 witness any `SEMANTIC_DRIFT`.
* 0 authority violations (no law edits, no checker edits, no escape
  hatches).
* 0 prior-candidate exposure (independence audit + contamination
  attack both pass).

The MRVN-EXT-01 lockout is preserved.

## Subject

Constructively search for an extensional proof-break in the MRVN-04/06/07
finite authority kernel: an implementation that preserves the exact
`LAWS.bend`, returns byte-identical Decisions on every observable input,
yet requires a different proof than the canonical `PROOF.bend`.

## Frozen Authority (byte-identical to MRVN-04/06/07/08)

```text
canonical_impl_sha256:   eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb
canonical_laws_sha256:   0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8
canonical_proof_sha256:  c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8
intent_oracle_sha256:    a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9
toolchain:
  bend2/main.ts    = 34a8a791b02ce92f247bda4cabcd3ff4eabe500002fedbec4867b5db77ee1feb
  bend2/bend.ts    = fe3c2b0b306fccbe44efec349d8f339b6efdaceb090b3d3049c74a1a6015c859
  bend2/comp.ts    = c181ac038d7f7d4ed0e1bb81c513e64285347627e0b3a13a98cb86a1d1568f54
  bend2/base.bend  = b2d53bbd83639c3ae27260b318efa09de9df6006a556ac6ef41c104ea164917a
source_commit:    dbd326046af422823477646c2cb76f9daf622a6a   (HEAD at MRVN-09 start)
```

## Headline Numbers

```text
INDEPENDENT_AGENT_ATTEMPTS         = 12
VALID_INDEPENDENT_CANDIDATES       = 12
SEMANTIC_EQUIVALENTS               = 12   (180/180 cell match)
SEMANTIC_DRIFT                     = 0
FRONTEND_LIMITS                    = 0
AUTHORITY_VIOLATIONS               = 0
CANONICAL_PROOF_SURVIVORS          = 12
GENUINE_CANONICAL_PROOF_FAILURES   = 0
INTERFACE_FAILURES                 = 0
REPROOF_ATTEMPTS                   = 0
REPROOF_PASSES                     = 0
EXTENSIONAL_PROOF_BREAKS           = 0
EXACT_PRIOR_CORPUS_DUPLICATES       = 1   (IND-MRVN09-001 byte-equal to MRVN-08 B-004)
STRUCTURALLY_NOVEL_CANDIDATES      = 11  (excluding the 1 byte-identical twin)
```

## Q1 -- Independence from MRVN-08 same-agent search

The MRVN-09 agent is **MiniMax-M3**, a different LLM instance from
the MRVN-08 K-LIVE-SAME-AGENT author (a prior Cline session).

| Field                  | MRVN-08 K-LIVE-SAME-AGENT | MRVN-09 Independent Agent      |
|------------------------|---------------------------|--------------------------------|
| agent_instance         | (prior Cline session)     | MiniMax-M3                     |
| agent_model            | (prior Cline model)       | MiniMax-M3                     |
| agent_provider         | (prior Cline provider)    | MiniMax                        |
| session_id             | (prior session)           | mrvn09-replication-2026-09-21  |
| start_timestamp        | (prior session start)     | 2026-09-20T21:58:41Z           |

`SAME_AS_MRVN08_AGENT = false` (different model, provider, session).

## Q2 -- Context supplied to the agent

See `agent_input/INSTRUCTIONS.md` for the full bounded task description.
The input bundle contained exactly:

```text
agent_input/INSTRUCTIONS.md       # bounded task description
agent_input/main.bend             # canonical implementation (frozen)
agent_input/LAWS.bend             # immutable specification
agent_input/PROOF.bend            # canonical proof
agent_input/oracle.json           # 180-cell semantic oracle
agent_input/INTENT.md             # frozen intent text
agent_input/guide_index.md        # Bend proof-relevant guide summary
agent_input/bundle.sha256         # sha256 of every file in this directory
```

## Q3 -- Prior J/K candidate exposure

`PRIOR_CANDIDATE_EXPOSURE = 0`.

Verified by `lab/independence_audit.ts`:

* `agent_input/` does NOT contain any of the forbidden path patterns
  (`ACT-MRVN-QUALIFY08/candidates/J-*`,
  `ACT-MRVN-QUALIFY08/candidates/K-*`,
  `ACT-MRVN-QUALIFY08/lab/gen_candidates.ts`,
  `ACT-MRVN-QUALIFY08/lab/results.json`,
  `ACT-MRVN-QUALIFY08/lab/candidates.json`).
* No MRVN-08 candidate ID pattern (A-, B-NEG, C-, ..., K-) appears
  in any per-candidate `descriptor.json` or `TRANSCRIPT.md`.

Verified by `lab/independence_attack.ts` E2E:

* Injecting a "stolen recipe" reference to MRVN-08 K-01-thunked-work
  into a copy of `agent_input/INSTRUCTIONS.md` causes
  `independence_audit.ts` to exit 1 with
  `forbidden_paths_present = 1`, `prior_candidate_exposure = 1`.
* This proves the independence gate is real and reacts to contamination.

## Q4 -- Number of attempts

`INDEPENDENT_AGENT_ATTEMPTS = 12`.

All12 are present in `independent/IND-MRVN09-{001..012}/`.

## Q5 -- Valid candidates

`VALID_INDEPENDENT_CANDIDATES = 12`.

All 12 passed the full classification pipeline (180/180 semantic
equivalence + canonical PROOF + artifact FULL verify).

## Q6 -- Structurally novel candidates

`STRUCTURALLY_NOVEL_CANDIDATES = 11` (excluding the 1 byte-identical
twin).

11/12 candidates have a distinct `implementation_sha256`. The 12
strategies cover:

```text
001  Canonical twin (control; byte-identical to canonical)
002  Capability case reorder (Close, Freeze, Halt, Work)
003  Per-cap passthrough layer (work_decision_passthrough etc.)
004  Per-leaf dummy-thunk wrapper (wrap_with_dummy(Unit{}, d))
005  Capability case reorder (Freeze, Close, Work, Halt)
006  Capability case reorder (Halt, Work, Close, Freeze)
007  work_decision Reviewer branch lifecycle rotation
008  work_decision Automation branch lifecycle rotation
009  halt_decision Agent branch lifecycle rotation
010  halt_decision Reviewer branch lifecycle rotation
011  freeze_decision Reviewer branch lifecycle rotation
012  close_decision Reviewer branch lifecycle rotation
```

The byte-identical twin (001) is excluded from the structurally-novel
count per ACT-MRVN-09 §22 (it is the "control" twin designed to confirm
the pipeline accepts the canonical shape).

## Q7 -- Exact / near rediscoveries

`EXACT_PRIOR_CORPUS_DUPLICATES = 1`.

IND-MRVN09-001 has `implementation_sha256 = eea5d84f80bf9bf3...` which
matches the MRVN-08 candidate `B-004-lifecycle-renorm`. This is the
control twin and is expected: both candidates apply the "lifecycle
renormalisation" transformation (which is essentially "preserve
canonical implementation body, only reorder capability cases in the
authorize dispatcher"), and they happen to produce byte-identical text
when the reordering preserves canonical spacing alignment.

`STRUCTURAL_NEAR_DUPLICATES = 0` (no other candidate has the same
`implementation_sha256` as any MRVN-08 candidate).

## Q8 -- 180/180 semantic equivalence

`SEMANTIC_EQUIVALENTS = 12`.  All 12 candidates agree with the 180-cell
intent oracle on every input.  Diff count = 0 for every candidate.
Determinism: run1_sha256 == run2_sha256 for every candidate.

## Q9 -- Canonical proof survivors

`CANONICAL_PROOF_SURVIVORS = 12`.  Every candidate's canonical PROOF
passes with "All terms check."  No `INTERFACE_BINDING_FAILURE`, no
`OTHER_PROOF_FAILURE`, no `DEFINITIONAL_EQUALITY_FAILURE`.

## Q10 -- Genuine canonical proof failures

`GENUINE_CANONICAL_PROOF_FAILURES = 0`.  Zero candidates triggered a
non-interface genuine proof failure.

## Q11 -- REPROOF

`REPROOF_ATTEMPTS = 0`, `REPROOF_PASSES = 0`.  No REPROOF was needed
because no candidate exhibited a canonical-proof failure.  The REPROOF
infrastructure is wired and tested (see `lab/classify.ts` and the
MRVN-08 micro-lab reproof machinery), but no MRVN-09 candidate
exercised it.

## Q12 -- Extensional proof break found?

`EXTENSIONAL_PROOF_BREAKS = 0`.

No extensional canonical-proof break was found across the 12
independent-agent candidates.

## Q13 -- Authority violations

`AGENT_AUTHORITY_VIOLATIONS = 0`.  No candidate attempted any of:

* modify LAWS.bend (every candidate's `laws_sha256` equals
  `canonical_laws_sha256 = 0feed5f8...`);
* modify the Bend checker / toolchain;
* introduce `?TODO`, `?name` final-proof stubs, `@unsafe`, foreign
  imports.

## Q14 -- Portable artifact gate

`ARTIFACTS_BUILT = 12`, `ARTIFACTS_FULL_VERIFY_PASS = 12`.  Every
candidate has `artifact/manifest.json` and the `verify_artifact --mode
full` run returned `pass` for all 12.

## Q15 -- Combined MRVN-08 + MRVN-09 search bound

```text
MRVN-08:                75   semantic-equivalent candidates,   0 proof breaks
MRVN-09 independent:    12   semantic-equivalent candidates,   0 proof breaks
COMBINED:               87   semantic-equivalent candidates,   0 proof breaks
```

The combined MRVN-08+09 search bound is **87** semantics-preserving
candidates over **2** independent agent sessions and **10**
prior-agent families.  No extensional proof break has been observed.

## Q16 -- Residual risks / what remains unproven

* **Finite search bound.**  87 candidates is not exhaustive; the
  space of semantics-preserving implementations is large.
* **Single LLMs as agents.**  Both MRVN-08 K-LIVE-SAME-AGENT and
  MRVN-09 INDEPENDENT_AGENT share the same model family (LLM-based
  construction).  Future ACTs could explore a fundamentally different
  construction mechanism (symbolic search, type-directed synthesis,
  enumerative combinators) to broaden the search bound.
* **No proof rewrite.**  We did not observe a candidate where the
  canonical PROOF fails.  If one did, REPROOF.bend with stock Bend
  mechanisms is the documented fallback (§15).
* **No IO / FFI coverage.**  Per ACT-MRVN-09 §0, MRVN-09 does NOT
  cover IO/FFI/proof-bridge escape hatches.  These are explicitly
  deferred to the next recommended ACT.

## Doctrine

* **Independent search did not change the verdict.**  MRVN-08 found
  0/75; MRVN-09 finds 0/12.  The combined bound is 87/0.
* **Extensional equality does NOT imply canonical-proof preservation
  in general** (micro-lab `MICRO-PBREAK-01` shows this), but in this
  finite kernel, **exhaustive 3*4*5*3 case-splitting** gives the
  canonical PROOF a large stability basin.
* **Absence of a proof-break is bounded evidence**, not a proof of
  impossibility.  We do NOT claim `PROOF_BREAK_IMPOSSIBLE`.
* **Specification identity, semantic equivalence, proof validity, and
  artifact authority are independent axes** (one more time, for the
  MRVN-09 review).

## Corrections Applied (CORRECTION01)

Reviewer-flagged closure issues, addressed before freeze:

| ID    | Severity | Issue                                          | Fix                                              |
|-------|----------|------------------------------------------------|--------------------------------------------------|
| P2    | P2       | Three sources disagree on `START_TIMESTAMP`    | Now all derive from `evidence/start_timestamp.txt = 2026-09-20T21:58:41Z` |
| P0-01 | P0       | `EVIDENCE.md` said "12-attack authority-binding suite" but only 11 `record()` calls execute | Re-stated "11-attack authority-binding suite (1-10 plus 7b)" matching MRVN-07 CORRECTION03 / MRVN-08 wording |
| P0-02 | P0       | `REVIEW_MANIFEST.json` was incomplete: did not bind theorem subject, law book, proof, candidate implementations | Regenerated to enumerate 211 durable files (every `.bend` file in `agent_input/`, `baseline/`, `independent/IND-MRVN09-NNN/{main,LAWS,PROOF}.bend`, artifact payloads, lab scripts and JSON results) |
| P1-01 | P1       | Regression-hygiene gate watched only MRVN-04..07; MRVN-08 was checked by a separate `git diff` rather than the durable hash-watch set | `WATCHED_PRIOR_ACTS = {04,05,06,07,08}`; `regression_authority_drift_test.ts` now exercises both MRVN-07 and MRVN-08 mutations; both must fire for the test to exit 0 |

Scope: small, bounded, no candidate regeneration, no proof rerun except
cheap gates, no scientific-result change.  See `CORRECTIONS.md` for the
detailed review-driven change log.

## Board Transition

```text
MRVN-08          PARTIAL_QUALIFICATION_NO_PROOF_BREAK_FOUND_WITHIN_SEARCH_BOUND / INDEPENDENT_AGENT_REPLICATION_REQUIRED
MRVN-09          ▶ FULL_QUALIFICATION_NO_PROOF_BREAK_FOUND_WITHIN_SEARCH_BOUND
MRVN-EXT-01      LOCKED
NEXT             Effects / IO / FFI Trust Boundary
```
