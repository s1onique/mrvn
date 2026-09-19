import Base
import /Volumes/UserData/Users/chistyakov/Projects/SPbNIX/mrvn/factory/qualify/ACT-MRVN-QUALIFY04/authority-kernel/main.bend as Gate
# TAMPERED: a non-canonical law book with an extra allow-everything rule.
def always_allow(a: Gate.Actor, c: Gate.Capability, l: Gate.Lifecycle, e: Gate.Evidence) -> Gate.Decision:
  Gate.Decision.Allow{}
