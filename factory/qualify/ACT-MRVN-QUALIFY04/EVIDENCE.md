# ACT-MRVN-QUALIFY04-CORRECTION03 EVIDENCE.md

This document records the corrected artifacts after CORRECTION03,
following the reviewer's third-pass findings:

> The expected-vs-observed contract should be the gate, not a hardcoded
> ban on the class.  Currently `verify.ts` exits non-zero only on
> `AUTHORITY_BINDING_FAILURE`; a regression that produces
> `expected_mismatch > 0` or `unexpected UNRESOLVED > 0` would still
> return 0.
>
> Also: `importedBendFiles()` is a regex scan of the certificate source
> only -- it does not recurse through imported helper modules.  Direct
> imports are bound; transitive imports escape the check.
>
> Absolute-path import resolution rewrites `/foo/bar` to REPO-relative
> instead of retaining the absolute path.

## E.0 -- Act metadata

- **Act ID**: ACT-MRVN-QUALIFY04-CORRECTION03
- **Prior acts**: ACT-MRVN-QUALIFY04, ACT-MRVN-QUALIFY04-CORRECTION01, ACT-MRVN-QUALIFY04-CORRECTION02
- **Runner**: `bun bend2/main.ts <file.bend>` (Bend 2.0.5)
- **Date**: 2026-09-19

## E.1 -- Fail-closed expected-vs-observed contract (P0 fix)

`lab/verify.ts` now exits non-zero on any of:

1. `AUTHORITY_BINDING_FAILURE > 0`
2. `expected_mismatch > 0` (any mutation classified differently than its expected class)
3. `UNRESOLVED > 0` and no mutation has `expected_class = "UNRESOLVED"`
   (UNRESOLVED becomes acceptable only when explicitly declared as an
   expected class -- mirrors Bend's own gate semantics where
   `bend PROOF.bend` fails until claims are discharged but a verifier
   can declare an outcome acceptable)

Otherwise exit 0.

```
$ bun lab/verify.ts
=== ACT-MRVN-QUALIFY04-CORRECTION03 Mutation Classifier ===
...
ID              | Observed                  | Expected               | Match
----------------|---------------------------|------------------------|------
MUT-MRVN04-01   | LAW_REFUTED               | LAW_REFUTED            | YES
MUT-MRVN04-02   | LAW_REFUTED               | LAW_REFUTED            | YES
MUT-MRVN04-03   | LAW_REFUTED               | LAW_REFUTED            | YES
MUT-MRVN04-04   | LAW_REFUTED               | LAW_REFUTED            | YES
MUT-MRVN04-05   | PROOF_TERM_INVALIDATED    | PROOF_TERM_INVALIDATED | YES
MUT-MRVN04-06   | SURVIVED/EQUIVALENT       | SURVIVED/EQUIVALENT    | YES
MUT-MRVN04-07   | LAW_REFUTED               | LAW_REFUTED            | YES
MUT-MRVN04-08   | SURVIVED/NON_EQUIVALENT   | SURVIVED/NON_EQUIVALENT | YES

Counts: {
  "expected_match": 8, "expected_mismatch": 0, "unexpected_unresolved": 0,
  "AUTHORITY_BINDING_FAILURE": 0, "UNRESOLVED": 0,
  ...
}
Gate contract: {
  "exit_1_if_any_of": [
    "AUTHORITY_BINDING_FAILURE > 0",
    "expected_mismatch > 0",
    "UNRESOLVED > 0 and no mutation has expected_class=UNRESOLVED"
  ],
  "any_expected_unresolved": false
}
MRVN-04 qualification PASS: 0 gates failed.
Exit: 0
```

## E.2 -- Recursive import-graph scan with cycle detection (P0 fix)

`importedBendFiles()` is now wrapped by `reachBendFiles()` which does a
DFS traversal of every `.bend` file in the import graph, with cycle
detection via a visited set keyed by absolute path.

```
function reachBendFiles(roots: string[]): string[] {
  const visited = new Set<string>();
  const order: string[] = [];
  const stack: string[] = [];
  for (const r of roots) {
    const abs = resolve(r);
    if (!visited.has(abs)) { visited.add(abs); stack.push(abs); }
  }
  while (stack.length > 0) {
    const cur = stack.pop()!;
    order.push(cur);
    for (const child of importedBendFiles(cur)) {
      if (!visited.has(child)) { visited.add(child); stack.push(child); }
    }
  }
  return order;
}
```

