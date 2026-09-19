# ACT-MRVN-QUALIFY01 verdict-kernel REPORT

This is the principal verdict for ACT-MRVN-QUALIFY01's verified
"verdict kernel". It records the four laws stated in `LAWS.bend`,
their proofs in `PROOF.bend`, what discharged, and what remained.

## TL;DR -- Principal verdict

```
ACT-MRVN-QUALIFY01 verdict-kernel: PARTIAL_QUALIFICATION
```

Two of the four laws discharge cleanly; two have residual TODO arms.
All six TODO sites are documented inline in `PROOF.bend` with the
structural reason. None of the disallowed escape hatches are used
(no `@unsafe`, no foreign `import`, no `?name`, no `?TODO` outside
the documented residual arms).

## Board status (mrvn-level)

```
MRVN-01  PARTIAL_QUALIFICATION
         baseline/TCB mapping           done
         proof-gate semantics           done
         law 001 (advisory_non_blocking)   done
         law 002 (required_failure_blocks) done
         law 003 (no_blocking_fail_implies_rollout_pass)  1 residual
         law 004 (adjacent_swap)                          5 residuals

MRVN-02  NEXT  (existing-language proof completion)
         protocol: minimal WNF reproducer first
                  (Appendix A.2 already shows the toolkit works)
                  then refactor rollout_status -> rollout_status.step
                  then discharge using Equal.{sym,trans,cong} + %e

MRVN-EXT-01 LOCKED  (kernel/WNF extension)
         only authorized if MRVN-02 returns Outcome C
```

The Appendix A.2 reproducer (EVIDENCE.md E.6) is the key
qualitative finding: it shows the property-based IH lift *does*
discharge with `Equal.cong` once the implementation is refactored
into a separate step-def and the witness is live. That places
MRVN-01's residual squarely in the **PROOF_ERGONOMICS_LIMIT**
territory rather than NORMALIZATION_CAPABILITY_GAP, *but the
refactor is not done in this ACT*, so MRVN-01 remains at
PARTIAL_QUALIFICATION. MRVN-02 will perform the refactor and
classify its outcome (A / B / C).

An adversarial follow-up reproducer (see Appendix A) established
that the residual blockers are **at the proof-shape level, not at
the language-WNF level**: a near-minimal isolated proof using
`f.step` extraction plus `Equal.cong` *does* discharge the property-
based IH lift in the same shape that LAWS-003 and LAWS-004 hit.
That pushes the residual classification from "language limitation"
toward "PROOF_ERGONOMICS_LIMIT" -- but it does not yet cross into
FULL_QUALIFICATION, because the proof shape change requires
refactoring the implementation, which is not done in this ACT.

## Q1. What is the verdict kernel?

A simplified deployment gate, modeled as a pure function
`rollout_status : List<&2, Check> -> Rollout`. `Check` is either
`Required(outcome)` or `Advisory(outcome)`; `Rollout` is `Pass` or
`Fail`. The intended semantics: `rollout_status(checks) == Fail`
iff there exists at least one `Required(Fail)` in `checks`.

`main.bend` carries the implementation. `LAWS.bend` carries four
laws. `PROOF.bend` carries the proofs.

## Q2. Which laws were stated?

Four. From `LAWS.bend`:

| ID  | Law                                            | Stated as                                                                                     |
| --- | ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 001 | `advisory_non_blocking`                        | prepending an `Advisory(_)` to `xs` does not change `rollout_status`                          |
| 002 | `required_failure_blocks`                      | prepending `Required(Fail)` to `xs` makes `rollout_status = Fail`                             |
| 003 | `no_blocking_fail_implies_rollout_pass`        | if no element of `xs` is `Required(Fail)`, then `rollout_status = Pass`                       |
| 004 | `adjacent_swap`                                | swapping two adjacent elements in `xs` does not change `rollout_status`                       |

The laws use the specification-side helpers `blocking_fail` and
`any_blocking_fail` (in `LAWS.bend`). `blocking_fail` is the
predicate "is this check `Required(Fail)`?". `any_blocking_fail`
is the disjunction over the list; it is defined with a step-helper
that short-circuits on the first `True{}` so the WNF exposes the
short-circuit when the head is `Required(Fail)`.

## Q3. Which laws discharged?

LAW-MRVN-001 and LAW-MRVN-002 discharge cleanly. The proofs:

