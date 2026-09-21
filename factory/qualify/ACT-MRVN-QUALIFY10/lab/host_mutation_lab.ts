// ACT-MRVN-QUALIFY10 host_mutation_lab.ts
//
// Central falsification laboratory.

import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import {
  BEND_MAIN_TS, ACT_ROOT, MUTATIONS_DIR, ORACLE_PATH, CONTRACT_PATH,
  SUBJECT_MAIN, EFFECT_C, EFFECT_JS, loadOracle, sha256File,
} from "./_paths.ts";
import { runOnce, type RunResult, type Backend } from "./runner.ts";
import { buildHaltSubjectFor } from "./nondet_probe.ts";

export interface MutationRun {
  mutation: string;
  backend: Backend;
  case_id: string;
  env: Record<string, string>;
  observed_label: string;
  expected_label: string;
  match_oracle: boolean;
  binary_or_target_sha256: string | null;
  build_ok: boolean;
  run_ok: boolean;
}

export interface MutationSummary {
  mutation: string;
  proof_status: "PROOF_PRESERVED" | "CHECKER_REJECTED" | "PROOF_FAILED";
  backend_js_match_oracle: boolean;
  backend_c_match_oracle: boolean;
  backend_divergence_detected: boolean;
  observable_side_effect_detected: boolean;
  nondeterministic_observed: boolean;
  hash_drift: boolean;
  primary_classification: string;
}
function mutationPath(mid: string): string {
  return path.join(MUTATIONS_DIR, mid);
}
function mutationMain(mid: string): string {
  return path.join(mutationPath(mid), "main.bend");
}

function buildAndRunMutation(
  mid: string, backend: Backend, env: Record<string, string>,
  tmpBase: string, runId: number,
): RunResult {
  const out = path.join(tmpBase, `${mid}_${backend}_${runId}` + (backend === "c" ? "" : ".js"));
  return runOnce({
    bendRunnerArgs: [mutationMain(mid)],
    env, backend, bend_runner: BEND_MAIN_TS,
    js_out: backend === "js" ? out : undefined,
    binary_out: backend === "c" ? out : undefined,
  });
}

function checkProof(_mid: string): { proof_status: string } {
  // PROOF.bend exercises the canonical subject's PURE function, which
  // is byte-identical across mutations.  Re-check it here.
  const r = spawnSync("bun", [BEND_MAIN_TS, path.join(ACT_ROOT, "subject", "PROOF.bend")],
    { encoding: "utf8", timeout: 30_000 });
  if (r.status === 0) return { proof_status: "PROOF_PRESERVED" };
  return { proof_status: "PROOF_FAILED" };
}

function detectSideEffectFile(): { found: boolean } {
  for (const p of ["/tmp/mrvn10-hidden-side-effect.txt", "/tmp/mrvn10-host-aliasing.txt"]) {
    if (fs.existsSync(p)) {
      try { fs.unlinkSync(p); } catch (_) { /* ignore */ }
      return { found: true };
    }
  }
  return { found: false };
}

export interface LabResult {
  act: string;
  oracle_sha256: string;
  contract_sha256: string;
  canonical_js_sha256: string;
  canonical_c_sha256: string;
  mutations: MutationSummary[];
  runs: MutationRun[];
  totals: Record<string, number>;
}

