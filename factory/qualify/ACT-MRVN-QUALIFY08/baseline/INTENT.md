# ACT-MRVN-QUALIFY06 — INTENT.md

This is the **frozen intended semantics** for the MRVN-04 / MRVN-06
authority policy.  It is an independent human authority, distinct from
`LAWS.bend`.  The full 180-cell mechanical projection of this policy
is `oracle.json` in this directory.

## Domain

```text
Actor       = Agent | Reviewer | Automation         (3)
Capability  = Work | Halt | Freeze | Close          (4)
Lifecycle   = Draft | Active | Halted | Frozen | Closed  (5)
Evidence    = None | Replay | Live                  (3)
```

## Observable Decision semantics

```text
Decision =
  Allow                                 (no reason)
  Deny{Terminal}                        (Closed lifecycle)
  Deny{WrongActor}                      (otherwise valid lifecycle but actor cannot perform this capability)
  Deny{WrongLifecycle}                  (otherwise valid actor but lifecycle does not admit this capability)
  Deny{InsufficientEvidence}            (otherwise valid actor+lifecycle but evidence is too weak)
```

## Reason precedence (intentional)

When multiple dimensions are simultaneously wrong, the policy reports
the most fundamental reason.  The exact precedence depends on the
capability:

```text
Terminal              (highest; the lifecycle is Closed, the record is sealed)
WrongActor / WrongLifecycle (capability-dependent)
InsufficientEvidence  (lowest; only reached when actor+lifecycle are already valid)
```

The capability-specific rules below encode the precedence EXACTLY as
the canonical implementation reports it.  This is the human-readable
intended behavior.

## Capability-specific intended policy

### Work

```text
Work is allowed iff
    actor in {Agent, Reviewer}    AND
    lifecycle in {Draft, Active, Halted}
```

Otherwise:

```text
Closed lifecycle   -> Deny{Terminal}
Frozen lifecycle   -> Deny{WrongLifecycle}      (any actor)
other actor        -> Deny{WrongActor}          (Automation attempting Work; only reached for non-Frozen lifecycles)
Evidence is irrelevant for Work.
```

### Halt

```text
Halt is allowed iff
    actor in {Agent, Reviewer, Automation}    AND
    lifecycle == Active                       AND
    evidence in {Replay, Live}
```

Otherwise:

```text
Closed lifecycle           -> Deny{Terminal}
lifecycle != Active        -> Deny{WrongLifecycle}    (any actor, including Agent)
actor = Agent + Active     -> Deny{WrongActor}       (only reached when lifecycle is Active)
evidence = None + Active   -> Deny{InsufficientEvidence}  (only reached when actor != Agent)
```

Note: for Halt, the precedence is WrongLifecycle > WrongActor > InsufficientEvidence.

### Freeze

```text
Freeze is allowed iff
    actor == Reviewer      AND
    lifecycle in {Active, Halted}    AND
    evidence == Live
```

Otherwise:

```text
Closed lifecycle                       -> Deny{Terminal}
lifecycle in {Draft, Frozen}           -> Deny{WrongLifecycle}    (any actor)
actor in {Agent, Automation} + Active/Halted  -> Deny{WrongActor}  (only when lifecycle is valid for Freeze)
evidence in {None, Replay} + Reviewer + Active/Halted  -> Deny{InsufficientEvidence}
```

Note: for Freeze, the precedence is WrongLifecycle > WrongActor > InsufficientEvidence.

### Close

```text
Close is allowed iff
    actor == Reviewer     AND
    lifecycle == Frozen   AND
    evidence == Live
```

Otherwise:

```text
Closed lifecycle                       -> Deny{Terminal}
lifecycle != Frozen                    -> Deny{WrongLifecycle}    (any actor, including Agent)
actor in {Agent, Automation} + Frozen   -> Deny{WrongActor}       (only when lifecycle is Frozen)
evidence in {None, Replay} + Reviewer + Frozen  -> Deny{InsufficientEvidence}
```

Note: for Close, the precedence is WrongLifecycle > WrongActor > InsufficientEvidence.
The reason "WrongActor" only appears when lifecycle is Frozen; otherwise
the lifecycle check fires first.

## Note on reviewer's "Replay close" (the known-gap cell)

For the cell

```text
Reviewer + Close + Frozen + Replay
```

the intended policy reports:

```text
Deny{InsufficientEvidence}
```

because Reviewer+Frozen is otherwise valid, and the only failing
dimension is evidence.  The canonical Bend impl agrees with this
intent at this cell; the MRVN-04 law book also happens to fail to
constrain the reason at this exact cell (the reason for this cell is
not in `LAW-MRVN04-012`'s high-value cell list and is not directly
constrained by `LAW-MRVN04-005`'s iff-form).  MRVN-06's working
hypothesis is that other "Replay-close-shaped" cells, or
similar Replay-shape cells in Freeze and Close, may also be
underconstrained.

## Note on Terminal-vs-other precedence

Terminal (Closed lifecycle) **always wins** over actor/lifecycle/evidence
mistakes.  This is encoded in `LAW-MRVN04-001` as the
`closed_denies_everything` law, which all candidate implementations
must continue to satisfy.

## Note on intent-tamper test

Any change to `oracle.json` that is not matched by a recomputed
`oracle_sha256` is treated as authority-tamper and aborts the lab
without producing classifications.
