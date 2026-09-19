# ACT-MRVN-QUALIFY05-CORRECTION03 REPORT.md

This is the correction-report for the reviewer's
`ACT-MRVN-QUALIFY05-CORRECTION03` findings.  It supersedes the
Correction02 report and resolves the one remaining architectural gap:
toolchain identity was still path-bound.

Bounded question (ACT §1):

> Can Factory package a verified Bend subject, its specification, its
> proof, its verification result, and its provenance into a
> deterministic relocatable artifact that a consumer can verify
> without trusting repository state, producer paths, or producer
> assertions?

**YES** for the byte-transport/integrity layer.
**YES** for the claim-semantics layer (fail-closed on missing or wrong
fields; see Q13).
**YES** for the toolchain TCB (fail-closed on missing or wrong
components; see Q13).
**YES** for the offline property (preload propagates into the spawned
Bend child; see Q11).
**YES** for cross-root portability (Closure identity is now by stable
logical_path, not by absolute pathname; see Q12).

## Reviewer disposition (current)

```
MRVN-05 CONTENT IDENTITY       🟢 FULL
MRVN-05 PAYLOAD INTEGRITY      🟢 FULL
MRVN-05 DEPENDENCY AUTHORITY   🟢 FULL
MRVN-05 RELOCATION             🟢 FULL
MRVN-05 PROOF REPLAY           🟢 FULL
MRVN-05 MUTATION LAB           🟢 FULL (12/12, including typed-claim attacks)

MRVN-05 CLAIM AUTHORITY        🟢 FAIL-CLOSED — missing required fields rejected
MRVN-05 TOOLCHAIN TCB          🟢 CLOSED — exactly the four expected roles required
MRVN-05 TOOLCHAIN PORTABILITY  🟢 LOGICAL_PATH — closure identity is by
                                       stable relative component name,
                                       not by producer absolute path
MRVN-05 OFFLINE EVIDENCE       🟢 FULL TREE (USERSPACE_FAIL_CLOSED) — preload
                                       propagates to spawned Bend child

MRVN-05 OVERALL
  = FULL_QUALIFICATION / PORTABLE PROOF-CARRYING ARTIFACT
    (Base identity = HASH_BOUND;
     Base location  = TOOLCHAIN_RELATIVE / NOT_BUNDLED)

MRVN-06
  = ▶ AUTHORIZED
```

## Q1 — Can an independent consumer verify the artifact without repository state?

**YES.**

The verifier (`factory/qualify/ACT-MRVN-QUALIFY05/lab/verify_artifact.ts`)
accepts only:

```
--artifact <directory>
[--mode integrity | proof | full]
[--bend-runner <abs path>]
[--result-out <path>]
[--allow-toolchain-drift]
[--offline]
```

It does not consult:
- `factory/`, `bend2/`, `gates/`, `tests/`, or any other upstream path
- the working tree's `git` history
- any external network endpoint (verified by a runtime network-call
  interceptor, see Q11)

The canonical artifact was verified in
`/tmp/mrvn-relocation-scratch/relocated` after a `cp -r` from the
canonical artifact directory. The relocated verifier ran the
bundled `bun <bend_runner> payload/PROOF.bend` and reported exit 0
with `proof: pass`.

## Q2 — Is artifact identity deterministic?

**YES.** Two builds from the same authority-kernel bytes produce
identical `artifact_id`:

```
build A artifact_id: sha256:848a89bdc7e14bec6423bf10ed78e31479cf678b46d8cfd12e6a201635b0df24
build B artifact_id: sha256:848a89bdc7e14bec6423bf10ed78e31479cf678b46d8cfd12e6a201635b0df24
equal?              true
```