- LAWS-001 (`advisory_non_blocking`): case split on `xs`. In both
  `Nil{}` and `_<_>` arms, the goal type reduces by the
  `rollout_status` equation and `{==}` discharges.
- LAWS-002 (`required_failure_blocks`): the goal is
  `{rollout_status(Required(Fail) <> xs) == Fail}`. The
  `rollout_status` equation reduces the LHS to `Fail` directly;
  `{==}` discharges.

Both were independently verified by running
`bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/PROOF.bend`
and observing that the type-checker advances past these two arms.
They were also lifted into a standalone file
(`/tmp/verify_001_002.bend`) that runs `bend` cleanly.

## Q4. Which laws have residual TODOs?

LAW-MRVN-003 and LAW-MRVN-004. The PROOF.bend file has 6 `?TODO`
sites total:

- LAWS-003: 1 site, in `no_blocking_fail_implies_rollout_pass.fin`
  case `_:` (the non-Required+Fail arm).
- LAWS-004: 5 sites, in `adjacent_swap.fin` (3 sites: the three
  "asymmetric" arms of the nested case split on `a` and `b`),
  `adjacent_swap.step` (1 site: the inductive step), and
  `Laws.adjacent_swap` (1 site: the inductive step).

The `?TODO` keyword increments `book.hols` at parse time
(`bend2/bend.ts` lines 1956-1958). The CLI then refuses any book
with `hols + open > 0`. **Therefore the current PROOF.bend is not
gate-passing.** The verdict is `PARTIAL_QUALIFICATION`.

## Q5. Why did LAWS-003 fail to discharge?

The non-Required+Fail arm of LAWS-003 has two obligations that
the Bend type-checker cannot discharge directly:

(i)  **Witness coercion.** The input witness
     `no_block : {any_blocking_fail(h <> t) == False : Bool}` must
     be turned into
     `{any_blocking_fail(t) == False : Bool}`. Inside the case
     context, `blocking_fail(h)` reduces to `False{}` (because `h`
     is not `Required(Fail)`). The `any_blocking_fail.step` helper
     would then reduce to its `False` arm, exposing
     `any_blocking_fail(t)`. **But `blocking_fail(h)` is a function
     call on a variable, not a constructor head, and the WNF does
     not unfold it.** No amount of case matching on `h` (where the
     case is `_<_>` or any other constructor shape) reveals this
     reduction to the checker.

(ii) **Goal bridging.** The goal is
     `{rollout_status(h <> t) == Pass : Rollout}`. The IH gives
     `rec : {rollout_status(t) == Pass : Rollout}`. To bridge
     these, one must show `rollout_status(h <> t) == rollout_status(t)`
     when `h` is not `Required(Fail)`. This needs `rollout_status`'s
     recursive case to unfold. **It does not.** `rollout_status`'s
     `_:` arm contains the recursive call `rollout_status(rest)`,
     which the WNF treats as an opaque term.

**However**, an isolated reproducer (Appendix A.2) showed that the
*equivalent* property-based IH lift *does* discharge with `Equal.cong`
once the implementation is refactored into a separate `f.step` def
and the witness `e` is live. The blocker here is therefore not a
fundamental WNF capability, but the **specific shape** of the
inline inner match in `rollout_status` plus an erased hypothesis.

## Q6. Why did LAWS-004 fail to discharge?

The same root cause as Q5. The proof structure for LAWS-004 is a
nested case split on `(a, b)` and an induction on `prefix`:

- The (a = R+F, b = R+F) arm: both `rollout_status` calls reduce
  to `Fail`; `{==}` discharges. ✓
- The (a = R+F, b = _) arm: `rollout_status(a <> ...) = Fail` but
  `rollout_status(b <> ...)` does not reduce (Q5's bridge
  failure). TODO.
- The (a = _, b = R+F) arm: symmetric TODO.
- The (a = _, b = _) arm: both sides recurse; IH must apply.
  TODO.
- The structural induction on `prefix`: the same rollout_status
  visibility issue blocks the step.

The strategy in Appendix A.2 (extract a `f.step` def, use `Equal.cong`
with a live witness) is also expected to discharge LAWS-004, but
requires the same kind of implementation refactor.

## Q7. What escape hatches are used?

None. The PROOF.bend uses:

- `import Base` and `import ./main.bend as Gate` (the prelude and
  the implementation). Both are first-party and checked by Bend.
