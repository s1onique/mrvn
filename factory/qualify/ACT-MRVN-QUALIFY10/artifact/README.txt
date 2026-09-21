NON-AUTHORITATIVE / NO_BUILD_OUTPUT_HERE

This directory is intentionally empty.

CORRECTION01: build_artifact_v2.ts no longer writes
`artifact/manifest.json`. The canonical per-backend artifacts live at
`artifact-js/manifest.json` (sha256-anchored by `artifact-js/manifest.sha256`)
and `artifact-c/manifest.json` (sha256-anchored by `artifact-c/manifest.sha256`).

If `artifact/manifest.json` reappears, it is a stale intermediate
that should NOT be treated as canonical. The lab artifact_index.json
points to `artifact-{js,c}/manifest.json` only.
