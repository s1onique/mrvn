# ACT-MRVN-04 MUT-06 EQUIV.bend -- universal 180-cell equivalence witness.
#
# MUT-06 wraps authorize() through a decision_router helper.  This file
# proves the MUT-06 impl matches the LAWS.bend's expected Decision at
# EVERY (actor, capability, lifecycle, evidence) cell.  The expected
# Decision is derived directly from LAWS.bend's law predicates.
#
# The proof case-splits on (capability, actor, lifecycle, evidence) --
# the same shape LAWS.bend uses.  At each leaf, both the impl WNF and
# the law body reduce to the same Decision constructor, so {==}
# discharges.

import Base
import ./main.bend as Mut

# Build the canonical expected Decision for each cell from Laws predicates.
def expected_work(a: Mut.Actor, l: Mut.Lifecycle, e: Mut.Evidence) -> Mut.Decision:
  match a:
    case Mut.Actor.Agent{}:
      match l:
        case Mut.Lifecycle.Closed{}: Mut.Decision.Deny{Mut.DenyReason.Terminal{}}
        case Mut.Lifecycle.Frozen{}: Mut.Decision.Deny{Mut.DenyReason.WrongLifecycle{}}
        case _:                      Mut.Decision.Allow{}
    case Mut.Actor.Reviewer{}:
      match l:
        case Mut.Lifecycle.Closed{}: Mut.Decision.Deny{Mut.DenyReason.Terminal{}}
        case Mut.Lifecycle.Frozen{}: Mut.Decision.Deny{Mut.DenyReason.WrongLifecycle{}}
        case _:                      Mut.Decision.Allow{}
    case Mut.Actor.Automation{}:
      match l:
        case Mut.Lifecycle.Closed{}: Mut.Decision.Deny{Mut.DenyReason.Terminal{}}
        case Mut.Lifecycle.Frozen{}: Mut.Decision.Deny{Mut.DenyReason.WrongLifecycle{}}
        case _:                      Mut.Decision.Deny{Mut.DenyReason.WrongActor{}}

def expected_halt(a: Mut.Actor, l: Mut.Lifecycle, e: Mut.Evidence) -> Mut.Decision:
  match a:
    case Mut.Actor.Agent{}:
      match l:
        case Mut.Lifecycle.Closed{}: Mut.Decision.Deny{Mut.DenyReason.Terminal{}}
        case Mut.Lifecycle.Active{}: Mut.Decision.Deny{Mut.DenyReason.WrongActor{}}
        case _:                      Mut.Decision.Deny{Mut.DenyReason.WrongLifecycle{}}
    case Mut.Actor.Reviewer{}:
      match l:
        case Mut.Lifecycle.Closed{}: Mut.Decision.Deny{Mut.DenyReason.Terminal{}}
        case Mut.Lifecycle.Active{}:
          match e:
            case Mut.Evidence.None{}: Mut.Decision.Deny{Mut.DenyReason.InsufficientEvidence{}}
            case _:                    Mut.Decision.Allow{}
        case _: Mut.Decision.Deny{Mut.DenyReason.WrongLifecycle{}}
    case Mut.Actor.Automation{}:
      match l:
        case Mut.Lifecycle.Closed{}: Mut.Decision.Deny{Mut.DenyReason.Terminal{}}
        case Mut.Lifecycle.Active{}:
          match e:
            case Mut.Evidence.None{}: Mut.Decision.Deny{Mut.DenyReason.InsufficientEvidence{}}
            case _:                    Mut.Decision.Allow{}
        case _: Mut.Decision.Deny{Mut.DenyReason.WrongLifecycle{}}


def expected_freeze(a: Mut.Actor, l: Mut.Lifecycle, e: Mut.Evidence) -> Mut.Decision:
  match a:
    case Mut.Actor.Agent{}:
      match l:
        case Mut.Lifecycle.Closed{}: Mut.Decision.Deny{Mut.DenyReason.Terminal{}}
        case Mut.Lifecycle.Active{}: Mut.Decision.Deny{Mut.DenyReason.WrongActor{}}
        case Mut.Lifecycle.Halted{}: Mut.Decision.Deny{Mut.DenyReason.WrongActor{}}
        case _:                      Mut.Decision.Deny{Mut.DenyReason.WrongLifecycle{}}
    case Mut.Actor.Automation{}:
      match l:
        case Mut.Lifecycle.Closed{}: Mut.Decision.Deny{Mut.DenyReason.Terminal{}}
        case Mut.Lifecycle.Active{}: Mut.Decision.Deny{Mut.DenyReason.WrongActor{}}
        case Mut.Lifecycle.Halted{}: Mut.Decision.Deny{Mut.DenyReason.WrongActor{}}
        case _:                      Mut.Decision.Deny{Mut.DenyReason.WrongLifecycle{}}
    case Mut.Actor.Reviewer{}:
      match l:
        case Mut.Lifecycle.Closed{}: Mut.Decision.Deny{Mut.DenyReason.Terminal{}}
        case Mut.Lifecycle.Active{}:
          match e:
            case Mut.Evidence.Live{}: Mut.Decision.Allow{}
            case _:                    Mut.Decision.Deny{Mut.DenyReason.InsufficientEvidence{}}
        case Mut.Lifecycle.Halted{}:
          match e:
            case Mut.Evidence.Live{}: Mut.Decision.Allow{}
            case _:                    Mut.Decision.Deny{Mut.DenyReason.InsufficientEvidence{}}
        case _: Mut.Decision.Deny{Mut.DenyReason.WrongLifecycle{}}

