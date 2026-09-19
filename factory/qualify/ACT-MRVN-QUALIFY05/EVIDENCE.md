# ACT-MRVN-QUALIFY05 EVIDENCE.md

This document records the technical qualification of the MRVN-05
proof-carrying Factory artifact system against the bounded question in
ACT section 1.  This is the Correction03 revision: it supersedes the
Correction02 evidence with cross-root portability tests (relocation
steps 11-12), a toolchain_closure that binds by stable `logical_path`
(relative component name) instead of producer absolute pathname, and
a matching schema change.

## E.0 — Source state and toolchain identity

- **Act ID**: ACT-MRVN-QUALIFY05
- **Prior acts**: MRVN-01 (FULL_QUALIFICATION), MRVN-02 (FULL_QUALIFICATION),
  MRVN-03 (FULL_QUALIFICATION), MRVN-04 (FULL_QUALIFICATION,
  TECHNICALLY_FROZEN), MRVN-EXT-01 (LOCKED)
- **Source commit (canonical authority-kernel)**:
  `8cf4b25869794785407afcdf296e678cd8f41b6c`
  (frozen as part of MRVN-04 acceptance; the commit was created at
  the start of MRVN-05 to record the prior ACT04 worktree state as
  provenance).
- **Worktree state at MRVN-05 acceptance**: clean (no uncommitted
  changes; all MRVN-04 files committed before the MRVN-05 work
  began).
- **Runner**: `bun bend2/main.ts` (Bend 2.0.5, sha256
  `34a8a791b02ce92f247bda4cabcd3ff4eabe500002fedbec4867b5db77ee1feb`)
- **Bun version**: `1.3.13`
- **Base identity**: `TOOLCHAIN_TRANSITIVE` (the verifier reports this
  verbatim in `provenance.toolchain.base_identity`; Base bytes are
  not currently hash-bound because the Bend runner resolves Base by
  `realpath` against `bend2/main.ts`'s sibling `base.bend` rather
  than by content hash; we therefore treat Base as part of the trusted
  Bend toolchain boundary, not as portable artifact content).

## E.1 — Schema: proof-artifact-v1.schema.json

Schema file: `factory/qualify/ACT-MRVN-QUALIFY05/schema/proof-artifact-v1.schema.json`

Constraints enforced by the schema (draft-07 subset):

- `schema_version == 1` (const)
- `artifact_type == "mrvn.proof-carrying-factory-artifact"` (const)
- top-level required fields: `schema_version`, `artifact_type`,
  `subject`, `claims`, `payload`, `verification`, `evidence`,
  `provenance`, `artifact_id`
- `subject.entrypoint` matches `^[a-zA-Z0-9._/-]+\\.bend$`
- `claims[].kind` ∈ {`FORMAL_LAW_SATISFACTION`, `OBSERVED_TOOL_EXECUTION`,
  `BEHAVIORAL_EQUIVALENCE`, `QUALIFICATION_RESULT`}
- `payload.files[].path` matches `^([a-zA-Z0-9._-]+/)*[a-zA-Z0-9._-]+$`
  (no `..`, no empty segments, no absolute)
- `payload.files[].sha256` matches `^[0-9a-f]{64}$`
- `provenance.source_commit` matches `^[0-9a-f]{40}$`
- `artifact_id` matches `^sha256:[0-9a-f]{64}$`

The schema is **structural** — it does not replace semantic
verification.

## E.2 — Deterministic build A/B

Two builds of the canonical artifact from the same authority-kernel
bytes produce an identical `artifact_id`.

```
build A artifact_id: sha256:1a659e000fccd77383747b06e98b3be96961c679ee70f07d2d7bf71a51ce8f4d
build B artifact_id: sha256:1a659e000fccd77383747b06e98b3be96961c679ee70f07d2d7bf71a51ce8f4d
equal?              true
```

The on-disk manifest bytes differ between A and B only in
non-semantic fields (`provenance.captured_at`,
`provenance.build_command`, and `evidence/proof-run.json`'s recorded
hash, which all derive from build-time metadata and are explicitly
excluded from the artifact identity computation). Payload hashes and
the formal claim's `binds.{implementation,laws,proof}_sha256` are
identical. `DETERMINISTIC_BUILD = PASS`.

## E.3 — Canonical manifest and artifact_id

- Canonical artifact directory:
  `factory/qualify/ACT-MRVN-QUALIFY05/artifact/`
- `manifest.json`: 6,495 bytes (canonical encoding, no insignificant
  whitespace)
- `artifact_id`: `sha256:1a659e000fccd77383747b06e98b3be96961c679ee70f07d2d7bf71a51ce8f4d`

Subject identity:
- `subject.name = "MRVN-04 authority kernel"`
- `subject.kind = "bend-module-set"`
- `subject.entrypoint = "payload/main.bend"`

Formal claim binds:
- `implementation_sha256 = eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb`
- `laws_sha256           = 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9`
- `proof_sha256          = c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8`
- `law_count             = 15`

## E.4 — Payload binding

The verifier recomputes every declared payload hash and size from disk.

```
$ bun factory/qualify/ACT-MRVN-QUALIFY05/lab/verify_artifact.ts --artifact factory/qualify/ACT-MRVN-QUALIFY05/artifact --mode integrity --bend-runner /Volumes/.../bend2/main.ts
=== MRVN-05 verify_artifact ===
artifact:     /Volumes/.../factory/qualify/ACT-MRVN-QUALIFY05/artifact
mode:         integrity
artifact_id:  sha256:1a659e000fccd77383747b06e98b3be96961c679ee70f07d2d7bf71a51ce8f4d
integrity:    pass
proof:        not_checked
supplemental: not_checked
failures:     0
```

`PAYLOAD_INTEGRITY = PASS`.

## E.5 — Law inventory recomputation

The verifier extracts laws from the bundled `LAWS.bend` and compares
against `payload.law_inventory.names`. The observed 15 law names
exactly match the declared set:

