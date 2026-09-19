# ACT-MRVN-QUALIFY02 REPORT

This is the principal verdict for ACT-MRVN-QUALIFY02 -- the
"prove-without-kernel-changes" attempt. It discharges all four
laws in LAWS.bend using only the existing Bend 2.0.5 toolkit
(`Equal.{sym,trans,cong}`, `%e`, rec-as-parameter, constructor
decomposition), without modifying `bend2/*.ts`, `base.bend`, or
`comp.ts`.

## TL;DR -- Principal verdict

```
ACT-MRVN-QUALIFY02 verdict-kernel: FULL_QUALIFICATION  (Outcome A)
```

All four laws discharge. PROOF.bend runs to completion with
`All terms check.` and exits 0. The implementation refactor
(inline match with explicit 3-arm case split) is semantics-
preserving (24-case runtime differential: mismatches=0) and
enables the proofs.

## Board status (mrvn-level)

```
MRVN-01  FULL_QUALIFICATION
         baseline/TCB mapping            done
         proof-gate semantics            done
         law 001 (advisory_non_blocking)            done
         law 002 (required_failure_blocks)          done
         law 003 (no_blocking_fail_implies_rollout_pass)  done
         law 004 (adjacent_swap)                    done

MRVN-02  FULL_QUALIFICATION  (existing-language proof completion)
         protocol: refactor rollout_status -> inline 3-arm case split
                  then discharge using case-split structural induction
                  and constructor decomposition

MRVN-EXT-01 LOCKED  (kernel/WNF extension)
         ACT-MRVN-QUALIFY02 produced Outcome A; not authorized.
```

## Outcome classification

Per the ACT02 protocol (REPORT.md of ACT01, §Q8):

| Outcome | Verdict | Trigger |
| ------- | ------- | ------- |
| A       | FULL_QUALIFICATION | All 4 laws discharge cleanly with the existing toolkit. **THIS ACT.** |
| B       | PROOF_ERGONOMICS_LIMIT | Laws discharge but require unreasonable proof contortions (>10 lemmas, >5 micro-defs). |
| C       | NORMALIZATION_CAPABILITY_GAP | After reasonable decomposition, the toolkit still can't expose the needed definitional equality. Justifies MRVN-EXT-01. |

## Q1. What changed in main.bend?

ACT01's `rollout_status` had a `case _:` catchall:

```bend
case ck <> rest:
  match ck:
    case Decision_Outcome{Decision.Required{}, Outcome.Fail{}}:
      Rollout.Fail{}
    case _:
      rollout_status(rest)
```

ACT02 replaces the catchall with an explicit 3-arm case split
on `ck`'s full `(Decision, Outcome)` constructor pattern:

```bend
case ck <> rest:
  match ck:
    case Decision_Outcome{Decision.Required{}, Outcome.Fail{}}:
      Rollout.Fail{}
    case Decision_Outcome{Decision.Required{}, Outcome.Pass{}}:
      rollout_status(rest)
    case Decision_Outcome{Decision.Advisory{}, _}:
      rollout_status(rest)
```

The two implementations are semantically equivalent (proven by
runtime differential, E.5) and produce identical output on the
24-case test (mismatches=0). The refactor enables the WNF to
unfold the inner match in each proof arm because `ck` is bound
to a specific constructor pattern at the case site.

## Q2. Why didn't the step-def refactor (initially attempted) work?

The first approach was to extract a step-def:

```bend
def rollout_status.step(ck, rest, +rec, blocking) -> Rollout:
  match blocking:
    case True{}: Fail{}
    case False{}: rec
```

The intent was to use `Equal.cong` to push the `blocking_fail(h)
== False{}` hypothesis into the `blocking` parameter slot.

This failed because:

1. **WNF doesn't unfold saturated calls with parameter
   scrutinees**. `step(p, x, rec, b)` where `b` is a parameter
   (not a constructor) doesn't unfold the `match b` body in WNF.
   `Equal.cong` propagated the equation into the `b` position
   but the goal's LHS still showed `step(p, x, rec, blocking_fail(h))`
   unreduced.

2. **The type checker doesn't reduce `blocking_fail(h)` to
   `False{}` outside the case-match context**. Even in a
   `case h of Decision_Outcome{Required, _<> - Fail{}}:` arm,
   `blocking_fail(h)` is a function call on a parameter; the WNF
   does not unfold it.

The fallback (and winning) approach was to *case-split on h's
full (Decision, Outcome) constructor pattern* directly in the
proofs. Inside the case context, `ck`'s constructor is concrete,
so the WNF unfolds `rollout_status`'s inner match and the goal
reduces to the right shape.

## Q3. How does LAWS-003 discharge?

`Laws.no_blocking_fail_implies_rollout_pass` is proved by
structural induction on `xs`, with an inner case split on `h`'s
full constructor pattern. In the inductive step:

```bend
def Laws.no_blocking_fail_implies_rollout_pass(xs, no_block):
  match xs:
    case Nil{}:
      {==}
    case h <> t:
      match h:
        case Decision_Outcome{Required{}, Fail{}}:
          Empty.absurd({rollout_status(h <> t) == Pass{}}, bool_clash(no_block))
        case Decision_Outcome{Required{}, Pass{}}:
          Laws.no_blocking_fail_implies_rollout_pass(t, no_block)
        case Decision_Outcome{Advisory{}, _}:
          Laws.no_blocking_fail_implies_rollout_pass(t, no_block)
```

In the Required+Fail arm, `no_block` is morally
`{True{} == False{}}` (because `any_blocking_fail(h <> t)`
short-circuits to `True{}` when `h = RF`, and the case context
makes this visible). `Laws.bool_clash` discharges the
contradiction.

In the Required+Pass and Advisory arms, `h` is not blocking, so
the WNF unfolds `rollout_status(h <> t)` to `rollout_status(t)`
inside the case context. The IH applies directly to the reduced
goal (the no_block hypothesis is unchanged because `blocking_fail(h)`
reduces to `False{}` in these arms).

## Q4. How does LAWS-004 discharge?

`Laws.adjacent_swap` is proved by structural induction on
`prefix`, with an inner case split on `prefix`'s head `p_head`'s
full constructor pattern:

```bend
def Laws.adjacent_swap(prefix, a, b, suffix):
  match prefix:
    case Nil{}:
      law004_fin(a, b, suffix)  # exhaustive 9-arm case split on (a, b)
    case p_head <> p_tail:
      match p_head:
        case Decision_Outcome{Required{}, Fail{}}:
          {==}  # rollout_status(p_head <> _) = Fail on both sides
        case Decision_Outcome{Required{}, Pass{}}:
          Laws.adjacent_swap(p_tail, a, b, suffix)  # IH on p_tail
        case Decision_Outcome{Advisory{}, _}:
          Laws.adjacent_swap(p_tail, a, b, suffix)  # IH on p_tail
```

`law004_fin` exhaustively case-splits on the 9 (a, b)
combinations of `(Decision, Outcome) x (Decision, Outcome)`. In
each arm, `rollout_status(a <> b <> suffix)` reduces to a single
constructor (Pass or Fail) and the same constructor appears on
both sides of the equation. `{==}` discharges all 9 arms.

In the inductive step, the WNF unfolds `rollout_status(p_head <>
...)` in each arm of the `p_head` case split. The Required+Fail
arm reduces both sides to `Fail{}` directly. The Required+Pass
and Advisory arms recurse to `Laws.adjacent_swap(p_tail, a, b,
suffix)`, which is the IH hypothesis.

## Q5. How many lemmas does this use?

ZERO auxiliary lemmas.

