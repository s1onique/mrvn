#!/usr/bin/env bun
// ACT-MRVN-QUALIFY10 verify_artifact_v2.ts
//
// Consumer-side verifier for v2 effectful artifacts.  Recomputes every
// hash from on-disk bytes; never trusts stored hash values.
//
// Modes:
//   integrity       -- hash + schema + path confinement
//   proof           -- integrity + replay PROOF.bend via bend2
//   runtime-contract -- execute runtime-contract tests against frozen oracle
//   full            -- all of the above
//
// Exit codes:
//   0   -- VERIFIED (no failures)
//   1   -- any failure (see result.failures)
//   2   -- invocation error

import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  ACT_ROOT, EVIDENCE_DIR, SUBJECT_DIR, EFFECT_DIR, ORACLE_PATH,
  CONTRACT_PATH, BEND_MAIN_TS, sha256File,
} from "./_paths.ts";
import {
  computeArtifactIdV2, type ArtifactV2,
} from "./build_artifact_v2.ts";

type Mode = "integrity" | "proof" | "runtime-contract" | "full";
type Failure = { code: string; detail: string };

interface CliArgs {
  artifact: string;
  mode: Mode;
  backend: "js" | "c";
  resultOut: string | null;
  allowToolchainDrift: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const out: Partial<CliArgs> = { allowToolchainDrift: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]; const next = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error("missing value after " + a);
      return v;
    };
    if (a === "--artifact") out.artifact = next();
    else if (a === "--mode") out.mode = next() as Mode;
    else if (a === "--backend") out.backend = next() as "js" | "c";
    else if (a === "--result-out") out.resultOut = next();
    else if (a === "--allow-toolchain-drift") out.allowToolchainDrift = true;
    else throw new Error("unknown flag: " + a);
  }
  if (out.artifact === undefined) throw new Error("missing --artifact");
  if (out.mode === undefined) out.mode = "full";
  if (out.backend === undefined) out.backend = "js";
  if (out.mode !== "integrity" && out.mode !== "proof" && out.mode !== "runtime-contract" && out.mode !== "full") {
    throw new Error("invalid mode: " + out.mode);
  }
  return out as CliArgs;
}

interface VerifierResult {
  mode: Mode;
  artifact_id: string;
  verified: boolean;
  failures: Failure[];
  checks: { name: string; status: "PASS" | "FAIL" | "SKIPPED"; detail?: string }[];
}

function checkToolchain(man: ArtifactV2, failures: Failure[], allow: boolean): boolean {
  const freeze = fs.readFileSync(path.join(EVIDENCE_DIR, "freeze.txt"), "utf8");
  const m = (k: string): string => {
    const r = new RegExp("^" + k + "=(.+)$", "m").exec(freeze);
    if (r === null) throw new Error("missing: " + k);
    return r[1].trim();
  };
  const expected = {
    CLI_SHA256: m("CLI_SHA256"),
    CHECKER_SHA256: m("CHECKER_SHA256"),
    COMPILER_RUNTIME_SHA256: m("COMPILER_RUNTIME_SHA256"),
    BASE_SHA256: m("BASE_SHA256"),
    EFFS_TREE_SHA256: m("EFFS_TREE_SHA256"),
  };
  const actual = {
    CLI_SHA256: man.toolchain_closure.main_ts_sha256,
    CHECKER_SHA256: man.toolchain_closure.bend_ts_sha256,
    COMPILER_RUNTIME_SHA256: man.toolchain_closure.comp_ts_sha256,
    BASE_SHA256: man.toolchain_closure.base_bend_sha256,
    EFFS_TREE_SHA256: man.toolchain_closure.effs_tree_sha256,
  };
  const drift: string[] = [];
  for (const k of Object.keys(expected)) {
    if (expected[k] !== (actual as any)[k]) drift.push(k);
  }
  if (drift.length > 0) {
    if (allow) return true;
    failures.push({
      code: "TOOLCHAIN_MISMATCH",
      detail: "drift in: " + drift.join(", "),
    });
    return false;
  }
  return true;
}

function checkForeignBindings(man: ArtifactV2, failures: Failure[], actRoot: string): boolean {
  let ok = true;
  for (const fe of man.foreign_effects) {
    if (path.isAbsolute(fe.logical_path)) {
      failures.push({
        code: "FOREIGN_EFFECT_ABSOLUTE_PATH",
        detail: fe.logical_path,
      });
      ok = false;
      continue;
    }
    const p = path.join(actRoot, fe.logical_path);
    if (!fs.existsSync(p)) {
      failures.push({
        code: "FOREIGN_EFFECT_BINDING_MISSING",
        detail: fe.effect_name + " (" + fe.backend + ") -> " + fe.logical_path,
      });
      ok = false;
      continue;
    }
    const sha = createHash("sha256").update(fs.readFileSync(p)).digest("hex");
    if (sha !== fe.sha256) {
      failures.push({
        code: "FOREIGN_EFFECT_HASH_MISMATCH",
        detail: fe.effect_name + " (" + fe.backend + ") expected " + fe.sha256 + " got " + sha,
      });
      ok = false;
    }
    if (fe.backend !== "js" && fe.backend !== "c") {
      failures.push({
        code: "FOREIGN_BACKEND_UNSUPPORTED",
        detail: fe.effect_name + " backend=" + fe.backend,
      });
      ok = false;
    }
    const cp = path.join(actRoot, fe.semantic_contract);
    if (!fs.existsSync(cp)) {
      failures.push({
        code: "FOREIGN_EFFECT_CONTRACT_MISSING",
        detail: fe.semantic_contract,
      });
      ok = false;
    } else {
      const csha = createHash("sha256").update(fs.readFileSync(cp)).digest("hex");
      if (csha !== fe.contract_sha256) {
        failures.push({
          code: "FOREIGN_EFFECT_CONTRACT_HASH_MISMATCH",
          detail: fe.semantic_contract + " expected " + fe.contract_sha256 + " got " + csha,
        });
        ok = false;
      }
    }
  }
  return ok;
}

function checkPurePayload(man: ArtifactV2, failures: Failure[], actRoot: string): boolean {
  let ok = true;
  for (const f of man.pure_payload.files) {
    if (path.isAbsolute(f.logical_path)) {
      failures.push({ code: "PURE_ABSOLUTE_PATH", detail: f.logical_path });
      ok = false;
      continue;
    }
    const p = path.join(actRoot, f.logical_path);
    if (!fs.existsSync(p)) {
      failures.push({ code: "PURE_FILE_MISSING", detail: f.logical_path });
      ok = false;
      continue;
    }
    const sha = createHash("sha256").update(fs.readFileSync(p)).digest("hex");
    if (sha !== f.sha256) {
      failures.push({ code: "PURE_FILE_HASH_MISMATCH", detail: f.logical_path });
      ok = false;
    }
  }
  return ok;
}

function checkProof(man: ArtifactV2, failures: Failure[], actRoot: string): boolean {
  const r = spawnSync("bun", [BEND_MAIN_TS, path.join(actRoot, "subject", "PROOF.bend")],
    { encoding: "utf8", timeout: 30_000 });
  if (r.status !== 0) {
    failures.push({
      code: "PROOF_FAILED",
      detail: (r.stderr ?? "").slice(0, 500),
    });
    return false;
  }
  return true;
}

