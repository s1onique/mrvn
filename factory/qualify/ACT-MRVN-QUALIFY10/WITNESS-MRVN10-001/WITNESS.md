# WITNESS-MRVN10-001

**The central MRVN-10 evidence packet.**  This witness demonstrates, in
one self-contained directory, the central proposition of MRVN-10:

```text
The same Bend declaration, same LAWS.bend, same PROOF.bend
   -> proof still PASSES
Different foreign bytes
   -> runtime contract can VIOLATE
```

The witness is **byte-identical to the canonical subject files in this
ACT** at the pure layer (`pure/*.bend` is a copy of `subject/*.bend`)
and at the canonical foreign layer (`effect/read_role.{c,js}` is a
copy of `effect/read_role.{c,js}`).  The mutation lives in
`effect_mutated/` and is byte-identical to
`mutations/MUT-01/effect/read_role.js`.

## Layout

```
WITNESS-MRVN10-001/
  pure/
    main.bend     -- the canonical subject (3*2 matrix, pure policy)
    LAWS.bend     -- the immutable specification (LAW-IO-001..005)
    PROOF.bend    -- the proofs of LAWS.bend (all 9 PROVED)
  effect/
    read_role.c   -- canonical C effect (honest)
    read_role.js  -- canonical JS effect (honest)
  effect_mutated/
    read_role.c   -- canonical C effect (honest, unchanged)
    read_role.js  -- MUTATED JS effect (MUT-01: always returns Reviewer)
  runtime_oracle.json     -- 7 contract cases (frozen)
  proof-pass.txt          -- "All terms check." (canonical proof run)
  runtime-contract-fail.txt -- observed labels under canonical vs
                              mutated JS effect
  WITNESS.md              -- this file
```

## Demonstration (reproduced here from a fresh run; full transcript in `runtime-contract-fail.txt`)

```text
CANONICAL:
  ROLE=agent       -> ALLOW
  ROLE=reviewer    -> ALLOW
  ROLE=automation  -> DENY:no_automation_work

MUTATED (effect/read_role.{c,js} swapped for effect_mutated/*):
  ROLE=agent       -> ALLOW
  ROLE=reviewer    -> ALLOW
  ROLE=automation  -> ALLOW                  <-- HOST LIE: foreign JS
                                                  ignores ROLE and returns
                                                  Reviewer, so automation
                                                  gets Work via the pure
                                                  reviewer-work path.

PROOF (unchanged across canonical and mutated):
  All terms check.
```

## What the witness proves

1. The **proof** survives the foreign-byte substitution because the
   pure authorization function and its laws are byte-identical across
   canonical and mutated subjects.

2. The **runtime contract** is violated by the mutated foreign bytes
   even though the declared Bend type `IO(Role)` is unchanged.

3. The **Bend checker** cannot distinguish the two implementations at
   the foreign-effect boundary: both compile, both type-check, both
   pass the proof.  Only the program sees the difference, by observing
   what `read_role()` actually returns.

This is the central MRVN-10 fact: the proof authority ends where
unproved effects begin.

## CORRECTION01 alignment

After CORRECTION01 the witness's `pure/LAWS.bend` and `pure/PROOF.bend`
are refreshed copies of `subject/LAWS.bend` and `subject/PROOF.bend`.
The reformulated, non-tautological laws live here:

| Law | Status |
|-----|--------|
| LAW-IO-001 (work_iff_agent_or_reviewer, 3-case split) | PROVED |
| LAW-IO-002 (work_automation_yields_deny) | PROVED |
| LAW-IO-003 (5 cell equalities: agent_work_is_allow, reviewer_work_is_allow, reviewer_halt_is_allow, agent_halt_is_deny, automation_halt_is_deny) | PROVED |
| LAW-IO-004 (agent_and_reviewer_share_work_decision) | PROVED |
| LAW-IO-005 (reviewer_halt_equals_agent_work_allow) | PROVED |

Witness layer sha256s (see `evidence/witness_hashes.txt`):

```text
c27ae193877b81284e309460a37d462556d025039294185c6d4dd3fe03c35eb5  WITNESS-MRVN10-001/pure/LAWS.bend
95405fc828549b8dd4a999760965bf239e355667d1f103727da5ecab9942392e  WITNESS-MRVN10-001/pure/PROOF.bend
c4a8faff7fe391b5532304331a12f62c06f8890622faaf30f9e121e8e8328898  WITNESS-MRVN10-001/pure/main.bend
e32bb8944ce0046132b62542600b95a5212fe40a1b8535ea43a9f97e60e6e529  WITNESS-MRVN10-001/effect/read_role.c
11dc09f64cf9605523d2513cf21808cf1d84ad2b2106778d9b94389a358b6094  WITNESS-MRVN10-001/effect/read_role.js
e32bb8944ce0046132b62542600b95a5212fe40a1b8535ea43a9f97e60e6e529  WITNESS-MRVN10-001/effect_mutated/read_role.c
52a952160e54f439654d8e2e7954bec83975268d80df6fddc3ce08ea29c8e262  WITNESS-MRVN10-001/effect_mutated/read_role.js
b49a74efc6f93d55c2f4271f0f926ace6e6b637f5f2095e2d6152d2a34e10f22  WITNESS-MRVN10-001/runtime_oracle.json
```

The mutated JS hash (`52a95216...`) differs from the canonical JS hash
(`11dc09f6...`) — same foreign function name, different bytes, same
declared Bend type.  This is the byte-level confirmation that the
witness compares identical proof surface against non-identical foreign
surface.

## Related artifacts (back to the ACT root)

* `effect/read_role.c` and `effect/read_role.js` are byte-identical to
  `WITNESS-MRVN10-001/effect/read_role.{c,js}`.
* `mutations/MUT-01/effect/read_role.js` is byte-identical to
  `WITNESS-MRVN10-001/effect_mutated/read_role.js`.
* `oracle/runtime_oracle.json` is byte-identical to
  `WITNESS-MRVN10-001/runtime_oracle.json`.
* `subject/{LAWS,PROOF,main}.bend` are byte-identical to
  `WITNESS-MRVN10-001/pure/{LAWS,PROOF,main}.bend`.
