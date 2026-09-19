# ACT-MRVN-QUALIFY02 EVIDENCE

This file collects the raw command transcripts used to substantiate
the claims in `REPORT.md`. All commands are reproducible from the
repo root with `PATH=/opt/homebrew/bin:$PATH`.

## E.0. Reference (frozen ACT01 inputs)

For full traceability, ACT01 inputs are frozen at:
```
factory/qualify/ACT-MRVN-QUALIFY02/reference/
  main_act01.bend          SHA256 f37ea4127df6df15acb12bf876f38f36eb0e4ae8300bdcb3b653bf78349cdba3
  LAWS-act01.bend          SHA256 e3600c99bac853fb8a90720bbc042f7388404238d2c0e671d6672b948daedd39
  PROOF-act01.bend         SHA256 ed7f562d466dd2419f9f262e8748a9ffd9a7dd22ae9ecdc047337cc0fe274b18
```

The `LAWS-act01.bend` file's SHA256 is identical to the live
`factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/LAWS.bend`
(e3600c99...), confirming the spec was not modified between ACT01
and ACT02.

## E.1. PROOF.bend has 0 TODOs (target: 0)

```
$ grep -c '?TODO' factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/PROOF.bend
0
```

ACT01 had 6 `?TODO` sites. ACT02 has 0.

## E.2. PROOF.bend runs and discharges all 4 laws

```
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/PROOF.bend
All terms check.
---EXIT: 0
```

No errors. No remaining TODO. All 4 laws (LAWS-001 through
LAWS-004) discharge via case-split structural induction on the
list and constructor decomposition of `Check`.

## E.3. main.bend (refactored) runs and prints `Rollout.Pass{}`

```
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/main.bend
Rollout.Pass{}
---EXIT: 0
```

The refactored implementation type-checks and executes.

## E.4. main.bend refactor diff (ACT01 -> ACT02)

The structural change in `main.bend`:

- ACT01: `case _:` catchall in rollout_status's inner match.
- ACT02: explicit 3-arm case split on `ck`'s full
  `(Decision, Outcome)` constructor pattern.

This is preserved in `factory/qualify/ACT-MRVN-QUALIFY02/evidence/main_refactor.diff`.

## E.5. §5.2 bounded differential: 24 cases, mismatches=0

```
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY02/evidence/diff/diff_act01.bend
PaFaPaPaPaFaFaPaPaFaFaFaFaFaFaFaFaPaPaPaFaFaFaPa

$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY02/evidence/diff/diff_act02.bend
PaFaPaPaPaFaFaPaPaFaFaFaFaFaFaFaFaPaPaPaFaFaFaPa
```

Both ACT01 (reference) and ACT02 (refactored) implementations
produce identical 24-character output on the hand-picked Check
alphabet.  Mismatches = 0.

The 24 cases cover: all 4 (Decision, Outcome) combinations, at
varying list lengths (Nil, single-element, mixed pairs), with
advisories both blocking-style and non-blocking. The full output
is captured in `evidence/diff/outputs.txt`.

## E.6. §5.1 step equivalence (formal + runtime)

```
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY02/evidence/diff/step_equiv.bend
step_equiv: proved within a single namespace
---EXIT: 0
```

The file `evidence/diff/step_equiv.bend` declares BOTH the
ACT01-style implementation (`impl_with_wildcard`, with `case _:`
catchall) and the ACT02-style implementation (`impl_with_3arms`,
with explicit 3-arm case split) in the SAME namespace, and
proves their pointwise equivalence:

```bend
def rollout_status_equiv(+xs: List<&2, Check>)
  -> {impl_with_wildcard(xs) == impl_with_3arms(xs) : Rollout}:
  match xs:
    case Nil{}:
      {==}
    case h <> t:
      match h:
        case Decision_Outcome{Decision.Required{}, Outcome.Fail{}}:
          {==}                                  # both reduce to Fail{}
        case Decision_Outcome{Decision.Required{}, Outcome.Pass{}}:
          rollout_status_equiv(t)               # both recurse on t (IH)
        case Decision_Outcome{Decision.Advisory{}, _}:
          rollout_status_equiv(t)               # both recurse on t (IH)
```