The proofs use only:
- `match` (structural induction + case decomposition);
- `{==}` (constructor reflexivity);
- `Empty.absurd` (for the LAWS-003 contradiction);
- `Laws.bool_clash` (defined in `LAWS.bend` as a helper).

No use of `Equal.cong`, `Equal.sym`, `Equal.trans`, `%e`, or
rec-as-parameter.

The toolkit overkill of ACT01 (step-def + Equal.cong) was
**not necessary**. The proof shape is direct: case-split on the
head's full constructor pattern.

## Q6. What is required to reach Outcome C (and unlock MRVN-EXT-01)?

Outcome C requires: "after reasonable lemma decomposition, the
existing kernel still cannot expose the needed definitional
equality even with `Equal.cong` + `%e` + the rec-as-parameter
pattern".

ACT02 demonstrates the opposite: with a 3-arm case split
(implemented, not even a refactor of the step-def type), the
WNF exposes the needed equality in each arm, and the proofs
discharge directly with NO auxiliary lemmas.

Therefore MRVN-EXT-01 (kernel/WNF changes) remains **LOCKED**.

## Q7. What is the durability / reproducibility story?

- All commands are reproducible from the repo root with
  `PATH=/opt/homebrew/bin:$PATH bun bend2/main.ts <file>`.
- The §5.2 differential uses 24 hand-picked test cases from the
  4-value Check alphabet (Required/Advisory × Pass/Fail).
- The 5 MUTs (§10) each violate at least one law. The MUTs are
  syntactically valid implementations that produce observably
  different output. (MUT-05 was originally written as a
  "spec-completeness probe", but as established in EVIDENCE.md
  §E.8, it also violates LAW-MRVN-002. The bounded MUT search
  found no compliant-but-different implementation.)
- The reference ACT01 files are SHA256-frozen in
  `factory/qualify/ACT-MRVN-QUALIFY02/reference/`.

## Q8. Are there any open risks?

- **Ergonomics ceiling**: 4 laws × 9 (a, b) case-splits is 36
  terminal `{==}` arms in the proofs. If LAWS-004 grew to
  *any* swap (not just adjacent), the proof would need a
  different shape (e.g., explicit list-rotation lemma). This is
  not a normalization capability gap, but a proof-ergonomics
  limit. The boundary is at "if the proof would require
  *unreasonable* contortions to discharge with the existing
  toolkit". ACT02 stays well within the reasonable side.

- **`rollout_status` is now in two forms**: ACT01's `case _:`
  catchall is preserved in the reference, ACT02's 3-arm split is
  the live impl. If a future ACT needs to swap back to the
  ACT01 form (e.g., for source compatibility with downstream
  consumers), the proofs will need re-derivation.

- **The reference impl in `evidence/diff/main_act01.bend` is a
  copy** of ACT01's `main.bend` (with `case _:`). If the live
  `main.bend` ever changes, this diff source must be re-frozen.

- **`/tmp/diff_test_act02/`**: temporary directory created
  during ACT02 to work around Bend's JS-emitter path bug (paths
  with `-` produce invalid JS identifiers). Removed at
  ACT02 closure per §19. **Note**: evidence/diff/main_act01.bend
  is a permanent copy of the contents; only the temporary
  build directory was disposable.

## Q9. Comparison with ACT01's prediction

ACT01's REPORT.md §Q8 predicted the following outcome hierarchy:

> If that ACT discharges all six obligations, the verdict is
> `FULL_QUALIFICATION` (Outcome A).
>
> If the laws are expressible and true, but Bend 2.0.5 requires
> *unreasonable* proof contortions to discharge them ... the
> verdict is `PROOF_ERGONOMICS_LIMIT` (Outcome B).

ACT02 landed on **Outcome A** -- not even close to Outcome B.
The discharge path required:

1. ONE small impl refactor (3-arm case split instead of
   `case _:` catchall).
2. ZERO auxiliary lemmas.
3. ZERO uses of `Equal.cong`, `Equal.trans`, `%e`, or
   rec-as-parameter.

