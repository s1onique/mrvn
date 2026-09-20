#!/usr/bin/env bun
// ACT-MRVN-07 run_all.ts
//
// End-to-end orchestrator: gen_candidates -> agent_refactor -> build_artifact
// -> metrics -> self-tests -> authority-attacks -> regression-hygiene.
//
// CORRECTION03: agent_refactor and metrics are now part of the orchestrator
// so that lab/agent_results.json and lab/metrics.json (with agent_summary)
// are always populated on a single `bun run_all.ts` invocation, making
// population/classification accounting self-consistent end-to-end.

import { spawn } from "bun";

async function run(cmd: string[], label: string): Promise<number> {
  console.log(`\n=== ${label} ===`);
  const proc = spawn({ cmd, stdout: "pipe", stderr: "pipe" });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  await proc.exited;
  // Print first 50 lines of stdout.
  const outLines = out.split("\n").slice(0, 50).join("\n");
  console.log(outLines);
  if (proc.exitCode !== 0) {
    console.error(`--- stderr (first 30 lines) ---`);
    console.error(err.split("\n").slice(0, 30).join("\n"));
  }
  return proc.exitCode ?? 1;
}

const ROOT = "/Volumes/UserData/Users/chistyakov/Projects/SPbNIX/mrvn/factory/qualify/ACT-MRVN-QUALIFY07/lab";

const stages: { name: string; cmd: string[]; allowNonZero: boolean }[] = [
  { name: "01-gen_candidates", cmd: ["bun", `${ROOT}/gen_candidates.ts`], allowNonZero: true },
  { name: "02-agent_refactor", cmd: ["bun", `${ROOT}/agent_refactor.ts`], allowNonZero: true },
  { name: "03-build_artifact", cmd: ["bun", `${ROOT}/build_artifact.ts`], allowNonZero: true },
  { name: "04-metrics", cmd: ["bun", `${ROOT}/metrics.ts`], allowNonZero: false },
  { name: "05-self_test", cmd: ["bun", `${ROOT}/self_test.ts`], allowNonZero: false },
  { name: "06-authority_attacks", cmd: ["bun", `${ROOT}/authority_attacks.ts`], allowNonZero: false },
  { name: "07-regression_hygiene", cmd: ["bun", `${ROOT}/regression_hygiene.ts`], allowNonZero: false },
];

let totalExit = 0;
for (const s of stages) {
  const exit = await run(s.cmd, s.name);
  if (exit !== 0 && !s.allowNonZero) totalExit = exit;
}

console.log(`\n=== MRVN-07 run_all exit=${totalExit} ===`);
process.exit(totalExit);
