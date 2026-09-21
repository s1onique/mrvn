# ACT-MRVN-QUALIFY10 REPORT

## Principal Verdict

**`FULL_QUALIFICATION_EFFECT_BOUNDARY_EXPLICIT`**

The trust-boundary machinery of ACT-MRVN-QUALIFY10 mechanically
demonstrates the difference between:

```text
"The pure theorem is true"
       and
"The host behaved according to our intended external-world contract."
```

The verifier never conflates them.

## Frozen Authority (byte-identical to MRVN-04..09)

```text
source_commit:                   f856aa736765d7a51541e0a98affc2555db2fdc2
CLI_SHA256 (bend2/main.ts):      34a8a791b02ce92f247bda4cabcd3ff4eabe500002fedbec4867b5db77ee1feb
CHECKER_SHA256 (bend2/bend.ts):  fe3c2b0b306fccbe44efec349d8f339b6efdaceb090b3d3049c74a1a6015c859
COMPILER_RUNTIME_SHA256:        c181ac038d7f7d4ed0e1bb81c513e64285347627e0b3a13a98cb86a1d1568f54
BASE_SHA256:                     b2d53bbd83639c3ae27260b318efa09de9df6006a556ac6ef41c104ea164917a
EFFS_TREE_SHA256:                da505588885cfc17de5c735ecc6c4e0658aa3226c2dc343364f849400f51b89f
```

Host fingerprint:

```text
Darwin MacBook-Pro-3.local 23.6.0 Darwin arm64
macOS 14.7.4 (BuildVersion 23H420)
bun 1.3.14
node v26.0.0
Apple clang 15.0.0 (clang-1500.0.40.1) arm64-apple-darwin23.6.0
```

## Headline Numbers

```text
WATCHED_PRIOR_ACTS:                MRVN-04..09   (6 prior ACTs)
WATCHED_PRIOR_FILES:               2494          (whole tree, git ls-tree -r HEAD)
DRIFT_COUNT:                       0
NEGATIVE_REGRESSION_DETECTED:      true  (off-sample target=MRVN-QUALIFY04.EVIDENCE.md)

HOST_MUTATION_CASES_RUN:           168    (12 mutations x 7 oracle cases x 2 backends)
HOST_SEMANTIC_VIOLATION_COUNT:     8      (every non-trivial MUT does)
BACKEND_DIVERGENCE_COUNT:          5      (MUT-02, 03, 04, 07, 11 diverge)
NONDETERMINISTIC_COUNT:            1      (MUT-07)
OBSERVABLE_SIDE_EFFECT_COUNT:      2      (MUT-06, MUT-10)
PROOF_PRESERVED_DESPITE_DRIFT:     8      (proof still passes for every mutation)

BACKEND_PARITY (canonical):
  JS cases pass: 7/7
  C  cases pass: 7/7
  diff_count:    0

NEGATIVE_CONTROLS:                6/6 PASS
SELF_TESTS:                        20/20 PASS
AUTHORITY_ATTACKS:                 15/15 PASS
REGRESSION_HYGIENE:                2494 watched across 6 ACTs, 0 drift
                                  off-sample negative control PASS
```

## Q1 -- What does Bend prove about a foreign effect declaration?

**Bend proves only that the foreign declaration has the declared type
and that the file imports cleanly.**  Specifically, given

```bend
def read_role() -> IO(Role):
  import "./read_role.c"
  import "./read_role.js"
```

the checker enforces:

1. The return type is **base** `IO(Role)` (not a type alias).
2. Both a `.c` and `.js` source exist at the imported paths.
3. The shape of arguments matches the declared tele.
4. The constructor names used in `.c` (e.g. `Role.Agent`) reference
   constructors of `Role` declared in the importing `.bend` file.

The checker does **not** prove that the `.c` body returns a value
that came from the environment, that the `.js` body returns the right
constructor, that the two backends are observationally equivalent,
that the implementation lacks hidden side effects, or anything about
the external environment.

## Q2 -- What remains outside proof authority?

Everything about the foreign implementation except its declared type:

* Whether the implementation reads `ROLE` at all.
* Whether the implementation returns `Role.Agent` vs `Role.Reviewer` vs
  `Role.Automation` for any specific environment value.
* Whether the implementation is observationally consistent across C
  and JS backends.
* Whether the implementation has hidden side effects (writes to
  `/tmp`, makes network requests, mutates global state).
* Whether the implementation is deterministic across calls.
* Whether the implementation honors `EFFECT_CONTRACT.md`.
* Whether the environment the implementation reads from is faithful
  (OS, fs, network peer, etc.).

## Q4 -- C/JS backend disagreement

Yes, under honest implementations the canonical C and JS backends
agree (0 diff over the 7-case oracle).  Under dishonest implementations
(e.g., MUT-02 honest JS + dishonest C, MUT-03 mirror, MUT-11
malformed-input backend asymmetry) the two backends diverge.  See
`lab/backend_parity.json` and `lab/host_mutation_lab_result.json`.

## Q5 -- Did every dishonest-host mutation leave pure proofs intact?

Yes.  All 8 host-semantic-violation mutations leave the pure
`PROOF.bend` unchanged and passing.  The proof is over the byte-
identical pure `authorize` function; foreign-byte substitutions do
not touch it.

## Q6 -- Minimum PASS/FAIL witness

```text
canonical read_role.js + subject/main.bend
  -> bun /Volumes/.../bend2/main.ts subject/main.bend
  -> "ALLOW"        (when ROLE=agent)
  -> "DENY:no_automation_work"  (when ROLE=automation)

mutated read_role.js (always Reviewer) + subject/main.bend
  -> bun /Volumes/.../bend2/main.ts subject/main.bend
  -> "ALLOW"        (always, regardless of ROLE)

Bend proof:
  -> bun /Volumes/.../bend2/main.ts subject/PROOF.bend
  -> "All terms check."  (same outcome in both cases)
```

See `WITNESS-MRVN10-001/` for the self-contained packet.

## Q7 -- Foreign implementation bytes transitively bound

Yes.  Each entry in `manifest.foreign_effects[]` binds:

```json
{
  "effect_name": "Host.read_role",
  "bend_declaration": "subject/main.bend",
  "backend": "js",
  "logical_path": "effect/read_role.js",
  "sha256": "11dc09f64cf9605523d2513cf21808cf1d84ad2b2106778d9b94389a358b6094",
  "bytes_size": 600,
  "semantic_contract": "EFFECT_CONTRACT.md",
  "contract_sha256": "..."
}
```

Foreign dependency closure (`lab/build_artifact_v2.ts`) recursively
discovers local imports but does not attempt to hash system libraries
(macOS libc, kernel, etc.) -- those are explicit `ASSUMED` external
assumptions.

## Q8 -- Runtime evidence distinguished from theorem evidence

Yes.  The artifact stores **two separate claims**:

* `pure_payload.proof_status` -- set from `PROOF.bend` re-run (kind:
  `PROVED`).
* `runtime_evidence[]` -- set from `runtime_contract_runner.ts` per
  backend (kind: `RUNTIME_OBSERVED`).

A passing pure proof plus `RUNTIME_CONTRACT_FAILED` in `runtime_evidence`
is a valid and common state (see `lab/host_mutation_lab_result.json`).

The verifier explicitly distinguishes:

```text
PROOF              -- replay PROOF.bend
FOREIGN_BYTES      -- hash and bind foreign effect sources
RUNTIME_CONTRACT   -- execute runtime contract tests against frozen oracle
```

## Q9 -- Can a runtime observation be falsely promoted to PROVED?

No.  The verifier never observes a runtime value, derives a theorem
from it, or updates `proof_status`.  `proof_status` is computed only
by re-running `PROOF.bend` under `bend2/main.ts` and recording its
result.  Any claim that a runtime value certifies a theorem is
classified `CLAIM_AUTHORITY_OVERREACH`.

See `lab/self_test.ts` case 12 and `lab/authority_attacks.ts` case 15.

## Q10 -- Can runtime values cross into dead/proof authority?

