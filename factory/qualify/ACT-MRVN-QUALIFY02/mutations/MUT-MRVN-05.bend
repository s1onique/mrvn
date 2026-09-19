# MUT-MRVN-05: BUG-style -- a "satisfies the laws" probe.
# 
# Implementation: rollout_status returns Pass iff count(advisory_pass) >= count(required_fail).
# This satisfies LAWS-001 (advisory doesn't block), LAWS-002 (required_fail in head -> count(required_fail) >= 1,
#   which might still have enough advisory_pass to balance), etc.
# 
# Actually this MUT is hard to make consistent with all 4 laws.
# A simpler MUT-05: a well-intentioned but wrong impl that "looks right" but is non-compliant.

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

# BUG: This implementation counts the number of Required+Fail, and:
# - If 0: Pass
# - If 1: Pass (BUG: should be Fail!)
# - If 2: Fail
# - If >= 3: Pass (BUG: should still be Fail!)
# 
# This satisfies LAWS-001 (advisory doesn't change), LAWS-002 (RF+anything -> Fail).
# Violates LAWS-003 (no_block implies Pass): xs=[required_fail], any_blocking_fail=False? No wait, RF means True. Hmm.
# 
# Actually xs=[required_fail] gives any_blocking_fail=True, so the no_block hypothesis is false.  LAWS-003 is vacuously true.
# Hmm. So MUT-05 might satisfy ALL the laws.
# 
# Let me verify with a runtime test: rollout_status([required_fail]) under MUT-05.
# count = 1 -> BUG: Pass.

def count_rf(checks: List<&2, Check>) -> Nat:
  match checks:
    case Nil{}:
      Zero{}
    case h <> t:
      match h:
        case Decision_Outcome{Decision.Required{}, Outcome.Fail{}}:
          Succ{count_rf(t)}
        case _:
          count_rf(t)

def verdict_from_count(+n: Nat) -> Rollout:
  match n:
    case Zero{}:
      Rollout.Pass{}
    case Succ{Zero{}}:
      Rollout.Pass{}  # BUG: 1 RF should be Fail
    case Succ{Succ{Zero{}}}:
      Rollout.Fail{}
    case Succ{Succ{Succ{_}}}:
      Rollout.Pass{}  # BUG: 3+ RF should still be Fail

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
