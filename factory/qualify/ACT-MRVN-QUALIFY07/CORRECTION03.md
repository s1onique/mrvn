# ACT-MRVN-07-CORRECTION03 — Population + classification reconciliation

## Reviewer concern (verbatim, distilled)

> The substantive correction (CORRECTION02) is right, but the
> authoritative-looking correction document itself contains a stale
> 54-count section.  The later evidence/report correctly say
> 55.  Worse, `43 + 4 + 7 = 54` invites confusion: there is also an
> `AGENT_AUTHORITY_VIOLATION` bucket in the simulator corpus that the
> 2-bucket SEMANTIC_DRIFT line omits.
>
> Change CORRECTION02.md to the canonical 55 / 4-drift / 1-authority-violation
> breakdown.

## Defect

`CORRECTION02.md` lines 98–113 (the "Population reconciliation (54 vs 57)"
section) say:

```text
| Primary candidates (auto + control) | 36 |
| Negative controls (NEG-MRVN07-001, -002) | 2 |
| Simulator candidates (AGENT-MRVN07-001..016) | 16 |
| Total artefacts classified | 54 |
...
43 ROBUST = 29 primary + 14 simulator
7 BEHAVIOR_EVIDENCE_MISMATCH = D:1 + F:2 + H:3 + CTRL-PBREAK:1
1 + 1 = 2 SEMANTIC_DRIFT (1 CTRL-NEG primary + 1 AGENT-MRVN07-003 simulator)
Canonical count: 54 artefacts.
```

This is wrong on three counts:

1. **Primary count is 37, not 36.**  The 37 breaks down as
   33 family refactors (A:7, B:5, C:4, D:1, E:3, F:3, G:3, H:3, I:2, J:2)
   + 4 controls (CTRL-IDENT, CTRL-WS, CTRL-NEG, CTRL-PBREAK) = 37.
   `lab/metrics.json` confirms `primary: 37`.
2. **Total is 55, not 54.**  37 + 16 + 2 = 55.
   `lab/metrics.json` confirms `total: 55`.
3. **SEMANTIC_DRIFT count is 4, not 2.**  The reviewer enumerated:
   1 CTRL-NEG (primary) + 1 AGENT-MRVN07-003 (simulator)
   + 2 NEG-MRVN07-001/002 (negative controls) = 4.
   And there is a 5th bucket missing entirely:
   **1 AGENT_AUTHORITY_VIOLATION** (AGENT-MRVN07-013: caught by the
   law-edit detection, classification = AGENT_AUTHORITY_VIOLATION in
   `candidates/AGENT-MRVN07-013/result.json`).

The defect is localised to the `CORRECTION02.md` reconciliation section.
The experiments themselves are correct: `lab/metrics.json`, REPORT.md §Q1,
and EVIDENCE.md §E.13 all say 55.

## Canonical accounting

```text
Primary candidates (auto + control)        37
  = 33 family refactors
    (A:7, B:5, C:4, D:1, E:3, F:3, G:3, H:3, I:2, J:2)
  + CTRL-IDENT
  + CTRL-WS
  + CTRL-NEG
  + CTRL-PBREAK

Simulator candidates                       16
Negative controls (NEG-MRVN07-001, -002)    2
                                            ──
Total artefacts classified                 55

Outcomes:
ROBUST                                      43
  = 29 primary
  + 14 simulator
SEMANTIC_DRIFT                               4
  = 1 CTRL-NEG (primary)
  + 1 AGENT-MRVN07-003 (simulator, deliberate drift)
  + 2 NEG-MRVN07-001/-002 (negative controls)
BEHAVIOR_EVIDENCE_MISMATCH                   7
  = D:1 (REFACTOR_GENERATOR_FAILURE)
  + F:2 (LANGUAGE_WELL_FORMEDNESS_LIMIT)
  + H:3 (UNSUPPORTED_SYNTAX)
  + CTRL-PBREAK:1 (INTERFACE_BINDING_RENAME)
AGENT_AUTHORITY_VIOLATION                    1
  = AGENT-MRVN07-013 (law-edit attempt caught)
                                            ──
                                            55
```

`43 + 4 + 7 + 1 = 55`. ✓

## Why the 5th bucket matters

`AGENT-MRVN07-013` is a deliberate law-edit attempt by the agent:
the agent's edit touches `LAWS.bend` itself, not the implementation.
The agent-authority guard in `lab/agent_refactor.ts` catches this and
labels it `AGENT_AUTHORITY_VIOLATION` (see
`candidates/AGENT-MRVN07-013/result.json`).  It is neither a
successful refactor nor a semantic drift in the implementation;
it is an **authority violation** — the agent was not permitted to
modify the law book.  Counting it under any of the four
ROBUST/DRIFT/MISMATCH buckets would be misleading.  It is its own
bucket, documented in `EVIDENCE.md §E.7` and the agent-refactor
corpus summary.

## What is unchanged

- `lab/metrics.json` is already correct (`population.total: 55`,
  `proof_break_status: NOT_CONSTRUCTED_FOR_THIS_EXHAUSTIVE_FINITE_PROOF`).
- `REPORT.md` §Q1–Q16 are already correct.
- `EVIDENCE.md` §E.13 is already correct.
- All pipeline runs are unchanged: 18/18 self-tests PASS,
  11/11 authority attacks PASS, 0 regression drift,
  43/43 portable artifacts verify.
