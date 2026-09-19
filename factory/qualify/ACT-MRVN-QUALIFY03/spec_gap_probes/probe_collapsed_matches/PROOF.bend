# ACT-MRVN-QUALIFY03 PROOF.bend -- proofs of the laws in LAWS.bend.
#
# Strategy:
#   - Local laws (001-005) are discharged by case-split structural
#     induction on (State, LcEvent).  When the implementation's WNF
#     reduces to the law body, {==} discharges.
#   - Replay laws (006-008) use:
#       * induction on the event list with case-split on e for the
#         constructor-decomposition step;
#       * Equal.cong over `result_state` for substitution in 008.
#   - The Frozen-replay law (007) is stated in its strong form
#     (post_freeze_replay_remains_post_freeze) so induction has a
#     usable induction hypothesis.
#
# No @unsafe.  No foreign imports.  No open claims.  No ?TODO.

import Base
import ./main.bend as Gate
import ./LAWS.bend as Laws

# -------------------------------------------------------------------------
# LAW-MRVN03-005 -- Halt/Resume round trip (discharged by {==} directly)
# -------------------------------------------------------------------------
#
# WNF reduction:
#   step(Active, Halt)            = Accepted{Halted{}}
#   result_state(Accepted{Halt})  = Halted{}
#   step(Halted, Resume)          = Accepted{Active{}}
#   result_state(Accepted{Activ}) = Active{}
# Both sides reduce to Active{}, and {==} discharges.
def Laws.halt_resume_round_trip(): {==}

# -------------------------------------------------------------------------
# LAW-MRVN03-002 -- Closed is locally absorbing
# -------------------------------------------------------------------------
#
# From Closed, every event is Rejected{Closed{}}.  Both laws reduce by
# case-split on e followed by {==}.

def Laws.closed_is_locally_absorbing_state(e):
  match e:
    case Gate.LcEvent.Activate{}: {==}
    case Gate.LcEvent.Halt{}:     {==}
    case Gate.LcEvent.Resume{}:   {==}
    case Gate.LcEvent.Freeze{}:   {==}
    case Gate.LcEvent.Close{}:    {==}

def Laws.closed_is_locally_absorbing_rejected(e):
  match e:
    case Gate.LcEvent.Activate{}: {==}
    case Gate.LcEvent.Halt{}:     {==}
    case Gate.LcEvent.Resume{}:   {==}
    case Gate.LcEvent.Freeze{}:   {==}
    case Gate.LcEvent.Close{}:    {==}

# -------------------------------------------------------------------------
# LAW-MRVN03-003 -- Frozen cannot resume ordinary work
# -------------------------------------------------------------------------
#
# From Frozen:
#   Activate/Halt/Resume/Freeze -> Rejected{Frozen{}} (is_post_freeze = True)
#   Close                        -> Accepted{Closed{}} (is_post_freeze = True)
# Both target states are post-freeze.  {==} after case-split.

def Laws.frozen_step_remains_post_freeze(e):
  match e:
    case Gate.LcEvent.Activate{}: {==}
    case Gate.LcEvent.Halt{}:     {==}
    case Gate.LcEvent.Resume{}:   {==}
    case Gate.LcEvent.Freeze{}:   {==}
    case Gate.LcEvent.Close{}:    {==}

# -------------------------------------------------------------------------
# LAW-MRVN03-004 -- Close requires Frozen
# -------------------------------------------------------------------------
#
# The Close transition follows the close_target map.  Case-split on s
# gives the canonical transition and {==} discharges each arm.

def Laws.close_requires_frozen(s):
  match s:
    case Gate.State.Draft{}:  {==}
    case Gate.State.Active{}: {==}
    case Gate.State.Halted{}: {==}
    case Gate.State.Frozen{}: {==}
    case Gate.State.Closed{}: {==}

# -------------------------------------------------------------------------
# LAW-MRVN03-004b -- Close acceptance authority (STRENGTHENED form)
# -------------------------------------------------------------------------
#
# Two laws, one per direction:
#   close_accepted_from_frozen:     is_frozen(s) => is_accepted(step(s,Close)) == True
#   close_rejected_from_non_frozen: !is_frozen(s) => is_accepted(step(s,Close)) == False
#
# Each proof: case-split on s.  For each arm we unfold step to the
# canonical transition (or its collapsed-match equivalent), evaluate
# is_accepted by constructor, and {==} discharges.
#
# Note: the collapsed-match impl in main.bend has the canonical
# semantics for Close (Frozen -> Accepted{Closed}, others -> Rejected),
# so the same proof structure as the canonical lifecycle-kernel applies.

