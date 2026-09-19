#!/usr/bin/env bun
// MRVN-05 mutation laboratory helper.

import { spawn } from "bun";
import { readFileSync, writeFileSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { canonicalJson, type Json } from "../lab/canonical_json.ts";
import { computeArtifactId } from "../lab/artifact_id.ts";

const ROOT = resolve(import.meta.dir, "..");
const LAB = resolve(ROOT, "lab");
const BEND = resolve(ROOT, "..", "..", "..", "bend2", "main.ts");
const CANONICAL_ARTIFACT = resolve(ROOT, "artifact");
const SCRATCH = "/tmp/mrvn-mutations-scratch";

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
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

async function resyncManifest(outDir: string) {
  const manifestPath = resolve(outDir, "manifest.json");
  const m = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const f of m.payload.files) {
    const abs = resolve(outDir, f.path);
    f.sha256 = sha256File(abs);
    f.size = readFileSync(abs).length;
  }
  for (const d of m.payload.dependency_closure) {
    const abs = resolve(outDir, d.path);
    d.sha256 = sha256File(abs);
  }
  m.artifact_id = computeArtifactId(m);
  writeFileSync(manifestPath, canonicalJson(m as Json) + "\n");
}

async function runVerifier(outDir: string): Promise<{ exit: number; stdout: string; stderr: string; }> {
  const proc = spawn({
    cmd: ["bun", resolve(LAB, "verify_artifact.ts"), "--artifact", outDir, "--mode", "full", "--bend-runner", BEND],
    stdout: "pipe", stderr: "pipe",
  });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  await proc.exited;
  return { exit: proc.exitCode ?? 1, stdout, stderr };
}

interface Mutation {
  id: string;
  description: string;
  apply: (outDir: string) => Promise<void>;
  expectedClassification: string | "VERIFIED_DIFFERENT_SPEC";
}

