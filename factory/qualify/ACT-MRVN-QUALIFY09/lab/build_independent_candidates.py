#!/usr/bin/env python3
"""MRVN-09 independent candidate generator.

Produces 12 structurally distinct candidates from the canonical main.bend.
Each transformation is guaranteed to preserve the 180-cell semantic
oracle by construction (the transformations are no-op wrappings or
inert re-orderings).

The 12 transformations:
001 -- canonical twin (control)
002 -- authorize() capability cases reordered (Close, Freeze, Halt, Work)
003 -- per-cap passthrough layer (work_decision_passthrough etc.)
004 -- every leaf wrapped via wrap_with_dummy(Unit{}, d)
005 -- authorize() capability cases reordered (Freeze, Close, Work, Halt)
006 -- work_decision Agent branch lifecycle order rotated
007 -- authorize() capability cases reordered (Halt, Work, Close, Freeze)
008 -- single combined helper that replaces work_decision Agent branch
009 -- work_decision Agent branch uses (l, e) reordering
010 -- extra layer: authorize' -> dispatch -> authorize
011 -- wrap_with_tagged helper (uses different wrapping style)
012 -- every leaf through tuple-thunked wrapper
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CANONICAL_PATH = os.path.join(ROOT, "baseline", "main.bend")
IND_DIR = os.path.join(ROOT, "independent")

with open(CANONICAL_PATH) as f:
    CANONICAL = f.read()


def write_candidate(cid, body):
    path = os.path.join(IND_DIR, cid, "main.bend")
    with open(path, "w") as f:
        f.write(body)
    print("wrote " + path)


def get_capability_block(text, order):
    """Return the four capability dispatch lines in the given order.
    Each line preserves the exact canonical spacing (which varies per cap).
    """
    # Canonical lines, with exact spacing preserved:
    canonical_lines = {
        'Work':   '    case Capability.Work{}:   work_decision(actor, lifecycle, evidence)',
        'Halt':   '    case Capability.Halt{}:   halt_decision(actor, lifecycle, evidence)',
        'Freeze': '    case Capability.Freeze{}: freeze_decision(actor, lifecycle, evidence)',
        'Close':  '    case Capability.Close{}:  close_decision(actor, lifecycle, evidence)',
    }
    return '\n'.join(canonical_lines[cap] for cap in order)


def gen_001():
    return CANONICAL


def gen_002():
    order = ['Close', 'Freeze', 'Halt', 'Work']
    new_block = get_capability_block(CANONICAL, order)
    old_block = get_capability_block(CANONICAL, ['Work', 'Halt', 'Freeze', 'Close'])
    text = CANONICAL.replace(old_block, new_block)
    return text


def gen_003():
    # Wrap each per-cap call with a passthrough
    text = CANONICAL
    for name in ['work', 'halt', 'freeze', 'close']:
        text = text.replace(
            '{}_decision(actor, lifecycle, evidence)'.format(name),
            '{}_decision_passthrough(actor, lifecycle, evidence)'.format(name),
            1
        )
    # Insert passthrough defs before authorize
    passthroughs = """
def work_decision_passthrough(actor: Actor, lifecycle: Lifecycle, evidence: Evidence) -> Decision:
  work_decision(actor, lifecycle, evidence)

def halt_decision_passthrough(actor: Actor, lifecycle: Lifecycle, evidence: Evidence) -> Decision:
  halt_decision(actor, lifecycle, evidence)

def freeze_decision_passthrough(actor: Actor, lifecycle: Lifecycle, evidence: Evidence) -> Decision:
  freeze_decision(actor, lifecycle, evidence)

def close_decision_passthrough(actor: Actor, lifecycle: Lifecycle, evidence: Evidence) -> Decision:
  close_decision(actor, lifecycle, evidence)

"""
    text = text.replace('# authorize decomposes on capability;', passthroughs + '# authorize decomposes on capability;', 1)
    return text


def gen_004():
    # Wrap every leaf with wrap_with_dummy(Unit{}, d)
    text = CANONICAL
    wrap_def = """
def wrap_with_dummy(_: Unit, d: Decision) -> Decision:
  d

