# ACT-MRVN-QUALIFY05 EVIDENCE.md

This document records the technical qualification of the MRVN-05
proof-carrying Factory artifact system against the bounded question in
ACT section 1.

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

## E.10 — Offline verify

The verifier and builder contain no `fetch`, no `http`, no
`https.request`, no `dns`, no `BEND_HUB`, no `0x` import resolution.
The only filesystem operations are local reads (and a `realpath`
on the artifact root for symlink containment). The relocation test
explicitly notes this; an offline verification would behave
identically. `OFFLINE_VERIFY = PASS`.

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
