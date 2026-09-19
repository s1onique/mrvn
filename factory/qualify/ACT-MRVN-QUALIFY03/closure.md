# ACT-MRVN-QUALIFY03 closure.md -- lifecycle/authority manifest

This is the staged-transition manifest for ACT-MRVN-QUALIFY03,
the verified lifecycle state machine kernel.  It is produced at
the end of the falsification round and lists the staged files,
hashes, and the commands the reviewer may run to bind the
qualified state.

## State at ACT03 closure

```
TECHNICAL_QUALIFICATION        = FULL  (Outcome A)
FACTORY_CLOSURE                = NOT_YET_AUTHORITATIVE  (commit-pending)
git status factory/qualify/ACT-MRVN-QUALIFY03/  = untracked
LIFECYCLE_FREEZE               = unset
LIFECYCLE_CLOSURE              = unset
AUTHORITY_STATUS               = DirtyWorktree
state_binding                  = UNBOUND

LAW_COUNT                  = 13
LAW_DISCHARGE              = 13/13
TODO_COUNT                 = 0
MUTATIONS_REJECTED         = 8/8
REPLAY_INVARIANTS          = PROVED
CLOSE_ACCEPTANCE_AUTHORITY = EXPLICITLY_PROVED
MRVN-EXT-01                = LOCKED
MRVN-04                    = AUTHORIZED
```

### Board (post-review)

```
MRVN-01      🟢 FULL_QUALIFICATION
MRVN-02      🟢 FULL_QUALIFICATION
MRVN-03      🟢 FULL_QUALIFICATION / TECHNICALLY FROZEN
MRVN-EXT-01  🔒 LOCKED

MRVN-04      ▶ AUTHORIZED   (Verified authority kernel +
                             mutation semantics classification)
```

## Files to stage

```
factory/qualify/ACT-MRVN-QUALIFY03/
  REPORT.md                       (Q1-Q13 + closure)
  EVIDENCE.md                     (E.0-E.10 + toolchain)
  closure.md                      (this staged-transition manifest)
  lifecycle-kernel/
    main.bend       (impl, hash eef7865f...)
    LAWS.bend       (spec, hash 96fbf1a0...)  (CORRECTION01)
    PROOF.bend      (proofs, hash eeabe344...)  (CORRECTION01)
  evidence/
    mrvn02_regression.txt          (MRVN-01 PROOF transcript)
    replay_matrix/
      local_25_matrix.bend         (5x5 transition matrix)
      local_25_matrix.output.txt   (25-cell output)
      replay_runs.bend             (9-history replay runs)
      replay_runs.output.txt       (9-cell output)
    mutation_logs/
      MUT-MRVN03-01.txt
      MUT-MRVN03-02.txt
      MUT-MRVN03-03.txt
      MUT-MRVN03-04.txt
      MUT-MRVN03-05.txt
      MUT-MRVN03-06.txt
      MUT-MRVN03-07.txt
      MUT-MRVN03-08.txt   (reviewer counterexample; CAUGHT)
  mutations/
    MUT-MRVN03-01/main.bend + LAWS.bend + PROOF.bend
    MUT-MRVN03-02/main.bend + LAWS.bend + PROOF.bend
    MUT-MRVN03-03/main.bend + LAWS.bend + PROOF.bend
    MUT-MRVN03-04/main.bend + LAWS.bend + PROOF.bend
    MUT-MRVN03-05/main.bend + LAWS.bend + PROOF.bend
    MUT-MRVN03-06/main.bend + LAWS.bend + PROOF.bend
    MUT-MRVN03-07/main.bend + LAWS.bend + PROOF.bend
    MUT-MRVN03-08/main.bend + LAWS.bend + PROOF.bend   (reviewer)
  spec_gap_probes/
    alt_implementation.bend                  (collapsed-match impl)
    probe_collapsed_matches/
      main.bend + LAWS.bend + PROOF.bend
      output.txt                              ("All terms check.", live re-capture)
evidence/
  runtime_canonical_PROOF.txt                ("All terms check.")
  runtime_mrvn01_regression.txt              ("All terms check.")
  diff/step_equiv.bend
  diff/step_equiv.txt                        ("step_equiv: 25/25 cells proved")
  mutation_logs/MUT-MRVN03-{01..08}.txt      (re-tested vs CORRECTION01)
```

## Required transitions to AUTHORITATIVE

The following commands transition the lifecycle from
`DirtyWorktree` to `AUTHORITATIVE`. They are **listed, not
executed**: lifecycle closure is the reviewer's call.

