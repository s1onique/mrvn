# GAP-MRVN06-004

## Candidate

* candidate_id: CAND-MRVN06-A05
* family: DENY_REASON
* implementation_sha256: 2debebbd69ad99c5150df92e0ec46fb9c2385f996778d3415af707bc342435c8

## Authority chain

* canonical_laws_sha256: 0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8
* candidate_laws_sha256: 0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8
* SAME_LAW_BOOK: true
* intent_oracle_sha256: a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9
* candidate_proof: CANONICAL_PROOF_PASS

## Specification gap witness

Diff count: 3

Witness cell:

| field       | value                              |
|-------------|------------------------------------|
| actor       | Agent                    |
| capability  | Close               |
| lifecycle   | Frozen                |
| evidence    | None                 |
| intent      | Deny{WrongActor}                 |
| candidate   | Deny{WrongLifecycle}                 |

## Gap authority equation

SPECIFICATION_GAP holds because:

1. SAME_LAW_BOOK: candidate_laws_sha256 == canonical_laws_sha256 == 0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8
2. LAW_SATISFACTION_VERIFIED: canonical PROOF passes against the candidate implementation
3. INTENT_ORACLE_IDENTITY_BOUND: intent_oracle_sha256 == a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9 (matches frozen oracle on disk)
4. BEHAVIORAL_DIVERGENCE_VERIFIED: 3 cell(s) of 180 differ from the intent oracle, including the witness above

## Portable artifact

* artifact_id: sha256:aee80241e9a6df00add83e291fb56a390e75a85da7a0ec66d2cc9d9127237320
* artifact_path: GAP-MRVN06-004/candidate-artifact

## Taxonomy

* ALLOW_DENY_AUTHORITY_GAP: NO (both Allow/Deny unchanged)
* DENY_REASON_GAP: YES
* STATE_DIMENSION: DENY_REASON

## Notes

Generated 2026-09-20 by ACT-MRVN-06 lab/build_gap_certificates.ts.
