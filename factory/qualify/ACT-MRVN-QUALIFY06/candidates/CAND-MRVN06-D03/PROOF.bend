# ACT-MRVN-QUALIFY04 PROOF.bend -- proofs of the laws in LAWS.bend.
#
# Strategy:
#   - Most laws are discharged by case-split structural induction on
#     the relevant constructors.  When the implementation's WNF
#     reduces to the law body, {==} discharges.
#   - For quantified laws (for +a, for +s, for +e), the proof term
#     takes the same arguments and case-splits on each in turn.  The
#     affine checker requires nested match scrutinees to appear in
#     binder order; we use the same ordering as the implementation:
#     (actor, lifecycle, evidence).
#   - For LAW-001 (closed_denies_everything), we dispatch on capability
#     (4 cases), then on actor (3 cases), then on evidence (3 cases).
#     Within each leaf, the implementation reduces to Deny{Terminal{}},
#     so {==} discharges.
#
# No @unsafe.  No foreign imports.  No open claims.  No ?TODO.

import Base
import ./main.bend as Gate
import ./LAWS.bend as Laws

# -------------------------------------------------------------------------
# LAW-MRVN04-001 -- Closed denies everything
# -------------------------------------------------------------------------
#
# For each capability, dispatch to a per-capability closed-proof.
# Each per-capability proof then case-splits on actor and evidence;
# within each leaf the implementation returns Deny{Terminal{}}.

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

