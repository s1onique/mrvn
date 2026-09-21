# ACT-MRVN-QUALIFY10 EVIDENCE

Frozen authority, freeze identity, and all machine-readable outputs
referenced by `REPORT.md`.

## E.0 Frozen source/toolchain/effect identities

See `evidence/freeze.txt`:

```text
SOURCE_COMMIT=f856aa736765d7a51541e0a98affc2555db2fdc2
CLI_SHA256=34a8a791b02ce92f247bda4cabcd3ff4eabe500002fedbec4867b5db77ee1feb
CHECKER_SHA256=fe3c2b0b306fccbe44efec349d8f339b6efdaceb090b3d3049c74a1a6015c859
COMPILER_RUNTIME_SHA256=c181ac038d7f7d4ed0e1bb81c513e64285347627e0b3a13a98cb86a1d1568f54
BASE_SHA256=b2d53bbd83639c3ae27260b318efa09de9df6006a556ac6ef41c104ea164917a
EFFS_TREE_SHA256=da505588885cfc17de5c735ecc6c4e0658aa3226c2dc343364f849400f51b89f
```

## E.0.1 Payload SHAs (frozen)

See `evidence/payload_hashes.txt`.  Each file's SHA256 is the value
the artifact's `pure_payload.files[]` and `foreign_effects[]` bind.

## E.1 Trust-boundary model

See `REPORT.md` § Q1..Q12 and `TCB.md`.

## E.2 Canonical pure subject: `subject/main.bend`

Pure policy over `(Role, Operation) -> Decision`.  Foreign effect
`read_role()` is the sole host touchpoint.

## E.3 Canonical LAWS/PROOF

* `subject/LAWS.bend` -- immutable specification (LAW-IO-001..005).
* `subject/PROOF.bend` -- proofs of every law by structural case-split.

```text
$ bun bend2/main.ts subject/PROOF.bend
"All terms check."
exit: 0
```

### E.3.1 CORRECTION01 -- LAW-IO-004 and LAW-IO-005 reformulated

The initial closure had LAWS-004/005 as reflexive tautologies
(`x == x`).  Both were reformulated to non-tautological,
distinct-input equalities that the proof checker accepts and that
would fail if the policy collapsed:

```bend
law agent_and_reviewer_share_work_decision:
  {authorize(Agent, Work) == authorize(Reviewer, Work) : Decision}
law reviewer_halt_equals_agent_work_allow:
  {authorize(Reviewer, Halt) == authorize(Agent, Work) : Decision}
```

The closure claim "no host value proof promotion" was MOVED from
proof-authority into empirical negative-control evidence (NC-06),
where it is recorded as CHECKER_REJECTED, not as PROVED.

## E.4 Effect contract

`EFFECT_CONTRACT.md` -- intended semantics of `Host.read_role`.  Bound
in `manifest.foreign_effects[].semantic_contract` and
`manifest.foreign_effects[].contract_sha256`.  **Not** a theorem;
treated as `RUNTIME_OBSERVED`.

## E.5 JS baseline

`effect/read_role.js` (canonical).  Honest Role dispatch from
`process.env.ROLE` using own-key only.

## E.6 C baseline

`effect/read_role.c` (canonical).  Honest `getenv("ROLE")` dispatch.

## E.7 Backend parity

`lab/backend_parity.json`:

```text
js cases pass: 7/7
c  cases pass: 7/7
JS_VS_C_DIFF:  0
HOST_VS_CONTRACT_DIFF: 0 (canonical)
```

## E.6.1 WITNESS-MRVN10-001 evidence (post-CORRECTION01 refresh)

The self-contained witness directory demonstrates the central
proposition in one place.  After CORRECTION01 its `pure/` layer is
byte-identical to the current `subject/` and its proof surface is the
reformulated, non-tautological law set.

```text
WITNESS-MRVN10-001/
  pure/{LAWS,PROOF,main}.bend       = copies of subject/{LAWS,PROOF,main}.bend
  effect/{read_role.c,read_role.js} = copies of canonical effect/
  effect_mutated/{read_role.c,read_role.js}
                                       = effect/read_role.{c,js}
                                       (MUT-01: always-Reviewer JS,
                                        honest C)
  runtime_oracle.json                = oracle/runtime_oracle.json
  proof-pass.txt                     = "All terms check."
  runtime-contract-fail.txt          = canonical vs mutated observed labels
  WITNESS.md                         = full reproduction recipe
```

Fresh-run observed labels (captured in `runtime-contract-fail.txt`):