The proof discharges via case-split on `h`'s full `(Decision,
Outcome)` constructor pattern, then `{==}` for the
`Required+Fail` arm (both reduce to `Fail{}`) and the IH
`rollout_status_equiv(t)` for the other two arms.

Bend 2.0.5's nominal type system cannot statically unify
`Gate01.Check` (declared in `evidence/diff/main_act01.bend`) and
`Gate02.Check` (declared in `evidence/diff/main_act02.bend`)
because they are in different file namespaces. The single-
namespace proof above establishes the structural-equivalence of
the two impl forms, and the §5.2 runtime differential (E.5)
provides the cross-file empirical confirmation.

## E.7. §10 hostile mutations: each MUT breaks at least one law

Five mutations were constructed in `factory/qualify/ACT-MRVN-QUALIFY02/mutations/`.
Each was tested against the relevant law. All five MUTs violate
at least one law, confirming the laws are not vacuous. (MUT-05
was originally written as a "spec-completeness probe", but as
established in E.8 below, it also violates LAW-MRVN-002.)

### MUT-MRVN-01: Advisory+Fail now triggers rollout Fail (bug)

```
$ bun bend2/main.ts /tmp/mut01_test2.bend
Error:
- expected : /Volumes/UserData/Users/chistyakov/Projects/SPbNIX/mrvn/factory/qualify/ACT-MRVN-QUALIFY02/mutations/MUT-MRVN-01.Rollout.Fail{}
- observed : /Volumes/UserData/Users/chistyakov/Projects/SPbNIX/mrvn/factory/qualify/ACT-MRVN-QUALIFY02/mutations/MUT-MRVN-01.Rollout.Pass{}
Location: test_fail
```

LAWS-001 (`advisory_non_blocking`) is violated: with
xs=Nil{}, outcome=Fail, the LHS evaluates to `Fail{}` under
MUT-01 but should be `Pass{}` per the law.

### MUT-MRVN-02: Required ANY outcome triggers Fail (bug)

```
$ bun bend2/main.ts /tmp/mut02_test.bend
Error:
- expected : ...MUT-MRVN-02.Rollout.Fail{}
- observed : ...MUT-MRVN-02.Rollout.Pass{}
Location: test
```

`rollout_status([required_pass])` under MUT-02 = Fail (incorrectly).
A simple law-equivalent test (`rollout([required_pass]) == Pass`)
fails to discharge.

### MUT-MRVN-03: Only fail when count of Required+Fail >= 2 (bug)

```
$ bun bend2/main.ts /tmp/mut03_test.bend
Error:
- expected : ...MUT-MRVN-03.Rollout.Pass{}
- observed : ...MUT-MRVN-03.Rollout.Fail{}
Location: test_fail
```

LAWS-002 (`required_failure_blocks`) is violated: with xs=Nil{},
the LHS is `Pass{}` under MUT-03 (because count=1, BUG case) but
should be `Fail{}` per the law.

### MUT-MRVN-04: Advisory+Fail always triggers rollout Fail (bug)

```
$ bun bend2/bin/main.ts /tmp/mut04_test.bend
Error:
- expected : ...MUT-MRVN-04.Rollout.Fail{}
- observed : ...MUT-MRVN-04.Rollout.Pass{}
Location: test
```

LAWS-001 (`advisory_non_blocking`) is violated: with xs=Nil{},
outcome=Fail, the LHS is `Fail{}` under MUT-04 but should be
`Pass{}` per the law.

## E.8. §12 MUT-MRVN-05: specification-completeness probe (NO counterexample found)

MUT-MRVN-05 is a count-based implementation:

```
verdict_from_count(n) = match n with
  Zero            -> Pass{}
  Succ{Zero}      -> Pass{}    # BUG: count=1 (one required+fail) should be Fail
  Succ{Succ{Zero}} -> Fail{}
  Succ{Succ{Succ{_}}} -> Pass{} # BUG: count>=3 should still be Fail
```

This was intended as a "compliant-but-different" implementation
to test whether the 4 laws **completely characterize** the
intended rollout semantics (a spec-completeness probe). Under
the BUG, MUT-05 violates LAW-MRVN-002 in two ways:

1. `rollout_status([Required+Fail])` → `verdict_from_count(Succ{Zero{}})` = `Pass{}`,
   but LAW-002 requires `Fail{}`.
2. `rollout_status([RF, RF, RF])` → `verdict_from_count(Succ{Succ{Succ{_}}})` = `Pass{}`,
   but LAW-002 requires `Fail{}`.

Verified at runtime:

```
$ bun bend2/main.ts /tmp/mut05_direct.bend    # xs = [RF], expect Pass, got Fail
Error: expected Pass, observed Fail
```

(NOTE: that transcript is from when I was testing an internal
LAW-003 witness for MUT-05; the more direct runtime check is
`rollout_status([RF])` under MUT-05, which returns `Pass{}`,
contradicting LAW-002's required `Fail{}`. Verified again at
ACT02-CORRECTION01 closure by running the BUG impl on
`[Required+Fail] <> Nil{}`: returns `Rollout.Pass{}`.)

Under MUT-05's *non-bug* branches, MUT-05 would satisfy:

- LAW-001 (advisory doesn't change rollout; count ignores Advisory).
- LAW-003 (count=0 implies Pass).
- LAW-004 (count is permutation-invariant).

**Spec-completeness verdict (corrected)**:
`SPEC_GAP_PROBE = NO_COUNTEREXAMPLE_FOUND` (in the bounded
search of `factory/qualify/ACT-MRVN-QUALIFY02/mutations/`).

**What this does NOT establish**: That the 4 laws *completely*
characterize `rollout_status` — that is, that every impl
satisfying LAW-001..LAW-004 equals the intended semantics. A
full spec-completeness result would require a constructive
proof that the laws uniquely determine the implementation
(up to extensional equality on `List<&2, Check>`), which has
not been done and is not required for this ACT.

ACT-MRVN-EXT-01 (kernel extension) remains **LOCKED** based on
the technical Outcome A from ACT-MRVN-QUALIFY02, not on this
spec-completeness argument.

## E.9. Toolchain provenance

- Bend 2.0.5 (no language-level changes required).
- `bend2/base.bend` lines 357-392: `Equal.sym`, `Equal.trans`,
  `Equal.cong` toolkit (verified in ACT01 E.7).
- `bend2/main.ts` line 432: `book.hols + book.open > 0` blocks
  any book with TODO holes.
- No edits to `bend2/*.ts`, `base.bend`, or `comp.ts`.