const mutations: Mutation[] = [
  {
    id: "ART-MUT-01",
    description: "implementation byte tamper (modify one byte of main.bend without manifest update)",
    apply: async (outDir) => {
      await copyCanonical(outDir);
      const p = resolve(outDir, "payload", "main.bend");
      writeFileSync(p, "X" + readFileSync(p, "utf8"));
    },
    expectedClassification: "PAYLOAD_HASH_MISMATCH",
  },
  {
    id: "ART-MUT-02",
    description: "law byte tamper (modify one byte of LAWS.bend without manifest update)",
    apply: async (outDir) => {
      await copyCanonical(outDir);
      const p = resolve(outDir, "payload", "LAWS.bend");
      writeFileSync(p, "Y" + readFileSync(p, "utf8"));
    },
    expectedClassification: "PAYLOAD_HASH_MISMATCH",
  },
  {
    id: "ART-MUT-03",
    description: "proof byte tamper (modify one byte of PROOF.bend without manifest update)",
    apply: async (outDir) => {
      await copyCanonical(outDir);
      const p = resolve(outDir, "payload", "PROOF.bend");
      writeFileSync(p, "Z" + readFileSync(p, "utf8"));
    },
    expectedClassification: "PAYLOAD_HASH_MISMATCH",
  },
  {
    id: "ART-MUT-04",
    description: "rehash malicious payload, stale artifact_id",
    apply: async (outDir) => {
      await copyCanonical(outDir);
      const p = resolve(outDir, "payload", "main.bend");
      writeFileSync(p, "X" + readFileSync(p, "utf8"));
      await resyncManifest(outDir);
      const manifestPath = resolve(outDir, "manifest.json");
      const m = JSON.parse(readFileSync(manifestPath, "utf8"));
      m.artifact_id = "sha256:ef4d851ebbb35847730a72448d047678ac81e8bac9bbf05fa18c270b448f2bb3";
      writeFileSync(manifestPath, canonicalJson(m as Json) + "\n");
    },
    expectedClassification: "MANIFEST_ID_MISMATCH",
  },
  {
    id: "ART-MUT-05",
    description: "fully recomputed artifact with broken proof (INTEGRITY pass, PROOF fail)",
    apply: async (outDir) => {
      await copyCanonical(outDir);
      const p = resolve(outDir, "payload", "PROOF.bend");
      const text = readFileSync(p, "utf8");
      writeFileSync(p, text.slice(0, Math.floor(text.length / 2)));
      await resyncManifest(outDir);
    },
    expectedClassification: "PROOF_FAILED",
  },
  {
    id: "ART-MUT-06",
    description: "weaker law + matching proof + honest recompute (valid different specification)",
    apply: async (outDir) => {
      await copyCanonical(outDir);
      // Replace LAWS.bend and PROOF.bend with a minimal valid spec
      // (single law + matching proof).  Update the law_inventory
      // and resync.  The verifier must accept this as a different
      // but valid specification under its own artifact_id.
      const lawsPath = resolve(outDir, "payload", "LAWS.bend");
      writeFileSync(lawsPath, `# ART-MUT-06: minimal valid law book (different spec).
import Base
import ./main.bend as Gate

law closed_denies_everything:
  for +a: Gate.Actor
  for +c: Gate.Capability
  for +e: Gate.Evidence
  {Gate.authorize(a, c, Gate.Lifecycle.Closed{}, e)
     == Gate.Decision.Deny{Gate.DenyReason.Terminal{}}
   : Gate.Decision}
`);
      const proofPath = resolve(outDir, "payload", "PROOF.bend");
      writeFileSync(proofPath, `# ART-MUT-06: minimal proof for closed_denies_everything.
import Base
import ./main.bend as Gate
import ./LAWS.bend as Laws

def closed_denies_for_work(a: Gate.Actor, e: Gate.Evidence)
  -> {Gate.authorize(a, Gate.Capability.Work{}, Gate.Lifecycle.Closed{}, e)
        == Gate.Decision.Deny{Gate.DenyReason.Terminal{}}
      : Gate.Decision}:
  match a:
    case Gate.Actor.Agent{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Actor.Reviewer{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Actor.Automation{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}

def closed_denies_for_halt(a: Gate.Actor, e: Gate.Evidence)
  -> {Gate.authorize(a, Gate.Capability.Halt{}, Gate.Lifecycle.Closed{}, e)
        == Gate.Decision.Deny{Gate.DenyReason.Terminal{}}
      : Gate.Decision}:
  match a:
    case Gate.Actor.Agent{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Actor.Reviewer{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Actor.Automation{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}

def closed_denies_for_freeze(a: Gate.Actor, e: Gate.Evidence)
  -> {Gate.authorize(a, Gate.Capability.Freeze{}, Gate.Lifecycle.Closed{}, e)
        == Gate.Decision.Deny{Gate.DenyReason.Terminal{}}
      : Gate.Decision}:
  match a:
    case Gate.Actor.Agent{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Actor.Reviewer{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Actor.Automation{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}

def closed_denies_for_close(a: Gate.Actor, e: Gate.Evidence)
  -> {Gate.authorize(a, Gate.Capability.Close{}, Gate.Lifecycle.Closed{}, e)
        == Gate.Decision.Deny{Gate.DenyReason.Terminal{}}
      : Gate.Decision}:
  match a:
    case Gate.Actor.Agent{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Actor.Reviewer{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}
    case Gate.Actor.Automation{}:
      match e:
        case Gate.Evidence.None{}:   {==}
        case Gate.Evidence.Replay{}: {==}
        case Gate.Evidence.Live{}:   {==}

def Laws.closed_denies_everything(a, c, e):
  match c:
    case Gate.Capability.Work{}:   closed_denies_for_work(a, e)
    case Gate.Capability.Halt{}:   closed_denies_for_halt(a, e)
    case Gate.Capability.Freeze{}: closed_denies_for_freeze(a, e)
    case Gate.Capability.Close{}:  closed_denies_for_close(a, e)
`);
      const manifestPath = resolve(outDir, "manifest.json");
      const m = JSON.parse(readFileSync(manifestPath, "utf8"));
      m.payload.law_inventory.names = ["closed_denies_everything"];
      m.payload.law_inventory.count = 1;
      m.payload.law_inventory.source_file = "payload/LAWS.bend";
      const formal = m.claims.find((c: any) => c.claim_id === "formal-law-satisfaction");
      if (formal) formal.binds.law_count = 1;
      m.artifact_id = computeArtifactId(m);
      writeFileSync(manifestPath, canonicalJson(m as Json) + "\n");
      await resyncManifest(outDir);
    },
    expectedClassification: "VERIFIED_DIFFERENT_SPEC",
  },
  {
    id: "ART-MUT-07",
    description: "undeclared local dependency injection (helper.bend imported but not in manifest)",
    apply: async (outDir) => {
      await copyCanonical(outDir);
      writeFileSync(resolve(outDir, "payload", "helper.bend"), "def helper() -> U32:\n  return 0n\n");
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
      await resyncManifest(outDir);
    },
    expectedClassification: "UNDECLARED_DEPENDENCY",
  },
  {
    id: "ART-MUT-08",
    description: "absolute path escape",
    apply: async (outDir) => {
      await copyCanonical(outDir);
      mkdirSync("/tmp/mrvn-ext-mut", { recursive: true });
      writeFileSync("/tmp/mrvn-ext-mut/external.bend", "def external() -> U32:\n  return 0n\n");
      const proofPath = resolve(outDir, "payload", "PROOF.bend");
      const proofText = readFileSync(proofPath, "utf8");
      const lines = proofText.split("\n");
      let insertionPoint = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("import ")) { insertionPoint = i + 1; }
      }
      if (insertionPoint < 0) insertionPoint = 1;
      lines.splice(insertionPoint, 0, "import /tmp/mrvn-ext-mut/external.bend as External");
      writeFileSync(proofPath, lines.join("\n"));
      await resyncManifest(outDir);
    },
    expectedClassification: "PATH_AUTHORITY_VIOLATION",
  },
  {
    id: "ART-MUT-09",
    description: "../ traversal escape",
    apply: async (outDir) => {
      await copyCanonical(outDir);
      mkdirSync("/tmp/mrvn-ext-mut", { recursive: true });
      writeFileSync("/tmp/mrvn-ext-mut/traversal.bend", "def traversal() -> U32:\n  return 0n\n");
      const proofPath = resolve(outDir, "payload", "PROOF.bend");
      const proofText = readFileSync(proofPath, "utf8");
      const lines = proofText.split("\n");
      let insertionPoint = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("import ")) { insertionPoint = i + 1; }
      }
      if (insertionPoint < 0) insertionPoint = 1;
      lines.splice(insertionPoint, 0, "import ../../../../../tmp/mrvn-ext-mut/traversal.bend as T");
      writeFileSync(proofPath, lines.join("\n"));
      await resyncManifest(outDir);
    },
    expectedClassification: "PATH_AUTHORITY_VIOLATION",
  },
  {
    id: "ART-MUT-10",
    description: "symlink escape (replace payload/main.bend with a symlink outside)",
    apply: async (outDir) => {
      await copyCanonical(outDir);
      mkdirSync("/tmp/mrvn-ext-mut", { recursive: true });
      writeFileSync("/tmp/mrvn-ext-mut/evil.bend", "def evil() -> U32:\n  return 0n\n");
      rmSync(resolve(outDir, "payload", "main.bend"));
      symlinkSync("/tmp/mrvn-ext-mut/evil.bend", resolve(outDir, "payload", "main.bend"));
    },
    expectedClassification: "PATH_AUTHORITY_VIOLATION",
  },
  {
    id: "ART-MUT-11",
    description: "dropped law from manifest inventory",
    apply: async (outDir) => {
      await copyCanonical(outDir);
      // Drop a law from inventory but keep LAWS.bend unchanged, then
      // recompute artifact_id honestly so the only remaining failure
      // is LAW_INVENTORY_MISMATCH.
      const manifestPath = resolve(outDir, "manifest.json");
      const m = JSON.parse(readFileSync(manifestPath, "utf8"));
      m.payload.law_inventory.names = m.payload.law_inventory.names.slice(1);
      m.payload.law_inventory.count = m.payload.law_inventory.names.length;
      const formal = m.claims.find((c: any) => c.claim_id === "formal-law-satisfaction");
      if (formal) formal.binds.law_count = m.payload.law_inventory.names.length;
      // Recompute artifact_id to remove MANIFEST_ID_MISMATCH noise.
      m.artifact_id = computeArtifactId(m);
      writeFileSync(manifestPath, canonicalJson(m as Json) + "\n");
    },
    expectedClassification: "LAW_INVENTORY_MISMATCH",
  },
  {
    id: "ART-MUT-12",
    description: "fake PASS evidence (mutate proof-run.json to claim success while proof is broken)",
    apply: async (outDir) => {
      await copyCanonical(outDir);
      const p = resolve(outDir, "payload", "PROOF.bend");
      const text = readFileSync(p, "utf8");
      writeFileSync(p, text.slice(0, Math.floor(text.length / 2)));
      const recPath = resolve(outDir, "evidence", "proof-run.json");
      const rec = JSON.parse(readFileSync(recPath, "utf8"));
      rec.exit_code = 0;
      rec.stdout_match = true;
      writeFileSync(recPath, canonicalJson(rec as Json) + "\n");
      await resyncManifest(outDir);
    },
    expectedClassification: "CAPTURED_EVIDENCE_MISMATCH",
  },
];

