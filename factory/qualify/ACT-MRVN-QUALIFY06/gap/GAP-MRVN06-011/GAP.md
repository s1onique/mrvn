# GAP-MRVN06-011

## Candidate

* candidate_id: CAND-MRVN06-C02
* family: ACTOR
* implementation_sha256: ffed574b60c3a8580921963ba48896e18a8e55bfbc459c0ce11f6597c55f9ce7

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
| actor       | Automation                    |
| capability  | Freeze               |
| lifecycle   | Active                |
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

* artifact_id: sha256:3c777b3e64877defdcd037799847d7babf3ce3e14f1dd99c138b5d4971e725f3
* artifact_path: GAP-MRVN06-011/candidate-artifact

## Taxonomy

* DENY_REASON_GAP: YES (actor-vs-lifecycle precedence)
* ACTOR_DISTINCTION_GAP: partial

## Notes

Generated 2026-09-20 by ACT-MRVN-06 lab/build_gap_certificates.ts.
