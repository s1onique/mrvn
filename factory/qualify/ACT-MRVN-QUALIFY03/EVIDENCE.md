# ACT-MRVN-QUALIFY03 EVIDENCE

## E.0. Files (final SHA256)

```
factory/qualify/ACT-MRVN-QUALIFY03/lifecycle-kernel/main.bend   eef7865f363a3afe5a87814e4cda78038d8292f0ee6439484b5291c2590d6338
factory/qualify/ACT-MRVN-QUALIFY03/lifecycle-kernel/LAWS.bend   96fbf1a0600dc156338c348082a14c6817946f7d4fe34781a03ebedadb93110a
factory/qualify/ACT-MRVN-QUALIFY03/lifecycle-kernel/PROOF.bend  eeabe34404877ae2ce4eb046d4f3a52256a43dc5ef4231fc709019f5f7fb9eae
```

Probe fixture (refreshed to strengthened 13-law spec; see §E.8.1):

```
factory/qualify/ACT-MRVN-QUALIFY03/spec_gap_probes/probe_collapsed_matches/LAWS.bend   96fbf1a0600dc156338c348082a14c6817946f7d4fe34781a03ebedadb93110a
factory/qualify/ACT-MRVN-QUALIFY03/spec_gap_probes/probe_collapsed_matches/PROOF.bend  3ef131e0944b5d3ef2ece613b1f87d8a224e926224ac6c787ff737c29df4cdf9
factory/qualify/ACT-MRVN-QUALIFY03/spec_gap_probes/probe_collapsed_matches/main.bend   6e00d6d9829fc3c49f1fcab2449116829767c4ac970ca4314fba8409bf7685af
```

Note: probe `LAWS.bend` is byte-identical to canonical `LAWS.bend`
(`diff` is empty). Probe `PROOF.bend` differs only in the
LAW-004b section's commentary (3 lines of explanation about
the collapsed-match impl).

Live runtime transcripts (re-captured under
`bun 1.3.14 / node v26.0.0`, `mrvn` working tree on `main`;
see §E.7, §E.8.2, §E.9):

```
factory/qualify/ACT-MRVN-QUALIFY03/evidence/runtime_canonical_PROOF.txt        fa1427b208ec4b5720b9af82358ade07016aa025f2f3aa8404713c951351932f
factory/qualify/ACT-MRVN-QUALIFY03/evidence/runtime_mrvn01_regression.txt      fa1427b208ec4b5720b9af82358ade07016aa025f2f3aa8404713c951351932f
factory/qualify/ACT-MRVN-QUALIFY03/evidence/diff/step_equiv.txt                f7d4d0825bd31176ca90109e1330479ae7d2d6aa57cacb205a9cf91e67bd6a6d
factory/qualify/ACT-MRVN-QUALIFY03/spec_gap_probes/probe_collapsed_matches/output.txt   fa1427b208ec4b5720b9af82358ade07016aa025f2f3aa8404713c951351932f
```

(The three "All terms check." transcripts hash identically by
content. The step_equiv transcript is a distinct
"step_equiv: 25/25 cells proved" content block.)

(LAWS.bend and PROOF.bend updated for ACT-MRVN-QUALIFY03-CORRECTION01:
strengthened LAW-004 to LAW-004b with explicit acceptance-authority
assertion.  See §E.13.)

## E.1. PROOF.bend has 0 book holes

```
$ grep -c '?TODO' factory/qualify/ACT-MRVN-QUALIFY03/lifecycle-kernel/PROOF.bend
0
```

## E.2. PROOF.bend runs and discharges all 13 laws (8 mandatory + 3 essential + 2 acceptance-authority)

```
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY03/lifecycle-kernel/PROOF.bend
All terms check.
---EXIT: 0
```

## E.3. main.bend runs and prints `State.Draft{}`

```
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY03/lifecycle-kernel/main.bend
State.Draft{}
---EXIT: 0
```

## E.4. Local 5x5 transition matrix (25 cells)

Tag encoding: 1=Draft, 2=Active, 3=Halted, 4=Frozen, 5=Closed.

```
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY03/evidence/replay_matrix/local_25_matrix.bend
2 1 1 4 1   2 3 2 4 2   3 3 2 4 3   4 4 4 4 5   5 5 5 5 5
```

Rows (State), Columns (Activate, Halt, Resume, Freeze, Close):

