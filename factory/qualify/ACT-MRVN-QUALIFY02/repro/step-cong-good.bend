# ACT-MRVN-QUALIFY02 durable reproducer (GOOD).
#
# Establishes that the property-based IH lift pattern that blocks
# LAWS-003/004 in ACT01 discharges with:
#   - step-def extraction (match on a Bool parameter)
#   - live equality witness
#   - Equal.cong to transport through the step-def
#
# This is the *primary hypothesis* to test in this ACT.

import Base

type AB is Data:
  C{x: Bool}
  D{x: Bool}

def bf(c: AB) -> Bool:
  match c:
    case C{b}: b
    case D{b}: b

# Step-def: matches on the bf parameter (which Bend allows), not on
# a computed value.
def f.step(h: AB, rest: List<&2, AB>, +rec: Nat, bf_h: Bool) -> Nat:
  match bf_h:
    case True{}:
      1n
    case False{}:
      rec

def f(+xs: List<&2, AB>) -> Nat:
  match xs:
    case Nil{}:
      0n
    case h <> t:
      f.step(h, t, f(t), bf(h))

# Goal: if bf(h) == False, then f(h <> t) == f(t).
law otherwise_arm:
  for +h: AB
  for +t: List<&2, AB>
  for e: {bf(h) == False{} : Bool}
  {f(h <> t) == f(t) : Nat}

def otherwise_arm(h, t, e):
  # The cong's f is (b: Bool) -> f.step(h, t, f(t), b).  This is Bool -> Nat.
  Equal.cong(Bool, Nat, b => f.step(h, t, f(t), b), bf(h), False{}, e)

law main: IO(Unit)
def main():
  IO.print("ok")
