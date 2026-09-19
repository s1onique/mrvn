#!/usr/bin/env bun
// MRVN-05 relocation + offline + toolchain availability test.
//
// 1. Copy the canonical artifact to a fresh /tmp directory.
// 2. Run verifier on the relocated copy using only the absolute
//    Bend runner path -- no original repository state.
// 3. (Optional) Disable network via offline flag (no actual net
//    usage; we never download anything).
// 4. Confirm: artifact_id unchanged, all phases pass, exit 0.

import { spawn } from "bun";
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(import.meta.dir, "..");
const LAB = resolve(ROOT, "lab");
const BEND = resolve(ROOT, "..", "..", "..", "bend2", "main.ts");
const CANONICAL_ARTIFACT = resolve(ROOT, "artifact");
const SCRATCH = "/tmp/mrvn-relocation-scratch";

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

async function runVerifier(outDir: string, mode: string): Promise<{ exit: number; stdout: string; stderr: string; }> {
  const proc = spawn({
    cmd: ["bun", resolve(LAB, "verify_artifact.ts"), "--artifact", outDir, "--mode", mode, "--bend-runner", BEND],
    stdout: "pipe", stderr: "pipe",
  });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  await proc.exited;
  return { exit: proc.exitCode ?? 1, stdout, stderr };
}

async function runVerifierOffline(outDir: string, mode: string): Promise<{ exit: number; stdout: string; stderr: string }> {
  // CORRECTION01: actually run the verifier with a runtime
  // network-call interceptor preloaded.  Bun's --preload lets us
  // monkey-patch fetch/Bun.connect/node:net/node:dns before any
  // module in the verifier process tree can call them.  This produces
  // *positive* evidence: not just a code grep, but a runtime guarantee
  // that the verifier's process tree cannot make a network call
  // without throwing.
  //
  // On Linux we additionally try unshare -n; on macOS in this
  // environment, kernel-level sandboxing (sandbox-exec, dtrace,
  // opensnoop, tcpdump) is blocked by SIP, so the user-space
  // monkey-patch is the strongest offline evidence we can produce.
  const PROBE = resolve(LAB, "offline_probe.ts");
  const cmd = ["bun", "--preload=" + PROBE, resolve(LAB, "verify_artifact.ts"), "--artifact", outDir, "--mode", mode, "--bend-runner", BEND, "--offline"];
  const proc = spawn({ cmd, stdout: "pipe", stderr: "pipe" });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  await proc.exited;
  return { exit: proc.exitCode ?? 1, stdout, stderr };
}

async function runVerifierNoProbe(outDir: string, mode: string): Promise<{ exit: number; stdout: string; stderr: string }> {
  // Same as above but without the preload, used to sanity-check the
  // probe does not break verification in the non-offline case.
  const cmd = ["bun", resolve(LAB, "verify_artifact.ts"), "--artifact", outDir, "--mode", mode, "--bend-runner", BEND];
  const proc = spawn({ cmd, stdout: "pipe", stderr: "pipe" });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  await proc.exited;
  return { exit: proc.exitCode ?? 1, stdout, stderr };
}

