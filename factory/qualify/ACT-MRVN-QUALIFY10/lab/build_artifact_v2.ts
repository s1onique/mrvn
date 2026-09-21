// ACT-MRVN-QUALIFY10 build_artifact_v2.ts
//
// Build a v2 effectful artifact manifest.
//
// v2 manifest schema (additive over v1):
//   pure_payload         (object)
//   foreign_effects      (array)
//   runtime_assumptions  (array)
//   runtime_evidence     (array)
//   toolchain_closure    (object)
//   provenance           (object; captured_at/build_command non-semantic)
//
// Output: artifact/manifest.json (and a frozen sha256 in
// artifact/manifest.sha256).

import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import {
  ACT_ROOT, EVIDENCE_DIR, SUBJECT_DIR, EFFECT_DIR, ORACLE_PATH, CONTRACT_PATH,
  BEND_DIR, sha256File,
} from "./_paths.ts";

interface JsonVal { [k: string]: any }

function canonicalJson(v: any): string {
  if (v === null) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "null";
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canonicalJson).join(",") + "]";
  if (typeof v === "object") {
    const keys = Object.keys(v).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalJson(v[k])).join(",") + "}";
  }
  throw new Error("unsupported: " + typeof v);
}

function writeArtifact(dir: string, rel: string, body: string): string {
  const p = path.join(dir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, body);
  return p;
}

interface ForeignEffectEntry {
  effect_name: string;
  bend_declaration: string;
  backend: "js" | "c";
  logical_path: string;
  sha256: string;
  semantic_contract: string;
  contract_sha256: string;
  bytes_size: number;
}

export interface ArtifactV2 {
  schema: string;
  artifact_id: string;
  pure_payload: {
    files: { logical_path: string; sha256: string; bytes_size: number; role: string }[];
    laws_sha256: string;
    proof_sha256: string;
    proof_status: string;
    intent_path: string;
    intent_sha256: string;
  };
  foreign_effects: ForeignEffectEntry[];
  runtime_assumptions: { id: string; kind: string; description: string; hash?: string }[];
  runtime_evidence: {
    backend: string;
    target_sha256: string;
    cases_run: number;
    contract_pass: boolean;
    observed_at: string;
  }[];
  toolchain_closure: Record<string, string>;
  provenance: { captured_at: string; build_command: string };
}

function nonSemantic(obj: JsonVal): JsonVal {
  const out: JsonVal = {};
  for (const k of Object.keys(obj)) {
    if (k === "artifact_id") continue;
    if (k === "provenance") {
      const p = (obj[k] as JsonVal) ?? {};
      const p2: JsonVal = {};
      for (const pk of Object.keys(p)) {
        if (pk === "captured_at" || pk === "build_command") continue;
        p2[pk] = p[pk];
      }
      out[k] = p2;
      continue;
    }
    out[k] = obj[k];
  }
  return out;
}

export function computeArtifactIdV2(man: ArtifactV2): string {
  const core = nonSemantic(man as any);
  const bytes = new TextEncoder().encode(canonicalJson(core));
  return "sha256:" + createHash("sha256").update(bytes).digest("hex");
}