| | Activate | Halt | Resume | Freeze | Close |
|-|----------|------|--------|--------|-------|
| Draft  | 2 (Active) | 1 (Draft) | 1 (Draft) | 4 (Frozen) | 1 (Draft) |
| Active | 2 (Active) | 3 (Halted) | 2 (Active) | 4 (Frozen) | 2 (Active) |
| Halted | 3 (Halted) | 3 (Halted) | 2 (Active) | 4 (Frozen) | 3 (Halted) |
| Frozen | 4 (Frozen) | 4 (Frozen) | 4 (Frozen) | 4 (Frozen) | 5 (Closed) |
| Closed | 5 (Closed) | 5 (Closed) | 5 (Closed) | 5 (Closed) | 5 (Closed) |

Note: matrix file is a hardcoded table (workaround for parser bug,
see E.11). Formal equivalence proof in E.7.

## E.5. Replay runs (9 histories)

```
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY03/evidence/replay_matrix/replay_runs.bend
1 2 4 5 2 4 5 1 2
```

| # | History | Tag | State |
|---|---------|-----|-------|
| 0 | `[]` | 1 | Draft |
| 1 | `[Activate]` | 2 | Active |
| 2 | `[Freeze]` | 4 | Frozen |
| 3 | `[Freeze, Close]` | 5 | Closed |
| 4 | `[Activate, Halt, Resume]` | 2 | Active |
| 5 | `[Activate, Freeze, Resume]` | 4 | Frozen |
| 6 | `[Activate, Freeze, Close, Activate]` | 5 | Closed |
| 7 | `[Close]` | 1 | Draft |
| 8 | `[Halt, Resume, Activate]` | 2 | Active |

## E.6. Mutation tests (8 mutations, all caught)

| # | Change | Law | Error |
|---|--------|-----|-------|
| 01 | Closed+Activate=Accepted{Active} | 002 | `expected Active, observed Closed` |
| 02 | Frozen+Resume=Accepted{Active} | 004 | `expected False, observed True` |
| 03 | Active+Close=Accepted{Closed} | 005 | `expected Closed, observed Active` |
| 04 | Draft+Resume=Rejected{Active} | 001 | `expected Rejected{Draft}, observed Rejected{Active}` |
| 05 | replay Nil returns Draft | 007 | `expected Draft, observed Closed` |
| 06 | replay consumes only head | 007 | structural mismatch on e<>rest |
| 07 | Frozen+Halt=Accepted{Active} | 004 | `expected False, observed True` |
| 08 | Draft+Close=Accepted{Draft} (reviewer) | 001 / 004b | type mismatch / `expected True, observed False` |


## E.7. Step equivalence proof (formal)

`evidence/diff/step_equiv.bend` declares BOTH the production
impl (`step_explicit`) and the alt impl (`step_collapsed`) in
the SAME namespace, and proves their pointwise equivalence on
every `(State, LcEvent)` pair.

```
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY03/evidence/diff/step_equiv.bend
step_equiv: 25/25 cells proved
---EXIT: 0
```

25-arm case-split, each arm discharges with `{==}`.

## E.8. Spec-gap probe (alternate impl with collapsed matches)

`spec_gap_probes/probe_collapsed_matches/` runs the same PROOF
against a `main.bend` whose `step` uses `case _:` catchalls.

```
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY03/spec_gap_probes/probe_collapsed_matches/PROOF.bend
All terms check.
---EXIT: 0
```

All 13 laws discharge against the collapsed-match impl,
showing the laws don't over-specify.

### E.8.1. Probe fixture upgrade (post-CORRECTION01)

After CORRECTION01 strengthened the spec to 13 laws, the probe
fixture was refreshed so its `LAWS.bend` is byte-identical to
canonical `lifecycle-kernel/LAWS.bend`, and its `PROOF.bend`
differs only in 3 lines of commentary in the LAW-004b section.

```
$ diff factory/qualify/ACT-MRVN-QUALIFY03/spec_gap_probes/probe_collapsed_matches/LAWS.bend \
       factory/qualify/ACT-MRVN-QUALIFY03/lifecycle-kernel/LAWS.bend
(empty)
```

### E.8.2. Probe live re-capture (captured)

The reviewer (final MRVN-03 freeze check) flagged that the
original `output.txt` (`"All terms check."`) was captured prior
to CORRECTION01 against the 11-law form, so §E.8 as written was
an inference from equivalent proof structure rather than
captured evidence. The reviewer authorized: "No correction ACT.
Just replace the stale transcript."

Live re-capture command (now executed; transcript in
`output.txt`):

```sh
bun bend2/main.ts \
  factory/qualify/ACT-MRVN-QUALIFY03/spec_gap_probes/probe_collapsed_matches/PROOF.bend \
  > factory/qualify/ACT-MRVN-QUALIFY03/spec_gap_probes/probe_collapsed_matches/output.txt 2>&1

echo "---EXIT: $?" >> factory/qualify/ACT-MRVN-QUALIFY03/spec_gap_probes/probe_collapsed_matches/output.txt
```

