# ACT-MRVN-QUALIFY04 LAWS.bend -- the immutable specification.
#
# This file is the specification authority for the authority kernel.
# Once recorded (see LAWS_INITIAL_SHA256 in EVIDENCE.md), it must not
# change except via a documented SPECIFICATION_DEFECT correction.
#
# Discipline (ACT04 sec.7-8):
#   - Helper predicates (is_allowed, is_reviewer, is_frozen, ...) inspect
#     constructors only.  None of them call Gate.authorize or repackage
#     its output.
#   - No law may collapse into `authorize(...) == authorize(...)` or a
#     tautology.
#   - Laws are stated over the public surface of `main.bend as Gate`:
#     authorize, Actor, Capability, Lifecycle, Evidence, Decision,
#     DenyReason.

import Base
import ./main.bend as Gate

# -------------------------------------------------------------------------
# Boolean clash helpers
# -------------------------------------------------------------------------
#
# Standard Bend idiom: witness that True == False proves Empty.

def false_type(b: Bool) -> Type:
  match b:
    case True{}:  Unit
    case False{}: Empty

def bool_clash(e: {True{} == False{} : Bool}) -> Empty:
  %e : false_type(_)
  Unit{}

def false_clash(e: {False{} == True{} : Bool}) -> Empty:
  bool_clash(Equal.sym(Bool, False{}, True{}, e))

# -------------------------------------------------------------------------
# Independent spec predicates (sec.8)
# -------------------------------------------------------------------------
#
# These predicates inspect the constructors of the public types only.
# They do NOT call Gate.authorize or repackage its output.

# is_allowed: True iff the Decision is Allow{}.
def is_allowed(d: Gate.Decision) -> Bool:
  match d:
    case Gate.Decision.Allow{}:         True{}
    case Gate.Decision.Deny{reason}:    False{}

# is_reviewer: True iff actor is Reviewer{}.
def is_reviewer(a: Gate.Actor) -> Bool:
  match a:
    case Gate.Actor.Reviewer{}:  True{}
    case _:
      False{}

# is_agent: True iff actor is Agent{}.
def is_agent(a: Gate.Actor) -> Bool:
  match a:
    case Gate.Actor.Agent{}:  True{}
    case _:
      False{}

# is_automation: True iff actor is Automation{}.
def is_automation(a: Gate.Actor) -> Bool:
  match a:
    case Gate.Actor.Automation{}:  True{}
    case _:
      False{}

# is_live: True iff evidence is Live{}.
def is_live(e: Gate.Evidence) -> Bool:
  match e:
    case Gate.Evidence.Live{}:  True{}
    case _:
      False{}

# is_replay: True iff evidence is Replay{}.
def is_replay(e: Gate.Evidence) -> Bool:
  match e:
    case Gate.Evidence.Replay{}:  True{}
    case _:
      False{}

# has_replay_or_live: True iff evidence is Replay or Live.
def has_replay_or_live(e: Gate.Evidence) -> Bool:
  match e:
    case Gate.Evidence.None{}:  False{}
    case _:
      True{}

# is_frozen: True iff lifecycle is Frozen{}.
def is_frozen(s: Gate.Lifecycle) -> Bool:
  match s:
    case Gate.Lifecycle.Frozen{}:  True{}
    case _:
      False{}

# is_closed: True iff lifecycle is Closed{}.
def is_closed(s: Gate.Lifecycle) -> Bool:
  match s:
    case Gate.Lifecycle.Closed{}:  True{}
    case _:
      False{}

# is_active: True iff lifecycle is Active{}.
def is_active(s: Gate.Lifecycle) -> Bool:
  match s:
    case Gate.Lifecycle.Active{}:  True{}
    case _:
      False{}

# is_halted: True iff lifecycle is Halted{}.
def is_halted(s: Gate.Lifecycle) -> Bool:
  match s:
    case Gate.Lifecycle.Halted{}:  True{}
    case _:
      False{}

# is_draft: True iff lifecycle is Draft{}.
def is_draft(s: Gate.Lifecycle) -> Bool:
  match s:
    case Gate.Lifecycle.Draft{}:  True{}
    case _:
      False{}

# freeze_lifecycle_ok (LAW-004): True iff lifecycle is Active or Halted.
def freeze_lifecycle_ok(s: Gate.Lifecycle) -> Bool:
  match s:
    case Gate.Lifecycle.Active{}:  True{}
    case Gate.Lifecycle.Halted{}:  True{}
    case _:
      False{}

