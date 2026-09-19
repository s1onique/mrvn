#!/usr/bin/env bun
// MRVN-05 verifier self-tests.
//
// The verifier is itself an authority-bearing program.  We attack it
// with the same negative tests a hostile producer / consumer might
// try: missing manifest, malformed JSON, missing payload, hash
// mismatch, size mismatch, artifact_id mismatch, undeclared
// dependency, path traversal, symlink escape, law inventory mismatch,
// proof non-zero, fake historical PASS, unsupported claim.
//
// All expected failures must produce a non-zero exit code from the
// verifier invocation.  This script asserts that.

import { spawn } from "bun";
import { readFileSync, writeFileSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { canonicalJson, type Json } from "./canonical_json.ts";

const ROOT = resolve(import.meta.dir, "..");
const LAB = resolve(ROOT, "lab");
const BEND = resolve(ROOT, "..", "..", "..", "bend2", "main.ts");
const CANONICAL_ARTIFACT = resolve(ROOT, "artifact");
const SCRATCH = "/tmp/mrvn-self-test-scratch";

interface TestCase {
  id: string;
  description: string;
  setup: (outDir: string) => Promise<void>;
  expectedFailureClass: string | null;
  expectedExit: 0 | 1;
}

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

async function runVerifier(outDir: string, mode: string): Promise<{ exit: number; stdout: string; stderr: string; }> {
  const proc = spawn({
    cmd: ["bun", resolve(LAB, "verify_artifact.ts"), "--artifact", outDir, "--mode", mode, "--bend-runner", BEND],
    stdout: "pipe", stderr: "pipe",
  });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  await proc.exited;
  return { exit: proc.exitCode ?? 1, stdout, stderr };
}

async function copyCanonical(outDir: string) {
  mkdirSync(outDir, { recursive: true });
  const proc = spawn({ cmd: ["cp", "-r", CANONICAL_ARTIFACT + "/.", outDir + "/"], stdout: "pipe", stderr: "pipe" });
  await new Response(proc.stdout).text();
  await new Response(proc.stderr).text();
  await proc.exited;
}

async function rewriteManifest(outDir: string, mutator: (m: any) => any) {
  const manifestPath = resolve(outDir, "manifest.json");
  const m = JSON.parse(readFileSync(manifestPath, "utf8"));
  const mutated = mutator(m);
  writeFileSync(manifestPath, canonicalJson(mutated as Json) + "\n");
}

// Helper: rebuild per-file hashes in payload.files and
// payload.dependency_closure to match on-disk bytes, and recompute the
// artifact_id.  This isolates the targeted failure class from
// PAYLOAD_HASH_MISMATCH/MANIFEST_ID_MISMATCH noise.
async function resyncManifestHashesAndId(outDir: string, mutator: (m: any) => any) {
  const manifestPath = resolve(outDir, "manifest.json");
  const m = JSON.parse(readFileSync(manifestPath, "utf8"));
  const mutated = mutator(m);
  // Recompute per-file hashes from disk.
  for (const f of mutated.payload.files) {
    const abs = resolve(outDir, f.path);
    f.sha256 = sha256File(abs);
    f.size = readFileSync(abs).length;
  }
  for (const d of mutated.payload.dependency_closure) {
    const abs = resolve(outDir, d.path);
    d.sha256 = sha256File(abs);
  }
  // Recompute artifact_id.
  const { computeArtifactId } = await import("./artifact_id.ts");
  const core: { [k: string]: any } = {};
  for (const k of Object.keys(mutated)) {
    if (k === "artifact_id") continue;
    if (k === "provenance") {
      const p = mutated[k];
      const p2: { [k: string]: any } = {};
      for (const pk of Object.keys(p)) {
        if (pk === "captured_at" || pk === "build_command") continue;
        p2[pk] = p[pk];
      }
      core[k] = p2;
      continue;
    }
    core[k] = mutated[k];
  }
  mutated.artifact_id = computeArtifactId(core);
  writeFileSync(manifestPath, canonicalJson(mutated as Json) + "\n");
}

const tests: TestCase[] = [];

tests.push({
  id: "0.canonical_passes",
  description: "Canonical artifact verifies in 'full' mode with exit 0.",
  setup: async (outDir) => { await copyCanonical(outDir); },
  expectedFailureClass: null,
  expectedExit: 0,
});

tests.push({
  id: "1.missing_manifest",
  description: "Removing manifest.json must yield SCHEMA_INVALID-like failure.",
  setup: async (outDir) => {
    await copyCanonical(outDir);
    rmSync(resolve(outDir, "manifest.json"));
  },
  expectedFailureClass: "SCHEMA_INVALID",
  expectedExit: 1,
});

tests.push({
  id: "2.malformed_manifest",
  description: "Corrupted JSON in manifest.json must yield SCHEMA_INVALID.",
  setup: async (outDir) => {
    await copyCanonical(outDir);
    writeFileSync(resolve(outDir, "manifest.json"), "{not json");
  },
  expectedFailureClass: "SCHEMA_INVALID",
  expectedExit: 1,
});

tests.push({
  id: "3.missing_required_field",
  description: "Removing claims[] from manifest must yield SCHEMA_INVALID.",
  setup: async (outDir) => {
    await copyCanonical(outDir);
    await rewriteManifest(outDir, (m) => { delete m.claims; return m; });
  },
  expectedFailureClass: "SCHEMA_INVALID",
  expectedExit: 1,
});

tests.push({
  id: "4.missing_payload",
  description: "Removing payload/main.bend must yield PAYLOAD_MISSING.",
  setup: async (outDir) => {
    await copyCanonical(outDir);
    rmSync(resolve(outDir, "payload", "main.bend"));
  },
  expectedFailureClass: "PAYLOAD_MISSING",
  expectedExit: 1,
});

tests.push({
  id: "5.duplicate_payload_path",
  description: "Manifest listing the same payload path twice yields SCHEMA_INVALID.",
  setup: async (outDir) => {
    await copyCanonical(outDir);
    await rewriteManifest(outDir, (m) => {
      m.payload.files.push({ ...m.payload.files[0] });
      return m;
    });
  },
  expectedFailureClass: "SCHEMA_INVALID",
  expectedExit: 1,
});

tests.push({
  id: "5b.duplicate_payload_resync",
  description: "Adding a duplicate but ALSO recomputing artifact_id still yields SCHEMA_INVALID (the duplicate is structural).",
  setup: async (outDir) => {
    await copyCanonical(outDir);
    await resyncManifestHashesAndId(outDir, (m) => {
      m.payload.files.push({ ...m.payload.files[0] });
      return m;
    });
  },
  expectedFailureClass: "SCHEMA_INVALID",
  expectedExit: 1,
});

tests.push({
  id: "6.hash_mismatch",
  description: "Modifying payload/main.bend bytes without updating manifest yields PAYLOAD_HASH_MISMATCH.",
  setup: async (outDir) => {
    await copyCanonical(outDir);
    writeFileSync(resolve(outDir, "payload", "main.bend"), "X" + readFileSync(resolve(outDir, "payload", "main.bend"), "utf8"));
  },
  expectedFailureClass: "PAYLOAD_HASH_MISMATCH",
  expectedExit: 1,
});

tests.push({
  id: "7.size_mismatch",
  description: "Appending a byte to payload/LAWS.bend without updating manifest yields PAYLOAD_SIZE_MISMATCH.",
  setup: async (outDir) => {
    await copyCanonical(outDir);
    writeFileSync(resolve(outDir, "payload", "LAWS.bend"), readFileSync(resolve(outDir, "payload", "LAWS.bend"), "utf8") + "X");
  },
  expectedFailureClass: "PAYLOAD_SIZE_MISMATCH",
  expectedExit: 1,
});

tests.push({
  id: "8.artifact_id_mismatch",
  description: "Updating payload.files[*].sha256 without recomputing artifact_id yields MANIFEST_ID_MISMATCH.",
  setup: async (outDir) => {
    await copyCanonical(outDir);
    await rewriteManifest(outDir, (m) => {
      const formal = m.claims.find((c: any) => c.claim_id === "formal-law-satisfaction");
      if (formal) formal.binds.implementation_sha256 = "0".repeat(64);
      return m;
    });
  },
  expectedFailureClass: "MANIFEST_ID_MISMATCH",
  expectedExit: 1,
});

tests.push({
  id: "9.undeclared_dependency",
  description: "Adding an undeclared helper.bend imported by PROOF.bend yields UNDECLARED_DEPENDENCY.",
  setup: async (outDir) => {
    await copyCanonical(outDir);
    const helperPath = resolve(outDir, "payload", "helper.bend");
    writeFileSync(helperPath, "def helper() -> U32:\n  return 0n\n");
    const proofPath = resolve(outDir, "payload", "PROOF.bend");
    const proofText = readFileSync(proofPath, "utf8");
    const lines = proofText.split("\n");
    let insertionPoint = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("import ")) { insertionPoint = i + 1; }
    }
    if (insertionPoint < 0) insertionPoint = 1;
    lines.splice(insertionPoint, 0, "import ./helper.bend as Helper");
    writeFileSync(proofPath, lines.join("\n"));
  },
  expectedFailureClass: "UNDECLARED_DEPENDENCY",
  expectedExit: 1,
});

