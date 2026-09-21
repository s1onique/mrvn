# ACT-MRVN-QUALIFY10 PROOF.bend -- proofs of the laws in LAWS.bend.
#
# Strategy: every law is discharged by structural induction / case
# split over the relevant constructors.  WNF reduces authorize(...) to
# the leaf decision directly, so {==} discharges.
#
# No @unsafe, no foreign imports, no open claims.

import Base
import ./main.bend as Gate
import ./LAWS.bend as Laws

# -------------------------------------------------------------------------
# LAW-IO-001 -- Work iff actor in {Agent, Reviewer}
# -------------------------------------------------------------------------
# (Inline cases in `Laws.work_iff_agent_or_reviewer`.)

def Laws.work_iff_agent_or_reviewer(r):
  match r:
    case Gate.Role.Agent{}:      {==}
    case Gate.Role.Reviewer{}:   {==}
    case Gate.Role.Automation{}: {==}

# -------------------------------------------------------------------------
# LAW-IO-002 -- Work automation yields Deny{NoAutomation}
# -------------------------------------------------------------------------

def Laws.work_automation_yields_deny(): {==}

# -------------------------------------------------------------------------
# LAW-IO-003 -- Pure determinism (six leaf equalities)
# -------------------------------------------------------------------------

def Laws.agent_work_is_allow(): {==}
def Laws.reviewer_work_is_allow(): {==}
def Laws.reviewer_halt_is_allow(): {==}
def Laws.agent_halt_is_deny(): {==}
def Laws.automation_halt_is_deny(): {==}

# -------------------------------------------------------------------------
# LAW-IO-004 -- Cross-role Work equivalence (Agent vs Reviewer).
# Both sides reduce directly to Allow.  WNF reduces each
# authorize(...) to its leaf constructor; the two leaves are the
# same constructor with no payload, so {==} discharges.
# -------------------------------------------------------------------------

def Laws.agent_and_reviewer_share_work_decision(): {==}

# -------------------------------------------------------------------------
# LAW-IO-005 -- Cross-cell pure reduction (Reviewer+Halt -> Agent+Work).
# Both sides reduce directly to Allow.  Same WNF discipline.
# -------------------------------------------------------------------------

def Laws.reviewer_halt_equals_agent_work_allow(): {==}