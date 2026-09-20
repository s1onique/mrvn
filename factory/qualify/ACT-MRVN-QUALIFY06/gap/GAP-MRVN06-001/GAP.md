# GAP-MRVN06-001

## Candidate

* candidate_id: CAND-MRVN06-CONTROL-KNOWN
* family: KNOWN_GAP_CONTROL
* implementation_sha256: 9d4cc31ddc26a2de0a224852ba49f6b438cc4baea8a0a8502361983186967420

## Authority chain

* canonical_laws_sha256: 0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8
* candidate_laws_sha256: 0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8
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
| evidence    | Replay                 |
| intent      | Deny{InsufficientEvidence}                 |
| candidate   | Deny{Terminal}                 |

## Gap authority equation

SPECIFICATION_GAP holds because:

1. SAME_LAW_BOOK: candidate_laws_sha256 == canonical_laws_sha256 == 0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8
2. LAW_SATISFACTION_VERIFIED: canonical PROOF passes against the candidate implementation
3. INTENT_ORACLE_IDENTITY_BOUND: intent_oracle_sha256 == a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9 (matches frozen oracle on disk)
4. BEHAVIORAL_DIVERGENCE_VERIFIED: 1 cell(s) of 180 differ from the intent oracle, including the witness above

## Portable artifact

* artifact_id: sha256:6e19b7bc3cc987f31ac08cabf5a46a63e69f4f675a392268ccedade537a99efd
* artifact_path: GAP-MRVN06-001/candidate-artifact

## Taxonomy

* OTHER

## Notes

Generated 2026-09-20 by ACT-MRVN-06 lab/build_gap_certificates.ts.
