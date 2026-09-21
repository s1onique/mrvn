#!/usr/bin/env bun
// ACT-MRVN-08 build_artifact_index.ts
//
// Walks candidates/*/artifact/manifest.json and produces
// lab/artifact_index.json with PASS/FAIL tally.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const CANDIDATES = resolve(ROOT, "independent");

interface IndexRecord {
  candidate_id: string;
  family: string;
  artifact_id: string | null;
  verify_pass: boolean;
  verify_exit: number;
  implementation_sha256: string | null;
  laws_sha256: string | null;
  proof_kind: string;
}

function sha(p: string): string | null {
  if (!existsSync(p)) return null;
  try { return readFileSync(p).toString("hex").length === 64 ? readFileSync(p).toString("hex") : null; } catch { return null; }
}

async function main() {
  const { readdirSync } = await import("node:fs");
  const entries = readdirSync(CANDIDATES, { withFileTypes: true });
  const records: IndexRecord[] = [];
  let total = 0;
  let pass = 0;
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const candDir = resolve(CANDIDATES, e.name);
    const manifestPath = resolve(candDir, "artifact/manifest.json");
    if (!existsSync(manifestPath)) continue;
    total++;
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      const resultPath = resolve(candDir, "result.json");
      const result = existsSync(resultPath) ? JSON.parse(readFileSync(resultPath, "utf-8")) : {};
      const artifact = result.artifact ?? {};
      records.push({
        candidate_id: e.name,
        family: result.family ?? "?",
        artifact_id: manifest.artifact_id ?? null,
        verify_pass: artifact.verify === "pass",
        verify_exit: artifact.verify === "pass" ? 0 : 1,
        implementation_sha256: result.implementation_sha256 ?? null,
        laws_sha256: result.laws_sha256 ?? null,
        proof_kind: existsSync(resolve(candDir, "REPROOF.bend")) ? "REPROOF" : "CANONICAL_PROOF",
      });
      if (artifact.verify === "pass") pass++;
    } catch { /* skip */ }
  }

  const index = {
    act: "ACT-MRVN-QUALIFY09",
    timestamp: new Date().toISOString(),
    total_artifacts: total,
    verify_pass: pass,
    verify_fail: total - pass,
    artifacts: records,
  };
  writeFileSync(resolve(ROOT, "lab/artifact_index.json"), JSON.stringify(index, null, 2) + "\n");
  console.log(`artifact_index: total=${total} pass=${pass} fail=${total - pass}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