- `?TODO` placeholders in the documented residual arms. `?TODO`
  is a *quiet hole*: it type-checks at any goal but increments
  `book.hols`. The CLI refuses any book with `hols > 0`. So the
  current PROOF.bend does **not** pass the gate.

No `@unsafe def`. No foreign `import`. No `?name` (loud holes).
No compiler-generated code is checked in. Per `AUTHORITY.md`
section 3.2, none of the unchecked rows are exercised.

## Q8. What is required to reach full qualification?

To get a `FULL_QUALIFICATION` verdict for ACT-MRVN-QUALIFY01, the
six `?TODO` sites in PROOF.bend must be discharged. The shape of
the next ACT is:

**ACT-MRVN-QUALIFY02** -- *Prove-without-kernel-changes*: refactor
`rollout_status` so that the inner match sits in a separate
`rollout_status.step` def (taking `bf_h` as an explicit Bool
parameter, mirroring `f.step` in Appendix A.2), then re-express
LAWS-003 and LAWS-004 using the toolkit already present in
`bend2/base.bend`:

- `Equal.sym`, `Equal.trans`, `Equal.cong` (verified present in
  `bend2/base.bend` lines 357-392; canonical usage in
  `tests/proof/equality_kit.bend`);
- the J-rule `%e : {f(a) == f(_) : B}; {==}`;
- more explicit constructor decomposition of `Check`;
- discriminator / clash lemmas over `Rollout`;
- helper lemmas over `blocking_fail` and `any_blocking_fail`;
- helper lemmas exposing one-step `rollout_status.step` behaviour;
- the `rec`-as-parameter idiom already in use in
  `tests/proof/insertion_sort_sorted.bend`.

If that ACT discharges all six obligations, the verdict is
`FULL_QUALIFICATION` (Outcome A).

If the laws are expressible and true, but Bend 2.0.5 requires
*unreasonable* proof contortions to discharge them -- e.g. the
implementation has to be cut into 4-6 micro-defs, the proof needs
>10 distinct lemmas over `Rollout`/`Check` equality, etc. -- the
verdict is `PROOF_ERGONOMICS_LIMIT` (Outcome B).

If, after reasonable lemma decomposition, the existing kernel
still cannot expose the needed definitional equality even with
`Equal.cong` + `%e` + the rec-as-parameter pattern, the verdict is
`NORMALIZATION_CAPABILITY_GAP` (Outcome C). **Only C authorizes
ACT-MRVN-EXT-01 (kernel/WNF changes).**

## RESIDUAL RISKS

- **The Q5/Q6 overclaim was caught.** The Appendix A reproducer
  confirmed that the residual blockers are at the proof-shape
  level, not at the level of "Bend fundamentally cannot normalize
  this". The earlier report's strong claim ("Bend's WNF does not
  unfold `case _:` recursion") was too general. The accurate
  statement is narrower: this specific implementation's inline
  inner match, combined with an erased hypothesis, leaves the
  WNF unable to bridge the goal; `Equal.cong` plus a refactored
  step-def bridges it.

- The `false_type` orientation (`True -> Unit, False -> Empty`)
  is the non-natural one (the "natural" failure-tag orientation
  would be `True -> Empty, False -> Unit`). The orientation was
  chosen so that the J-rule's b_gol check fits the goal
  `{True{} == False{} : Bool} -> Empty`. **Any change to
  `bool_clash`'s witness shape will require re-deriving the
  orientation.** This is documented in `LAWS.bend` near
  `false_type`.

- Bend explicitly forbids `match` on a *computed value*: the error
  is "a parameter or field scrutinee (a match cannot scrutinize a
  computed value: give it its own def)". This is a language
  *design* choice, not a bug, and it forces the step-def refactor
  pattern. The refactor is mechanical but it does change the
  *implementation* (a new def, a new top-level binding), so any
  downstream consumers of `rollout_status` would need updating.

- The `rec`-as-parameter idiom carries `+` binders through
  recursive helpers. Bend restricts `+` on `Type`-typed function
  parameters; this is fine here because all recursive witnesses
  are `Type`-free, but adding a `Type`-recursive lemma would hit
  this wall.

## NEXT_RECOMMENDED_ACT

ACT-MRVN-QUALIFY02: **Prove-without-kernel-changes**. Refactor
`rollout_status` into a `rollout_status.step` def, then re-attempt
the discharge of LAWS-003 and LAWS-004 using only the existing
Bend 2.0.5 toolkit (`Equal.cong` + `%e` + rec-as-parameter +
constructor decomposition). The protocol:

