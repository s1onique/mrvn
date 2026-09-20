# MICRO-PBREAK-01-CANON: the canonical "always 0n" function whose recursion
# branch directly returns `canon(p)`.  Its proof uses the explicit `_`
# placeholder in the IH type for the same reason MICRO-PBREAK-01-REPROOF
# does: the recursion branch produces a NAMED call `canon(p)` that the
# body does not reduce to `0n` literally.
#
# This is the CONTROL companion for MICRO-PBREAK-01-NAIVE: both files
# have the SAME EXTENSION (`{==} 0n` for all n) but different BODY SHAPE,
# and both need the explicit `_` placeholder in the IH type.

import Base

def canon(n: Nat) -> Nat:
  match n:
    case 0n:
      0n
    case 1n+p:
      canon(p)

law canon_zero_law:
  for +n: Nat
  {canon(n) == 0n : Nat}

def canon_zero_law(n):
  match n:
    case 0n:
      {==}
    case 1n+p:
      %canon_zero_law(p) : {canon(p) == _ : Nat}
      {==}

law main:
  {canon(3n) == 0n : Nat}

def main(): canon_zero_law(3n)

#|{==}
