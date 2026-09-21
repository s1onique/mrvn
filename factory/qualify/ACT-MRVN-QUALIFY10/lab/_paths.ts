// ACT-MRVN-QUALIFY10 path constants and shared helpers.
//
// All artifact paths are *logical* (relative to REPO_ROOT).  No
// producer absolute paths participate in artifact identity.

import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";

export const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
export const ACT_ROOT  = path.join(REPO_ROOT, "factory/qualify/ACT-MRVN-QUALIFY10");
export const SUBJECT_DIR = path.join(ACT_ROOT, "subject");
export const EFFECT_DIR  = path.join(ACT_ROOT, "effect");
export const MUTATIONS_DIR = path.join(ACT_ROOT, "mutations");
export const BASELINE_DIR  = path.join(ACT_ROOT, "baseline");
export const ORACLE_PATH   = path.join(ACT_ROOT, "oracle/runtime_oracle.json");
export const CONTRACT_PATH = path.join(ACT_ROOT, "EFFECT_CONTRACT.md");
export const EVIDENCE_DIR  = path.join(ACT_ROOT, "evidence");
export const BEND_DIR      = path.join(REPO_ROOT, "bend2");
export const BEND_MAIN_TS  = path.join(BEND_DIR, "main.ts");

export const SUBJECT_MAIN  = path.join(SUBJECT_DIR, "main.bend");
export const SUBJECT_LAWS  = path.join(SUBJECT_DIR, "LAWS.bend");
export const SUBJECT_PROOF = path.join(SUBJECT_DIR, "PROOF.bend");
export const EFFECT_C      = path.join(EFFECT_DIR, "read_role.c");
export const EFFECT_JS     = path.join(EFFECT_DIR, "read_role.js");

export function sha256File(p: string): string {
  return createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

export function exists(p: string): boolean {
  return fs.existsSync(p);
}

export function ensureDir(p: string): void {
  fs.mkdirSync(p, { recursive: true });
}

export function writeFile(p: string, body: string): void {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, body);
}

export interface FrozenAuthority {
  source_commit: string;
  cli_sha256: string;
  checker_sha256: string;
  compiler_runtime_sha256: string;
  base_sha256: string;
  effs_tree_sha256: string;
}

export function loadFrozenAuthority(): FrozenAuthority {
  const raw = fs.readFileSync(path.join(EVIDENCE_DIR, "freeze.txt"), "utf8");
  const m = (k: string): string => {
    const r = new RegExp("^" + k + "=(.+)$", "m").exec(raw);
    if (r === null) throw new Error("missing key in freeze.txt: " + k);
    return r[1].trim();
  };
  return {
    source_commit: m("SOURCE_COMMIT"),
    cli_sha256: m("CLI_SHA256"),
    checker_sha256: m("CHECKER_SHA256"),
    compiler_runtime_sha256: m("COMPILER_RUNTIME_SHA256"),
    base_sha256: m("BASE_SHA256"),
    effs_tree_sha256: m("EFFS_TREE_SHA256"),
  };
}

export interface RuntimeCase {
  id: string;
  env: Record<string, string>;
  expected_role: string;
  expected_decision: string;
  expected_deny_reason: string | null;
  notes: string;
}

export interface RuntimeOracle {
  act: string;
  cases: RuntimeCase[];
}

export function loadOracle(): RuntimeOracle {
  return JSON.parse(fs.readFileSync(ORACLE_PATH, "utf8")) as RuntimeOracle;
}