```bash
cd /Volumes/UserData/Users/chistyakov/Projects/SPbNIX/mrvn

# Stage the qualified state
git add factory/qualify/ACT-MRVN-QUALIFY03/

# Verify staged hashes match the recorded hashes
sha256sum factory/qualify/ACT-MRVN-QUALIFY03/lifecycle-kernel/main.bend
# expected: eef7865f363a3afe5a87814e4cda78038d8292f0ee6439484b5291c2590d6338
sha256sum factory/qualify/ACT-MRVN-QUALIFY03/lifecycle-kernel/LAWS.bend
# expected: 96fbf1a0600dc156338c348082a14c6817946f7d4fe34781a03ebedadb93110a
sha256sum factory/qualify/ACT-MRVN-QUALIFY03/lifecycle-kernel/PROOF.bend
# expected: eeabe34404877ae2ce4eb046d4f3a52256a43dc5ef4231fc709019f5f7fb9eae

# Verify refreshed probe fixture (post-CORRECTION01)
sha256sum factory/qualify/ACT-MRVN-QUALIFY03/spec_gap_probes/probe_collapsed_matches/LAWS.bend
# expected: 96fbf1a0600dc156338c348082a14c6817946f7d4fe34781a03ebedadb93110a
# (byte-identical to canonical LAWS.bend)
sha256sum factory/qualify/ACT-MRVN-QUALIFY03/spec_gap_probes/probe_collapsed_matches/PROOF.bend
# expected: 3ef131e0944b5d3ef2ece613b1f87d8a224e926224ac6c787ff737c29df4cdf9
sha256sum factory/qualify/ACT-MRVN-QUALIFY03/spec_gap_probes/probe_collapsed_matches/main.bend
# expected: 6e00d6d9829fc3c49f1fcab2449116829767c4ac970ca4314fba8409bf7685af

# Commit
git commit -m "ACT-MRVN-QUALIFY03: 13/13 lifecycle-kernel laws discharged (Outcome A)

- main.bend: explicit 25-arm step over (State, LcEvent); projection
  helpers result_state, accepted; structurally recursive replay.
- LAWS.bend: 13 laws (8 mandatory + 3 essential replay + 2 acceptance-
  authority, LAW-004b added by CORRECTION01).
- PROOF.bend: 13 proofs discharged; 2 micro-defs (proj_rej_sym,
  post_freeze_replay_helper); 9 helper predicates; 0 ?TODO markers.
- 8/8 mutations caught (MUT-01..08; MUT-08 is reviewer's canonical
  counterexample for acceptance-authority concern); 1 spec-gap probe
  (collapsed-match impl) refreshed to the strengthened 13-law spec;
  MRVN-01 regression still passes.
- CORRECTION01: expert review suggested strengthening LAW-004 to
  encode explicit acceptance authority.  Implemented as LAW-004b
  (close_accepted_from_frozen, close_rejected_from_non_frozen).
  Under the original 11-law spec MUT-08 was PROOF_TERM_INVALIDATED
  only (LAW-001 vacuously true; proof body type-mismatch on
  constructor); under the strengthened 13-law spec it is BOTH
  (LAW-004b directly forbids the mutation and the proof term
  discharges by case-split on is_frozen).
- Doctrine forwarded to MRVN-04: the 2x2 mutation matrix
  (proposition accepts x proof term accepts) has four classes:
  SURVIVED, SPEC_REJECTED, PROOF_TERM_INVALIDATED, BOTH.  MRVN-04
  is AUTHORIZED to develop the verified authority kernel and
  make this classification first-class in the laboratory output.
- No edits to bend2/*.ts, base.bend, or comp.ts.

Refs: factory/qualify/ACT-MRVN-QUALIFY03/{REPORT,EVIDENCE,closure}.md"
```

After the commit, lifecycle transitions to:

```
LIFECYCLE_FREEZE               = frozen
LIFECYCLE_CLOSURE              = closed
AUTHORITY_STATUS               = CleanWorktree
state_binding                  = BOUND
```

## Reviewer action items

1. Verify the staged-file list above matches
   `git status --porcelain factory/qualify/ACT-MRVN-QUALIFY03/`.
2. Verify the SHA256 hashes of the three lifecycle-kernel files
   match the values in EVIDENCE.md.
3. Verify the probe fixture `LAWS.bend` is byte-equivalent to
   the canonical `LAWS.bend` (the probe was refreshed to the
   strengthened 13-law spec; see EVIDENCE.md §E.8.1).
4. Run `bun bend2/main.ts PROOF.bend` to confirm the proofs still
   discharge from a clean checkout.
5. Run `bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/PROOF.bend`
   to confirm MRVN-01 regression.
6. Run `bun bend2/main.ts factory/qualify/ACT-MRVN-QUALIFY03/spec_gap_probes/probe_collapsed_matches/PROOF.bend`
   to confirm the refreshed probe discharges against the
   collapsed-match impl.
7. Execute the `git commit` command above (or amend if
   conventions require).
8. Update the project board to reflect
   `MRVN-03 = FULL_QUALIFICATION 🟢 / TECHNICALLY FROZEN` and
   `MRVN-04 = AUTHORIZED ▶ (Verified authority kernel +
   mutation semantics classification)`.