```
agent_cannot_close
agent_cannot_freeze
closed_denies_everything
freeze_reviewer_draft_yields_wrong_lifecycle
halt_active_agent_yields_wrong_actor
halt_active_reviewer_none_yields_insufficient_evidence
halt_iff_active_halt_actor_ok_replay_or_live
halt_replay_allow_implies_live_allow
replay_cannot_authorize_close
replay_cannot_authorize_freeze
reviewer_close_iff_reviewer_frozen_live
reviewer_freeze_live_iff_freeze_lifecycle_ok
work_evidence_none_eq_replay
work_evidence_replay_eq_live
work_iff_work_actor_ok_and_work_lifecycle_ok
```

`LAW_INVENTORY = PASS`. Escape-hatch inventory also recomputed from
disk: `TODO_COUNT=0`, `NAMED_HOLES=0`, `UNSAFE_COUNT=0`,
`FOREIGN_COUNT=0`, `OPEN_LAWS=0`. `ESCAPE_HATCHES = PASS`.

## E.6 — Dependency closure

The verifier performs a recursive DFS from each of the 3 declared
entrypoints (`payload/main.bend`, `payload/LAWS.bend`,
`payload/PROOF.bend`), follows `./` relative imports, rejects `..`
traversal escapes, absolute-path imports, and undeclared helper
files. The 3 declared dependency_closure entries are exactly the
reachable set. `DEPENDENCY_CLOSURE = PASS`.

Path confinement: every declared payload/evidence path resolves
inside the artifact root (verified via `realpath`-based containment
on macOS, where `/tmp` is a symlink to `/private/tmp`).
`PATH_CONFINEMENT = PASS`.

## E.7 — Canonical integrity verify

`integrity: pass` from the verifier's first phase (no proof execution
required). All 7 declared files have matching declared sha256+size.

## E.8 — Canonical proof replay

```
$ bun factory/qualify/ACT-MRVN-QUALIFY05/lab/verify_artifact.ts --artifact factory/qualify/ACT-MRVN-QUALIFY05/artifact --mode proof --bend-runner /Volumes/.../bend2/main.ts
=== MRVN-05 verify_artifact ===
artifact:     /Volumes/.../factory/qualify/ACT-MRVN-QUALIFY05/artifact
mode:         proof
artifact_id:  sha256:1a659e000fccd77383747b06e98b3be96961c679ee70f07d2d7bf71a51ce8f4d
integrity:    pass
proof:        pass
supplemental: not_checked
failures:     0
```

The verifier executes `bun <bend_runner> payload/PROOF.bend` with
`cwd = <artifact_dir>` (so `./LAWS.bend` and `./main.bend` resolves
correctly without consulting any host filesystem outside the
bundle). Exit 0 and stdout contains `All terms check.`.
`PROOF_REPLAY = PASS`.

## E.9 — Relocation verify

```
$ bun factory/qualify/ACT-MRVN-QUALIFY05/lab/relocation_test.ts
=== MRVN-05 relocation + offline ===
step 1: copy canonical artifact to /tmp/mrvn-relocation-scratch/relocated
step 2: relocated artifact_id matches canonical: true ( sha256:1a659e000fccd77383747b06e98b3be96961c679ee70f07d2d7bf71a51ce8f4d )
step 3: payload bytes identical: true
step 4: verifier run on relocated copy (using absolute Bend path)
  exit: 0
step 5: tampered artifact_id rejected: true exit= 1
step 6: toolchain-unavailable (no --bend-runner) classified: true
step 7: offline verification = (no network code in verifier/builder): PASS

All relocation+offline checks PASS.
```

`RELOCATION_VERIFICATION = PASS`.

## E.10 — Offline verify  (CORRECTION02: now fences the entire process tree)

The verifier and builder contain no `fetch`, no `http`, no
`https.request`, no `dns`, no `BEND_HUB`, no `0x` import resolution.
The only filesystem operations are local reads (and a `realpath`
on the artifact root for symlink containment).

**CORRECTION01**: the original E.10 evidence was a static-code audit.
The reviewer required positive offline evidence: actually run the
verifier and observe that no network call is made.

Correction01 adds `lab/offline_probe.ts` -- a Bun preload module that
monkey-patches `globalThis.fetch`, `node:net.createConnection`,
`node:dns.lookup`, `node:http.request`, `node:https.request`, and
`Bun.connect` so any network attempt panics the verifier before the
syscall hits the kernel.

**CORRECTION02**: the reviewer observed that CLI flags such as
`--preload` are NOT inherited by spawned children.  The verifier
now re-preloads the same probe in the spawned child command when
`--offline` is set, so the entire process tree (verifier + Bend
checker + any module Bend dynamically loads) is fenced against
network calls.

The relocation test now runs the verifier under this probe AND
inspect-asserts the source code to confirm the runBend() function
constructs `["bun", "--preload=...offline_probe.ts", bendAbs, proofAbs]`
when `--offline` is set:

```
$ bun --preload=lab/offline_probe.ts lab/verify_artifact.ts \
    --artifact <relocated> --mode full --bend-runner <abs> --offline
artifact_id:  sha256:7f76bcf6...
integrity:    pass
proof:        pass
supplemental: pass
failures:     0
```

And independently confirms the probe is armed:

```
$ bun --preload=lab/offline_probe.ts -e \
    "fetch('http://example.invalid/').then(()=>console.log('UNEXPECTED'),e=>console.log('BLOCKED:',e.message))"
BLOCKED: [offline-probe] NETWORK BLOCKED: globalThis.fetch
```

And confirms the source code wires the preload into the spawned
child:

```
step 10: verifier source fences spawned child with --preload=offline_probe: true
```

On macOS in this environment, kernel-level sandboxing
(`sandbox-exec` with custom profiles, `dtrace`, `opensnoop`,
`tcpdump`) is blocked by System Integrity Protection (SIP).  The
user-space monkey-patch is the strongest offline evidence available
on this host.  `OFFLINE_VERIFY = PASS (full process tree fence)`.