tests.push({
  id: "10.absolute_path_escape",
  description: "Adding an absolute-path import to PROOF.bend yields PATH_AUTHORITY_VIOLATION.",
  setup: async (outDir) => {
    await copyCanonical(outDir);
    mkdirSync("/tmp/mrvn-external", { recursive: true });
    writeFileSync("/tmp/mrvn-external/external.bend", "def external() -> U32:\n  return 0n\n");
    const proofPath = resolve(outDir, "payload", "PROOF.bend");
    const proofText = readFileSync(proofPath, "utf8");
    const lines = proofText.split("\n");
    let insertionPoint = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("import ")) { insertionPoint = i + 1; }
    }
    if (insertionPoint < 0) insertionPoint = 1;
    lines.splice(insertionPoint, 0, "import /tmp/mrvn-external/external.bend as External");
    writeFileSync(proofPath, lines.join("\n"));
  },
  expectedFailureClass: "PATH_AUTHORITY_VIOLATION",
  expectedExit: 1,
});

tests.push({
  id: "11.traversal_escape",
  description: "Adding a ../ traversal import yields PATH_AUTHORITY_VIOLATION (with manifest resync).",
  setup: async (outDir) => {
    await copyCanonical(outDir);
    mkdirSync("/tmp/mrvn-external", { recursive: true });
    writeFileSync("/tmp/mrvn-external/traversal.bend", "def traversal() -> U32:\n  return 0n\n");
    const proofPath = resolve(outDir, "payload", "PROOF.bend");
    const proofText = readFileSync(proofPath, "utf8");
    const lines = proofText.split("\n");
    let insertionPoint = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("import ")) { insertionPoint = i + 1; }
    }
    if (insertionPoint < 0) insertionPoint = 1;
    // 5 levels up from payload/ escapes the artifact root on macOS
    // (artifact lives under /private/tmp/...).  Linux needs only 4.
    lines.splice(insertionPoint, 0, "import ../../../../../tmp/mrvn-external/traversal.bend as T");
    writeFileSync(proofPath, lines.join("\n"));
    // Resync manifest hashes so the only failure is the path authority violation.
    await resyncManifestHashesAndId(outDir, (m) => m);
  },
  expectedFailureClass: "PATH_AUTHORITY_VIOLATION",
  expectedExit: 1,
});

