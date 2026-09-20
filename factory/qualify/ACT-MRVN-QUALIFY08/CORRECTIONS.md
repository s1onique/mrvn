# ACT-MRVN-QUALIFY08 — Corrections log

This file documents every review-driven correction applied to ACT-MRVN-QUALIFY08.

## CORRECTION02 — Reviewer taxonomy & verdict (Factory reviewer, MRVN-08-CORRECTION01 review)

The Factory reviewer accepted CORRECTION01's two P0 fixes by design
but requested:

1. **Taxonomy refinement.** "LIVE" describes generation mechanism,
   not independence. The useful taxonomy is:
   ```text
   SYNTHETIC_GENERATOR
   LIVE_SAME_AGENT
   LIVE_INDEPENDENT_AGENT
   ```
   Therefore `K-LIVE-CLINEMM` is renamed to **`K-LIVE-SAME-AGENT`**.
   `J-SYNTHETIC` is renamed to **`J-SYNTHETIC-GENERATOR`** (the
   generator is the deterministic `gen_candidates.ts` pipeline, not
   an agent at all). The promotion condition becomes mechanically
   obvious:
   ```text
   FULL_QUALIFICATION_NO_PROOF_BREAK_FOUND_WITHIN_SEARCH_BOUND
   requires:
     LIVE_INDEPENDENT_AGENT.attempts >= 12
   ```

2. **Verdict update.** The PARTIAL suffix is changed from
   `..._IN_SYNTHETIC_SEARCH` to
   `..._INDEPENDENT_AGENT_REPLICATION_REQUIRED`, because after K
   the search is no longer purely synthetic — it includes 12
   LIVE_SAME_AGENT attempts. The reason for PARTIAL is now lack of
   independent-agent replication, not lack of live work.

3. **Evidence binding.** The previous digest range (`HEAD~1..HEAD`)
   exposed the MRVN-07 commit, not MRVN-08. CORRECTION02 produces
   a dedicated `REVIEW_PACKAGE.md` that names every file, its
   sha256, and the expected reproduction commands, so the reviewer
   can independently inspect MRVN-08 content without depending on
   the digest tool.

This file also retains the legacy CORRECTION01 defect-correction
content (Defect 1 / Defect 2 below).

## CORRECTION03 — P1 closure hygiene: EVIDENCE.md E.5 stale taxonomy (Factory reviewer, MRVN-08-CORRECTION02 review)

After CORRECTION02 was applied, the Factory reviewer noted that
`EVIDENCE.md` section E.5 still contained the pre-CORRECTION01 corpus
manifest: 64-attempt JSON with `"J", "live_same_agent_adversarial"`,
which the new taxonomy explicitly supersedes
(`J-SYNTHETIC-GENERATOR` / `K-LIVE-SAME-AGENT` / `K-LIVE-INDEPENDENT-AGENT`).

Because `EVIDENCE.md` is sha256-bound in the review package, leaving the
stale block created two textual authorities inside a single
hash-bound document. The reviewer classified this as **P1 closure
hygiene** (not P0) — no experimental contradiction, just textual
reconciliation before technical freeze.

### Changes

1. **EVIDENCE.md E.5 rewritten** as the CORRECTION02 three-tier
   authoritative corpus (76 attempts, J-SYNTHETIC-GENERATOR 12/12,
   K-LIVE-SAME-AGENT 12/12, K-LIVE-INDEPENDENT-AGENT 0/12 MISSING).
2. **Stale 64-attempt JSON retained** but explicitly marked
   `[HISTORICAL / PRE-CORRECTION01 / NON-AUTHORITATIVE]` with a
   pointer back to the authoritative table.
3. **No code, lab, or micro_lab changes** — CORRECTION03 is purely
   textual. The frozen authority sha256 (`canonical_impl`,
   `canonical_laws`, `canonical_proof`, `intent_oracle`) and all
   76 candidate sha256s are unchanged.
4. **`REVIEW_PACKAGE.md` regenerated** to pick up the new EVIDENCE.md
   sha256. All other shas unchanged.



This file records the two FRONTEND_LIMIT defects that surfaced during
candidate generation and how they were addressed.

## Defect 1: A-004-id-deep forward-reference ordering

Initial implementation in `lab/gen_candidates.ts::a004_build` declared
`id_decision` BEFORE `id_decision_step2`:

```text
def id_decision(d: Decision) -> Decision:
  id_decision_step2(d)
def id_decision_step2(d: Decision) -> Decision:
  match d:
    ...
```

Bend rejected with `expected: a defined name; observed:
id_decision_step2`, because top-level functions must be declared in
order. Fixed by reordering the helper emissions so
`id_decision_step2` is emitted first, then `id_decision`.

After the fix: `A-004-id-deep` classifies as `CANONICAL_PROOF_SURVIVED`
(extensionally equal to canonical; canonical PROOF.bend passes
because Bend's SNF fully reduces the 2-level indirection on concrete
inputs).

## Defect 2: B-NEG-drift-one-cell regex ordering

Initial implementation in `lab/gen_candidates.ts::b_neg_drift` used a
global regex replacement that matched multiple `case Lifecycle.Closed`
occurrences in the kernel:

```text
return text.replace(
  /case Lifecycle.Closed\{\}: Decision.Deny\{DenyReason.Terminal\{\}\}/,
  `case Lifecycle.Draft{}:  Decision.Deny{DenyReason.WrongLifecycle{}}`)
```

This produced a candidate where multiple `case Lifecycle.Draft{}` arms
appeared (once legitimately, once via this substitution), making the
match non-exhaustive. Bend rejected with `expected: cases for
Lifecycle.Closed; observed: {}`.

Fixed by using `indexOf` instead of a global regex replacement,
limiting the substitution to the first occurrence — i.e. the
`Agent/Closed` cell in `work_decision`:

```text
const orig = `case Lifecycle.Active{}: Decision.Allow{}`;
const repl = `case Lifecycle.Active{}: Decision.Deny{DenyReason.WrongLifecycle{}}`;
const idx = text.indexOf(orig);
if (idx < 0) return text;
return text.slice(0, idx) + repl + text.slice(idx + orig.length);
```

After the fix: `B-NEG-drift-one-cell` classifies as `SEMANTIC_DRIFT`
(extensionally different from canonical by exactly one cell).

## Per-failure observations

```text
Run 1 (initial):
  A-004-id-deep              FRONTEND_LIMIT (forward-ref)
  B-NEG-drift-one-cell       FRONTEND_LIMIT (duplicate match arm)

Run 2 (after fixes):
  A-004-id-deep              CANONICAL_PROOF_SURVIVED
  B-NEG-drift-one-cell       SEMANTIC_DRIFT

Both defects are addressed in `gen_candidates.ts` and the final
`lab/results.json` shows 0 FRONTEND_LIMIT regressions across 64
candidates (run after fixes, captured in `evidence/search_metrics.json`).