Observed transcript (`bun 1.3.14`, `node v26.0.0`,
`mrvn` working tree on `main`):

```
All terms check.
---EXIT: 0
```

This is captured evidence that the refreshed (13-law)
probe fixture discharges against the collapsed-match impl.
§E.8 is now a verified statement, not an inference.

## E.9. MRVN-01 regression (verdict kernel still passes)

```
$ bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/PROOF.bend
All terms check.
---EXIT: 0
```

## E.10. Toolchain provenance

- Bend 2.0.5 (no language-level changes).
- `bend2/base.bend` lines 357-392: `Equal.sym/trans/cong` toolkit.
- `bend2/main.ts` line 432: book with TODO holes is blocked.
- No edits to `bend2/*.ts`, `base.bend`, or `comp.ts`.

## E.11. Parser-bug workaround

While building `local_25_matrix.bend` and `replay_runs.bend`,
a bend2 parser bug was encountered:

```
SyntaxError: Unexpected token '-'. Expected an opening '(' before a function's parameter list.
```

Triggered when a file:
- defines a function with a 5-case `match` over `State`;
- AND uses that function as an argument to another function call;
- AND the call site is inside a deep function-call chain.

This is a parser limitation in `bend2/bend.ts` (read-only).
Workaround: matrix files use hardcoded tables (one `def` per
output row) and print U32 tags directly. The proofs in
`PROOF.bend` and `evidence/diff/step_equiv.bend` are unaffected.

## E.12. ACT-MRVN-QUALIFY03-CORRECTION01 (post-review)

Following expert review of the original ACT-MRVN-QUALIFY03, two
acceptance-authority laws were added (LAW-004b) to strengthen
the spec beyond what the reviewer thought necessary:

- `close_accepted_from_frozen`: if `is_frozen(s) == True`,
  then `is_accepted(step(s, Close)) == True`.
- `close_rejected_from_non_frozen`: if `is_frozen(s) == False`,
  then `is_accepted(step(s, Close)) == False`.

Together these encode "Close is accepted iff state == Frozen"
without relying on the structural side-effect of
`rejection_preserves_state`. Spec-level helper `is_frozen` is
added in LAWS.bend; proof uses `Empty.absurd + bool_clash +
Equal.sym` for the four impossible-constructor arms and direct
`{==}` for the canonical arms.

Mutation MUT-MRVN03-08 was added as the reviewer's suggested
counterexample (Accepted{s} for non-Frozen Close).  It is
caught EXIT=1:

- Against the original 11-law spec: caught at
  `LAWS.rejection_preserves_state` because the proof function
  pattern-matches on the constructor and the types fail to
  unify (Accepted != Rejected).
- Against the strengthened 13-law spec: caught at
  `LAWS.close_rejected_from_non_frozen` with a direct semantic
  error (`expected True, observed False`).

### E.12.1. Refinement of the mutation-log framing (post-review)

The original framing of this section was: "the reviewer's
specific claim that the mutation would slip through was
empirically false in Bend's WNF."  After a follow-up
formal-methods review the more accurate statement is:

- The *proposition* `LAW-001` was **vacuously satisfied** under
  MUT-08 against the original 11-law spec, because the premise
  `step(Draft, Close) == Rejected{r}` is uninhabited when
  `step(Draft, Close) == Accepted{Draft}`.
- What the original proof term actually exposed was that its
  *body* (`proj_rej_sym(Draft, r, h)`) no longer type-checked.
  This is a **proof-shape coupling** failure: the proof
  pattern-matches on the constructor, so changing the
  constructor breaks the proof even though the proposition
  itself is still true (vacuously).

