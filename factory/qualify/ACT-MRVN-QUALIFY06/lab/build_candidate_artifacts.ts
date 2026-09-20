#!/usr/bin/env bun
// ACT-MRVN-06 build_candidate_artifacts.ts
//
// For every candidate classified as EQUIVALENT_SURVIVOR or
// SPECIFICATION_GAP, build an MRVN-05 portable proof-carrying artifact
// and verify it independently.

import { spawn } from "bun";
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve, basename } from "node:path";
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

function parseArgs(argv: string[]): { candidatesRoot: string; only: string | null } {
  const out: { candidatesRoot: string; only: string | null } = {
    candidatesRoot: resolve(ROOT, "candidates"),
    only: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = (): string => { const v = argv[++i]; if (v === undefined) throw new Error("missing value after " + a); return v; };
    if (a === "--candidates-root") out.candidatesRoot = resolve(next());
    else if (a === "--only") out.only = next();
    else throw new Error("unknown flag: " + a);
  }
  return out;
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));

  // ACT-MRVN-06-CORRECTION01: do not require lab/results.json.  Per-
  // candidate result.json is the source of truth for whether the
  // candidate is a survivor or gap; this allows build_candidate_artifacts
  // to be invoked per-candidate during run_all (where the global
  // summary is not yet written).
  const buildScript = resolve(ROOT, "../../../factory/qualify/ACT-MRVN-QUALIFY05/lab/build_artifact.ts");
  const verifyScript = resolve(ROOT, "../../../factory/qualify/ACT-MRVN-QUALIFY05/lab/verify_artifact.ts");

  let candidates: { candidate_id: string; classification: string; family?: string; diff_count?: number; implementation_sha256?: string; laws_sha256?: string; intent_sha256?: string }[];
  if (cli.only) {
    const rpath = resolve(cli.candidatesRoot, cli.only, "result.json");
    if (!existsSync(rpath)) {
      console.error(`FAIL: candidate ${cli.only} has no result.json`);
      process.exit(1);
    }
    const r = JSON.parse(readFileSync(rpath, "utf-8")) as any;
    candidates = [{
      candidate_id: cli.only,
      classification: r.classification,
      family: r.family ?? "",
      diff_count: r.behavior?.diff_count ?? 0,
      implementation_sha256: r.implementation_sha256,
      laws_sha256: r.laws_sha256,
      intent_sha256: r.intent_sha256,
    }];
  } else {
    const summaryPath = resolve(ROOT, "lab/results.json");
    if (!existsSync(summaryPath)) {
      console.error(`FAIL: lab/results.json missing and no --only specified`);
      process.exit(1);
    }
    const summary = JSON.parse(readFileSync(summaryPath, "utf-8")) as any;
    candidates = summary.candidates.filter((c: any) =>
      c.classification === "EQUIVALENT_SURVIVOR" || c.classification === "SPECIFICATION_GAP"
    );
  }

  const artifactRecords: any[] = [];

  for (const c of candidates) {
    const candDir = resolve(ROOT, "candidates", c.candidate_id);
    const artifactDir = resolve(candDir, "artifact");
    mkdirSync(artifactDir, { recursive: true });

    const payloadDir = resolve(artifactDir, "payload");
    mkdirSync(payloadDir, { recursive: true });
    copyFileSync(resolve(candDir, "LAWS.bend"), resolve(payloadDir, "LAWS.bend"));
    copyFileSync(resolve(candDir, "main.bend"), resolve(payloadDir, "main.bend"));
    const reproofPath = resolve(candDir, "REPROOF.bend");
    const proofSrc = existsSync(reproofPath) ? reproofPath : resolve(candDir, "PROOF.bend");
    copyFileSync(proofSrc, resolve(payloadDir, "PROOF.bend"));

    const evidenceDir = resolve(artifactDir, "evidence");
    mkdirSync(evidenceDir, { recursive: true });
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
      "--schema", resolve(ROOT, "../../../factory/qualify/ACT-MRVN-QUALIFY05/schema/proof-artifact-v1.schema.json"),
      "--subject-name", c.candidate_id,
      "--subject-kind", "bend-module-set",
      "--bend-runner", BEND,
      "--repo", REPO,
      "--source-commit", "",
      "--build-command", `bun factory/qualify/ACT-MRVN-QUALIFY06/lab/build_candidate_artifacts.ts (candidate ${c.candidate_id})`,
      "--evidence", resolve(evidenceDir, "proof-run.json"),
    ];
    const buildRes = await run(buildCmd);
    if (buildRes.exit !== 0) {
      console.error(`  FAIL: build_artifact failed for ${c.candidate_id}:`);
      console.error(buildRes.err);
      process.exit(1);
    }

    const manifest = JSON.parse(readFileSync(resolve(artifactDir, "manifest.json"), "utf-8")) as any;
    const artifactId = manifest.artifact_id;

    const verifyCmd = [
      "bun", verifyScript,
      "--artifact", artifactDir,
      "--mode", "full",
      "--bend-runner", BEND,
    ];
    const verifyRes = await run(verifyCmd);
    const verifyOk = verifyRes.exit === 0;

    artifactRecords.push({
      candidate_id: c.candidate_id,
      family: c.family,
      classification: c.classification,
      diff_count: c.diff_count,
      artifact_id: artifactId,
      artifact_dir: `candidates/${c.candidate_id}/artifact`,
      verify_exit: verifyRes.exit,
      verify_pass: verifyOk,
      implementation_sha256: c.implementation_sha256,
      laws_sha256: c.laws_sha256,
      intent_sha256: c.intent_sha256,
      proof_kind: existsSync(reproofPath) ? "REPROOF" : "CANONICAL_PROOF",
    });

    console.log(`${c.candidate_id.padEnd(28)} | ${c.classification.padEnd(22)} | ${artifactId} | verify=${verifyOk ? "PASS" : "FAIL"}`);
  }

  const summaryPath = resolve(ROOT, "lab/artifact_index.json");
  writeFileSync(summaryPath, JSON.stringify({
    act: "ACT-MRVN-QUALIFY06",
    total_artifacts: artifactRecords.length,
    verify_pass: artifactRecords.filter((r) => r.verify_pass).length,
    verify_fail: artifactRecords.filter((r) => !r.verify_pass).length,
    artifacts: artifactRecords,
  }, null, 2));
  console.log(`\nwrote ${summaryPath}`);
  console.log(`total artifacts: ${artifactRecords.length}`);
  console.log(`verify PASS:     ${artifactRecords.filter((r) => r.verify_pass).length}`);
  console.log(`verify FAIL:     ${artifactRecords.filter((r) => !r.verify_pass).length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });