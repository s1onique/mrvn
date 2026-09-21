# ACT-MRVN-QUALIFY09 EVIDENCE

This file is the human-readable evidence manifest for ACT-MRVN-09.
For machine-readable equivalents, see `lab/*.json` and `evidence/*.json`.

## E.0 Frozen authority identities

```text
canonical_impl_sha256:   eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb
canonical_laws_sha256:   0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8
canonical_proof_sha256:  c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8
intent_oracle_sha256:    a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9
intent_text_sha256:      1e21d2f56e2d587ef08499a0f58aac47960a6d5c5b4b899a39e972e92985d274
toolchain:
  bend2/main.ts    = 34a8a791b02ce92f247bda4cabcd3ff4eabe500002fedbec4867b5db77ee1feb
  bend2/bend.ts    = fe3c2b0b306fccbe44efec349d8f339b6efdaceb090b3d3049c74a1a6015c859
  bend2/comp.ts    = c181ac038d7f7d4ed0e1bb81c513e64285347627e0b3a13a98cb86a1d1568f54
  bend2/base.bend  = b2d53bbd83639c3ae27260b318efa09de9df6006a556ac6ef41c104ea164917a
source_commit:           dbd326046af422823477646c2cb76f9daf622a6a   (HEAD at MRVN-09 start)
```

These sha256 values are inherited unchanged from MRVN-04/06/07/08.

## E.1 Independent-agent identity

```text
agent_instance:        MiniMax-M3
agent_model:           MiniMax-M3
agent_provider:        MiniMax
session_id:            mrvn09-replication-2026-09-21
start_timestamp:       2026-09-20T21:58:41Z
same_as_mrvn08_agent:   false
```

The MRVN-08 K-LIVE-SAME-AGENT family was authored by a prior Cline
session; the MRVN-09 agent is a different LLM instance (MiniMax-M3)
operating under the strict rule that no MRVN-08 J-SYNTHETIC-GENERATOR
or K-LIVE-SAME-AGENT candidate implementation, descriptor, or
transformation recipe is in its input bundle.

## E.2 Agent input bundle

```text
agent_input/INSTRUCTIONS.md       (bounded task description)
agent_input/main.bend             (canonical implementation)
agent_input/LAWS.bend             (immutable specification)
agent_input/PROOF.bend            (canonical proof)
agent_input/oracle.json           (180-cell semantic oracle)
agent_input/INTENT.md             (frozen intent text)
agent_input/guide_index.md        (Bend proof-relevant guide summary)
agent_input/bundle.sha256         (sha256 of every file in agent_input/)
```

The agent received EXACTLY this set of files.  Nothing else.

## E.3 Blindness / independence audit

The independence audit (`lab/independence_audit.ts`) verifies:

* agent_input/ contains all required inputs (7 files).
* agent_input/ does NOT contain any forbidden MRVN-08 path pattern.
* No per-candidate descriptor.json or TRANSCRIPT.md accidentally
  contains an MRVN-08 candidate ID pattern.

Result: PASS, prior_candidate_exposure = 0.

See `lab/independence_audit_result.json` for the full record.

## E.4 Prior-candidate exposure attack

`lab/independence_attack.ts` is the E2E negative test:

1. Copy agent_input/ to /tmp/mrvn09_attack/.
2. Append a "stolen recipe" pointing to MRVN-08 K-01-thunked-work to
   INSTRUCTIONS.md.
3. Run independence_audit.ts with MRVN09_ATTACK_DIR pointing at the
   contaminated bundle.

Expected: exit = 1, prior_candidate_exposure >= 1.

Observed: PASS, exit = 1, prior_candidate_exposure = 1.

This proves the independence gate is real and reactive.

## E.5 Attempts 1-4 (IND-MRVN09-001 through IND-MRVN09-004)

| ID | impl_sha256 (first 16) | classification | artifact.verify |
|----|------------------------|-----------------|-----------------|
| 001 | eea5d84f80bf9bf3 | CANONICAL_PROOF_SURVIVED | pass |
| 002 | 44efb759e1467d71 | CANONICAL_PROOF_SURVIVED | pass |
| 003 | 08dd8cfde4c42272 | CANONICAL_PROOF_SURVIVED | pass |
| 004 | c0cff56af5e900db | CANONICAL_PROOF_SURVIVED | pass |

Per-candidate details in `independent/IND-MRVN09-{001..004}/result.json`.