def Laws.close_accepted_from_frozen(s, h):
  match s:
    case Gate.State.Frozen{}:
      # step(Frozen, Close) = Accepted{Closed}; is_accepted returns True.
      {==}
    case Gate.State.Draft{}:
      # The goal {is_accepted(step(Draft, Close)) == True} is impossible
      # because the law hypothesis `is_frozen(Draft) == True` is False.
      Empty.absurd(
        {Laws.is_accepted(Gate.step(Gate.State.Draft{}, Gate.LcEvent.Close{})) == True{} : Bool},
        Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))
    case Gate.State.Active{}:
      Empty.absurd(
        {Laws.is_accepted(Gate.step(Gate.State.Active{}, Gate.LcEvent.Close{})) == True{} : Bool},
        Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))
    case Gate.State.Halted{}:
      Empty.absurd(
        {Laws.is_accepted(Gate.step(Gate.State.Halted{}, Gate.LcEvent.Close{})) == True{} : Bool},
        Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))
    case Gate.State.Closed{}:
      Empty.absurd(
        {Laws.is_accepted(Gate.step(Gate.State.Closed{}, Gate.LcEvent.Close{})) == True{} : Bool},
        Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))

def Laws.close_rejected_from_non_frozen(s, h):
  match s:
    case Gate.State.Frozen{}:
      # The goal {is_accepted(step(Frozen, Close)) == False} is impossible
      # because the law hypothesis `is_frozen(Frozen) == False` is False.
      Empty.absurd(
        {Laws.is_accepted(Gate.step(Gate.State.Frozen{}, Gate.LcEvent.Close{})) == False{} : Bool},
        Laws.bool_clash(h))
    case Gate.State.Draft{}:
      # step(Draft, Close) returns Rejected{Draft}; is_accepted returns False.
      {==}
    case Gate.State.Active{}:
      # step(Active, Close) returns Rejected{Active}; is_accepted returns False.
      {==}
    case Gate.State.Halted{}:
      # step(Halted, Close) returns Rejected{Halted}; is_accepted returns False.
      {==}
    case Gate.State.Closed{}:
      # step(Closed, Close) returns Rejected{Closed}; is_accepted returns False.
      {==}

# -------------------------------------------------------------------------
# LAW-MRVN03-001 -- rejection preserves state
# -------------------------------------------------------------------------
#
# For every (s, e), if step(s, e) equals Rejected{r}, then r == s.
# The proof is by case-split on s, then on e.  In the accepted arms
# (Closed at any e; Active+Activate/Resume/Close; Halted+Activate/Halt/Close;
# Draft+Halt/Resume/Close; Frozen+Activate/Halt/Resume/Freeze) the hypothesis
# is absurd -- we lift Empty via acc_eq_rej_is_empty.
# In the rejected arms (the remaining 14), we extract the State via
# Equal.cong over `result_state`, then flip orientation with Equal.sym.

# Helper: project the Rejected state out of an equality, then flip.
def proj_rej_sym(
  +s_known: Gate.State,
  +r: Gate.State,
  h: {Gate.Transition.Rejected{s_known} == Gate.Transition.Rejected{r} : Gate.Transition})
  -> {r == s_known : Gate.State}:
  Equal.sym(Gate.State, s_known, r, Equal.cong(Gate.Transition, Gate.State, Gate.result_state, Gate.Transition.Rejected{s_known}, Gate.Transition.Rejected{r}, h))

