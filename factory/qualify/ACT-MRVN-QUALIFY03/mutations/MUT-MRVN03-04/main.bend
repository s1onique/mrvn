# ACT-MRVN-QUALIFY03 lifecycle kernel -- the implementation.
#
# A pure state machine over 5 lifecycle states and 5 events.
#   step   : State -> LcEvent -> Transition
#   replay : State -> List<LcEvent> -> State
#
# Implementation-shape discipline (ACT03 sec.13):
#   - step uses an explicit 5x5 = 25-arm decomposition.  No `case _:`.
#   - result_state and accepted are projection-only helpers.
#   - replay is structurally recursive over the event list.  No fuel.
#
# Naming: the event type is `LcEvent` (not `Event`) to avoid clashing with
# the Base prelude's keyboard/mouse `Event` type.

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

# Canonical transition relation. Explicit 25-arm decomposition
# (5 states x 5 events). Each arm returns Accepted{next} or Rejected{state}.
def step(s: State, e: LcEvent) -> Transition:
  match s:
    case State.Draft{}:
      match e:
        case LcEvent.Activate{}: Transition.Accepted{State.Active{}}
        case LcEvent.Halt{}:     Transition.Rejected{State.Draft{}}
        case LcEvent.Resume{}:   Transition.Rejected{State.Active{}}
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
      match e:
        case LcEvent.Activate{}: Transition.Rejected{State.Closed{}}
        case LcEvent.Halt{}:     Transition.Rejected{State.Closed{}}
        case LcEvent.Resume{}:   Transition.Rejected{State.Closed{}}
        case LcEvent.Freeze{}:   Transition.Rejected{State.Closed{}}
        case LcEvent.Close{}:    Transition.Rejected{State.Closed{}}

# result_state: projection of a Transition to the resulting State.
# No lifecycle policy beyond destructuring the constructor.
def result_state(t: Transition) -> State:
  match t:
    case Transition.Accepted{next}: next
    case Transition.Rejected{state}: state

# accepted: True iff the transition was Accepted.
# Pure projection; no lifecycle policy.
def accepted(t: Transition) -> Bool:
  match t:
    case Transition.Accepted{next}: True{}
    case Transition.Rejected{state}: False{}

# replay: pure, structurally recursive over the event list.
# Rejected events preserve state; the replay continues from the same state.
#
# Argument order: events first, then state.  The affine checker requires
# the first argument to "shrink" in the recursive call (here, events
# structurally shrinks from `e <> rest` to `rest`); the state is computed
# from the prior state and may be new.
def replay(+events: List<&2, LcEvent>, s: State) -> State:
  match events:
    case Nil{}: s
    case e <> rest: replay(rest, result_state(step(s, e)))

def main() -> State:
  replay(Nil{}, State.Draft{})