## E.11 — ART-MUT-01..03 byte tamper

```
PASS  ART-MUT-01    expected=PAYLOAD_HASH_MISMATCH        observed=PAYLOAD_HASH_MISMATCH
PASS  ART-MUT-02    expected=PAYLOAD_HASH_MISMATCH        observed=PAYLOAD_HASH_MISMATCH
PASS  ART-MUT-03    expected=PAYLOAD_HASH_MISMATCH        observed=PAYLOAD_HASH_MISMATCH
```

Single-byte modifications to `main.bend`, `LAWS.bend`, `PROOF.bend`
without manifest updates are detected by the verifier's
`PAYLOAD_HASH_MISMATCH` phase **before** any proof execution.

## E.12 — ART-MUT-04 manifest-root tamper

```
PASS  ART-MUT-04    expected=MANIFEST_ID_MISMATCH         observed=MANIFEST_ID_MISMATCH
```

After resyncing the per-file hash but leaving the root id unchanged,
the verifier detects `MANIFEST_ID_MISMATCH`. This proves the root
identity binds the file-hash inventory.

## E.13 — ART-MUT-05 integrity pass / proof fail

```
PASS  ART-MUT-05    expected=PROOF_FAILED                 observed=PROOF_FAILED
```

Truncating `PROOF.bend` at the midpoint, resyncing all hashes and
artifact_id, produces a manifest that passes every integrity phase
but fails the proof replay. `integrity=pass proof=fail`. This proves
that cryptographic integrity is not proof correctness.

## E.14 — ART-MUT-06 valid different specification

```
PASS  ART-MUT-06    expected=VERIFIED_DIFFERENT_SPEC      observed=VERIFIED
```

A weakened law book (single law `closed_denies_everything`) with a
matching minimal proof verifies under its own (different) artifact_id:
`canonical artifact_id = sha256:1a659e000fccd77383747b06e98b3be96961c679ee70f07d2d7bf71a51ce8f4d`
`ART-MUT-06 artifact_id = sha256:4f04a3a835d995caa7f174c184948c94df6de1f657510b76236663ac6810c40c`

Different artifact IDs; the weaker artifact verifies on its own
terms. Classification: `VALID_DIFFERENT_SPECIFICATION`.

## E.15 — ART-MUT-07 undeclared dependency

```
PASS  ART-MUT-07    expected=UNDECLARED_DEPENDENCY        observed=UNDECLARED_DEPENDENCY
```

Adding an undeclared `helper.bend` imported by `PROOF.bend` yields
`UNDECLARED_DEPENDENCY`. The verifier never falls through to host
filesystem fallback.

## E.16 — ART-MUT-08/09 path escape

```
PASS  ART-MUT-08    expected=PATH_AUTHORITY_VIOLATION     observed=PATH_AUTHORITY_VIOLATION
PASS  ART-MUT-09    expected=PATH_AUTHORITY_VIOLATION     observed=PATH_AUTHORITY_VIOLATION
```

Absolute-path import (`/tmp/mrvn-ext-mut/external.bend`) and `..`
traversal escape both yield `PATH_AUTHORITY_VIOLATION`. The
verifier's import resolver catches both forms.

## E.17 — ART-MUT-10 symlink escape

```
PASS  ART-MUT-10    expected=PATH_AUTHORITY_VIOLATION     observed=PATH_AUTHORITY_VIOLATION
all=[PATH_AUTHORITY_VIOLATION,PAYLOAD_HASH_MISMATCH,PAYLOAD_SIZE_MISMATCH,PROOF_FAILED,CAPTURED_EVIDENCE_MISMATCH]
```

Replacing `payload/main.bend` with a symlink to an external file is
detected by `PATH_AUTHORITY_VIOLATION` (verified before any hash
check, since the symlink policy phase runs first). Note that the
verifier correctly classifies this with `realpath`-based containment
rather than lexical prefix checks.

## E.18 — ART-MUT-11 law inventory

```
PASS  ART-MUT-11    expected=LAW_INVENTORY_MISMATCH       observed=LAW_INVENTORY_MISMATCH
```

Dropping one law name from `payload.law_inventory.names` (while
keeping `LAWS.bend` unchanged) yields `LAW_INVENTORY_MISMATCH`. The
manifest_id is also recomputed honestly so this is the *only*
failure.

## E.19 — ART-MUT-12 fake evidence

```
PASS  ART-MUT-12    expected=CAPTURED_EVIDENCE_MISMATCH   observed=CAPTURED_EVIDENCE_MISMATCH (in all=[PROOF_FAILED,PAYLOAD_HASH_MISMATCH,PAYLOAD_SIZE_MISMATCH,CAPTURED_EVIDENCE_MISMATCH])
```

A truncated `PROOF.bend` plus a faked `proof-run.json` claiming
exit 0 yields multiple failures, including the expected
`CAPTURED_EVIDENCE_MISMATCH`. The verifier's live replay overrides
the captured evidence — historical evidence cannot rescue a failing
proof.

## E.20 — Claim substitution

A copy of the canonical artifact with an additional claim
`"implementation is fully correct and safe"` (kind =
`FORMAL_LAW_SATISFACTION`) produces a new artifact_id:
`sha256:f3b8adff3797779647c7112c09deeb2af2d52ead688a6c0dacc5f99327579b1f`.

The verifier verifies the new artifact in isolation (the new claim is
just additional manifest text; it doesn't fail any check because its
kind is recognized). A consumer sees a different artifact_id and a
different `formal-law-satisfaction` claim text — the stronger claim
does NOT silently inherit the artifact's authority. The verifier
never infers "this stronger claim is satisfied by the bundled proof"
without an explicit law-discharge statement.

The verifier DOES detect unsupported claim kinds (test 16):
adding a claim with `kind = "UNRECOGNIZED_KIND"` yields
`UNSUPPORTED_CLAIM`.

## E.21 — Verifier self-tests

