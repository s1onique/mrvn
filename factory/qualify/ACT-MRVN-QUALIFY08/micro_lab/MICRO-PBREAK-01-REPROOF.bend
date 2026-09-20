# MICRO-PBREAK-01-REPROOF: the REPAIR for MICRO-PBREAK-01-NAIVE.
#
# Same definition of `f`.  Same law.  But the proof uses the EXPLICIT
# `_` placeholder in the IH TYPE so the rewrite engine can substitute
# the goal's RHS into the rewritten LHS, giving `{0n == 0n : Nat}`
# which closes by {==}.
#
# This proves that:
#   1. The phenomenon (extensional = definitional gap) genuinely exists
#      in stock Bend.
#   2. The canonical proof style with `{f(p) == 0n : Nat}` fails.
#   3. A DIFFERENT proof style (using `{f(p) == _ : Nat}` as the IH type)
#      succeeds on the SAME definition.
#
# This is the canonical demonstration MRVN-08 needs.

import Base

def f(n: Nat) -> Nat:
  match n:
    case 0n:
      0n
    case 1n+p:
      f(p)

law f_zero:
  for +n: Nat
  {f(n) == 0n : Nat}

def f_zero(n):
  match n:
    case 0n:
      {==}
    case 1n+p:
      # KEY DIFFERENCE: the IH type has `_` instead of `0n`.
      # The placeholder lets the rewrite engine substitute 0n from
      # the goal RHS into the rewritten LHS.
      %f_zero(p) : {f(p) == _ : Nat}
      {==}

law main:
  {f(2n) == 0n : Nat}

def main(): f_zero(2n)

#|{==}
