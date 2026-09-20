# ACT-MRVN-QUALIFY06 — Frozen identities

The following identifiers are bound at the start of MRVN-06 and are
immutable for the duration of the primary experiment.  Any drift in
these values after a candidate is generated triggers
`CANDIDATE_AUTHORITY_FAILURE`.

## Canonical authority kernel (MRVN-04 subject under test)

```text
canonical_laws_sha256      = 2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9
canonical_impl_sha256      = eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb
canonical_proof_sha256     = c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8
law_count                  = 15
toolchain:
  bend2/main.ts            = 34a8a791b02ce92f247bda4cabcd3ff4eabe500002fedbec4867b5db77ee1feb
  bend2/bend.ts            = fe3c2b0b306fccbe44efec349d8f339b6efdaceb090b3d3049c74a1a6015c859
  bend2/comp.ts            = c181ac038d7f7d4ed0e1bb81c513e64285347627e0b3a13a98cb86a1d1568f54
  bend2/base.bend          = b2d53bbd83639c3ae27260b318efa09de9df6006a556ac6ef41c104ea164917a
```

## Frozen intent (independent authority)

```text
INTENT_TEXT_SHA256         = 1e21d2f56e2d587ef08499a0f58aac47960a6d5c5b4b899a39e972e92985d274
INTENT_ORACLE_SHA256       = a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9
INTENT_CELL_COUNT          = 180
```

These hashes match `intent/oracle.json`'s
`intent_text_sha256` field and the on-disk sha256 of
`intent/oracle.json` respectively.

## Baseline 180/180

```text
CANONICAL_BEND_CELLS       = 180
INTENT_ORACLE_CELLS        = 180
BASELINE_DIFF_COUNT        = 0
```

The canonical Bend implementation agrees with the intent oracle at
all 180 cells.

## Discipline

* Every candidate must use `LAWS.bend` whose sha256 equals
  `canonical_laws_sha256`.
* Every candidate's intent comparison must use `intent/oracle.json`
  whose sha256 equals `INTENT_ORACLE_SHA256`.
* Any drift at any point triggers
  `CANDIDATE_AUTHORITY_FAILURE` and non-zero lab exit.

## CORRECTION01 frozen identities

```text
build_oracle_sha256        = 312bc3c610a3b64482c0c6f99a0b0249c3cb163d9a00e1a25822d09c91644e37
mrvn04_results_sha256      = aa2d06058643e64bf8ad7cb32cc21c594dd5c075cdbbb2fbb590b86e307750c8   (frozen pre-modification)
intent_provenance_sha256   = 312bc3c610a3b64482c0c6f99a0b0249c3cb163d9a00e1a25822d09c91644e37   (= build_oracle, by construction)
```

The MRVN-04 `lab/results.json` on disk is restored to its
pre-modification state (sha256:aa2d0605...).  Any subsequent MRVN-04
regression run must NOT mutate that file; the new
`regression_hygiene.ts` gate asserts this on every run.

## CORRECTION01 additional discipline

* Every `SPECIFICATION_GAP` / `EQUIVALENT_SURVIVOR` classification
  requires a portable artifact that passes MRVN-05 --mode full.  The
  classifier (`lab/classify.ts`) runs Phase 4.5 (artifact
  verification) BEFORE Phase 4 (final classification).  Failed
  verification downgrades to `NO_GAP_CLASSIFICATION` with exit 1.

* `build_oracle.ts` must not read, import, or execute any
  canonical implementation artifact, canonical behavior dump,
  candidate behavior, or Bend toolchain.  Asserted by
  `lab/intent_provenance.ts` (7 forbidden patterns, 0 violations).

* MRVN-04 / MRVN-05 regression runs must not mutate prior-ACT
  durable evidence.  MRVN-04 verify now defaults to `--no-write`;
  MRVN-05 verify already supports `--result-out <path>`.  Asserted
  by `lab/regression_hygiene.ts` (pre/post hash equality).

## CORRECTION02 additional discipline

* The MRVN-06 authoritative artifact verification path (the
  classifier `lab/classify.ts`) MUST invoke MRVN-05 verify WITHOUT
  `--allow-toolchain-drift`.  This binds the portable artifact's
  `provenance.toolchain.toolchain_closure[]` to the live
  `bend2/{main,bend,comp,base}.*` file hashes byte-for-byte.  Any
  drift produces `TOOLCHAIN_MISMATCH` and downgrades the
  classification to `NO_GAP_CLASSIFICATION` with exit 1.

* Asserted by the new Test 6 `toolchain_tamper` in
  `lab/authority_attacks.ts`.

## CORRECTION02 frozen toolchain

```text
bend2/main.ts   = 34a8a791b02ce92f247bda4cabcd3ff4eabe500002fedbec4867b5db77ee1feb   (cli)
bend2/bend.ts   = fe3c2b0b306fccbe44efec349d8f339b6efdaceb090b3d3049c74a1a6015c859   (trusted_kernel)
bend2/comp.ts   = c181ac038d7f7d4ed0e1bb81c513e64285347627e0b3a13a98cb86a1d1568f54   (compiler_runtime)
bend2/base.bend = b2d53bbd83639c3ae27260b318efa09de9df6006a556ac6ef41c104ea164917a   (prelude)
```

Any subsequent drift in any of these files invalidates every
authoritative MRVN-06 verdict until the lab is rebuilt from a
matching toolchain.
