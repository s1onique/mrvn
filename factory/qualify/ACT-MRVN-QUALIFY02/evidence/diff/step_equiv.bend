# ACT-MRVN-QUALIFY02 step_equiv.bend -- formal equivalence between two impls
# of rollout_status in the SAME namespace.
#
# impl_with_wildcard: the original ACT01 form, with `case _:` catchall.
# impl_with_3arms:    the refactored ACT02 form, with explicit 3-arm case split.
#
# Both are type-compatible (share the same Check and Rollout types) and
# therefore amenable to a direct formal proof of pointwise equivalence.

import Base

type Decision is Data:
  Decision.Required{}
  Decision.Advisory{}

type Outcome is Data:
  Outcome.Pass{}
  Outcome.Fail{}

type Check is Data:
  Decision_Outcome{cls: Decision, outcome: Outcome}

type Rollout is Data:
  Rollout.Pass{}
  Rollout.Fail{}

# Reference impl: with `case _:` catchall (ACT01 form).
def impl_with_wildcard(checks: List<&2, Check>) -> Rollout:
  match checks:
    case Nil{}:
      Rollout.Pass{}
    case ck <> rest:
      match ck:
        case Decision_Outcome{Decision.Required{}, Outcome.Fail{}}:
          Rollout.Fail{}
        case _:
          impl_with_wildcard(rest)

# Refactored impl: explicit 3-arm case split (ACT02 form).
def impl_with_3arms(checks: List<&2, Check>) -> Rollout:
  match checks:
    case Nil{}:
      Rollout.Pass{}
    case ck <> rest:
      match ck:
        case Decision_Outcome{Decision.Required{}, Outcome.Fail{}}:
          Rollout.Fail{}
        case Decision_Outcome{Decision.Required{}, Outcome.Pass{}}:
          impl_with_3arms(rest)
        case Decision_Outcome{Decision.Advisory{}, _}:
          impl_with_3arms(rest)

# Prove: impl_with_wildcard(xs) == impl_with_3arms(xs) for all xs.
# By structural induction on xs.
# Base: Nil{} -> both reduce to Pass{}.  {==} discharges.
# Step: h <> t.  Case-split on h's full (Decision, Outcome) constructor.
#   In each arm, both impls reduce identically:
#     - h = Required+Fail: both reduce to Fail{}.
#     - h = Required+Pass: both recurse on t (IH applies).
#     - h = Advisory+*:   both recurse on t (IH applies).

def rollout_status_equiv(+xs: List<&2, Check>)
  -> {impl_with_wildcard(xs) == impl_with_3arms(xs) : Rollout}:
  match xs:
    case Nil{}:
      {==}
    case h <> t:
      match h:
        case Decision_Outcome{Decision.Required{}, Outcome.Fail{}}:
          # Both reduce to Fail{} directly.
          {==}
        case Decision_Outcome{Decision.Required{}, Outcome.Pass{}}:
          # Both recurse on t.  Compose with IH.
          rollout_status_equiv(t)
        case Decision_Outcome{Decision.Advisory{}, _}:
          # Both recurse on t.  Compose with IH.
          rollout_status_equiv(t)

law main: IO(Unit)
def main():
  IO.print("step_equiv: proved within a single namespace")