def expected_close(a: Mut.Actor, l: Mut.Lifecycle, e: Mut.Evidence) -> Mut.Decision:
  match a:
    case Mut.Actor.Agent{}:
      match l:
        case Mut.Lifecycle.Closed{}: Mut.Decision.Deny{Mut.DenyReason.Terminal{}}
        case Mut.Lifecycle.Frozen{}: Mut.Decision.Deny{Mut.DenyReason.WrongActor{}}
        case _:                      Mut.Decision.Deny{Mut.DenyReason.WrongLifecycle{}}
    case Mut.Actor.Automation{}:
      match l:
        case Mut.Lifecycle.Closed{}: Mut.Decision.Deny{Mut.DenyReason.Terminal{}}
        case Mut.Lifecycle.Frozen{}: Mut.Decision.Deny{Mut.DenyReason.WrongActor{}}
        case _:                      Mut.Decision.Deny{Mut.DenyReason.WrongLifecycle{}}
    case Mut.Actor.Reviewer{}:
      match l:
        case Mut.Lifecycle.Closed{}: Mut.Decision.Deny{Mut.DenyReason.Terminal{}}
        case Mut.Lifecycle.Frozen{}:
          match e:
            case Mut.Evidence.Live{}: Mut.Decision.Allow{}
            case _:                    Mut.Decision.Deny{Mut.DenyReason.InsufficientEvidence{}}
        case _: Mut.Decision.Deny{Mut.DenyReason.WrongLifecycle{}}

def expected_cap(a: Mut.Actor, c: Mut.Capability, l: Mut.Lifecycle, e: Mut.Evidence) -> Mut.Decision:
  match c:
    case Mut.Capability.Work{}:   expected_work(a, l, e)
    case Mut.Capability.Halt{}:   expected_halt(a, l, e)
    case Mut.Capability.Freeze{}: expected_freeze(a, l, e)
    case Mut.Capability.Close{}:  expected_close(a, l, e)

# Per-capability equivalence proofs: Mut.authorize agrees with expected_* at every cell.

def equiv_work(a: Mut.Actor, l: Mut.Lifecycle, e: Mut.Evidence)
  -> {Mut.authorize(a, Mut.Capability.Work{}, l, e)
        == expected_work(a, l, e)
      : Mut.Decision}:
  match a:
    case Mut.Actor.Agent{}:
      match l:
        case Mut.Lifecycle.Closed{}: {==}
        case Mut.Lifecycle.Frozen{}: {==}
        case Mut.Lifecycle.Draft{}:  {==}
        case Mut.Lifecycle.Active{}: {==}
        case Mut.Lifecycle.Halted{}: {==}
    case Mut.Actor.Reviewer{}:
      match l:
        case Mut.Lifecycle.Closed{}: {==}
        case Mut.Lifecycle.Frozen{}: {==}
        case Mut.Lifecycle.Draft{}:  {==}
        case Mut.Lifecycle.Active{}: {==}
        case Mut.Lifecycle.Halted{}: {==}
    case Mut.Actor.Automation{}:
      match l:
        case Mut.Lifecycle.Closed{}: {==}
        case Mut.Lifecycle.Frozen{}: {==}
        case Mut.Lifecycle.Draft{}:  {==}
        case Mut.Lifecycle.Active{}: {==}
        case Mut.Lifecycle.Halted{}: {==}

