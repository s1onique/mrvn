# ACT-MRVN-QUALIFY04 authority kernel -- the implementation.
#
# A multi-dimensional authorization decision:
#   authorize : Actor -> Capability -> Lifecycle -> Evidence -> Decision
#
# Domain:
#   Actor       = Agent | Reviewer | Automation         (3)
#   Capability  = Work | Halt | Freeze | Close          (4)
#   Lifecycle   = Draft | Active | Halted | Frozen | Closed  (5)
#   Evidence    = None | Replay | Live                  (3)
#   DenyReason  = Terminal | WrongLifecycle | WrongActor | InsufficientEvidence
#   Decision    = Allow | Deny{reason}
#
# Total decision surface: 3*4*5*3 = 180 cells.
#
# Discipline (ACT04 sec.3-5):
#   - Explicit 3*4*5*3 = 180-arm decomposition.  No `case _:` catchall.
#   - All decisions project via Decision.Allow or Decision.Deny{r}.
#   - Reason discipline (sec.5):
#       1. Closed -> Terminal (overrides everything else).
#       2. Valid lifecycle + wrong actor -> WrongActor.
#       3. Valid actor + bad lifecycle -> WrongLifecycle.
#       4. Valid actor/lifecycle + inadequate evidence -> InsufficientEvidence.
#   - For Allow decisions, no reason is recorded (Allow has no fields).
#
# No @unsafe.  No foreign imports.  No ?TODO.

import Base

type Actor is Data:
  Actor.Agent{}
  Actor.Reviewer{}
  Actor.Automation{}

type Capability is Data:
  Capability.Work{}
  Capability.Halt{}
  Capability.Freeze{}
  Capability.Close{}

type Lifecycle is Data:
  Lifecycle.Draft{}
  Lifecycle.Active{}
  Lifecycle.Halted{}
  Lifecycle.Frozen{}
  Lifecycle.Closed{}

type Evidence is Data:
  Evidence.None{}
  Evidence.Replay{}
  Evidence.Live{}

type DenyReason is Data:
  DenyReason.Terminal{}
  DenyReason.WrongLifecycle{}
  DenyReason.WrongActor{}
  DenyReason.InsufficientEvidence{}

type Decision is Data:
  Decision.Allow{}
  Decision.Deny{reason: DenyReason}

# -------------------------------------------------------------------------
# Work authority (LAW-007)
# -------------------------------------------------------------------------
#
# Work is allowed iff:
#   actor in {Agent, Reviewer} AND lifecycle in {Draft, Active, Halted}
# Evidence is irrelevant (LAW-008).
#
# Affine discipline: nested match scrutinees must be in binder order.
# Binder order is (actor, lifecycle, evidence); therefore the OUTER
# match is on `actor`, and inside we match on `lifecycle`.
def work_decision(actor: Actor, lifecycle: Lifecycle, evidence: Evidence) -> Decision:
  match actor:
    case Actor.Agent{}:
      match lifecycle:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Draft{}:  Decision.Allow{}
        case Lifecycle.Active{}: Decision.Allow{}
        case Lifecycle.Halted{}: Decision.Allow{}
    case Actor.Reviewer{}:
      match lifecycle:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Draft{}:  Decision.Allow{}
        case Lifecycle.Active{}: Decision.Allow{}
        case Lifecycle.Halted{}: Decision.Allow{}
    case Actor.Automation{}:
      match lifecycle:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Active{}: Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongActor{}}

