# MUT-MRVN04-01 -- counterexample certificate (CORRECTION01).
#
# Mutation: Agent + Freeze + Active + Live -> Allow
# (canonical returns Deny{WrongActor{}}).
#
# Violated law: LAW-MRVN04-002 (agent_cannot_freeze).
#
# Law-bound: this certificate pins the violated LAW by name and
# predicate shape, instantiates the universal quantifier of
# agent_cannot_freeze on (s=Active, e=Live), and computes whether the
# mutant's decision violates the law's body
#   is_allowed(authorize(Agent, Freeze, Active, Live)) == False{}.
# The certificate prints True{} iff the mutant's is_allowed is True{},
# i.e. iff the law is violated.

import Base
import ./main.bend as Gate

def is_allowed(d: Gate.Decision) -> Bool:
  match d:
    case Gate.Decision.Allow{}:         True{}
    case Gate.Decision.Deny{reason}:    False{}

# Mirrors the predicate shape of Laws.agent_cannot_freeze's body
# at the (Active, Live) instantiation.
def law_predicate_at_active_live() -> Bool:
  is_allowed(Gate.authorize(
    Gate.Actor.Agent{}, Gate.Capability.Freeze{},
    Gate.Lifecycle.Active{}, Gate.Evidence.Live{}))

def main() -> Bool:
  law_predicate_at_active_live()