tests.push({
  id: "12.symlink_escape",
  description: "Replacing payload/main.bend with a symlink to outside yields PATH_AUTHORITY_VIOLATION.",
  setup: async (outDir) => {
    await copyCanonical(outDir);
    mkdirSync("/tmp/mrvn-symlink-target", { recursive: true });
    writeFileSync("/tmp/mrvn-symlink-target/evil.bend", "def evil() -> U32:\n  return 0n\n");
    rmSync(resolve(outDir, "payload", "main.bend"));
    symlinkSync("/tmp/mrvn-symlink-target/evil.bend", resolve(outDir, "payload", "main.bend"));
  },
  expectedFailureClass: "PATH_AUTHORITY_VIOLATION",
  expectedExit: 1,
});

tests.push({
  id: "13.law_inventory_mismatch",
  description: "Removing a law from manifest's law_inventory.names yields LAW_INVENTORY_MISMATCH (with manifest resync).",
  setup: async (outDir) => {
    await copyCanonical(outDir);
    await resyncManifestHashesAndId(outDir, (m) => {
      m.payload.law_inventory.names = m.payload.law_inventory.names.slice(1);
      m.payload.law_inventory.count = m.payload.law_inventory.names.length;
      // Update the formal claim's binds.law_count to match so the
      // resync doesn't produce MANIFEST_ID_MISMATCH noise.
      const formal = m.claims.find((c: any) => c.claim_id === "formal-law-satisfaction");
      if (formal) formal.binds.law_count = m.payload.law_inventory.names.length;
      return m;
    });
  },
  expectedFailureClass: "LAW_INVENTORY_MISMATCH",
  expectedExit: 1,
});

tests.push({
  id: "14.proof_failed",
  description: "Truncating PROOF.bend mid-proof yields PROOF_FAILED.",
  setup: async (outDir) => {
    await copyCanonical(outDir);
    const p = resolve(outDir, "payload", "PROOF.bend");
    const text = readFileSync(p, "utf8");
    writeFileSync(p, text.slice(0, Math.floor(text.length / 2)));
  },
  expectedFailureClass: "PROOF_FAILED",
  expectedExit: 1,
});

