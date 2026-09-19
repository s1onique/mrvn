# ACT-MRVN-QUALIFY02 verdict kernel -- the implementation (refactored).
#
# rollout_status semantics:
#   rollout_status(checks) == Fail iff there exists at least one Required(Fail) check.
# Advisory checks must not influence the verdict.
#
# ACT02 implementation note: the body of rollout_status's h <> t arm
# case-splits directly on ck (a constructor-pattern variable), not on
# a computed value. This is the standard inline-match form; the WNF
# unfolds the inner match because ck is a parameter bound by the
# outer case pattern, and the four (Decision, Outcome) cases all
# have constructor-headed match patterns.

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

# Canonical classifier shared by implementation and proof (in LAWS.bend).
def blocking_fail(c: Check) -> Bool:
  match c:
    case Decision_Outcome{Decision.Required{}, Outcome.Fail{}}:
      True{}
    case _:
      False{}

def rollout_status(checks: List<&2, Check>) -> Rollout:
  match checks:
    case Nil{}:
      Rollout.Pass{}
    case ck <> rest:
      match ck:
        case Decision_Outcome{Decision.Required{}, Outcome.Fail{}}:
          Rollout.Fail{}
        case Decision_Outcome{Decision.Required{}, Outcome.Pass{}}:
          rollout_status(rest)
        case Decision_Outcome{Decision.Advisory{}, _}:
          rollout_status(rest)

def append(xs: List<&2, Check>, ys: List<&2, Check>) -> List<&2, Check>:
  match xs:
    case Nil{}:
      ys
    case h <> t:
      h <> append(t, ys)

def append_one(xs: List<&2, Check>, c: Check) -> List<&2, Check>:
  append(xs, c <> Nil{})

def main() -> Rollout:
  rollout_status(Nil{})
