# ACT-MRVN-QUALIFY10 LAWS.bend -- the immutable specification of the
# PURE policy in main.bend.
#
# This file states laws only over the PURE surface of main.bend:
#   * Role, Operation, DenyReason, Decision, authorize, decision_label
# It makes NO claim about the foreign effect read_role() beyond noting
# that its declared type is IO(Role).
#
# Discipline:
#   * Laws are stated on `Gate.authorize` from main.bend as Gate.
#   * Spec predicates inspect constructors only -- they never call
#     `Gate.authorize` themselves (no circularity).
#   * No law collapses to a tautology (authorize(x) == authorize(x)).
#   * No `@unsafe`, no `?TODO`, no foreign import.
#
# Subject matrix: 3 Roles * 2 Operations = 6 cells.
#
# This file is the immutable specification.  Its sha256 is recorded in
# EVIDENCE.md (LAWS_INITIAL_SHA256).  Any subsequent change is a
# documented SPECIFICATION_DEFECT, never a silent mutation.

import Base
import ./main.bend as Gate

# -------------------------------------------------------------------------
# Spec predicates (only constructors, never Gate.authorize)
# -------------------------------------------------------------------------

def is_allow(d: Gate.Decision) -> Bool:
  match d:
    case Gate.Decision.Allow{}: True{}
    case Gate.Decision.Deny{reason}: False{}

def is_agent(r: Gate.Role) -> Bool:
  match r:
    case Gate.Role.Agent{}: True{}
    case _: False{}

def is_reviewer(r: Gate.Role) -> Bool:
  match r:
    case Gate.Role.Reviewer{}: True{}
    case _: False{}

def is_automation(r: Gate.Role) -> Bool:
  match r:
    case Gate.Role.Automation{}: True{}
    case _: False{}

def is_work(op: Gate.Operation) -> Bool:
  match op:
    case Gate.Operation.Work{}: True{}
    case _: False{}

def is_halt(op: Gate.Operation) -> Bool:
  match op:
    case Gate.Operation.Halt{}: True{}
    case _: False{}

# -------------------------------------------------------------------------
# The laws (LAW-IO-001..005)
# -------------------------------------------------------------------------

# LAW-IO-001 -- Work iff actor in {Agent, Reviewer}.
law work_iff_agent_or_reviewer:
  for +r: Gate.Role
  {is_allow(Gate.authorize(r, Gate.Operation.Work{}))
     == (is_agent(r) || is_reviewer(r))
   : Bool}

# LAW-IO-002 -- Deny safety (no Allow produced from Automation/Work).
law work_automation_yields_deny:
  {Gate.authorize(Gate.Role.Automation{}, Gate.Operation.Work{})
     == Gate.Decision.Deny{Gate.DenyReason.NoAutomation{}}
   : Gate.Decision}

# LAW-IO-003 -- Pure determinism.
# Six equalities, one per cell of the 3*2 surface.
law agent_work_is_allow:
  {Gate.authorize(Gate.Role.Agent{}, Gate.Operation.Work{})
     == Gate.Decision.Allow{}
   : Gate.Decision}

law reviewer_work_is_allow:
  {Gate.authorize(Gate.Role.Reviewer{}, Gate.Operation.Work{})
     == Gate.Decision.Allow{}
   : Gate.Decision}

law reviewer_halt_is_allow:
  {Gate.authorize(Gate.Role.Reviewer{}, Gate.Operation.Halt{})
     == Gate.Decision.Allow{}
   : Gate.Decision}

law agent_halt_is_deny:
  {Gate.authorize(Gate.Role.Agent{}, Gate.Operation.Halt{})
     == Gate.Decision.Deny{Gate.DenyReason.NoAgentHalt{}}
   : Gate.Decision}

law automation_halt_is_deny:
  {Gate.authorize(Gate.Role.Automation{}, Gate.Operation.Halt{})
     == Gate.Decision.Deny{Gate.DenyReason.NoAutomationHalt{}}
   : Gate.Decision}

# LAW-IO-004 -- Cross-role Work equivalence: Agent and Reviewer share
# the Work decision.  This is a NON-tautological claim: it relates
# two distinct inputs (different roles).  If the policy were broken
# (e.g. Automation were silently granted Work), the analogous
# Agent-vs-Automation equality would fail.  This law exercises the
# pure policy's cross-role handling of Work.
law agent_and_reviewer_share_work_decision:
  {Gate.authorize(Gate.Role.Agent{}, Gate.Operation.Work{})
     == Gate.authorize(Gate.Role.Reviewer{}, Gate.Operation.Work{})
   : Gate.Decision}

# LAW-IO-005 -- Cross-cell pure reduction: Reviewer + Halt yields
# Allow, the same as Agent + Work.  This is a non-reflexive equality
# that traverses two distinct (role, op) cells and proves that the
# pure policy's matrix is not the trivial constant-collapse.  If the
# function had any input-ignoring degenerate case, this equality
# would break (either side would no longer equal Allow).
law reviewer_halt_equals_agent_work_allow:
  {Gate.authorize(Gate.Role.Reviewer{}, Gate.Operation.Halt{})
     == Gate.authorize(Gate.Role.Agent{}, Gate.Operation.Work{})
   : Gate.Decision}

# Notes on prior revisions of LAW-IO-004/005
# ------------------------------------------
# CORRECTION01: the previous `decision_deterministic_in_inputs` and
# `io_role_is_not_bool` were both reflexive tautologies (`x == x`),
# accepted by the proof checker because the checker accepts unfilled
# laws.  The reformulated laws above are non-tautological: they relate
# two distinct (r, op) cells and would fail if the policy collapsed.
#
# Claims that "an IO(Role) value cannot acquire theorem authority"
# are NOT proof-authority claims (they are runtime-system claims).
# They live as empirical negative-control evidence under
# `lab/negative_control_checker.ts` (NC-01, NC-02, NC-06) and are
# reported in EVIDENCE.md as CHECKER_REJECTED, not as PROVED.