This closes the EQUIV.bend -> helper.bend -> tampered/LAWS.bend attack
vector.  Every reachable `.bend` file is hashed and inspected against
the canonical LAWS.bend / canonical impl / mutated impl bindings.

## E.3 -- Absolute-path import resolution (P0 fix)

`importedBendFiles()` now uses `path.isAbsolute()` to detect absolute
imports and retain their form rather than relativising to REPO:

```
if (isAbsolute(raw)) {
  resolved = raw;
} else {
  resolved = resolve(dir, raw);
}
```

## E.4 -- Tighter law-book matching (P1 fix)

The earlier check used `base === "LAWS.bend"` (exact basename match)
which an attacker could evade by naming their tampered file
`TAMPERED_LAWS.bend`.  The check now matches any file whose basename
ends with `LAWS.bend`:

```
if ((base === "LAWS.bend" || base.endsWith("LAWS.bend")) && h !== lawBookSha) {
  failures.push(`...transitively imports ${path} with sha ${h} (expected canonical LAWS.bend sha ${lawBookSha})`);
}
```

## E.5 -- New nested-import tampering fixture

`mutations/MUT-MRVN04-NESTED/` is a negative-test fixture:

```
mutations/MUT-MRVN04-NESTED/
  main.bend            -- canonical-symmetric mutated main (matches MUT-01)
  LAWS.bend            -- COPY OF canonical LAWS.bend (sha matches)
  PROOF.bend           -- COPY OF canonical PROOF.bend (sha matches)
  TAMPERED_LAWS.bend   -- SHA-different "tampered" law book with extra allow-all rule
  helper.bend          -- imports TAMPERED_LAWS.bend
  COUNTEREXAMPLE.bend  -- imports helper.bend (no direct LAWS.bend import)
```

The expected class is `AUTHORITY_BINDING_FAILURE` because the
recursive import-graph scan must detect TAMPERED_LAWS.bend in the
transitive graph even though `COUNTEREXAMPLE.bend` itself only
directly imports `helper.bend`.

The fixture is gated by `--include-binding-tests`; without that flag
the canonical run is green, with the flag the gate fails as designed.

```
$ bun lab/verify.ts
[canonical run]                 exit 0, MRVN-04 qualification PASS: 0 gates failed.

$ bun lab/verify.ts --include-binding-tests
MUT-MRVN04-NESTED | AUTHORITY_BINDING_FAILURE | AUTHORITY_BINDING_FAILURE | YES
Counts: { ..., "AUTHORITY_BINDING_FAILURE": 1, "expected_mismatch": 0 }
AUTHORITY_BINDING_FAILURE: 1 mutant(s) failed hash binding precondition.
MRVN-04 qualification FAILED: 1 gate(s) failed.
exit 1
```

## E.6 -- End-to-end binding test (NEW file)

`lab/binding_e2e_test.ts` is a new file that spawns `verify.ts` as a
child process and checks its exit code and stdout.  It exercises:

1. Canonical run exits 0 with expected_mismatch=0.
2. Nested-import attack (`--include-binding-tests`) exits 1 with
   AUTHORITY_BINDING_FAILURE present.
3. In-place LAWS.bend tamper exits 1 with AUTHORITY_BINDING_FAILURE.
4. Synthetic expected_mismatch (cases.json patched at runtime to
   declare a wrong expected_class) exits 1 with EXPECTED_MISMATCH
   on stderr.
5. Cycle detection: helper.bend with `import ./helper.bend as Self`
   doesn't infinite-loop; verify terminates and produces exit 1.

