#!/usr/bin/env bun
// MRVN artifact root identity.
//
// Algorithm: sha256:canonical_manifest_minus_id:v1
//   1. Take the parsed manifest object.
//   2. Remove the top-level `artifact_id` field (it must not be hashed
//      into itself).
//   3. Remove non-semantic fields:
//        provenance.captured_at
//        provenance.build_command
//   4. Re-emit the manifest canonically (mrvn-canonical-json-v1,
//      compact form, no indentation).
//   5. SHA-256 the UTF-8 bytes of step 4.
//   6. Prefix with `sha256:`.
//
// The verifier always recomputes this from the manifest.  Build-time
// timestamps, build command strings, and the recorded build-time
// proof-run.json contents are explicitly non-semantic so that two
// builds of the same logical subject produce the same artifact_id.

import { createHash } from "node:crypto";
import { canonicalJson, type Json } from "./canonical_json.ts";

export const ARTIFACT_ID_ALGORITHM = "sha256:canonical_manifest_minus_id:v1";

const NON_SEMANTIC_PROVENANCE_FIELDS = new Set(["captured_at", "build_command"]);

export function computeArtifactId(manifest: { [k: string]: Json }): string {
  const core: { [k: string]: Json } = {};
  for (const k of Object.keys(manifest)) {
    if (k === "artifact_id") continue;
    if (k === "provenance") {
      const p = (manifest[k] as { [k: string]: Json }) ?? {};
      const p2: { [k: string]: Json } = {};
      for (const pk of Object.keys(p)) {
        if (NON_SEMANTIC_PROVENANCE_FIELDS.has(pk)) continue;
        p2[pk] = p[pk];
      }
      core[k] = p2;
      continue;
    }
    core[k] = manifest[k];
  }
  const bytes = new TextEncoder().encode(canonicalJson(core));
  const hash = createHash("sha256").update(bytes).digest("hex");
  return "sha256:" + hash;
}

export function canonicalManifestBytesWithoutId(manifest: { [k: string]: Json }): Uint8Array {
  const core: { [k: string]: Json } = {};
  for (const k of Object.keys(manifest)) {
    if (k === "artifact_id") continue;
    if (k === "provenance") {
      const p = (manifest[k] as { [k: string]: Json }) ?? {};
      const p2: { [k: string]: Json } = {};
      for (const pk of Object.keys(p)) {
        if (NON_SEMANTIC_PROVENANCE_FIELDS.has(pk)) continue;
        p2[pk] = p[pk];
      }
      core[k] = p2;
      continue;
    }
    core[k] = manifest[k];
  }
  return new TextEncoder().encode(canonicalJson(core));
}