## E.6 Attempts 5-8 (IND-MRVN09-005 through IND-MRVN09-008)

| ID | impl_sha256 (first 16) | classification | artifact.verify |
|----|------------------------|-----------------|-----------------|
| 005 | 476f69dd1f091af7 | CANONICAL_PROOF_SURVIVED | pass |
| 006 | 166f9907874c120b | CANONICAL_PROOF_SURVIVED | pass |
| 007 | bc0d9456c61bd7b1 | CANONICAL_PROOF_SURVIVED | pass |
| 008 | 0b5b4c18ae8ff173 | CANONICAL_PROOF_SURVIVED | pass |

Per-candidate details in `independent/IND-MRVN09-{005..008}/result.json`.

## E.7 Attempts 9-12 (IND-MRVN09-009 through IND-MRVN09-012)

| ID | impl_sha256 (first 16) | classification | artifact.verify |
|----|------------------------|-----------------|-----------------|
| 009 | 3167a8a96660b272 | CANONICAL_PROOF_SURVIVED | pass |
| 010 | 027e5363781914b4 | CANONICAL_PROOF_SURVIVED | pass |
| 011 | a9bde58dec4dbc8f | CANONICAL_PROOF_SURVIVED | pass |
| 012 | d48ebf4618100094 | CANONICAL_PROOF_SURVIVED | pass |

Per-candidate details in `independent/IND-MRVN09-{009..012}/result.json`.

## E.8 Additional attempts

None beyond IND-MRVN09-012.  All 12 attempts in the valid range.

## E.9 Candidate semantic equivalence

Every candidate was run through the full classifier pipeline
(`lab/classify.ts`), which:

1. Verifies `LAWS.bend` sha256 matches canonical.
2. Verifies `intent_oracle_sha256` matches canonical.
3. Verifies toolchain closure (bend2/main.ts, bend2/bend.ts,
   bend2/comp.ts, bend2/base.bend) sha256 matches canonical.
4. Generates the candidate's behavior via Bend execution (run1).
5. Compares the 180-cell behavior against the oracle.
6. Runs the canonical PROOF.bend byte-identical.
7. Optionally runs REPROOF.bend.
8. Builds and FULL-verifies the MRVN-05 portable artifact.

For every IND-MRVN09-{001..012}:

* intent_status: PASS_180_OF_180
* diff_count: 0
* run1_sha256 == run2_sha256 (deterministic)
* canonical proof: All terms check
* artifact.verify: pass

No semantic drift, no proof failure, no interface binding failure,
no auth violation, no escape hatch.

## E.10 Canonical proof outcomes

```text
survived                = 12
genuine_failures        = 0
interface_failures      = 0
other_proof_failures    = 0
```

The canonical PROOF.bend discharges for every candidate.  No REPROOF
was needed; no REPROOF was authored.

## E.11 Genuine proof failures

None.  No candidate exhibited a genuine canonical-proof failure.

## E.12 Reproof attempts

None.  REPROOF infrastructure is present (see `lab/classify.ts`
`--author-reproof` flag and the MRVN-08 micro-lab
`MICRO-PBREAK-01-REPROOF.bend`) but no candidate exercised it.

## E.13 Candidate novelty / duplication

```text
EXACT_PRIOR_CORPUS_DUPLICATES       = 1   (IND-MRVN09-001 byte-equal to MRVN-08 B-004)
STRUCTURAL_NEAR_DUPLICATES         = 0
SEMANTICALLY_SAME_BUT_STRUCTURALLY_NOVEL = 11
```

Novelty computed by sha256(source) comparison against the 75 MRVN-08
candidate corpus.  IND-MRVN09-001 is the control twin (designed to
verify the classifier accepts the canonical shape); its byte-equality
to MRVN-08 B-004 is a deliberate consequence of the lifecycle-rotation
transformation when the rotation preserves canonical spacing alignment.

## E.14 Portable artifacts

Every candidate has a portable artifact at
`independent/IND-MRVN09-NNN/artifact/`.  The artifact contains:

* `manifest.json` (sha256-bound)
* `payload/main.bend` (candidate)
* `payload/LAWS.bend` (canonical)
* `payload/PROOF.bend` (canonical) or `REPROOF.bend` (if any)
* `evidence/`

`lab/artifact_index.json` records the 12/12 pass verification.

## E.15 Self-tests

`lab/self_test.ts` runs the 16-test classifier self-test suite.

```text
Results: 16 pass, 0 fail
```

