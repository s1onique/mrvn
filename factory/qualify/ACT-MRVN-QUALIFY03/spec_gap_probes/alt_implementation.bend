import Base

type State is Data:
  State.Draft{}
  State.Active{}
  State.Halted{}
  State.Frozen{}
  State.Closed{}

type LcEvent is Data:
  LcEvent.Activate{}
  LcEvent.Halt{}
  LcEvent.Resume{}
  LcEvent.Freeze{}
  LcEvent.Close{}

type Transition is Data:
  Transition.Accepted{next: State}
  Transition.Rejected{state: State}

def step(s: State, e: LcEvent) -> Transition:
  match s:
    case State.Draft{}:
      match e:
        case LcEvent.Activate{}: Transition.Accepted{State.Active{}}
        case LcEvent.Freeze{}: Transition.Accepted{State.Frozen{}}
        case _: Transition.Rejected{State.Draft{}}
    case State.Active{}:
      match e:
        case LcEvent.Halt{}: Transition.Accepted{State.Halted{}}
        case LcEvent.Freeze{}: Transition.Accepted{State.Frozen{}}
        case _: Transition.Rejected{State.Active{}}
    case State.Halted{}:
      match e:
        case LcEvent.Resume{}: Transition.Accepted{State.Active{}}
        case LcEvent.Freeze{}: Transition.Accepted{State.Frozen{}}
        case _: Transition.Rejected{State.Halted{}}
    case State.Frozen{}:
      match e:
        case LcEvent.Close{}: Transition.Accepted{State.Closed{}}
        case _: Transition.Rejected{State.Frozen{}}
    case State.Closed{}:
      Transition.Rejected{State.Closed{}}

def result_state(t: Transition) -> State:
  match t:
    case Transition.Accepted{next}: next
    case Transition.Rejected{state}: state

def accepted(t: Transition) -> Bool:
  match t:
    case Transition.Accepted{next}: True{}
    case Transition.Rejected{state}: False{}

def replay(+events: List<&2, LcEvent>, s: State) -> State:
  match events:
    case Nil{}: s
    case e <> rest: replay(rest, result_state(step(s, e)))

def main() -> State:
  replay(Nil{}, State.Draft{})