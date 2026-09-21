# ACT-MRVN-QUALIFY09 — Corrections log

This file documents every review-driven correction applied to ACT-MRVN-QUALIFY09.

## CORRECTION01 — Reviewer closure issues (Factory reviewer)

The Factory reviewer accepted the scientific result (12/12 independent
attempts, 0 proof breaks, 87/0 combined bound) but flagged four closure
issues:

* **P0-01**: `EVIDENCE.md` claimed a "12-attack authority-binding suite"
  while `lab/authority_attacks.ts` only contains 11 individual `record()`
  calls (attacks 1, 2, 3, 4, 5, 6, 7, 7b, 8, 9, 10).  The phrase was
  stale from the MRVN-08 §39 minimum-of-10 wording and the ACT contracts
  allow for exactly the 11 inherited from MRVN-07 CORRECTION03.
* **P0-02**: `REVIEW_MANIFEST.json` claimed to enumerate every durable
  file in MRVN-09, but only listed 115 entries, omitting `agent_input/`,
  `baseline/`, `independent/*/{main,LAWS,PROOF}.bend`, and many
  `lab/*.{ts,json}` files.  In particular the theorem subject, law book,
  proof, and every candidate implementation were not bound by sha256.
* **P1-01**: `regression_hygiene.ts` watched MRVN-04..07 (1337 files) but
  MRVN-08 was checked only by a separate `git diff HEAD -- ACT-MRVN-08`
  at run time, not by the durable hash-watch set.  MRVN-08 is now prior
  authority (MRVN-09 specifically discharges the MRVN-08 promotion
  condition) and should be inside the same gate.
* **P2**: `FREEZE.md`, `EVIDENCE.md`, and `REPORT.md` disagreed about
  `START_TIMESTAMP`; the actual `evidence/start_timestamp.txt` value
  (`2026-09-20T21:58:41Z`) is the authority and was being overridden by
  `FREEZE.md`'s `2026-09-21T00:00:00Z`.

All four are fixed without candidate regeneration, without proof rerun,
and without any change to the scientific result.  See REPORT.md
"Corrections Applied (CORRECTION01)" for the summary table.

### P2 — Timestamp reconciliation

The canonical authority for `START_TIMESTAMP` is the bytes of
`evidence/start_timestamp.txt`.  Currently:

```text
$ cat evidence/start_timestamp.txt
2026-09-20T21:58:41Z
```

Before CORRECTION01:

| File          | Value                       |
|---------------|-----------------------------|
| `evidence/start_timestamp.txt` | `2026-09-20T21:58:41Z` |
| `FREEZE.md`                  | `2026-09-21T00:00:00Z` |
| `EVIDENCE.md`                | `2026-09-20T21:58:41Z` |
| `REPORT.md`                  | `2026-09-20T21:58:41Z` |

After CORRECTION01:

| File          | Value                       |
|---------------|-----------------------------|
| `evidence/start_timestamp.txt` | `2026-09-20T21:58:41Z` (unchanged — authority) |
| `FREEZE.md`                  | `2026-09-20T21:58:41Z` (corrected with annotation: "canonical authority; EVIDENCE.md and REPORT.md derive from this") |
| `EVIDENCE.md`                | `2026-09-20T21:58:41Z` (unchanged — already agreed) |
| `REPORT.md`                  | `2026-09-20T21:58:41Z` (unchanged — already agreed) |

All three documents now derive from the actual file.

### P0-01 — Authority attack count

Before:

```text
`lab/authority_attacks.ts` runs the 12-attack authority-binding suite.

Results: 11 pass, 0 fail
```

Those three lines were internally inconsistent.  The reviewer could not
distinguish whether "12" was a stale phrase, the eleventh attack was
skipped, or the executable was buggy.

After:

```text
`lab/authority_attacks.ts` runs the 11-attack authority-binding suite
inherited from MRVN-07 §CORRECTION03 and MRVN-08 (numbers 1-10, plus
the additional `7b.behavior_all_allow` sub-attack — 11 individual
`record(...)` invocations; 10 mandatory attacks per §39 + 1 sub-attack).
ACT §39 minimum is 10; MRVN-09 executes 11.

Attacks executed: 11 (1, 2, 3, 4, 5, 6, 7, 7b, 8, 9, 10)
Results: 11 pass, 0 fail
```

The phrase "12-attack" was deleted; only the actual 11 attacks are
declared.  No source file in `lab/authority_attacks.ts` was modified;
the executable was already correct.  Only the documentation is fixed.

### P0-02 — Complete durable manifest

Before (115 entries, omitting theorem subject / law book / proof / every
candidate implementation / many lab files):

```text
agent_input/INSTRUCTIONS.md
agent_input/INTENT.md
agent_input/bundle.sha256
agent_input/guide_index.md
agent_input/oracle.json
baseline/INTENT.md
baseline/oracle.json
evidence/metrics.json
evidence/search_metrics.json
evidence/source_commit.txt
evidence/start_timestamp.txt
... (per-candidate: descriptor.json, PROMPT.md, TRANSCRIPT.md, result.json,
     artifact/manifest.json, artifact/evidence/{proof-run.json,
     proof-stdout.txt}) ...
... (lab/*.ts, lab/*.json) ...
```

