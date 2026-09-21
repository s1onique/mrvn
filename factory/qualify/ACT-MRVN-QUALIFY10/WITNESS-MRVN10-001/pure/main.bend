# ACT-MRVN-QUALIFY10 canonical subject.
#
# Trust-boundary model: this file is the PURE layer.
# It imports an IO effect, read_role(), that returns Role.
# After read_role returns, all decisions are pure.
#
# Domain:
#   Role          = Agent | Reviewer | Automation
#   Operation     = Work | Halt
#   Decision      = Allow | Deny{reason}
#
# Pure policy (LAW-IO-001 / LAW-IO-003):
#   - Work is allowed iff Role in {Agent, Reviewer}
#   - Halt is allowed iff Role == Reviewer
#   - All other inputs yield Deny.
#
# Discipline:
#   - No @unsafe, no foreign imports except ./effect/read_role.{c,js}.
#   - The pure policy is independent of the effect's identity.
#   - Effect identity is bound by hash in the artifact manifest, not
#     here in the type signature.

import Base

type Role is Data:
  Role.Agent{}
  Role.Reviewer{}
  Role.Automation{}

type Operation is Data:
  Operation.Work{}
  Operation.Halt{}

type DenyReason is Data:
  DenyReason.NoAutomation{}
  DenyReason.NoAgentHalt{}
  DenyReason.NoAutomationHalt{}

type Decision is Data:
  Decision.Allow{}
  Decision.Deny{reason: DenyReason}

# -------------------------------------------------------------------------
# Foreign effect: read_role().
# -------------------------------------------------------------------------
# The declared Bend type is IO(Role).  The compiler/runtime trusts this
# type.  What is NOT proven: that the C or JS implementation faithfully
# returns the intended Role from environment variable ROLE.  See
# effect/read_role.{c,js} for the actual implementation, EFFECT_CONTRACT.md
# for the intended contract, and lab/host_mutation_lab.ts for evidence.
def read_role() -> IO(Role):
  import "../effect/read_role.c"
  import "../effect/read_role.js"

# -------------------------------------------------------------------------
# Pure policy.
# -------------------------------------------------------------------------
# authorize is the sole authority.  It is PURE:
#   - No IO in its body.
#   - No state, no foreign calls, no escape hatches.
#   - Deterministic in (role, operation).
# Pure deterministic -> reusable from PROOF.bend without side effects.
def authorize(role: Role, op: Operation) -> Decision:
  match role:
    case Role.Agent{}:
      match op:
        case Operation.Work{}: Decision.Allow{}
        case Operation.Halt{}: Decision.Deny{DenyReason.NoAgentHalt{}}
    case Role.Reviewer{}:
      match op:
        case Operation.Work{}: Decision.Allow{}
        case Operation.Halt{}: Decision.Allow{}
    case Role.Automation{}:
      match op:
        case Operation.Work{}: Decision.Deny{DenyReason.NoAutomation{}}
        case Operation.Halt{}: Decision.Deny{DenyReason.NoAutomationHalt{}}

# -------------------------------------------------------------------------
# Main.
# -------------------------------------------------------------------------
# The pure kernel calls the foreign effect exactly once to acquire one
# Role value, then delegates to the pure policy.  There is exactly one
# IO term in main, and it is the only place an unverified host value
# can enter the proof authority chain.  After the bind, the rest is
# pure Bend.
def decision_label(d: Decision) -> String:
  match d:
    case Decision.Allow{}: "ALLOW"
    case Decision.Deny{reason}:
      match reason:
        case DenyReason.NoAutomation{}:    "DENY:no_automation_work"
        case DenyReason.NoAgentHalt{}:     "DENY:no_agent_halt"
        case DenyReason.NoAutomationHalt{}:"DENY:no_automation_halt"

def main() -> IO(Unit):
  do IO<Unit>:
    role : Role <- read_role()
    decision : Decision = authorize(role, Operation.Work{})
    label : String = decision_label(decision)
    Unit <- IO.print(label)
    return Unit{}