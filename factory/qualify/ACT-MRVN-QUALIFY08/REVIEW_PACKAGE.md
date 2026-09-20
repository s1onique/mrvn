# REVIEW_PACKAGE — ACT-MRVN-QUALIFY08-CORRECTION03

This document is the single-source review package for ACT-MRVN-QUALIFY08
after CORRECTION03 (textual reconciliation of EVIDENCE.md E.5) was applied.
ACT-MRVN-08 lives entirely under the untracked directory
`factory/qualify/ACT-MRVN-QUALIFY08/`, so any commit-range digest will
miss it. This file names every MRVN-08 file with its sha256 and reproduction
commands.

## R0 — Verdict and taxonomy (CORRECTION02; CORRECTION03 adds P1 textual reconciliation only)

```text
PRINCIPAL_VERDICT:        PARTIAL_QUALIFICATION_NO_PROOF_BREAK_FOUND_WITHIN_SEARCH_BOUND
                         / INDEPENDENT_AGENT_REPLICATION_REQUIRED

family_taxonomy (CORRECTION02 three-tier):
  SYNTHETIC_GENERATOR    = J-SYNTHETIC-GENERATOR     12/12 CPS
  LIVE_SAME_AGENT        = K-LIVE-SAME-AGENT         12/12 CPS
  LIVE_INDEPENDENT_AGENT = K-LIVE-INDEPENDENT-AGENT   0/12 (MISSING, required for FULL_QUALIFICATION)
```

Promotion condition:

```text
FULL_QUALIFICATION_NO_PROOF_BREAK_FOUND_WITHIN_SEARCH_BOUND
requires:
  K-LIVE-INDEPENDENT-AGENT.attempts >= 12
  proof_break_count        = 0
  CPS = 100% of valid candidates
  durable_drift            = 0
  e2e_drift_self_test      = PASS
```

## R1 — Top-level MRVN-08 files (sha256)

- `CORRECTIONS.md`  sha256=e8cbcc088c176635cec6ec31a35b5d6236716f592a1741dabadf6e25172960fc  size=5791
- `EVIDENCE.md`  sha256=b671607568b51d0aafe42f3bb9d42e2a517a9bb541cc64d28a08c39eb792abd7  size=16200
- `FREEZE.md`  sha256=08ca15f300fae49a335a0ae748f86e4a5e3a8a3cd67dd82443e178a799297b6e  size=5265
- `REPORT.md`  sha256=3ea8fd06a7147cd7c525c67f8c97289fb31cc13066423b4b950c3ffd5a21b491  size=20452
- `REVIEW_PACKAGE.md`  sha256=700a9b30f722fbbe6d2e66016276269cc4996e53e2302081e772dd6ec4641b5f  size=12567

## R2 — Baseline files (sha256)

- `baseline/INTENT.md`  sha256=1e21d2f56e2d587ef08499a0f58aac47960a6d5c5b4b899a39e972e92985d274  size=5063
- `baseline/LAWS.bend`  sha256=0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8  size=12100
- `baseline/PROOF.bend`  sha256=c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8  size=20209
- `baseline/_behavior_dump.bend`  sha256=c2d0ac338843d2e9d0a11cf48b01f8deb0ce69a65dbe631a1d79fe69157ebddc  size=28288
- `baseline/_canonical_behavior.txt`  sha256=e44f37c531a7e6893445e1ff2e640f3e320ebec9f811fb52628c1b430f8f69c7  size=8139
- `baseline/main.bend`  sha256=eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb  size=10576
- `baseline/oracle.json`  sha256=a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9  size=45313

## R3 — Lab files (sha256)

