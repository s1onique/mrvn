# GAP-MRVN06-016

## Candidate

* candidate_id: CAND-MRVN06-D04
* family: LIFECYCLE
* implementation_sha256: 1cae9466b49ef04b73b3afc1237740d8f4c1e344ebe16c9ca83cb43c198e32fe

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
| capability  | Halt               |
| lifecycle   | Halted                |
| evidence    | None                 |
| intent      | Deny{WrongLifecycle}                 |
| candidate   | Deny{InsufficientEvidence}                 |

## Gap authority equation

SPECIFICATION_GAP holds because:

1. SAME_LAW_BOOK: candidate_laws_sha256 == canonical_laws_sha256 == 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9
2. LAW_SATISFACTION_VERIFIED: canonical PROOF passes against the candidate implementation
3. INTENT_ORACLE_IDENTITY_BOUND: intent_oracle_sha256 == a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9 (matches frozen oracle on disk)
4. BEHAVIORAL_DIVERGENCE_VERIFIED: 3 cell(s) of 180 differ from the intent oracle, including the witness above

## Portable artifact

* artifact_id: sha256:ae5e8edbb107b660267e2dab272a0c23ca2fc664153cc8d1a4e0e16cdba670b8
* artifact_path: GAP-MRVN06-016/candidate-artifact

## Taxonomy

* DENY_REASON_GAP: YES (lifecycle-vs-evidence precedence)
* LIFECYCLE_DISTINCTION_GAP: partial

## Notes

Generated 2026-09-20 by ACT-MRVN-06 lab/build_gap_certificates.ts.
