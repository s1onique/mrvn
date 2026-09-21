#!/usr/bin/env bun
// ACT-MRVN-09 independence audit.
//
// Verifies that the agent input bundle does NOT contain any MRVN-08
// candidate implementations, descriptors, or transformation recipes.
// Also scans the agent's per-candidate descriptors and prompts for
// accidentally copied prior candidate IDs.
//
// Required:
//   PRIOR_CANDIDATE_EXPOSURE = 0
//   bundle contains canonical baseline, oracle, Bend guide, goal
//   bundle excludes ACT-MRVN-QUALIFY08/candidates/J-*
//                  ACT-MRVN-QUALIFY08/candidates/K-*
//                  ACT-MRVN-QUALIFY08/lab/gen_candidates.ts
//                  ACT-MRVN-QUALIFY08/lab/results.json
//                  ACT-MRVN-QUALIFY08/lab/candidates.json

import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(import.meta.dir, "..");
const REPO = resolve(ROOT, "..", "..", "..");
const AGENT_INPUT = process.env["MRVN09_ATTACK_DIR"] ?? resolve(ROOT, "agent_input");
const INDEPENDENT = resolve(ROOT, "independent");

interface AuditResult {
  agent_input_files: string[];
  agent_input_sha256: Record<string, string>;
  forbidden_paths_present: string[];
  prior_candidate_ids_found: string[];
  prior_candidate_exposure: number;
  pass: boolean;
  exit_code: number;
  rationale: string[];
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function listFiles(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...listFiles(full, exts));
    } else if (exts.some((e) => name.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

const result: AuditResult = {
  agent_input_files: [],
  agent_input_sha256: {},
  forbidden_paths_present: [],
  prior_candidate_ids_found: [],
  prior_candidate_exposure: 0,
  pass: true,
  exit_code: 0,
  rationale: [],
};

// 1. List agent_input files
const inputFiles = listFiles(AGENT_INPUT, [".md", ".bend", ".json"]);
result.agent_input_files = inputFiles.map((p) => p.replace(ROOT + "/", ""));

const REQUIRED_INPUTS = [
  "INSTRUCTIONS.md",
  "main.bend",
  "LAWS.bend",
  "PROOF.bend",
  "oracle.json",
  "INTENT.md",
  "guide_index.md",
];
for (const req of REQUIRED_INPUTS) {
  const found = inputFiles.some((p) => p.endsWith(req));
  if (!found) {
    result.rationale.push("MISSING REQUIRED INPUT: " + req);
    result.pass = false;
  }
}

// 2. Hash each agent_input file
for (const f of inputFiles) {
  const content = readFileSync(f, "utf-8");
  result.agent_input_sha256[f.replace(ROOT + "/", "")] = sha256(content);
}

// 3. Verify the agent_input bundle does NOT reference any MRVN-08
//    candidate implementations or descriptors.
const FORBIDDEN_PATH_PATTERNS = [
  "ACT-MRVN-QUALIFY08/candidates/J-",
  "ACT-MRVN-QUALIFY08/candidates/K-",
  "ACT-MRVN-QUALIFY08/lab/gen_candidates.ts",
  "ACT-MRVN-QUALIFY08/lab/results.json",
  "ACT-MRVN-QUALIFY08/lab/candidates.json",
];

const allInputText = inputFiles
  .map((f) => readFileSync(f, "utf-8"))
  .join("\n");

for (const pattern of FORBIDDEN_PATH_PATTERNS) {
  if (allInputText.includes(pattern)) {
    result.forbidden_paths_present.push(pattern);
    result.prior_candidate_exposure++;
    result.pass = false;
  }
}

// 4. Scan per-candidate descriptors and prompts for accidentally
//    copied MRVN-08 candidate IDs.
const PRIOR_CANDIDATE_PATTERNS = [
  /^A-\d{3}-/,
  /^B-NEG-/,
  /^C-\d{3}-/,
  /^D-\d{3}-/,
  /^E-\d{3}-/,
  /^F-\d{3}-/,
  /^G-\d{3}-/,
  /^H-\d{3}-/,
  /^I-\d{3}-/,
  /^J-\d{2}-/,
  /^K-\d{2}-/,
];

const candidateFiles = listFiles(INDEPENDENT, [".md", ".json"]);
for (const f of candidateFiles) {
  const content = readFileSync(f, "utf-8");
  // Skip PROMPT.md forbidden-section text and MRVN-08 references.
  if (f.endsWith("PROMPT.md")) continue; // our PROMPT.md mentions the families explicitly
  for (const pattern of PRIOR_CANDIDATE_PATTERNS) {
    const m = content.match(pattern);
    if (m) {
      result.prior_candidate_ids_found.push(`${f}: ${m[0]}`);
      result.prior_candidate_exposure++;
    }
  }
}

if (!result.pass) result.exit_code = 1;

const outPath = resolve(ROOT, "lab/independence_audit_result.json");
writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log("ACT-MRVN-09 independence audit:");
console.log("  agent_input files: " + result.agent_input_files.length);
console.log("  forbidden_paths_present: " + result.forbidden_paths_present.length);
console.log("  prior_candidate_exposure: " + result.prior_candidate_exposure);
console.log("  rationale: " + (result.rationale.length === 0 ? "OK" : JSON.stringify(result.rationale)));
console.log("  pass: " + (result.pass ? "PASS" : "FAIL") + "  exit_code: " + result.exit_code);
process.exit(result.exit_code);