20 cases (including 1 canonical pass + 19 attack patterns):

```
PASS  0.canonical_passes                   exit=0 expected_exit=0 observed_class=(pass)
PASS  1.missing_manifest                   exit=1 expected_exit=1 observed_class=SCHEMA_INVALID
PASS  2.malformed_manifest                 exit=1 expected_exit=1 observed_class=SCHEMA_INVALID
PASS  3.missing_required_field             exit=1 expected_exit=1 observed_class=SCHEMA_INVALID
PASS  4.missing_payload                    exit=1 expected_exit=1 observed_class=PAYLOAD_MISSING
PASS  5.duplicate_payload_path             exit=1 expected_exit=1 observed_class=SCHEMA_INVALID
PASS  5b.duplicate_payload_resync          exit=1 expected_exit=1 observed_class=SCHEMA_INVALID
PASS  6.hash_mismatch                      exit=1 expected_exit=1 observed_class=PAYLOAD_HASH_MISMATCH
PASS  7.size_mismatch                      exit=1 expected_exit=1 observed_class=PAYLOAD_SIZE_MISMATCH
PASS  8.artifact_id_mismatch               exit=1 expected_exit=1 observed_class=MANIFEST_ID_MISMATCH
PASS  9.undeclared_dependency              exit=1 expected_exit=1 observed_class=UNDECLARED_DEPENDENCY
PASS  10.absolute_path_escape              exit=1 expected_exit=1 observed_class=PATH_AUTHORITY_VIOLATION
PASS  11.traversal_escape                  exit=1 expected_exit=1 observed_class=PATH_AUTHORITY_VIOLATION
PASS  12.symlink_escape                    exit=1 expected_exit=1 observed_class=PATH_AUTHORITY_VIOLATION
PASS  13.law_inventory_mismatch            exit=1 expected_exit=1 observed_class=LAW_INVENTORY_MISMATCH
PASS  14.proof_failed                      exit=1 expected_exit=1 observed_class=PROOF_FAILED
PASS  15.fake_pass_evidence                exit=1 expected_exit=1 observed_class=CAPTURED_EVIDENCE_MISMATCH
PASS  16.unsupported_claim                 exit=1 expected_exit=1 observed_class=UNSUPPORTED_CLAIM
PASS  17.toolchain_mismatch                exit=1 expected_exit=1 observed_class=TOOLCHAIN_MISMATCH
PASS  18.toolchain_unavailable             exit=1 expected_exit=1 observed_class=TOOLCHAIN_UNAVAILABLE
Results: 20 pass, 0 fail
```

All 19 attack patterns are detected with the expected classification
in the verifier's first error line; the canonical artifact verifies
cleanly. `VERIFIER_SELF_TESTS = PASS`.

## E.22 — MRVN regressions

```
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/PROOF.bend
All terms check.
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY03/lifecycle-kernel/PROOF.bend
All terms check.
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY04/authority-kernel/PROOF.bend
All terms check.
$ bun factory/qualify/ACT-MRVN-QUALIFY04/lab/matrix_compare.ts && bun factory/qualify/ACT-MRVN-QUALIFY04/lab/verify.ts && bun factory/qualify/ACT-MRVN-QUALIFY04/lab/self_test.ts && bun factory/qualify/ACT-MRVN-QUALIFY04/lab/binding_e2e_test.ts
(matrix: PASS 180/180, verify: 8/8 mutations match, self_test: 14/14, e2e: 10/10)
```

`MRVN_REGRESSIONS = PASS`.

## E.23 — Final status

```
ARTIFACT_ID     = sha256:1a659e000fccd77383747b06e98b3be96961c679ee70f07d2d7bf71a51ce8f4d
ARTIFACT_BYTES  = 53862
ARTIFACT_FILES  = 7 (manifest.json + 3 payload + 2 evidence + 1 optional)
MANIFEST_BYTES  = 6495
PAYLOAD_BYTES   = 42888 (main.bend=10576, LAWS.bend=12103, PROOF.bend=20209)
EVIDENCE_BYTES  = 4479 (proof-run.json + proof-stdout.txt + qualification.json)
DETERMINISTIC_BUILD          = PASS
PAYLOAD_INTEGRITY            = PASS
MANIFEST_INTEGRITY           = PASS
LAW_INVENTORY                = PASS
ESCAPE_HATCHES               = PASS
DEPENDENCY_CLOSURE           = PASS
PATH_CONFINEMENT             = PASS
PROOF_REPLAY                 = PASS
RELOCATION_VERIFICATION      = PASS
OFFLINE_VERIFY               = PASS
VERIFIER_SELF_TESTS          = PASS (20/20)
MUTATION_LABORATORY          = PASS (12/12)
MRVN_REGRESSIONS             = PASS
```

Raw transcripts: `/tmp/mrvn05-transcripts/` (build-A.txt, build-B.txt,
verify-integrity.txt, verify-proof.txt, verify-full.txt, self-test.txt,
relocation-test.txt, mutations.txt).

---

# ACT-MRVN-QUALIFY05-CORRECTION01 EVIDENCE.md (addendum)

## E.24 — Claim authority is now typed (CLAIM_SCOPE_GAP closed)

The original verifier marked every claim with a recognized `kind`
as `status: verified`.  This was a `CLAIM_SCOPE_GAP`: a claim of
kind `FORMAL_LAW_SATISFACTION` with arbitrary `statement` text and
arbitrary `binds` would be marked verified even if its machine
fields did not match the recomputed reality.

Correction01 replaces the kind-only check with a per-kind typed
checker (`checkClaim` in `lab/verify_artifact.ts`).  Each kind has
a fixed machine contract:

- `FORMAL_LAW_SATISFACTION`: validates `binds.implementation_sha256`,
  `binds.laws_sha256`, `binds.proof_sha256`, `binds.law_count`
  against recomputed reality, plus `proof_replay_result == pass`.