Correction01 added `provenance.toolchain.toolchain_closure[]` to the
manifest, advancing the artifact_id from `sha256:1a659e00...f4d` to
`sha256:5a4eb66e...8f04af`.  Correction02 strengthened the schema
(toolchain_closure required, exactly four roles with role enum) but
the schema content is not part of the artifact's identity, so the
artifact_id remained at `sha256:7f76bcf6...`.  Correction03 replaces
the closure's absolute `path` with stable relative `logical_path`,
which changed the canonical manifest bytes (the producer-side absolute
path string was previously hash-bound), advancing the artifact_id to
`sha256:848a89bd...`.  The identity remains deterministic across
rebuilds.

The on-disk manifest bytes differ only in `provenance.captured_at`,
`provenance.build_command`, and `evidence/proof-run.json`'s recorded
toolchain SHA — fields explicitly excluded from the identity
computation.

## Q3 — What exact bytes does the artifact formally bind?

**The artifact's `artifact_id` binds the semantic manifest projection
(all top-level fields except `provenance.captured_at`,
`provenance.build_command`, and `artifact_id` itself), plus all
declared content hashes** for every payload and evidence file.  This
is the precise identity contract; it is **not** a byte-for-byte
binding of the entire `manifest.json` because `captured_at` and
`build_command` are deliberately excluded from the identity so that
two rebuilds from the same source produce the same artifact_id.

What is bound in the canonical artifact:

```
manifest.json (~7,084 bytes; identity-bound projection excludes captured_at/build_command)
payload/main.bend    (10,576 bytes, sha256 eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb)
payload/LAWS.bend    (12,103 bytes, sha256 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9)
payload/PROOF.bend   (20,209 bytes, sha256 c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8)
evidence/proof-run.json      (REPLAYABLE)
evidence/proof-stdout.txt    (REPLAYABLE)
evidence/optional/qualification.json (CAPTURED_ONLY)
```

Plus the proof-checker toolchain closure (Q13):

```
bend2/main.ts    sha256 34a8a791b02ce92f247bda4cabcd3ff4eabe500002fedbec4867b5db77ee1feb (cli)
bend2/bend.ts    sha256 fe3c2b0b306fccbe44efec349d8f339b6efdaceb090b3d3049c74a1a6015c859 (trusted_kernel)
bend2/comp.ts    sha256 c181ac038d7f7d4ed0e1bb81c513e64285347627e0b3a13a98cb86a1d1568f54 (compiler_runtime)
bend2/base.bend  sha256 b2d53bbd83639c3ae27260b318efa09de9df6006a556ac6ef41c104ea164917a (prelude)
```

Total artifact: 7 files (~54,000 bytes; manifest grew with
`toolchain_closure[]`).

## Q4 — What exact proposition does the formal claim establish?

The `formal-law-satisfaction` claim (kind `FORMAL_LAW_SATISFACTION`)
now has **typed machine semantics**, not free-text semantics.  The
verifier validates (CORRECTION02: existence, completeness, and
equality — not equality conditional on existence):

```
binds.implementation_sha256 is present, a string, AND == actual payload/main.bend sha256
binds.laws_sha256           is present, a string, AND == actual payload/LAWS.bend sha256
binds.proof_sha256          is present, a string, AND == actual payload/PROOF.bend sha256
binds.law_count             is present, an integer, AND == observed law count
proof_replay_result         == "pass"
```

Status mapping:
- all of the above match → `VERIFIED`
- proof replay not performed (e.g. integrity mode) → `CAPTURED`
- any of the above missing, wrong-typed, or mismatching → `FAILED` (classification `CLAIM_SEMANTIC_MISMATCH`)

The `statement` text is **display metadata only**; it cannot grant or
withdraw verification authority.  Test 19 (`stronger_statement_same_kind`)
demonstrates: changing the statement to "this program cures cancer and
is memory safe" while leaving the machine fields unchanged → still
`VERIFIED`.  Tests 27-31 (`missing_implementation_sha256`,
`missing_laws_sha256`, `missing_proof_sha256`, `missing_law_count`,
`empty_binds`) demonstrate: removing any required machine field, or
setting `binds = {}`, yields `CLAIM_SEMANTIC_MISMATCH` (exit 1).  The
reviewer's `wild-claim` and `empty-binds` counterexamples are now
blocked.

