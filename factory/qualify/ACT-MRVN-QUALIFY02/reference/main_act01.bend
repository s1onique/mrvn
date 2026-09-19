# ACT-MRVN-QUALIFY01 verdict kernel -- the implementation.
#
# Models a simplified deployment gate. A `Check` is either a `Required`
# check (fail blocks rollout) or an `Advisory` check (must not influence
# rollout status). `Rollout` is the verdict: Pass or Fail.
#
# `rollout_status` is the function under test. Its intended semantics:
#   rollout_status(checks) == Rollout.Fail
#     iff there exists at least one Required(Fail) check in `checks`.
# Advisory checks must not influence the verdict.

import Base

# Decision classes
# ----------------

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

# The function under proof
# ------------------------

def rollout_status(checks: List<&2, Check>) -> Rollout:
  match checks:
    case Nil{}:
      Rollout.Pass{}
    case ck <> rest:
      match ck:
        case Decision_Outcome{Decision.Required{}, Outcome.Fail{}}:
          Rollout.Fail{}
        case _:
          rollout_status(rest)

# append two lists -- right-associative recursion. Auxiliary; not the
# function under proof, but its structural recursion makes
# proof-by-induction on its left argument reduce cleanly on both sides
# of an equation.
def append(xs: List<&2, Check>, ys: List<&2, Check>) -> List<&2, Check>:
  match xs:
    case Nil{}:
      ys
    case h <> t:
      h <> append(t, ys)

# append a single check at the end of a list -- convenience for the
# laws, derived from `append`.
def append_one(xs: List<&2, Check>, c: Check) -> List<&2, Check>:
  append(xs, c <> Nil{})

def main() -> Rollout:
  rollout_status(Nil{})
