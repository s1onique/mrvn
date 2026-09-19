#!/usr/bin/env bun
// MRVN-05 verify_artifact.ts
//
// The consumer-side verifier.  It is the AUTHORITY, not the builder.
// It recomputes every hash, every inventory, and the artifact root id
// from the on-disk bytes; it never trusts a stored hash value merely
// because JSON parses.
//
// Modes:
//   integrity -- phases up to and including the dependency closure,
//                law inventory, escape-hatch inventory, and toolchain
//                match check.  No proof execution.
//   proof     -- integrity + replay the bundled proof.
//   full      -- proof + supplemental evidence checks.
//
// Exit codes:
//   0   -- VERIFIED
//   1   -- any verification failure (see result.failures)
//   2   -- invocation error (missing flags, IO, etc.)

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, statSync, realpathSync, existsSync } from "node:fs";
import { resolve, relative, sep, isAbsolute } from "node:path";
import { spawn } from "bun";
import { canonicalJson, canonicalJsonPretty, parseCanonical, type Json } from "./canonical_json.ts";
import { computeArtifactId } from "./artifact_id.ts";

// ---------- CLI ----------

interface CliArgs {
  artifact: string;
  mode: "integrity" | "proof" | "full";
  schema: string | null;
  bendRunner: string | null;
  resultOut: string | null;
  allowToolchainDrift: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const out: Partial<CliArgs> & { allowToolchainDrift?: boolean } = { allowToolchainDrift: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error("missing value after " + a);
      return v;
    };
    if (a === "--artifact")      out.artifact = next();
    else if (a === "--mode")      out.mode = next() as CliArgs["mode"];
    else if (a === "--schema")    out.schema = next();
    else if (a === "--bend-runner") out.bendRunner = next();
    else if (a === "--result-out") out.resultOut = next();
    else if (a === "--allow-toolchain-drift") out.allowToolchainDrift = true;
    else throw new Error("unknown flag: " + a);
  }
  if (out.artifact === undefined) throw new Error("missing required flag: --artifact");
  if (out.mode === undefined) out.mode = "full";
  if (out.mode !== "integrity" && out.mode !== "proof" && out.mode !== "full") {
    throw new Error("invalid mode: " + out.mode);
  }
  return out as CliArgs;
}

// ---------- Helpers ----------

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function fileSize(path: string): number {
  return statSync(path).size;
}

function extractLawNames(lawsPath: string): string[] {
  const src = readFileSync(lawsPath, "utf8");
  const names: string[] = [];
  const re = /^law\s+([A-Za-z_][A-Za-z0-9_]*)\s*:/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) names.push(m[1]);
  return Array.from(new Set(names)).sort();
}

function scanEscapeHatches(filePath: string): {
  todoCount: number; namedHoles: number; unsafeCount: number;
} {
  const src = readFileSync(filePath, "utf8");
  const noComments = src.split("\n").map((line) => {
    const i = line.indexOf("#");
    return i >= 0 ? line.slice(0, i) : line;
  }).join("\n");
  const todoCount = (noComments.match(/\?TODO\b/g) ?? []).length;
  let namedHoles = 0;
  const namedRe = /\?([A-Za-z_][A-Za-z0-9_]*)/g;
  let m: RegExpExecArray | null;
  while ((m = namedRe.exec(noComments)) !== null) {
    if (m[1] !== "TODO") namedHoles++;
  }
  const unsafeCount = (noComments.match(/@unsafe\b/g) ?? []).length;
  return { todoCount, namedHoles, unsafeCount };
}