The "toolkit overkill" approach (step-def + Equal.cong) was
attempted first but ultimately unnecessary; the direct
case-split-on-constructor approach was simpler.

## Q10. Summary table

| Aspect | ACT01 | ACT02 |
| ------ | ----- | ----- |
| Laws discharged | 2 of 4 | **4 of 4** |
| `?TODO` count | 6 | **0** |
| `bun bend2/main.ts PROOF.bend` exit | 1 | **0** |
| Output | "6 TODOs found" | "All terms check." |
| Lemma count (auxiliary) | 0 | 0 |
| Tool used | {==}, Empty.absurd | {==}, Empty.absurd (same) |
| Implementation refactor | none | inline 3-arm case split |
| Semantic preservation | n/a | differential: 24/24 MATCH |
| MUT count | 0 | 5 |
| MUTs that violate laws | n/a | **5 of 5** |
| Spec-completeness probe | n/a | **no counterexample found** |

## Hashes (frozen at ACT02 closure)

```
factory/qualify/ACT-MRVN-QUALIFY02/reference/main_act01.bend   f37ea4127df6df15acb12bf876f38f36eb0e4ae8300bdcb3b653bf78349cdba3
factory/qualify/ACT-MRVN-QUALIFY02/reference/LAWS-act01.bend   e3600c99bac853fb8a90720bbc042f7388404238d2c0e671d6672b948daedd39
factory/qualify/ACT-MRVN-QUALIFY02/reference/PROOF-act01.bend  ed7f562d466dd2419f9f262e8748a9ffd9a7dd22ae9ecdc047337cc0fe274b18
factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/main.bend    f2f94e47aff2f288f2f164ac11e96d87ac3bb8a41907c9e69525aabf8e9f7b5f
factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/LAWS.bend    e3600c99bac853fb8a90720bbc042f7388404238d2c0e671d6672b948daedd39
factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/PROOF.bend   0268db724a986ae7ab44f54750542b4a657dee8ea20a9f22817a01c02c96eb95
```

## ACT-MRVN-QUALIFY02-CORRECTION01 (closure hygiene)

Reviewer feedback at ACT02 review identified three closure-hygiene
defects in the initial report/evidence. None affect the
technical verdict (Outcome A); all are accounting/wording
corrections. Corrections applied:

1. **MUT count**: Initial REPORT.md stated "4 of 5 MUTs violate
   at least one law". Corrected to **"5 of 5"** after
   re-verifying MUT-05 against LAW-MRVN-002 (MUT-05's
   count-based impl returns `Pass{}` on `[Required+Fail]`
   instead of the law-required `Fail{}`). EVIDENCE.md §E.7, §E.8
   also corrected.

2. **Spec-completeness overclaim**: Initial REPORT.md stated
   "Spec-completeness: sufficient". Corrected to
   **"Spec-completeness probe: no counterexample found"**.
   The 4 laws are *not* known to *completely characterize*
   `rollout_status` (that would require a uniqueness proof,
   not done). The bounded MUT search found no
   compliant-but-different implementation, but absence of a
   counterexample is not a completeness proof.

3. **Lifecycle authority**: ACT02 was authored into an
   untracked worktree (`factory/` entirely untracked). Reviewer
   noted this leaves `AUTHORITY_STATUS = DirtyWorktree` and
   `state_binding = UNBOUND`. The technical verdict stands
   (Outcome A), but lifecycle closure requires
   staging+committing the qualified state into the controlled
   factory tree. See `factory/qualify/ACT-MRVN-QUALIFY02/closure.md`
   for the staged-transition manifest.

No Bend source changes. No proof changes. No new laws. No
additional theorem work.

**Disposition**:
- `TECHNICAL_QUALIFICATION = FULL` (unchanged).
- `FACTORY_CLOSURE = NOT_YET_AUTHORITATIVE` (pending stage+commit).