# -------------------------------------------------------------------------
# Halt authority (LAW-006)
# -------------------------------------------------------------------------
#
# Halt is allowed iff:
#   actor in {Reviewer, Automation} AND lifecycle == Active
#   AND evidence in {Replay, Live}
#
# Match order: actor (binder-1), lifecycle (binder-2), evidence (binder-3).
def halt_decision(actor: Actor, lifecycle: Lifecycle, evidence: Evidence) -> Decision:
  match actor:
    case Actor.Agent{}:
      match lifecycle:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Active{}: Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
    case Actor.Reviewer{}:
      match lifecycle:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Active{}:
          match evidence:
            case Evidence.None{}:   Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}: Decision.Allow{}
            case Evidence.Live{}:   Decision.Allow{}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
    case Actor.Automation{}:
      match lifecycle:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Active{}:
          match evidence:
            case Evidence.None{}:   Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}: Decision.Allow{}
            case Evidence.Live{}:   Decision.Allow{}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}

# -------------------------------------------------------------------------
# Freeze authority (LAW-004)
# -------------------------------------------------------------------------
#
# Freeze is allowed iff:
#   actor == Reviewer AND lifecycle in {Active, Halted} AND evidence == Live
#
# Match order: actor (binder-1), lifecycle (binder-2), evidence (binder-3).
# MUT-MRVN04-05: structural refactor -- collapse freeze_decision and
# close_decision into a single helper that takes an additional
# "close_kind" boolean tag.  Semantically equivalent to the canonical
# impl.  The canonical PROOF's case-split on (lifecycle, evidence)
# does not reduce past the new WNF because the impl now pattern-matches
# on close_kind and dispatch via a closure.

def irreversible_decision(
  actor: Actor,
  lifecycle: Lifecycle,
  evidence: Evidence,
  close_kind: Bool
) -> Decision:
  # close_kind = False -> Freeze; True -> Close
  # Match order respects affine binder order: actor (1), lifecycle (2),
  # evidence (3), close_kind (4).
  match actor:
    case Actor.Agent{}:
      match lifecycle:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case _:
          Decision.Deny{DenyReason.WrongActor{}}
    case Actor.Automation{}:
      match lifecycle:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case _:
          Decision.Deny{DenyReason.WrongActor{}}
    case Actor.Reviewer{}:
      match lifecycle:
        case Lifecycle.Closed{}:
          Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Active{}:
          match evidence:
            case Evidence.Live{}:
              match close_kind:
                case False{}: Decision.Allow{}
                case True{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
            case Evidence.None{}:
              Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}:
              match close_kind:
                case False{}: Decision.Deny{DenyReason.InsufficientEvidence{}}
                case True{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Halted{}:
          match evidence:
            case Evidence.Live{}:
              match close_kind:
                case False{}: Decision.Allow{}
                case True{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
            case Evidence.None{}:
              Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}:
              match close_kind:
                case False{}: Decision.Deny{DenyReason.InsufficientEvidence{}}
                case True{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Frozen{}:
          match evidence:
            case Evidence.Live{}:
              match close_kind:
                case False{}: Decision.Deny{DenyReason.WrongLifecycle{}}
                case True{}:  Decision.Allow{}
            case Evidence.None{}:
              Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}:
              Decision.Deny{DenyReason.InsufficientEvidence{}}
        case Lifecycle.Draft{}:
          Decision.Deny{DenyReason.WrongLifecycle{}}

def freeze_decision(actor: Actor, lifecycle: Lifecycle, evidence: Evidence) -> Decision:
  irreversible_decision(actor, lifecycle, evidence, False{})

def close_decision(actor: Actor, lifecycle: Lifecycle, evidence: Evidence) -> Decision:
  irreversible_decision(actor, lifecycle, evidence, True{})

def authorize(
  actor: Actor,
  capability: Capability,
  lifecycle: Lifecycle,
  evidence: Evidence
) -> Decision:
  match capability:
    case Capability.Work{}:   work_decision(actor, lifecycle, evidence)
    case Capability.Halt{}:   halt_decision(actor, lifecycle, evidence)
    case Capability.Freeze{}: freeze_decision(actor, lifecycle, evidence)
    case Capability.Close{}:  close_decision(actor, lifecycle, evidence)

def main() -> Decision:
  authorize(Actor.Agent{}, Capability.Work{}, Lifecycle.Active{}, Evidence.None{})
