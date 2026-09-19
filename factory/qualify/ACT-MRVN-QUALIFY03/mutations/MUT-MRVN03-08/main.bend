# MUT-MRVN03-08 -- illicit same-state Close acceptance
#
# MUTATION: the Close event returns Accepted{s} instead of Rejected{s}
# for Draft, Active, and Halted.  result_state is preserved
# (still returns s).  Only the Transition constructor is changed.
#
# This mutation is INTENDED to bypass LAW-004 as currently specified,
# because LAW-004 only constrains result_state, not the constructor.
#
# Expected verdict from a correctly-specified LAW-004: CATCH.
# Observed verdict from current 11-law spec: see MUT-MRVN03-08.txt.

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

# MUTATED step: Close returns Accepted{s} for non-Frozen, non-Closed
# states (Draft/Active/Halted).  Frozen + Close -> Accepted{Closed}
# (unchanged).  Closed + Close -> Rejected{Closed} (unchanged).
def step(s: State, e: LcEvent) -> Transition:
  match s:
    case State.Draft{}:
      match e:
        case LcEvent.Activate{}: Transition.Accepted{State.Active{}}
        case LcEvent.Halt{}:     Transition.Rejected{State.Draft{}}
        case LcEvent.Resume{}:   Transition.Rejected{State.Draft{}}
        case LcEvent.Freeze{}:   Transition.Accepted{State.Frozen{}}
        case LcEvent.Close{}:    Transition.Accepted{State.Draft{}}
    case State.Active{}:
      match e:
        case LcEvent.Activate{}: Transition.Rejected{State.Active{}}
        case LcEvent.Halt{}:     Transition.Accepted{State.Halted{}}
        case LcEvent.Resume{}:   Transition.Rejected{State.Active{}}
        case LcEvent.Freeze{}:   Transition.Accepted{State.Frozen{}}
        case LcEvent.Close{}:    Transition.Accepted{State.Active{}}
    case State.Halted{}:
      match e:
        case LcEvent.Activate{}: Transition.Rejected{State.Halted{}}
        case LcEvent.Halt{}:     Transition.Rejected{State.Halted{}}
        case LcEvent.Resume{}:   Transition.Accepted{State.Active{}}
        case LcEvent.Freeze{}:   Transition.Accepted{State.Frozen{}}
        case LcEvent.Close{}:    Transition.Accepted{State.Halted{}}
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
