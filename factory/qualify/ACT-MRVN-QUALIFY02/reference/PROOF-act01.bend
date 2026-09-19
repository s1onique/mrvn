# ACT-MRVN-QUALIFY01 PROOF.bend -- the proofs of the laws in LAWS.bend.

import Base
import ./main.bend as Gate
import ./LAWS.bend as Laws

# -------------------------------------------------------------------------
# LAW-MRVN-001 (advisory non-blocking)
# -------------------------------------------------------------------------
def Laws.advisory_non_blocking(xs, outcome):
  match xs:
    case Nil{}:
      {==}
    case _ <> _:
      {==}

# -------------------------------------------------------------------------
# LAW-MRVN-002 (required failure blocks)
# -------------------------------------------------------------------------
def Laws.required_failure_blocks(xs):
  {==}

# -------------------------------------------------------------------------
# LAW-MRVN-003 (no blocking failure implies rollout pass)
#
# Structural induction on xs.
# Base xs = Nil{}: {==} after rollout_status reduces.
# Step xs = h <> t:
#   h = Required+Fail: blocked by no_block (Empty.absurd).
#   otherwise: rollout_status recurses to rollout_status(t) = Pass{} by IH.
# -------------------------------------------------------------------------
#
# RESIDUAL: the otherwise-arm is TODO. The two outstanding obligations:
#   (i)  Deriving `{any_blocking_fail(t) == False : Bool}` from
#        `{any_blocking_fail(h <> t) == False : Bool}` when h is not
#        Required+Fail (the case context gives blocking_fail(h) = False,
#        but the WNF does not see this because blocking_fail(h) is a
#        computed Bool, not a constructor head).
#   (ii) Bridging `rollout_status(h <> t) == Pass` to
#        `rollout_status(t) == Pass` via the IH, when h is not
#        Required+Fail. The recursive structure of rollout_status is
#        hidden behind its case _, and the WNF does not unfold it.
# Both require lemmas that are out of scope for this qualification.

# Helper: derive Empty from the no_block contradiction in the
# Required+Fail case. With the iterative any_blocking_fail that
# short-circuits on the first blocking failure, the LHS of no_block
# reduces to True{} directly (since h is Required+Fail). Then
# no_block is morally `{True{} == False{} : Bool}`, and Laws.bool_clash
# turns it into Empty.
def no_blocking_fail_implies_rollout_pass.absurd(
  -t: List<&2, Gate.Check>,
  no_block: {Laws.any_blocking_fail(Gate.Decision_Outcome{Gate.Decision.Required{}, Gate.Outcome.Fail{}} <> t) == False{} : Bool})
  -> Empty:
  Laws.bool_clash(no_block)

def no_blocking_fail_implies_rollout_pass.fin(
  +h : Gate.Check,
  +t: List<&2, Gate.Check>,
  no_block: {Laws.any_blocking_fail(h <> t) == False{} : Bool})
  -> {Gate.rollout_status(h <> t) == Gate.Rollout.Pass{} : Gate.Rollout}:
  match h:
    case Gate.Decision_Outcome{Gate.Decision.Required{}, Gate.Outcome.Fail{}}:
      Empty.absurd(
        {Gate.rollout_status(h <> t) == Gate.Rollout.Pass{} : Gate.Rollout},
        no_blocking_fail_implies_rollout_pass.absurd(t, no_block))
    case _:
      # TODO: discharge this arm. See RESIDUAL above.
      ?TODO

def Laws.no_blocking_fail_implies_rollout_pass(xs, no_block):
  match xs:
    case Nil{}:
      {==}
    case h <> t:
      no_blocking_fail_implies_rollout_pass.fin(h, t, no_block)

# -------------------------------------------------------------------------
# LAW-MRVN-004 (adjacent swap: bounded order-irrelevance)
# -------------------------------------------------------------------------
def adjacent_swap.fin(
  +a: Gate.Check,
  +b: Gate.Check,
  -suffix: List<&2, Gate.Check>)
  -> {Gate.rollout_status(a <> Gate.append(b <> Nil{}, suffix))
    == Gate.rollout_status(b <> Gate.append(a <> Nil{}, suffix))
    : Gate.Rollout}:
  match a:
    case Gate.Decision_Outcome{Gate.Decision.Required{}, Gate.Outcome.Fail{}}:
      match b:
        case Gate.Decision_Outcome{Gate.Decision.Required{}, Gate.Outcome.Fail{}}:
          {==}
        case _:
          # TODO: in this arm, a is Required+Fail but b is not.
          # rollout_status(a <> ...) = Fail (definitional), but
          # rollout_status(b <> ...) doesn't reduce without further
          # case matching. Needs a custom lemma.
          ?TODO
    case _:
      match b:
        case Gate.Decision_Outcome{Gate.Decision.Required{}, Gate.Outcome.Fail{}}:
          # TODO: symmetric to the above.
          ?TODO
        case _:
          # TODO: both a and b are non-Required+Fail; rollout_status
          # recurses on both sides, but the WNF doesn't see this.
          ?TODO

def adjacent_swap.step(
  +prefix: List<&2, Gate.Check>,
  +a: Gate.Check,
  +b: Gate.Check,
  -suffix: List<&2, Gate.Check>,
  rec: {Gate.rollout_status(Gate.append(Gate.append(prefix, b <> Nil{}),
       Gate.append(a <> Nil{}, suffix)))
     == Gate.rollout_status(Gate.append(Gate.append(prefix, a <> Nil{}),
       Gate.append(b <> Nil{}, suffix)))
     : Gate.Rollout})
  -> {Gate.rollout_status(Gate.append(Gate.append(prefix, a <> Nil{}),
       Gate.append(b <> Nil{}, suffix)))
    == Gate.rollout_status(Gate.append(Gate.append(prefix, b <> Nil{}),
       Gate.append(a <> Nil{}, suffix)))
    : Gate.Rollout}:
  match prefix:
    case Nil{}:
      adjacent_swap.fin(a, b, suffix)
    case _ <> _:
      # TODO: The structural induction on prefix requires bridging
      # rollout_status(append(prefix, ...)) to rollout_status(append(tail_of_prefix, ...))
      # using the IH. The bridge depends on rollout_status's recursive
      # definition, which isn't visible to the WNF (see RESIDUAL on LAWS-003).
      ?TODO

def Laws.adjacent_swap(prefix, a, b, suffix):
  match prefix:
    case Nil{}:
      adjacent_swap.fin(a, b, suffix)
    case _ <> _:
      # TODO: the inductive step requires bridging
      # rollout_status(prefix <> ...) to rollout_status(tail(prefix) <> ...)
      # using the IH. See RESIDUAL on LAWS-003.
      ?TODO
