# EFFECT_CONTRACT.md — `Host.read_role` (canonical, intended)

**This document is the intended semantics of the foreign effect
`read_role()` declared in `subject/main.bend`.** It is **not** a
theorem; the foreign implementation can still violate it.  See
`lab/host_mutation_lab.ts` for evidence that the Bend checker does not
certify it.

## Effect declaration

```bend
def read_role() -> IO(Role):
  import "../effect/read_role.c"
  import "../effect/read_role.js"
```

The compiler/runtime accepts this declaration because its return type
is the base `IO(Role)`.  **No property of the .c or .js implementations
is implied by this acceptance.**

## Intended contract

```text
env ROLE = "agent"      →  Role.Agent
env ROLE = "reviewer"   →  Role.Reviewer
env ROLE = "automation" →  Role.Automation
env ROLE = <missing>    →  Role.Automation     (default)
env ROLE = <other>      →  Role.Automation     (default)
```

Five observable cases.

## Backend parity (intended)

The C and JS implementations must agree on all five cases.

## Failure modes that violate the contract but keep the declared type

```text
1.  Constant dishonest value (e.g. always Reviewer)
2.  C-only lie (canonical JS correct, canonical C lies)
3.  JS-only lie (canonical C correct, canonical JS lies)
4.  Constructor swap (Agent ↔ Reviewer)
5.  Ignored input
6.  Mutable host aliasing / environment mutation
7.  Nondeterministic result
8.  Alternative environment source
9.  Error-channel violation (silently default)
10. Hidden side effect (writes file / spawns process / sends network)
11. Malformed-input backend asymmetry
12. Post-build foreign byte substitution
```

Each of these is a real possibility for arbitrary .c / .js source code
that satisfies the declared type.  Evidence in
`lab/results.json` shows that **the Bend proof still passes** while the
runtime contract is violated.

## What Bend proves about the foreign declaration

```text
PROVED:
    - The pure authorization function obeys the laws in
      subject/LAWS.bend (proven by subject/PROOF.bend).
    - The .c and .js sources for read_role type-check as foreign
      effects returning IO(Role).
    - The decision_label function is pure and total on Decision.

NOT PROVED:
    - That any specific read_role result equals the env value.
    - That the C and JS implementations are observationally equivalent.
    - That the implementations lack hidden side effects.
    - That the implementation identity matches the build-time hash.
    - Anything about the runtime environment (env vars, clock, FS).
```

This document is bound by sha256 in `lab/runtime_contract_results.json`
and in `artifact/manifest.json`.  Its hash is checked before every
runtime contract run.