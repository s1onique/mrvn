# ACT-MRVN-QUALIFY03 LAWS.bend -- the immutable specification.
#
# This file is the specification authority for the lifecycle kernel.
# Once recorded (see LAWS_INITIAL_SHA256 in EVIDENCE.md), it must not
# change except via a documented SPECIFICATION_DEFECT correction.
#
# Discipline (ACT03 sec.12):
#   - Helper predicates (is_post_freeze, is_closed, is_rejected, ...)
#     inspect constructors, NOT the implementation's step function.
#   - No law may collapse into `step(...) == step(...)` or a tautology.
#   - Laws are stated over the public surface of `main.bend as Gate`:
#     step, result_state, accepted, replay, and the State/LcEvent types.

import Base
import ./main.bend as Gate

# -------------------------------------------------------------------------
# Specification predicates
# -------------------------------------------------------------------------
#
# Each predicate is defined in terms of constructor patterns only.  None
# of them call Gate.step or Gate.replay.  This is by design: the spec
# must remain independent of the implementation it is meant to constrain.

# is_post_freeze: True for the two states reachable *after* a Freeze
# transition (Frozen itself, and the terminal Closed state).  False for
# Draft, Active, Halted -- the ordinary-work states.
def is_post_freeze(s: Gate.State) -> Bool:
  match s:
    case Gate.State.Frozen{}: True{}
    case Gate.State.Closed{}: True{}
    case _:
      False{}

# is_closed: True iff the lifecycle state is the terminal Closed state.
def is_closed(s: Gate.State) -> Bool:
  match s:
    case Gate.State.Closed{}: True{}
    case _:
      False{}

# is_rejected: True iff the transition was rejected.  This is a
# predicate over the Transition's *constructor*, not over Gate.accepted
# (so the spec remains independent of the implementation).
def is_rejected(t: Gate.Transition) -> Bool:
  match t:
    case Gate.Transition.Rejected{state}: True{}
    case Gate.Transition.Accepted{next}:  False{}

# is_accepted: True iff the transition was accepted.
def is_accepted(t: Gate.Transition) -> Bool:
  match t:
    case Gate.Transition.Accepted{next}:  True{}
    case Gate.Transition.Rejected{state}: False{}

# Bool contradiction helper: a witness that True == False proves Empty.
# Same shape as ACT01's `bool_clash` (see verdict-kernel/LAWS.bend).
def false_type(b: Bool) -> Type:
  match b:
    case True{}: Unit
    case False{}: Empty

def bool_clash(e: {True{} == False{} : Bool}) -> Empty:
  %e : false_type(_)
  Unit{}

# Helper: target State of the Close transition (used by LAW-004).
# Draft/Active/Halted reject (stay put); Frozen accepts -> Closed;
# Closed rejects (stays Closed).
def close_target(s: Gate.State) -> Gate.State:
  match s:
    case Gate.State.Frozen{}: Gate.State.Closed{}
    case Gate.State.Closed{}: Gate.State.Closed{}
    case _:
      s

# -------------------------------------------------------------------------
# LAW-MRVN03-001 -- rejection preserves state
# -------------------------------------------------------------------------
#
# For every state and event, IF step(s, e) is Rejected{r}, THEN r == s.
# Stated as: given the witness that step(s, e) equals Rejected{r},
# prove r == s.  In the accepted arms the hypothesis is impossible
# and we lift Empty via the constructor discriminator.

# Type-level witness: Accepted and Rejected are distinct constructors,
# so an equality between them cannot hold.
def trans_kind(t: Gate.Transition) -> Type:
  match t:
    case Gate.Transition.Accepted{next}:  Unit
    case Gate.Transition.Rejected{state}: Empty

# acc_eq_rej_is_empty: an equality Accepted{n} == Rejected{r} yields Empty.
def acc_eq_rej_is_empty(
  +n: Gate.State,
  +r: Gate.State,
  e: {Gate.Transition.Accepted{n} == Gate.Transition.Rejected{r} : Gate.Transition})
  -> Empty:
  %e : trans_kind(_)
  Unit{}

law rejection_preserves_state:
  for +s: Gate.State
  for +e: Gate.LcEvent
  for +r: Gate.State
  {Gate.step(s, e) == Gate.Transition.Rejected{r} : Gate.Transition}
  -> {r == s : Gate.State}

# -------------------------------------------------------------------------
# LAW-MRVN03-002 -- Closed is locally absorbing
# -------------------------------------------------------------------------
#
# For every event, the result_state of step(Closed, e) is Closed, AND
# the transition is rejected.  Both statements are discharged.

law closed_is_locally_absorbing_state:
  for +e: Gate.LcEvent
  {Gate.result_state(Gate.step(Gate.State.Closed{}, e)) == Gate.State.Closed{} : Gate.State}

law closed_is_locally_absorbing_rejected:
  for +e: Gate.LcEvent
  {Gate.accepted(Gate.step(Gate.State.Closed{}, e)) == False{} : Bool}

# -------------------------------------------------------------------------
# LAW-MRVN03-003 -- Frozen cannot resume ordinary work
# -------------------------------------------------------------------------
#
# For every event, the result of stepping from Frozen is post-freeze.
law frozen_step_remains_post_freeze:
  for +e: Gate.LcEvent
  {is_post_freeze(Gate.result_state(Gate.step(Gate.State.Frozen{}, e))) == True{} : Bool}

