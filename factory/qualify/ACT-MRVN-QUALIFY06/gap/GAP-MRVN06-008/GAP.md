# GAP-MRVN06-008

## Candidate

* candidate_id: CAND-MRVN06-B02
* family: EVIDENCE
* implementation_sha256: 0533909b975f0ad36ed227c9e97cfada122cc71246f755c13af0c12dcb1f628f

## Authority chain

* canonical_laws_sha256: 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9
* candidate_laws_sha256: 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9
* SAME_LAW_BOOK: true
* intent_oracle_sha256: a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9
* candidate_proof: CANONICAL_PROOF_PASS

## Specification gap witness

Diff count: 1

Witness cell:

| field       | value                              |
|-------------|------------------------------------|
| actor       | Reviewer                    |
| capability  | Close               |
| lifecycle   | Frozen                |
| evidence    | None                 |
| intent      | Deny{InsufficientEvidence}                 |
| candidate   | Deny{WrongActor}                 |

## Gap authority equation

SPECIFICATION_GAP holds because:

1. SAME_LAW_BOOK: candidate_laws_sha256 == canonical_laws_sha256 == 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9
2. LAW_SATISFACTION_VERIFIED: canonical PROOF passes against the candidate implementation
3. INTENT_ORACLE_IDENTITY_BOUND: intent_oracle_sha256 == a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9 (matches frozen oracle on disk)
4. BEHAVIORAL_DIVERGENCE_VERIFIED: 1 cell(s) of 180 differ from the intent oracle, including the witness above

## Portable artifact

* artifact_id: sha256:3bbdd92cc28d37e624c086bca75cf5c7a9aeb41443cbe2f7b423b6af91826e20
* artifact_path: GAP-MRVN06-008/candidate-artifact

## Taxonomy

* DENY_REASON_GAP: YES (evidence-vs-other reason precedence)
* EVIDENCE_DISTINCTION_GAP: partial

## Notes

Generated 2026-09-20 by ACT-MRVN-06 lab/build_gap_certificates.ts.
