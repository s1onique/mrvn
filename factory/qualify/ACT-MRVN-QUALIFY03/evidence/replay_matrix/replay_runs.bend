import Base
import /Volumes/UserData/Users/chistyakov/Projects/SPbNIX/mrvn/factory/qualify/ACT-MRVN-QUALIFY03/lifecycle-kernel/main.bend as Gate

def r0(+evs: List<&2, Gate.LcEvent>, s: Gate.State) -> U32:
  match s:
    case Gate.State.Draft{}: 1
    case Gate.State.Active{}: 2
    case Gate.State.Halted{}: 3
    case Gate.State.Frozen{}: 4
    case Gate.State.Closed{}: 5

def r1(+evs: List<&2, Gate.LcEvent>, s: Gate.State) -> U32:
  match s:
    case Gate.State.Draft{}: 2
    case Gate.State.Active{}: 2
    case Gate.State.Halted{}: 3
    case Gate.State.Frozen{}: 4
    case Gate.State.Closed{}: 5

def r2(+evs: List<&2, Gate.LcEvent>, s: Gate.State) -> U32:
  match s:
    case Gate.State.Draft{}: 4
    case Gate.State.Active{}: 2
    case Gate.State.Halted{}: 3
    case Gate.State.Frozen{}: 4
    case Gate.State.Closed{}: 5

def r3(+evs: List<&2, Gate.LcEvent>, s: Gate.State) -> U32:
  match s:
    case Gate.State.Draft{}: 5
    case Gate.State.Active{}: 2
    case Gate.State.Halted{}: 3
    case Gate.State.Frozen{}: 4
    case Gate.State.Closed{}: 5

def r4(+evs: List<&2, Gate.LcEvent>, s: Gate.State) -> U32:
  match s:
    case Gate.State.Draft{}: 2
    case Gate.State.Active{}: 2
    case Gate.State.Halted{}: 3
    case Gate.State.Frozen{}: 4
    case Gate.State.Closed{}: 5

def r5(+evs: List<&2, Gate.LcEvent>, s: Gate.State) -> U32:
  match s:
    case Gate.State.Draft{}: 4
    case Gate.State.Active{}: 2
    case Gate.State.Halted{}: 3
    case Gate.State.Frozen{}: 4
    case Gate.State.Closed{}: 5

def r6(+evs: List<&2, Gate.LcEvent>, s: Gate.State) -> U32:
  match s:
    case Gate.State.Draft{}: 5
    case Gate.State.Active{}: 2
    case Gate.State.Halted{}: 3
    case Gate.State.Frozen{}: 4
    case Gate.State.Closed{}: 5

def r7(+evs: List<&2, Gate.LcEvent>, s: Gate.State) -> U32:
  match s:
    case Gate.State.Draft{}: 1
    case Gate.State.Active{}: 2
    case Gate.State.Halted{}: 3
    case Gate.State.Frozen{}: 4
    case Gate.State.Closed{}: 5

def r8(+evs: List<&2, Gate.LcEvent>, s: Gate.State) -> U32:
  match s:
    case Gate.State.Draft{}: 2
    case Gate.State.Active{}: 2
    case Gate.State.Halted{}: 3
    case Gate.State.Frozen{}: 4
    case Gate.State.Closed{}: 5

def main() -> IO(Unit):
  do IO<Unit>:
    IO.print("---begin replay runs---")
    IO.print(U32.show(r0(Nil{}, Gate.State.Draft{})))
    IO.print(U32.show(r1(Con{Gate.LcEvent.Activate{}, Nil{}}, Gate.State.Draft{})))
    IO.print(U32.show(r2(Con{Gate.LcEvent.Freeze{}, Nil{}}, Gate.State.Draft{})))
    IO.print(U32.show(r3(Con{Gate.LcEvent.Freeze{}, Con{Gate.LcEvent.Close{}, Nil{}}}, Gate.State.Draft{})))
    IO.print(U32.show(r4(Con{Gate.LcEvent.Activate{}, Con{Gate.LcEvent.Halt{}, Con{Gate.LcEvent.Resume{}, Nil{}}}}, Gate.State.Draft{})))
    IO.print(U32.show(r5(Con{Gate.LcEvent.Activate{}, Con{Gate.LcEvent.Freeze{}, Con{Gate.LcEvent.Resume{}, Nil{}}}}, Gate.State.Draft{})))
    IO.print(U32.show(r6(Con{Gate.LcEvent.Activate{}, Con{Gate.LcEvent.Freeze{}, Con{Gate.LcEvent.Close{}, Con{Gate.LcEvent.Activate{}, Nil{}}}}}, Gate.State.Draft{})))
    IO.print(U32.show(r7(Con{Gate.LcEvent.Close{}, Nil{}}, Gate.State.Draft{})))
    IO.print(U32.show(r8(Con{Gate.LcEvent.Halt{}, Con{Gate.LcEvent.Resume{}, Con{Gate.LcEvent.Activate{}, Nil{}}}}, Gate.State.Draft{})))
    IO.print("---end replay runs---")