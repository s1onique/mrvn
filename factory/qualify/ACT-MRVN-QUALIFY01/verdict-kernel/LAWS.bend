# ACT-MRVN-QUALIFY01 LAWS.bend -- the specification.

import Base
import ./main.bend as Gate

# -------------------------------------------------------------------------
# Helpers (predicates over Check and Rollout)
#
# Defined in terms of data constructors, NOT in terms of rollout_status.
# -------------------------------------------------------------------------

# a check is "blocking-fail" iff it is Required+Fail
def blocking_fail(c: Gate.Check) -> Bool:
  match c:
    case Gate.Decision_Outcome{Gate.Decision.Required{}, Gate.Outcome.Fail{}}:
      True{}
    case _:
      False{}

# any_blocking_fail is the disjunction of bf(c) over c in xs.
# Uses an iterative helper with an explicit accumulator so that the
# short-circuit on a True{} finding is observable in the WNF (so the
# LAWS-003 proof can extract a contradiction in the Required+Fail case).
# Direct structural recursion on the list. The function inspects
# bf(h) and short-circuits to True{} when bf(h) is True{}. This
# short-circuit is observable in the WNF: when the head is
# Required+Fail, any_blocking_fail(h <> t) reduces to True{}
# directly, which is what the LAWS-003 proof requires.
def any_blocking_fail.step(bf_h: Bool, t: List<&2, Gate.Check>, rec: Bool) -> Bool:
  match bf_h:
    case True{}:
      True{}
    case False{}:
      rec

def any_blocking_fail(+xs: List<&2, Gate.Check>) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case h <> t:
      any_blocking_fail.step(blocking_fail(h), t, any_blocking_fail(t))

# Bool contradiction -> Empty.
# Following the pattern in evals/firm.looper_cancellation.bend
# NOTE: orientation is True -> Unit, False -> Empty so that the
# witness {True{} == False{} : Bool} (LHS=True, RHS=False) lines up
# with the J-rule: b_gol = P(RHS) = Empty fits the goal Empty, and
# the body Unit{} inhabits P(LHS) = Unit.
def false_type(b: Bool) -> Type:
  match b:
    case True{}: Unit
    case False{}: Empty

def bool_clash(e: {True{} == False{} : Bool}) -> Empty:
  %e : false_type(_)
  Unit{}

# -------------------------------------------------------------------------
# LAW-MRVN-001 (advisory non-blocking)
# -------------------------------------------------------------------------
law advisory_non_blocking:
  for +xs     : List<&2, Gate.Check>
  for +outcome: Gate.Outcome
  {Gate.rollout_status(
      Gate.Decision_Outcome{Gate.Decision.Advisory{}, outcome} <> xs)
    == Gate.rollout_status(xs)
    : Gate.Rollout}

# -------------------------------------------------------------------------
# LAW-MRVN-002 (required failure blocks)
# -------------------------------------------------------------------------
law required_failure_blocks:
  for +xs: List<&2, Gate.Check>
  {Gate.rollout_status(
      Gate.Decision_Outcome{Gate.Decision.Required{}, Gate.Outcome.Fail{}} <> xs)
    == Gate.Rollout.Fail{}
    : Gate.Rollout}

# -------------------------------------------------------------------------
# LAW-MRVN-003 (no blocking failure implies rollout pass)
# -------------------------------------------------------------------------
law no_blocking_fail_implies_rollout_pass:
  for +xs: List<&2, Gate.Check>
  for no_block: {any_blocking_fail(xs) == False{} : Bool}
  {Gate.rollout_status(xs) == Gate.Rollout.Pass{} : Gate.Rollout}

# -------------------------------------------------------------------------
# LAW-MRVN-004 (adjacent swap: bounded order-irrelevance)
# -------------------------------------------------------------------------
law adjacent_swap:
  for +prefix: List<&2, Gate.Check>
  for +a      : Gate.Check
  for +b      : Gate.Check
  for +suffix: List<&2, Gate.Check>
  {Gate.rollout_status(Gate.append(Gate.append(prefix, a <> Nil{}),
      Gate.append(b <> Nil{}, suffix)))
    == Gate.rollout_status(Gate.append(Gate.append(prefix, b <> Nil{}),
      Gate.append(a <> Nil{}, suffix)))
    : Gate.Rollout}
