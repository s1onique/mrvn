# ACT-MRVN-QUALIFY02 durable reproducer (BAD).
#
# Negative control: same shape, but the witness e asserts the wrong
# equality. The proof must reject this. The rejection must be at the
# equality-witness mismatch, not at a syntax/type error.

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

law otherwise_arm:
  for +h: AB
  for +t: List<&2, AB>
  for e: {bf(h) == True{} : Bool}   # WRONG: should be False{}
  {f(h <> t) == f(t) : Nat}

def otherwise_arm(h, t, e):
  Equal.cong(Bool, Nat, b => f.step(h, t, f(t), b), bf(h), True{}, e)

law main: IO(Unit)
def main():
  IO.print("ok")
