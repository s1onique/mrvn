import Base
import /Volumes/UserData/Users/chistyakov/Projects/SPbNIX/mrvn/factory/qualify/ACT-MRVN-QUALIFY03/lifecycle-kernel/main.bend as Gate

def go(s: Gate.State, e: Gate.LcEvent) -> U32:
  match s:
    case Gate.State.Draft{}:
      match e:
        case Gate.LcEvent.Activate{}: 2
        case Gate.LcEvent.Halt{}: 1
        case Gate.LcEvent.Resume{}: 1
        case Gate.LcEvent.Freeze{}: 4
        case Gate.LcEvent.Close{}: 1
    case Gate.State.Active{}:
      match e:
        case Gate.LcEvent.Activate{}: 2
        case Gate.LcEvent.Halt{}: 3
        case Gate.LcEvent.Resume{}: 2
        case Gate.LcEvent.Freeze{}: 4
        case Gate.LcEvent.Close{}: 2
    case Gate.State.Halted{}:
      match e:
        case Gate.LcEvent.Activate{}: 3
        case Gate.LcEvent.Halt{}: 3
        case Gate.LcEvent.Resume{}: 2
        case Gate.LcEvent.Freeze{}: 4
        case Gate.LcEvent.Close{}: 3
    case Gate.State.Frozen{}:
      match e:
        case Gate.LcEvent.Activate{}: 4
        case Gate.LcEvent.Halt{}: 4
        case Gate.LcEvent.Resume{}: 4
        case Gate.LcEvent.Freeze{}: 4
        case Gate.LcEvent.Close{}: 5
    case Gate.State.Closed{}:
      match e:
        case Gate.LcEvent.Activate{}: 5
        case Gate.LcEvent.Halt{}: 5
        case Gate.LcEvent.Resume{}: 5
        case Gate.LcEvent.Freeze{}: 5
        case Gate.LcEvent.Close{}: 5

def main() -> IO(Unit):
  do IO<Unit>:
    u0: Unit <- IO.print(U32.show(go(Gate.State.Draft{},  Gate.LcEvent.Activate{})))
    u1: Unit <- IO.print(U32.show(go(Gate.State.Draft{},  Gate.LcEvent.Halt{})))
    u2: Unit <- IO.print(U32.show(go(Gate.State.Draft{},  Gate.LcEvent.Resume{})))
    u3: Unit <- IO.print(U32.show(go(Gate.State.Draft{},  Gate.LcEvent.Freeze{})))
    u4: Unit <- IO.print(U32.show(go(Gate.State.Draft{},  Gate.LcEvent.Close{})))
    IO.print(U32.show(go(Gate.State.Active{}, Gate.LcEvent.Activate{})))
    IO.print(U32.show(go(Gate.State.Active{}, Gate.LcEvent.Halt{})))
    IO.print(U32.show(go(Gate.State.Active{}, Gate.LcEvent.Resume{})))
    IO.print(U32.show(go(Gate.State.Active{}, Gate.LcEvent.Freeze{})))
    IO.print(U32.show(go(Gate.State.Active{}, Gate.LcEvent.Close{})))
    IO.print(U32.show(go(Gate.State.Halted{}, Gate.LcEvent.Activate{})))
    IO.print(U32.show(go(Gate.State.Halted{}, Gate.LcEvent.Halt{})))
    IO.print(U32.show(go(Gate.State.Halted{}, Gate.LcEvent.Resume{})))
    IO.print(U32.show(go(Gate.State.Halted{}, Gate.LcEvent.Freeze{})))
    IO.print(U32.show(go(Gate.State.Halted{}, Gate.LcEvent.Close{})))
    IO.print(U32.show(go(Gate.State.Frozen{}, Gate.LcEvent.Activate{})))
    IO.print(U32.show(go(Gate.State.Frozen{}, Gate.LcEvent.Halt{})))
    IO.print(U32.show(go(Gate.State.Frozen{}, Gate.LcEvent.Resume{})))
    IO.print(U32.show(go(Gate.State.Frozen{}, Gate.LcEvent.Freeze{})))
    IO.print(U32.show(go(Gate.State.Frozen{}, Gate.LcEvent.Close{})))
    IO.print(U32.show(go(Gate.State.Closed{}, Gate.LcEvent.Activate{})))
    IO.print(U32.show(go(Gate.State.Closed{}, Gate.LcEvent.Halt{})))
    IO.print(U32.show(go(Gate.State.Closed{}, Gate.LcEvent.Resume{})))
    IO.print(U32.show(go(Gate.State.Closed{}, Gate.LcEvent.Freeze{})))
    IO.print(U32.show(go(Gate.State.Closed{}, Gate.LcEvent.Close{})))