```text
CANONICAL:                                MUTATED:
  ROLE=agent       -> ALLOW                 ROLE=agent       -> ALLOW
  ROLE=reviewer    -> ALLOW                 ROLE=reviewer    -> ALLOW
  ROLE=automation  -> DENY:no_automation    ROLE=automation  -> ALLOW   (HOST LIE)
PROOF: "All terms check."   (unchanged across canonical and mutated)
```

The mutated JS hash (`52a95216...`) differs from the canonical JS hash
(`11dc09f6...`).  Same foreign function name, different bytes, same
declared Bend type — proof surface is unchanged; runtime surface
diverges.  See `evidence/witness_hashes.txt` for all per-file sha256s.

## E.8 Runtime oracle

`oracle/runtime_oracle.json` (frozen, SHA
`b49a74efc6f93d55c2f4271f0f926ace6e6b637f5f2095e2d6152d2a34e10f22`).
7 cases.

## E.9..E.20 -- MUT-01..MUT-12

See `lab/host_mutation_lab_result.json` (per-mutation summary) and
`lab/host_mutation_lab_result.json.mutations[]` (per-case results).
Each mutation preserves the declared Bend type but violates at least
one of: contract, determinism, observability, side-effect freedom,
backend parity.

## E.21 Type-level negative controls

`lab/negative_controls_result.json`:

```text
NC-01 wrong return type           -> CHECKER_REJECTED
NC-02 non-IO return type          -> CHECKER_REJECTED
NC-03 missing .c import           -> BUILD_REJECTED (no .c)
NC-04 missing .js import          -> CLI_REJECTED (no .js)
NC-05 @unsafe def                 -> CLASSIFIED_AS_UNSAFE
NC-06 IO in proof authority       -> CHECKER_REJECTED
```

## E.22 Dead/live boundary probes

`NC-06` (above) is the primary probe.  See also
`lab/negative_controls/dead_live/main.bend`.

## E.23 Unsafe negative control

`lab/negative_controls/unsafe_escape/`.  Classified
`UNSAFE_ESCAPE_HATCH`.

## E.24 Filesystem authority

`/tmp/mrvn10-host-aliasing.txt` (MUT-06) and
`/tmp/mrvn10-hidden-side-effect.txt` (MUT-10) -- detected as
side-effect drift.  No write outside sandbox observed.

## E.25 Local network authority

MUT-10 includes a network call in theory (the docs allow it).  In
this ACT, no public network is used.  See `lab/host_mutation_lab.ts`
for the offline-discipline.

## E.26 Concurrency probe

`lab/nondet_probe.ts` runs MUT-07 (nondet) under 20 trials with a Halt-
mode probe and detects the host nondeterminism.  See
`host_mutation_lab_result.json.totals.nondeterministic_count = 1`.

## E.27 Foreign dependency closure

`lab/build_artifact_v2.ts` performs local source closure.  System
libraries recorded as `ASSUMED` external assumptions.

## E.28 Artifact-v2 design

Schema `mrvn-artifact-v2`.  See `lab/build_artifact_v2.ts` and
`lab/verify_artifact_v2.ts`.

## E.29 Artifact-v2 verification

`lab/full_pipeline.ts` writes `artifact-js/manifest.json` (js) and
`artifact-c/manifest.json` (c).  Both pass `--mode full`.

### E.29.1 CORRECTION01 -- Single source of artifact identity

The previous closure had a stale `artifact/manifest.json` with
`target_sha256: 000...000` and `contract_pass: true`, plus an
`artifact_index.json` that pointed the C backend at the wrong
directory.  CORRECTION01 removes the dual-write:

* `build_artifact_v2.ts` writes only to `artifact-{js,c}/manifest.json`.
* `artifact/` is now empty + `README.txt` (non-authoritative marker).
* `artifact_index.json` is generated from the manifests in place.

Authority per backend (final, post-full-pipeline):

| Backend | artifact_id                                                          | manifest path                  |
|---------|----------------------------------------------------------------------|--------------------------------|
| js      | sha256:3bc9a3c755dfcb17412fe26c52d6b9d4246278b3dc453c20e71247daacc492e9 | artifact-js/manifest.json      |
| c       | sha256:bf1a21a804c0b936ea336ecf21596bfa256d95dc9462a713d74e720a93f85184 | artifact-c/manifest.json       |

Per-backend 4-way reconciliation.  Enforced by
`lab/verify_id_reconciliation.ts` (exits 0 on PASS):