- `lab/artifact_index.json`  sha256=5ae493ad4936be9a1abaaf6b550820bc49e390860d39553b4072adffcc671b68  size=34345
- `lab/authority_attacks.ts`  sha256=067f74dc2786c183de61626c7f5f9d86b5bea42bf0e567ee15169365e49dfd41  size=10665
- `lab/authority_attacks_result.json`  sha256=9a19e1df0cd8f58fabc14590124d4f158eb8812b5b4904200da365255fa54e3d  size=2205
- `lab/build_artifact_index.ts`  sha256=ff37953abaaee7751658560c8ac53c3a528b41faa0a93aa32fb430ec66eb7f00  size=2547
- `lab/candidates.json`  sha256=1593ff4284f73394c885c1be63c4e60d7cd36431e3a9502e9916deea36af11ed  size=19609
- `lab/classify.ts`  sha256=e0dd4bb36567289947a24cecf3bbd1ac954e2221fefbd95eadcd882fbbc182da  size=17248
- `lab/gen_behavior_driver.ts`  sha256=17b9fbf374622c3c500fbf135474416669b653153da8007ffd8d36900498b55e  size=4194
- `lab/gen_candidates.ts`  sha256=c3d26cbc39834804148d31c6cb8e8371e6f97d19ae45b6dee296fd62dcbc30d0  size=46549
- `lab/metrics.json`  sha256=cc00dc34a9b69253129342749d738f0101007c865fa09d00bf9ba6faf7b36ef3  size=5801
- `lab/metrics.ts`  sha256=0de8f5c859482cbd9276409c921c19fcbae9ad04c99a90349de813618dcdb31c  size=5817
- `lab/regression_authority_drift_test.ts`  sha256=fc08ed6e1b47ea1d50dca7c80bd6e831e5d2681f02327ecdfdbfbd4835078ce1  size=3038
- `lab/regression_hygiene.ts`  sha256=6a69947fd0279b3d2e0a99e6188ee0490a1dda11b99cafd91546ad513f4e11e5  size=6849
- `lab/regression_hygiene_result.json`  sha256=b4881b42d5526ab29bdbc2b1798ac2d87aba6ed8ea887888bd22f857120272da  size=759
- `lab/results.json`  sha256=2ba9d48b006fbf2a212672dc2aa3472469402c4cf5d261dc1c22a44b30f6bac2  size=24585
- `lab/run_all.ts`  sha256=c5e7f8af3476e5c14903f0404f853df09144aa47fba5c1e77cd8f63ae9e18db4  size=2233
- `lab/run_classifications.ts`  sha256=5ae355b1aeb2fbd80aff448980bb0d045b7912176ee9d49c0548c82cedd6aff2  size=5728
- `lab/self_test.ts`  sha256=0d880f6868306c9f87a8dde1586a5ba39344f6209e5f0e23c710c25ba6ae89e8  size=6678

## R4 — Candidate families (counts)

```text
A                            7  e.g. A-001-id-decision
B                            7  e.g. B-001-involution-id
C                            6  e.g. C-001-lifecycle-first
D                            6  e.g. D-001-is-X-predicates
E                            6  e.g. E-001-permit-reject
F                            4  e.g. F-001-actor-index
G                            6  e.g. G-001-list-iter
H                            6  e.g. H-001-wrapper-with-lemma
I                            4  e.g. I-001-recursive-180
J                           12  e.g. J-SYN-001-helper-rename
K                           12  e.g. K-01-thunked-work
```

## R5 — K-LIVE-SAME-AGENT descriptors (each authored by this Cline instance)

Source: `candidates/K-NN-*/descriptor.json` + `result.json`.

```text
candidate_id                         classification                  transformation
------------------------------------------------------------------------------------------
K-01-thunked-work                      CANONICAL_PROOF_SURVIVED       thunked Unit arg
K-02-actor-first-dispatch              CANONICAL_PROOF_SURVIVED       actor-first dispatch
K-03-recursive-evidence-helper         CANONICAL_PROOF_SURVIVED       Nat recursion
K-04-decision-identity-pipe            CANONICAL_PROOF_SURVIVED       identity pipe
K-05-decision-via-tag                  CANONICAL_PROOF_SURVIVED       tag-then-decision
K-06-indirect-cap-match                CANONICAL_PROOF_SURVIVED       indirect cap match
K-07-through-helper                    CANONICAL_PROOF_SURVIVED       through_helper round-trip
K-08-deeper-helper-chain               CANONICAL_PROOF_SURVIVED       2-level indirection
K-09-match-tag-only                    CANONICAL_PROOF_SURVIVED       paren-wrap match
K-10-cap-case-swap                     CANONICAL_PROOF_SURVIVED       cap-case order swap
K-11-non-closed-pullout                CANONICAL_PROOF_SURVIVED       non-closed pullout
K-12-helper-pipeline                   CANONICAL_PROOF_SURVIVED       dispatch pipeline
```

