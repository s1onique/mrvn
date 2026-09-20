# MICRO-PBREAK-01-NAIVE: the "naive" canonical-style proof that FAILS.
#
# `f(n)` is extensionally always 0n (its body always returns 0n in the
# zero case, otherwise it recurses WITHOUT wrapping a `1n+` constructor).
# The naive proof pattern `{==} in both cases` is rejected by Bend's
# checker because the WNF of `f(1n+p)` is a match expression, not
# literally `0n`.  The induction hypothesis `%f_zero(p) : {f(p) ==
# 0n : Nat}` does NOT cause the outer goal's LHS to be rewritten.

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
      %f_zero(p) : {f(p) == 0n : Nat}
      {==}

law main:
  {f(2n) == 0n : Nat}

def main(): f_zero(2n)

#|Error:
#|- expected : f(p)
#|- observed : 0n
#|exit 1
