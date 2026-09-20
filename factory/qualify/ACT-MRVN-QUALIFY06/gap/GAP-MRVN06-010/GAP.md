# GAP-MRVN06-010

## Candidate

* candidate_id: CAND-MRVN06-B04
* family: EVIDENCE
* implementation_sha256: 9325fb3149e45033ffdb507ff587b2b88f0af39f07a7c8bb3bc6324c690c50be

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
| lifecycle   | Halted                |
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

* artifact_id: sha256:3e91a5f0900e26a2d51b861259e17b01bf319cf8f4ba4af73515399367f424e4
* artifact_path: GAP-MRVN06-010/candidate-artifact

## Taxonomy

* DENY_REASON_GAP: YES (evidence-vs-other reason precedence)
* EVIDENCE_DISTINCTION_GAP: partial

## Notes

Generated 2026-09-20 by ACT-MRVN-06 lab/build_gap_certificates.ts.