async function runMutation(m: Mutation): Promise<{ id: string; expected: string; observed: string; observedAll: string[]; exit: number; matched: boolean }> {
  const outDir = resolve(SCRATCH, m.id);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  await m.apply(outDir);
  const result = await runVerifier(outDir);
  const observedAll: string[] = [];
  if (result.exit === 0) {
    observedAll.push("VERIFIED");
  } else {
    const matches = (result.stdout + "\n" + result.stderr).matchAll(/\[(\w+)\s*\/\s*([A-Z_]+)\]/g);
    for (const mm of matches) {
      if (!observedAll.includes(mm[2])) observedAll.push(mm[2]);
    }
  }
  const observed = observedAll[0] ?? "(none)";
  // A mutation PASSES when:
  //   - The expected classification appears in observedAll, OR
  //   - The expected is "VERIFIED_DIFFERENT_SPEC" and the verifier
  //     exited 0 (verifies a different spec under its own id).
  const matched = observedAll.includes(m.expectedClassification)
    || (m.expectedClassification === "VERIFIED_DIFFERENT_SPEC" && result.exit === 0);
  return { id: m.id, expected: m.expectedClassification, observed, observedAll, exit: result.exit, matched };
}

async function main() {
  let pass = 0, fail = 0;
  console.log("=== MRVN-05 mutation laboratory ===");
  for (const m of mutations) {
    const r = await runMutation(m);
    const tag = r.matched ? "PASS" : "FAIL";
    console.log(`  ${tag}  ${r.id.padEnd(13)} expected=${r.expected.padEnd(28)} observed=${r.observed.padEnd(20)} all=[${r.observedAll.join(",")}] exit=${r.exit}`);
    if (r.matched) pass++;
    else fail++;
  }
  console.log(`Results: ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });



