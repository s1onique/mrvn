// ACT-MRVN-QUALIFY10 runner -- run a configured subject under JS or C
// with a specified env, capture stdout/stderr, and decode the typed
// Decision via the printed label.

import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { sha256File, BEND_DIR } from "./_paths.ts";

export type Backend = "js" | "c";

export interface RunResult {
  ok: boolean;
  exit_code: number;
  stdout: string;
  stderr: string;
  label: string;                // exact string printed by main
  binary_sha256?: string;       // present iff backend === "c"
  binary_path?: string;         // present iff backend === "c"
  js_target_sha256?: string;    // present iff backend === "js"
  js_target_path?: string;
  ts_run_ms: number;
  env_keys: string[];
}

export interface RunOpts {
  bendRunnerArgs: string[];     // extra args to bend CLI
  env: Record<string, string>;  // env to set
  binary_out?: string;          // for c, where to put the binary
  js_out?: string;              // for js, where to put the .js
  backend: Backend;
  bend_runner: string;          // absolute path to bend2/main.ts
  timeout_ms?: number;
}

export function runOnce(opts: RunOpts): RunResult {
  const t0 = Date.now();
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "mrvn10-run-"));
  const outFile = opts.backend === "c"
    ? (opts.binary_out ?? path.join(tmpdir, "subject"))
    : (opts.js_out ?? path.join(tmpdir, "subject.js"));

  // Build
  const buildArgs = [opts.bend_runner, opts.bendRunnerArgs[0], "-o", outFile];
  const buildEnv: Record<string, string> = { ...process.env as any, ...opts.env };
  const buildResult = spawnSync("bun", buildArgs, {
    cwd: BEND_DIR,
    env: buildEnv,
    timeout: 30_000,
    encoding: "utf8",
  });
  if (buildResult.status !== 0) {
    return {
      ok: false, exit_code: buildResult.status ?? 1,
      stdout: buildResult.stdout ?? "", stderr: buildResult.stderr ?? "",
      label: "<build-failed>",
      ts_run_ms: Date.now() - t0, env_keys: Object.keys(opts.env),
    };
  }

  // Run
  const runArgs = opts.backend === "c" ? [] : [outFile];
  const runEnv: Record<string, string> = { ...process.env as any, ...opts.env };
  const runResult = spawnSync(opts.backend === "c" ? outFile : "bun", runArgs, {
    cwd: BEND_DIR,
    env: runEnv,
    timeout: opts.timeout_ms ?? 5_000,
    encoding: "utf8",
  });
  const label = (runResult.stdout ?? "").trim();

  let binary_sha256: string | undefined;
  if (opts.backend === "c") binary_sha256 = sha256File(outFile);
  let js_target_sha256: string | undefined;
  if (opts.backend === "js") js_target_sha256 = sha256File(outFile);

  return {
    ok: runResult.status === 0,
    exit_code: runResult.status ?? 1,
    stdout: runResult.stdout ?? "",
    stderr: runResult.stderr ?? "",
    label,
    binary_sha256,
    binary_path: opts.backend === "c" ? outFile : undefined,
    js_target_sha256,
    js_target_path: opts.backend === "js" ? outFile : undefined,
    ts_run_ms: Date.now() - t0,
    env_keys: Object.keys(opts.env),
  };
}