# ACT-MRVN-06 auto-generated COUNTEREXAMPLE.bend.
# Witness: Agent,Halt,Active,None
# Expected (canonical): Deny{WrongActor}

import Base
import ./main.bend as Gate

def expected_decision() -> Gate.Decision:
  Gate.Decision.Deny{Gate.DenyReason.WrongActor{}}

def observed() -> Gate.Decision:
  Gate.authorize(
    Gate.Actor.Agent{},
    Gate.Capability.Halt{},
    Gate.Lifecycle.Active{},
    Gate.Evidence.None{})

def differs(d: Gate.Decision) -> Bool:
  match d:
    case Gate.Decision.Allow{}:
      True{}
    case Gate.Decision.Deny{obs}:
      match obs:
        case Gate.DenyReason.Terminal{}: True{}
        case Gate.DenyReason.WrongActor{}: False{}
        case Gate.DenyReason.WrongLifecycle{}: True{}
        case Gate.DenyReason.InsufficientEvidence{}: True{}

def main() -> Bool:
  differs(observed())
