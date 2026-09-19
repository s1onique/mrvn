# ACT-MRVN-QUALIFY02 # section 5.2 differential harness.
#
# Compares `rollout_status` on a fixed set of 24 small lists against
# the imported implementation.  See EVIDENCE.md # section E05.

import Base
import main_act01.bend as K

def rf() -> K.Check:
  K.Decision_Outcome{K.Decision.Required{}, K.Outcome.Fail{}}

def rp() -> K.Check:
  K.Decision_Outcome{K.Decision.Required{}, K.Outcome.Pass{}}

def af() -> K.Check:
  K.Decision_Outcome{K.Decision.Advisory{}, K.Outcome.Fail{}}

def ap() -> K.Check:
  K.Decision_Outcome{K.Decision.Advisory{}, K.Outcome.Pass{}}

def label(r: K.Rollout) -> String:
  match r:
    case K.Rollout.Pass{}: "Pa"
    case K.Rollout.Fail{}: "Fa"

def go() -> String:
  s0  = label(K.rollout_status(Nil{}))
  s1  = label(K.rollout_status(rf() <> Nil{}))
  s2  = label(K.rollout_status(rp() <> Nil{}))
  s3  = label(K.rollout_status(af() <> Nil{}))
  s4  = label(K.rollout_status(ap() <> Nil{}))
  s5  = label(K.rollout_status(rf() <> rp() <> Nil{}))
  s6  = label(K.rollout_status(rp() <> rf() <> Nil{}))
  s7  = label(K.rollout_status(af() <> ap() <> Nil{}))
  s8  = label(K.rollout_status(ap() <> af() <> Nil{}))
  s9  = label(K.rollout_status(rf() <> af() <> Nil{}))
  s10 = label(K.rollout_status(af() <> rf() <> Nil{}))
  s11 = label(K.rollout_status(rf() <> rp() <> af() <> Nil{}))
  s12 = label(K.rollout_status(af() <> rp() <> rf() <> Nil{}))
  s13 = label(K.rollout_status(rp() <> rf() <> ap() <> Nil{}))
  s14 = label(K.rollout_status(ap() <> rp() <> rf() <> Nil{}))
  s15 = label(K.rollout_status(rf() <> ap() <> rp() <> Nil{}))
  s16 = label(K.rollout_status(rp() <> ap() <> rf() <> Nil{}))
  s17 = label(K.rollout_status(rp() <> af() <> ap() <> Nil{}))
  s18 = label(K.rollout_status(af() <> ap() <> rp() <> Nil{}))
  s19 = label(K.rollout_status(rp() <> af() <> rp() <> Nil{}))
  s20 = label(K.rollout_status(rf() <> rf() <> ap() <> Nil{}))
  s21 = label(K.rollout_status(ap() <> rf() <> rf() <> Nil{}))
  s22 = label(K.rollout_status(rf() <> ap() <> ap() <> Nil{}))
  s23 = label(K.rollout_status(ap() <> ap() <> ap() <> Nil{}))
  String.append(s0, String.append(s1, String.append(s2, String.append(s3, String.append(s4, String.append(s5, String.append(s6, String.append(s7, String.append(s8, String.append(s9, String.append(s10, String.append(s11, String.append(s12, String.append(s13, String.append(s14, String.append(s15, String.append(s16, String.append(s17, String.append(s18, String.append(s19, String.append(s20, String.append(s21, String.append(s22, s23)))))))))))))))))))))))

law main: IO(Unit)
def main():
  IO.print(go())
