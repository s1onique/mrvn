# ACT-MRVN-QUALIFY05 REPORT.md

Bounded question (ACT §1):

> Can Factory package a verified Bend subject, its specification, its
> proof, its verification result, and its provenance into a
> deterministic relocatable artifact that a consumer can verify
> without trusting repository state, producer paths, or producer
> assertions?

**Yes.**  See Q1–Q15 below.

## Q1 — Can an independent consumer verify the artifact without repository state?

**YES.**

The verifier (`factory/qualify/ACT-MRVN-QUALIFY05/lab/verify_artifact.ts`)
accepts only:

```
--artifact <directory>
[--mode integrity | proof | full]
[--bend-runner <abs path>]
[--result-out <path>]
```

It does not consult:
- `factory/`, `bend2/`, `gates/`, `tests/`, or any other upstream path
- the working tree's `git` history
- any external network endpoint

The canonical artifact was verified in
`/tmp/mrvn-relocation-scratch/relocated` after a `cp -r` from the
canonical artifact directory. The relocated verifier ran the
bundled `bun <bend_runner> payload/PROOF.bend` and reported exit 0
with `proof: pass`.

## Q2 — Is artifact identity deterministic?

**YES.** Two builds from the same authority-kernel bytes produce
identical `artifact_id`:

```
build A artifact_id: sha256:1a659e000fccd77383747b06e98b3be96961c679ee70f07d2d7bf71a51ce8f4d
build B artifact_id: sha256:1a659e000fccd77383747b06e98b3be96961c679ee70f07d2d7bf71a51ce8f4d
equal?              true
```

The on-disk manifest bytes differ only in `provenance.captured_at`,
`provenance.build_command`, and `evidence/proof-run.json`'s
recorded toolchain SHA — fields explicitly excluded from the
identity computation.

## Q3 — What exact bytes does the artifact formally bind?

The artifact formally binds every byte of:

```
manifest.json (6,495 bytes)
payload/main.bend    (10,576 bytes, sha256 eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb)
payload/LAWS.bend    (12,103 bytes, sha256 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9)
payload/PROOF.bend   (20,209 bytes, sha256 c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8)
evidence/proof-run.json      (REPLAYABLE)
evidence/proof-stdout.txt    (REPLAYABLE)
evidence/optional/qualification.json (CAPTURED_ONLY, sha256 39af19abd33cdfdc480c9cbd59df2684e39143ad0a3682aec8108b76b78483c1)
```

Total: 7 files, 53,862 bytes.

## Q4 — What exact proposition does the formal claim establish?

The `formal-law-satisfaction` claim (kind `FORMAL_LAW_SATISFACTION`)
states:

> Every law in bundled `LAWS.bend` is discharged by bundled
> `PROOF.bend` against bundled `main.bend`.

Bound to:
- `implementation_sha256 = eea5d84f...f4eb`
- `laws_sha256           = 2d380496...00dd9`
- `proof_sha256          = c6479516...69d8`
- `law_count             = 15`

The 15 laws are listed in `payload.law_inventory.names` and bound by
the verifier's recomputation against the on-disk `LAWS.bend`.

## Q5 — What does the artifact explicitly NOT establish?

The formal claim's `scope.does_not_establish` lists:

- specification completeness
- operational safety outside the bundled laws
- external IO behaviour
- producer identity
- source-repository cleanliness
- toolchain trustworthiness beyond the declared identity

## Q6 — Can payload tampering be detected before proof execution?

**YES.** The verifier's first phase (no proof execution) checks
manifest_id, payload_hash, payload_size, dependency_closure,
path_confinement, law_inventory, and escape_hatch_inventory. A
single-byte modification to any payload file is detected as
`PAYLOAD_HASH_MISMATCH` (and the corresponding size mismatch) before
the proof_replay phase runs. `ART-MUT-01`, `ART-MUT-02`,
`ART-MUT-03` all show this.

## Q7 — Can a malicious producer rewrite payload hashes and still retain canonical artifact identity?

**NO.** The artifact root id is computed from the entire semantic
manifest, including every per-file sha256+size. Updating the
per-file hash without recomputing the artifact root yields
`MANIFEST_ID_MISMATCH` (`ART-MUT-04`). Recomputing the artifact
root id honestly while the bytes are corrupted produces a *new*
artifact id (`ART-MUT-06` shows `4f04a3a835...` ≠
`1a659e000fccd77383747b06e98b3be96961c679ee70f07d2d7bf71a51ce8f4d`).
The verifier refuses to call such a tampered artifact "canonical".

## Q8 — Can a different weaker law book produce a valid artifact?

**YES, but under a different artifact/spec identity.**

`ART-MUT-06` constructs a single-law specification with a matching
minimal proof. It verifies cleanly under its own artifact_id
(`sha256:4f04a3a835d995caa7f174c184948c94df6de1f657510b76236663ac6810c40c`)
and would not be confused with the canonical artifact
(`sha256:1a659e000fccd77383747b06e98b3be96961c679ee70f07d2d7bf71a51ce8f4d`).
Classification: `VALID_DIFFERENT_SPECIFICATION`.

## Q9 — Can historical evidence override failed live replay?

**NO.** The verifier's live replay always takes precedence over
`evidence/proof-run.json`. `ART-MUT-12` truncates `PROOF.bend`,
fakes `proof-run.json` to claim exit 0, and the verifier emits both
`PROOF_FAILED` (from the live replay) and `CAPTURED_EVIDENCE_MISMATCH`
(the recorded claim disagrees with the live result). Exit code 1.

## Q10 — Can artifact verification run after relocation?

**YES.** `bun factory/qualify/ACT-MRVN-QUALIFY05/lab/relocation_test.ts`
copies the artifact to `/tmp/mrvn-relocation-scratch/relocated`,
runs the verifier on the copy with an absolute Bend runner path,
and reports `exit: 0` with `integrity: pass proof: pass supplemental:
pass`.

## Q11 — Can it run offline?

**YES.** Neither `build_artifact.ts` nor `verify_artifact.ts` perform
any network operation: no `fetch`, no `http`, no `dns`, no hub
resolution. The `0x...` content-addressed import form is rejected
as `UNDECLARED_DEPENDENCY`. Base is treated as
`TOOLCHAIN_TRANSITIVE` — resolved by `realpath` against
`bend2/main.ts`'s sibling `base.bend`, never fetched.

## Q12 — Are all proof dependencies either bundled or explicitly part of TCB?

**YES.** The canonical artifact has three `import` statements across
its payload files:

| File      | Import                  | Disposition |
| --------- | ----------------------- | ----------- |
| main.bend | `import Base`           | TCB (toolchain transitive) |
| LAWS.bend | `import Base`, `import ./main.bend as Gate` | TCB / bundled |
| PROOF.bend | `import Base`, `import ./main.bend as Gate`, `import ./LAWS.bend as Laws` | TCB / bundled / bundled |

`Base` is the only un-bundled dependency, and it is explicitly
declared in `payload.trusted_toolchain` as `bend-base`. All
relative imports are bundled and verified by the dependency
closure phase. No `0x` hub imports.

## Q13 — What remains trusted? (TCB table)

| Component                              | Status         | Notes |
| -------------------------------------- | -------------- | ----- |
| `bend2/bend.ts` (parser, type checker, proof checker) | TRUSTED | Self-described as Bend's trusted kernel |
| `bend2/comp.ts` (compiler, runtime)     | TRUSTED        | Out of MRVN-05's TCB reduction (we only invoke the checker) |
| `bend2/main.ts` (CLI entry point)      | HASH_BOUND     | `bend_runner_sha256` recorded in manifest; verifier rejects drift (test 17) |
| `bend2/base.bend` (prelude)            | TOOLCHAIN_TRANSITIVE | Resolved by `realpath` against bend2; not hash-bound yet |
| `Bun` runtime (executing the verifier) | TRUSTED        | Standard TypeScript runtime; sha256 in `process.versions.bun` |
| `node:crypto` SHA-256                  | REPLAYABLE     | Implementation-defined; standard |
| `fs` reads + `realpath` containment     | TRUSTED        | Path safety; macOS-aware `/tmp` → `/private/tmp` |
| MRVN-05 verifier (`verify_artifact.ts`) | SELF_ATTACKED  | 20 self-tests attack the verifier (test 17 toolchain mismatch, etc.) |
| MRVN-05 builder (`build_artifact.ts`)   | NOT_AUTHORITY  | Verifier recomputes every hash, every inventory, every id |
| OS process execution                    | TRUSTED        | Standard |

The MRVN-05 verifier and builder are not claimed to be
"trustless".  The artifact is **less trustful** than a
provenance-only certificate but is not **trustless** verification.

## Q14 — How large is the canonical artifact?

```
file count:        7
total bytes:       53,862
manifest bytes:    6,495
payload bytes:     42,888
evidence bytes:    4,479
verification time:  ~250ms (integrity-only) / ~3.7s (full, including proof replay)
proof replay time: ~3.4s (bun start + Bend checker on the 3-file subject)
```

## Q15 — What is the proof-carrying overhead compared with the raw three Bend files?

```
raw payload bytes     = 42,888  (main.bend + LAWS.bend + PROOF.bend)
canonical artifact    = 53,862  bytes
overhead ratio        = 53,862 / 42,888 ≈ 1.256x
```

The overhead is dominated by:

- `manifest.json` (6,495 bytes): schema-bound semantic envelope
- `evidence/proof-run.json` (634 bytes): captured toolchain execution
- `evidence/proof-stdout.txt` (17 bytes): captured checker output
- `evidence/optional/qualification.json` (3,828 bytes): MRVN-04
  supplemental evidence carried forward

