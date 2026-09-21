// ACT-MRVN-QUALIFY10 verify_id_reconciliation.ts
//
// Runs the 4-way SHA reconciliation check across:
//   artifact-{js,c}/manifest.json           (the manifest in place)
//   artifact-{js,c}/manifest.sha256          (sidecar)
//   lab/artifact_index.json                  (index entry per backend)
//   lab/artifact_verify_{js,c}.json          (verifier output)
//
// and the structural properties the v2 schema requires:
//   runtime_evidence[0].target_sha256 != "PENDING"
//   runtime_evidence[0].cases_run     == 7
//   runtime_evidence[0].contract_pass == true
//
// Exits 0 if every backend passes, 1 otherwise.

import * as fs from "node:fs";
import * as path from "node:path";
import { ACT_ROOT } from "./_paths.ts";

type Backend = "js" | "c";

function readJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf8")) as T;
}

function readText(p: string): string {
  return fs.readFileSync(p, "utf8");
}

interface ReRow {
  backend: string;
  target_sha256: string;
  cases_run: number;
  contract_pass: boolean;
  observed_at: string;
}

function checkBackend(be: Backend): { ok: boolean; lines: string[] } {
  const lines: string[] = [];
  let ok = true;

  const manifestPath = path.join(ACT_ROOT, `artifact-${be}`, "manifest.json");
  const sidecarPath  = path.join(ACT_ROOT, `artifact-${be}`, "manifest.sha256");
  const indexPath    = path.join(ACT_ROOT, "lab", "artifact_index.json");
  const verifyPath   = path.join(ACT_ROOT, "lab", `artifact_verify_${be}.json`);

  const m = readJson<{ artifact_id: string; runtime_evidence: ReRow[] }>(manifestPath);
  const sidecar = readText(sidecarPath).trim();
  const idx = readJson<{ artifacts: Record<string, { artifact_id: string }> }>(indexPath);
  const vr  = readJson<{ artifact_id: string }>(verifyPath);
  const re  = m.runtime_evidence[0];

  const id = m.artifact_id;
  const sOk = id === sidecar;
  const iOk = id === idx.artifacts[be].artifact_id;
  const vOk = id === vr.artifact_id;
  const tOk = re.target_sha256 !== "PENDING";
  const cOk = re.cases_run === 7;
  const pOk = re.contract_pass === true;

  lines.push(`[${be}] manifest_path=${path.relative(ACT_ROOT, manifestPath)}`);
  lines.push(`       id          = ${id}`);
  lines.push(`       sidecar ==  : ${sOk}  (${sidecar})`);
  lines.push(`       index   ==  : ${iOk}  (${idx.artifacts[be].artifact_id})`);
  lines.push(`       verify  ==  : ${vOk}  (${vr.artifact_id})`);
  lines.push(`       target_sha256 != PENDING : ${tOk}  (${re.target_sha256.slice(0, 16)}...)`);
  lines.push(`       cases_run == 7           : ${cOk}  (${re.cases_run})`);
  lines.push(`       contract_pass == true    : ${pOk}  (${re.contract_pass})`);
  lines.push(`       observed_at              : ${re.observed_at}`);

  if (!(sOk && iOk && vOk && tOk && cOk && pOk)) ok = false;
  return { ok, lines };
}

function main(): number {
  const backends: Backend[] = ["js", "c"];
  let allOk = true;
  console.log("=== ACT-MRVN-QUALIFY10 artifact-v2 4-way ID reconciliation ===");
  for (const be of backends) {
    const { ok, lines } = checkBackend(be);
    if (!ok) allOk = false;
    for (const l of lines) console.log(l);
    console.log();
  }
  console.log(`reconciliation overall: ${allOk ? "PASS" : "FAIL"}`);
  return allOk ? 0 : 1;
}

if (import.meta.main) {
  const code = main();
  process.exit(code);
}
