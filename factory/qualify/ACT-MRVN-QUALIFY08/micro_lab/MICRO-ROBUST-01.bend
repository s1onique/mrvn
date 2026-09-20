# MICRO-ROBUST-01: Two structurally identical definitions, {==} succeeds.
#
# CONTROL: this is the case where both `canon_add` and `alt_add` reduce
# to the exact same closed form.  The proof discharges by mere {==}.

import Base

def canon_add(a: Nat, b: Nat) -> Nat:
  match a:
    case 0n:
      b
    case 1n+p:
      1n+canon_add(p, b)

def alt_add(a: Nat, b: Nat) -> Nat:
  match a:
    case 0n:
      b
    case 1n+p:
      1n+alt_add(p, b)

law robust_add_equiv:
  for +a: Nat
  for +b: Nat
  {canon_add(a, b) == alt_add(a, b) : Nat}

def robust_add_equiv(a, b):
  match a:
    case 0n:
      {==}
    case 1n+p:
      %robust_add_equiv(p, b) : {1n+canon_add(p, b) == 1n+_ : Nat}
      {==}

law main:
  {canon_add(2n, 3n) == alt_add(2n, 3n) : Nat}

def main(): robust_add_equiv(2n, 3n)

#|{==}
