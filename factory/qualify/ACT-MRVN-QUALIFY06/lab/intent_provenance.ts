#!/usr/bin/env bun
// ACT-MRVN-06-CORRECTION01: intent_provenance.ts
//
// Static gate that asserts build_oracle.ts does NOT depend on any
// canonical implementation artifact.  The frozen intent oracle is an
// independent authority, by design; it must be derivable from
// INTENT.md alone.
//
// Forbidden signals:
//   * reading authority-kernel/main.bend or PROOF.bend
//   * importing from the canonical kernel
//   * reading canonical behavior dumps
//   * reading candidate behavior
//   * executing Bend on canonical implementation files
//
// This script does not execute build_oracle.ts; it inspects its source
// for forbidden import patterns and reports violations.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(import.meta.dir, "..");
const BUILD_ORACLE = resolve(ROOT, "lab/build_oracle.ts");

const src = readFileSync(BUILD_ORACLE, "utf-8");

const forbidden: { name: string; pattern: RegExp }[] = [
  { name: "reads_canonical_main",   pattern: /authority-kernel\/main\.bend/ },
  { name: "reads_canonical_proof",  pattern: /authority-kernel\/PROOF\.bend/ },
  { name: "reads_canonical_laws",   pattern: /authority-kernel\/LAWS\.bend/ },
  { name: "reads_canonical_dump",   pattern: /canonical.*behavior.*dump|_canonical_dump/i },
  { name: "reads_candidate_behavior", pattern: /candidates\/.*behavior\.json/ },
  { name: "executes_bend",          pattern: /spawn\(\s*\{[^}]*bend2\/main\.ts/s },
  { name: "imports_bend_runner",    pattern: /import.*bend2\/main\.ts/ },
];

interface Violation {
  name: string;
  line: number;
  snippet: string;
}

const violations: Violation[] = [];
const lines = src.split("\n");
for (let i = 0; i < lines.length; i++) {
  for (const f of forbidden) {
    if (f.pattern.test(lines[i])) {
      violations.push({ name: f.name, line: i + 1, snippet: lines[i].trim().slice(0, 120) });
    }
  }
}

const report = {
  act: "ACT-MRVN-QUALIFY06-CORRECTION01",
  timestamp: new Date().toISOString(),
  build_oracle_path: BUILD_ORACLE,
  build_oracle_sha256: createHash("sha256").update(src).digest("hex"),
  build_oracle_loc: lines.length,
  forbidden_patterns: forbidden.map((f) => f.name),
  violation_count: violations.length,
  violations,
  pass: violations.length === 0,
};

writeFileSync(resolve(ROOT, "lab/intent_provenance_result.json"), JSON.stringify(report, null, 2));

console.log("=== ACT-MRVN-06 intent provenance gate ===");
console.log(`build_oracle: ${BUILD_ORACLE}`);
console.log(`sha256:       ${report.build_oracle_sha256}`);
console.log(`loc:          ${report.build_oracle_loc}`);
console.log(`forbidden patterns: ${forbidden.length}`);
console.log(`violations:   ${violations.length}`);
for (const v of violations) {
  console.log(`  - ${v.name} (line ${v.line}): ${v.snippet}`);
}
console.log("");
console.log(violations.length === 0 ? "PASS: build_oracle.ts has no canonical-implementation dependency" : "FAIL: build_oracle.ts depends on canonical-implementation artifacts");

if (violations.length > 0) process.exit(1);
