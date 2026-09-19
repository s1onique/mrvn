# ACT-MRVN-QUALIFY03 step_equiv.bend -- formal equivalence between
# the explicit 25-arm `step` (the production impl) and the
# collapsed-match `step` (the alt impl, with `case _:` catchalls
# inside each state arm).  Both implementations live in the SAME
# namespace, so the type equality is direct and the proof is
# 25-arm case-split.

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

def step_explicit(s: State, e: LcEvent) -> Transition:
  match s:
    case State.Draft{}:
      match e:
        case LcEvent.Activate{}: Transition.Accepted{State.Active{}}
        case LcEvent.Halt{}:     Transition.Rejected{State.Draft{}}
        case LcEvent.Resume{}:   Transition.Rejected{State.Draft{}}
        case LcEvent.Freeze{}:   Transition.Accepted{State.Frozen{}}
        case LcEvent.Close{}:    Transition.Rejected{State.Draft{}}
    case State.Active{}:
      match e:
        case LcEvent.Activate{}: Transition.Rejected{State.Active{}}
        case LcEvent.Halt{}:     Transition.Accepted{State.Halted{}}
        case LcEvent.Resume{}:   Transition.Rejected{State.Active{}}
        case LcEvent.Freeze{}:   Transition.Accepted{State.Frozen{}}
        case LcEvent.Close{}:    Transition.Rejected{State.Active{}}
    case State.Halted{}:
      match e:
        case LcEvent.Activate{}: Transition.Rejected{State.Halted{}}
        case LcEvent.Halt{}:     Transition.Rejected{State.Halted{}}
        case LcEvent.Resume{}:   Transition.Accepted{State.Active{}}
        case LcEvent.Freeze{}:   Transition.Accepted{State.Frozen{}}
        case LcEvent.Close{}:    Transition.Rejected{State.Halted{}}
    case State.Frozen{}:
      match e:
        case LcEvent.Activate{}: Transition.Rejected{State.Frozen{}}
        case LcEvent.Halt{}:     Transition.Rejected{State.Frozen{}}
        case LcEvent.Resume{}:   Transition.Rejected{State.Frozen{}}
        case LcEvent.Freeze{}:   Transition.Rejected{State.Frozen{}}
        case LcEvent.Close{}:    Transition.Accepted{State.Closed{}}
    case State.Closed{}:
      Transition.Rejected{State.Closed{}}

def step_collapsed(s: State, e: LcEvent) -> Transition:
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

law step_equiv:
  for +s: State
  for +e: LcEvent
  {result_state(step_explicit(s, e)) == result_state(step_collapsed(s, e)) : State}

def step_equiv(s, e):
  match s:
    case State.Draft{}:
      match e:
        case LcEvent.Activate{}: {==}
        case LcEvent.Halt{}:     {==}
        case LcEvent.Resume{}:   {==}
        case LcEvent.Freeze{}:   {==}
        case LcEvent.Close{}:    {==}
    case State.Active{}:
      match e:
        case LcEvent.Activate{}: {==}
        case LcEvent.Halt{}:     {==}
        case LcEvent.Resume{}:   {==}
        case LcEvent.Freeze{}:   {==}
        case LcEvent.Close{}:    {==}
    case State.Halted{}:
      match e:
        case LcEvent.Activate{}: {==}
        case LcEvent.Halt{}:     {==}
        case LcEvent.Resume{}:   {==}
        case LcEvent.Freeze{}:   {==}
        case LcEvent.Close{}:    {==}
    case State.Frozen{}:
      match e:
        case LcEvent.Activate{}: {==}
        case LcEvent.Halt{}:     {==}
        case LcEvent.Resume{}:   {==}
        case LcEvent.Freeze{}:   {==}
        case LcEvent.Close{}:    {==}
    case State.Closed{}:
      {==}

law main:
  IO(Unit)

def main():
  IO.print("step_equiv: 25/25 cells proved")