# work_lifecycle_ok (LAW-007): True iff lifecycle is Draft, Active, or Halted.
def work_lifecycle_ok(s: Gate.Lifecycle) -> Bool:
  match s:
    case Gate.Lifecycle.Draft{}:   True{}
    case Gate.Lifecycle.Active{}:  True{}
    case Gate.Lifecycle.Halted{}:  True{}
    case _:
      False{}

# halt_actor_ok (LAW-006): True iff actor is Reviewer or Automation.
def halt_actor_ok(a: Gate.Actor) -> Bool:
  match a:
    case Gate.Actor.Reviewer{}:    True{}
    case Gate.Actor.Automation{}:  True{}
    case _:
      False{}

# work_actor_ok (LAW-007): True iff actor is Agent or Reviewer.
def work_actor_ok(a: Gate.Actor) -> Bool:
  match a:
    case Gate.Actor.Agent{}:     True{}
    case Gate.Actor.Reviewer{}:  True{}
    case _:
      False{}

# deny_reason: project the DenyReason from a Decision (returns a Bool per
# matched constructor; useful for equality testing).
def deny_terminal(d: Gate.Decision) -> Bool:
  match d:
    case Gate.Decision.Deny{reason}:
      match reason:
        case Gate.DenyReason.Terminal{}:  True{}
        case _:
          False{}
    case _:
      False{}

# deny_wrong_actor: True iff Decision is Deny{WrongActor{}}.
def deny_wrong_actor(d: Gate.Decision) -> Bool:
  match d:
    case Gate.Decision.Deny{reason}:
      match reason:
        case Gate.DenyReason.WrongActor{}:  True{}
        case _:
          False{}
    case _:
      False{}

# deny_wrong_lifecycle: True iff Decision is Deny{WrongLifecycle{}}.
def deny_wrong_lifecycle(d: Gate.Decision) -> Bool:
  match d:
    case Gate.Decision.Deny{reason}:
      match reason:
        case Gate.DenyReason.WrongLifecycle{}:  True{}
        case _:
          False{}
    case _:
      False{}

# deny_insufficient_evidence: True iff Decision is Deny{InsufficientEvidence{}}.
def deny_insufficient_evidence(d: Gate.Decision) -> Bool:
  match d:
    case Gate.Decision.Deny{reason}:
      match reason:
        case Gate.DenyReason.InsufficientEvidence{}:  True{}
        case _:
          False{}
    case _:
      False{}

# -------------------------------------------------------------------------
# LAW-MRVN04-001 -- Closed denies everything
# -------------------------------------------------------------------------
#
# For all (actor, capability, evidence),
#   authorize(actor, capability, Closed, evidence)
#   ==
#   Decision.Deny{DenyReason.Terminal{}}
#
# This is intentionally a full Decision equality (not just is_allowed ==
# False).  See ACT04 sec.7.

law closed_denies_everything:
  for +a: Gate.Actor
  for +c: Gate.Capability
  for +e: Gate.Evidence
  {Gate.authorize(a, c, Gate.Lifecycle.Closed{}, e)
     == Gate.Decision.Deny{Gate.DenyReason.Terminal{}}
   : Gate.Decision}

# -------------------------------------------------------------------------
# LAW-MRVN04-002 -- Agent cannot Freeze or Close
# -------------------------------------------------------------------------
#
# For all lifecycle/evidence:
#   is_allowed(authorize(Agent, Freeze, lifecycle, evidence)) == False
#   is_allowed(authorize(Agent, Close,  lifecycle, evidence)) == False

law agent_cannot_freeze:
  for +s: Gate.Lifecycle
  for +e: Gate.Evidence
  {is_allowed(Gate.authorize(
       Gate.Actor.Agent{}, Gate.Capability.Freeze{}, s, e))
     == False{}
   : Bool}

law agent_cannot_close:
  for +s: Gate.Lifecycle
  for +e: Gate.Evidence
  {is_allowed(Gate.authorize(
       Gate.Actor.Agent{}, Gate.Capability.Close{}, s, e))
     == False{}
   : Bool}

# -------------------------------------------------------------------------
# LAW-MRVN04-003 -- Replay cannot authorize irreversible actions
# -------------------------------------------------------------------------

law replay_cannot_authorize_freeze:
  for +a: Gate.Actor
  for +s: Gate.Lifecycle
  {is_allowed(Gate.authorize(
       a, Gate.Capability.Freeze{}, s, Gate.Evidence.Replay{}))
     == False{}
   : Bool}

law replay_cannot_authorize_close:
  for +a: Gate.Actor
  for +s: Gate.Lifecycle
  {is_allowed(Gate.authorize(
       a, Gate.Capability.Close{}, s, Gate.Evidence.Replay{}))
     == False{}
   : Bool}

