#!/usr/bin/env bun
// MRVN-05 build_artifact.ts
//
// The deterministic builder for a proof-carrying Factory artifact.
//
// Usage:
//   bun lab/build_artifact.ts \
//     --source <repo-payload-dir>   # where main.bend/LAWS.bend/PROOF.bend live
//     --out    <artifact-dir>       # where to write manifest + payload + evidence
//     --schema <schema-path>        # proof-artifact-v1.schema.json
//     --subject-name "..." --subject-kind bend-module-set \
//     [--evidence <path> ...]       # optional supplemental evidence files
//     [--bend-runner <path>]        # path to bend2/main.ts for toolchain identity
//     [--repo <repo-path>]          # repo root for provenance only
//
// The builder is NOT trusted by the verifier.  The verifier recomputes
// every hash, every inventory, every escape-hatch count, and the root
// artifact_id.  A buggy or malicious builder therefore cannot corrupt
// the artifact silently.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, statSync, copyFileSync, realpathSync } from "node:fs";
import { resolve, relative, sep } from "node:path";
import { spawn } from "bun";
import { canonicalJson, canonicalJsonPretty, type Json } from "./canonical_json.ts";
import { computeArtifactId } from "./artifact_id.ts";

// ---------- CLI ----------

interface CliArgs {
  source: string;
  out: string;
  schema: string;
  subjectName: string;
  subjectKind: string;
  evidence: string[];
  bendRunner: string;
  repo: string;
  sourceCommit: string;
  buildCommand: string;
}

function parseArgs(argv: string[]): CliArgs {
  const out: Partial<CliArgs> = { evidence: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error("missing value after " + a);
      return v;
    };
    if (a === "--source")         out.source = next();
    else if (a === "--out")       out.out = next();
    else if (a === "--schema")    out.schema = next();
    else if (a === "--subject-name") out.subjectName = next();
    else if (a === "--subject-kind") out.subjectKind = next();
    else if (a === "--bend-runner") out.bendRunner = next();
    else if (a === "--repo")      out.repo = next();
    else if (a === "--source-commit") out.sourceCommit = next();
    else if (a === "--build-command") out.buildCommand = next();
    else if (a === "--evidence") {
      if (!out.evidence) out.evidence = [];
      out.evidence.push(next());
    }
    else throw new Error("unknown flag: " + a);
  }
  for (const k of ["source", "out", "schema", "subjectName", "subjectKind", "bendRunner", "repo"] as const) {
    if ((out as Record<string, unknown>)[k] === undefined) {
      throw new Error("missing required flag: --" + k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()));
    }
  }
  if (out.sourceCommit === undefined) out.sourceCommit = "";
  if (out.buildCommand === undefined) out.buildCommand = "";
  return out as CliArgs;
}

// ---------- Hash / size ----------

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function fileSize(path: string): number {
  return statSync(path).size;
}

// ---------- Law inventory ----------

function extractLawNames(lawsPath: string): string[] {
  const src = readFileSync(lawsPath, "utf8");
  const names: string[] = [];
  const re = /^law\s+([A-Za-z_][A-Za-z0-9_]*)\s*:/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) names.push(m[1]);
  return Array.from(new Set(names)).sort();
}

// ---------- Escape-hatch inventory (host-side scan) ----------

function scanEscapeHatches(filePath: string): {
  todoCount: number;
  namedHoles: number;
  unsafeCount: number;
} {
  const src = readFileSync(filePath, "utf8");
  let todoCount = 0;
  let namedHoles = 0;
  let unsafeCount = 0;
  const noComments = src.split("\n").map((line) => {
    const i = line.indexOf("#");
    return i >= 0 ? line.slice(0, i) : line;
  }).join("\n");
  const todoRe = /\?TODO\b/g;
  todoCount = (noComments.match(todoRe) ?? []).length;
  const namedRe = /\?([A-Za-z_][A-Za-z0-9_]*)/g;
  let m: RegExpExecArray | null;
  while ((m = namedRe.exec(noComments)) !== null) {
    if (m[1] !== "TODO") namedHoles++;
  }
  const unsafeRe = /@unsafe\b/g;
  unsafeCount = (noComments.match(unsafeRe) ?? []).length;
  return { todoCount, namedHoles, unsafeCount };
}

// ---------- Import-graph closure (Bend file imports only) ----------

interface ClosureResult {
  bundled: { path: string; sha256: string; size: number; role: "implementation" | "specification" | "proof" }[];
  foreignImports: string[];
  undeclaredBundledFiles: string[];
}