All 12 K-LIVE-SAME-AGENT candidates classified as CANONICAL_PROOF_SURVIVED.

## R6 — J-SYNTHETIC-GENERATOR descriptors (deterministic passthrough)

Source: `candidates/J-SYN-NNN-*/descriptor.json` + `result.json`.

```text
candidate_id                         classification                  transformation
------------------------------------------------------------------------------------------
J-SYN-001-helper-rename                CANONICAL_PROOF_SURVIVED       helper signatures rename
J-SYN-002-tag-encoding                 CANONICAL_PROOF_SURVIVED       match-on-tag encoding
J-SYN-003-single-tuple                 CANONICAL_PROOF_SURVIVED       single 4-tuple helper
J-SYN-004-depth-counter                CANONICAL_PROOF_SURVIVED       Nat recursion depth
J-SYN-005-match-bool                   CANONICAL_PROOF_SURVIVED       match-on-bool
J-SYN-006-allow-tag-nat                CANONICAL_PROOF_SURVIVED       Allow tag as Nat
J-SYN-007-evidence-first               CANONICAL_PROOF_SURVIVED       evidence-first then capability
J-SYN-008-nested-no-cap                CANONICAL_PROOF_SURVIVED       3-level nested without capability
J-SYN-009-global-closed                CANONICAL_PROOF_SURVIVED       global Closed check
J-SYN-010-bool-fn                      CANONICAL_PROOF_SURVIVED       finite boolean function
J-SYN-011-tuple-internal               CANONICAL_PROOF_SURVIVED       (allowflag, reason-tag) tuple
J-SYN-012-lookup-table                 CANONICAL_PROOF_SURVIVED       5x3 lookup table per cap
```

All 12 J-SYNTHETIC-GENERATOR candidates classified as CANONICAL_PROOF_SURVIVED.

## R7 — Micro laboratory (sha256)

- `micro_lab/MICRO-DRIFT-01-FAIL.bend`  sha256=cb51708fa47f0918b119f259ac1fde7687d25f2b83d964a175dc9a3a949beeb6  size=1229
- `micro_lab/MICRO-DRIFT-01.bend`  sha256=14e4f9373ee1533931cfccc04d9ec7e2424a07d24ee4f5bbb0524766c46489ad  size=1060
- `micro_lab/MICRO-PBREAK-01-CANON.bend`  sha256=ff9b8570e8561728a78f1b4d7e0b056888a9300726085f0d75d9dac4e51c7afe  size=914
- `micro_lab/MICRO-PBREAK-01-NAIVE.bend`  sha256=8a9a84d19e34525cdb8d75b3a54af3670b7623b912fe289989d4766f2d0eceb1  size=858
- `micro_lab/MICRO-PBREAK-01-REPROOF.bend`  sha256=b073c4f65f7541c1d153ff5364d5997976fb98d0da0d0768a496157930766a50  size=1144
- `micro_lab/MICRO-ROBUST-01.bend`  sha256=7147dbec81b1a8e441c0fc112b890a9f623e9b814089425d290143dba334ac6e  size=803

## R8 — Evidence (sha256)

- `evidence/metrics.json`  sha256=e47457741f256312bdcfb2946bf51c70e224305afac1186c80380b802d65d79e  size=5801
- `evidence/micro_lab.txt`  sha256=519d6038b1b0aabd97e4b71bf56e33cc9a06566e957e83d66edaec5e7d758da0  size=775
- `evidence/search_metrics.json`  sha256=4b7a5164bd32a60ae6a375d10d2d0a017f63df86218772fe5f4425ee63058842  size=1689
- `evidence/source_commit.txt`  sha256=ce276259ad82375cb2dd4b808e2d1b5c788f0a8c8a7ab3f27a0b0887b7904bcb  size=41

## R9 — Reproduction commands

Run from repository root (`/Volumes/UserData/Users/chistyakov/Projects/SPbNIX/mrvn`):

