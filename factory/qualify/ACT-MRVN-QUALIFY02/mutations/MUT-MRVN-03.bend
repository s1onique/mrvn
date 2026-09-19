# MUT-MRVN-03: BUG -- only triggers fail when there are 2+ Required+Fail
# (single Required+Fail is silently ignored).

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

def count_rf(checks: List<&2, Check>) -> Nat:
  match checks:
    case Nil{}:
      0n
    case h <> t:
      match h:
        case Decision_Outcome{Decision.Required{}, Outcome.Fail{}}:
          Nat.add(1n, count_rf(t))
        case _:
          count_rf(t)

# BUG: only fails when count >= 2 (correct behavior is >= 1)
def verdict_from_count(+n: Nat) -> Rollout:
  match n:
    case Zero{}:
      Rollout.Pass{}
    case Succ{Succ{_}}:
      Rollout.Fail{}
    case Succ{_}:
      Rollout.Pass{}  # BUG: 1 RF should fail!

def rollout_status(checks: List<&2, Check>) -> Rollout:
  verdict_from_count(count_rf(checks))

def append(xs: List<&2, Check>, ys: List<&2, Check>) -> List<&2, Check>:
  match xs:
    case Nil{}:
      ys
    case h <> t:
      h <> append(t, ys)

def main() -> Rollout:
  rollout_status(Nil{})