# -------------------------------------------------------------------------
# LAW-MRVN04-004 -- Live Reviewer can Freeze exactly from Active/Halted
# -------------------------------------------------------------------------

law reviewer_freeze_live_iff_freeze_lifecycle_ok:
  for +s: Gate.Lifecycle
  {is_allowed(Gate.authorize(
       Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, s, Gate.Evidence.Live{}))
     == freeze_lifecycle_ok(s)
   : Bool}

# -------------------------------------------------------------------------
# LAW-MRVN04-005 -- Close iff Reviewer + Frozen + Live
# -------------------------------------------------------------------------

law reviewer_close_iff_reviewer_frozen_live:
  for +a: Gate.Actor
  for +s: Gate.Lifecycle
  for +e: Gate.Evidence
  {is_allowed(Gate.authorize(
       a, Gate.Capability.Close{}, s, e))
     == (is_reviewer(a) && is_frozen(s) && is_live(e))
   : Bool}

# -------------------------------------------------------------------------
# LAW-MRVN04-006 -- Halt iff (Active, halt_actor_ok, replay_or_live)
# -------------------------------------------------------------------------

law halt_iff_active_halt_actor_ok_replay_or_live:
  for +a: Gate.Actor
  for +s: Gate.Lifecycle
  for +e: Gate.Evidence
  {is_allowed(Gate.authorize(
       a, Gate.Capability.Halt{}, s, e))
     == (is_active(s) && halt_actor_ok(a) && has_replay_or_live(e))
   : Bool}

# -------------------------------------------------------------------------
# LAW-MRVN04-007 -- Work iff (work_actor_ok, work_lifecycle_ok)
# -------------------------------------------------------------------------

law work_iff_work_actor_ok_and_work_lifecycle_ok:
  for +a: Gate.Actor
  for +s: Gate.Lifecycle
  for +e: Gate.Evidence
  {is_allowed(Gate.authorize(
       a, Gate.Capability.Work{}, s, e))
     == (work_actor_ok(a) && work_lifecycle_ok(s))
   : Bool}

# -------------------------------------------------------------------------
# LAW-MRVN04-008 -- Work evidence irrelevance (Decision equality)
# -------------------------------------------------------------------------

law work_evidence_none_eq_replay:
  for +a: Gate.Actor
  for +s: Gate.Lifecycle
  {Gate.authorize(a, Gate.Capability.Work{}, s, Gate.Evidence.None{})
     == Gate.authorize(a, Gate.Capability.Work{}, s, Gate.Evidence.Replay{})
   : Gate.Decision}

law work_evidence_replay_eq_live:
  for +a: Gate.Actor
  for +s: Gate.Lifecycle
  {Gate.authorize(a, Gate.Capability.Work{}, s, Gate.Evidence.Replay{})
     == Gate.authorize(a, Gate.Capability.Work{}, s, Gate.Evidence.Live{})
   : Gate.Decision}

# -------------------------------------------------------------------------
# LAW-MRVN04-009 -- Privileged evidence monotonicity (Halt only)
# -------------------------------------------------------------------------

law halt_replay_allow_implies_live_allow:
  for +a: Gate.Actor
  for +s: Gate.Lifecycle
  for h: {is_allowed(Gate.authorize(
            a, Gate.Capability.Halt{}, s, Gate.Evidence.Replay{}))
            == True{}
          : Bool}
  {is_allowed(Gate.authorize(
       a, Gate.Capability.Halt{}, s, Gate.Evidence.Live{}))
     == True{}
   : Bool}

# -------------------------------------------------------------------------
# LAW-MRVN04-012 -- Deny reason coherence (high-value cells)
# -------------------------------------------------------------------------

law halt_active_agent_yields_wrong_actor:
  {Gate.authorize(
       Gate.Actor.Agent{}, Gate.Capability.Halt{},
       Gate.Lifecycle.Active{}, Gate.Evidence.None{})
     == Gate.Decision.Deny{Gate.DenyReason.WrongActor{}}
   : Gate.Decision}

law halt_active_reviewer_none_yields_insufficient_evidence:
  {Gate.authorize(
       Gate.Actor.Reviewer{}, Gate.Capability.Halt{},
       Gate.Lifecycle.Active{}, Gate.Evidence.None{})
     == Gate.Decision.Deny{Gate.DenyReason.InsufficientEvidence{}}
   : Gate.Decision}

law freeze_reviewer_draft_yields_wrong_lifecycle:
  {Gate.authorize(
       Gate.Actor.Reviewer{}, Gate.Capability.Freeze{},
       Gate.Lifecycle.Draft{}, Gate.Evidence.Live{})
     == Gate.Decision.Deny{Gate.DenyReason.WrongLifecycle{}}
   : Gate.Decision}



