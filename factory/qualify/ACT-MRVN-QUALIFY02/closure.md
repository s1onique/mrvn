# ACT-MRVN-QUALIFY02 closure.md -- lifecycle/authority manifest

This is the **staged-transition manifest** required to bring
ACT-MRVN-QUALIFY02 from `TECHNICAL_QUALIFICATION=FULL` to
`FACTORY_CLOSURE=AUTHORITATIVE`.

## State at ACT02-CORRECTION01 closure

```
git status                    = 37 untracked files under factory/
LIFECYCLE_FREEZE              = unset
LIFECYCLE_CLOSURE             = unset
AUTHORITY_STATUS              = DirtyWorktree
GENERATOR_AUTHORITATIVE_FOR_DIGEST = false
state_binding                 = UNBOUND
```

## Files staged (37)

```
factory/qualify/ACT-MRVN-QUALIFY01/
  AUTHORITY.md                  (factory authority markers, ACT01)
  BASELINE.md                   (baseline/TCB mapping, ACT01)
  BASELINE_BRANCH               (baseline git branch)
  BASELINE_HEAD                 (baseline git HEAD)
  BASELINE_WORKTREE_STATE       (baseline worktree state marker)
  BEND_RUNTIME_VERSION          (captured Bend runtime version)
  BEND_VERSION                  (captured Bend language version)
  NODE_VERSION                  (captured Node runtime version)
  UPSTREAM_BASE_COMMIT          (captured upstream base commit)
  UPSTREAM_REMOTE               (captured upstream remote URL)
  verdict-kernel/
    main.bend       (ACT02 refactor: 3-arm case split)
    LAWS.bend       (frozen, hash e3600c99...)
    PROOF.bend      (4 laws discharged, 0 TODOs, hash 0268db72...)
    EVIDENCE.md     (ACT01 evidence; unchanged)
    REPORT.md       (ACT01 report; unchanged)

factory/qualify/ACT-MRVN-QUALIFY02/
  EVIDENCE.md     (Q1-Q10 + 9 evidence sections)
  REPORT.md       (corrected at CORRECTION01)
  closure.md      (this staged-transition manifest)
  reference/
    main_act01.bend    (frozen ACT01 impl, hash f37ea412...)
    LAWS-act01.bend    (frozen ACT01 spec, hash e3600c99...)
    PROOF-act01.bend   (frozen ACT01 proof, hash ed7f562d...)
  evidence/
    main_refactor.diff        (ACT01 -> ACT02 diff)
    gen-differential.py.log   (24-case gen transcript)
    diff/
      diff_act01.bend         (differential runner, ACT01 form)
      diff_act02.bend         (differential runner, ACT02 form)
      main_act01.bend         (snapshot of ACT01 impl)
      main_act02.bend         (snapshot of ACT02 impl)
      step_equiv.bend         (formal single-namespace equiv proof)
      outputs.txt             (24-case MATCH transcript)
  mutations/
    MUT-MRVN-01.bend          (LAWS-001 violator)
    MUT-MRVN-02.bend          (LAWS-002 violator)
    MUT-MRVN-03.bend          (LAWS-002/003 violator)
    MUT-MRVN-04.bend          (LAWS-001 violator)
    MUT-MRVN-05.bend          (LAWS-002 violator; spec-completeness probe)
  repro/
    step-cong-good.bend       (reproducer: step-def + Equal.cong works)
    step-cong-bad.bend        (reproducer: step-def + Equal.cong fails here)
    verify_staged_transition.sh   (hash verifier; not staged)
```

(NOTE: `verify_staged_transition.sh` is a verifier included in
the staged files.  Total staged: 37 = 10 ACT01 marker files
+ 5 ACT01 verdict-kernel files + 22 ACT02 files.)

## Required transitions to AUTHORITATIVE

The following commands transition the lifecycle from
`DirtyWorktree` to `AUTHORITATIVE`. They are **listed, not
executed**: lifecycle closure is the reviewer's call, not the
generator's.

```bash
# Stage the qualified state
cd /Volumes/UserData/Users/chistyakov/Projects/SPbNIX/mrvn
git add factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/
git add factory/qualify/ACT-MRVN-QUALIFY02/

# Verify staged hashes match the frozen hashes
git status --porcelain factory/ | grep -v '^??'  # should be empty
sha256sum factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/PROOF.bend
# expected: 0268db72...
sha256sum factory/qualify/ACT-MRVN-QUALIFY02/reference/main_act01.bend
# expected: f37ea412...

# Commit (signature + ticket ref)
git commit -m "ACT-MRVN-QUALIFY02: 4/4 verdict-kernel laws discharged (Outcome A)

- main.bend: explicit 3-arm case split (replaces case _: catchall).
- PROOF.bend: structural induction + constructor decomposition;
  zero auxiliary lemmas; zero Equal.toolkit uses beyond bool_clash.
- step_equiv.bend: formal single-namespace pointwise equivalence proof.
- 24-case runtime differential: MATCH (mismatches=0).
- 5/5 mutations violate at least one law; spec-completeness probe
  found no compliant-but-different impl (NOT a completeness proof).
- No edits to bend2/*.ts, base.bend, or comp.ts.

Refs: factory/qualify/ACT-MRVN-QUALIFY02/{REPORT,EVIDENCE,closure}.md
      factory/qualify/ACT-MRVN-QUALIFY02-CORRECTION01 (closure hygiene)"
```

After the commit, lifecycle transitions to:

```
LIFECYCLE_FREEZE              = frozen
LIFECYCLE_CLOSURE             = closed
AUTHORITY_STATUS              = CleanWorktree
GENERATOR_AUTHORITATIVE_FOR_DIGEST = true
state_binding                 = BOUND
```

## Why lifecycle closure is the reviewer's call, not the generator's

The reviewer's feedback correctly noted that:

> "The lifecycle block says `LIFECYCLE_FREEZE = unset,
>  LIFECYCLE_CLOSURE = unset, AUTHORITY_STATUS = DirtyWorktree`.
>  Therefore I'd distinguish two states:
>  `TECHNICAL_QUALIFICATION = FULL`, `FACTORY_CLOSURE = NOT_YET_AUTHORITATIVE`."

ACT02-CORRECTION01 is a **documentation/accounting correction**
only. It does not transition lifecycle state; it merely
produces the manifest that authorizes the reviewer's transition
command. Whether to execute `git commit` (and thereby bind the
qualified state) is a reviewer-side decision because:

- The commit will be a permanent record on the controlled
  factory tree.
- Future ACTs may need to amend the verdict-kernel laws.
- The decision to bind has business-significance implications
  beyond technical correctness.

The generator's job ends at producing authoritative
documentation; the lifecycle transition is a separate
operation under the reviewer's authority.

## Reviewer action items

1. Verify the staged-file list above matches
   `git status --porcelain factory/`.
2. Verify the SHA256 hashes of `PROOF.bend` and
   `reference/main_act01.bend` match the values in REPORT.md.
3. Execute the `git commit` command above (or amend if
   conventions require).
4. Update the project board to reflect
   `MRVN-02 = OUTCOME_A / TECHNICALLY COMPLETE`.
5. Open `MRVN-03` (verified state-machine kernel) for the
   next falsification round.