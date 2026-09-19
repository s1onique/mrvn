# ACT-MRVN-04 matrix dump -- 180-cell enumeration as a String.
#
# Calls Gate.authorize on every (actor, capability, lifecycle, evidence)
# cell and produces a newline-separated string of
# "actor|cap|lifecycle|evidence=decision" tokens.  Parsed by
# matrix_compare.ts to verify matrix.ts cell-for-cell.

import Base
import /Volumes/UserData/Users/chistyakov/Projects/SPbNIX/mrvn/factory/qualify/ACT-MRVN-QUALIFY04/authority-kernel/main.bend as Gate

def decision_tag(d: Gate.Decision) -> String:
  match d:
    case Gate.Decision.Allow{}:
      "Allow"
    case Gate.Decision.Deny{Gate.DenyReason.Terminal{}}:
      "Deny{Terminal}"
    case Gate.Decision.Deny{Gate.DenyReason.WrongActor{}}:
      "Deny{WrongActor}"
    case Gate.Decision.Deny{Gate.DenyReason.WrongLifecycle{}}:
      "Deny{WrongLifecycle}"
    case Gate.Decision.Deny{Gate.DenyReason.InsufficientEvidence{}}:
      "Deny{InsufficientEvidence}"

# cell emits one row given pre-extracted string labels and
# actor/cap/lc/ev constructors (which are consumed exactly once
# by Gate.authorize).
def cell(actor_str: String, cap_str: String, lc_str: String, ev_str: String,
         actor: Gate.Actor, cap: Gate.Capability, lc: Gate.Lifecycle, ev: Gate.Evidence) -> String:
  actor_str ++ "|" ++ cap_str ++ "|" ++ lc_str ++ "|" ++ ev_str ++ "=" ++ decision_tag(Gate.authorize(actor, cap, lc, ev))

