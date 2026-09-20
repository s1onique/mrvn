# MICRO-DRIFT-01 (PASS-form): Two definitions where the robust equality
# holds.  This is the same file as MICRO-DRIFT-01-FULL, but with only
# the robust law proven.  The drift claim MUST be provable for the
# file to exit 0; we therefore strip it out here.
#
# We keep the definitions visible.  This is a control: the canonical
# `alt_add_ignores_a` returns b for any a.  Both:
#   canon_add(0n, b) == alt_add_ignores_a(0n, b) == b
#   canon_add(0n, b) == b
# are valid equalities.
#
# The DRIFT form (see MICRO-DRIFT-01-FAIL.bend) writes
# `{canon_add(a, b) == alt_add_ignores_a(a, b) : Nat}` for general a
# and the checker correctly REJECTS it.

import Base

def canon_add(a: Nat, b: Nat) -> Nat:
  match a:
    case 0n:
      b
    case 1n+p:
      1n+canon_add(p, b)

def alt_add_ignores_a(a: Nat, b: Nat) -> Nat:
  b

law robust_zero_only:
  for +b: Nat
  {canon_add(0n, b) == alt_add_ignores_a(0n, b) : Nat}

def robust_zero_only(b):
  {==}

law main:
  {canon_add(0n, 3n) == alt_add_ignores_a(0n, 3n) : Nat}

def main(): robust_zero_only(3n)

#|{==}