def Laws.rejection_preserves_state(s, e, r, h):
  match s:
    case Gate.State.Draft{}:
      match e:
        case Gate.LcEvent.Activate{}:
          Empty.absurd({r == Gate.State.Draft{} : Gate.State},
            Laws.acc_eq_rej_is_empty(Gate.State.Active{}, r, h))
        case Gate.LcEvent.Freeze{}:
          Empty.absurd({r == Gate.State.Draft{} : Gate.State},
            Laws.acc_eq_rej_is_empty(Gate.State.Frozen{}, r, h))
        case Gate.LcEvent.Halt{}:
          proj_rej_sym(Gate.State.Draft{}, r, h)
        case Gate.LcEvent.Resume{}:
          proj_rej_sym(Gate.State.Draft{}, r, h)
        case Gate.LcEvent.Close{}:
          proj_rej_sym(Gate.State.Draft{}, r, h)
    case Gate.State.Active{}:
      match e:
        case Gate.LcEvent.Activate{}:
          proj_rej_sym(Gate.State.Active{}, r, h)
        case Gate.LcEvent.Halt{}:
          Empty.absurd({r == Gate.State.Active{} : Gate.State},
            Laws.acc_eq_rej_is_empty(Gate.State.Halted{}, r, h))
        case Gate.LcEvent.Resume{}:
          proj_rej_sym(Gate.State.Active{}, r, h)
        case Gate.LcEvent.Freeze{}:
          Empty.absurd({r == Gate.State.Active{} : Gate.State},
            Laws.acc_eq_rej_is_empty(Gate.State.Frozen{}, r, h))
        case Gate.LcEvent.Close{}:
          proj_rej_sym(Gate.State.Active{}, r, h)
    case Gate.State.Halted{}:
      match e:
        case Gate.LcEvent.Activate{}:
          proj_rej_sym(Gate.State.Halted{}, r, h)
        case Gate.LcEvent.Halt{}:
          proj_rej_sym(Gate.State.Halted{}, r, h)
        case Gate.LcEvent.Resume{}:
          Empty.absurd({r == Gate.State.Halted{} : Gate.State},
            Laws.acc_eq_rej_is_empty(Gate.State.Active{}, r, h))
        case Gate.LcEvent.Freeze{}:
          Empty.absurd({r == Gate.State.Halted{} : Gate.State},
            Laws.acc_eq_rej_is_empty(Gate.State.Frozen{}, r, h))
        case Gate.LcEvent.Close{}:
          proj_rej_sym(Gate.State.Halted{}, r, h)
    case Gate.State.Frozen{}:
      match e:
        case Gate.LcEvent.Activate{}:
          proj_rej_sym(Gate.State.Frozen{}, r, h)
        case Gate.LcEvent.Halt{}:
          proj_rej_sym(Gate.State.Frozen{}, r, h)
        case Gate.LcEvent.Resume{}:
          proj_rej_sym(Gate.State.Frozen{}, r, h)
        case Gate.LcEvent.Freeze{}:
          proj_rej_sym(Gate.State.Frozen{}, r, h)
        case Gate.LcEvent.Close{}:
          Empty.absurd({r == Gate.State.Frozen{} : Gate.State},
            Laws.acc_eq_rej_is_empty(Gate.State.Closed{}, r, h))
    case Gate.State.Closed{}:
      match e:
        case Gate.LcEvent.Activate{}:
          proj_rej_sym(Gate.State.Closed{}, r, h)
        case Gate.LcEvent.Halt{}:
          proj_rej_sym(Gate.State.Closed{}, r, h)
        case Gate.LcEvent.Resume{}:
          proj_rej_sym(Gate.State.Closed{}, r, h)
        case Gate.LcEvent.Freeze{}:
          proj_rej_sym(Gate.State.Closed{}, r, h)
        case Gate.LcEvent.Close{}:
          proj_rej_sym(Gate.State.Closed{}, r, h)

# -------------------------------------------------------------------------
# LAW-MRVN03-006 -- Closed is replay-absorbing
# -------------------------------------------------------------------------
#
# By structural induction on the event list:
#   Nil:  replay(Nil, Closed) = Closed, so {==}.
#   e<>r: replay(e<>r, Closed)
#           = replay(r, result_state(step(Closed, e)))   -- by WNF of replay
#           = replay(r, Closed)                            -- by LAW-002 WNF
#           == Closed                                      -- by IH
# {==} after the IH.
def Laws.closed_is_replay_absorbing(events):
  match events:
    case Nil{}: {==}
    case e <> rest:
      Equal.trans(
        Gate.State,
        Gate.replay(rest, Gate.result_state(Gate.step(Gate.State.Closed{}, e))),
        Gate.replay(rest, Gate.State.Closed{}),
        Gate.State.Closed{},
        Equal.cong(
          Gate.State, Gate.State,
          s => Gate.replay(rest, s),
          Gate.result_state(Gate.step(Gate.State.Closed{}, e)),
          Gate.State.Closed{},
          Laws.closed_is_locally_absorbing_state(e)),
        Laws.closed_is_replay_absorbing(rest))