# -------------------------------------------------------------------------
# LAW-MRVN03-004 -- Close requires Frozen
# -------------------------------------------------------------------------
#
# The Close transition follows the close_target map:
#   Draft  -> Draft  (Rejected{Draft{}})
#   Active -> Active (Rejected{Active{}})
#   Halted -> Halted (Rejected{Halted{}})
#   Frozen -> Closed (Accepted{Closed{}})
#   Closed -> Closed (Rejected{Closed{}})
law close_requires_frozen:
  for +s: Gate.State
  {Gate.result_state(Gate.step(s, Gate.LcEvent.Close{})) == close_target(s) : Gate.State}

# -------------------------------------------------------------------------
# LAW-MRVN03-004b -- Close acceptance authority (STRENGTHENED form)
# -------------------------------------------------------------------------
#
# Reviewer-suggested strengthening of LAW-004.  The base law above
# only constrains the resulting state; it does not encode the
# requirement that Close be Accepted iff state == Frozen.  This law
# closes the descriptive-vs-enforced gap by asserting the full
# acceptance authority using the constructor-level predicate
# `is_accepted` (defined above; independent of Gate.accepted).
#
# Specification, split into two parts to keep Bend's parser unambiguous:
#
#   close_accepted_from_frozen:
#     if s == Frozen, then is_accepted(step(s, Close)) == True
#
#   close_rejected_from_non_frozen:
#     if s != Frozen, then is_accepted(step(s, Close)) == False
#
# The witness `s == Frozen` / `s != Frozen` is folded using the
# spec-level `is_frozen` predicate and a Bool comparison, rather than
# a type-level equality inside the proposition.  This is robust to
# Bend's parser and is equivalent to the textual form
#   is_accepted(step(s, Close)) == (s == Frozen).

# Helper: True iff s is the Frozen state.  Spec-level predicate,
# implementation-independent (constructor-only pattern match).
def is_frozen(s: Gate.State) -> Bool:
  match s:
    case Gate.State.Frozen{}: True{}
    case _:
      False{}

law close_accepted_from_frozen:
  for +s: Gate.State
  for h: {is_frozen(s) == True{} : Bool}
  {is_accepted(Gate.step(s, Gate.LcEvent.Close{})) == True{} : Bool}

law close_rejected_from_non_frozen:
  for +s: Gate.State
  for h: {is_frozen(s) == False{} : Bool}
  {is_accepted(Gate.step(s, Gate.LcEvent.Close{})) == False{} : Bool}

# -------------------------------------------------------------------------
# LAW-MRVN03-005 -- Halt/Resume round trip
# -------------------------------------------------------------------------
#
# result_state(step(result_state(step(Active, Halt)), Resume)) == Active.
# Both individual transitions are accepted as part of the WNF.
law halt_resume_round_trip:
  {Gate.result_state(Gate.step(
      Gate.result_state(Gate.step(Gate.State.Active{}, Gate.LcEvent.Halt{})),
      Gate.LcEvent.Resume{}))
    == Gate.State.Active{} : Gate.State}

# -------------------------------------------------------------------------
# LAW-MRVN03-006 -- Closed is replay-absorbing
# -------------------------------------------------------------------------
#
# For every event list, replay(Closed, events) == Closed.
# This is the first required history theorem.
law closed_is_replay_absorbing:
  for +events: List<&2, Gate.LcEvent>
  {Gate.replay(events, Gate.State.Closed{}) == Gate.State.Closed{} : Gate.State}

# -------------------------------------------------------------------------
# LAW-MRVN03-007 -- Frozen replay remains post-freeze
# -------------------------------------------------------------------------
#
# For every event list, is_post_freeze(replay(Frozen, events)) == True.
# Stated in the strong form: for any post-freeze starting state s,
# replay(s, events) remains post-freeze.  The principal Frozen case is
# the corollary when s = Frozen{}.

# Helper lemma (private to LAWS.bend): a single step from a post-freeze
# state stays post-freeze.  Used in the inductive proof of LAW-007.
law post_freeze_step_remains_post_freeze:
  for +s: Gate.State
  for +e: Gate.LcEvent
  for h:  {is_post_freeze(s) == True{} : Bool}
  {is_post_freeze(Gate.result_state(Gate.step(s, e))) == True{} : Bool}

# Principal theorem: replay preserves post-freeze across any history.
law post_freeze_replay_remains_post_freeze:
  for +s: Gate.State
  for +events: List<&2, Gate.LcEvent>
  for h:  {is_post_freeze(s) == True{} : Bool}
  {is_post_freeze(Gate.replay(events, s)) == True{} : Bool}

# The principal Frozen corollary.
law frozen_replay_remains_post_freeze:
  for +events: List<&2, Gate.LcEvent>
  {is_post_freeze(Gate.replay(events, Gate.State.Frozen{})) == True{} : Bool}

# -------------------------------------------------------------------------
# LAW-MRVN03-008 -- Rejected event insertion is replay-neutral
# -------------------------------------------------------------------------
#
# When step(s, e) is rejected (its result_state equals s), inserting e
# in front of a suffix does not change the replay outcome.
# Witness: {result_state(step(s, e)) == s : State} -- the direct equality
# that makes the substitution in the proof.
law rejected_event_insertion_replay_neutral:
  for +s: Gate.State
  for +e: Gate.LcEvent
  for +suffix: List<&2, Gate.LcEvent>
  for rej: {Gate.result_state(Gate.step(s, e)) == s : Gate.State}
  {Gate.replay(e <> suffix, s) == Gate.replay(suffix, s) : Gate.State}



