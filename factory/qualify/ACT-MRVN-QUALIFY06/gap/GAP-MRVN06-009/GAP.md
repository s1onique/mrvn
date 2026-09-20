# GAP-MRVN06-009

## Candidate

* candidate_id: CAND-MRVN06-B03
* family: EVIDENCE
* implementation_sha256: e01c698a669082a7b0da1dc13681074db403f5d018e7d40091008cb674ff0be0

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
| capability  | Freeze               |
| lifecycle   | Active                |
| evidence    | None                 |
| intent      | Deny{InsufficientEvidence}                 |
| candidate   | Deny{WrongLifecycle}                 |

## Gap authority equation

SPECIFICATION_GAP holds because:

1. SAME_LAW_BOOK: candidate_laws_sha256 == canonical_laws_sha256 == 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9
2. LAW_SATISFACTION_VERIFIED: canonical PROOF passes against the candidate implementation
3. INTENT_ORACLE_IDENTITY_BOUND: intent_oracle_sha256 == a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9 (matches frozen oracle on disk)
4. BEHAVIORAL_DIVERGENCE_VERIFIED: 1 cell(s) of 180 differ from the intent oracle, including the witness above

## Portable artifact

* artifact_id: sha256:7a95fd57dcb860afb38c28027ccb95f0ec7d7a153ac7fa35c5e4355b4db81437
* artifact_path: GAP-MRVN06-009/candidate-artifact

## Taxonomy

* DENY_REASON_GAP: YES (evidence-vs-other reason precedence)
* EVIDENCE_DISTINCTION_GAP: partial

## Notes

Generated 2026-09-20 by ACT-MRVN-06 lab/build_gap_certificates.ts.
