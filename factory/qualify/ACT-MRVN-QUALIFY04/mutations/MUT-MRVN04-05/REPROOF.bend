# ACT-MRVN-04 REPROOF.bend -- alternate proof of LAWS.bend against MUT-05.
#
# MUT-05 collapses freeze_decision and close_decision into a single
# helper `irreversible_decision(actor, lifecycle, evidence, close_kind)`
# whose WNF pattern-matches on (actor, lifecycle, evidence, close_kind)
# in that order.  The canonical PROOF's case-splits on the
# capability-specific helpers' WNFs no longer reduce.
#
# Strategy: REPROOF re-states each law's proof using the impl's new
# structure.  Each `Laws.<name>` proof case-splits on actor first,
# then lifecycle, then evidence, then (for irreversible actions)
# close_kind.  For non-irreversible laws (Work, Halt), the proof
# structure matches the canonical PROOF.bend.
#
# All Laws.* function names and signatures match the canonical
# PROOF.bend, so this REPROOF discharges the same `law` declarations.

import Base
import ./main.bend as Gate
import ./LAWS.bend as Laws

# ===========================================================================
# LAW-MRVN04-001 -- Closed denies everything
# ===========================================================================

def closed_denies_for_work(a: Gate.Actor, e: Gate.Evidence)
  -> {Gate.authorize(a, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, e)
        == Gate.Decision.Deny{Gate.DenyReason.Terminal{}}
      : Gate.Decision}:
  match a:
    case Gate.Actor.Agent{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Actor.Reviewer{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Actor.Automation{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}

def closed_denies_for_halt(a: Gate.Actor, e: Gate.Evidence)
  -> {Gate.authorize(a, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, e)
        == Gate.Decision.Deny{Gate.DenyReason.Terminal{}}
      : Gate.Decision}:
  match a:
    case Gate.Actor.Agent{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Actor.Reviewer{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Actor.Automation{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}

def closed_denies_for_irreversible(
  a: Gate.Actor,
  e: Gate.Evidence,
  close_kind: Bool)
  -> {Gate.irreversible_decision(a, Gate.Lifecycle.Closed{}, e, close_kind)
        == Gate.Decision.Deny{Gate.DenyReason.Terminal{}}
      : Gate.Decision}:
  match a:
    case Gate.Actor.Agent{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Actor.Reviewer{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Actor.Automation{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}

def Laws.closed_denies_everything(a, c, e):
  match c:
    case Gate.Capability.Work{}:   closed_denies_for_work(a, e)
    case Gate.Capability.Halt{}:   closed_denies_for_halt(a, e)
    case Gate.Capability.Freeze{}: closed_denies_for_irreversible(a, e, False{})
    case Gate.Capability.Close{}:  closed_denies_for_irreversible(a, e, True{})

# ===========================================================================
# LAW-MRVN04-002 -- Agent cannot Freeze or Close
# ===========================================================================

def Laws.agent_cannot_freeze(s, e):
  # WNF: authorize(Agent{}, Freeze{}, s, e) -> freeze_decision(Agent{}, s, e)
  #   -> irreversible_decision(Agent{}, s, e, False{})
  #   -> match actor: case Agent{}: match s: Closed: Terminal; _: WrongActor
  # match s first (binder-1 of WNF), then e:
  match s:
    case Gate.Lifecycle.Closed{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Lifecycle.Active{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Lifecycle.Halted{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Lifecycle.Frozen{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Lifecycle.Draft{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}

def Laws.agent_cannot_close(s, e):
  match s:
    case Gate.Lifecycle.Closed{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Lifecycle.Active{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Lifecycle.Halted{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Lifecycle.Frozen{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Lifecycle.Draft{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}

# ===========================================================================
# LAW-MRVN04-003 -- Replay cannot authorize Freeze/Close
# ===========================================================================

def Laws.replay_cannot_authorize_freeze(a, s):
  # WNF: authorize(a, Freeze{}, s, Replay{}) -> irreversible_decision(a, s, Replay{}, False{})
  # which matches on a first:
  match a:
    case Gate.Actor.Agent{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
    case Gate.Actor.Automation{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
    case Gate.Actor.Reviewer{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}

def Laws.replay_cannot_authorize_close(a, s):
  match a:
    case Gate.Actor.Agent{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
    case Gate.Actor.Automation{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
    case Gate.Actor.Reviewer{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}

# ===========================================================================
# LAW-MRVN04-004 -- Reviewer Live Freeze iff freeze_lifecycle_ok
# ===========================================================================
# Under MUT-05: authorize(Reviewer, Freeze, s, Live) -> freeze_decision(R, s, L)
#   -> irreversible_decision(R, s, L, False{})
#   -> match actor: Reviewer: match s: Closed: Terminal; Active: match e: Live: ck: False: Allow;
#                    True: WrongLifecycle; Halted: same; Frozen: match e: Live: ck: F: WL; T: Allow;
#                    Draft: WrongLifecycle

def Laws.reviewer_freeze_live_iff_freeze_lifecycle_ok(s):
  # match s first; within Active/Halted, the WNF goes into close_kind=False
  # which discharges to Allow{}; within Frozen, the WNF for Live+False is WrongLifecycle
  match s:
    case Gate.Lifecycle.Active{}:  {==}
    case Gate.Lifecycle.Halted{}:  {==}
    case Gate.Lifecycle.Closed{}:  {==}
    case Gate.Lifecycle.Draft{}:   {==}
    case Gate.Lifecycle.Frozen{}:  {==}

# ===========================================================================
# LAW-MRVN04-005 -- Close iff Reviewer + Frozen + Live
# ===========================================================================
# Under MUT-05: authorize(a, Close, s, e) -> close_decision(a, s, e)
#   -> irreversible_decision(a, s, e, True{})
# For each (actor, lifecycle, evidence), the WNF gives a Deny or Allow,
# and the RHS conjunction matches.

def Laws.reviewer_close_iff_reviewer_frozen_live(a, s, e):
  match a:
    case Gate.Actor.Reviewer{}:
      match s:
        case Gate.Lifecycle.Frozen{}:
          match e:
            case Gate.Evidence.Live{}:   {==}
            case Gate.Evidence.None{}:   {==}
            case Gate.Evidence.Replay{}: {==}
        case Gate.Lifecycle.Closed{}:  {==}
        case Gate.Lifecycle.Draft{}:   {==}
        case Gate.Lifecycle.Active{}:
          match e:
            case Gate.Evidence.Live{}:   {==}
            case Gate.Evidence.None{}:   {==}
            case Gate.Evidence.Replay{}: {==}
        case Gate.Lifecycle.Halted{}:
          match e:
            case Gate.Evidence.Live{}:   {==}
            case Gate.Evidence.None{}:   {==}
            case Gate.Evidence.Replay{}: {==}
    case Gate.Actor.Agent{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}
    case Gate.Actor.Automation{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}

# ===========================================================================
# LAW-MRVN04-006 -- Halt iff Active && halt_actor_ok && has_replay_or_live
# ===========================================================================
# halt_decision is unchanged in MUT-05, so this proof structure is the
# same as canonical PROOF.bend.

def Laws.halt_iff_active_halt_actor_ok_replay_or_live(a, s, e):
  match a:
    case Gate.Actor.Reviewer{}:
      match s:
        case Gate.Lifecycle.Active{}:
          match e:
            case Gate.Evidence.None{}:   {==}
            case Gate.Evidence.Replay{}: {==}
            case Gate.Evidence.Live{}:   {==}
        case Gate.Lifecycle.Closed{}:  {==}
        case Gate.Lifecycle.Draft{}:   {==}
        case Gate.Lifecycle.Halted{}:  {==}
        case Gate.Lifecycle.Frozen{}:  {==}
    case Gate.Actor.Automation{}:
      match s:
        case Gate.Lifecycle.Active{}:
          match e:
            case Gate.Evidence.None{}:   {==}
            case Gate.Evidence.Replay{}: {==}
            case Gate.Evidence.Live{}:   {==}
        case Gate.Lifecycle.Closed{}:  {==}
        case Gate.Lifecycle.Draft{}:   {==}
        case Gate.Lifecycle.Halted{}:  {==}
        case Gate.Lifecycle.Frozen{}:  {==}
    case Gate.Actor.Agent{}:
      match s:
        case Gate.Lifecycle.Active{}:  {==}
        case Gate.Lifecycle.Closed{}:  {==}
        case Gate.Lifecycle.Draft{}:   {==}
        case Gate.Lifecycle.Halted{}:  {==}
        case Gate.Lifecycle.Frozen{}:  {==}

# ===========================================================================
# LAW-MRVN04-007 -- Work iff work_actor_ok && work_lifecycle_ok
# ===========================================================================
# work_decision is unchanged in MUT-05.

def Laws.work_iff_work_actor_ok_and_work_lifecycle_ok(a, s, e):
  match a:
    case Gate.Actor.Agent{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Active{}:
          match e:
            case Gate.Evidence.None{}:   {==}
            case Gate.Evidence.Replay{}: {==}
            case Gate.Evidence.Live{}:   {==}
        case Gate.Lifecycle.Halted{}:  {==}
    case Gate.Actor.Automation{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Active{}:
          match e:
            case Gate.Evidence.None{}:   {==}
            case Gate.Evidence.Replay{}: {==}
            case Gate.Evidence.Live{}:   {==}
        case Gate.Lifecycle.Halted{}:  {==}
    case Gate.Actor.Reviewer{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Active{}:  {==}
        case Gate.Lifecycle.Halted{}:  {==}

# ===========================================================================
# LAW-MRVN04-008 -- Work evidence None == Replay (for active Agent/Automation)
# ===========================================================================
# work_decision unchanged in MUT-05.

def Laws.work_evidence_none_eq_replay(a, s):
  match a:
    case Gate.Actor.Agent{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}
    case Gate.Actor.Automation{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}
    case Gate.Actor.Reviewer{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}

# ===========================================================================
# LAW-MRVN04-009 -- Work evidence Replay == Live
# ===========================================================================

def Laws.work_evidence_replay_eq_live(a, s):
  match a:
    case Gate.Actor.Agent{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}
    case Gate.Actor.Automation{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}
    case Gate.Actor.Reviewer{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}

# ===========================================================================
# LAW-MRVN04-010 -- Halt Replay Allow implies Live Allow (Empty.absurd)
# ===========================================================================
# MUT-05 does not change halt_decision.

def Laws.halt_replay_allow_implies_live_allow(a, s, h):
  match a:
    case Gate.Actor.Reviewer{}:
      match s:
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Closed{}:
          Empty.absurd(
            {Laws.is_allowed(Gate.authorize(
                 a, Gate.Capability.Halt{}, s, Gate.Evidence.Live{}))
               == True{}
             : Bool},
            Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))
        case Gate.Lifecycle.Draft{}:
          Empty.absurd(
            {Laws.is_allowed(Gate.authorize(
                 a, Gate.Capability.Halt{}, s, Gate.Evidence.Live{}))
               == True{}
             : Bool},
            Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))
        case Gate.Lifecycle.Halted{}:
          Empty.absurd(
            {Laws.is_allowed(Gate.authorize(
                 a, Gate.Capability.Halt{}, s, Gate.Evidence.Live{}))
               == True{}
             : Bool},
            Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))
        case Gate.Lifecycle.Frozen{}:
          Empty.absurd(
            {Laws.is_allowed(Gate.authorize(
                 a, Gate.Capability.Halt{}, s, Gate.Evidence.Live{}))
               == True{}
             : Bool},
            Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))
    case Gate.Actor.Automation{}:
      match s:
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Closed{}:
          Empty.absurd(
            {Laws.is_allowed(Gate.authorize(
                 a, Gate.Capability.Halt{}, s, Gate.Evidence.Live{}))
               == True{}
             : Bool},
            Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))
        case Gate.Lifecycle.Draft{}:
          Empty.absurd(
            {Laws.is_allowed(Gate.authorize(
                 a, Gate.Capability.Halt{}, s, Gate.Evidence.Live{}))
               == True{}
             : Bool},
            Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))
        case Gate.Lifecycle.Halted{}:
          Empty.absurd(
            {Laws.is_allowed(Gate.authorize(
                 a, Gate.Capability.Halt{}, s, Gate.Evidence.Live{}))
               == True{}
             : Bool},
            Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))
        case Gate.Lifecycle.Frozen{}:
          Empty.absurd(
            {Laws.is_allowed(Gate.authorize(
                 a, Gate.Capability.Halt{}, s, Gate.Evidence.Live{}))
               == True{}
             : Bool},
            Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))
    case Gate.Actor.Agent{}:
      match s:
        case Gate.Lifecycle.Closed{}:
          Empty.absurd(
            {Laws.is_allowed(Gate.authorize(
                 a, Gate.Capability.Halt{}, s, Gate.Evidence.Live{}))
               == True{}
             : Bool},
            Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))
        case Gate.Lifecycle.Active{}:
          Empty.absurd(
            {Laws.is_allowed(Gate.authorize(
                 a, Gate.Capability.Halt{}, s, Gate.Evidence.Live{}))
               == True{}
             : Bool},
            Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))
        case Gate.Lifecycle.Draft{}:
          Empty.absurd(
            {Laws.is_allowed(Gate.authorize(
                 a, Gate.Capability.Halt{}, s, Gate.Evidence.Live{}))
               == True{}
             : Bool},
            Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))
        case Gate.Lifecycle.Halted{}:
          Empty.absurd(
            {Laws.is_allowed(Gate.authorize(
                 a, Gate.Capability.Halt{}, s, Gate.Evidence.Live{}))
               == True{}
             : Bool},
            Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))
        case Gate.Lifecycle.Frozen{}:
          Empty.absurd(
            {Laws.is_allowed(Gate.authorize(
                 a, Gate.Capability.Halt{}, s, Gate.Evidence.Live{}))
               == True{}
             : Bool},
            Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))

# ===========================================================================
# LAW-MRVN04-011..013 -- Deny reason coherence (high-value cells)
# ===========================================================================

def Laws.halt_active_agent_yields_wrong_actor(): {==}

def Laws.halt_active_reviewer_none_yields_insufficient_evidence(): {==}

def Laws.freeze_reviewer_draft_yields_wrong_lifecycle(): {==}
