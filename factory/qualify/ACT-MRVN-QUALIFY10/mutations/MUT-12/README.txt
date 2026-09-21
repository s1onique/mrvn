MUT-12: post-build foreign byte substitution.

The mutation is performed at RUN TIME by the lab harness, not by
modifying these source files.  The lab:
  - takes the canonical read_role.{c,js}
  - builds the artifact under effect/read_role.{c,js}
  - then swaps effect/read_role.js with a different file
  - rebuilds and reruns
  - records whether the verifier's manifest rejects the swapped bytes
    against the recorded hash (it must: FOREIGN_EFFECT_HASH_MISMATCH).

These source files are intentionally the canonical honest versions
because the mutation is the runtime swap, not of these files.