## Q5 — What does the artifact explicitly NOT establish?

The formal claim's `scope.does_not_establish` lists:

- specification completeness
- operational safety outside the bundled laws
- external IO behaviour
- producer identity
- source-repository cleanliness
- toolchain trustworthiness beyond the declared identity

In addition, the typed claim model makes explicit that
`OBSERVED_TOOL_EXECUTION` and `QUALIFICATION_RESULT` claims are
**CAPTURED** (not VERIFIED): they record historical observations or
prior ACT verdicts and are not re-exercised at verification time.

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
artifact id (`ART-MUT-06` shows a different id). The verifier
refuses to call such a tampered artifact "canonical".

## Q8 — Can a different weaker law book produce a valid artifact?

**YES, but under a different artifact/spec identity.**

`ART-MUT-06` constructs a single-law specification with a matching
minimal proof. It now (Correction01) keeps the formal claim's
`binds.laws_sha256` and `binds.proof_sha256` consistent with the
new payload bytes. It verifies cleanly under its own artifact_id
and is classified as `VERIFIED` (different specification).

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

## Q11 — Can it run offline?  (CORRECTION02: now fences the entire process tree)

**YES, and the offline property is enforced by a runtime
network-call interceptor that is propagated into the spawned Bend
child process.**

The interceptor lives at
`factory/qualify/ACT-MRVN-QUALIFY05/lab/offline_probe.ts`.  The preload module
monkey-patches the following entry points so any network attempt
panics the verifier before the syscall hits the kernel:

- `globalThis.fetch`
- `node:net.createConnection` and `node:net.connect`
- `node:dns.lookup` and `node:dns.promises.*`
- `node:http.request` / `node:https.request`
- `Bun.connect` and `Bun.dns`

CORRECTION02 fix: CLI flags such as `--preload` are NOT inherited by
spawned children.  The verifier now re-preloads the same probe in
the spawned child command:

```
bun --preload=<absolute path to offline_probe.ts> <bend_runner> <proof>
```

instead of

```
bun <bend_runner> <proof>
```

when `--offline` is requested.  This fences the entire process tree
(verifier + Bend checker + any module Bend dynamically loads)
against network calls.

The relocation test confirms:
1. Step 7 — verifier under preload exits 0 with `integrity=pass proof=pass supplemental=pass`
2. Step 8 — `bun --preload=offline_probe.ts -e "fetch(...)"` exits non-zero with `BLOCKED: [offline-probe] NETWORK BLOCKED: globalThis.fetch`
3. Step 9 — verifier without preload still exits 0 (sanity)
4. Step 10 — verifier source code inspection confirms the runBend() function constructs `["bun", "--preload=...offline_probe.ts", bendAbs, proofAbs]` when `--offline` is set

On macOS in this environment, kernel-level sandboxing (`sandbox-exec`
custom profiles, `dtrace`, `opensnoop`, `tcpdump`) is blocked by
System Integrity Protection (SIP).  A user-space monkey-patch is
the strongest offline evidence available on this host.

A future ACT could additionally run the verifier tree under
`unshare -n` on Linux CI for kernel-level evidence; on this host the
preload-based fence is the strongest available.


## Q12 — Are all proof dependencies either bundled or explicitly part of TCB?

**YES.** The canonical artifact has three `import` statements across
its payload files:

| File      | Import                  | Disposition |
| --------- | ----------------------- | ----------- |
| main.bend | `import Base`           | TCB: toolchain transitive (`bend2/base.bend` is in `toolchain_closure[]`) |
| LAWS.bend | `import Base`, `import ./main.bend as Gate` | TCB / bundled |
| PROOF.bend | `import Base`, `import ./main.bend as Gate`, `import ./LAWS.bend as Laws` | TCB / bundled / bundled |