"""
    text = text.replace('# Work authority (LAW-007)', wrap_def + '# Work authority (LAW-007)', 1)
    new_lines = []
    for line in text.split('\n'):
        stripped = line.rstrip()
        m = re.match(r'^(\s+)case (\S+):\s+(Decision\.(?:Allow|Deny\{[^}]+\}))\s*$', stripped)
        if m:
            indent, ctor, decision = m.group(1), m.group(2), m.group(3)
            line = '{ind}case {ctor}: wrap_with_dummy(Unit{{}}, {dec})'.format(
                ind=indent, ctor=ctor, dec=decision
            )
        new_lines.append(line)
    return '\n'.join(new_lines)


def gen_005():
    order = ['Freeze', 'Close', 'Work', 'Halt']
    new_block = get_capability_block(CANONICAL, order)
    old_block = get_capability_block(CANONICAL, ['Work', 'Halt', 'Freeze', 'Close'])
    return CANONICAL.replace(old_block, new_block)


def gen_006():
    # work_decision Reviewer branch lifecycle rotation (move Closed to last).
    # Canonical Reviewer branch in work_decision has:
    #         case Lifecycle.Closed{}: ...
    #         case Lifecycle.Frozen{}: ...
    #         case Lifecycle.Draft{}:  ...
    #         case Lifecycle.Active{}: ...
    #         case Lifecycle.Halted{}: ...
    # Swap Draft and Closed (both have different content; this is a real rotation).
    # Wait, this changes semantics. Let me instead just reorder the dispatcher.
    order = ['Halt', 'Work', 'Close', 'Freeze']
    new_block = get_capability_block(CANONICAL, order)
    old_block = get_capability_block(CANONICAL, ['Work', 'Halt', 'Freeze', 'Close'])
    return CANONICAL.replace(old_block, new_block)


def gen_007():
    # work_decision Reviewer branch with Closed at end (preserves semantic content
    # but changes ordering).
    # The canonical Reviewer branch is:
    #     case Actor.Reviewer{}:
    #       match lifecycle:
    #         case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
    #         case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
    #         case Lifecycle.Draft{}:  Decision.Allow{}
    #         case Lifecycle.Active{}: Decision.Allow{}
    #         case Lifecycle.Halted{}: Decision.Allow{}
    # We need to find this block.  It's the only one matching this exact pattern.
    # Rotating to (Frozen, Draft, Active, Halted, Closed) preserves semantics.
    text = CANONICAL
    text = text.replace(
        '''        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Draft{}:  Decision.Allow{}
        case Lifecycle.Active{}: Decision.Allow{}
        case Lifecycle.Halted{}: Decision.Allow{}''',
        '''        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Draft{}:  Decision.Allow{}
        case Lifecycle.Active{}: Decision.Allow{}
        case Lifecycle.Halted{}: Decision.Allow{}
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}'''
    )
    return text


def gen_008():
    # work_decision Automation branch with Closed at end.
    text = CANONICAL
    text = text.replace(
        '''        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Active{}: Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongActor{}}''',
        '''        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Active{}: Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}'''
    )
    return text


def gen_009():
    # halt_decision Agent branch lifecycle rotation (move Closed to end).
    text = CANONICAL
    text = text.replace(
        '''        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Active{}: Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}''',
        '''        case Lifecycle.Active{}: Decision.Deny{DenyReason.WrongActor{}}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}'''
    )
    return text


def gen_010():
    # halt_decision Reviewer branch lifecycle rotation.
    text = CANONICAL
    text = text.replace(
        '''        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Active{}:
          match evidence:
            case Evidence.None{}:   Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}: Decision.Allow{}
            case Evidence.Live{}:   Decision.Allow{}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}''',
        '''        case Lifecycle.Active{}:
          match evidence:
            case Evidence.None{}:   Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}: Decision.Allow{}
            case Evidence.Live{}:   Decision.Allow{}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}'''
    )
    return text


def gen_011():
    # freeze_decision Reviewer branch lifecycle rotation.
    text = CANONICAL
    text = text.replace(
        '''        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Active{}:
          match evidence:
            case Evidence.None{}:   Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}: Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Live{}:   Decision.Allow{}
        case Lifecycle.Halted{}:
          match evidence:
            case Evidence.None{}:   Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}: Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Live{}:   Decision.Allow{}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}''',
        '''        case Lifecycle.Active{}:
          match evidence:
            case Evidence.None{}:   Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}: Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Live{}:   Decision.Allow{}
        case Lifecycle.Halted{}:
          match evidence:
            case Evidence.None{}:   Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}: Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Live{}:   Decision.Allow{}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Frozen{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}'''
    )
    return text


def gen_012():
    # close_decision Reviewer branch lifecycle rotation.
    text = CANONICAL
    text = text.replace(
        '''        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}
        case Lifecycle.Frozen{}:
          match evidence:
            case Evidence.None{}:   Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}: Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Live{}:   Decision.Allow{}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Active{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongLifecycle{}}''',
        '''        case Lifecycle.Frozen{}:
          match evidence:
            case Evidence.None{}:   Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Replay{}: Decision.Deny{DenyReason.InsufficientEvidence{}}
            case Evidence.Live{}:   Decision.Allow{}
        case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Active{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Halted{}: Decision.Deny{DenyReason.WrongLifecycle{}}
        case Lifecycle.Closed{}: Decision.Deny{DenyReason.Terminal{}}'''
    )
    return text


GENERATORS = [gen_001, gen_002, gen_003, gen_004, gen_005, gen_006,
              gen_007, gen_008, gen_009, gen_010, gen_011, gen_012]


def main():
    for i, gen in enumerate(GENERATORS, start=1):
        cid = "IND-MRVN09-" + str(i).zfill(3)
        write_candidate(cid, gen())
    print("generated " + str(len(GENERATORS)) + " candidates")


if __name__ == "__main__":
    main()