```text
$ bun lab/verify_id_reconciliation.ts
[js] manifest_path=artifact-js/manifest.json
       id          = sha256:3bc9a3c755dfcb17412fe26c52d6b9d4246278b3dc453c20e71247daacc492e9
       sidecar ==  : true   index   == : true   verify  == : true
       target_sha256 != PENDING : true  (249f6e0ece45c1da...)
       cases_run == 7           : true
       contract_pass == true    : true

[c] manifest_path=artifact-c/manifest.json
       id          = sha256:bf1a21a804c0b936ea336ecf21596bfa256d95dc9462a713d74e720a93f85184
       sidecar ==  : true   index   == : true   verify  == : true
       target_sha256 != PENDING : true  (7b31557f28971bf9...)
       cases_run == 7           : true
       contract_pass == true    : true

reconciliation overall: PASS
```

The artifact_id rotates with each fresh build because the manifest is
content-addressed over `runtime_evidence[].observed_at`.  The invariant
is the equality of the four SHA sources and the structural properties
(target_sha256 != PENDING, cases_run = 7, contract_pass = true).
`evidence/artifact_v2_ids.txt` records the IDs from the closure
pipeline run.

Toolchain closure (identical across backends, content-addressed):

```text
main_ts_sha256:      34a8a791b02ce92f247bda4cabcd3ff4eabe500002fedbec4867b5db77ee1feb
bend_ts_sha256:      fe3c2b0b306fccbe44efec349d8f339b6efdaceb090b3d3049c74a1a6015c859
comp_ts_sha256:      c181ac038d7f7d4ed0e1bb81c513e64285347627e0b3a13a98cb86a1d1568f54
base_bend_sha256:    b2d53bbd83639c3ae27260b318efa09de9df6006a556ac6ef41c104ea164917a
effs_tree_sha256:    da505588885cfc17de5c735ecc6c4e0658aa3226c2dc343364f849400f51b89f
bun_version:         1.3.14
node_version:        v26.0.0
clang_version:       Apple clang 15.0.0 (clang-1500.0.40.1) arm64-apple-darwin23.6.0
```

`bend_dir` is removed from `toolchain_closure` (path-free identity,
matching MRVN-05 doctrine).  The previous closure recorded
`bend_dir: /Volumes/UserData/...` which leaked producer layout;
CORRECTION01.3 removes this.

## E.30 Claim-scope tests

`lab/self_test.ts` case 12 (`claim_authority_overreach_rejected`) and
`lab/authority_attacks.ts` case 15.

## E.31 Self-tests

`lab/self_test_results.json`:

```text
20/20 PASS
```

## E.32 Authority attacks

`lab/authority_attacks_result.json`:

```text
15/15 PASS
```

## E.33 Regression hygiene

`lab/regression_hygiene_result.json`:

```text
watched_acts:      6  (MRVN-04..09)
watched_files:     2494  (whole tree, via git ls-tree -r HEAD)
drift_count:       0
negative_control:  PASS (target=MRVN-QUALIFY04.EVIDENCE.md, off-sample)
```

Negative regression control: the off-sample target is the first file
in the frozen manifest that is NOT in the previously-sampled 8-file
list (currently `factory/qualify/ACT-MRVN-QUALIFY04/EVIDENCE.md`).
Tampering it produces a sha256 different from the frozen value and
is detected.

The frozen manifest itself is at
`evidence/regression_frozen_manifest.json` (schema
`mrvn-regression-frozen-manifest-v1`).

## E.34 Prior MRVN regressions

All MRVN-04..09 lab entry points run without write:

* `factory/qualify/ACT-MRVN-QUALIFY04/...` -- 2494 files across 6 ACTs, all sha256-verified via the frozen manifest.
* Prior 8-file sample (preserved for back-compat in REPORT.md and the SAMPLE_8 list inside `regression_hygiene.ts`) -- still inside the watched set.

The negative control target is OFF-sample (`MRVN-QUALIFY04/EVIDENCE.md`), confirming drift anywhere in the prior-ACT tree would be detected.

## E.35 Offline/runtime sandbox evidence

All mutation runs execute in `/tmp/mrvn10-*` temp dirs and clean up.
No writes outside sandbox detected.  No public network used.

## E.36 Economics

| Item                                     | Cost                |
|------------------------------------------|---------------------|
| Bend toolchain check (`bun main.ts ...`) | < 1 s               |
| Host mutation lab (168 cases)            | ~60 s (Apple M-series)|
| Self-test suite                          | ~60 s               |
| Authority attacks (15)                   | ~5 s                |
| Regression hygiene                        | < 1 s               |

## E.37 TCB map

See `TCB.md` and `lab/tcb.json`.

## E.38 Final disposition

```text
MRVN-10 verdict: FULL_QUALIFICATION_EFFECT_BOUNDARY_EXPLICIT
MRVN-EXT-01:    LOCKED (unchanged)
Next ACT:      MRVN-11 (portable effectful artifact hardening / backend divergence / real application pilot)
```