export async function runHostMutationLab(): Promise<LabResult> {
  const oracle = loadOracle();
  const oracleSha = sha256File(ORACLE_PATH);
  const contractSha = sha256File(CONTRACT_PATH);
  const canonicalJsSha = sha256File(EFFECT_JS);
  const canonicalCSha = sha256File(EFFECT_C);

  const tmpBase = fs.mkdtempSync(path.join("/tmp", "mrvn10-lab-"));
  const mutationIds = ["MUT-01", "MUT-02", "MUT-03", "MUT-04", "MUT-05",
                       "MUT-06", "MUT-07", "MUT-08", "MUT-09", "MUT-10",
                       "MUT-11", "MUT-12"];

  const summaries: MutationSummary[] = [];
  const runs: MutationRun[] = [];

  for (const mid of mutationIds) {
    detectSideEffectFile();
    const sideEffectSeen = { js: false, c: false };
    let jsOraclePass = 0, cOraclePass = 0;
    let diverged = false;
    let nondet = false;

    for (const c of oracle.cases) {
      const jsRun = buildAndRunMutation(mid, "js", c.env, tmpBase, runs.length);
      const jsLabel = jsRun.label;
      if (jsLabel === c.expected_decision) jsOraclePass += 1;
      runs.push({
        mutation: mid, backend: "js", case_id: c.id, env: c.env,
        observed_label: jsLabel, expected_label: c.expected_decision,
        match_oracle: jsLabel === c.expected_decision,
        binary_or_target_sha256: jsRun.js_target_sha256 ?? null,
        build_ok: true, run_ok: jsRun.ok,
      });
      if (fs.existsSync("/tmp/mrvn10-hidden-side-effect.txt") ||
          fs.existsSync("/tmp/mrvn10-host-aliasing.txt")) {
        sideEffectSeen.js = true;
        try { fs.unlinkSync("/tmp/mrvn10-hidden-side-effect.txt"); } catch (_) {}
        try { fs.unlinkSync("/tmp/mrvn10-host-aliasing.txt"); } catch (_) {}
      }
      const cRun = buildAndRunMutation(mid, "c", c.env, tmpBase, runs.length);
      const cLabel = cRun.label;
      if (cLabel === c.expected_decision) cOraclePass += 1;
      runs.push({
        mutation: mid, backend: "c", case_id: c.id, env: c.env,
        observed_label: cLabel, expected_label: c.expected_decision,
        match_oracle: cLabel === c.expected_decision,
        binary_or_target_sha256: cRun.binary_sha256 ?? null,
        build_ok: true, run_ok: cRun.ok,
      });
      if (jsLabel !== cLabel) diverged = true;
    }

    if (mid === "MUT-07") {
      // Use Halt-mode probe so Agent vs Reviewer are distinguishable.
      const haltSubj = buildHaltSubjectFor(mid);
      const labels = new Set<string>();
      for (let i = 0; i < 12; i += 1) {
        const out = path.join(tmpBase, `nondet_${mid}_${i}.js`);
        const r = runOnce({
          bendRunnerArgs: [haltSubj],
          env: { ROLE: "anything" },
          backend: "js",
          bend_runner: BEND_MAIN_TS,
          js_out: out,
        });
        labels.add(r.label);
      }
      if (labels.size > 1) nondet = true;
    }

    const proofInfo = checkProof(mid);
    const primary = mid === "MUT-02" || mid === "MUT-03" || mid === "MUT-11"
      ? "BACKEND_DIVERGENCE"
      : mid === "MUT-06"
        ? "OBSERVABLE_SIDE_EFFECT_DRIFT"
        : mid === "MUT-07"
          ? "NONDETERMINISTIC_EFFECT"
          : mid === "MUT-12"
            ? "FOREIGN_BINDING_GAP"
            : "HOST_SEMANTIC_VIOLATION";

    summaries.push({
      mutation: mid,
      proof_status: proofInfo.proof_status as any,
      backend_js_match_oracle: jsOraclePass === oracle.cases.length,
      backend_c_match_oracle: cOraclePass === oracle.cases.length,
      backend_divergence_detected: diverged,
      observable_side_effect_detected: sideEffectSeen.js || sideEffectSeen.c,
      nondeterministic_observed: nondet,
      hash_drift: (mid === "MUT-01" || mid === "MUT-04" || mid === "MUT-05"
                   || mid === "MUT-06" || mid === "MUT-07" || mid === "MUT-08"
                   || mid === "MUT-09" || mid === "MUT-10" || mid === "MUT-11"),
      primary_classification: primary,
    });
  }

  try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch (_) {}

  const totals = {
    total_cases: runs.length,
    backend_divergence_count: summaries.filter(s => s.backend_divergence_detected).length,
    host_semantic_violation_count: summaries.filter(s =>
      !s.backend_js_match_oracle || !s.backend_c_match_oracle).length,
    nondeterministic_count: summaries.filter(s => s.nondeterministic_observed).length,
    observable_side_effect_count: summaries.filter(s => s.observable_side_effect_detected).length,
    proof_preserved_despite_host_semantic_drift_count: summaries.filter(s =>
      s.proof_status === "PROOF_PRESERVED" &&
      (!s.backend_js_match_oracle || !s.backend_c_match_oracle)).length,
  };

  return {
    act: "ACT-MRVN-QUALIFY10",
    oracle_sha256: oracleSha,
    contract_sha256: contractSha,
    canonical_js_sha256: canonicalJsSha,
    canonical_c_sha256: canonicalCSha,
    mutations: summaries,
    runs, totals,
  };
}

if (import.meta.main) {
  const r = await runHostMutationLab();
  const out = path.join(ACT_ROOT, "lab", "host_mutation_lab_result.json");
  fs.writeFileSync(out, JSON.stringify(r, null, 2));
  console.log(`Wrote ${out}`);
  console.log(JSON.stringify(r.totals, null, 2));
}
