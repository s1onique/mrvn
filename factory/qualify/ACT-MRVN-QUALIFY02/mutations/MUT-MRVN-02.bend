# MUT-MRVN-02: BUG -- Required+Pass now causes Fail, AND Advisory+Fail is treated as Required+Fail.
# 
# Net effect: rollout_status([advisory_fail]) = Fail (incorrectly), and rollout_status([required_pass]) = Fail (incorrectly).

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

# BUG: blocking_fail now also returns True for Advisory+Fail, AND the rollout
# considers Required ANY outcome as blocking.
def rollout_status(checks: List<&2, Check>) -> Rollout:
  match checks:
    case Nil{}:
      Rollout.Pass{}
    case ck <> rest:
      match ck:
        case Decision_Outcome{Decision.Required{}, _}:
          # BUG: Required ANY outcome blocks (only Required+Fail should).
          Rollout.Fail{}
        case Decision_Outcome{Decision.Advisory{}, Outcome.Fail{}}:
          # BUG: Advisory+Fail now blocks (it shouldn't).
          Rollout.Fail{}
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