After (210 entries, the complete durable ACT tree minus the manifest
itself):

The manifest now enumerates:

* `agent_input/{main,LAWS,PROOF}.bend`, plus `INSTRUCTIONS.md`,
  `INTENT.md`, `oracle.json`, `guide_index.md`, `bundle.sha256`
  (8 agent-input files).
* `baseline/{main,LAWS,PROOF}.bend`, `oracle.json`, `INTENT.md`,
  `_canonical_behavior.txt` (5 baseline files).
* `evidence/{metrics.json, search_metrics.json, source_commit.txt,
  start_timestamp.txt}` (4 evidence files).
* `independent/IND-MRVN09-NNN/main.bend`, `LAWS.bend`, `PROOF.bend`,
  `descriptor.json`, `PROMPT.md`, `TRANSCRIPT.md`, `result.json`,
  `_behavior/_dump.bend`, `artifact/manifest.json`,
  `artifact/payload/{main,LAWS,PROOF}.bend`,
  `artifact/evidence/{proof-run.json, proof-stdout.txt}` (12 candidates
  × 14 files = 168 files, plus `independent/_build_001.py`).
* `lab/{classify.ts, gen_behavior_driver.ts, metrics.ts, metrics.json,
  metrics.txt, self_test.ts, authority_attacks.ts,
  build_artifact_index.ts, regression_hygiene.ts,
  regression_authority_drift_test.ts, independence_audit.ts,
  independence_audit_result.json, independence_attack.ts,
  build_independent_candidates.py, artifact_index.json,
  results.json, agent_results.json,
  regression_hygiene_result.json}` (18 lab files).
* The closure documents themselves:
  `FREEZE.md`, `REPORT.md`, `EVIDENCE.md`, `REVIEW_PACKAGE.md`,
  `REVIEW_MANIFEST.json` (5 files; the manifest enumerates 4 of the 5
  — itself is excluded to avoid self-reference, with the rationale
  recorded in `manifest_excludes_reason`).

Total: 210 entries.

The manifest's self-exclusion is the only justified exclusion
(documented in `manifest_excludes_reason`).

### P1-01 — MRVN-08 inside the regression authority gate

Before:

```text
const PRIOR_DIRS = [
  "factory/qualify/ACT-MRVN-QUALIFY04",
  "factory/qualify/ACT-MRVN-QUALIFY05",
  "factory/qualify/ACT-MRVN-QUALIFY06",
  "factory/qualify/ACT-MRVN-QUALIFY07",
];

...

// Negative control mutates only an MRVN-07 manifest.
const TARGET = "factory/qualify/ACT-MRVN-QUALIFY07/candidates/REF-MRVN07-A01/artifact/manifest.json";

...

cmd: ["bun", "factory/qualify/ACT-MRVN-QUALIFY08/lab/regression_hygiene.ts"],
```

(Note: the pre-CORRECTION02 negative control even called the MRVN-08
flavour of the script, which itself only watched MRVN-04..07 — meaning
the negative control was technically exercising the right gate but on
the wrong script invocation.  Both inconsistencies are fixed.)

After:

```text
const PRIOR_DIRS = [
  "factory/qualify/ACT-MRVN-QUALIFY04",
  "factory/qualify/ACT-MRVN-QUALIFY05",
  "factory/qualify/ACT-MRVN-QUALIFY06",
  "factory/qualify/ACT-MRVN-QUALIFY07",
  "factory/qualify/ACT-MRVN-QUALIFY08",
];

...

const TARGETS: Target[] = [
  { path: "...MRVN-07/.../manifest.json", modeLabel: "MRVN-07" },
  { path: "factory/qualify/ACT-MRVN-QUALIFY08/REPORT.md", modeLabel: "MRVN-08" },
];

...

cmd: ["bun", "factory/qualify/ACT-MRVN-QUALIFY09/lab/regression_hygiene.ts"],
```

Also added a fourth sandboxed regression task:

```text
{ name: "MRVN-08 frozen-evidence read", cmd: [
  "bun", "-e",
  "import { readFileSync } from 'node:fs'; const f = 'factory/qualify/ACT-MRVN-QUALIFY08/REPORT.md'; const t = readFileSync(f, 'utf-8'); if (!t.includes('PARTIAL_QUALIFICATION')) { throw new Error('MRVN-08 verdict binding absent'); }; console.log('OK');",
] },
```

This task reads MRVN-08's REPORT.md and asserts that it still contains
the `PARTIAL_QUALIFICATION` verdict binding; if MRVN-08's REPORT is
deleted or corrupted in a way that drops the verdict, the gate fires.

The watched file count is now **2282** (was 1337; the addition is the
MRVN-08 directory).  Drift count remains 0.

### Net effect of CORRECTION01

* Scientific result: unchanged (12/12 independent attempts, 0 proof
  breaks, 87/0 combined bound).
* Gates: all pass; one gate (regression hygiene) is now stronger and
  covers a wider surface (1337 → 2282 files), with two negative
  controls (MRVN-07 + MRVN-08) instead of one.
* Documentation: three timestamps agree; the authority attack count
  matches the executable; the manifest binds every durable file in the
  ACT, with the only exclusion being itself (justified and explicit).
* Out of scope (per the review): no candidate regeneration, no proof
  rerun, no IO/FFI bridge.
