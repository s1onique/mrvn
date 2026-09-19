# MUT-MRVN04-02 -- counterexample certificate
#
# Mutation: Reviewer + Close + Frozen + Replay -> Allow
# (canonical returns Deny{InsufficientEvidence{}}).
#
# Violated law: LAW-MRVN04-003 (replay_cannot_authorize_close),
# LAW-MRVN04-005 (reviewer_close_iff_reviewer_frozen_live).
#
# Strategy: runtime demonstration.  We compute the mutant's
# is_allowed(authorize(Reviewer, Close, Frozen, Replay)) and print
# it.  Under the mutant, this prints True{}; the law requires False{}.

import Base
import ./main.bend as Gate

def is_allowed(d: Gate.Decision) -> Bool:
  match d:
    case Gate.Decision.Allow{}:         True{}
    case Gate.Decision.Deny{reason}:    False{}

def mut_decision() -> Gate.Decision:
  Gate.authorize(
    Gate.Actor.Reviewer{}, Gate.Capability.Close{},
    Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{})

def main() -> Bool:
  is_allowed(mut_decision())