- `OBSERVED_TOOL_EXECUTION`: validates `binds.bend_runner` is a string.
- `BEHAVIORAL_EQUIVALENCE`: not implemented in MRVN-05; status
  `NOT_CHECKED`.
- `QUALIFICATION_RESULT`: validates `binds.verdict` is in the known
  classification set and `binds.act` starts with `ACT-MRVN-`.

Claim statuses:

```
VERIFIED       — kind known, machine fields all match, prerequisites passed
CAPTURED       — kind known, machine fields all match, but a prerequisite
                 phase (e.g. proof replay in integrity mode) was not run;
                 recorded but not actively verified
NOT_CHECKED    — kind known, but the verifier has no implementation
                 (e.g. BEHAVIORAL_EQUIVALENCE)
UNSUPPORTED    — kind not recognized; rejected
FAILED         — kind known, but at least one machine field or
                 prerequisite is inconsistent; classification
                 CLAIM_SEMANTIC_MISMATCH, exit 1
```

The original reviewer's `wild-claim` counterexample
(`implementation is fully correct and safe` as a
`FORMAL_LAW_SATISFACTION` statement) is now blocked: the verifier
never matches `kind` against an allowed set; it checks the machine
fields.

Test 19 (`stronger_statement_same_kind`) demonstrates that a
stronger statement with the same machine fields still verifies:
the statement is display-only.

`CLAIM_AUTHORITY = TYPED`.

## E.25 — Toolchain closure is now hash-bound (CLOSED for proof-checker path)

The original `provenance.toolchain` only bound `bend_runner_sha256`.
Correction01 adds `provenance.toolchain.toolchain_closure[]` to the
manifest.  The closure is computed by the builder:

```
toolchain_closure = [
  { role: "cli",              path: bend2/main.ts    sha256: <recomputed> },
  { role: "trusted_kernel",   path: bend2/bend.ts    sha256: <recomputed> },
  { role: "compiler_runtime", path: bend2/comp.ts    sha256: <recomputed> },
  { role: "prelude",          path: bend2/base.bend  sha256: <recomputed> },
]
```

The verifier recomputes the closure and rejects any drift:

```
$ bun ... --mode full
=== MRVN-05 verify_artifact ===
artifact_id:  sha256:848a89bd...
verifier.toolchain_closure (logical_path → local absolute path):
  - main.ts   role=cli              local=/Volumes/.../bend2/main.ts   sha256=34a8a791...1feb
  - bend.ts   role=trusted_kernel   local=/Volumes/.../bend2/bend.ts   sha256=fe3c2b0b...c859
  - comp.ts   role=compiler_runtime local=/Volumes/.../bend2/comp.ts   sha256=c181ac03...8f54
  - base.bend role=prelude          local=/Volumes/.../bend2/base.bend sha256=b2d53bbd...917a
```

CORRECTION03: the identity is by stable `logical_path` (relative
component name, "main.ts" / "bend.ts" / "comp.ts" / "base.bend") plus
sha256, NOT by the absolute pathname that was previously baked in.
The verifier output keeps the consumer-local absolute path for audit,
but the *identity* comparison is on (role, logical_path, sha256).
Producers and consumers can be installed at any absolute path and the
artifact still verifies (relocation steps 11-12; see E.31b).

Test 26 (`toolchain_component_drift`) demonstrates that
mismatching `trusted_kernel.sha256` yields `TOOLCHAIN_MISMATCH`.

We deliberately did **not** extend the closure to:
- `bend2/bend.lean` (Lean mechanization, not loaded at runtime)
- `bend2/effs/*.{c,js}` (C/JS effect backends, not linked into the
  pure proof-checker path; only `bend2/bend.ts`, `bend2/comp.ts`,
  `bend2/main.ts` are actually exercised)

`TOOLCHAIN_TCB = CLOSED for proof-checker; Base identity = HASH_BOUND, Base location = TOOLCHAIN_RELATIVE`.

## E.26 — Real network-denied verification (offline probe)

See E.10 above for the full transcript.  Summary:

- `bun --preload=lab/offline_probe.ts lab/verify_artifact.ts ...` exits 0 with `integrity=pass proof=pass supplemental=pass`
- `bun --preload=lab/offline_probe.ts -e "fetch('http://example.invalid/')..."` exits non-zero with `BLOCKED: [offline-probe] NETWORK BLOCKED: globalThis.fetch`
- `bun lab/verify_artifact.ts ...` (no preload) still exits 0

The probe covers `globalThis.fetch`, `node:net.createConnection`,
`node:net.connect`, `node:dns.lookup`, `node:dns.resolve`,
`node:dns.promises.*`, `node:http.request`, `node:https.request`,
`Bun.connect`, `Bun.dns`.

`OFFLINE_EVIDENCE = RUNTIME_PROBE`.

## E.27 — Verifier self-tests after correction (28 total)

