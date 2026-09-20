# MICRO-DRIFT-01-FAIL: companion to MICRO-DRIFT-01.bend.
#
# This file attempts to prove the GENERAL equality
#   {canon_add(a, b) == alt_add_ignores_a(a, b) : Nat}
# which is FALSE for a = 1n+p (lhs is 1n+..., rhs is just b).
#
# Expected: Bend REJECTS this with exit code != 0 and an error like
#   expected : {1n+canon_add(p, b) == b : Nat}
#   observed : {1n+canon_add(p, b) == 1n+b : Nat}
#
# This is the DRIFT CONTROL: when two terms are NOT extensionally equal,
# the checker correctly distinguishes them and refuses to discharge the
# case with {==}.

import Base

def canon_add(a: Nat, b: Nat) -> Nat:
  match a:
    case 0n:
      b
    case 1n+p:
      1n+canon_add(p, b)

def alt_add_ignores_a(a: Nat, b: Nat) -> Nat:
  b

law drift_general_fails:
  for +a: Nat
  for +b: Nat
  {canon_add(a, b) == alt_add_ignores_a(a, b) : Nat}

def drift_general_fails(a, b):
  match a:
    case 0n:
      {==}
    case 1n+p:
      %drift_general_fails(p, b) : {1n+canon_add(p, b) == 1n+_ : Nat}
      {==}

law main:
  {canon_add(2n, 3n) == alt_add_ignores_a(2n, 3n) : Nat}

def main(): drift_general_fails(2n, 3n)

#|Error:
#|- expected : {1n+canon_add(p, b) == b : Nat}
#|- observed : {1n+canon_add(p, b) == 1n+b : Nat}
#|exit 1
