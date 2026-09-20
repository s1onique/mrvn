#!/usr/bin/env bun
// ACT-MRVN-07 build_artifact.ts
//
// Build MRVN-05 portable proof-carrying artifacts for the ROBUST
// candidates, and verify them in --mode full.

import { spawn } from "bun";
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(import.meta.dir, "..");
const REPO = resolve(ROOT, "..", "..", "..");
const BEND = resolve(REPO, "bend2/main.ts");

async function run(cmd: string[]): Promise<{ exit: number; out: string; err: string }> {
  const proc = spawn({ cmd, stdout: "pipe", stderr: "pipe" });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  await proc.exited;
  return { exit: proc.exitCode ?? 1, out, err };
}

async function main() {
  const buildScript = resolve(REPO, "factory/qualify/ACT-MRVN-QUALIFY05/lab/build_artifact.ts");
  const verifyScript = resolve(REPO, "factory/qualify/ACT-MRVN-QUALIFY05/lab/verify_artifact.ts");
  const schemaPath = resolve(REPO, "factory/qualify/ACT-MRVN-QUALIFY05/schema/proof-artifact-v1.schema.json");

  // Parse --candidate and --classification args.
  let onlyCandidate: string | null = null;
  let forcedClassification: string | null = null;
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === "--candidate") onlyCandidate = process.argv[++i];
    else if (process.argv[i] === "--classification") forcedClassification = process.argv[++i];
  }

  // Load candidates.json to find ROBUST/REPROOF_REQUIRED candidates.
  const candidatesPath = resolve(ROOT, "lab/candidates.json");
  if (!existsSync(candidatesPath)) {
    console.error(`FAIL: ${candidatesPath} not found; run gen_candidates.ts first`);
    process.exit(1);
  }
  const cands = JSON.parse(readFileSync(candidatesPath, "utf-8")) as any;
  // Copy to a new array so we can safely filter without mutating the source.
  const candidates: any[] = [...(cands.candidates as any[])];
  if (onlyCandidate) {
    const idx = candidates.findIndex((c: any) => c.candidate_id === onlyCandidate);
    if (idx < 0) {
      // Not found in candidates.json yet (e.g. classify is calling us before
      // candidates.json is updated).  Construct a minimal stub from the
      // candidate's on-disk result.json + descriptor.
      if (forcedClassification) {
        const stub: any = {
          candidate_id: onlyCandidate,
          family: "UNKNOWN",
          description: "(auto-stub from classify)",
          classification: forcedClassification,
          implementation_sha256: null,
          laws_sha256: null,
          intent_sha256: null,
        };
        // Try to enrich from result.json if available.
        const candDir = resolve(ROOT, "candidates", onlyCandidate);
        const rpath = resolve(candDir, "result.json");
        if (existsSync(rpath)) {
          const rj = JSON.parse(readFileSync(rpath, "utf-8"));
          stub.implementation_sha256 = rj.implementation_sha256;
          stub.laws_sha256 = rj.laws_sha256;
          stub.intent_sha256 = rj.intent_sha256;
        }
        candidates.length = 0;
        candidates.push(stub);
      } else {
        console.error(`FAIL: --candidate ${onlyCandidate} not found in candidates.json (and no --classification provided)`);
        process.exit(1);
      }
    } else {
      const only = candidates[idx];
      // If a forcedClassification was provided (e.g. classify is auto-building
      // a candidate before candidates.json has been updated), override the
      // entry's classification so the filter at line 102 passes.
      if (forcedClassification) only.classification = forcedClassification;
      candidates.length = 0;
      candidates.push(only);
    }
  }

  // Also include AGENT candidates that classified ROBUST, ONLY if their
  // candidate directory exists on disk (otherwise the agent_refactor hasn't
  // run yet, or its candidates have been cleaned).
  const agentResultsPath = resolve(ROOT, "lab/agent_results.json");
  if (existsSync(agentResultsPath)) {
    const ar = JSON.parse(readFileSync(agentResultsPath, "utf-8"));
    for (const c of ar.candidates) {
      if (c.classification !== "ROBUST") continue;
      const agentCandDir = resolve(ROOT, "candidates", c.candidate_id);
      if (!existsSync(agentCandDir)) continue;
      candidates.push({
        candidate_id: c.candidate_id,
        family: "AGENT",
        classification: c.classification,
        implementation_sha256: null,
        laws_sha256: null,
        intent_sha256: null,
      });
    }
  }

  const records: any[] = [];
  for (const c of candidates) {
    if (c.classification !== "ROBUST" && c.classification !== "REPROOF_REQUIRED") continue;
    const candDir = resolve(ROOT, "candidates", c.candidate_id);
    const artifactDir = resolve(candDir, "artifact");

    if (!existsSync(artifactDir)) mkdirSync(artifactDir, { recursive: true });
    const payloadDir = resolve(artifactDir, "payload");
    if (!existsSync(payloadDir)) mkdirSync(payloadDir, { recursive: true });
    // Copy main.bend, LAWS.bend, and (REPROOF.bend if present, else PROOF.bend) into payload.
    copyFileSync(resolve(candDir, "main.bend"), resolve(payloadDir, "main.bend"));
    copyFileSync(resolve(candDir, "LAWS.bend"), resolve(payloadDir, "LAWS.bend"));
    const proofSrc = existsSync(resolve(candDir, "REPROOF.bend"))
      ? resolve(candDir, "REPROOF.bend")
      : resolve(candDir, "PROOF.bend");
    copyFileSync(proofSrc, resolve(payloadDir, "PROOF.bend"));

    // Replay the proof.
    const evidenceDir = resolve(artifactDir, "evidence");
    if (!existsSync(evidenceDir)) mkdirSync(evidenceDir, { recursive: true });
    const replay = await run(["bun", BEND, resolve(payloadDir, "PROOF.bend")]);
    const replayJson = {
      exit_code: replay.exit,
      stdout_hash: createHash("sha256").update(replay.out).digest("hex"),
      stderr_hash: createHash("sha256").update(replay.err).digest("hex"),
      replayed_at: new Date().toISOString(),
    };
    writeFileSync(resolve(evidenceDir, "proof-run.json"), JSON.stringify(replayJson, null, 2) + "\n");
    writeFileSync(resolve(evidenceDir, "proof-stdout.txt"), replay.out + "\n");

    const buildCmd = [
      "bun", buildScript,
      "--source", payloadDir,
      "--out", artifactDir,
      "--schema", schemaPath,
      "--subject-name", c.candidate_id,
      "--subject-kind", "bend-module-set",
      "--bend-runner", BEND,
      "--repo", REPO,
      "--source-commit", "",
      "--build-command", `bun factory/qualify/ACT-MRVN-QUALIFY07/lab/build_artifact.ts (candidate ${c.candidate_id})`,
      "--evidence", resolve(evidenceDir, "proof-run.json"),
    ];
    const buildRes = await run(buildCmd);
    if (buildRes.exit !== 0) {
      console.error(`  build_artifact FAILED for ${c.candidate_id}: ${buildRes.err.slice(0, 500)}`);
      continue;
    }

    const manifest = JSON.parse(readFileSync(resolve(artifactDir, "manifest.json"), "utf-8")) as any;
    const artifactId = manifest.artifact_id;

    const verifyRes = await run([
      "bun", verifyScript,
      "--artifact", artifactDir,
      "--mode", "full",
      "--bend-runner", BEND,
    ]);
    const verifyOk = verifyRes.exit === 0;

    records.push({
      candidate_id: c.candidate_id,
      family: c.family,
      classification: c.classification,
      artifact_id: artifactId,
      verify_exit: verifyRes.exit,
      verify_pass: verifyOk,
      implementation_sha256: c.implementation_sha256,
      laws_sha256: c.laws_sha256,
      intent_sha256: c.intent_sha256,
      proof_kind: existsSync(resolve(candDir, "REPROOF.bend")) ? "REPROOF" : "CANONICAL_PROOF",
    });
    console.log(`${c.candidate_id.padEnd(28)} | ${c.classification.padEnd(22)} | ${artifactId} | verify=${verifyOk ? "PASS" : "FAIL"}`);
  }

  writeFileSync(resolve(ROOT, "lab/artifact_index.json"), JSON.stringify({
    act: "ACT-MRVN-QUALIFY07",
    total_artifacts: records.length,
    verify_pass: records.filter((r) => r.verify_pass).length,
    verify_fail: records.filter((r) => !r.verify_pass).length,
    artifacts: records,
  }, null, 2) + "\n");

  console.log(`\ntotal artifacts: ${records.length}`);
  console.log(`verify PASS:     ${records.filter((r) => r.verify_pass).length}`);
  console.log(`verify FAIL:     ${records.filter((r) => !r.verify_pass).length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