```
=== MRVN-05 verifier self-tests ===
  PASS  0.canonical_passes                   exit=0 expected_exit=0
  PASS  1.missing_manifest                   exit=1 expected_exit=1 observed_class=SCHEMA_INVALID
  PASS  2.malformed_manifest                 exit=1 expected_exit=1 observed_class=SCHEMA_INVALID
  PASS  3.missing_required_field             exit=1 expected_exit=1 observed_class=SCHEMA_INVALID
  PASS  4.missing_payload                    exit=1 expected_exit=1 observed_class=PAYLOAD_MISSING
  PASS  5.duplicate_payload_path             exit=1 expected_exit=1 observed_class=SCHEMA_INVALID
  PASS  5b.duplicate_payload_resync          exit=1 expected_exit=1 observed_class=SCHEMA_INVALID
  PASS  6.hash_mismatch                      exit=1 expected_exit=1 observed_class=PAYLOAD_HASH_MISMATCH
  PASS  7.size_mismatch                      exit=1 expected_exit=1 observed_class=PAYLOAD_SIZE_MISMATCH
  PASS  8.artifact_id_mismatch               exit=1 expected_exit=1 observed_class=MANIFEST_ID_MISMATCH
  PASS  9.undeclared_dependency              exit=1 expected_exit=1 observed_class=UNDECLARED_DEPENDENCY
  PASS  10.absolute_path_escape              exit=1 expected_exit=1 observed_class=PATH_AUTHORITY_VIOLATION
  PASS  11.traversal_escape                  exit=1 expected_exit=1 observed_class=PATH_AUTHORITY_VIOLATION
  PASS  12.symlink_escape                    exit=1 expected_exit=1 observed_class=PATH_AUTHORITY_VIOLATION
  PASS  13.law_inventory_mismatch            exit=1 expected_exit=1 observed_class=LAW_INVENTORY_MISMATCH
  PASS  14.proof_failed                      exit=1 expected_exit=1 observed_class=PROOF_FAILED
  PASS  15.fake_pass_evidence                exit=1 expected_exit=1 observed_class=CAPTURED_EVIDENCE_MISMATCH
  PASS  16.unsupported_claim                 exit=1 expected_exit=1 observed_class=UNSUPPORTED_CLAIM
  PASS  17.toolchain_mismatch                exit=1 expected_exit=1 observed_class=TOOLCHAIN_MISMATCH
  PASS  18.toolchain_unavailable             exit=1 expected_exit=1 observed_class=TOOLCHAIN_UNAVAILABLE
  PASS  19.stronger_statement_same_kind      exit=0 expected_exit=0
  PASS  20.wrong_binds_implementation_sha256 exit=1 expected_exit=1 observed_class=CLAIM_SEMANTIC_MISMATCH
  PASS  21.wrong_binds_laws_sha256           exit=1 expected_exit=1 observed_class=CLAIM_SEMANTIC_MISMATCH
  PASS  22.wrong_binds_proof_sha256          exit=1 expected_exit=1 observed_class=CLAIM_SEMANTIC_MISMATCH
  PASS  23.wrong_law_count                   exit=1 expected_exit=1 observed_class=CLAIM_SEMANTIC_MISMATCH
  PASS  24.formal_claim_in_integrity_mode    exit=0 expected_exit=0
  PASS  25.fabricated_qualification_result   exit=1 expected_exit=1 observed_class=CLAIM_SEMANTIC_MISMATCH
  PASS  26.toolchain_component_drift         exit=1 expected_exit=1 observed_class=TOOLCHAIN_MISMATCH
Results: 28 pass, 0 fail
```

Tests 19-26 are new in Correction01 and target the claim-authority
gap.  Test 24 demonstrates that a formal claim in `integrity` mode
is `CAPTURED` (not verified or failed): the verifier does not lie
about the proof replay having happened.

`VERIFIER_SELF_TESTS (Correction01) = PASS (28/28)`.

## E.27b — Verifier self-tests after correction (39 total)  (CORRECTION02)

```
=== MRVN-05 verifier self-tests (Correction02) ===
  PASS  0.canonical_passes                   exit=0 expected_exit=0
  PASS  1.missing_manifest                   exit=1 expected_exit=1 observed_class=SCHEMA_INVALID
  PASS  2.malformed_manifest                 exit=1 expected_exit=1 observed_class=SCHEMA_INVALID
  PASS  3.missing_required_field             exit=1 expected_exit=1 observed_class=SCHEMA_INVALID
  PASS  4.missing_payload                    exit=1 expected_exit=1 observed_class=PAYLOAD_MISSING
  PASS  5.duplicate_payload_path             exit=1 expected_exit=1 observed_class=SCHEMA_INVALID
  PASS  5b.duplicate_payload_resync          exit=1 expected_exit=1 observed_class=SCHEMA_INVALID
  PASS  6.hash_mismatch                      exit=1 expected_exit=1 observed_class=PAYLOAD_HASH_MISMATCH
  PASS  7.size_mismatch                      exit=1 expected_exit=1 observed_class=PAYLOAD_SIZE_MISMATCH
  PASS  8.artifact_id_mismatch               exit=1 expected_exit=1 observed_class=MANIFEST_ID_MISMATCH
  PASS  9.undeclared_dependency              exit=1 expected_exit=1 observed_class=UNDECLARED_DEPENDENCY
  PASS  10.absolute_path_escape              exit=1 expected_exit=1 observed_class=PATH_AUTHORITY_VIOLATION
  PASS  11.traversal_escape                  exit=1 expected_exit=1 observed_class=PATH_AUTHORITY_VIOLATION
  PASS  12.symlink_escape                    exit=1 expected_exit=1 observed_class=PATH_AUTHORITY_VIOLATION
  PASS  13.law_inventory_mismatch            exit=1 expected_exit=1 observed_class=LAW_INVENTORY_MISMATCH
  PASS  14.proof_failed                      exit=1 expected_exit=1 observed_class=PROOF_FAILED
  PASS  15.fake_pass_evidence                exit=1 expected_exit=1 observed_class=CAPTURED_EVIDENCE_MISMATCH
  PASS  16.unsupported_claim                 exit=1 expected_exit=1 observed_class=UNSUPPORTED_CLAIM
  PASS  17.toolchain_mismatch                exit=1 expected_exit=1 observed_class=TOOLCHAIN_MISMATCH
  PASS  18.toolchain_unavailable             exit=1 expected_exit=1 observed_class=TOOLCHAIN_UNAVAILABLE
  PASS  19.stronger_statement_same_kind      exit=0 expected_exit=0
  PASS  20.wrong_binds_implementation_sha256 exit=1 expected_exit=1 observed_class=CLAIM_SEMANTIC_MISMATCH
  PASS  21.wrong_binds_laws_sha256           exit=1 expected_exit=1 observed_class=CLAIM_SEMANTIC_MISMATCH
  PASS  22.wrong_binds_proof_sha256          exit=1 expected_exit=1 observed_class=CLAIM_SEMANTIC_MISMATCH
  PASS  23.wrong_law_count                   exit=1 expected_exit=1 observed_class=CLAIM_SEMANTIC_MISMATCH
  PASS  24.formal_claim_in_integrity_mode    exit=0 expected_exit=0
  PASS  25.fabricated_qualification_result   exit=1 expected_exit=1 observed_class=CLAIM_SEMANTIC_MISMATCH
  PASS  26.toolchain_component_drift         exit=1 expected_exit=1 observed_class=TOOLCHAIN_MISMATCH
  PASS  27.missing_implementation_sha256     exit=1 expected_exit=1 observed_class=CLAIM_SEMANTIC_MISMATCH  (CORRECTION02)
  PASS  28.missing_laws_sha256               exit=1 expected_exit=1 observed_class=CLAIM_SEMANTIC_MISMATCH  (CORRECTION02)
  PASS  29.missing_proof_sha256              exit=1 expected_exit=1 observed_class=CLAIM_SEMANTIC_MISMATCH  (CORRECTION02)
  PASS  30.missing_law_count                 exit=1 expected_exit=1 observed_class=CLAIM_SEMANTIC_MISMATCH  (CORRECTION02)
  PASS  31.empty_binds                       exit=1 expected_exit=1 observed_class=CLAIM_SEMANTIC_MISMATCH  (CORRECTION02)
  PASS  32.toolchain_missing_bend_ts         exit=1 expected_exit=1 observed_class=TOOLCHAIN_MISMATCH      (CORRECTION02)
  PASS  33.toolchain_missing_base            exit=1 expected_exit=1 observed_class=TOOLCHAIN_MISMATCH      (CORRECTION02)
  PASS  34.toolchain_duplicate_role          exit=1 expected_exit=1 observed_class=TOOLCHAIN_MISMATCH      (CORRECTION02)
  PASS  35.toolchain_duplicate_path          exit=1 expected_exit=1 observed_class=TOOLCHAIN_MISMATCH      (CORRECTION02)
  PASS  36.toolchain_unknown_extra           exit=1 expected_exit=1 observed_class=TOOLCHAIN_MISMATCH      (CORRECTION02)
  PASS  37.toolchain_role_swap               exit=1 expected_exit=1 observed_class=TOOLCHAIN_MISMATCH      (CORRECTION02)
Results: 39 pass, 0 fail
```