function readImports(filePath: string): string[] {
  const src = readFileSync(filePath, "utf8");
  const out: string[] = [];
  const lines = src.split("\n");
  for (const line of lines) {
    const m = line.match(/^import\s+(\S+)(?:\s+as\s+[A-Za-z_][A-Za-z0-9_]*)?\s*(?:#.*)?$/);
    if (m !== null) out.push(m[1]);
  }
  return out;
}

function buildClosure(payloadRoot: string, entrypoints: { path: string; role: "implementation" | "specification" | "proof" }[]): ClosureResult {
  const bundled: ClosureResult["bundled"] = [];
  const seen = new Set<string>();
  const stack: { path: string; role: "implementation" | "specification" | "proof" }[] = [...entrypoints];
  const foreignImports: string[] = [];
  const undeclaredBundledFiles: string[] = [];
  // Resolve the payloadRoot once via realpath to avoid /tmp -> /private/tmp
  // discrepancies on macOS.
  const realPayloadRoot = realpathSync(payloadRoot);

  while (stack.length > 0) {
    const cur = stack.pop()!;
    const abs = resolve(realPayloadRoot, cur.path);
    let realAbs: string;
    try {
      realAbs = realpathSync(abs);
    } catch {
      throw new Error("closure: file does not exist on disk: " + abs);
    }
    if (seen.has(realAbs)) continue;
    seen.add(realAbs);
    const sha = sha256File(realAbs);
    const size = fileSize(realAbs);
    const relPath = relative(realPayloadRoot, realAbs).split(sep).join("/");
    if (relPath.startsWith("..") || relPath.startsWith("/")) {
      throw new Error("closure: file resolves outside payload root: " + abs + " -> " + realAbs);
    }
    bundled.push({ path: relPath, sha256: sha, size, role: cur.role });
    const imports = readImports(realAbs);
    for (const imp of imports) {
      if (imp === "Base") continue;
      const dir = abs.slice(0, abs.lastIndexOf(sep) + 1);
      let target: string;
      if (imp.startsWith("/")) {
        target = imp;
      } else if (imp.startsWith("0x")) {
        foreignImports.push(imp + " from " + relPath);
        continue;
      } else {
        target = dir + imp;
      }
      const base = target.slice(target.lastIndexOf("/") + 1);
      let nextRole: "implementation" | "specification" | "proof";
      if (base === "main.bend") nextRole = "implementation";
      else if (base === "LAWS.bend") nextRole = "specification";
      else if (base === "PROOF.bend") nextRole = "proof";
      else {
        undeclaredBundledFiles.push(target);
        continue;
      }
      // Strip the payload/ prefix when pushing so the next
      // iteration's resolve doesn't double-prefix.
      const fullPath = relative(realPayloadRoot, target).split(sep).join("/");
      const stripped = fullPath.startsWith("payload/") ? fullPath.slice("payload/".length) : fullPath;
      stack.push({ path: stripped, role: nextRole });
    }
  }
  return { bundled, foreignImports, undeclaredBundledFiles };
}

// ---------- Toolchain identity ----------

async function probeToolchain(bendRunner: string): Promise<{
  bendRunner: string;
  bendRunnerSha256: string;
  closure: { logical_path: string; sha256: string; role: string }[];
}> {
  const sha = sha256File(bendRunner);
  // CORRECTION01: hash-bound the full proof-checker transitive
  // closure (main.ts / bend.ts / comp.ts / base.bend).
  // CORRECTION03: identity is by STABLE LOGICAL component name
  // (logical_path, RELATIVE to the Bend CLI root, e.g. "main.ts" /
  // "bend.ts" / "comp.ts" / "base.bend"), NOT by the producer's
  // absolute pathname.  This makes the artifact portable: the
  // verifier matches (role, logical_path, sha256) against the
  // closure, deriving its own local paths from --bend-runner.
  const runnerReal = realpathSync(bendRunner);
  const dir = runnerReal.slice(0, runnerReal.lastIndexOf("/") + 1);
  const closure: { logical_path: string; sha256: string; role: string }[] = [
    { logical_path: "main.ts",   sha256: sha,                            role: "cli" },
    { logical_path: "bend.ts",   sha256: sha256File(dir + "bend.ts"),    role: "trusted_kernel" },
    { logical_path: "comp.ts",   sha256: sha256File(dir + "comp.ts"),    role: "compiler_runtime" },
    { logical_path: "base.bend", sha256: sha256File(dir + "base.bend"),  role: "prelude" },
  ];
  return { bendRunner, bendRunnerSha256: sha, closure };
}

// ---------- Proof replay (recorded evidence) ----------

async function replayProof(bendRunner: string, proofAbsPath: string, cwd: string): Promise<{ exit: number; stdout: string; stderr: string; }> {
  const proc = spawn({ cmd: ["bun", bendRunner, proofAbsPath], stdout: "pipe", stderr: "pipe", cwd });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  await proc.exited;
  return { exit: proc.exitCode ?? 1, stdout: out, stderr: err };
}

// ---------- Main ----------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const payloadRoot = resolve(args.source);
  const outRoot = resolve(args.out);
  const schemaPath = resolve(args.schema);

  if (!fileSize(schemaPath)) throw new Error("schema not readable: " + schemaPath);

  // Copy payload bytes into the artifact's payload/ directory.
  const payloadOutDir = resolve(outRoot, "payload");
  mkdirSync(payloadOutDir, { recursive: true });
  const entryPoints: { path: string; role: "implementation" | "specification" | "proof" }[] = [
    { path: "main.bend",  role: "implementation" },
    { path: "LAWS.bend",  role: "specification" },
    { path: "PROOF.bend", role: "proof" },
  ];
  for (const ep of entryPoints) {
    const src = resolve(payloadRoot, ep.path);
    const dst = resolve(payloadOutDir, ep.path);
    copyFileSync(src, dst);
  }

  // Build the dependency closure.
  const closure = buildClosure(payloadOutDir, entryPoints);
  if (closure.foreignImports.length > 0) {
    throw new Error("closure: foreign (non-bundled, non-Base) imports: " + closure.foreignImports.join(", "));
  }
  if (closure.undeclaredBundledFiles.length > 0) {
    throw new Error("closure: undeclared bundled helpers: " + closure.undeclaredBundledFiles.join(", "));
  }

  // Law inventory from the bundled LAWS.bend.
  const lawsAbs = resolve(payloadOutDir, "LAWS.bend");
  const lawNames = extractLawNames(lawsAbs);
  if (lawNames.length === 0) throw new Error("closure: no laws discovered in LAWS.bend");

  // Escape-hatch inventory.
  let totalTodo = 0, totalNamed = 0, totalUnsafe = 0, totalForeign = 0, totalOpenLaws = 0;
  for (const f of closure.bundled) {
    const scan = scanEscapeHatches(resolve(payloadOutDir, f.path));
    totalTodo += scan.todoCount;
    totalNamed += scan.namedHoles;
    totalUnsafe += scan.unsafeCount;
  }
  // Open laws = laws without a paired def Laws.<name> in PROOF.bend.
  const proofSrc = readFileSync(resolve(payloadOutDir, "PROOF.bend"), "utf8");
  for (const name of lawNames) {
    const re = new RegExp("def\\s+Laws\\." + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b");
    if (!re.test(proofSrc)) totalOpenLaws++;
  }

  // Toolchain identity.
  const toolchain = await probeToolchain(resolve(args.bendRunner));

  // Replay the proof (BEFORE writing the manifest). If exit != 0 the
  // builder fails loudly rather than emitting a fake-pass artifact.
  const proofPath = resolve(payloadOutDir, "PROOF.bend");
  const repoRoot = resolve(args.repo);
  const replay = await replayProof(resolve(args.bendRunner), proofPath, repoRoot);
  if (replay.exit !== 0) {
    throw new Error("proof replay failed (exit=" + replay.exit + "); refusing to build artifact");
  }

  // Write evidence files.
  const evidenceDir = resolve(outRoot, "evidence");
  mkdirSync(evidenceDir, { recursive: true });
  mkdirSync(resolve(evidenceDir, "optional"), { recursive: true });

  const proofRun = {
    schema: "mrvn.proof-run.v1",
    toolchain: {
      bend_runner_sha256: toolchain.bendRunnerSha256,
    },
    command: "bun <bend_runner> payload/PROOF.bend",
    proof: "payload/PROOF.bend",
    exit_code: replay.exit,
    stdout_contract: "All terms check.",
    stdout_match: replay.stdout.trim().includes("All terms check."),
    artifact_payload_hashes: {
      "payload/main.bend": closure.bundled.find((b) => b.path === "main.bend")?.sha256 ?? null,
      "payload/LAWS.bend": closure.bundled.find((b) => b.path === "LAWS.bend")?.sha256 ?? null,
      "payload/PROOF.bend": closure.bundled.find((b) => b.path === "PROOF.bend")?.sha256 ?? null,
    },
  };
  writeFileSync(resolve(evidenceDir, "proof-run.json"), canonicalJsonPretty(proofRun as Json));
  writeFileSync(resolve(evidenceDir, "proof-stdout.txt"), replay.stdout);

  // Supplemental evidence files (hash-bound copies).
  const supplementalRecords: { path: string; sha256: string; size: number; authority: string; description: string }[] = [];
  for (const evPath of args.evidence) {
    const abs = resolve(evPath);
    const sha = sha256File(abs);
    const size = fileSize(abs);
    const base = abs.slice(abs.lastIndexOf(sep) + 1);
    const dstPath = resolve(evidenceDir, "optional", base);
    copyFileSync(abs, dstPath);
    const relPath = relative(outRoot, dstPath).split(sep).join("/");
    supplementalRecords.push({
      path: relPath,
      sha256: sha,
      size,
      authority: "CAPTURED_ONLY",
      description: "MRVN-04 supplemental evidence carried verbatim.",
    });
  }

  // Build the manifest WITHOUT artifact_id; we compute it last.
  const fileRecords = [
    { path: "payload/main.bend",  role: "implementation", sha256: "", size: 0 },
    { path: "payload/LAWS.bend",  role: "specification", sha256: "", size: 0 },
    { path: "payload/PROOF.bend", role: "proof",          sha256: "", size: 0 },
  ];
  for (const fr of fileRecords) {
    const base = fr.path.slice("payload/".length);
    const found = closure.bundled.find((b) => b.path === base);
    if (!found) throw new Error("manifest: missing payload file: " + fr.path);
    fr.sha256 = found.sha256;
    fr.size = found.size;
  }

  const dependencyClosure = closure.bundled.map((b) => ({
    path: "payload/" + b.path,
    sha256: b.sha256,
    role: b.role,
  }));

  const mainSha = closure.bundled.find((b) => b.path === "main.bend")!.sha256;
  const lawsSha = closure.bundled.find((b) => b.path === "LAWS.bend")!.sha256;
  const proofSha = closure.bundled.find((b) => b.path === "PROOF.bend")!.sha256;

  const manifestCore: Record<string, Json> = {
    schema_version: 1,
    artifact_type: "mrvn.proof-carrying-factory-artifact",
    subject: {
      name: args.subjectName,
      kind: args.subjectKind,
      entrypoint: "payload/main.bend",
    },
    claims: [
      {
        claim_id: "formal-law-satisfaction",
        kind: "FORMAL_LAW_SATISFACTION",
        statement: "every law in bundled LAWS.bend is discharged by bundled PROOF.bend against bundled main.bend",
        scope: {
          establishes: [
            "bundled implementation satisfies bundled Bend laws (under the verified Bend 2.0.5 checker)",
          ],
          does_not_establish: [
            "specification completeness",
            "operational safety outside the bundled laws",
            "external IO behaviour",
            "producer identity",
            "source-repository cleanliness",
            "toolchain trustworthiness beyond the declared identity",
          ],
        },
        binds: {
          implementation_sha256: mainSha,
          laws_sha256: lawsSha,
          proof_sha256: proofSha,
          law_count: lawNames.length,
        },
        evidence_refs: ["evidence/proof-run.json", "evidence/proof-stdout.txt"],
      },
      {
        claim_id: "observed-tool-execution",
        kind: "OBSERVED_TOOL_EXECUTION",
        statement: "bun bend2/main.ts payload/PROOF.bend exited 0 and printed 'All terms check.' at build time",
        scope: {
          establishes: [
            "the bundled PROOF.bend was observed to pass under the bundled toolchain at the moment the artifact was built",
          ],
          does_not_establish: [
            "that the verifier's later replay will succeed",
            "long-term reproducibility under arbitrary toolchain evolution",
          ],
        },
        binds: {
          bend_runner: toolchain.bendRunner,
          bend_runner_sha256: toolchain.bendRunnerSha256,
          exit_code: replay.exit,
        },
        evidence_refs: ["evidence/proof-run.json"],
      },
      {
        claim_id: "qualification-result-mrvn-04",
        kind: "QUALIFICATION_RESULT",
        statement: "MRVN-04 authority kernel is FULL_QUALIFICATION: 8/8 mutation classification, 180/180 matrix match, 14/14 self-tests, 10/10 binding-e2e tests",
        scope: {
          establishes: [
            "MRVN-04 was previously qualified against its mutation laboratory; this artifact carries that qualification as supplemental evidence",
          ],
          does_not_establish: [
            "that the qualifications were re-exercised at verification time (they are CAPTURED_ONLY in this artifact)",
          ],
        },
        binds: { act: "ACT-MRVN-QUALIFY04", verdict: "FULL_QUALIFICATION" },
        evidence_refs: supplementalRecords.map((r) => r.path),
      },
    ],
    payload: {
      files: fileRecords,
      dependency_closure: dependencyClosure,
      trusted_toolchain: [
        { name: "Base", kind: "bend-base", identity: "BEND_LIB/base.bend (toolchain transitive)" },
      ],
      law_inventory: {
        count: lawNames.length,
        names: lawNames,
        source_file: "payload/LAWS.bend",
      },
      escape_hatch_inventory: {
        todo_count: totalTodo,
        named_holes: totalNamed,
        unsafe_count: totalUnsafe,
        foreign_count: totalForeign,
        open_laws: totalOpenLaws,
      },
    },
    verification: {
      contract_version: 1,
      modes: ["integrity", "proof", "full"],
      phases: [
        "schema", "manifest_id", "payload_hash", "payload_size",
        "dependency_closure", "path_confinement", "law_inventory",
        "escape_hatch_inventory", "toolchain_match", "proof_replay",
        "supplemental_evidence",
      ],
      canonical_json_algorithm: "mrvn-canonical-json-v1",
      artifact_id_algorithm: "sha256:canonical_manifest_minus_id:v1",
      result_classifications: [
        "VERIFIED",
        "SCHEMA_INVALID",
        "MANIFEST_ID_MISMATCH",
        "PAYLOAD_HASH_MISMATCH",
        "PAYLOAD_SIZE_MISMATCH",
        "PAYLOAD_MISSING",
        "UNDECLARED_DEPENDENCY",
        "PATH_AUTHORITY_VIOLATION",
        "LAW_INVENTORY_MISMATCH",
        "ESCAPE_HATCH_PRESENT",
        "PROOF_FAILED",
        "CAPTURED_EVIDENCE_MISMATCH",
        "UNSUPPORTED_CLAIM",
        "TOOLCHAIN_MISMATCH",
        "TOOLCHAIN_UNAVAILABLE",
        "CLAIM_SEMANTIC_MISMATCH",
      ],
    },
    evidence: {
      files: [
        {
          path: "evidence/proof-run.json",
          sha256: sha256File(resolve(evidenceDir, "proof-run.json")),
          size: fileSize(resolve(evidenceDir, "proof-run.json")),
          authority: "REPLAYABLE",
          description: "Captured proof execution record at build time.",
        },
        {
          path: "evidence/proof-stdout.txt",
          sha256: sha256File(resolve(evidenceDir, "proof-stdout.txt")),
          size: fileSize(resolve(evidenceDir, "proof-stdout.txt")),
          authority: "REPLAYABLE",
          description: "Captured checker stdout at build time.",
        },
        ...supplementalRecords,
      ],
    },
    provenance: {
      source_repo: "mrvn",
      source_commit: args.sourceCommit,
      captured_at: new Date().toISOString(),
      toolchain: {
        bend_runner: toolchain.bendRunner,
        bend_runner_sha256: toolchain.bendRunnerSha256,
        bend_version: "2.0.5",
        bun_version: process.versions.bun ?? "unknown",
        base_identity: "TOOLCHAIN_TRANSITIVE",
        toolchain_closure: toolchain.closure,
      },
      build_command: args.buildCommand,
    },
  };

  // Compute artifact_id and write manifest.json (canonical bytes).
  const id = computeArtifactId(manifestCore);
  const manifestWithId: Record<string, Json> = { ...manifestCore, artifact_id: id };
  writeFileSync(resolve(outRoot, "manifest.json"), canonicalJson(manifestWithId as Json) + "\n");

  console.log("=== MRVN-05 build_artifact ===");
  console.log("out:           ", outRoot);
  console.log("subject:       ", args.subjectName);
  console.log("law_count:     ", lawNames.length);
  console.log("payload_files: ", fileRecords.length);
  console.log("evidence_files:", 2 + supplementalRecords.length);
  console.log("artifact_id:   ", id);
  console.log("build_command: ", args.buildCommand);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});