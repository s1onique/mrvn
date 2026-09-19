# ACT-MRVN-QUALIFY03 REPORT

Principal verdict for ACT-MRVN-QUALIFY03: the verified lifecycle
state machine kernel over 5 states and 5 events.

## TL;DR

```
ACT-MRVN-QUALIFY03 lifecycle-kernel: FULL_QUALIFICATION  (Outcome A)
```

All 8 mandatory laws plus 3 essential replay extensions discharge.
PROOF.bend exits 0 with "All terms check.". 8 mutations caught,
1 spec-gap probe passes, MRVN-01 regression passes.

## Board status

```
MRVN-01      🟢 FULL_QUALIFICATION
MRVN-02      🟢 FULL_QUALIFICATION
MRVN-03      🟢 FULL_QUALIFICATION / TECHNICALLY FROZEN
MRVN-EXT-01  🔒 LOCKED

MRVN-04      ▶ AUTHORIZED   (Verified authority kernel +
                             mutation semantics classification)
```

### Final technical disposition (post-review)

```
MRVN-03 = FULL_QUALIFICATION / TECHNICALLY FROZEN

LAW_COUNT                  = 13
LAW_DISCHARGE              = 13/13
TODO_COUNT                 = 0
MUTATIONS_REJECTED         = 8/8
REPLAY_INVARIANTS          = PROVED
CLOSE_ACCEPTANCE_AUTHORITY = EXPLICITLY_PROVED
MRVN-EXT-01                = LOCKED
MRVN-04                    = AUTHORIZED
```

The digest supports the whole package: 13/13 proofs, 8/8
mutation catches, unchanged implementation, and explicit
acceptance authority.  See EVIDENCE.md §E.12 (CORRECTION01) and
§E.14 (formal-methods refinement + 2×2 mutation doctrine).

## Outcome classification

| Outcome | Verdict | Trigger |
| ------- | ------- | ------- |
| A       | FULL_QUALIFICATION | All 8 mandatory laws discharge cleanly. **THIS ACT.** |
| B       | PROOF_ERGONOMICS_LIMIT | Laws discharge but require unreasonable proof contortions (>10 lemmas, >5 micro-defs). |
| C       | NORMALIZATION_CAPABILITY_GAP | Toolkit can't expose needed definitional equality. Justifies MRVN-EXT-01. |

ACT03's outcome is A: 13 laws discharge cleanly with 2 micro-defs
and 9 helper predicates, all on the existing Bend 2.0.5 toolkit.

(After expert review, ACT-MRVN-QUALIFY03-CORRECTION01 strengthened
LAW-004 to LAW-004b with explicit acceptance-authority laws
`close_accepted_from_frozen` and `close_rejected_from_non_frozen`.
The reviewer's canonical counterexample (MUT-MRVN03-08) is caught
both by the original 11-law spec -- via structural pattern-match
on the Transition constructor in `rejection_preserves_state` --
and by the strengthened 13-law spec -- via direct semantic
error from `close_rejected_from_non_frozen`.  See EVIDENCE.md §E.12.)

### Formal-methods nuance (post-review refinement)

The expert reviewer accepted the strengthened spec but flagged
an important **proof-vs-law distinction** that the original
mutation-log framing under-emphasised. The earlier language
("MUT-08 caught by rejection_preserves_state") was correct as
far as it went, but understated two separate facts:

```text
PROPOSITION_AUTHORITY     what LAWS.bend logically requires

PROOF_SHAPE_COUPLING      what the current PROOF.bend assumes
                          about implementation reduction
```

Against the original 11-law spec, MUT-08 (Draft+Close ->
Accepted{Draft}) made the premise `step(Draft,Close) == Rejected{r}`
**uninhabited**, so the proposition `LAW-001` was satisfied
**vacuously**. What the original proof term actually exposed
was that its concrete body no longer type-checked -- a
proof-shape coupling failure, not a proposition-authority
failure.

```text
ORIGINAL 11-LAW SPEC on MUT-08:
  LAW-001 proposition :   vacuously true
  LAW-001 proof term  :   fails to type-check (constructor mismatch)

STRENGTHENED 13-LAW SPEC on MUT-08:
  LAW-004b proposition:   directly asserts the negation
  LAW-004b proof term :   discharges the proposition
```

After CORRECTION01 both *proposition* and *proof term* reject
MUT-08 with a direct, semantically meaningful error
(`close_rejected_from_non_frozen` returns the explicit
`is_accepted(...) == False` claim, not a structural mismatch).
This is a much healthier state and is the basis for the new
MRVN-04 doctrine described below.

#### Doctrine candidate (forwarded to MRVN-04)

A naive mutation harness reports `mutation rejected ✅` whenever
the proof fails to type-check. This conflates two genuinely
distinct outcomes. Once the laboratory output becomes
first-class machinery we need the complete 2×2 matrix:

```text
                       proposition accepts mutant?
                          yes            no
                +-----------------+-----------------+
   proof    yes |    SURVIVED     |  SPEC_REJECTED  |
   term         +-----------------+-----------------+
   accepts  no  | PROOF_TERM_     |     BOTH        |
   mutant?       | INVALIDATED     |                 |
                +-----------------+-----------------+
```

The four classes are:

```text
SURVIVED               proposition accepts AND existing proof term
                       type-checks. The mutant is genuinely compliant
                       with both LAWS.bend and PROOF.bend.

SPEC_REJECTED          proposition forbids the mutation. No proof
                       term for the mutated implementation can
                       satisfy the unchanged proposition.

PROOF_TERM_INVALIDATED proposition still holds (often vacuously),
                       but the existing proof body no longer
                       type-checks against the mutated
                       implementation. The proposition could
                       in principle still be proved for the
                       mutant, but the current PROOF.bend
                       doesn't apply.

BOTH                   Both axes reject the mutation. This is
                       the strongest, most self-documenting
                       outcome.
```

MUT-08's behaviour under the original 11-law spec was
`PROOF_TERM_INVALIDATED`; under the strengthened 13-law spec it
became `BOTH`. All seven other mutations are `BOTH` against
both specs. MRVN-04 should make this 2×2 classification
explicit in the laboratory output so that mutation reports
state **what authority rejected the mutant**, not merely that
some verification command failed.

This is the doctrine the reviewer identified as the "more
interesting Factory lesson" from MRVN-03.

See EVIDENCE.md §E.14.

## Q1. What is the kernel shape?

Pure state machine with 5 states, 5 events, and 25-arm step:

```bend
type State is Data:
  State.Draft{} State.Active{} State.Halted{}
  State.Frozen{} State.Closed{}

type LcEvent is Data:
  LcEvent.Activate{} LcEvent.Halt{} LcEvent.Resume{}
  LcEvent.Freeze{} LcEvent.Close{}

type Transition is Data:
  Transition.Accepted{next: State}
  Transition.Rejected{state: State}

def step(s: State, e: LcEvent) -> Transition:
  match s:
    case State.Draft{}:  # 5 inner arms
      match e:
        case LcEvent.Activate{}: Transition.Accepted{State.Active{}}
        case LcEvent.Halt{}:     Transition.Rejected{State.Draft{}}
        case LcEvent.Resume{}:   Transition.Rejected{State.Draft{}}
        case LcEvent.Freeze{}:   Transition.Accepted{State.Frozen{}}
        case LcEvent.Close{}:    Transition.Rejected{State.Draft{}}
    case State.Active{}:  # 5 inner arms, etc.
    ...

def replay(+events: List<&2, LcEvent>, s: State) -> State:
  match events:
    case Nil{}: s
    case e <> rest: replay(rest, result_state(step(s, e)))
```

Explicit 5x5 decomposition, no `case _:` catchall.

## Q2. Why is the event type named `LcEvent` instead of `Event`?

Bend's Base prelude defines `Event` (keyboard/mouse).  To avoid
a name clash, the lifecycle event type is named `LcEvent`.

## Q3. Why is `replay(+events, s)` ordered events-first?

The affine termination checker requires the first argument to
"shrink" in the recursive call.  The state cannot structurally
shrink.  The event list structurally shrinks from `e <> rest`
to `rest`.  Therefore events-first ordering is required.

## Q4. Why is LAW-009 (frozen replay) stated in strong form?

The naive form does not give a usable IH: if the head event is
`Close`, the recursive call yields `Closed`, breaking
`is_post_freeze`.  The strong form takes the post-freeze
predicate as a hypothesis, so the IH can be applied to any
state `s` that is post-freeze.

## Q5. How does LAW-001 (rejection_preserves_state) discharge?

Case-split on `(State, LcEvent)` into 25 arms.  For each arm:
- `Accepted{next}`: contradiction; use `Empty.absurd` +
  `acc_eq_rej_is_empty`.
- `Rejected{r'}` where `r' == s`: apply `proj_rej_sym` (Equal.cong
  over `result_state` + Equal.sym to flip the equality).

## Q6. How does LAW-008 (post_freeze_step_remains_post_freeze) discharge?

5-arm case-split on `e`:
- `Activate/Halt/Resume/Freeze`: `step` returns `Rejected{next}`
  where `next == s` (any post-freeze state).  IH applies.
- `Close`: returns `Accepted{Closed}`.  `is_post_freeze(Closed) = True`.
  Direct `{==}`.

## Q7. How does LAW-007 (closed_is_replay_absorbing) discharge?

Induction on `events`:
- `Nil{}`: `replay` returns `s == Closed`.  Direct `{==}`.
- `e <> rest`: `Equal.trans` rewrites
  `replay(rest, result_state(step(Closed, e)))` to
  `replay(rest, Closed)`, which is the IH.

## Q8. How many lemmas / micro-defs?

