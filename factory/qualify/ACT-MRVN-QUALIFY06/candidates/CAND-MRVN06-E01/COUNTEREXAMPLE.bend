# ACT-MRVN-06 auto-generated COUNTEREXAMPLE.bend.
# Witness: Reviewer,Halt,Active,Live
# Expected (canonical): Allow

import Base
import ./main.bend as Gate

def expected_decision() -> Gate.Decision:
  Gate.Decision.Allow{}

def observed() -> Gate.Decision:
  Gate.authorize(
    Gate.Actor.Reviewer{},
    Gate.Capability.Halt{},
    Gate.Lifecycle.Active{},
    Gate.Evidence.Live{})

def differs(d: Gate.Decision) -> Bool:
  match d:
    case Gate.Decision.Allow{}:
      False{}
    case Gate.Decision.Deny{obs}:
      match obs:
        case Gate.DenyReason.Terminal{}: True{}
        case Gate.DenyReason.WrongActor{}: True{}
        case Gate.DenyReason.WrongLifecycle{}: True{}
        case Gate.DenyReason.InsufficientEvidence{}: True{}

def main() -> Bool:
  differs(observed())