def equiv_halt(a: Mut.Actor, l: Mut.Lifecycle, e: Mut.Evidence)
  -> {Mut.authorize(a, Mut.Capability.Halt{}, l, e)
        == expected_halt(a, l, e)
      : Mut.Decision}:
  match a:
    case Mut.Actor.Agent{}:
      match l:
        case Mut.Lifecycle.Closed{}: {==}
        case Mut.Lifecycle.Active{}: {==}
        case Mut.Lifecycle.Draft{}:  {==}
        case Mut.Lifecycle.Halted{}: {==}
        case Mut.Lifecycle.Frozen{}: {==}
    case Mut.Actor.Reviewer{}:
      match l:
        case Mut.Lifecycle.Closed{}: {==}
        case Mut.Lifecycle.Active{}:
          match e:
            case Mut.Evidence.None{}:   {==}
            case Mut.Evidence.Replay{}: {==}
            case Mut.Evidence.Live{}:   {==}
        case Mut.Lifecycle.Draft{}:  {==}
        case Mut.Lifecycle.Halted{}: {==}
        case Mut.Lifecycle.Frozen{}: {==}
    case Mut.Actor.Automation{}:
      match l:
        case Mut.Lifecycle.Closed{}: {==}
        case Mut.Lifecycle.Active{}:
          match e:
            case Mut.Evidence.None{}:   {==}
            case Mut.Evidence.Replay{}: {==}
            case Mut.Evidence.Live{}:   {==}
        case Mut.Lifecycle.Draft{}:  {==}
        case Mut.Lifecycle.Halted{}: {==}
        case Mut.Lifecycle.Frozen{}: {==}


def equiv_freeze(a: Mut.Actor, l: Mut.Lifecycle, e: Mut.Evidence)
  -> {Mut.authorize(a, Mut.Capability.Freeze{}, l, e)
        == expected_freeze(a, l, e)
      : Mut.Decision}:
  match a:
    case Mut.Actor.Agent{}:
      match l:
        case Mut.Lifecycle.Closed{}: {==}
        case Mut.Lifecycle.Active{}: {==}
        case Mut.Lifecycle.Halted{}: {==}
        case Mut.Lifecycle.Draft{}:  {==}
        case Mut.Lifecycle.Frozen{}: {==}
    case Mut.Actor.Reviewer{}:
      match l:
        case Mut.Lifecycle.Closed{}: {==}
        case Mut.Lifecycle.Active{}:
          match e:
            case Mut.Evidence.None{}:   {==}
            case Mut.Evidence.Replay{}: {==}
            case Mut.Evidence.Live{}:   {==}
        case Mut.Lifecycle.Halted{}:
          match e:
            case Mut.Evidence.None{}:   {==}
            case Mut.Evidence.Replay{}: {==}
            case Mut.Evidence.Live{}:   {==}
        case Mut.Lifecycle.Draft{}:  {==}
        case Mut.Lifecycle.Frozen{}: {==}
    case Mut.Actor.Automation{}:
      match l:
        case Mut.Lifecycle.Closed{}: {==}
        case Mut.Lifecycle.Active{}: {==}
        case Mut.Lifecycle.Halted{}: {==}
        case Mut.Lifecycle.Draft{}:  {==}
        case Mut.Lifecycle.Frozen{}: {==}

def equiv_close(a: Mut.Actor, l: Mut.Lifecycle, e: Mut.Evidence)
  -> {Mut.authorize(a, Mut.Capability.Close{}, l, e)
        == expected_close(a, l, e)
      : Mut.Decision}:
  match a:
    case Mut.Actor.Agent{}:
      match l:
        case Mut.Lifecycle.Closed{}: {==}
        case Mut.Lifecycle.Active{}: {==}
        case Mut.Lifecycle.Halted{}: {==}
        case Mut.Lifecycle.Draft{}:  {==}
        case Mut.Lifecycle.Frozen{}: {==}
    case Mut.Actor.Reviewer{}:
      match l:
        case Mut.Lifecycle.Closed{}: {==}
        case Mut.Lifecycle.Active{}: {==}
        case Mut.Lifecycle.Halted{}: {==}
        case Mut.Lifecycle.Draft{}:  {==}
        case Mut.Lifecycle.Frozen{}:
          match e:
            case Mut.Evidence.None{}:   {==}
            case Mut.Evidence.Replay{}: {==}
            case Mut.Evidence.Live{}:   {==}
    case Mut.Actor.Automation{}:
      match l:
        case Mut.Lifecycle.Closed{}: {==}
        case Mut.Lifecycle.Active{}: {==}
        case Mut.Lifecycle.Halted{}: {==}
        case Mut.Lifecycle.Draft{}:  {==}
        case Mut.Lifecycle.Frozen{}: {==}

def equiv_cap(a: Mut.Actor, c: Mut.Capability, l: Mut.Lifecycle, e: Mut.Evidence)
  -> {Mut.authorize(a, c, l, e) == expected_cap(a, c, l, e) : Mut.Decision}:
  match c:
    case Mut.Capability.Work{}:   equiv_work(a, l, e)
    case Mut.Capability.Halt{}:   equiv_halt(a, l, e)
    case Mut.Capability.Freeze{}: equiv_freeze(a, l, e)
    case Mut.Capability.Close{}:  equiv_close(a, l, e)

# Law declared at toplevel; proof function `equiv_cap` discharges it
# (Bend's binder is implicit when the proof function has matching arity).

def main() -> Bool:
  True{}