No.  Three concrete negative controls:

1. **Type mismatch** (`lab/negative_controls/dead_live/main.bend`):
   constructing `{io == b : Bool}` where `io: IO(Role)` is
   `CHECKER_REJECTED`.

2. **Foreign effect** in `arb`-thread is
   `CHECKER_REJECTED` ("a foreign definition returning base IO(...)
   directly").

3. **Effect result conflation** in PROOF.bend: all proof witnesses are
   pure structural `{==}` over WNF-reduced decisions, never
   `IO(Role)` values.

The dead/live boundary is enforced by the affine checker, not by a
runtime convention.

## Q11 -- Role of `@unsafe`

The lab scans all `.bend` files for `@unsafe` markers.  Any artifact
containing `@unsafe` is classified `UNSAFE_ESCAPE_HATCH` and is not
eligible for FULL qualification.  No artifact in MRVN-10 contains
`@unsafe`.  Negative control: `lab/negative_controls/unsafe_escape/`
shows `@unsafe` is parseable but classified.

## Q12 -- Which external runtime assumptions remain irreducible?

```text
OS getenv returns process environment faithfully.
Node/Bun process.env reflects process env at spawn.
Canonical foreign implementations do not initiate network.
Filesystem permissions allow reading canonical source files.
bend2/main.ts dispatches foreign effects via io_eff_rows[CID_READ_ROLE].
```

These are recorded in `manifest.runtime_assumptions[]` and
documented in `TCB.md`.  No attempt is made to hash the OS or its
shared libraries; the artifact is honest, not aspirational.

## Q13 -- C-vs-JS parity result

```text
js_pass:                 7/7
c_pass:                  7/7
JS_VS_C_DIFF:            0
HOST_VS_CONTRACT_DIFF:    0 (canonical)
```

`lab/backend_parity.json` records these numbers.

## Q14 -- What does artifact v2 bind?

```text
pure_payload             immutable sha256 over main/LAWS/PROOF/oracle/contract
foreign_effects[]        per-backend sha256 over .c / .js effect sources
runtime_assumptions[]    external dependencies (ASSUMED)
runtime_evidence[]       per-backend observed behavior under frozen oracle
toolchain_closure        CLI, checker, compiler, base, effs closure
                         (HASH_BOUND)
provenance               captured_at (non-semantic), build_command
                         (non-semantic)
artifact_id              sha256:canonical_manifest_minus_id:v1
```

Modes:

* `--mode integrity` -- schema + hashes + side-effect
* `--mode proof`    -- integrity + replay PROOF.bend
* `--mode runtime-contract` -- integrity + runtime oracle execution
* `--mode full`     -- all of the above

## Q15 -- What is still unproven after MRVN-10?

* That arbitrary host implementations honor their stated contract.
  (Only the specific bound bytes are.)
* That the OS, kernel, runtime system, or external resources are
  well-behaved.  (Recorded as `ASSUMED`.)
* That two semantically equivalent foreign implementations are
  observationally indistinguishable.  (We bind identity, not
  semantics.)
* That runtime evidence collected under one toolchain is portable to
  another toolchain.  (`toolchain_closure` is bound; cross-toolchain
  re-verification required.)

## Q16 -- Doctrine for future Factory effectful artifacts

> Proof authority ends where unproved effects begin.

> An `IO` type constrains composition; it does not certify the
> honesty of foreign host semantics.

> Foreign implementation identity and foreign implementation
> correctness are separate claims.

> Runtime observations are evidence, not theorems.

> Effectful proof artifacts must bind the foreign TCB they execute.

> External environment state must be named as an assumption or
> observation, never smuggled into proof authority.

> A passing pure proof plus a failing runtime contract is a valid and
> expected state, not a contradiction.

## Central Witness

`WITNESS-MRVN10-001/` demonstrates the central proposition in one
self-contained directory:

```text
same Bend declaration, same LAWS.bend, same PROOF.bend
   -> proof still PASSES
different foreign bytes
   -> runtime contract can VIOLATE
```

## CORRECTION01 -- Reviewer-Feedback-Driven Refinements

Reviewer (Factory disposition) flagged four issues against the initial
closure packet. All four were addressed narrowly, without re-running
the 168-case scientific experiment.

### Issue 1 -- LAWS-004 and LAWS-005 were reflexive tautologies

The previous LAWS-004 (`decision_deterministic_in_inputs`) and
LAWS-005 (`io_role_is_not_bool`) were both `x == x`.  The Bend checker
accepted them because unfilled laws are nominal claims, not validated
equalities.  The intent was non-tautological but the *form* was
reflexivity.

**Resolution (CORRECTION01.1):**

```bend
# LAW-IO-004 (rewritten, non-tautological):
law agent_and_reviewer_share_work_decision:
  {Gate.authorize(Gate.Role.Agent{}, Gate.Operation.Work{})
     == Gate.authorize(Gate.Role.Reviewer{}, Gate.Operation.Work{})
   : Gate.Decision}
# Both sides reduce to Allow; the equality relates two DISTINCT
# (role, op) cells, not the same cell.

# LAW-IO-005 (rewritten, non-tautological):
law reviewer_halt_equals_agent_work_allow:
  {Gate.authorize(Gate.Role.Reviewer{}, Gate.Operation.Halt{})
     == Gate.authorize(Gate.Role.Agent{}, Gate.Operation.Work{})
   : Gate.Decision}
# Again, both sides reduce to Allow, but the cells differ.
```

PROVED claims after CORRECTION01.1:

| Law | Form | Status |
|-----|------|--------|
| LAW-IO-001 | work_iff_agent_or_reviewer (3-case split) | PROVED |
| LAW-IO-002 | work_automation_yields_deny (cell equality) | PROVED |
| LAW-IO-003 | agent_work_is_allow | PROVED |
| LAW-IO-003 | reviewer_work_is_allow | PROVED |
| LAW-IO-003 | reviewer_halt_is_allow | PROVED |
| LAW-IO-003 | agent_halt_is_deny | PROVED |
| LAW-IO-003 | automation_halt_is_deny | PROVED |
| LAW-IO-004 | agent_and_reviewer_share_work_decision | PROVED |
| LAW-IO-005 | reviewer_halt_equals_agent_work_allow | PROVED |

CLAIMS MOVED FROM PROOF-AUTHORITY TO EMPIRICAL-EVIDENCE:

* "An `IO(Role)` value cannot acquire theorem authority" is **not a
  proof-authority claim** in Bend -- it is a runtime-system claim.
  It lives as **CHECKER_REJECTED negative-control evidence**
  (NC-01, NC-02, NC-06) under `lab/negative_control_checker.ts`,
  not as a `law`.

### Issue 2 -- artifact_id mismatch and stale `artifact/manifest.json`

The previous closure packet listed artifact IDs that did not match the
on-disk manifests, and the `artifact_index.json` C path pointed to
`artifact/manifest.json` instead of `artifact-c/manifest.json`.
Additionally, `artifact/manifest.json` was a stale intermediate with
`target_sha256: 000...000` and `contract_pass: true` -- precisely the
kind of fake-looking evidence the v2 schema was designed to prevent.

**Resolution (CORRECTION01.2):**

1. `build_artifact_v2.ts` no longer writes to `artifact/`.  It writes
   directly to `artifact-{js,c}/manifest.json`.
2. `artifact/` now contains only `README.txt` declaring it
   non-authoritative.
3. `full_pipeline.ts` no longer copies manifests between directories;
   it builds once into the canonical per-backend dir.
4. `artifact_index.json` is generated from the manifests *in place*
   and its `manifest` paths always point to the actual built file.

**Reconciliation check after CORRECTION01.2 (final, post-full-pipeline):**

The 4-way reconciliation is enforced by `lab/verify_id_reconciliation.ts`
(which exits 0 on PASS, 1 on FAIL).  It is rerun at every
`full_pipeline.ts` invocation.  The reviewer can re-execute it at any
time:

```text
$ bun lab/verify_id_reconciliation.ts
=== ACT-MRVN-QUALIFY10 artifact-v2 4-way ID reconciliation ===
[js] manifest_path=artifact-js/manifest.json
       id          = sha256:3bc9a3c755dfcb17412fe26c52d6b9d4246278b3dc453c20e71247daacc492e9
       sidecar ==  : true  (...)
       index   ==  : true  (...)
       verify  ==  : true  (...)
       target_sha256 != PENDING : true  (249f6e0ece45c1da...)
       cases_run == 7           : true  (7)
       contract_pass == true    : true  (true)

[c] manifest_path=artifact-c/manifest.json
       id          = sha256:bf1a21a804c0b936ea336ecf21596bfa256d95dc9462a713d74e720a93f85184
       sidecar ==  : true  (...)
       index   ==  : true  (...)
       verify  ==  : true  (...)
       target_sha256 != PENDING : true  (7b31557f28971bf9...)
       cases_run == 7           : true  (7)
       contract_pass == true    : true  (true)

reconciliation overall: PASS
```

The artifact_id rotates with each fresh build because the manifest is
content-addressed over `runtime_evidence[].observed_at`.  What is
INVARIANT and what the verifier checks is the equality:

```text
artifact-{js,c}/manifest.json["artifact_id"]
   == artifact-{js,c}/manifest.sha256
   == lab/artifact_index.json["artifacts"][{js,c}]["artifact_id"]
   == lab/artifact_verify_{js,c}.json["artifact_id"]

AND
runtime_evidence[0].target_sha256 != "PENDING"
runtime_evidence[0].cases_run     == 7
runtime_evidence[0].contract_pass == true
```

`evidence/artifact_v2_ids.txt` records the IDs from the closure
pipeline run.  The latest-run transcript of the verifier is at
`evidence/verify_id_reconciliation.lastrun.txt`.

### Issue 3 -- Toolchain identity was path-bound and version-incomplete

The previous manifest captured `bend_dir: /Volumes/UserData/...` as
part of `toolchain_closure`, re-introducing the producer-path leakage
that MRVN-05 explicitly removed.  `bun_version` and `node_version`
were stored as `"?"` because the host.txt regex anchored on the
literal "bun" which is surrounded by dashes.

**Resolution (CORRECTION01.3):**

* `bend_dir` removed from `toolchain_closure`.  Identity is purely
  content-addressed by the five sha256 fields.  MRVN-05 doctrine
  restored.
* `bun_version` and `node_version` parsed correctly via
  `--- <label> ---\n<version>`.  Values: bun=1.3.14, node=v26.0.0.
* `clang_version` retained as observational provenance (not in
  artifact_id canonicalization).

### Issue 4 -- Regression hygiene was a 8-file sampled gate

The previous regression_hygiene.ts watched 8 representative files.
A frozen prior ACT is a TREE, not a sample.  Tampering a file
*outside* the sample (e.g. REPORT.md) would not have been detected.

**Resolution (CORRECTION01.4):**

* New script `lab/gen_regression_frozen_manifest.ts` enumerates every
  git-tracked file under
  `factory/qualify/ACT-MRVN-QUALIFY{04,05,06,07,08,09}/` via
  `git ls-tree -r HEAD` and writes
  `evidence/regression_frozen_manifest.json`.
* `lab/regression_hygiene.ts` now reads that frozen manifest and
  checks the whole tree: **2494 files across 6 ACTs**.
* The negative control target is now chosen **off-sample**: it
  picks the first file in the frozen manifest that is NOT in the
  previous 8-file sample (currently `MRVN-QUALIFY04.EVIDENCE.md`).
  This proves that drift in any file -- not just the prior 8 --
  would be detected.

```text
Watched: 2494 files across 6 ACTs, Drift: 0
Negative control: PASS (target=MRVN-QUALIFY04.EVIDENCE.md)
```

## Scope Exclusions

The following are deliberately out of scope (see ACT §72):

* HTTP client project
* TLS implementation
* Database framework
* Distributed system
* GPU qualification
* General C verifier
* General JS verifier
* OS formalization

The ACT's central proposition can be answered without these.