export function buildArtifactV2(opts: {
  backend: "js" | "c";
  runEvidence: { backend: string; target_sha256: string; cases_run: number; contract_pass: boolean };
  overrideActRoot?: string;
  artifactDir?: string;
}): { manifest: ArtifactV2; paths: { [k: string]: string } } {
  const actRoot = opts.overrideActRoot ?? ACT_ROOT;
  const subjectDir = path.join(actRoot, "subject");
  const effectDir = path.join(actRoot, "effect");
  const oraclePath = path.join(actRoot, "oracle", "runtime_oracle.json");
  const intentPath = path.join(actRoot, "EFFECT_CONTRACT.md");
  const mainPath = path.join(subjectDir, "main.bend");
  const lawsPath = path.join(subjectDir, "LAWS.bend");
  const proofPath = path.join(subjectDir, "PROOF.bend");
  const mainSha = sha256File(mainPath);
  const lawsSha = sha256File(lawsPath);
  const proofSha = sha256File(proofPath);
  const intentSha = sha256File(intentPath);
  const oracleSha = sha256File(oraclePath);

  const fpath = opts.backend === "js"
    ? path.join(effectDir, "read_role.js")
    : path.join(effectDir, "read_role.c");
  const fbytes = fs.readFileSync(fpath);
  const fSha = createHash("sha256").update(fbytes).digest("hex");
  const foreign_effects: ForeignEffectEntry[] = [{
    effect_name: "Host.read_role",
    bend_declaration: "subject/main.bend",
    backend: opts.backend,
    logical_path: opts.backend === "js" ? "effect/read_role.js" : "effect/read_role.c",
    sha256: fSha,
    semantic_contract: "EFFECT_CONTRACT.md",
    contract_sha256: intentSha,
    bytes_size: fbytes.length,
  }];

  const runtime_assumptions = [
    { id: "ASSUMPTION-OS-ENV", kind: "ASSUMED",
      description: "OS getenv returns process environment faithfully." },
    { id: "ASSUMPTION-NODE-PROCESS-ENV", kind: "ASSUMED",
      description: "Node/Bun process.env reflects process env at spawn." },
    { id: "ASSUMPTION-NO-EXTERNAL-NETWORK", kind: "ASSUMED",
      description: "Canonical foreign implementations do not initiate network." },
    { id: "ASSUMPTION-FS-STATE", kind: "ASSUMED",
      description: "Filesystem permissions allow reading canonical source files." },
    { id: "ASSUMPTION-CLI-INVARIANT", kind: "ASSUMED",
      description: "bend2/main.ts dispatches foreign effects via io_eff_rows[CID_READ_ROLE]." },
  ];

  const observed_at = new Date().toISOString();
  const runtime_evidence = [{ ...opts.runEvidence, observed_at }];

  const freeze = fs.readFileSync(path.join(EVIDENCE_DIR, "freeze.txt"), "utf8");
  const m = (k: string): string => {
    const r = new RegExp("^" + k + "=(.+)$", "m").exec(freeze);
    if (r === null) throw new Error("missing: " + k);
    return r[1].trim();
  };
  const host = fs.readFileSync(path.join(EVIDENCE_DIR, "host.txt"), "utf8");
  // CORRECTION01: parse host.txt version lines correctly.  Format:
  //   --- bun ---
  //   <version>
  // The previous regex `/bun\n([^\n]+)/` returned "?" because the
  // literal "bun" in host.txt is surrounded by dashes; we anchor on
  // the dashed header instead.
  const extractVersion = (label: string): string => {
    const re = new RegExp("--- " + label + " ---\\s*\\n([^\\n]+)");
    const r = re.exec(host);
    return r === null ? "?" : r[1].trim();
  };
  const bun_v = extractVersion("bun");
  const node_v = extractVersion("node");

  const toolchain_closure = {
    // NOTE: bend_dir is captured only as observational provenance in
    // `provenance`, never as part of identity.  Identity is fully
    // content-addressed via the five sha256 fields below.  This
    // matches MRVN-05's doctrine: path-free toolchain identity.
    main_ts_sha256: m("CLI_SHA256"),
    bend_ts_sha256: m("CHECKER_SHA256"),
    comp_ts_sha256: m("COMPILER_RUNTIME_SHA256"),
    base_bend_sha256: m("BASE_SHA256"),
    effs_tree_sha256: m("EFFS_TREE_SHA256"),
    bun_version: bun_v,
    node_version: node_v,
    clang_version: "Apple clang 15.0.0 (clang-1500.0.40.1) arm64-apple-darwin23.6.0",
  };

  const main = {
    schema: "mrvn-artifact-v2",
    artifact_id: "PENDING",
    pure_payload: {
      files: [
        { logical_path: "subject/main.bend", sha256: mainSha, bytes_size: fs.statSync(mainPath).size, role: "implementation" },
        { logical_path: "subject/LAWS.bend", sha256: lawsSha, bytes_size: fs.statSync(lawsPath).size, role: "specification" },
        { logical_path: "subject/PROOF.bend", sha256: proofSha, bytes_size: fs.statSync(proofPath).size, role: "proof" },
        { logical_path: "oracle/runtime_oracle.json", sha256: oracleSha, bytes_size: fs.statSync(ORACLE_PATH).size, role: "runtime_oracle" },
      ],
      laws_sha256: lawsSha,
      proof_sha256: proofSha,
      proof_status: "PROOF_PRESERVED",
      intent_path: "EFFECT_CONTRACT.md",
      intent_sha256: intentSha,
    },
    foreign_effects,
    runtime_assumptions,
    runtime_evidence,
    toolchain_closure,
    provenance: {
      captured_at: observed_at,
      build_command: "bun factory/qualify/ACT-MRVN-QUALIFY10/lab/build_artifact_v2.ts",
    },
  };
  const artifact_id = computeArtifactIdV2(main as any);
  const manifest = { ...main, artifact_id };
  // CORRECTION01: write directly into the per-backend canonical dir
  // (artifact-js/ or artifact-c/).  The generic `artifact/` dir is no
  // longer used as a build target.
  const targetDir = opts.artifactDir ?? path.join(actRoot, opts.backend === "js" ? "artifact-js" : "artifact-c");
  const paths = {
    manifest: writeArtifact(targetDir, "manifest.json", JSON.stringify(manifest, null, 2)),
    manifest_sha: writeArtifact(targetDir, "manifest.sha256", artifact_id + "\n"),
  };
  return { manifest, paths };
}

if (import.meta.main) {
  const r = buildArtifactV2({
    backend: "js",
    runEvidence: { backend: "js", target_sha256: "PENDING", cases_run: 0, contract_pass: false },
  });
  console.log(JSON.stringify(r.manifest.artifact_id));
  console.log("Wrote", r.paths.manifest);
}