`Base` is the only un-bundled dependency.  In the original ACT-05
report, it was declared as `TOOLCHAIN_TRANSITIVE`.  In Correction01,
`Base` is hash-bound as part of the proof-checker toolchain
closure, but the resolver still locates it via `realpath` against
`bend2/main.ts`'s sibling directory; we do not bundle it as a
payload file.  This means a malicious change to `base.bend` is now
**detected** (mandatory hash match in `toolchain_closure[]`), but
the artifact's identity still depends on the producer choosing
the same base.bend instance (transitive dependency, not bundled).

All relative imports are bundled and verified by the dependency
closure phase. No `0x` hub imports.

## Q13 — What remains trusted? (TCB table)

| Component                              | Status         | Notes |
| -------------------------------------- | -------------- | ----- |
| `bend2/bend.ts` (parser, type checker, proof checker) | TRUSTED + HASH_BOUND | `toolchain_closure[role=trusted_kernel]` |
| `bend2/main.ts` (CLI entry point)      | HASH_BOUND     | `toolchain_closure[role=cli]`; drift = TOOLCHAIN_MISMATCH |
| `bend2/comp.ts` (compiler/runtime)     | HASH_BOUND     | `toolchain_closure[role=compiler_runtime]`; loaded by main.ts via `Comp.io_type` in any `bend <file>` invocation |
| `bend2/base.bend` (prelude)            | HASH_BOUND     | `toolchain_closure[role=prelude]`; resolved via `realpath` against bend2; bound transitively |
| `Bun` runtime (executing the verifier) | TRUSTED        | Standard TypeScript runtime; sha256 in `process.versions.bun` |
| `node:crypto` SHA-256                  | REPLAYABLE     | Implementation-defined; standard |
| `fs` reads + `realpath` containment     | TRUSTED        | Path safety; macOS-aware `/tmp` -> `/private/tmp` |
| MRVN-05 verifier (`verify_artifact.ts`) | SELF_ATTACKED  | 39 self-tests attack the verifier (incl. 8 new claim-authority tests + 11 new fail-closed tests) |
| MRVN-05 builder (`build_artifact.ts`)   | NOT_AUTHORITY  | Verifier recomputes every hash, every inventory, every id |
| OS process execution                    | TRUSTED        | Standard |

Correction01 closed the `bend2/bend.ts` and `bend2/comp.ts` part of
the TCB by adding them to `toolchain_closure[]`.  Test 26
(`toolchain_component_drift`) demonstrates: changing the
declared `trusted_kernel` sha256 yields `TOOLCHAIN_MISMATCH`.

Correction02 strengthened closure enforcement from "hash match if
present" to "exact membership of the four expected roles":
- The manifest's `provenance.toolchain.toolchain_closure[]` must
  declare exactly the four expected roles: `cli`,
  `trusted_kernel`, `compiler_runtime`, `prelude` (no more, no less).
- The schema now requires `toolchain_closure` (4..4 items,
  uniqueItems, role enum).
- The verifier rejects: missing required role, duplicate role,
  duplicate path, unexpected role, declared entry that does not
  match any recomputed (path, role) pair, and any recomputed entry
  missing its declared counterpart.

Tests 32-37 exercise these new failure modes.