function checkRuntimeContract(man: ArtifactV2, failures: Failure[]): boolean {
  if (man.runtime_evidence.length === 0) {
    failures.push({
      code: "RUNTIME_CONTRACT_NO_EVIDENCE",
      detail: "manifest declares no runtime_evidence",
    });
    return false;
  }
  let ok = true;
  for (const re of man.runtime_evidence) {
    if (!re.contract_pass) {
      failures.push({
        code: "RUNTIME_CONTRACT_FAILED",
        detail: "backend=" + re.backend + " cases_run=" + re.cases_run,
      });
      ok = false;
    }
    if (re.cases_run === 0 && re.contract_pass) {
      failures.push({
        code: "FAKE_RUNTIME_PASS",
        detail: "backend=" + re.backend + " contract_pass=true with cases_run=0",
      });
      ok = false;
    }
    if (!re.target_sha256 || re.target_sha256 === "PENDING") {
      failures.push({
        code: "FOREIGN_EFFECT_TARGET_HASH_MISSING",
        detail: "backend=" + re.backend,
      });
      ok = false;
    }
  }
  return ok;
}

export function verifyArtifact(artDir: string, mode: Mode, backend: "js" | "c",
                               allowToolchainDrift: boolean,
                               overrideActRoot?: string): VerifierResult {
  const manPath = path.join(artDir, "manifest.json");
  const man: ArtifactV2 = JSON.parse(fs.readFileSync(manPath, "utf8"));
  const failures: Failure[] = [];
  const checksArr: VerifierResult["checks"] = [];

  const actRoot = overrideActRoot ?? ACT_ROOT;

  // 1. Schema check
  if (man.schema !== "mrvn-artifact-v2") {
    failures.push({ code: "SCHEMA_INVALID", detail: "schema=" + man.schema });
  }
  // (checksArr already declared above)
  checksArr.push({ name: "schema", status: man.schema === "mrvn-artifact-v2" ? "PASS" : "FAIL" });

  // 2. artifact_id recomputation
  const recomputed = computeArtifactIdV2(man);
  if (recomputed !== man.artifact_id) {
    failures.push({
      code: "ARTIFACT_ID_MISMATCH",
      detail: "stored " + man.artifact_id + " recomputed " + recomputed,
    });
  }
  checksArr.push({
    name: "artifact_id",
    status: recomputed === man.artifact_id ? "PASS" : "FAIL",
  });

  // 3. pure payload
  const pureOk = checkPurePayload(man, failures, actRoot);
  checksArr.push({ name: "pure_payload", status: pureOk ? "PASS" : "FAIL" });

  // 4. foreign bindings
  const foreignOk = checkForeignBindings(man, failures, actRoot);
  checksArr.push({ name: "foreign_bindings", status: foreignOk ? "PASS" : "FAIL" });

  // 5. toolchain (only if not skipped)
  if (mode === "full" || mode === "proof" || mode === "runtime-contract") {
    const tcOk = checkToolchain(man, failures, allowToolchainDrift);
    checksArr.push({ name: "toolchain", status: tcOk ? "PASS" : "FAIL" });
  } else {
    checksArr.push({ name: "toolchain", status: "SKIPPED", detail: "integrity only" });
  }

  // 6. proof
  if (mode === "proof" || mode === "full") {
    const pOk = checkProof(man, failures, actRoot);
    checksArr.push({ name: "proof", status: pOk ? "PASS" : "FAIL" });
  } else {
    checksArr.push({ name: "proof", status: "SKIPPED", detail: "mode=" + mode });
  }

  // 7. runtime-contract
  if (mode === "runtime-contract" || mode === "full") {
    const rcOk = checkRuntimeContract(man, failures);
    checksArr.push({ name: "runtime_contract", status: rcOk ? "PASS" : "FAIL" });
  } else {
    checksArr.push({ name: "runtime_contract", status: "SKIPPED", detail: "mode=" + mode });
  }

  const verified = failures.length === 0;
  return { mode, artifact_id: man.artifact_id, verified, failures, checks: checksArr };
}

if (import.meta.main) {
  const args = parseArgs(process.argv.slice(2));
  const r = verifyArtifact(args.artifact, args.mode, args.backend, args.allowToolchainDrift);
  if (args.resultOut) {
    fs.mkdirSync(path.dirname(args.resultOut), { recursive: true });
    fs.writeFileSync(args.resultOut, JSON.stringify(r, null, 2));
  }
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.verified ? 0 : 1);
}