1. **Minimal reproducer first**: write a 10-30 line `.bend` file
   that proves the property-based IH lift for a list-of-AB
   function with a Bool flag, mirroring Appendix A.2. This
   isolates whether the toolkit is sufficient.

2. **Refactor `main.bend`**: extract `rollout_status.step(h, t,
   rec, bf_h)` and rewrite `rollout_status` to call it. Run
   `bend main.bend` to confirm the implementation still
   type-checks and runs.

3. **Rewrite the LAWS-003 and LAWS-004 proofs**: live witnesses,
   `Equal.cong` over the bf_h position, J-rule over the Rollout
   asymmetry (using `Empty.absurd` plus a `{Fail == Pass} -> Empty`
   lemma if needed).

4. **Classify**: based on the outcome, emit one of A / B / C above.

**ACT-MRVN-EXT-01 (kernel/WNF change) remains locked** until
QUALIFY02 produces a clean Outcome C.

---

## Appendix A. Minimal reproducers (run in this ACT, not part of the repo)

All reproducers live in `/tmp`. They are not part of the
qualification; they exist only to characterize the residual.

### A.1. Recursive def unfolds when scrutinee is a variable

```bend
import Base

def len(+xs: List<&2, Nat>) -> Nat:
  match xs:
    case Nil{}: 0n
    case _ <> t: 1n + len(t)

law len_cons:
  for -x: Nat
  for +t: List<&2, Nat>
  {len(x <> t) == 1n + len(t) : Nat}

def len_cons(x, t): {==}
```

**Result**: discharges. `len(x <> t)` is a saturated recursive call
on a constructor-headed scrutinee; the WNF unfolds it to the
`_ <> rest` arm, where `rest = t`, so the body reduces to
`1n + len(t)` syntactically, and `{==}` discharges.

This is the "easy" case. The verdict-kernel's outer match
(`match checks`) is in this same shape, so LAWS-001 and LAWS-002
work for the same reason.

### A.2. Property-based IH lift, with a `f.step` extraction

```bend
import Base

type AB is Data:
  C{x: Bool}
  D{x: Bool}

def bf(c: AB) -> Bool:
  match c:
    case C{b}: b
    case D{b}: b

def f.step(h: AB, rest: List<&2, AB>, +rec: Nat, bf_h: Bool) -> Nat:
  match bf_h:
    case True{}: 1n
    case False{}: rec

def f(+xs: List<&2, AB>) -> Nat:
  match xs:
    case Nil{}: 0n
    case h <> t: f.step(h, t, f(t), bf(h))

law otherwise_arm:
  for +h: AB
  for +t: List<&2, AB>
  for e: {bf(h) == False{} : Bool}
  {f(h <> t) == f(t) : Nat}

def otherwise_arm(h, t, e):
  Equal.cong(Bool, Nat, b => f.step(h, t, f(t), b), bf(h), False{}, e)
```

**Result**: discharges. The key features are:

- the inner match is in a **separate def** (`f.step`);
- the witness `e` is **live** (`for e`, not `for -e`);
- `Equal.cong` propagates the witness's equation `bf(h) == False{}`
  into the bf_h position of `f.step`;
- `f.step`'s `case False{}` arm is then in WNF-reducible position
  in the goal, so `{==}` discharges.

This is the shape that LAWS-003's residual arm needs. Without the
step-def extraction, the property-based IH lift blocks at the WNF
layer (the inline `match bf(h)` is also forbidden by Bend's
"computed scrutinee" rule, so a refactor is *required* anyway).
With it, `Equal.cong` is sufficient.

### A.3. Negative control: same shape with the wrong witness

Replacing `e : {bf(h) == False{}}` with `e : {bf(h) == True{}}`
causes `Equal.cong` to produce the wrong RHS (`f.step(... True{})`
reduces to `1n`), and the proof fails with the expected error
"observed: `{f.step(h, t, f(t), bf(h)) == 1n}`". This confirms
the A.2 proof is genuinely going through, not being accepted by
accident.

### A.4. Sanity: the law body *is* type-checked

Removing the `def otherwise_arm` body altogether yields "1 TODO
found." Removing the body and replacing it with a bare identifier
yields "expected: a defined name, observed: <name>". So Bend does
type-check law bodies, and the A.2 success is real.
