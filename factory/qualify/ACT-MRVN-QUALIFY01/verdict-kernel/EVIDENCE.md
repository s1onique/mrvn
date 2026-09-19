# ACT-MRVN-QUALIFY01 verdict-kernel EVIDENCE

This file collects the raw command transcripts used to substantiate
the claims in `REPORT.md`. All commands are reproducible from the
repo root with `PATH=/opt/homebrew/bin:$PATH`.

## E.1. PROOF.bend has exactly 6 documented `?TODO`s

```
$ grep -c '?TODO' factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/PROOF.bend
6
```

## E.2. PROOF.bend runs and reports 6 TODOs

```
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/PROOF.bend
Error: 6 TODOs found.
The code is incomplete, and not a valid proof yet.
---EXIT: 1
```

No other errors are reported: the type-checker accepts everything
in PROOF.bend except the 6 `?TODO` holes.

## E.3. main.bend runs and prints `Rollout.Pass{}`

```
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/main.bend
Rollout.Pass{}
---EXIT: 0
```

The implementation type-checks and executes.

## E.4. LAWS-001 and LAWS-002 discharge independently

A standalone file containing only LAWS-001 and LAWS-002 (plus
helpers lifted from main.bend) was constructed at
`/tmp/verify_001_002.bend`. It type-checks and runs cleanly:

```
$ bun bend2/main.ts /tmp/verify_001_002.bend
Unit{}
---EXIT: 0
```

This confirms that LAWS-001 and LAWS-002 do not depend on any
of the LAWS-003 / LAWS-004 machinery; they are independent.

## E.5. Reproducer A.1: recursive def unfolds on variable scrutinee

File: `/tmp/repro1.bend`. Source: see REPORT.md Appendix A.1.

```
$ bun bend2/main.ts /tmp/repro1.bend
ok
---EXIT: 0
```

`len(x <> t)` reduces via the WNF to `1n + len(t)`; `{==}`
discharges. This is the easy case that LAWS-001 / LAWS-002 also
exhibit.

## E.6. Reproducer A.2: property-based IH lift via `Equal.cong`

File: `/tmp/repro6b.bend`. Source: see REPORT.md Appendix A.2.

```
$ bun bend2/main.ts /tmp/repro6b.bend
ok
---EXIT: 0
```

The proof `Equal.cong(Bool, Nat, b => f.step(h, t, f(t), b),
bf(h), False{}, e)` discharges the property-based IH lift when:

1. the inner match sits in a separate `f.step` def, AND
2. the witness `e` is live (`for e`, not `for -e`).

This is the same shape LAWS-003's residual arm needs.

## E.7. Reproducer A.3: negative control (wrong witness)

File: `/tmp/repro17.bend`. With `e : {bf(h) == True{}}` instead
of `bf(h) == False{}`:

```
$ bun bend2/main.ts /tmp/repro17.bend
Error:
- expected : {f.step(h, t, f(t), bf(h)) == f(t) : Nat}
- observed : {f.step(h, t, f(t), bf(h)) == 1n : Nat}
---EXIT: 1
```

Confirms that E.6's success is *not* accidental: the proof goes
through, and a wrong witness breaks it.

## E.8. Reproducer A.4: law bodies are type-checked

Removing the `def otherwise_arm` body from E.6:

```
$ bun bend2/main.ts /tmp/repro15.bend
Error: 1 TODO found.
The code is incomplete, and not a valid proof yet.
---EXIT: 1
```

Replacing it with an undefined name:

```
Error:
- expected : a defined name
- observed : XXX_BROKEN
---EXIT: 1
```

Confirms that the type-checker *does* enforce law bodies, so the
E.6 success is genuine.

## E.9. Inline `match bf(h)` is forbidden at parse time

File: `/tmp/repro_inline_scrutinee.bend`. Source:

```bend
def f(+xs: List<&2, AB>) -> Nat:
  match xs:
    case Nil{}: 0n
    case h <> t:
      match bf(h):
        case True{}: 1n
        case False{}: f(t)
```

```
$ bun bend2/main.ts /tmp/repro_inline_scrutinee.bend
Error:
- message  : a parameter or field scrutinee (a match cannot
              scrutinize a computed value: give it its own def)
Location:
17 |     case h <> t:
18>|       match bf(h):
---EXIT: 1
```

This is why the LAWS-003 / LAWS-004 residual arms require the
step-def refactor: the inline form is *not* even a valid Bend
program. The refactor is not optional.

## E.10. `Equal.sym` / `Equal.trans` / `Equal.cong` are present in Base

```
$ grep -n 'def Equal\.' bend2/base.bend
366: def Equal.cong(A, B, f, a, b, e): ...
377: def Equal.sym(A, a, b, e): ...
390: def Equal.trans(A, a, b, c, ab, bc): ...
```

Canonical usage pattern: `tests/proof/equality_kit.bend`
(type-checks under `bun bend2/main.ts`).

These three primitives form the base of the QUALIFY02 toolkit.
