# ACT-MRVN-06 auto-generated COUNTEREXAMPLE.bend.
# Witness: Reviewer,Close,Frozen,Replay
# Expected (canonical): Deny{InsufficientEvidence}

import Base
import ./main.bend as Gate

def expected_decision() -> Gate.Decision:
  Gate.Decision.Deny{Gate.DenyReason.InsufficientEvidence{}}

def observed() -> Gate.Decision:
  Gate.authorize(
    Gate.Actor.Reviewer{},
    Gate.Capability.Close{},
    Gate.Lifecycle.Frozen{},
    Gate.Evidence.Replay{})

def differs(d: Gate.Decision) -> Bool:
  match d:
    case Gate.Decision.Allow{}:
      True{}
    case Gate.Decision.Deny{obs}:
      match obs:
        case Gate.DenyReason.Terminal{}: True{}
        case Gate.DenyReason.WrongActor{}: True{}
        case Gate.DenyReason.WrongLifecycle{}: True{}
        case Gate.DenyReason.InsufficientEvidence{}: False{}

def main() -> Bool:
  differs(observed())