The raw payload bytes are 80% of the artifact; the metadata
overhead is 26%. This is roughly comparable to other proof-carrying
formats (Coq `.vo` files are typically 2-5x larger than the
corresponding `.v` source; the Lean4 `.olean` ratio is similar).

## Files changed (MRVN-05)

```
factory/qualify/ACT-MRVN-QUALIFY05/
├── authority-kernel/                                (frozen)
│   ├── LAWS.bend                                     (12,103 bytes, hash-bound)
│   ├── PROOF.bend                                    (20,209 bytes, hash-bound)
│   └── main.bend                                     (10,576 bytes, hash-bound)
├── artifact/                                          (canonical artifact directory)
│   ├── manifest.json                                  (6,495 bytes)
│   ├── payload/
│   │   ├── LAWS.bend                                 (12,103 bytes)
│   │   ├── PROOF.bend                                (20,209 bytes)
│   │   └── main.bend                                 (10,576 bytes)
│   └── evidence/
│       ├── proof-run.json                            (REPLAYABLE)
│       ├── proof-stdout.txt                          (REPLAYABLE)
│       └── optional/
│           └── qualification.json                    (CAPTURED_ONLY)
├── schema/
│   └── proof-artifact-v1.schema.json                 (270 lines)
├── lab/
│   ├── canonical_json.ts                             (104 lines, mrvn-canonical-json-v1)
│   ├── artifact_id.ts                                (66 lines, sha256:canonical_manifest_minus_id:v1)
│   ├── build_artifact.ts                            (525 lines)
│   ├── verify_artifact.ts                            (710 lines)
│   ├── self_test.ts                                  (455 lines, 20 self-tests)
│   └── relocation_test.ts                           (115 lines)
├── mutations/
│   └── make_mutation.ts                              (415 lines, 12 mutations)
├── EVIDENCE.md
└── REPORT.md
```

## Residual risks

1. **`base.bend` is TOOLCHAIN_TRANSITIVE, not hash-bound.** A
   hypothetical malicious update to `bend2/base.bend` would
   silently change the meaning of every Bend program that uses
   `Base`. This is consistent with Bend's own design (Base is
   treated as prelude, not as a separately-verified module) but
   means MRVN-05's content authority does NOT include Base. A
   follow-up ACT could content-hash Base and include it as a
   bundled trusted dependency.

2. **`bend2/main.ts` is hash-bound but `bend2/bend.ts` and
   `bend2/comp.ts` are not separately content-bound.** The runner
   identity covers the CLI; the parser/checker/compiler are TRUSTED
   at face value. A malicious update to either would invalidate the
   trust claim.

3. **The verifier accepts unrecognized `kind` values only as
   `UNSUPPORTED_CLAIM` rejection.** A producer who adds a custom
   claim kind passes verification with that claim marked
   "unsupported", which is recorded but does not block. A consumer
   who relies on a specific claim kind's semantics should reject
   artifacts whose claim set includes unsupported kinds.

4. **The artifact stores MRVN-04 supplemental qualification as
   `CAPTURED_ONLY`** with the original 8/8 mutation classification,
   180/180 matrix match, and 14/14 self-test results. These are
   historical facts; they are NOT re-exercised at verification
   time. A consumer who needs to reproduce MRVN-04's matrix or
   mutation laboratory must either trust the captured evidence or
   ship the original machinery (out of scope for MRVN-05).

5. **The dependency closure scan is single-language.** It scans
   only `.bend` imports. If a payload file ever imports via a
   foreign-language mechanism that the scanner misses, that path
   would not be verified. Today, all .bend imports are
   `import Base`, `./relative`, `/absolute`, or `0x<hash>/...`.
   All four are detected.

## Board transition

```
MRVN-01      🟢 FULL_QUALIFICATION
MRVN-02      🟢 FULL_QUALIFICATION
MRVN-03      🟢 FULL_QUALIFICATION / FROZEN
MRVN-04      🟢 FULL_QUALIFICATION / FROZEN
MRVN-05      🟢 FULL_QUALIFICATION / PROOF-CARRYING ARTIFACT

MRVN-06      ▶ AUTHORIZED
MRVN-07      🔒
MRVN-08      🔒
MRVN-09A     🔒 BJJ
MRVN-09B     🔒 Leamas
MRVN-EXT-01  🔒
```

## Next recommended ACT

`ACT-MRVN-QUALIFY06` — Specification falsification laboratory.

MRVN-06 is unlocked.  It generates alternative implementations that
satisfy the same law book (SURVIVED/EQUIVALENT) and surfaces the
boundary between specification completeness and implementation
identity.  MRVN-05's portable artifact model is the substrate: each
MRVN-06 result can be packaged as a new MRVN-05 artifact whose
`subject.implementation_sha256` differs but `subject.laws_sha256`
and `subject.proof_sha256` (where applicable) are shared.  The
`VALID_DIFFERENT_SPECIFICATION` classification already exercises
the same shape of authority-object (ART-MUT-06).