In Bend's model the proposition and the proof are separate
artifacts (per `bend/guide/GUIDE.md`: "a proposition is a type
and a proof is a definition inhabiting that type"). The two
axes are:

```text
PROPOSITION_AUTHORITY     what LAWS.bend logically requires

PROOF_SHAPE_COUPLING      what the current PROOF.bend assumes
                          about implementation reduction
```

After CORRECTION01 both axes reject MUT-08 directly and
semantically: the textual law asserts `is_accepted(step(s, Close))
== False` for non-Frozen `s`, and the proof term discharges that
assertion by case-split on `is_frozen`.

This distinction is the basis for the doctrine proposed in
§E.14 below.

The strengthened spec is now self-documenting: the textual law
"close_accepted_from_frozen / close_rejected_from_non_frozen"
directly encodes the acceptance authority that the reviewer's
doctrine intended.

All 8 mutations (MUT-01..08) caught under the strengthened spec.

## E.13. Final disposition (post-review)

```
MRVN-03 = FULL_QUALIFICATION / TECHNICALLY FROZEN

LAW_COUNT                  = 13
LAW_DISCHARGE              = 13/13
TODO_COUNT                 = 0
MUTATIONS_REJECTED         = 8/8
REPLAY_INVARIANTS          = PROVED
CLOSE_ACCEPTANCE_AUTHORITY = EXPLICITLY_PROVED
MRVN-EXT-01                = LOCKED
MRVN-04                    = AUTHORIZED
```

Board:

```
MRVN-01      🟢 FULL_QUALIFICATION
MRVN-02      🟢 FULL_QUALIFICATION
MRVN-03      🟢 FULL_QUALIFICATION / TECHNICALLY FROZEN
MRVN-EXT-01  🔒 LOCKED

MRVN-04      ▶ AUTHORIZED   (Verified authority kernel +
                             mutation semantics classification)
```

## E.14. Doctrine: mutation classification (forwarded to MRVN-04)

The post-review reflection surfaced a classification problem
for the Factory laboratory: a mutation harness that simply
reports `mutation rejected ✅` whenever the proof term fails to
type-check conflates genuinely distinct outcomes. Once the
classification becomes first-class machinery we need the
complete 2×2 matrix:

```text
                       proposition accepts mutant?
                          yes            no
                +-----------------+-----------------+
   proof    yes |    SURVIVED     |  SPEC_REJECTED  |
   term         +-----------------+-----------------+
   accepts  no  | PROOF_TERM_     |     BOTH        |
   mutant?       | INVALIDATED     |                 |
                +-----------------+-----------------+
```

```text
SURVIVED
  Proposition accepts AND existing proof term type-checks.
  The mutant is genuinely compliant with both LAWS.bend and
  PROOF.bend. This is the only outcome that should not be
  reported as a violation.

SPEC_REJECTED
  The textual LAWS.bend proposition forbids the mutation.
  No proof term for the mutated implementation can satisfy
  the unchanged proposition.

PROOF_TERM_INVALIDATED
  The textual proposition is still satisfiable (often
  vacuously, because the mutated arm makes the premise
  uninhabited). The existing PROOF.bend body no longer
  type-checks because it assumes a specific implementation
  reduction. A different proof of the same proposition could
  in principle exist for the mutated implementation, but the
  current one doesn't apply.

BOTH
  Both axes reject the mutation. This is the strongest,
  most self-documenting outcome.
```

In ACT-MRVN-QUALIFY03:

| Mutation | Original 11-law spec | Strengthened 13-law spec |
|----------|----------------------|---------------------------|
| MUT-08 (Draft+Close -> Accepted{Draft}) | `PROOF_TERM_INVALIDATED` (LAW-001 vacuously true; proof body type-mismatch on constructor) | `BOTH` (LAW-004b directly forbids; proof body case-splits on is_frozen) |
| All other mutations (MUT-01..07) | `BOTH` | `BOTH` |
| Any *intended* SURVIVED case | would have proposition accepts AND proof term type-checks | would have proposition accepts AND proof term type-checks |

### E.14.1. MRVN-04 doctrine candidate

> Mutation testing should state **what authority rejected
> the mutant**, not merely that some verification command
> failed. The complete 2×2 matrix has four outcomes:
> `SURVIVED`, `SPEC_REJECTED`, `PROOF_TERM_INVALIDATED`,
> `BOTH`.

Implementation sketch (for MRVN-04):

1. **For each mutation, classify the result** along two axes:
   - `proposition_authority`: does the LAWS.bend text forbid
     the mutation? (i.e., is there *some* proof term for the
     mutated implementation that satisfies the unchanged
     proposition?)
   - `proof_term_coupling`: does the unchanged PROOF.bend
     type-check against the mutated implementation?

2. **Emit a 4-class status** instead of a binary
   `rejected/accepted`:
   - `SURVIVED`
   - `SPEC_REJECTED`
   - `PROOF_TERM_INVALIDATED`
   - `BOTH`

3. **Use `PROOF_TERM_INVALIDATED` as a soft warning**: it
   indicates that the spec text is weaker than its current
   proof body, and that strengthening the spec (à la
   CORRECTION01) would make the rejection more semantically
   direct.

4. **Treat `SURVIVED` as a hard failure of the harness**:
   a survivor means either the spec is incomplete or the
   mutation was equivalent under the spec — the laboratory
   must surface this rather than silently passing.

This doctrine was identified as the "more interesting Factory
lesson" of MRVN-03 and is the basis for the proposed MRVN-04
scope (`Verified authority kernel + mutation semantics
classification`).


