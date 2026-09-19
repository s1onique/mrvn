# MUT-MRVN04-03 -- counterexample certificate
#
# Mutation: Reviewer + Close + Active + Live -> Allow
# (canonical returns Deny{WrongLifecycle{}}).
#
# Violated law: LAW-MRVN04-005 (Close requires Frozen).

import Base
import ./main.bend as Gate

def is_allowed(d: Gate.Decision) -> Bool:
  match d:
    case Gate.Decision.Allow{}:         True{}
    case Gate.Decision.Deny{reason}:    False{}

def mut_decision() -> Gate.Decision:
  Gate.authorize(
    Gate.Actor.Reviewer{}, Gate.Capability.Close{},
    Gate.Lifecycle.Active{}, Gate.Evidence.Live{})

def main() -> Bool:
  is_allowed(mut_decision())
