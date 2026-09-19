# ACT-MRVN-04 MUT-08 EQUIV.bend -- silent reason-mutation probe.
#
# MUT-08 changes Close+Reviewer+Frozen+Replay from
# Deny{InsufficientEvidence{}} to Deny{Terminal{}}.  No LAW constrains
# the reason of THIS cell, so the canonical PROOF passes (the reason
# is not part of any law's premise or conclusion for this cell).
#
# However, semantic equivalence is broken: canonical expects
# InsufficientEvidence, MUT-08 returns Terminal.  This EQUIV file
# prints False{} to flag the divergence -- a SURVIVED/NON_EQUIVALENT
# classification.

import Base
import ./main.bend as Gate

def canonical_reason_close_reviewer_frozen_replay() -> Gate.DenyReason:
  # What the canonical impl returns for this cell:
  #   close_decision(Reviewer, Frozen, Replay) -> Deny{InsufficientEvidence{}}
  Gate.DenyReason.InsufficientEvidence{}

def cell_decision() -> Gate.Decision:
  Gate.authorize(
    Gate.Actor.Reviewer{},
    Gate.Capability.Close{},
    Gate.Lifecycle.Frozen{},
    Gate.Evidence.Replay{}
  )

def reason_of(d: Gate.Decision) -> Gate.DenyReason:
  match d:
    case Gate.Decision.Allow{}:
      Gate.DenyReason.Terminal{}  # placeholder; Allow has no reason
    case Gate.Decision.Deny{r}:
      r

def same_reason(d: Gate.Decision, r: Gate.DenyReason) -> Bool:
  match d:
    case Gate.Decision.Allow{}:
      False{}
    case Gate.Decision.Deny{inner}:
      match inner:
        case Gate.DenyReason.Terminal{}:
          match r:
            case Gate.DenyReason.Terminal{}: True{}
            case _: False{}
        case Gate.DenyReason.WrongActor{}:
          match r:
            case Gate.DenyReason.WrongActor{}: True{}
            case _: False{}
        case Gate.DenyReason.WrongLifecycle{}:
          match r:
            case Gate.DenyReason.WrongLifecycle{}: True{}
            case _: False{}
        case Gate.DenyReason.InsufficientEvidence{}:
          match r:
            case Gate.DenyReason.InsufficientEvidence{}: True{}
            case _: False{}

def main() -> Bool:
  same_reason(cell_decision(), canonical_reason_close_reviewer_frozen_replay())