All 16 ACT-MRVN-09 §31 self-tests pass.

## E.16 Authority attacks

`lab/authority_attacks.ts` runs the 11-attack authority-binding suite
inherited from MRVN-07 §CORRECTION03 and MRVN-08 (numbers 1-10, plus
the additional `7b.behavior_all_allow` sub-attack — 11 individual
`record(...)` invocations; 10 mandatory attacks per §39 + 1 sub-attack).
ACT §39 minimum is 10; MRVN-09 executes 11.

```text
Attacks executed: 11 (1, 2, 3, 4, 5, 6, 7, 7b, 8, 9, 10)
Results: 11 pass, 0 fail
```

All authority attacks pass.

## E.17 Regression hygiene (CORRECTION02)

`lab/regression_hygiene.ts` watches the durable prior-ACT surface via
`git ls-files` against git HEAD, with
`WATCHED_PRIOR_ACTS = {04, 05, 06, 07, 08}` (CORRECTION02 extends
CORRECTION01's `{04, 05, 06, 07}` set with MRVN-08; MRVN-09
specifically discharges the MRVN-08 promotion condition and so MRVN-08
is now prior-authority).  Indentation: the durable surface covers
the COMPLETE set of git-tracked files under those directories, not
just `lab/`.

```text
WATCHED_PRIOR_ACTS    = {04, 05, 06, 07, 08}
Drift count           = 0
```

The negative control `lab/regression_authority_drift_test.ts`
deliberately mutates one tracked file in each of MRVN-07 (CORRECTION01)
and MRVN-08 (CORRECTION02 — new), runs the gate in each case, observes
exit=1 with `Drift count: 1` mentioning the mutated path, then restores
the file hermetically via `git checkout HEAD -- <path>`.  Both
controls must fire for the script to exit 0.  PASS.

## E.18 Prior ACT regressions

The MRVN-04..08 directories are untouched.  Verified by:

```text
$ git diff --exit-code HEAD -- factory/qualify/ACT-MRVN-QUALIFY04 \
                                  factory/qualify/ACT-MRVN-QUALIFY05 \
                                  factory/qualify/ACT-MRVN-QUALIFY06 \
                                  factory/qualify/ACT-MRVN-QUALIFY07 \
                                  factory/qualify/ACT-MRVN-QUALIFY08
(empty)
```

## E.19 Independent metrics

```text
attempts:                  12
valid_candidates:          12
semantic_equivalent:       12
semantic_drift:            0
frontend_limits:           0
authority_violations:      0
canonical_proof_survived:  12
genuine_canonical_proof_failures: 0
interface_failures:         0
reproof_attempts:           0
reproof_passes:             0
extensional_proof_breaks:   0
exact_prior_corpus_duplicates: 1
structurally_novel_candidates: 11
```

## E.20 Combined MRVN-08 + MRVN-09 metrics

```text
MRVN-08 (J-SYNTHETIC-GENERATOR + K-LIVE-SAME-AGENT + A-I):
  attempts:                76
  valid_bend:              75
  semantic_equivalent:     75
  cps:                     75
  proof_break_witnesses:   0

MRVN-09 (INDEPENDENT):
  attempts:                12
  valid_bend:              12
  semantic_equivalent:     12
  cps:                     12
  proof_break_witnesses:   0

COMBINED:
  attempts:                88
  valid_bend:              87
  semantic_equivalent:     87
  cps:                     87
  proof_break_witnesses:   0
```

(Note: MRVN-08 had 76 attempts = 75 valid + 1 deliberate semantic-drift
control.  MRVN-09 has 12 attempts = 12 valid + 0 drift controls.)

## E.21 Final disposition

```text
PRINCIPAL_VERDICT:       FULL_QUALIFICATION_NO_PROOF_BREAK_FOUND_WITHIN_SEARCH_BOUND
BOARD_TRANSITION:
  MRVN-08:               PARTIAL_QUALIFICATION_NO_PROOF_BREAK_FOUND_WITHIN_SEARCH_BOUND / INDEPENDENT_AGENT_REPLICATION_REQUIRED  (pre-MRVN-09 state)
  MRVN-09:               FULL_QUALIFICATION_NO_PROOF_BREAK_FOUND_WITHIN_SEARCH_BOUND
  MRVN-EXT-01:           LOCKED
NEXT_RECOMMENDED_ACT:    Effects / IO / FFI Trust Boundary
```