tests.push({
  id: "15.fake_pass_evidence",
  description: "Mutating proof-run.json to claim exit_code=0 when proof is broken yields CAPTURED_EVIDENCE_MISMATCH.",
  setup: async (outDir) => {
    await copyCanonical(outDir);
    const p = resolve(outDir, "payload", "PROOF.bend");
    const text = readFileSync(p, "utf8");
    writeFileSync(p, text.slice(0, Math.floor(text.length / 2)));
    const recPath = resolve(outDir, "evidence", "proof-run.json");
    const rec = JSON.parse(readFileSync(recPath, "utf8"));
    rec.exit_code = 0;
    rec.stdout_match = true;
    writeFileSync(recPath, canonicalJson(rec as Json) + "\n");
  },
  expectedFailureClass: "CAPTURED_EVIDENCE_MISMATCH",
  expectedExit: 1,
});

tests.push({
  id: "16.unsupported_claim",
  description: "Adding a claim with kind UNRECOGNIZED yields UNSUPPORTED_CLAIM.",
  setup: async (outDir) => {
    await copyCanonical(outDir);
    await rewriteManifest(outDir, (m) => {
      m.claims.push({
        claim_id: "wild-claim",
        kind: "UNRECOGNIZED_KIND",
        statement: "implementation is fully correct and safe",
        scope: { establishes: ["everything"], does_not_establish: [] },
        binds: {},
      });
      return m;
    });
  },
  expectedFailureClass: "UNSUPPORTED_CLAIM",
  expectedExit: 1,
});

tests.push({
  id: "17.toolchain_mismatch",
  description: "Tampering the declared bend_runner_sha256 in the manifest yields TOOLCHAIN_MISMATCH.",
  setup: async (outDir) => {
    await copyCanonical(outDir);
    await rewriteManifest(outDir, (m) => {
      m.provenance.toolchain.bend_runner_sha256 = "f".repeat(64);
      return m;
    });
  },
  expectedFailureClass: "TOOLCHAIN_MISMATCH",
  expectedExit: 1,
});

tests.push({
  id: "18.toolchain_unavailable",
  description: "Invoking the verifier without --bend-runner yields TOOLCHAIN_UNAVAILABLE for the proof phase.",
  setup: async (outDir) => { await copyCanonical(outDir); },
  expectedFailureClass: "TOOLCHAIN_UNAVAILABLE",
  expectedExit: 1,
});

async function runTest(tc: TestCase): Promise<{ id: string; exit: number; expectedExit: number; observedClass: string | null; matched: boolean }> {
  const outDir = resolve(SCRATCH, tc.id);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  await tc.setup(outDir);

  let result;
  if (tc.id === "18.toolchain_unavailable") {
    const proc = spawn({
      cmd: ["bun", resolve(LAB, "verify_artifact.ts"), "--artifact", outDir, "--mode", "full"],
      stdout: "pipe", stderr: "pipe",
    });
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    await proc.exited;
    result = { exit: proc.exitCode ?? 1, stdout, stderr };
  } else {
    result = await runVerifier(outDir, "full");
  }

  let observedClass: string | null = null;
  if (tc.expectedFailureClass !== null) {
    const failMatches = (result.stdout + "\n" + result.stderr).matchAll(/\[(\w+)\s*\/\s*([A-Z_]+)\]/g);
    for (const m of failMatches) {
      if (m[2] === tc.expectedFailureClass) {
        observedClass = m[2];
        break;
      }
      if (observedClass === null) observedClass = m[2];
    }
  }
  const matched = result.exit === tc.expectedExit && (tc.expectedFailureClass === null ? true : observedClass === tc.expectedFailureClass);
  return { id: tc.id, exit: result.exit, expectedExit: tc.expectedExit, observedClass, matched };
}

async function main() {
  let passed = 0, failed = 0;
  console.log("=== MRVN-05 verifier self-tests ===");
  for (const tc of tests) {
    const r = await runTest(tc);
    const tag = r.matched ? "PASS" : "FAIL";
    console.log(
      `  ${tag}  ${r.id.padEnd(36)} exit=${r.exit} expected_exit=${r.expectedExit} observed_class=${r.observedClass ?? "(pass)"}`
    );
    if (r.matched) passed++;
    else failed++;
  }
  console.log(`Results: ${passed} pass, ${failed} fail`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });






