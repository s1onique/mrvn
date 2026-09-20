# GAP-MRVN06-012

## Candidate

* candidate_id: CAND-MRVN06-C03
* family: ACTOR
* implementation_sha256: 41584ae0f30690db8a18e53aba510bf65f367250fbd2c33277e836a69165d970

## Authority chain

* canonical_laws_sha256: 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9
* candidate_laws_sha256: 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9
* SAME_LAW_BOOK: true
* intent_oracle_sha256: a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9
* candidate_proof: CANONICAL_PROOF_PASS

## Specification gap witness

Diff count: 3

Witness cell:

| field       | value                              |
|-------------|------------------------------------|
| actor       | Agent                    |
| capability  | Freeze               |
| lifecycle   | Halted                |
| evidence    | None                 |
| intent      | Deny{WrongActor}                 |
| candidate   | Deny{WrongLifecycle}                 |

## Gap authority equation

SPECIFICATION_GAP holds because:

1. SAME_LAW_BOOK: candidate_laws_sha256 == canonical_laws_sha256 == 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9
2. LAW_SATISFACTION_VERIFIED: canonical PROOF passes against the candidate implementation
3. INTENT_ORACLE_IDENTITY_BOUND: intent_oracle_sha256 == a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9 (matches frozen oracle on disk)
4. BEHAVIORAL_DIVERGENCE_VERIFIED: 3 cell(s) of 180 differ from the intent oracle, including the witness above

## Portable artifact

* artifact_id: sha256:7d603d30375b6ffe1c64eb10e624eb4e12e3a7c512d8d033ac6076b3d3d20156
* artifact_path: GAP-MRVN06-012/candidate-artifact

## Taxonomy

* DENY_REASON_GAP: YES (actor-vs-lifecycle precedence)
* ACTOR_DISTINCTION_GAP: partial

## Notes

Generated 2026-09-20 by ACT-MRVN-06 lab/build_gap_certificates.ts.
