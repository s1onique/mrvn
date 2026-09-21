# ACT-MRVN-QUALIFY10 mutation subject template.
#
# Each MUT-N directory contains:
#   main.bend     -- identical to subject/main.bend but with imports
#                    rewritten to ./effect/read_role.{c,js} (relative).
#   effect/read_role.c    -- the .c variant for that mutation
#   effect/read_role.js   -- the .js variant for that mutation
#
# The PURE parts of main.bend (types, authorize, decision_label) are
# byte-identical to subject/main.bend.  Only the foreign import paths
# differ.  This is the central MRVN-10 witness:
#
#     Same Bend declaration with same LAWS.bend / PROOF.bend
#         → proof still PASSES
#     Different foreign bytes
#         → runtime contract can VIOLATE
#
# Imports below are written relative to mutations/MUT-N/.

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

def read_role() -> IO(Role):
  import "./effect/read_role.c"
  import "./effect/read_role.js"

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