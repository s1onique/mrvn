// ACT-MRVN-QUALIFY10 runtime_contract_runner.ts
//
// Runs the canonical subject against the frozen runtime oracle on a
// specified backend and produces a single runtime-evidence row for the
// artifact manifest.

import * as fs from "node:fs";
import * as path from "node:path";
import { runOnce, type Backend } from "./runner.ts";
import {
  ACT_ROOT, ORACLE_PATH, BEND_MAIN_TS, SUBJECT_MAIN, EFFECT_DIR, loadOracle,
} from "./_paths.ts";

export interface RuntimeEvidenceRow {
  backend: Backend;
  target_sha256: string | null;
  cases_run: number;
  cases_pass: number;
  contract_pass: boolean;
  case_results: {
    case_id: string; observed: string; expected: string; pass: boolean;
  }[];
}

export async function runRuntimeContract(backend: Backend): Promise<RuntimeEvidenceRow> {
  const oracle = loadOracle();
  const tmpBase = fs.mkdtempSync(path.join("/tmp", "mrvn10-rc-"));
  let pass = 0;
  const case_results: RuntimeEvidenceRow["case_results"] = [];
  let lastTargetSha: string | null = null;
  for (const c of oracle.cases) {
    const out = path.join(tmpBase, `rc_${backend}_${c.id}` + (backend === "c" ? "" : ".js"));
    const r = runOnce({
      bendRunnerArgs: [SUBJECT_MAIN], env: c.env, backend,
      bend_runner: BEND_MAIN_TS,
      js_out: backend === "js" ? out : undefined,
      binary_out: backend === "c" ? out : undefined,
    });
    const ok = r.label === c.expected_decision;
    if (ok) pass += 1;
    if (backend === "js") lastTargetSha = r.js_target_sha256 ?? null;
    else lastTargetSha = r.binary_sha256 ?? null;
    case_results.push({
      case_id: c.id, observed: r.label, expected: c.expected_decision, pass: ok,
    });
  }
  try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch (_) {}
  return {
    backend,
    target_sha256: lastTargetSha,
    cases_run: oracle.cases.length,
    cases_pass: pass,
    contract_pass: pass === oracle.cases.length,
    case_results,
  };
}

if (import.meta.main) {
  const backend = (process.argv[2] ?? "js") as Backend;
  const ev = await runRuntimeContract(backend);
  const out = path.join(ACT_ROOT, "lab", `runtime_contract_${backend}.json`);
  fs.writeFileSync(out, JSON.stringify(ev, null, 2));
  console.log(JSON.stringify(ev, null, 2));
}
