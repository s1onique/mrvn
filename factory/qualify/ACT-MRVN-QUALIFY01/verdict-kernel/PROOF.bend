# ACT-MRVN-QUALIFY02 PROOF.bend -- the proofs of the laws in LAWS.bend.

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
# -------------------------------------------------------------------------
def Laws.no_blocking_fail_implies_rollout_pass(xs, no_block):
  match xs:
    case Nil{}:
      {==}
    case h <> t:
      match h:
        case Gate.Decision_Outcome{Gate.Decision.Required{}, Gate.Outcome.Fail{}}:
          Empty.absurd(
            {Gate.rollout_status(h <> t) == Gate.Rollout.Pass{} : Gate.Rollout},
            Laws.bool_clash(no_block))
        case Gate.Decision_Outcome{Gate.Decision.Required{}, Gate.Outcome.Pass{}}:
          Laws.no_blocking_fail_implies_rollout_pass(t, no_block)
        case Gate.Decision_Outcome{Gate.Decision.Advisory{}, _}:
          Laws.no_blocking_fail_implies_rollout_pass(t, no_block)

# -------------------------------------------------------------------------
# LAW-MRVN-004 (adjacent swap: bounded order-irrelevance)
# -------------------------------------------------------------------------
def law004_fin(
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
        case Gate.Decision_Outcome{Gate.Decision.Required{}, Gate.Outcome.Pass{}}:
          {==}
        case Gate.Decision_Outcome{Gate.Decision.Advisory{}, _}:
          {==}
    case Gate.Decision_Outcome{Gate.Decision.Required{}, Gate.Outcome.Pass{}}:
      match b:
        case Gate.Decision_Outcome{Gate.Decision.Required{}, Gate.Outcome.Fail{}}:
          {==}
        case Gate.Decision_Outcome{Gate.Decision.Required{}, Gate.Outcome.Pass{}}:
          {==}
        case Gate.Decision_Outcome{Gate.Decision.Advisory{}, _}:
          {==}
    case Gate.Decision_Outcome{Gate.Decision.Advisory{}, _}:
      match b:
        case Gate.Decision_Outcome{Gate.Decision.Required{}, Gate.Outcome.Fail{}}:
          {==}
        case Gate.Decision_Outcome{Gate.Decision.Required{}, Gate.Outcome.Pass{}}:
          {==}
        case Gate.Decision_Outcome{Gate.Decision.Advisory{}, _}:
          {==}

def Laws.adjacent_swap(prefix, a, b, suffix):
  match prefix:
    case Nil{}:
      law004_fin(a, b, suffix)
    case p_head <> p_tail:
      # Case-split on p_head's full constructor pattern so the WNF
      # unfolds rollout_status's inner match.
      match p_head:
        case Gate.Decision_Outcome{Gate.Decision.Required{}, Gate.Outcome.Fail{}}:
          # rollout_status(p_head <> _) = Fail on both sides. {==}.
          {==}
        case Gate.Decision_Outcome{Gate.Decision.Required{}, Gate.Outcome.Pass{}}:
          Laws.adjacent_swap(p_tail, a, b, suffix)
        case Gate.Decision_Outcome{Gate.Decision.Advisory{}, _}:
          Laws.adjacent_swap(p_tail, a, b, suffix)
