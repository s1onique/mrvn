# ACT-MRVN-06 auto-generated behavior dump.
# Generated from /Volumes/UserData/Users/chistyakov/Projects/SPbNIX/mrvn/factory/qualify/ACT-MRVN-QUALIFY08/candidates/D-001-is-X-predicates/main.bend.
# DO NOT EDIT BY HAND.  Re-run gen_behavior_driver.ts to regenerate.

import Base
import /Volumes/UserData/Users/chistyakov/Projects/SPbNIX/mrvn/factory/qualify/ACT-MRVN-QUALIFY08/candidates/D-001-is-X-predicates/main.bend as Gate

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

def row(as_: String, cs: String, ls: String, es: String,
          a: Gate.Actor, c: Gate.Capability, l: Gate.Lifecycle, e: Gate.Evidence) -> String:
  as_ ++ "|" ++ cs ++ "|" ++ ls ++ "|" ++ es ++ "=" ++ decision_tag(Gate.authorize(a, c, l, e))

def all_rows() -> String:
  row("Agent", "Work", "Closed", "None", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Work", "Closed", "Replay", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Work", "Closed", "Live", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Work", "Active", "None", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Work", "Active", "Replay", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Work", "Active", "Live", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Work", "Halted", "None", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Work", "Halted", "Replay", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Work", "Halted", "Live", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Work", "Draft", "None", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Work", "Draft", "Replay", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Work", "Draft", "Live", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Work", "Frozen", "None", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Work", "Frozen", "Replay", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Work", "Frozen", "Live", Gate.Actor.Agent{}, Gate.Capability.Work{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Halt", "Closed", "None", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Halt", "Closed", "Replay", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Halt", "Closed", "Live", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Halt", "Active", "None", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Halt", "Active", "Replay", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Halt", "Active", "Live", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Halt", "Halted", "None", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Halt", "Halted", "Replay", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Halt", "Halted", "Live", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Halt", "Draft", "None", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Halt", "Draft", "Replay", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Halt", "Draft", "Live", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Halt", "Frozen", "None", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Halt", "Frozen", "Replay", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Halt", "Frozen", "Live", Gate.Actor.Agent{}, Gate.Capability.Halt{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Freeze", "Closed", "None", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Freeze", "Closed", "Replay", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Freeze", "Closed", "Live", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Freeze", "Active", "None", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Freeze", "Active", "Replay", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Freeze", "Active", "Live", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Freeze", "Halted", "None", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Freeze", "Halted", "Replay", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Freeze", "Halted", "Live", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Freeze", "Draft", "None", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Freeze", "Draft", "Replay", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Freeze", "Draft", "Live", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Freeze", "Frozen", "None", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Freeze", "Frozen", "Replay", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Freeze", "Frozen", "Live", Gate.Actor.Agent{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Close", "Closed", "None", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Close", "Closed", "Replay", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Close", "Closed", "Live", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Close", "Active", "None", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Close", "Active", "Replay", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Close", "Active", "Live", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Close", "Halted", "None", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Close", "Halted", "Replay", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Close", "Halted", "Live", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Close", "Draft", "None", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Close", "Draft", "Replay", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Close", "Draft", "Live", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Agent", "Close", "Frozen", "None", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Agent", "Close", "Frozen", "Replay", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Agent", "Close", "Frozen", "Live", Gate.Actor.Agent{}, Gate.Capability.Close{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Work", "Closed", "None", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Work", "Closed", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Work", "Closed", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Work", "Active", "None", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Work", "Active", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Work", "Active", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Work", "Halted", "None", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Work", "Halted", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Work", "Halted", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Work", "Draft", "None", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Work", "Draft", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Work", "Draft", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Work", "Frozen", "None", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Work", "Frozen", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Work", "Frozen", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Work{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Halt", "Closed", "None", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Halt", "Closed", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Halt", "Closed", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Halt", "Active", "None", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Halt", "Active", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Halt", "Active", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Halt", "Halted", "None", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Halt", "Halted", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Halt", "Halted", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Halt", "Draft", "None", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Halt", "Draft", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Halt", "Draft", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Halt", "Frozen", "None", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Halt", "Frozen", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Halt", "Frozen", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Halt{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Freeze", "Closed", "None", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Freeze", "Closed", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Freeze", "Closed", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Freeze", "Active", "None", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Freeze", "Active", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Freeze", "Active", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Freeze", "Halted", "None", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Freeze", "Halted", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Freeze", "Halted", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Freeze", "Draft", "None", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Freeze", "Draft", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Freeze", "Draft", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Freeze", "Frozen", "None", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Freeze", "Frozen", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Freeze", "Frozen", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Close", "Closed", "None", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Close", "Closed", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Close", "Closed", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Close", "Active", "None", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Close", "Active", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Close", "Active", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Close", "Halted", "None", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Close", "Halted", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Close", "Halted", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Close", "Draft", "None", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Close", "Draft", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Close", "Draft", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Reviewer", "Close", "Frozen", "None", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Reviewer", "Close", "Frozen", "Replay", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Reviewer", "Close", "Frozen", "Live", Gate.Actor.Reviewer{}, Gate.Capability.Close{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Work", "Closed", "None", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Work", "Closed", "Replay", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Work", "Closed", "Live", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Work", "Active", "None", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Work", "Active", "Replay", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Work", "Active", "Live", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Work", "Halted", "None", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Work", "Halted", "Replay", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Work", "Halted", "Live", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Work", "Draft", "None", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Work", "Draft", "Replay", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Work", "Draft", "Live", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Work", "Frozen", "None", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Work", "Frozen", "Replay", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Work", "Frozen", "Live", Gate.Actor.Automation{}, Gate.Capability.Work{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Halt", "Closed", "None", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Halt", "Closed", "Replay", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Halt", "Closed", "Live", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Halt", "Active", "None", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Halt", "Active", "Replay", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Halt", "Active", "Live", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Halt", "Halted", "None", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Halt", "Halted", "Replay", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Halt", "Halted", "Live", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Halt", "Draft", "None", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Halt", "Draft", "Replay", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Halt", "Draft", "Live", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Halt", "Frozen", "None", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Halt", "Frozen", "Replay", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Halt", "Frozen", "Live", Gate.Actor.Automation{}, Gate.Capability.Halt{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Freeze", "Closed", "None", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Freeze", "Closed", "Replay", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Freeze", "Closed", "Live", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Freeze", "Active", "None", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Freeze", "Active", "Replay", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Freeze", "Active", "Live", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Freeze", "Halted", "None", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Freeze", "Halted", "Replay", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Freeze", "Halted", "Live", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Freeze", "Draft", "None", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Freeze", "Draft", "Replay", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Freeze", "Draft", "Live", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Freeze", "Frozen", "None", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Freeze", "Frozen", "Replay", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Freeze", "Frozen", "Live", Gate.Actor.Automation{}, Gate.Capability.Freeze{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Close", "Closed", "None", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Close", "Closed", "Replay", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Close", "Closed", "Live", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Close", "Active", "None", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Active{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Close", "Active", "Replay", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Active{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Close", "Active", "Live", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Active{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Close", "Halted", "None", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Halted{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Close", "Halted", "Replay", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Close", "Halted", "Live", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Halted{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Close", "Draft", "None", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Draft{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Close", "Draft", "Replay", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Close", "Draft", "Live", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Draft{}, Gate.Evidence.Live{}) ++ "\n" ++
  row("Automation", "Close", "Frozen", "None", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.None{}) ++ "\n" ++
  row("Automation", "Close", "Frozen", "Replay", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Replay{}) ++ "\n" ++
  row("Automation", "Close", "Frozen", "Live", Gate.Actor.Automation{}, Gate.Capability.Close{}, Gate.Lifecycle.Frozen{}, Gate.Evidence.Live{}) ++ "\n"

def main() -> String:
  all_rows()
