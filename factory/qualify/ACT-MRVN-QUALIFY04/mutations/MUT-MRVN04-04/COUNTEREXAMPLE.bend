# MUT-MRVN04-04 -- counterexample certificate
#
# Mutation: Automation + Work + Active -> Allow
# (canonical returns Deny{WrongActor{}}).
#
# Violated law: LAW-MRVN04-007 (Work iff work_actor_ok && work_lifecycle_ok).

import Base
import ./main.bend as Gate

def is_allowed(d: Gate.Decision) -> Bool:
  match d:
    case Gate.Decision.Allow{}:         True{}
    case Gate.Decision.Deny{reason}:    False{}

def mut_decision() -> Gate.Decision:
  Gate.authorize(
    Gate.Actor.Automation{}, Gate.Capability.Work{},
    Gate.Lifecycle.Active{}, Gate.Evidence.None{})

def main() -> Bool:
  is_allowed(mut_decision())
