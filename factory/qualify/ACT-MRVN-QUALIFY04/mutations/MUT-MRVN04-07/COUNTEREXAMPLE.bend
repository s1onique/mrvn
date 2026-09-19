# ACT-MRVN-04 MUT-07 COUNTEREXAMPLE.bend -- the reason-only mutation:
# Halt+Agent+Active returns Deny{InsufficientEvidence{}} instead of
# Deny{WrongActor{}}.  LAW-011 `halt_active_agent_yields_wrong_actor`
# constrains the reason, so the canonical proof rejects this impl.
#
# This COUNTEREXAMPLE prints the impl's decision and shows it differs
# from the canonical (WrongActor) for the (Agent, Active, _) cell.

import Base
import ./main.bend as Gate

# Canonical reference: main.authorize(Agent, Halt, Active, _) = Deny{WrongActor{}}
# MUT-07 impl:        main.authorize(Agent, Halt, Active, _) = Deny{InsufficientEvidence{}}

def cell_decision() -> Gate.Decision:
  Gate.authorize(
    Gate.Actor.Agent{},
    Gate.Capability.Halt{},
    Gate.Lifecycle.Active{},
    Gate.Evidence.Live{}
  )

def tag_is_wrong_actor(d: Gate.Decision) -> Bool:
  match d:
    case Gate.Decision.Deny{Gate.DenyReason.WrongActor{}}:
      True{}
    case _:
      False{}

def tag_is_insufficient(d: Gate.Decision) -> Bool:
  match d:
    case Gate.Decision.Deny{Gate.DenyReason.InsufficientEvidence{}}:
      True{}
    case _:
      False{}

def main() -> Bool:
  tag_is_insufficient(cell_decision())
