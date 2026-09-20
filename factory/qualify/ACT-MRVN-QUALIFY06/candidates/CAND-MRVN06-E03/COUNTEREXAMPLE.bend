# ACT-MRVN-06 auto-generated COUNTEREXAMPLE.bend.
# Witness: Reviewer,Work,Frozen,Live
# Expected (canonical): Deny{WrongLifecycle}

import Base
import ./main.bend as Gate

def expected_decision() -> Gate.Decision:
  Gate.Decision.Deny{Gate.DenyReason.WrongLifecycle{}}

def observed() -> Gate.Decision:
  Gate.authorize(
    Gate.Actor.Reviewer{},
    Gate.Capability.Work{},
    Gate.Lifecycle.Frozen{},
    Gate.Evidence.Live{})

def differs(d: Gate.Decision) -> Bool:
  match d:
    case Gate.Decision.Allow{}:
      True{}
    case Gate.Decision.Deny{obs}:
      match obs:
        case Gate.DenyReason.Terminal{}: True{}
        case Gate.DenyReason.WrongActor{}: True{}
        case Gate.DenyReason.WrongLifecycle{}: False{}
        case Gate.DenyReason.InsufficientEvidence{}: True{}

def main() -> Bool:
  differs(observed())
