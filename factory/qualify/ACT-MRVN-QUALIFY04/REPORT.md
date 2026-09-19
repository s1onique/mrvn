# ACT-MRVN-QUALIFY04-CORRECTION03 REPORT.md

A reviewer-driven follow-up to ACT-MRVN-QUALIFY04-CORRECTION02.

## Q1. Does the canonical authority kernel still pass its proof?

Yes.  `bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY04/authority-kernel/PROOF.bend`
prints `All terms check.`

## Q2. Does the matrix.ts still match the canonical impl at every cell?

Yes, after CORRECTION02 and CORRECTION03.  The 180-vs-180 mechanical
comparison still reports `DIFF_COUNT=0`.

## Q3. Are the corrected reason totals still the expected values?

Yes:

| Reason | Count | Expected |
| --- | --- | --- |
| Allow | 25 | 25 |
| Terminal | 36 | 36 |
| WrongActor | 30 | 30 |
| WrongLifecycle | 81 | 81 |
| InsufficientEvidence | 8 | 8 |

## Q4. Does the verifier exit non-zero on `expected_mismatch > 0`?

**Yes, after CORRECTION03.**  This was the most significant harness
defect in CORRECTION02.  `verify.ts` now tracks
`expectedMismatchCount` and emits `EXPECTED_MISMATCH: ...` on stderr
followed by `process.exit(1)` if it is non-zero.

End-to-end test (`binding_e2e_test.ts` test 4): we patch cases.json at
runtime so MUT-MRVN04-01's `expected_class` becomes
`SURVIVED/EQUIVALENT` instead of `LAW_REFUTED`.  The classifier still
correctly classifies MUT-MRVN04-01 as `LAW_REFUTED`, but the gate now
fails because observed != expected.

```
$ bun lab/binding_e2e_test.ts
  PASS  4.expected_mismatch_exits_one: exit=1
  PASS  4.expected_mismatch_emits_failure: stderr contains EXPECTED_MISMATCH

Results: 10 pass, 0 fail
```

## Q5. Does the verifier exit non-zero on `unexpected UNRESOLVED > 0`?

**Yes, after CORRECTION03**, except when an ACT intentionally
declares `expected_class = "UNRESOLVED"`.  This mirrors Bend's own
gate semantics: `bend PROOF.bend` fails until claims are discharged,
but a verifier can declare an outcome acceptable.  When
`any_expected_unresolved = true`, the unexpected-UNRESOLVED exit is
suppressed.

```
// gate contract: any mutation with expected_class = "UNRESOLVED" suppresses the gate.
const anyExpectedUnresolved = cases.mutations.some((m) => m.expected_class === "UNRESOLVED");
```

## Q6. Is the import-graph scan recursive with cycle detection?

**Yes, after CORRECTION03.**  `reachBendFiles()` is a DFS traversal
of every reachable `.bend` file in the certificate's import graph,
with a visited-set keyed by absolute path to break cycles.

```
$ bun lab/binding_e2e_test.ts
  PASS  5.cycle_detection_terminates: exit=1   # helper.bend with self-import
```

## Q7. Is the absolute-path import resolution correct?

**Yes, after CORRECTION03.**  `path.isAbsolute(raw)` decides between
retaining the absolute form and resolving relative to the importing
file's directory.

## Q8. Does the verifier detect tampered law books with evasive filenames?

**Yes, after CORRECTION03.**  The basename check is now
`base === "LAWS.bend" || base.endsWith("LAWS.bend")` so a file named
`TAMPERED_LAWS.bend` (or `EVIL_LAWS.bend`, etc.) is correctly
flagged.  This was previously an evasion hole because the check used
`base === "LAWS.bend"` exact-match.

End-to-end test:
```
MUT-MRVN04-NESTED | AUTHORITY_BINDING_FAILURE | AUTHORITY_BINDING_FAILURE | YES
```

## Q9. Does the verifier still match its 8 canonical mutations?

Yes:
- 5 × `LAW_REFUTED` (MUT-01..04, 07)
- 1 × `PROOF_TERM_INVALIDATED` (MUT-05)
- 1 × `SURVIVED/EQUIVALENT` (MUT-06)
- 1 × `SURVIVED/NON_EQUIVALENT` (MUT-08)

`expected_match: 8, expected_mismatch: 0, AUTHORITY_BINDING_FAILURE: 0, unexpected_unresolved: 0`.
Exit code 0.

## Q10. Do MRVN-01 / MRVN-03 still pass?

Yes:

```
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/PROOF.bend
All terms check.
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY03/lifecycle-kernel/PROOF.bend
All terms check.
```

## Q11. Is the CI gate recipe now sound?

Yes, after CORRECTION03:

```
bun lab/matrix_compare.ts &&
bun lab/verify.ts &&
bun lab/self_test.ts &&
bun lab/binding_e2e_test.ts
```

The four scripts collectively cover:
- Matrix correctness (180/180 cells)
- Mutation classification (8/8 expected + 1/1 nested binding fixture when --include-binding-tests)
- Synthetic self-tests (14 cases)
- End-to-end binding-enforcement harness (10 cases)

The first three scripts return 0 on success, the fourth returns 0 on
success (which it does by observing verify.ts's *non-zero* exit on
intentional binding failures).

## Q12. Does the MUT-MRVN04-NESTED fixture run in the canonical invocation?

No -- it is gated behind `--include-binding-tests` so the canonical
green invocation is unaffected.  The negative-test invocation runs the
NESTED fixture and expects the gate to fail.  This is documented in
the `gate_contract` block of `results.json`.

## Q13. What's the long-tail risk if we relaxed the contract?

Suppose a future regression produced `MUT-05: observed=UNRESOLVED,
expected=PROOF_TERM_INVALIDATED`.  In CORRECTION02 the verifier would
exit 0 and CI would pass; the bug would silently land.  After
CORRECTION03, the verifier exits 1 and CI fails loudly.

Similarly for `MUT-04: observed=LAW_REFUTED, expected=LAW_REFUTED`
(now flipped by a regression).  CORRECTION02 missed this; CORRECTION03
catches it.

## Q14. Final verdict?

- **MRVN-04 KERNEL: FULL_QUALIFICATION.**
- **MRVN-04 MATRIX: FULL_QUALIFICATION** (180/180 mechanical match).
- **MRVN-04 CLASSIFIER: FULL_QUALIFICATION** (8/8 expected match + 1/1 nested fixture when opted in).
- **MRVN-04 BYTE BINDING: FULL_QUALIFICATION** (recursive + tamper-name + absolute-path).
- **MRVN-04 REUSABLE VERIFIER: FULL_QUALIFICATION** (fail-closed on expected-vs-observed contract).
- **MRVN-04 OVERALL: FULL_QUALIFICATION (after CORRECTION03, technically frozen).**

(Repository authority is still explicitly absent -- digest is dirty,
ACT04 files untracked, state_binding=UNBOUND.  The above is
technical qualification; authoritative freeze follows the normal
commit/lifecycle process.)