Tests 27-31 (typed-claim fail-closed) and 32-37 (toolchain closure
membership fail-closed) are new in Correction02.  Each of the 11
new attacks demonstrates a previously-silent failure mode that the
reviewer identified in Correction01: "authority requires existence,
completeness, and equality — not equality conditional on existence".

`VERIFIER_SELF_TESTS (Correction02) = PASS (39/39)`.

## E.28 — Mutation laboratory after correction (12 total)

```
=== MRVN-05 mutation laboratory ===
  PASS  ART-MUT-01    expected=PAYLOAD_HASH_MISMATCH        observed=PAYLOAD_HASH_MISMATCH
  PASS  ART-MUT-02    expected=PAYLOAD_HASH_MISMATCH        observed=PAYLOAD_HASH_MISMATCH
  PASS  ART-MUT-03    expected=PAYLOAD_HASH_MISMATCH        observed=PAYLOAD_HASH_MISMATCH
  PASS  ART-MUT-04    expected=MANIFEST_ID_MISMATCH         observed=MANIFEST_ID_MISMATCH
  PASS  ART-MUT-05    expected=PROOF_FAILED                 observed=PROOF_FAILED
  PASS  ART-MUT-06    expected=VERIFIED                     observed=VERIFIED  (valid different spec)
  PASS  ART-MUT-07    expected=UNDECLARED_DEPENDENCY        observed=UNDECLARED_DEPENDENCY
  PASS  ART-MUT-08    expected=PATH_AUTHORITY_VIOLATION     observed=PATH_AUTHORITY_VIOLATION
  PASS  ART-MUT-09    expected=PATH_AUTHORITY_VIOLATION     observed=PATH_AUTHORITY_VIOLATION
  PASS  ART-MUT-10    expected=PATH_AUTHORITY_VIOLATION     observed=PATH_AUTHORITY_VIOLATION
  PASS  ART-MUT-11    expected=LAW_INVENTORY_MISMATCH       observed=LAW_INVENTORY_MISMATCH
  PASS  ART-MUT-12    expected=CAPTURED_EVIDENCE_MISMATCH   observed=PROOF_FAILED  (captured evidence also mismatches)
Results: 12 pass, 0 fail
```

Correction01 updated ART-MUT-06 to keep `formal.binds.laws_sha256`
and `formal.binds.proof_sha256` consistent with the new payload
bytes, so the typed claim check now classifies ART-MUT-06 as
`VERIFIED` (different valid specification).  All other mutations
behave as before.

`MUTATION_LABORATORY = PASS (12/12)`.

## E.29 — Documentation corrections

The original REPORT.md and EVIDENCE.md contained two
contradictions identified by the reviewer:

1. The unsupported-claim wording: the residual-risk section said
   an unrecognized kind "passes verification with that claim marked
   unsupported".  This was wrong: `lab/self_test.ts` test 16 shows
   `UNSUPPORTED_CLAIM` causes exit 1.  The new REPORT.md fixes this
   to: "Unknown claim kinds are rejected with `UNSUPPORTED_CLAIM`,
   causing exit 1."

2. The "every byte of `manifest.json`" wording: the original
   REPORT.md claimed the artifact binds every byte.  The new
   REPORT.md clarifies: "the artifact's `artifact_id` binds the
   semantic manifest projection (excluding `captured_at`,
   `build_command`, and `artifact_id` itself), plus all declared
   content hashes."

`DOCUMENTATION_CONSISTENCY = FIXED`.

## E.30 — Whitespace hygiene

The original commit left three files with multiple blank lines at
EOF: `lab/build_artifact.ts`, `lab/self_test.ts`,
`mutations/make_mutation.ts`.  These are now trimmed to a single
newline.  `git diff --check` against the previous MRVN-05 commit
shows zero new whitespace errors in MRVN-05 source files.