def closed_denies_for_freeze(a: Gate.Actor, e: Gate.Evidence)
  -> {Gate.authorize(a, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, e)
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

def closed_denies_for_close(a: Gate.Actor, e: Gate.Evidence)
  -> {Gate.authorize(a, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, e)
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
    case Gate.Capability.Freeze{}: closed_denies_for_freeze(a, e)
    case Gate.Capability.Close{}:  closed_denies_for_close(a, e)

# -------------------------------------------------------------------------
# LAW-MRVN04-002 -- Agent cannot Freeze or Close (is_allowed)
# -------------------------------------------------------------------------
#
# WNF: authorize(Agent, Freeze, s, e) -> freeze_decision(Agent, s, e)
# which case-splits on lifecycle.  For each lifecycle branch,
# is_allowed of the result is False, and {==} discharges.

def Laws.agent_cannot_freeze(s, e):
  match s:
    case Gate.Lifecycle.Closed{}: {==}
    case Gate.Lifecycle.Active{}: {==}
    case Gate.Lifecycle.Halted{}: {==}
    case Gate.Lifecycle.Draft{}:  {==}
    case Gate.Lifecycle.Frozen{}: {==}

def Laws.agent_cannot_close(s, e):
  match s:
    case Gate.Lifecycle.Closed{}: {==}
    case Gate.Lifecycle.Active{}: {==}
    case Gate.Lifecycle.Halted{}: {==}
    case Gate.Lifecycle.Draft{}:  {==}
    case Gate.Lifecycle.Frozen{}: {==}

# -------------------------------------------------------------------------
# LAW-MRVN04-003 -- Replay cannot authorize Freeze/Close (is_allowed)
# -------------------------------------------------------------------------

def Laws.replay_cannot_authorize_freeze(a, s):
  match a:
    case Gate.Actor.Agent{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Frozen{}: {==}
    case Gate.Actor.Reviewer{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Frozen{}: {==}
    case Gate.Actor.Automation{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Frozen{}: {==}

def Laws.replay_cannot_authorize_close(a, s):
  match a:
    case Gate.Actor.Agent{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Frozen{}: {==}
    case Gate.Actor.Reviewer{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Frozen{}: {==}
    case Gate.Actor.Automation{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Frozen{}: {==}

# -------------------------------------------------------------------------
# LAW-MRVN04-004 -- Live Reviewer Freeze iff freeze_lifecycle_ok
# -------------------------------------------------------------------------
#
# WNF: authorize(Reviewer, Freeze, s, Live) -> freeze_decision(Reviewer, s, Live)
# which case-splits on lifecycle.
#   Active:  is_allowed(Allow{}) == True  == freeze_lifecycle_ok(Active) == True
#   Halted:  is_allowed(Allow{}) == True  == freeze_lifecycle_ok(Halted) == True
#   Closed:  is_allowed(Deny{Terminal{}}) == False == freeze_lifecycle_ok(Closed) == False
#   Draft:   is_allowed(Deny{WrongLifecycle{}}) == False == freeze_lifecycle_ok(Draft) == False
#   Frozen:  is_allowed(Deny{WrongLifecycle{}}) == False == freeze_lifecycle_ok(Frozen) == False
# Each leaf discharges by {==}.

def Laws.reviewer_freeze_live_iff_freeze_lifecycle_ok(s):
  match s:
    case Gate.Lifecycle.Active{}:  {==}
    case Gate.Lifecycle.Halted{}:  {==}
    case Gate.Lifecycle.Closed{}:  {==}
    case Gate.Lifecycle.Draft{}:   {==}
    case Gate.Lifecycle.Frozen{}:  {==}

# -------------------------------------------------------------------------
# LAW-MRVN04-005 -- Close iff Reviewer + Frozen + Live
# -------------------------------------------------------------------------
#
# WNF: authorize(a, Close, s, e) reduces to close_decision(a, s, e).
# close_decision case-splits on actor; for each actor, on lifecycle; for
# Reviewer+Frozen, on evidence.  We mirror the impl exactly.
# In each leaf, is_allowed(Deny{...}) is False and the RHS conjunction
# is False (or both True for the single Allow cell).  {==} discharges.

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
        case Gate.Lifecycle.Active{}:  {==}
        case Gate.Lifecycle.Halted{}:  {==}
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

# -------------------------------------------------------------------------
# LAW-MRVN04-006 -- Halt iff Active && halt_actor_ok && has_replay_or_live
# -------------------------------------------------------------------------
#
# WNF: authorize(a, Halt, s, e) -> halt_decision(a, s, e).
# halt_decision case-splits on actor; for each actor, on lifecycle; for
# Reviewer/Automation + Active, on evidence.  We mirror the impl.

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
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Halted{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}

# -------------------------------------------------------------------------
# LAW-MRVN04-007 -- Work iff work_actor_ok && work_lifecycle_ok
# -------------------------------------------------------------------------
#
# WNF: authorize(a, Work, s, e) -> work_decision(a, s, e).
# work_decision case-splits on actor; for each actor, on lifecycle.
# The evidence variable is not consulted (LAW-008).

def Laws.work_iff_work_actor_ok_and_work_lifecycle_ok(a, s, e):
  match a:
    case Gate.Actor.Agent{}:
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
    case Gate.Actor.Automation{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}

# -------------------------------------------------------------------------
# LAW-MRVN04-008 -- Work evidence irrelevance (Decision equality)
# -------------------------------------------------------------------------
#
# WNF: authorize(a, Work, s, e) -> work_decision(a, s, e).
# work_decision does NOT inspect `e` (the evidence parameter).  Each
# arm returns the same Decision for None/Replay/Live.  {==} discharges.

def Laws.work_evidence_none_eq_replay(a, s):
  match a:
    case Gate.Actor.Agent{}:
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
    case Gate.Actor.Automation{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}

def Laws.work_evidence_replay_eq_live(a, s):
  match a:
    case Gate.Actor.Agent{}:
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
    case Gate.Actor.Automation{}:
      match s:
        case Gate.Lifecycle.Closed{}: {==}
        case Gate.Lifecycle.Frozen{}: {==}
        case Gate.Lifecycle.Draft{}:  {==}
        case Gate.Lifecycle.Active{}: {==}
        case Gate.Lifecycle.Halted{}: {==}

# -------------------------------------------------------------------------
# LAW-MRVN04-009 -- Halt Replay-allow implies Live-allow
# -------------------------------------------------------------------------
#
# The hypothesis says:  is_allowed(authorize(a, Halt, s, Replay)) == True
# This implies: lifecycle is Active, actor is Reviewer/Automation, and
# evidence is Replay/Live.  In that cell, halt_decision under Live
# evidence also returns Allow{}.  {==} discharges by case-split.

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

# -------------------------------------------------------------------------
# LAW-MRVN04-012 -- Deny reason coherence (high-value cells)
# -------------------------------------------------------------------------
#
# Each of these is a single Decision equality on a concrete input.
# WNF reduces authorize(...) directly to the canonical Deny decision
# under the implementation.  {==} discharges.

def Laws.halt_active_agent_yields_wrong_actor(): {==}

def Laws.halt_active_reviewer_none_yields_insufficient_evidence(): {==}

def Laws.freeze_reviewer_draft_yields_wrong_lifecycle(): {==}
