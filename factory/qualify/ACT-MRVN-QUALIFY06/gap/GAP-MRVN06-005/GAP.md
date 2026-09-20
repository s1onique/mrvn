# GAP-MRVN06-005

## Candidate

* candidate_id: CAND-MRVN06-A06
* family: DENY_REASON
* implementation_sha256: a6e8f16e9631d7481d6b3ce6fd740a90b44d0bb922deabdbd1e3c9fa5588a733

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
| actor       | Automation                    |
| capability  | Halt               |
| lifecycle   | Active                |
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

* artifact_id: sha256:92809f8cdac1bbb2b97dcc932b7fb32d9dcfacc621203704fd95508bc5a60e52
* artifact_path: GAP-MRVN06-005/candidate-artifact

## Taxonomy

* ALLOW_DENY_AUTHORITY_GAP: NO (both Allow/Deny unchanged)
* DENY_REASON_GAP: YES
* STATE_DIMENSION: DENY_REASON

## Notes

Generated 2026-09-20 by ACT-MRVN-06 lab/build_gap_certificates.ts.
