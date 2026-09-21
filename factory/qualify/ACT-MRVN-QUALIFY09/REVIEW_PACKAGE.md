# ACT-MRVN-QUALIFY09 Review Package

This file enumerates every durable file in MRVN-09 with its sha256,
sized for reviewer inspection without dependency on the digest tool.

The machine-readable equivalent is `REVIEW_MANIFEST.json`.

## Reproduction commands

```text
# 1. Confirm frozen authority identities
shasum -a 256 factory/qualify/ACT-MRVN-QUALIFY09/baseline/{main,LAWS,PROOF}.bend
shasum -a 256 factory/qualify/ACT-MRVN-QUALIFY09/baseline/oracle.json
shasum -a 256 bend2/{main,bend,comp}.ts bend2/base.bend

# 2. Confirm agent input bundle has no MRVN-08 candidate exposure
PATH=/opt/homebrew/bin:$PATH \
  bun factory/qualify/ACT-MRVN-QUALIFY09/lab/independence_audit.ts

# 3. Confirm E2E contamination attack fails correctly
PATH=/opt/homebrew/bin:$PATH \
  bun factory/qualify/ACT-MRVN-QUALIFY09/lab/independence_attack.ts

# 4. Classify all 12 candidates
for n in 001 002 003 004 005 006 007 008 009 010 011 012; do
  PATH=/opt/homebrew/bin:$PATH \
    bun factory/qualify/ACT-MRVN-QUALIFY09/lab/classify.ts \
      --candidate factory/qualify/ACT-MRVN-QUALIFY09/independent/IND-MRVN09-$n \
      --canonical-kernel factory/qualify/ACT-MRVN-QUALIFY09/baseline/main.bend \
      --oracle factory/qualify/ACT-MRVN-QUALIFY09/baseline/oracle.json \
      --bend-runner bend2/main.ts \
      --results-out /tmp/IND-MRVN09-$n.json
done

# 5. Run self-tests, authority attacks, regression hygiene, build metrics
PATH=/opt/homebrew/bin:$PATH \
  bun factory/qualify/ACT-MRVN-QUALIFY09/lab/self_test.ts
PATH=/opt/homebrew/bin:$PATH \
  bun factory/qualify/ACT-MRVN-QUALIFY09/lab/authority_attacks.ts
PATH=/opt/homebrew/bin:$PATH \
  bun factory/qualify/ACT-MRVN-QUALIFY09/lab/regression_hygiene.ts
PATH=/opt/homebrew/bin:$PATH \
  bun factory/qualify/ACT-MRVN-QUALIFY09/lab/build_artifact_index.ts
PATH=/opt/homebrew/bin:$PATH \
  bun factory/qualify/ACT-MRVN-QUALIFY09/lab/metrics.ts

# 6. Negative control: regression authority drift test
PATH=/opt/homebrew/bin:$PATH \
  bun factory/qualify/ACT-MRVN-QUALIFY09/lab/regression_authority_drift_test.ts
```

## File enumeration

`REVIEW_MANIFEST.json` enumerates every durable file in MRVN-09
(211 entries, excluding the manifest itself to avoid self-reference).
That count includes:

* The canonical theorem subject / law book / proof at
  `agent_input/{main,LAWS,PROOF}.bend` and at
  `baseline/{main,LAWS,PROOF}.bend` — the inputs the agent saw and the
  authority baseline the classifier runs against.
* Every candidate's `main.bend`, `LAWS.bend`, `PROOF.bend`,
  `descriptor.json`, `PROMPT.md`, `TRANSCRIPT.md`, `result.json` at
  `independent/IND-MRVN09-NNN/`.
* Every candidate's portable artifact at
  `independent/IND-MRVN09-NNN/artifact/{manifest.json, payload/*.bend,
  evidence/*}`.
* Every durable lab file at `lab/*.{ts,json}` plus
  `lab/{classify,authority_attacks,regression_hygiene,...}.ts` and
  their JSON result/audit artefacts.
* The closure documents `FREEZE.md`, `REPORT.md`, `EVIDENCE.md`,
  `REVIEW_PACKAGE.md`, `REVIEW_MANIFEST.json`, `CORRECTIONS.md`.

The manifest's own omission is the only justified exclusion (the
manifest enumerates every durable file in the ACT except itself;
the omission is noted in `manifest_excludes_reason`).