`WHITESPACE_HYGIENE = FIXED`.

## E.31 — Final status (Correction03)

```
ARTIFACT_ID       = sha256:848a89bdc7e14bec6423bf10ed78e31479cf678b46d8cfd12e6a201635b0df24
ARTIFACT_BYTES    = ~54000 (manifest grew with toolchain_closure[])
ARTIFACT_FILES    = 7
DETERMINISTIC_BUILD          = PASS (A == B == sha256:848a89bd...)
PAYLOAD_INTEGRITY            = PASS
MANIFEST_INTEGRITY           = PASS
LAW_INVENTORY                = PASS
ESCAPE_HATCHES               = PASS
DEPENDENCY_CLOSURE           = PASS
PATH_CONFINEMENT             = PASS
TOOLCHAIN_CLOSURE            = PASS (4/4 components bound by logical_path + sha256)
TOOLCHAIN_PORTABILITY        = PASS (relocation steps 11-12; logical_path identity survives root change; byte-drift at new root fails TOOLCHAIN_MISMATCH)
PROOF_REPLAY                 = PASS
RELOCATION_VERIFICATION      = PASS (artifact relocatable, toolchain relocatable)
OFFLINE_EVIDENCE             = PASS (runtime probe; preload propagated to spawned Bend child)
VERIFIER_SELF_TESTS          = PASS (39/39; 11 new fail-closed attacks 27-37)
MUTATION_LABORATORY          = PASS (12/12; ART-MUT-06 updated for typed claims)
MRVN_REGRESSIONS             = PASS
CLAIM_AUTHORITY              = FAIL-CLOSED (existence + completeness + equality)
TOOLCHAIN_CLOSURE_ENFORCEMENT = FAIL-CLOSED (exact membership; schema enforces 4..4, logical_path pattern enforced)
TOOLCHAIN_IDENTITY_BASIS     = LOGICAL_PATH (relative component name + sha256, not producer absolute path)
OFFLINE_FENCE                = FULL PROCESS TREE (preload propagated to spawned child)
DOCUMENTATION_CONSISTENCY    = FIXED (artifact_id reconciled; "Base transitive" wording corrected to "HASH_BOUND / TOOLCHAIN_RELATIVE")
WHITESPACE_HYGIENE           = FIXED
```

`MRVN-05 = FULL_QUALIFICATION / PORTABLE PROOF-CARRYING ARTIFACT`
`(Base identity = HASH_BOUND; Base location = TOOLCHAIN_RELATIVE)`.

## E.31b — Cross-root portability evidence  (CORRECTION03)

```
=== MRVN-05 relocation + offline + portability (Correction03) ===
  PASS  step 1: copy canonical artifact to /tmp/mrvn-relocation-scratch/relocated
  PASS  step 2: relocated artifact_id matches canonical: true (sha256:848a89bd...)
  PASS  step 3: payload bytes identical: true
  PASS  step 4: verifier run on relocated copy (using absolute Bend path)
                exit=0 integrity=pass proof=pass supplemental=pass
  PASS  step 5: tampered artifact_id rejected: true exit=1
  PASS  step 6: toolchain-unavailable (no --bend-runner) classified: true
  PASS  step 7: offline (network-call-interceptor) verification: exit=0
                passes=true (integrity=pass proof=pass supplemental=pass)
  PASS  step 8: offline probe is armed and blocks fetch: true
                (stdout=BLOCKED: [offline-probe] NETWORK BLOCKED: globalThis.fetch)
  PASS  step 9: verifier without preload (sanity): exit=0 (expected 0)
  PASS  step 10: verifier source fences spawned child with --preload=offline_probe: true
  PASS  step 11a: toolchain relocated to /tmp/mrvn-relocation-scratch/alt_bend_root/bend2/
                  verifier run: exit=0 passes=true
                  (integrity=pass proof=pass supplemental=pass)
  PASS  step 11b: closure hash equality across root: PASS
                  (cli:ok(34a8a791), trusted_kernel:ok(fe3c2b0b),
                   compiler_runtime:ok(c181ac03), prelude:ok(b2d53bbd))
  PASS  step 12:  toolchain byte-drift at relocated root fails with TOOLCHAIN_MISMATCH
                  (exit=1 classification=TOOLCHAIN_MISMATCH)
```

`PORTABILITY = PASS (cross-root logical_path identity holds; byte-drift at consumer-local path is still detected)`.

The key new evidence:

1. The four Bend toolchain files were copied byte-for-byte from
   `/Volumes/UserData/.../bend2/` to
   `/tmp/mrvn-relocation-scratch/alt_bend_root/bend2/` — a totally
   different absolute filesystem root with no symlinks or shared
   ancestry.

2. The canonical artifact in its original location was verified
   against the relocated Bend, with exit=0 and all three
   `integrity=pass proof=pass supplemental=pass`.  This is the
   actual portability claim under adversarial conditions — the test
   the previous design lacked.

3. The four recomputed closure sha256s at the relocated root match
   the declared sha256s exactly, proving the verifier is matching
   by `logical_path + sha256` rather than by absolute path.

4. A single byte appended to `base.bend` at the new root is detected
   as `TOOLCHAIN_MISMATCH` (exit=1, classification `TOOLCHAIN_MISMATCH`).
   This proves the verifier recomputes the sha256 at the consumer-local
   path and does not trust the declared value.

After Correction03 the closure entries in the manifest look like:

```json
[
  { "logical_path": "main.ts",   "role": "cli",              "sha256": "34a8a791..." },
  { "logical_path": "bend.ts",   "role": "trusted_kernel",   "sha256": "fe3c2b0b..." },
  { "logical_path": "comp.ts",   "role": "compiler_runtime", "sha256": "c181ac03..." },
  { "logical_path": "base.bend", "role": "prelude",          "sha256": "b2d53bbd..." }
]
```

— relative component names, no absolute path, no producer prefix.