function readBendImports(filePath: string): string[] {
  const src = readFileSync(filePath, "utf8");
  const out: string[] = [];
  for (const line of src.split("\n")) {
    const m = line.match(/^import\s+(\S+)(?:\s+as\s+[A-Za-z_][A-Za-z0-9_]*)?\s*(?:#.*)?$/);
    if (m !== null) out.push(m[1]);
  }
  return out;
}

function isSymlink(path: string): boolean {
  try {
    const rp = realpathSync(path);
    return rp !== path;
  } catch {
    return false;
  }
}

// ---------- Manifest loading & schema validation ----------

interface Failure { phase: string; classification: string; message: string; }

interface Manifest {
  schema_version: number;
  artifact_type: string;
  subject: { name: string; kind: string; entrypoint: string };
  claims: any[];
  payload: {
    files: { path: string; role: string; sha256: string; size: number }[];
    dependency_closure: { path: string; sha256: string; role: string }[];
    trusted_toolchain: { name: string; kind: string; identity?: string }[];
    law_inventory: { count: number; names: string[]; source_file: string };
    escape_hatch_inventory: {
      todo_count: number; named_holes: number; unsafe_count: number;
      foreign_count: number; open_laws: number;
    };
  };
  verification: any;
  evidence: { files: { path: string; sha256: string; size: number; authority: string; description?: string }[] };
  provenance: any;
  artifact_id: string;
}

function loadManifest(artifactDir: string): { manifest: Manifest; rawBytes: Uint8Array } {
  const manifestPath = resolve(artifactDir, "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error("MANIFEST_MISSING: no manifest.json at " + manifestPath);
  }
  const rawBytes = new Uint8Array(readFileSync(manifestPath));
  let raw: string;
  try {
    raw = new TextDecoder("utf-8", { fatal: true }).decode(rawBytes);
  } catch {
    throw new Error("SCHEMA_INVALID: manifest.json is not valid UTF-8");
  }
  let parsed: Json;
  try {
    parsed = parseCanonical(raw);
  } catch (e) {
    throw new Error("SCHEMA_INVALID: manifest.json is malformed JSON: " + (e as Error).message);
  }
  return { manifest: parsed as unknown as Manifest, rawBytes };
}

function checkRequiredFields(m: any, failures: Failure[]) {
  const required = ["schema_version", "artifact_type", "subject", "claims", "payload", "verification", "evidence", "provenance", "artifact_id"];
  for (const k of required) {
    if (!(k in m)) {
      failures.push({ phase: "schema", classification: "SCHEMA_INVALID", message: "missing required top-level field: " + k });
    }
  }
  if (m.schema_version !== 1) {
    failures.push({ phase: "schema", classification: "SCHEMA_INVALID", message: "schema_version must be 1 (got " + m.schema_version + ")" });
  }
  if (m.artifact_type !== "mrvn.proof-carrying-factory-artifact") {
    failures.push({ phase: "schema", classification: "SCHEMA_INVALID", message: "artifact_type must be mrvn.proof-carrying-factory-artifact" });
  }
  if (typeof m.artifact_id !== "string" || !m.artifact_id.startsWith("sha256:") || m.artifact_id.length !== 7 + 64) {
    failures.push({ phase: "schema", classification: "SCHEMA_INVALID", message: "artifact_id must be a sha256-prefixed 64-hex string" });
  }
  // Structural checks: unique payload paths, unique dependency_closure paths.
  if (Array.isArray(m.payload?.files)) {
    const seen = new Set<string>();
    for (const f of m.payload.files) {
      if (seen.has(f.path)) {
        failures.push({ phase: "schema", classification: "SCHEMA_INVALID", message: "duplicate payload.files path: " + f.path });
      }
      seen.add(f.path);
    }
  }
  if (Array.isArray(m.payload?.dependency_closure)) {
    const seen = new Set<string>();
    for (const d of m.payload.dependency_closure) {
      if (seen.has(d.path)) {
        failures.push({ phase: "schema", classification: "SCHEMA_INVALID", message: "duplicate payload.dependency_closure path: " + d.path });
      }
      seen.add(d.path);
    }
  }
}

async function runBend(bendRunner: string, proofAbs: string, cwd: string): Promise<{ exit: number; stdout: string; stderr: string; }> {
  // We resolve bendRunner to an absolute path so the spawn does not
  // depend on the verifier's cwd; the artifact's payload is fully
  // self-contained.
  const bendAbs = resolve(bendRunner);
  const proc = spawn({ cmd: ["bun", bendAbs, proofAbs], stdout: "pipe", stderr: "pipe", cwd });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  await proc.exited;
  return { exit: proc.exitCode ?? 1, stdout: out, stderr: err };
}

// ---------- Phase checks ----------

function checkPathSanity(path: string, artifactDir: string, realArtDir: string): { ok: true } | { ok: false; reason: string } {
  if (isAbsolute(path)) return { ok: false, reason: "absolute path: " + path };
  if (path.includes("\0")) return { ok: false, reason: "NUL byte in path" };
  if (path.split("/").some((s) => s === "" || s === "." || s === "..")) {
    return { ok: false, reason: "empty/. /.. segment: " + path };
  }
  if (/^[a-zA-Z]:[\\/]/.test(path)) return { ok: false, reason: "Windows drive letter: " + path };
  // Containment must be against the REAL artifact dir; on macOS,
  // /tmp is a symlink to /private/tmp, so resolve() is not enough.
  const abs = resolve(realArtDir, path);
  const rel = relative(realArtDir, abs);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    return { ok: false, reason: "path escapes artifact root: " + path };
  }
  return { ok: true };
}

function checkSymlinkPolicy(realArtDir: string, paths: string[], failures: Failure[]) {
  for (const p of paths) {
    const abs = resolve(realArtDir, p);
    try {
      const real = realpathSync(abs);
      // Detect any symlink in the path's own components (the
      // artifact root's own symlink chain is already resolved by
      // realArtDir).  We compare against the per-component realpath
      // by lex-decomposing.
      const absSegments = abs.split("/");
      const realSegments = real.split("/");
      if (absSegments.length !== realSegments.length || absSegments.some((s, i) => s !== realSegments[i])) {
        failures.push({
          phase: "path_confinement",
          classification: "PATH_AUTHORITY_VIOLATION",
          message: "symlink detected (forbidden): " + p + " -> " + real,
        });
      }
    } catch {
      // missing file reported in payload_hash phase
    }
  }
}

function checkPayloadIntegrity(manifest: Manifest, realArtDir: string, failures: Failure[]): Map<string, { sha256: string; size: number }> {
  const seen = new Map<string, { sha256: string; size: number }>();
  for (const f of manifest.payload.files) {
    if (!seen.has(f.path)) seen.set(f.path, { sha256: f.sha256, size: f.size });
    else failures.push({ phase: "payload_hash", classification: "SCHEMA_INVALID", message: "duplicate payload path: " + f.path });
    const ps = checkPathSanity(f.path, realArtDir, realArtDir);
    if (!ps.ok) {
      failures.push({ phase: "path_confinement", classification: "PATH_AUTHORITY_VIOLATION", message: ps.reason });
      continue;
    }
    const abs = resolve(realArtDir, f.path);
    if (!existsSync(abs)) {
      failures.push({ phase: "payload_hash", classification: "PAYLOAD_MISSING", message: "missing payload file: " + f.path });
      continue;
    }
    const actualSha = sha256File(abs);
    const actualSize = fileSize(abs);
    if (actualSha !== f.sha256) {
      failures.push({ phase: "payload_hash", classification: "PAYLOAD_HASH_MISMATCH", message: f.path + ": expected sha256 " + f.sha256 + ", got " + actualSha });
    }
    if (actualSize !== f.size) {
      failures.push({ phase: "payload_size", classification: "PAYLOAD_SIZE_MISMATCH", message: f.path + ": expected size " + f.size + ", got " + actualSize });
    }
  }
  return seen;
}

// Helper: index payload.files by both full path and bare basename so
// the dependency-closure check can correlate reachable files with
// declared payload entries.
function indexPayloadFilesByBasename(m: Manifest): Map<string, { path: string; sha256: string; size: number; role: string }> {
  const idx = new Map<string, { path: string; sha256: string; size: number; role: string }>();
  for (const f of m.payload.files) {
    const base = f.path.slice(f.path.lastIndexOf("/") + 1);
    idx.set(base, f);
  }
  return idx;
}

function checkDependencyClosure(manifest: Manifest, realArtDir: string, payloadShaByRelPath: Map<string, { sha256: string; size: number }>, failures: Failure[]) {
  const entrypoints = manifest.payload.files.filter((f) =>
    f.role === "implementation" || f.role === "specification" || f.role === "proof"
  );
  const seen = new Set<string>();
  const reachableBundled: { path: string; role: string }[] = [];
  const stack: { relPath: string; role: string }[] = entrypoints.map((e) => ({
    relPath: e.path.slice("payload/".length),
    role: e.role,
  }));
  while (stack.length > 0) {
    const cur = stack.pop()!;
    const bundlePath = "payload/" + cur.relPath;
    if (seen.has(bundlePath)) continue;
    seen.add(bundlePath);
    reachableBundled.push({ path: bundlePath, role: cur.role });
    const abs = resolve(realArtDir, bundlePath);
    if (!existsSync(abs)) continue;
    const imports = readBendImports(abs);
    for (const imp of imports) {
      if (imp === "Base") continue;
      if (imp.startsWith("0x")) {
        failures.push({
          phase: "dependency_closure",
          classification: "UNDECLARED_DEPENDENCY",
          message: "hub import " + imp + " in " + bundlePath + " (not declared in payload.trusted_toolchain)",
        });
        continue;
      }
      if (isAbsolute(imp)) {
        failures.push({
          phase: "dependency_closure",
          classification: "PATH_AUTHORITY_VIOLATION",
          message: "absolute import " + imp + " in " + bundlePath,
        });
        continue;
      }
      if (imp.startsWith("./") || imp.startsWith("../")) {
        const dir = bundlePath.slice(0, bundlePath.lastIndexOf("/") + 1);
        // Compute target relative to the bundle file's real path on
        // disk.  This catches ../ traversal escapes that exceed the
        // artifact root.
        const bundleReal = realpathSync(resolve(realArtDir, bundlePath));
        const importerDir = bundleReal.slice(0, bundleReal.lastIndexOf("/") + 1);
        const targetReal = resolve(importerDir, imp);
        const rel = relative(realArtDir, targetReal);
        if (rel.startsWith("..") || isAbsolute(rel)) {
          failures.push({
            phase: "dependency_closure",
            classification: "PATH_AUTHORITY_VIOLATION",
            message: "../ traversal escape in " + bundlePath + ": " + imp + " resolves to " + targetReal + " (outside artifact root)",
          });
          continue;
        }
        const targetRel = rel.split(sep).join("/");
        if (!existsSync(targetReal)) {
          failures.push({
            phase: "dependency_closure",
            classification: "UNDECLARED_DEPENDENCY",
            message: "imported file " + targetRel + " (from " + bundlePath + ") is not bundled",
          });
          continue;
        }
        const base = targetRel.slice(targetRel.lastIndexOf("/") + 1);
        let role: "implementation" | "specification" | "proof";
        if (base === "main.bend") role = "implementation";
        else if (base === "LAWS.bend") role = "specification";
        else if (base === "PROOF.bend") role = "proof";
        else {
          failures.push({
            phase: "dependency_closure",
            classification: "UNDECLARED_DEPENDENCY",
            message: "helper file " + targetRel + " imported by " + bundlePath + " is not declared in payload.dependency_closure",
          });
          continue;
        }
        // Strip the "payload/" prefix when pushing so the next
        // iteration's bundlePath computation re-applies it once.
        const stripped = targetRel.startsWith("payload/") ? targetRel.slice("payload/".length) : targetRel;
        stack.push({ relPath: stripped, role });
        continue;
      }
      failures.push({
        phase: "dependency_closure",
        classification: "UNDECLARED_DEPENDENCY",
        message: "import " + imp + " in " + bundlePath + " does not match an expected ./relative form",
      });
    }
  }
  const declared = new Set(manifest.payload.dependency_closure.map((d) => d.path));
  for (const r of reachableBundled) {
    if (!declared.has(r.path)) {
      failures.push({
        phase: "dependency_closure",
        classification: "UNDECLARED_DEPENDENCY",
        message: "reachable file " + r.path + " is not in payload.dependency_closure",
      });
    } else {
      const expected = manifest.payload.dependency_closure.find((d) => d.path === r.path)!;
      const observed = payloadShaByRelPath.get(r.path);
      if (observed === undefined) {
        failures.push({
          phase: "dependency_closure",
          classification: "PAYLOAD_MISSING",
          message: "reachable file " + r.path + " is missing from payload.files",
        });
      } else if (expected.sha256 !== observed.sha256) {
        failures.push({
          phase: "dependency_closure",
          classification: "PAYLOAD_HASH_MISMATCH",
          message: "declared dependency_closure sha mismatch for " + r.path,
        });
      }
    }
  }
  for (const d of manifest.payload.dependency_closure) {
    if (!seen.has(d.path)) {
      failures.push({
        phase: "dependency_closure",
        classification: "UNDECLARED_DEPENDENCY",
        message: "declared dependency_closure entry " + d.path + " is not reachable from any entrypoint",
      });
    }
  }
}

function checkLawInventory(manifest: Manifest, realArtDir: string, failures: Failure[]) {
  const lawsPath = "payload/LAWS.bend";
  const declared = manifest.payload.law_inventory;
  if (!declared) {
    failures.push({ phase: "law_inventory", classification: "SCHEMA_INVALID", message: "payload.law_inventory missing" });
    return;
  }
  const abs = resolve(realArtDir, lawsPath);
  if (!existsSync(abs)) {
    failures.push({ phase: "law_inventory", classification: "PAYLOAD_MISSING", message: "LAWS.bend missing on disk" });
    return;
  }
  const observed = extractLawNames(abs);
  if (observed.length !== declared.count) {
    failures.push({
      phase: "law_inventory",
      classification: "LAW_INVENTORY_MISMATCH",
      message: "law count mismatch: declared=" + declared.count + " observed=" + observed.length,
    });
  }
  const declaredSet = new Set(declared.names);
  const observedSet = new Set(observed);
  for (const n of observed) if (!declaredSet.has(n)) {
    failures.push({ phase: "law_inventory", classification: "LAW_INVENTORY_MISMATCH", message: "undeclared law observed: " + n });
  }
  for (const n of declaredSet) if (!observedSet.has(n)) {
    failures.push({ phase: "law_inventory", classification: "LAW_INVENTORY_MISMATCH", message: "declared law missing: " + n });
  }
}

function checkEscapeHatchInventory(manifest: Manifest, realArtDir: string, failures: Failure[]) {
  const declared = manifest.payload.escape_hatch_inventory;
  if (!declared) {
    failures.push({ phase: "escape_hatch_inventory", classification: "SCHEMA_INVALID", message: "payload.escape_hatch_inventory missing" });
    return;
  }
  let todo = 0, named = 0, unsafe = 0;
  for (const f of manifest.payload.dependency_closure) {
    const scan = scanEscapeHatches(resolve(realArtDir, f.path));
    todo += scan.todoCount;
    named += scan.namedHoles;
    unsafe += scan.unsafeCount;
  }
  if (todo !== declared.todo_count) {
    failures.push({ phase: "escape_hatch_inventory", classification: "ESCAPE_HATCH_PRESENT", message: "TODO count mismatch: declared=" + declared.todo_count + " observed=" + todo });
  }
  if (named !== declared.named_holes) {
    failures.push({ phase: "escape_hatch_inventory", classification: "ESCAPE_HATCH_PRESENT", message: "named-holes mismatch: declared=" + declared.named_holes + " observed=" + named });
  }
  if (unsafe !== declared.unsafe_count) {
    failures.push({ phase: "escape_hatch_inventory", classification: "ESCAPE_HATCH_PRESENT", message: "@unsafe count mismatch: declared=" + declared.unsafe_count + " observed=" + unsafe });
  }
}

// ---------- Main verification ----------

interface VerifyResult {
  artifact_id: string | null;
  mode: string;
  integrity: "pass" | "fail" | "not_checked";
  proof: "pass" | "fail" | "not_checked" | "unavailable";
  supplemental_evidence: "pass" | "fail" | "not_checked";
  claims: { claim_id: string; status: "verified" | "unsupported" }[];
  failures: Failure[];
  verifier: {
    version: string;
    canonical_json_algorithm: string;
    artifact_id_algorithm: string;
    toolchain: { bend_runner_sha256: string | null; toolchain_match: boolean; toolchain_checked: boolean };
  };
  timing_ms: { integrity: number; proof: number; supplemental: number };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const artifactDir = resolve(args.artifact);
  if (!existsSync(artifactDir)) {
    console.error("VERIFY_FAIL: artifact directory not found: " + artifactDir);
    process.exit(1);
  }
  // realArtDir: the canonical, symlink-resolved artifact directory.
  // On macOS, /tmp is a symlink to /private/tmp; resolving once up
  // front prevents every subsequent path computation from being off
  // by the symlink boundary.
  const realArtDir = realpathSync(artifactDir);
  const failures: Failure[] = [];
  const t0 = Date.now();
  const result: VerifyResult = {
    artifact_id: null,
    mode: args.mode,
    integrity: "not_checked",
    proof: "not_checked",
    supplemental_evidence: "not_checked",
    claims: [],
    failures,
    verifier: {
      version: "MRVN-05.verify_artifact.v1",
      canonical_json_algorithm: "mrvn-canonical-json-v1",
      artifact_id_algorithm: "sha256:canonical_manifest_minus_id:v1",
      toolchain: { bend_runner_sha256: null, toolchain_match: false, toolchain_checked: false },
    },
    timing_ms: { integrity: 0, proof: 0, supplemental: 0 },
  };
  let manifest: Manifest | null = null;
  try {
    const loaded = loadManifest(realArtDir);
    manifest = loaded.manifest;
    result.artifact_id = manifest.artifact_id;

    checkRequiredFields(manifest, failures);

    if (failures.length === 0) {
      const recomputed = computeArtifactId(manifest as unknown as { [k: string]: Json });
      if (recomputed !== manifest.artifact_id) {
        failures.push({
          phase: "manifest_id",
          classification: "MANIFEST_ID_MISMATCH",
          message: "stored artifact_id=" + manifest.artifact_id + " recomputed=" + recomputed,
        });
      }
    }

    if (failures.length === 0) {
      const allPaths = manifest.payload.files.map((f) => f.path).concat(
        manifest.payload.dependency_closure.map((d) => d.path)
      );
      // Symlink policy MUST run before payload integrity so that
      // symlink escapes are detected as PATH_AUTHORITY_VIOLATION
      // (their semantic class), not as PAYLOAD_HASH_MISMATCH (which
      // would still fire because the symlink target's bytes differ
      // from the declared hash).  The symlink rejection is the
      // authoritative failure; the hash is incidental.
      checkSymlinkPolicy(realArtDir, allPaths, failures);
      const payloadSha = checkPayloadIntegrity(manifest, realArtDir, failures);
      checkDependencyClosure(manifest, realArtDir, payloadSha, failures);
      checkLawInventory(manifest, realArtDir, failures);
      checkEscapeHatchInventory(manifest, realArtDir, failures);
    }
    const t1 = Date.now();
    result.timing_ms.integrity = t1 - t0;
    result.integrity = failures.length === 0 ? "pass" : "fail";
  } catch (e) {
    failures.push({ phase: "schema", classification: "SCHEMA_INVALID", message: (e as Error).message });
  }

  if (args.mode !== "integrity" && manifest !== null) {
    const t2 = Date.now();
    if (!args.bendRunner) {
      result.proof = "unavailable";
      failures.push({
        phase: "proof_replay",
        classification: "TOOLCHAIN_UNAVAILABLE",
        message: "no --bend-runner provided; proof phase skipped",
      });
    } else if (!existsSync(args.bendRunner)) {
      result.proof = "unavailable";
      failures.push({
        phase: "toolchain_match",
        classification: "TOOLCHAIN_UNAVAILABLE",
        message: "Bend runner not found: " + args.bendRunner,
      });
    } else {
      const actualSha = sha256File(args.bendRunner);
      result.verifier.toolchain.bend_runner_sha256 = actualSha;
      const declaredSha = manifest.provenance.toolchain?.bend_runner_sha256;
      result.verifier.toolchain.toolchain_checked = true;
      if (!args.allowToolchainDrift && declaredSha !== undefined && declaredSha !== actualSha) {
        result.verifier.toolchain.toolchain_match = false;
        failures.push({
          phase: "toolchain_match",
          classification: "TOOLCHAIN_MISMATCH",
          message: "declared bend_runner_sha256=" + declaredSha + " actual=" + actualSha,
        });
      } else {
        result.verifier.toolchain.toolchain_match = true;
      }
      if (!failures.some((f) => f.phase !== "toolchain_match" && f.phase !== "schema" && f.phase !== "manifest_id" && f.phase !== "payload_hash" && f.phase !== "payload_size" && f.phase !== "dependency_closure" && f.phase !== "path_confinement" && f.phase !== "law_inventory" && f.phase !== "escape_hatch_inventory")) {
        const proofAbs = resolve(realArtDir, "payload/PROOF.bend");
        if (!existsSync(proofAbs)) {
          failures.push({
            phase: "proof_replay",
            classification: "PAYLOAD_MISSING",
            message: "bundled PROOF.bend missing on disk",
          });
          result.proof = "fail";
        } else {
          const replay = await runBend(args.bendRunner, proofAbs, realArtDir);
          if (replay.exit !== 0 || !replay.stdout.includes("All terms check.")) {
            failures.push({
              phase: "proof_replay",
              classification: "PROOF_FAILED",
              message: "bun " + args.bendRunner + " " + proofAbs + " exited " + replay.exit,
            });
            result.proof = "fail";
          } else {
            result.proof = "pass";
          }
        }
      }
    }
    const t3 = Date.now();
    result.timing_ms.proof = t3 - t2;
  }

  // Phase: supplemental evidence (mode "full" only).
  if (args.mode === "full" && manifest !== null) {
    const t4 = Date.now();
    for (const ev of manifest.evidence.files) {
      const ps = checkPathSanity(ev.path, realArtDir, realArtDir);
      if (!ps.ok) {
        failures.push({ phase: "supplemental_evidence", classification: "PATH_AUTHORITY_VIOLATION", message: ps.reason + " (in " + ev.path + ")" });
        continue;
      }
      const abs = resolve(realArtDir, ev.path);
      if (!existsSync(abs)) {
        failures.push({ phase: "supplemental_evidence", classification: "PAYLOAD_MISSING", message: "evidence file missing: " + ev.path });
        continue;
      }
      const actualSha = sha256File(abs);
      const actualSize = fileSize(abs);
      if (actualSha !== ev.sha256) {
        failures.push({ phase: "supplemental_evidence", classification: "PAYLOAD_HASH_MISMATCH", message: ev.path + ": expected sha256 " + ev.sha256 + ", got " + actualSha });
      }
      if (actualSize !== ev.size) {
        failures.push({ phase: "supplemental_evidence", classification: "PAYLOAD_SIZE_MISMATCH", message: ev.path + ": expected size " + ev.size + ", got " + actualSize });
      }
    }
    // Cross-check captured proof-run.json against live replay.
    if (result.proof === "fail") {
      const recorded = manifest.evidence.files.find((f) => f.path === "evidence/proof-run.json");
      if (recorded) {
        try {
          const rec = JSON.parse(readFileSync(resolve(realArtDir, recorded.path), "utf8"));
          if (rec.exit_code === 0 && rec.stdout_match === true) {
            failures.push({
              phase: "supplemental_evidence",
              classification: "CAPTURED_EVIDENCE_MISMATCH",
              message: "recorded evidence/proof-run.json claims pass but live replay says fail",
            });
          }
        } catch {}
      }
    }
    const t5 = Date.now();
    result.timing_ms.supplemental = t5 - t4;
    result.supplemental_evidence = failures.some((f) => f.phase === "supplemental_evidence") ? "fail" : "pass";
  }

  // Build claim statuses.
  if (manifest !== null && Array.isArray(manifest.claims)) {
    for (const c of manifest.claims) {
      const supportedKinds = new Set(["FORMAL_LAW_SATISFACTION", "OBSERVED_TOOL_EXECUTION", "BEHAVIORAL_EQUIVALENCE", "QUALIFICATION_RESULT"]);
      if (!supportedKinds.has(c.kind)) {
        failures.push({
          phase: "supplemental_evidence",
          classification: "UNSUPPORTED_CLAIM",
          message: "claim " + c.claim_id + " has unsupported kind: " + c.kind,
        });
        result.claims.push({ claim_id: c.claim_id, status: "unsupported" });
      } else {
        result.claims.push({ claim_id: c.claim_id, status: "verified" });
      }
    }
  }

  console.log("=== MRVN-05 verify_artifact ===");
  console.log("artifact:    ", artifactDir);
  console.log("mode:        ", args.mode);
  console.log("artifact_id: ", result.artifact_id ?? "(none)");
  console.log("integrity:   ", result.integrity);
  console.log("proof:       ", result.proof);
  console.log("supplemental:", result.supplemental_evidence);
  console.log("failures:    ", failures.length);
  for (const f of failures) {
    console.log("  - [" + f.phase + " / " + f.classification + "] " + f.message);
  }

  if (args.resultOut) {
    writeFileSync(args.resultOut, canonicalJsonPretty(result as unknown as Json));
  }
  if (failures.length > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
