// ACT-MRVN-QUALIFY10 full_pipeline.ts
//
// Drives:
//   1. runHostMutationLab (writes host_mutation_lab_result.json)
//   2. runRuntimeContract on js and c
//   3. buildArtifactV2 (per backend, with evidence)
//   4. verifyArtifact v2 (full mode)
//   5. assemble artifact_index.json and results.json
//
// Output:
//   lab/results.json
//   lab/backend_parity.json
//   lab/runtime_contract_results.json
//   lab/artifact_index.json

import * as fs from "node:fs";
import * as path from "node:path";
import {
  ACT_ROOT, EVIDENCE_DIR, ORACLE_PATH, CONTRACT_PATH,
  sha256File, loadOracle,
} from "./_paths.ts";
import { runHostMutationLab } from "./host_mutation_lab.ts";
import { runRuntimeContract, type RuntimeEvidenceRow } from "./runtime_contract_runner.ts";
import { buildArtifactV2, computeArtifactIdV2 } from "./build_artifact_v2.ts";
import { verifyArtifact } from "./verify_artifact_v2.ts";

interface PipelineResults {
  act: string;
  host_mutation_lab: Awaited<ReturnType<typeof runHostMutationLab>>;
  runtime_contract_js: RuntimeEvidenceRow;
  runtime_contract_c: RuntimeEvidenceRow;
  artifact_js: { artifact_id: string; manifest_path: string };
  artifact_c: { artifact_id: string; manifest_path: string };
  artifact_verify_js: ReturnType<typeof verifyArtifact>;
  artifact_verify_c: ReturnType<typeof verifyArtifact>;
  backend_parity: {
    backend_js_cases_pass: number;
    backend_c_cases_pass: number;
    diff_count: number;
    parity_ok: boolean;
  };
  final_verdict: string;
}

async function main() {
  console.log("=== ACT-MRVN-QUALIFY10 full pipeline ===");

  // 1. host_mutation_lab
  console.log("Step 1: host_mutation_lab ...");
  const mutation = await runHostMutationLab();
  fs.writeFileSync(
    path.join(ACT_ROOT, "lab", "host_mutation_lab_result.json"),
    JSON.stringify(mutation, null, 2),
  );

  // 2. runtime contract for both backends
  console.log("Step 2: runtime_contract (js) ...");
  const rcJs = await runRuntimeContract("js");
  console.log("Step 2: runtime_contract (c) ...");
  const rcC = await runRuntimeContract("c");

  fs.writeFileSync(
    path.join(ACT_ROOT, "lab", "runtime_contract_results.json"),
    JSON.stringify({ js: rcJs, c: rcC }, null, 2),
  );

  // 3. backend parity
  const parity = {
    backend_js_cases_pass: rcJs.cases_pass,
    backend_c_cases_pass: rcC.cases_pass,
    diff_count: rcJs.case_results.filter((r, i) =>
      r.observed !== rcC.case_results[i].observed).length,
    parity_ok: rcJs.cases_pass === rcC.cases_pass &&
               rcJs.case_results.every((r, i) =>
                 r.observed === rcC.case_results[i].observed),
  };
  fs.writeFileSync(
    path.join(ACT_ROOT, "lab", "backend_parity.json"),
    JSON.stringify(parity, null, 2),
  );

  // 4. build artifacts (per backend)
  console.log("Step 4: build_artifact_v2 (js) ...");
  const artJs = buildArtifactV2({
    backend: "js",
    runEvidence: {
      backend: "js",
      target_sha256: rcJs.target_sha256 ?? "PENDING",
      cases_run: rcJs.cases_run,
      contract_pass: rcJs.contract_pass,
    },
  });
  console.log("Step 4: build_artifact_v2 (c) ...");
  const artC = buildArtifactV2({
    backend: "c",
    runEvidence: {
      backend: "c",
      target_sha256: rcC.target_sha256 ?? "PENDING",
      cases_run: rcC.cases_run,
      contract_pass: rcC.contract_pass,
    },
  });

  const artifactIndex = {
    schema: "mrvn-artifact-index-v2",
    artifacts: {
      js: { artifact_id: artJs.manifest.artifact_id, manifest: artJs.paths.manifest,
        foreign_effect: artJs.manifest.foreign_effects[0] },
      c:  { artifact_id: artC.manifest.artifact_id, manifest: artC.paths.manifest,
        foreign_effect: artC.manifest.foreign_effects[0] },
    },
  };
  fs.writeFileSync(
    path.join(ACT_ROOT, "lab", "artifact_index.json"),
    JSON.stringify(artifactIndex, null, 2),
  );

  // 5. verify each artifact in full mode
  console.log("Step 5: verify_artifact_v2 (js, full) ...");
  const vJs = verifyArtifact(
    path.join(ACT_ROOT, "artifact-js"),
    "full", "js", false,
  );
  console.log("Step 5: verify_artifact_v2 (c, full) ...");
  const vC = verifyArtifact(
    path.join(ACT_ROOT, "artifact-c"),
    "full", "c", false,
  );

  fs.writeFileSync(
    path.join(ACT_ROOT, "lab", "artifact_verify_js.json"),
    JSON.stringify(vJs, null, 2),
  );
  fs.writeFileSync(
    path.join(ACT_ROOT, "lab", "artifact_verify_c.json"),
    JSON.stringify(vC, null, 2),
  );

  // 6. Final verdict
  let final_verdict = "FULL_QUALIFICATION_EFFECT_BOUNDARY_EXPLICIT";
  if (!vJs.verified) final_verdict = "ARTIFACT_VERIFY_FAILED_JS";
  if (!vC.verified) final_verdict = "ARTIFACT_VERIFY_FAILED_C";
  if (mutation.totals.host_semantic_violation_count === 0) {
    // If we couldn't find a single host semantic violation, this is suspicious.
    final_verdict = "FAILED_NO_HOST_VIOLATION_OBSERVED";
  }
  if (!parity.parity_ok) {
    final_verdict = "BACKEND_PARITY_GAP";
  }

  const results: PipelineResults = {
    act: "ACT-MRVN-QUALIFY10",
    host_mutation_lab: mutation,
    runtime_contract_js: rcJs,
    runtime_contract_c: rcC,
    artifact_js: { artifact_id: artJs.manifest.artifact_id, manifest_path: artJs.paths.manifest },
    artifact_c: { artifact_id: artC.manifest.artifact_id, manifest_path: artC.paths.manifest },
    artifact_verify_js: vJs,
    artifact_verify_c: vC,
    backend_parity: parity,
    final_verdict,
  };

  fs.writeFileSync(
    path.join(ACT_ROOT, "lab", "results.json"),
    JSON.stringify(results, null, 2),
  );

  console.log("=== final verdict:", final_verdict, "===");
}

if (import.meta.main) {
  await main();
}