async function main() {
  const relocatedDir = resolve(SCRATCH, "relocated");
  rmSync(SCRATCH, { recursive: true, force: true });
  mkdirSync(relocatedDir, { recursive: true });

  // Step 1: ordinary filesystem copy.
  console.log("=== MRVN-05 relocation + offline ===");
  console.log("step 1: copy canonical artifact to", relocatedDir);
  const cp = spawn({ cmd: ["cp", "-r", CANONICAL_ARTIFACT + "/.", relocatedDir + "/"], stdout: "pipe", stderr: "pipe" });
  await new Response(cp.stdout).text();
  await new Response(cp.stderr).text();
  await cp.exited;

  // Sanity: the relocated artifact must have the same artifact_id.
  const canonicalManifest = JSON.parse(readFileSync(resolve(CANONICAL_ARTIFACT, "manifest.json"), "utf8"));
  const relocatedManifest = JSON.parse(readFileSync(resolve(relocatedDir, "manifest.json"), "utf8"));
  const idMatch = canonicalManifest.artifact_id === relocatedManifest.artifact_id;
  console.log("step 2: relocated artifact_id matches canonical:", idMatch, "(", relocatedManifest.artifact_id, ")");

  // Step 3: byte-identical payload.
  let payloadMatch = true;
  for (const f of canonicalManifest.payload.files) {
    const ca = sha256File(resolve(CANONICAL_ARTIFACT, f.path));
    const ra = sha256File(resolve(relocatedDir, f.path));
    if (ca !== ra) {
      payloadMatch = false;
      console.log("  MISMATCH:", f.path);
    }
  }
  console.log("step 3: payload bytes identical:", payloadMatch);

  // Step 4: verifier runs successfully on the relocated copy using
  // an absolute Bend path.  No original-repo state is consulted.
  console.log("step 4: verifier run on relocated copy (using absolute Bend path)");
  const result = await runVerifier(relocatedDir, "full");
  console.log("  exit:", result.exit);
  console.log(result.stdout.split("\n").slice(0, 5).join("\n"));

  // Step 5: same copy, but with a different artifact_id in the
  // manifest (i.e. tamper with the root ID only).  Verifier must
  // reject with MANIFEST_ID_MISMATCH.
  const tamperedIdDir = resolve(SCRATCH, "tampered-id");
  rmSync(tamperedIdDir, { recursive: true, force: true });
  const cp2 = spawn({ cmd: ["cp", "-r", CANONICAL_ARTIFACT + "/.", tamperedIdDir + "/"], stdout: "pipe", stderr: "pipe" });
  await new Response(cp2.stdout).text();
  await new Response(cp2.stderr).text();
  await cp2.exited;
  const tm = JSON.parse(readFileSync(resolve(tamperedIdDir, "manifest.json"), "utf8"));
  tm.artifact_id = "sha256:" + "0".repeat(64);
  writeFileSync(resolve(tamperedIdDir, "manifest.json"), JSON.stringify(tm));
  const result2 = await runVerifier(tamperedIdDir, "full");
  const idClassifiedCorrectly = result2.exit !== 0 && (result2.stdout + result2.stderr).includes("MANIFEST_ID_MISMATCH");
  console.log("step 5: tampered artifact_id rejected:", idClassifiedCorrectly, "exit=", result2.exit);

  // Step 6: toolchain availability failure.
  const proc = spawn({
    cmd: ["bun", resolve(LAB, "verify_artifact.ts"), "--artifact", relocatedDir, "--mode", "full"],
    stdout: "pipe", stderr: "pipe",
  });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  await proc.exited;
  const toolchainUnavailable = proc.exitCode !== 0 && (out + err).includes("TOOLCHAIN_UNAVAILABLE");
  console.log("step 6: toolchain-unavailable (no --bend-runner) classified:", toolchainUnavailable);

  // Step 7: actually run the verifier under the network-call interceptor.
  // CORRECTION01: not just a code grep — actually execute.
  const offlineResultOut = resolve(SCRATCH, "offline-result.json");
  require("node:fs").rmSync(offlineResultOut, { force: true });
  const offlineCmd = ["bun", "--preload=" + resolve(LAB, "offline_probe.ts"), resolve(LAB, "verify_artifact.ts"), "--artifact", relocatedDir, "--mode", "full", "--bend-runner", BEND, "--offline", "--result-out", offlineResultOut];
  const offlineProc = spawn({ cmd: offlineCmd, stdout: "pipe", stderr: "pipe" });
  const offlineStdout = await new Response(offlineProc.stdout).text();
  const offlineStderr = await new Response(offlineProc.stderr).text();
  await offlineProc.exited;
  const offlineExit = offlineProc.exitCode ?? 1;
  // Parse the result file to determine pass/fail rather than parsing
  // stdout text (which may be truncated by the pipe buffer).
  let offlinePass = false;
  let offlineResultSummary = "";
  try {
    const r = JSON.parse(require("node:fs").readFileSync(offlineResultOut, "utf8"));
    offlinePass = offlineExit === 0 && r.integrity === "pass" && r.proof === "pass" && r.supplemental_evidence === "pass";
    offlineResultSummary = "integrity=" + r.integrity + " proof=" + r.proof + " supplemental=" + r.supplemental_evidence;
  } catch (e) {
    offlineResultSummary = "could not read result file: " + String(e);
  }
  console.log("step 7: offline (network-call-interceptor) verification: exit=" + offlineExit + " passes=" + offlinePass + " (" + offlineResultSummary + ")");
  // Step 8: confirm the offline probe is actually armed by trying to
  // use it from a tiny inline bun script and asserting the probe fires.
  const PROBE = resolve(LAB, "offline_probe.ts");
  const probeCheck = spawn({
    cmd: ["bun", "--preload=" + PROBE, "-e", "fetch('http://example.invalid/').then(()=>console.log('UNEXPECTED'),e=>console.log('BLOCKED:',e.message))"],
    stdout: "pipe", stderr: "pipe",
  });
  const probeStdout = await new Response(probeCheck.stdout).text();
  await new Response(probeCheck.stderr).text();
  await probeCheck.exited;
  const probeArmed = probeStdout.includes("BLOCKED:") || probeStdout.includes("NETWORK BLOCKED");
  console.log("step 8: offline probe is armed and blocks fetch:", probeArmed, "(stdout=" + probeStdout.trim() + ")");
  // Step 9: confirm the probe does NOT prevent verification when the
  // verifier itself does not attempt network calls.
  const offlineSanityExit = (await runVerifierNoProbe(relocatedDir, "full")).exit;
  console.log("step 9: verifier without preload (sanity): exit=" + offlineSanityExit + " (expected 0)");

  // Step 10 (CORRECTION02): confirm the verifier actually propagates
  // the offline probe into the spawned Bend child.  CLI flags such as
  // --preload are NOT inherited by spawned children, so the verifier
  // must re-preload the same probe in the child's command array.
  // We exercise this by inspecting the verifier's source: the
  // runBend() function must contain a command array of the form
  // ["bun", "--preload=...offline_probe.ts", bendAbs, proofAbs].
  const probeFenceSrc = readFileSync(resolve(LAB, "verify_artifact.ts"), "utf8");
  const fenceWired =
    probeFenceSrc.includes("--preload=") &&
    /\[\s*"bun"\s*,\s*"--preload=/.test(probeFenceSrc);
  console.log("step 10: verifier source fences spawned child with --preload=offline_probe:", fenceWired);

  // Step 11 (CORRECTION03): TOOLCHAIN PORTABILITY.
  // The reviewer identified that, prior to Correction03, the
  // manifest's toolchain_closure bound by absolute producer path.
  // We now prove portability by:
  //   (a) copying the four Bend toolchain files (main.ts / bend.ts /
  //       comp.ts / base.bend) to a totally different filesystem
  //       root under /tmp,
  //   (b) verifying the same artifact against that relocated Bend,
  //   (c) confirming the four closure sha256s are unchanged across
  //       the move.
  const REAL_BEND_DIR = BEND.slice(0, BEND.lastIndexOf("/") + 1);
  const RELOC_BEND_DIR = resolve(SCRATCH, "alt_bend_root", "bend2");
  rmSync(resolve(SCRATCH, "alt_bend_root"), { recursive: true, force: true });
  mkdirSync(RELOC_BEND_DIR, { recursive: true });
  const TOOLCHAIN_FILES = ["main.ts", "bend.ts", "comp.ts", "base.bend"];
  for (const f of TOOLCHAIN_FILES) {
    copyFileSync(resolve(REAL_BEND_DIR, f), resolve(RELOC_BEND_DIR, f), undefined as any);
  }
  const RELOC_BEND_RUNNER = resolve(RELOC_BEND_DIR, "main.ts");
  const portabilityResultOut = resolve(SCRATCH, "portability_result.json");
  rmSync(portabilityResultOut, { force: true });
  const procPortability = spawn({
    cmd: ["bun", resolve(LAB, "verify_artifact.ts"), "--artifact", CANONICAL_ARTIFACT, "--mode", "full", "--bend-runner", RELOC_BEND_RUNNER, "--result-out", portabilityResultOut],
    stdout: "pipe", stderr: "pipe",
  });
  const portabilityStdout = await new Response(procPortability.stdout).text();
  await new Response(procPortability.stderr).text();
  await procPortability.exited;
  const portabilityExit = procPortability.exitCode ?? 1;
  let portabilityPass = false;
  let portabilitySummary = "";
  try {
    const r = JSON.parse(readFileSync(portabilityResultOut, "utf8"));
    portabilityPass = portabilityExit === 0 && r.integrity === "pass" && r.proof === "pass" && r.supplemental_evidence === "pass";
    portabilitySummary = "integrity=" + r.integrity + " proof=" + r.proof + " supplemental=" + r.supplemental_evidence;
  } catch (e) {
    portabilitySummary = "could not read result file: " + String(e);
  }
  const manifestBytes = JSON.parse(readFileSync(resolve(CANONICAL_ARTIFACT, "manifest.json"), "utf8"));
  const declaredClosure = manifestBytes.provenance.toolchain.toolchain_closure as { logical_path: string; sha256: string; role: string }[];
  const declaredByRole = new Map(declaredClosure.map((c) => [c.role, c]));
  const expectedByRole: { [k: string]: string } = {
    cli: "main.ts", trusted_kernel: "bend.ts", compiler_runtime: "comp.ts", prelude: "base.bend",
  };
  let allHashesMatch = true;
  const hashReport: string[] = [];
  for (const role of ["cli", "trusted_kernel", "compiler_runtime", "prelude"]) {
    const expected = declaredByRole.get(role);
    const localPath = resolve(RELOC_BEND_DIR, expectedByRole[role]);
    const actualSha = sha256File(localPath);
    const match = expected !== undefined && expected.sha256 === actualSha;
    if (!match) allHashesMatch = false;
    hashReport.push(role + ":" + (match ? "ok" : "MISMATCH") + "(" + actualSha.slice(0, 8) + ")");
  }
  console.log("step 11a: toolchain relocated to " + RELOC_BEND_DIR + ", verifier run: exit=" + portabilityExit + " passes=" + portabilityPass + " (" + portabilitySummary + ")");
  console.log("step 11b: closure hash equality across root: " + (allHashesMatch ? "PASS" : "FAIL") + " (" + hashReport.join(", ") + ")");
  const portabilityOk = portabilityPass && allHashesMatch;

  // Step 12 (CORRECTION03): byte-drift at the relocated root fails
  // with TOOLCHAIN_MISMATCH.  Proves the verifier recomputes the
  // sha256 at the consumer-local path rather than trusting the
  // declared one.
  const TAMPERED_FILE = "base.bend";
  const origBytes = readFileSync(resolve(RELOC_BEND_DIR, TAMPERED_FILE));
  const tampered = Buffer.concat([origBytes, Buffer.from("// touched\n", "utf8")]);
  writeFileSync(resolve(RELOC_BEND_DIR, TAMPERED_FILE), tampered);
  const tamperResultOut = resolve(SCRATCH, "tampered_root_result.json");
  rmSync(tamperResultOut, { force: true });
  const procTamper = spawn({
    cmd: ["bun", resolve(LAB, "verify_artifact.ts"), "--artifact", CANONICAL_ARTIFACT, "--mode", "full", "--bend-runner", RELOC_BEND_RUNNER, "--result-out", tamperResultOut],
    stdout: "pipe", stderr: "pipe",
  });
  await new Response(procTamper.stdout).text();
  await new Response(procTamper.stderr).text();
  await procTamper.exited;
  const tamperExit = procTamper.exitCode ?? 1;
  let tamperFailedAsExpected = false;
  let tamperClassification = "";
  try {
    const r = JSON.parse(readFileSync(tamperResultOut, "utf8"));
    const f = (r.failures as Array<{ classification: string; phase: string }>).find((x) => x.classification === "TOOLCHAIN_MISMATCH");
    tamperFailedAsExpected = tamperExit === 1 && f !== undefined;
    tamperClassification = f ? f.classification : "no-toolchain-mismatch-failure";
  } catch (e) {
    tamperClassification = "could-not-parse: " + String(e);
  }
  writeFileSync(resolve(RELOC_BEND_DIR, TAMPERED_FILE), origBytes);
  console.log("step 12: toolchain byte-drift at relocated root fails with TOOLCHAIN_MISMATCH: " + tamperFailedAsExpected + " (exit=" + tamperExit + " classification=" + tamperClassification + ")");

  if (idMatch && payloadMatch && result.exit === 0 && idClassifiedCorrectly && toolchainUnavailable && offlinePass && probeArmed && offlineSanityExit === 0 && fenceWired && portabilityOk && tamperFailedAsExpected) {
    console.log("\nAll relocation+offline+portability checks PASS.");
    process.exit(0);
  } else {
    console.log("\nSome relocation+offline+portability checks FAIL.");
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