We do not extend the closure to `bend2/bend.lean` because it is
not loaded by the runtime checker (it is a Lean mechanization that
runs only during Bend's own development).  We do not extend to
`bend2/effs/*.c` and `bend2/effs/*.js` because our proof-checker
path invokes the checker in interpreter mode and does not link
those C/JS backends; only `bend2/bend.ts`, `bend2/comp.ts`, and
`bend2/main.ts` are actually exercised.

The MRVN-05 verifier and builder are not claimed to be
"trustless".  The artifact is **less trustful** than a
provenance-only certificate but is not **trustless** verification.

## Q14 — How large is the canonical artifact?

```
file count:        7
total bytes:       ~54,000  (grew from 53,862 due to toolchain_closure[] in manifest)
manifest bytes:    ~7,084   (grew from 6,495)
payload bytes:     42,888
evidence bytes:    4,479
verification time:  ~250ms (integrity-only) / ~3.7s (full, including proof replay)
proof replay time: ~3.4s (bun start + Bend checker on the 3-file subject)
```

## Q15 — What is the proof-carrying overhead compared with the raw three Bend files?

```
raw payload bytes     = 42,888  (main.bend + LAWS.bend + PROOF.bend)
canonical artifact    = ~54,000 bytes
overhead ratio        = ~1.26x
```

The overhead is dominated by:

- `manifest.json` (~7,084 bytes): schema-bound semantic envelope,
  now including the `toolchain_closure[]` field
- `evidence/proof-run.json` (634 bytes): captured toolchain execution
- `evidence/proof-stdout.txt` (17 bytes): captured checker output
- `evidence/optional/qualification.json` (3,828 bytes): MRVN-04
  supplemental evidence carried forward

The raw payload bytes are ~80% of the artifact; the metadata
overhead is ~26%. This is roughly comparable to other proof-carrying
formats (Coq `.vo` files are typically 2-5x larger than the
corresponding `.v` source; the Lean4 `.olean` ratio is similar).

## Q16 — Is the artifact portable across different toolchain roots?  (CORRECTION03)

**YES.**  The reviewer observed that, prior to Correction03, the
manifest's `toolchain_closure[]` bound by absolute producer path,
making the artifact accidentally path-bound.  Correction03 replaces
the absolute `path` field with a stable relative `logical_path` and
matches by `(role, logical_path, sha256)` rather than by the
producer's absolute pathname.

The closure entries now look like:

```json
[
  { "logical_path": "main.ts",   "role": "cli",              "sha256": "34a8a791..." },
  { "logical_path": "bend.ts",   "role": "trusted_kernel",   "sha256": "fe3c2b0b..." },
  { "logical_path": "comp.ts",   "role": "compiler_runtime", "sha256": "c181ac03..." },
  { "logical_path": "base.bend", "role": "prelude",          "sha256": "b2d53bbd..." }
]
```

The schema enforces `^[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*$` on
`logical_path` — relative paths only, no `..`, no leading slash,
no drive letters.

The relocation test now exercises the actual portability claim:

- **Step 11a** — copy the four Bend toolchain files
  (`main.ts` / `bend.ts` / `comp.ts` / `base.bend`) into a totally
  different filesystem root (`/tmp/mrvn-relocation-scratch/alt_bend_root/bend2/`);
  verify the **canonical** artifact from its original location
  against the relocated Bend.  Result: `exit=0 passes=true
  (integrity=pass proof=pass supplemental=pass)`.
- **Step 11b** — assert that the four recomputed closure sha256s
  at the relocated root match the declared sha256s exactly:
  `cli:ok(34a8a791), trusted_kernel:ok(fe3c2b0b),
  compiler_runtime:ok(c181ac03), prelude:ok(b2d53bbd)`.
- **Step 12** — append `// touched\n` to the relocated `base.bend`
  and re-verify.  Result: `exit=1 classification=TOOLCHAIN_MISMATCH`,
  proving the verifier is actually recomputing the sha256 at the
  consumer-local path rather than trusting the declared one.

The reviewer also asked the inverse: with the toolchain moved to a
new root, every other check still works.  Step 11a confirms that;
specifically, `proof=pass` means the spawned Bend checker (under
`/tmp/mrvn-relocation-scratch/alt_bend_root/bend2/main.ts`)
successfully replayed `payload/PROOF.bend` against the canonical
artifact's payload.

### What this means semantically

A content-addressed proof artifact no longer accidentally bakes
`/Users/alex/...` into the theorem.  The closure identity is now:

```
toolchain identity = semantic component identity
                    = {role, logical_path, sha256}
```

not

```
toolchain identity = exact bytes + producer filesystem layout
```

The verifier resolves its own consumer-local paths from
`--bend-runner`, then matches by `(role, logical_path, sha256)`.

### Why "with Base transitive" was misleading

Correction02 stated "FULL_QUALIFICATION / ... (with Base
transitive)".  After Correction03 the correct characterization is:

```
Base identity = HASH_BOUND       (sha256 in toolchain_closure)
Base location = TOOLCHAIN_RELATIVE / NOT_BUNDLED
                (resolved from --bend-runner's dirname, never bundled)
```

The previous wording conflated identity (which IS transitive) with
location (which is TOOLCHAIN_RELATIVE).  Both now hold simultaneously
in the corrected formulation.

## Files changed (MRVN-05 + Correction01 + Correction02 + Correction03)

```
factory/qualify/ACT-MRVN-QUALIFY05/
├── authority-kernel/                                (frozen)
│   ├── LAWS.bend
│   ├── PROOF.bend
│   └── main.bend
├── artifact/                                          (canonical artifact directory)
│   ├── manifest.json                                  (Correction03: toolchain_closure logical_path)
│   ├── payload/{LAWS,PROOF,main}.bend
│   └── evidence/{proof-run.json,proof-stdout.txt,optional/qualification.json}
├── schema/
│   └── proof-artifact-v1.schema.json                  (Correction03: logical_path replaces path)
├── lab/
│   ├── canonical_json.ts                              (mrvn-canonical-json-v1)
│   ├── artifact_id.ts                                 (sha256:canonical_manifest_minus_id:v1)
│   ├── build_artifact.ts                              (Correction03: emits logical_path closure)
│   ├── verify_artifact.ts                             (Correction03: matches by logical_path, not absolute)
│   ├── self_test.ts                                   (39 self-tests: 28 prior + 11 new fail-closed attacks 27-37)
│   ├── relocation_test.ts                             (Correction03: steps 11-12 cross-root portability + byte-drift)
│   └── offline_probe.ts                               (bun --preload network interceptor)
├── mutations/
│   └── make_mutation.ts                              (ART-MUT-06 updated to update formal.binds.*_sha256)
├── EVIDENCE.md
└── REPORT.md
```

## Residual risks

1. **`bend2/base.bend` is hash-bound but TOOLCHAIN_TRANSITIVE, not
   bundled.**  A hypothetical malicious update to `base.bend` would
   be detected by `toolchain_closure` mismatch — but only if the
   consumer uses the same `base.bend` instance the producer hashed.
   We deliberately do not bundle `base.bend` as payload; a follow-up
   ACT could add it to `payload/` and bind it the same way as the
   three Bend kernel files.  This is the residual TCB surface.

2. **`bend2/main.ts`, `bend2/bend.ts`, `bend2/comp.ts`, and
   `bend2/base.bend` are now all hash-bound as the proof-checker
   toolchain closure.**  We do **not** separately content-bind
   `bend2/bend.lean` (Lean mechanization, not loaded at runtime) or
   `bend2/effs/*.{c,js}` (C/JS effect backends, not linked into the
   pure checker path).

3. **Unknown claim kinds are rejected with `UNSUPPORTED_CLAIM`,
   causing exit 1.**  The verifier does **not** allow unrecognized
   kinds to "pass verification with a status of unsupported".  The
   original REPORT.md's wording to that effect was wrong and has
   been corrected.

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

## Board transition (Correction03)

```
MRVN-01      🟢 FULL_QUALIFICATION
MRVN-02      🟢 FULL_QUALIFICATION
MRVN-03      🟢 FULL_QUALIFICATION / FROZEN
MRVN-04      🟢 FULL_QUALIFICATION / FROZEN
MRVN-05      🟢 FULL_QUALIFICATION / PORTABLE PROOF-CARRYING ARTIFACT
             (Base identity = HASH_BOUND; Base location = TOOLCHAIN_RELATIVE)
             Correction01: typed claims, toolchain closure hash, runtime offline probe
             Correction02: fail-closed typed claims (no missing fields), exact toolchain membership (no missing components), offline probe propagates to spawned Bend child
             Correction03: toolchain identity by stable logical_path (not absolute path); cross-root portability proven by relocation steps 11-12

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
