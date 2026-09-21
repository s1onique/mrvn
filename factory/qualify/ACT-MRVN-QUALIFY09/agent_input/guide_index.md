# Bend proof guide summary (relevant to MRVN-09 candidates)

Point-form summary of the Bend guide sections most relevant to the
canonical PROOF and any REPROOF you may attempt.  You should consult
the upstream guide (in the parent repo at `guide/GUIDE.md`) if you
need full context; this index is sufficient for the most common
discharge patterns.

## Affine discipline

* Nested match scrutinees MUST be in binder order.
* In `authorize(actor, capability, lifecycle, evidence)`, binder
  order is `(actor, capability, lifecycle, evidence)`.  Therefore
  the outer match is on `actor` or `capability`, then
  `lifecycle`, then `evidence`.
* Bend will REJECT matches whose scrutinees are not in binder order.
  Typical diagnostic: `"an undestructed scrutinee"`.
* Defined-name rule: a `def` is visible only AFTER it is declared.
  Forward references to undefined names fail with `"a defined name"`.

## Definitional equality (==) / rewrite (%e)

* `{==}` discharges when both sides reduce to the same WNF.
* `%e : {L == R : T}` is a rewriter: under `%e`, occurrences of `L`
  may be replaced by `R`.
* `%e` typing:  `e` must have type `{L == R : T}`; the type-checker
  then unfolds `L` and `R` and substitutes.

## Equality helpers (Base)

* `Equal.sym(T, a, b, e) : {b == a : T}` — symmetrise.
* `Equal.trans(T, a, b, c, e_ab, e_bc) : {a == c : T}` — chain.
* `Equal.cong(T1, T2, f, x, y, e_xy) : {f(x) == f(y) : T2}` —
  congruence under `f`.
* `Equal.mirror(T, a, b, e) : {b == a : T}` (alias).

## Empty / contradiction

* Standard idiom: witness `True{} == False{} : Bool` to obtain
  `Empty`; then `Empty`-eliminate any target.

## Pattern matching

* `match x: case Ctor{...}: body` exhaustive on a data type's
  constructors; a missing case is a type error.
* Nested `match` requires binder order.
* No catchall `case _:` is permitted in the canonical kernel.

## Proofs-as-definitions

* `def p(...) -> {L == R : T}: ...` is a proof term.
* If both sides reduce to identical WNF, `{==}` discharges.
* If they don't, the proof term needs a rewriter (`%e`) or an
  induction / helper.

## Induction / recursion

* Recursive `def` may require explicit `use` annotations; the
  Bend checker enforces termination.
* For the canonical kernel, exhaustive 3*4*5*3 case-splits
  typically suffice; induction over `Nat` is unnecessary.

## The _-placeholder IH-rewrite

The diagnostic pattern when canonical {==} does NOT discharge is
that the implementation's WNF differs from the law body's WNF.  A
reproof can use an explicit `_` placeholder:

```bend
def repf_zero(p: Nat) -> {f(p) == _ : Nat}:
  {==}
```

This says "the LHS reduces to `_`", and `{==}` discharges if `_` is
correctly substituted by the rewrite engine from the surrounding
goal.  This is stock Bend; no checker patches required.

## Useful Base forms

* `Bool.True{}`, `Bool.False{}`
* `Unit{}`, `Unit` (the type with sole inhabitant `Unit{}`)
* `Empty` (the type with no inhabitants)
* `Maybe.bind`, `Maybe.map`, etc. (for `Maybe`-style helpers)

## Imports

* `import Base` exposes equality helpers and standard types.
* `import ./otherfile.bend as Mod` exposes a module's public surface.

## Forbidden

* `?TODO`
* `?name` final-proof stubs
* `@unsafe`
* foreign imports (C, JS)
* checker edits

## Sanity-check pattern

A good sanity check before declaring a candidate "done" is to run
the canonical `PROOF.bend` byte-identical against your `main.bend`.
If it passes, your candidate classifies as `CANONICAL_PROOF_SURVIVED`.
If it fails, capture the exit code and the first error line — that
is your `canonical_failure_excerpt` for `result.json`.