```bash
# 1. Verify CORRECTION03 content (textual reconciliation of E.5)
grep -n "CORRECTION03" factory/qualify/ACT-MRVN-QUALIFY08/CORRECTIONS.md
grep -n "HISTORICAL / PRE-CORRECTION01" factory/qualify/ACT-MRVN-QUALIFY08/EVIDENCE.md
sed -n "99,135p" factory/qualify/ACT-MRVN-QUALIFY08/EVIDENCE.md

# 2. Verify verdict (CORRECTION02)
grep INDEPENDENT_AGENT_REPLICATION_REQUIRED \
  factory/qualify/ACT-MRVN-QUALIFY08/EVIDENCE.md
grep INDEPENDENT_AGENT_REPLICATION_REQUIRED \
  factory/qualify/ACT-MRVN-QUALIFY08/FREEZE.md

# 3. Verify the strengthened regression hygiene gate (CORRECTION01)
bun factory/qualify/ACT-MRVN-QUALIFY08/lab/regression_hygiene.ts
#   expected last lines:
#     Durable prior-ACT files watched: 1337
#     Drift count: 0
#     MRVN-08 regression hygiene: 0 drift detected across 1337-file MRVN-04..07 evidence.

# 4. Verify the E2E drift self-test fires correctly on mutation
bun factory/qualify/ACT-MRVN-QUALIFY08/lab/regression_authority_drift_test.ts
#   expected: PASS (gate correctly detected mutation)

# 5. Verify prior-ACT immutability
git diff --exit-code HEAD -- \
  factory/qualify/ACT-MRVN-QUALIFY04 \
  factory/qualify/ACT-MRVN-QUALIFY05 \
  factory/qualify/ACT-MRVN-QUALIFY06 \
  factory/qualify/ACT-MRVN-QUALIFY07
#   expected: silent exit 0 (no drift)

# 6. Re-run aggregate classification
bun factory/qualify/ACT-MRVN-QUALIFY08/lab/run_all.ts
cat factory/qualify/ACT-MRVN-QUALIFY08/lab/results.json | python3 -m json.tool

# 7. Verify self_test and authority_attacks
bun factory/qualify/ACT-MRVN-QUALIFY08/lab/self_test.ts
#   expected: 16 pass, 0 fail
bun factory/qualify/ACT-MRVN-QUALIFY08/lab/authority_attacks.ts
#   expected: 11 pass, 0 fail

# 8. Verify CORRECTION02 taxonomy is the only one present
grep -rn "K-LIVE-CLINEMM" factory/qualify/ACT-MRVN-QUALIFY08 | head -3
#   expected: empty (K-LIVE-CLINEMM is fully renamed to K-LIVE-SAME-AGENT)
```

## R10 — Pre-final verification

```text
MRVN-08 file count:           945
Prior ACT durable files:      1337 (git ls-files ACT-MRVN-{04..07})
git diff prior-ACT:           (empty)
Total candidates:             76
CPS count:                    75
SEMANTIC_DRIFT count:         1
EXTENSIONAL_PROOF_BREAK:      0
```

## R11 — Promotion gate status (what MRVN-09 must close)

```text
Promotion gate                              Status      Path
--------------------------------------------------------------------------------
proof_break_count = 0                       PASS        lab/results.json
CPS = 100% of valid candidates              PASS        75/75
durable_drift = 0                           PASS        lab/regression_hygiene.ts
e2e_drift_self_test = PASS                  PASS        lab/regression_authority_drift_test.ts
K-LIVE-INDEPENDENT-AGENT.attempts >= 12      FAIL 0/12   MRVN-09 (next ACT)
```

## R12 — CORRECTION03 closure audit

```text
audit_point                                         status
------------------------------------------------------------
EVIDENCE.md E.5 stale 64-attempt block present       YES (now wrapped in [HISTORICAL / PRE-CORRECTION01 / NON-AUTHORITATIVE])
EVIDENCE.md E.5 authoritative 76-attempt block       YES (three-tier taxonomy table)
CORRECTIONS.md CORRECTION03 entry present            YES
REVIEW_PACKAGE.md regenerated for new EVIDENCE/CORRECTIONS sha256  YES
Lab, baseline, candidates, micro_lab, evidence       UNCHANGED (CORRECTION03 is purely textual)
Frozen authority sha256 (canonical_impl, laws, proof, oracle) UNCHANGED
All 76 candidate sha256s                             UNCHANGED
prior-ACT git diff                                   EMPTY (0 lines)
durable_drift on 1337-file surface                   0
e2e_drift_self_test                                  PASS
```

