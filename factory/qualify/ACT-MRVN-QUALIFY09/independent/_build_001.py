#!/usr/bin/env python3
# Generate IND-MRVN09-001: capability-outer dispatch.
# This is structurally distinct from MRVN-08 K-02 (actor-first) and
# from MRVN-04/06/07 canonical (also capability-outer but unchanged).

CONTENT = """# IND-MRVN09-001 -- capability-outer dispatch
#
# Strategy: top-level authorize matches on `capability` first.  This is
# a different reduction shape than the canonical; the helper structure
# is preserved.  Distinct from MRVN-08 K-02 (actor-outer).
#
# No @unsafe, no foreign imports, no ?TODO.

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

def work_decision(a: Actor, l: Lifecycle, e: Evidence) -> Decision:
  match a:
    case Actor.Agent{}:
      match l:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Draft{}:  Decision.Allow{}
        case Lifecycle.Active{}: Decision.Allow{}
        case Lifecycle.Halted{}: Decision.Allow{}
    case Actor.Reviewer{}:
      match l:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Draft{}:  Decision.Allow{}
        case Lifecycle.Active{}: Decision.Allow{}
        case Lifecycle.Halted{}: Decision.Allow{}
    case Actor.Automation{}:
      match l:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Active{}: Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongActor{}}

def halt_decision(a: Actor, l: Lifecycle, e: Evidence) -> Decision:
  match a:
    case Actor.Agent{}:
      match l:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Active{}: Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
    case Actor.Reviewer{}:
      match l:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Active{}:
          match e:
            case Evidence.None{}:   Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}: Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Live{}:   Decision.Allow{}
        case Lifecycle.Halted{}:
          match e:
            case Evidence.None{}:   Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}: Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Live{}:   Decision.Allow{}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
    case Actor.Automation{}:
      match l:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Active{}:
          match e:
            case Evidence.None{}:   Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}: Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Live{}:   Decision.Allow{}
        case Lifecycle.Halted{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Draft{}:   Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Frozen{}:  Decision.Deny{DenyReason.WrongLifecycle{}}

def freeze_decision(a: Actor, l: Lifecycle, e: Evidence) -> Decision:
  match a:
    case Actor.Agent{}:
      match l:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Active{}: Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
    case Actor.Automation{}:
      match l:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Active{}: Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
    case Actor.Reviewer{}:
      match l:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Active{}:
          match e:
            case Evidence.None{}:   Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}: Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Live{}:   Decision.Allow{}
        case Lifecycle.Halted{}:
          match e:
            case Evidence.None{}:   Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}: Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Live{}:   Decision.Allow{}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}

def close_decision(a: Actor, l: Lifecycle, e: Evidence) -> Decision:
  match a:
    case Actor.Agent{}:
      match l:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Active{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongLifecycle{}}
    case Actor.Automation{}:
      match l:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Active{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongLifecycle{}}
    case Actor.Reviewer{}:
      match l:
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Frozen{}:
          match e:
            case Evidence.None{}:   Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}: Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Live{}:   Decision.Allow{}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Active{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongLifecycle{}}

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
"""

import sys
path = sys.argv[1]
with open(path, "w") as f:
    f.write(CONTENT)
print(f"wrote {path}")