def rows_for() -> String:
  cell("Agent", "Work", "Closed", "None", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Work", "Closed", "Replay", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Work", "Closed", "Live", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Work", "Active", "None", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Work", "Active", "Replay", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Work", "Active", "Live", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Work", "Halted", "None", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Work", "Halted", "Replay", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Work", "Halted", "Live", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Work", "Draft", "None", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Work", "Draft", "Replay", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Work", "Draft", "Live", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Work", "Frozen", "None", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Work", "Frozen", "Replay", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Work", "Frozen", "Live", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Halt", "Closed", "None", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Halt", "Closed", "Replay", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Halt", "Closed", "Live", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Halt", "Active", "None", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Halt", "Active", "Replay", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Halt", "Active", "Live", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Halt", "Halted", "None", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Halt", "Halted", "Replay", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Halt", "Halted", "Live", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Halt", "Draft", "None", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Halt", "Draft", "Replay", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Halt", "Draft", "Live", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Halt", "Frozen", "None", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Halt", "Frozen", "Replay", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Halt", "Frozen", "Live", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Freeze", "Closed", "None", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Freeze", "Closed", "Replay", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Freeze", "Closed", "Live", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Freeze", "Active", "None", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Freeze", "Active", "Replay", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Freeze", "Active", "Live", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Freeze", "Halted", "None", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Freeze", "Halted", "Replay", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Freeze", "Halted", "Live", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Freeze", "Draft", "None", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Freeze", "Draft", "Replay", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Freeze", "Draft", "Live", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Freeze", "Frozen", "None", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Freeze", "Frozen", "Replay", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Freeze", "Frozen", "Live", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Close", "Closed", "None", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Close", "Closed", "Replay", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Close", "Closed", "Live", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Close", "Active", "None", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Close", "Active", "Replay", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Close", "Active", "Live", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Close", "Halted", "None", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Close", "Halted", "Replay", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Close", "Halted", "Live", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Close", "Draft", "None", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Close", "Draft", "Replay", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Close", "Draft", "Live", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Agent", "Close", "Frozen", "None", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Agent", "Close", "Frozen", "Replay", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Agent", "Close", "Frozen", "Live", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Work", "Closed", "None", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Work", "Closed", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Work", "Closed", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Work", "Active", "None", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Work", "Active", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Work", "Active", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Work", "Halted", "None", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Work", "Halted", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Work", "Halted", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Work", "Draft", "None", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Work", "Draft", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Work", "Draft", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Work", "Frozen", "None", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Work", "Frozen", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Work", "Frozen", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Halt", "Closed", "None", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Halt", "Closed", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Halt", "Closed", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Halt", "Active", "None", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Halt", "Active", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Halt", "Active", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Halt", "Halted", "None", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Halt", "Halted", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Halt", "Halted", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Halt", "Draft", "None", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Halt", "Draft", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Halt", "Draft", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Halt", "Frozen", "None", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Halt", "Frozen", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Halt", "Frozen", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Freeze", "Closed", "None", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Freeze", "Closed", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Freeze", "Closed", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Freeze", "Active", "None", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Freeze", "Active", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Freeze", "Active", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Freeze", "Halted", "None", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Freeze", "Halted", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Freeze", "Halted", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Freeze", "Draft", "None", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Freeze", "Draft", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Freeze", "Draft", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Freeze", "Frozen", "None", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Freeze", "Frozen", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Freeze", "Frozen", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Close", "Closed", "None", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Close", "Closed", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Close", "Closed", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Close", "Active", "None", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Close", "Active", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Close", "Active", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Close", "Halted", "None", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Close", "Halted", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Close", "Halted", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Close", "Draft", "None", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Close", "Draft", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Close", "Draft", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Reviewer", "Close", "Frozen", "None", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Reviewer", "Close", "Frozen", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Reviewer", "Close", "Frozen", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Work", "Closed", "None", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Work", "Closed", "Replay", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Work", "Closed", "Live", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Work", "Active", "None", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Work", "Active", "Replay", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Work", "Active", "Live", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Work", "Halted", "None", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Work", "Halted", "Replay", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Work", "Halted", "Live", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Work", "Draft", "None", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Work", "Draft", "Replay", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Work", "Draft", "Live", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Work", "Frozen", "None", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Work", "Frozen", "Replay", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Work", "Frozen", "Live", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Halt", "Closed", "None", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Halt", "Closed", "Replay", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Halt", "Closed", "Live", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Halt", "Active", "None", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Halt", "Active", "Replay", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Halt", "Active", "Live", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Halt", "Halted", "None", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Halt", "Halted", "Replay", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Halt", "Halted", "Live", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Halt", "Draft", "None", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Halt", "Draft", "Replay", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Halt", "Draft", "Live", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Halt", "Frozen", "None", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Halt", "Frozen", "Replay", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Halt", "Frozen", "Live", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Freeze", "Closed", "None", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Freeze", "Closed", "Replay", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Freeze", "Closed", "Live", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Freeze", "Active", "None", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Freeze", "Active", "Replay", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Freeze", "Active", "Live", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Freeze", "Halted", "None", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Freeze", "Halted", "Replay", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Freeze", "Halted", "Live", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Freeze", "Draft", "None", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Freeze", "Draft", "Replay", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Freeze", "Draft", "Live", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Freeze", "Frozen", "None", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Freeze", "Frozen", "Replay", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Freeze", "Frozen", "Live", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Close", "Closed", "None", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Close", "Closed", "Replay", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Close", "Closed", "Live", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Close", "Active", "None", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Close", "Active", "Replay", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Close", "Active", "Live", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Close", "Halted", "None", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Close", "Halted", "Replay", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Close", "Halted", "Live", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Close", "Draft", "None", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Close", "Draft", "Replay", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Close", "Draft", "Live", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  cell("Automation", "Close", "Frozen", "None", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  cell("Automation", "Close", "Frozen", "Replay", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  cell("Automation", "Close", "Frozen", "Live", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{})

def main() -> String:
  rows_for()