2 micro-defs total:

1. `proj_rej_sym`: wraps `Equal.cong(Transition, State, result_state, ...)`
   + `Equal.sym` to flip `{Rejected{s_known} == Rejected{r}}` to
   `{r == s_known}`.  Used in 19 of the 25 arms of LAW-001.
2. `post_freeze_replay_helper`: reorders arguments of the recursive
   call in LAW-009's IH application (affine checker is order-sensitive).

Plus 8 helper predicates in `LAWS.bend` (pure type-level projections,
not lemmas).

## Q9. Required to reach Outcome C?

A primitive that exposes a definitional equality the toolkit
doesn't currently expose.  None required in ACT03; all equalities
were available via `{==}`, `Equal.cong`, `Empty.absurd`, `Equal.trans`,
`Equal.sym`, `bool_clash`, `acc_eq_rej_is_empty`.

## Q10. Are there open risks?

The matrix and replay runs files use a hardcoded table (workaround
for a bend2 parser bug — see EVIDENCE.md §E.11).  This does NOT
affect proof validity:
- proofs run against the actual `main.bend`;
- mutations run against fresh copies of `main.bend`;
- MRVN-01 regression is against the original verdict kernel.
## Q11. Comparison with ACT02

ACT02 (verdict kernel) discharged 4 laws in 1 ACT with 1 ACT-style
refactor. ACT03 follows the same pattern:
- explicit shape (no `case _:` catchall) to expose definitional
  equalities;
- case-split structural induction;
- one or two micro-defs to keep proofs mechanical;
- 7+ mutations all caught.

No language extension is required.

## Q12. Summary table

| Metric | Value |
|--------|-------|
| Laws in spec | 8 mandatory + 3 essential + 2 acceptance-authority |
| Laws discharged | 13 of 13 |
| `?TODO` markers in PROOF.bend | 0 |
| Micro-defs | 2 |
| Helper predicates | 9 (added `is_frozen`) |
| Mutations tested | 8 |
| Mutations caught | 8 |
| Spec-gap probes | 1 (passes) |
| MRVN-01 regression | PASS |
| `bun bend2/main.ts PROOF.bend` exit | 0 |
| Output | "All terms check." |
| Proposition authority | 13/13 (each law textually forbids its target) |
| Proof-shape coupling | 13/13 (each proof term discharges the proposition) |

### Q12b. Mutation classification (post-review)

Per the formal-methods reviewer's doctrine, each of the 8
mutations is classified under the strengthened 13-law spec
along two independent axes:

```text
SPEC_REJECTED            proposition forbids the mutation

PROOF_TERM_INVALIDATED   existing proof body no longer type-checks
                         (e.g. constructor mismatch)

BOTH                     proposition AND proof term reject
                         the mutation
```

| Mutation | Proposition rejection | Proof-term rejection | Class |
|----------|-----------------------|----------------------|-------|
| MUT-01 | LAW-002 (Closed is locally absorbing) | structural mismatch on Accepted{} | BOTH |
| MUT-02 | LAW-004 (Frozen cannot resume ordinary work) | structural mismatch on Resume case | BOTH |
| MUT-03 | LAW-005 (Halt/Resume round trip) | equality mismatch on second hop | BOTH |
| MUT-04 | LAW-001 (rejection preserves state) | proj_rej_sym type-mismatch | BOTH |
| MUT-05 | LAW-007 (Frozen replay remains post-freeze) | mismatch on Nil-case IH | BOTH |
| MUT-06 | LAW-007 (replay consumes only head) | structural mismatch on e<>rest | BOTH |
| MUT-07 | LAW-004 (Frozen cannot resume ordinary work) | structural mismatch on Halt | BOTH |
| MUT-08 | LAW-004b (close_rejected_from_non_frozen) | structural mismatch on Accepted | BOTH |

Note: under the *original* 11-law spec, MUT-08's classification
was `PROOF_TERM_INVALIDATED` only (LAW-001 was vacuously true
because the premise `Accepted{Draft} == Rejected{r}` was
uninhabited). Under the *strengthened* 13-law spec it became
`BOTH`. MRVN-04 will make this classification first-class in
the laboratory output.

## Closure

ACT-MRVN-QUALIFY03 produced Outcome A (FULL_QUALIFICATION).
After ACT-MRVN-QUALIFY03-CORRECTION01, the spec was strengthened
to 13 laws (adding LAW-004b for explicit acceptance authority on
Close).  All 13 laws discharge on the existing Bend 2.0.5
toolkit, all 8 mutations are caught, and the original
acceptance-authority concern raised in expert review is fully
addressed.

The lifecycle state machine kernel is verified over the 8
mandatory laws, 3 essential replay extensions, and 2
acceptance-authority laws.  The kernel can be promoted into the
main MRVN TCB without unlocking MRVN-EXT-01.

MRVN-EXT-01 remains LOCKED.