```
$ bun lab/binding_e2e_test.ts
  PASS  1.canonical_run_exits_zero: exit=0
  PASS  1.canonical_run_no_mismatch: expected_mismatch=0
  PASS  2.nested_attack_exits_one: exit=1
  PASS  2.nested_attack_classified: AUTHORITY_BINDING_FAILURE present in stdout
  PASS  2.nested_attack_emits_failure_message: stderr contains the failure message
  PASS  3.inplace_laws_tamper_exits_one: exit=1
  PASS  3.inplace_laws_tamper_classified: AUTHORITY_BINDING_FAILURE present in stdout
  PASS  4.expected_mismatch_exits_one: exit=1
  PASS  4.expected_mismatch_emits_failure: stderr contains EXPECTED_MISMATCH
  PASS  5.cycle_detection_terminates: exit=1

Results: 10 pass, 0 fail
```

## E.7 -- Synthetic self-tests retained

`lab/self_test.ts` (14 cases) still passes:

```
$ bun lab/self_test.ts
...
Results: 14 pass, 0 fail
```

## E.8 -- Matrix 180-vs-180 (retained from CORRECTION02)

```
$ bun lab/matrix_compare.ts
BEND_MATRIX_CELLS = 180
TS_MATRIX_CELLS   = 180
DIFF_COUNT        = 0
PASS: matrix.ts matches canonical Bend impl at all 180 cells.
```

## E.9 -- MRVN-01 / MRVN-03 / MRVN-04 regressions

```
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/PROOF.bend
All terms check.
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY03/lifecycle-kernel/PROOF.bend
All terms check.
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY04/authority-kernel/PROOF.bend
All terms check.
```

## E.10 -- CI gate recipe (CORRECTION03)

The reviewer proposed this CI recipe:

```
bun lab/matrix_compare.ts &&
bun lab/verify.ts &&
bun lab/self_test.ts
```

With CORRECTION03:
- `matrix_compare.ts` exits non-zero on any of the 180 cells differing
  from the canonical impl.
- `verify.ts` exits non-zero on any of:
  - AUTHORITY_BINDING_FAILURE > 0
  - expected_mismatch > 0
  - unexpected UNRESOLVED > 0
- `self_test.ts` exits non-zero on any synthetic test failing.

For negative binding enforcement:
```
bun lab/verify.ts --include-binding-tests || echo "binding tests failed as designed"
bun lab/binding_e2e_test.ts
```

The second form runs an end-to-end harness test that *expects* the
gate to fail (proving the gate is wired correctly), then asserts the
opposite shape (`bun lab/binding_e2e_test.ts` returns 0 because every
test inside it ran the verifier, observed its exit code, and matched
the expected fail-closed behaviour).

## E.11 -- Summary of corrections vs CORRECTION02

| Issue | CORRECTION02 | CORRECTION03 |
| --- | --- | --- |
| `expected_mismatch > 0` exit | 0 (wrong) | **1 (fail-closed)** |
| `unexpected UNRESOLVED > 0` exit | 0 (wrong) | **1 (fail-closed)** |
| `expected_class = "UNRESOLVED"` declared by ACT | not supported | **suppresses unexpected-UNRESOLVED exit** |
| Import-graph scan | direct only | **recursive DFS with cycle detection** |
| Absolute-path import | relativised to REPO | **retained as absolute** |
| Tamper-evading filename `TAMPERED_LAWS.bend` | missed by `===` check | **caught by `endsWith("LAWS.bend")`** |
| End-to-end binding test | none | **10/10 binding_e2e_test.ts** |

## E.12 -- Verdict

- **MRVN-04 KERNEL: FULL_QUALIFICATION**
- **MRVN-04 MATRIX: FULL_QUALIFICATION** (180/180 mechanical match)
- **MRVN-04 CLASSIFICATION: FULL_QUALIFICATION** (8/8 expected, 14/14 synthetic, 10/10 e2e)
- **MRVN-04 BYTE BINDING: FULL_QUALIFICATION** (recursive + tamper-name + absolute-path)
- **MRVN-04 REUSABLE VERIFIER: FULL_QUALIFICATION** (fail-closed on expected-vs-observed contract)
- **MRVN-04 OVERALL: FULL_QUALIFICATION (after CORRECTION03, technically frozen)**

(Repository authority remains explicitly absent: the digest is dirty,
all 45 ACT04 files are untracked, and the gate summary says
`state_binding=UNBOUND`.  This document records technical
qualification, not authoritative freeze.)

---

Generated 2026-09-19 by the MRVN-04-CORRECTION03 qualification run.
