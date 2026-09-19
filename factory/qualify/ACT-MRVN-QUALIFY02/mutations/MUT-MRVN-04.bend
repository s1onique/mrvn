# MUT-MRVN-04: Advisory+Fail now ALWAYS triggers fail (bug).

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

def blocking_fail(c: Check) -> Bool:
  match c:
    case Decision_Outcome{Decision.Required{}, Outcome.Fail{}}:
      True{}
    case _:
      False{}

# BUG: Advisory+Fail anywhere triggers rollout fail
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
        case Decision_Outcome{Decision.Advisory{}, Outcome.Fail{}}:
          Rollout.Fail{}  # BUG
        case Decision_Outcome{Decision.Advisory{}, Outcome.Pass{}}:
          rollout_status(rest)

def append(xs: List<&2, Check>, ys: List<&2, Check>) -> List<&2, Check>:
  match xs:
    case Nil{}:
      ys
    case h <> t:
      h <> append(t, ys)

def main() -> Rollout:
  rollout_status(Nil{})