- CORRECTION02 substantive correction (Bend-wide overclaim removal,
  bounded OBSERVED_PROPERTY / HYPOTHESIS / PROOF_OF_HYPOTHESIS,
  CTRL-PBREAK → INTERFACE_BINDING_RENAME) is preserved unchanged.

## Verdict (unchanged)

```
MRVN-07 FINITE-KERNEL RESULT        🟢 FULL
  proof survival                    43/43
  canonical proof failures          0/43
  proof churn                       0 LOC

CONTROL-03                          🟡 NOT CONSTRUCTED
BEND-WIDE IMPOSSIBILITY CLAIM       ✅ REMOVED
CTRL-PBREAK TAXONOMY                ✅ FIXED
SIMULATOR CLAIM                     ✅ HONEST
ARTIFACT AUTHORITY                  ✅ FAIL-CLOSED
E2E TAMPER CONTROLS                 ✅ 11/11
POPULATION                          ✅ 55 (after CORRECTION03)

MRVN-07 OVERALL =
  PARTIAL_QUALIFICATION_WITH_STRONG_PROOF_SURVIVAL_RESULT
```

The principal verdict is preserved.  CORRECTION03 repairs the
population/classification accounting in `CORRECTION02.md` AND makes
the lab pipeline regenerate that accounting end-to-end (see
`Files modified (CORRECTION03)` below for the precise scope).

## Scope of CORRECTION03 (precise)

**No authority-kernel change.**  `candidates/REF-MRVN07-CTRL-IDENT/`,
`candidates/REF-MRVN07-CTRL-WS/`, `candidates/REF-MRVN07-CTRL-NEG/`,
`candidates/REF-MRVN07-CTRL-PBREAK/`, `candidates/AGENT-MRVN07-001..016/`,
the negative-controls, the canonical 180/180 baseline, the law book,
and the frozen toolchain closure are all untouched.

**No classifier-semantic change.**  The classifier's behavior for each
candidate class is unchanged.  No new class is introduced; no existing
class is re-mapped.  The 5-bucket accounting in REPORT.md is just a
more honest breakdown of classifications the classifier was already
producing (AGENT-013 has always been classified
`AGENT_AUTHORITY_VIOLATION`; it just wasn't recorded in
`summary.candidates` or `summary.classifications` until now).

**No proof / no law / no toolchain change.**  `bend2/{main,bend,comp,base.bend}`
hashes still match FREEZE.md.

**Lab bookkeeping/orchestration changed (bounded, behavioral, end-to-end consistent):**

- `lab/agent_refactor.ts` — when the agent-authority guard catches
  a law-edit attempt (the `candLaws !== canonicalLaws` branch), the
  pipeline now also pushes the candidate into `summary.candidates`
  AND increments `summary.classifications["AGENT_AUTHORITY_VIOLATION"]`,
  so `len(summary.candidates) === blind_agent_candidates` and the
  5th bucket is visible in `lab/agent_results.json`.
- `lab/run_all.ts` — the orchestrator now includes `agent_refactor`
  and `metrics` as pipeline stages (stages 02 and 04), so a single
  `bun run_all.ts` invocation regenerates the canonical
  population/classification accounting end-to-end.  No new exit
  condition is introduced.
- `lab/metrics.ts` — comment block updated from "per
  ACT-MRVN-07-CORRECTION02" to "per ACT-MRVN-07-CORRECTION03"
  with the canonical 5-bucket comment table.  No behavioural
  change to the metrics computation.

**Scientific result unchanged:**  the 43/43 proof-survival result,
the AGENT_AUTHORITY_VIOLATION-detection result, the 11/11 E2E
authority-attack result, the 18/18 self-test result, the 0-drift
regression-hygiene result, and the principal verdict are all
preserved.

## Files modified (CORRECTION03)

NEW:
- `CORRECTION03.md` (this file)

Documentation:
- `CORRECTION02.md` — the "Population reconciliation (54 vs 57)"
  section is rewritten with the canonical 55-count, 4-drift +
  1-authority-violation breakdown (no other change to CORRECTION02).
- `FREEZE.md` — CORRECTION03 frozen-invariants amendment appended
  after CORRECTION02.
- `REPORT.md` — new `## CORRECTION03` section, classification table
  extended with 5th column, Q13/Q14 updated, Doctrine/Residual Risks
  rewording.
- `EVIDENCE.md` — title retitled, §E.2 Corpus rewritten, §E.15
  retitled, new §E.16 appendix.

Lab bookkeeping (bounded, behavior described above):
- `lab/agent_refactor.ts`
- `lab/run_all.ts`
- `lab/metrics.ts` (comment only)

Evidence copies (refreshed from a clean `run_all.ts` end-to-end run):
- `evidence/agent_results.json`
- `evidence/artifact_index.json`
- `evidence/authority_attacks_result.json`
- `evidence/candidates.json`
- `evidence/metrics.json`
- `evidence/regression_hygiene_result.json`
- `evidence/results.json`

Pipeline re-run for evidence-copy refresh (exit 0; 18/18 self-tests
PASS; 11/11 authority attacks PASS; 0 regression drift; 43/43
portable artifacts verify).