# -------------------------------------------------------------------------
# Helper lemma: a single step from a post-freeze state stays post-freeze.
# -------------------------------------------------------------------------
#
# Case-split on s (Frozen/Closed/other) and on e.  In the post-freeze
# arms the result is Frozen or Closed; in the other arms the hypothesis
# is_post_freeze(s) == True is impossible, so we use Empty.absurd.

def Laws.post_freeze_step_remains_post_freeze(s, e, h):
  match s:
    case Gate.State.Frozen{}:
      match e:
        case Gate.LcEvent.Activate{}: {==}
        case Gate.LcEvent.Halt{}:     {==}
        case Gate.LcEvent.Resume{}:   {==}
        case Gate.LcEvent.Freeze{}:   {==}
        case Gate.LcEvent.Close{}:    {==}
    case Gate.State.Closed{}:
      match e:
        case Gate.LcEvent.Activate{}: {==}
        case Gate.LcEvent.Halt{}:     {==}
        case Gate.LcEvent.Resume{}:   {==}
        case Gate.LcEvent.Freeze{}:   {==}
        case Gate.LcEvent.Close{}:    {==}
    case Gate.State.Draft{}:
      Empty.absurd(
        {Laws.is_post_freeze(Gate.result_state(Gate.step(s, e))) == True{} : Bool},
        Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))
    case Gate.State.Active{}:
      Empty.absurd(
        {Laws.is_post_freeze(Gate.result_state(Gate.step(s, e))) == True{} : Bool},
        Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))
    case Gate.State.Halted{}:
      Empty.absurd(
        {Laws.is_post_freeze(Gate.result_state(Gate.step(s, e))) == True{} : Bool},
        Laws.bool_clash(Equal.sym(Bool, False{}, True{}, h)))

# -------------------------------------------------------------------------
# LAW-MRVN03-007 (strong form): post-freeze replay remains post-freeze
# -------------------------------------------------------------------------
#
# Induction on events:
#   Nil:  is_post_freeze(replay(Nil, s)) = is_post_freeze(s) = h.  {==}.
#   e<>r: is_post_freeze(replay(e<>r, s))
#           = is_post_freeze(replay(r, result_state(step(s, e))))
#         by IH (with the new state and a re-derived witness):
#           = True.
#         -- the new witness is post_freeze_step_remains_post_freeze(s, e, h).

# Helper with events first to satisfy the affine termination checker.
def post_freeze_replay_helper(
  +events: List<&2, Gate.LcEvent>,
  +s: Gate.State,
  h: {Laws.is_post_freeze(s) == True{} : Bool})
  -> {Laws.is_post_freeze(Gate.replay(events, s)) == True{} : Bool}:
  match events:
    case Nil{}: h
    case e <> rest:
      post_freeze_replay_helper(
        rest,
        Gate.result_state(Gate.step(s, e)),
        Laws.post_freeze_step_remains_post_freeze(s, e, h))

def Laws.post_freeze_replay_remains_post_freeze(s, events, h):
  post_freeze_replay_helper(events, s, h)

# LAW-MRVN03-007 corollary: replay from Frozen remains post-freeze.
# Direct application of the strong form with h := {is_post_freeze(Frozen) == True}.
def Laws.frozen_replay_remains_post_freeze(events):
  Laws.post_freeze_replay_remains_post_freeze(
    Gate.State.Frozen{}, events, {==})

# -------------------------------------------------------------------------
# LAW-MRVN03-008 -- Rejected event insertion is replay-neutral
# -------------------------------------------------------------------------
#
# Goal:  replay(e <> suffix, s) == replay(suffix, s).
# WNF:   LHS = replay(suffix, result_state(step(s, e)))
#                       == replay(suffix, s)        (by rej, via Equal.cong)
#                       == RHS                     (by reflexivity)
#
# The body is a single Equal.cong that lifts `rej : result_state(step(s, e))
# == s` through the closure `s' => replay(suffix, s')`.

def Laws.rejected_event_insertion_replay_neutral(s, e, suffix, rej):
  Equal.cong(
    Gate.State, Gate.State,
    s => Gate.replay(suffix, s),
    Gate.result_state(Gate.step(s, e)),
    s,
    rej)










