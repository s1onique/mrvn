#!/usr/bin/env bun
// ACT-MRVN-04 mutation classifier (CORRECTION03).
//
// Hardening vs CORRECTION02:
//   * Exit code is now the expected-vs-observed contract:
//       - AUTHORITY_BINDING_FAILURE > 0  -> exit 1
//       - expected_mismatch > 0          -> exit 1
//       - UNRESOLVED > 0 and no expected_class is "UNRESOLVED" -> exit 1
//       - otherwise                       -> exit 0
//   * Import-graph scan is now recursive (BFS) with cycle detection and
//     a visited-set keyed by absolute path.  This closes the
//     EQUIV.bend -> helper.bend -> tampered/LAWS.bend attack vector.
//   * Absolute-path import resolution now retains /absolute/path form
//     instead of relativising it to REPO.
//
// Retained from CORRECTION02:
//   * LAWS.bend / PROOF.bend SHA256 binding is an enforced precondition.
//   * REPROOF/EQUIV/COUNTEREXAMPLE imports are bound to canonical LAWS.bend
//     or the per-mutation mutated main.
//   * Fail-closed: PROOF fail + no positive artifact -> UNRESOLVED.
//
// Retained from CORRECTION01:
//   * No oracle contamination.  Full byte bindings in every result.

import { spawn } from "bun";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, basename, dirname, isAbsolute } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const QUALIFY = resolve(ROOT, "..");
const FACTORY = resolve(QUALIFY, "..");
const REPO = resolve(FACTORY, "..");
const BEND = resolve(REPO, "bend2/main.ts");

interface Mutation {
  id: string;
  description: string;
  expected_class?: string;
  counterexample_input: any | null;
}

interface Cases {
  law_book: string;
  canonical_proof: string;
  canonical_impl: string;
  mutations: Mutation[];
}

function sha256File(path: string): string | null {
  try {
    return createHash("sha256").update(readFileSync(path)).digest("hex");
  } catch {
    return null;
  }
}

function fileExists(path: string): boolean {
  try { readFileSync(path); return true; } catch { return false; }
}

function certBool(out: string): boolean | null {
  const m = out.match(/\b(True|False)\{\}/);
  return m ? m[1] === "True" : null;
}

interface ArtifactResult {
  file: string;
  present: boolean;
  ok: boolean;
  exit: number;
  sha256: string | null;
  cert: boolean | null;
}

async function runArtifact(p: string): Promise<ArtifactResult> {
  const present = fileExists(p);
  if (!present) {
    return { file: basename(p), present: false, ok: false, exit: 127, sha256: null, cert: null };
  }
  const proc = spawn({ cmd: ["bun", BEND, p], stdout: "pipe", stderr: "pipe", cwd: REPO });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  await proc.exitCode;
  await proc.exited;
  return {
    file: basename(p),
    present: true,
    ok: proc.exitCode === 0,
    exit: proc.exitCode ?? 1,
    sha256: sha256File(p),
    cert: certBool((out + err).trim()),
  };
}

// CORRECTION03: recursive import-graph scanner with cycle detection.
//
// Bend supports imports of the form:
//   import ./relative/path
//   import /absolute/path
//   import pkg/hash          (content-addressed; out of scope here)
//
// We only inspect filesystem imports.  For each .bend file we encounter
// we hash it and inspect its own imports.  Cycles are broken by the
// visited set.  Paths are normalised to absolute form so the
// certificate source itself and every transitive dependency end up in
// the same visited set.
function importedBendFiles(sourcePath: string): string[] {
  if (!fileExists(sourcePath)) return [];
  const text = readFileSync(sourcePath, "utf-8");
  const dir = dirname(sourcePath);
  const out: string[] = [];
  // Match either ./foo or /abs/path following `import`.
  // We deliberately do NOT match `import Base` (no path) and
  // `import pkg/...` (content-addressed).
  for (const m of text.matchAll(/^\s*import\s+(\.{1,2}\/[^\s]+|\/[^\s]+)\b/gm)) {
    const raw = m[1];
    let resolved: string;
    if (isAbsolute(raw)) {
      // CORRECTION03: retain absolute-path form, do NOT relativise to REPO.
      resolved = raw;
    } else {
      resolved = resolve(dir, raw);
    }
    if (!resolved.endsWith(".bend")) resolved = resolved + ".bend";
    out.push(resolved);
  }
  return out;
}

// Recursive BFS over the .bend import graph starting from a list of
// entry-point files.  Returns the absolute paths of every reachable
// .bend file in DFS-stable order.
function reachBendFiles(roots: string[]): string[] {
  const visited = new Set<string>();
  const order: string[] = [];
  const stack: string[] = [];
  for (const r of roots) {
    const abs = resolve(r);
    if (!visited.has(abs)) { visited.add(abs); stack.push(abs); }
  }
  while (stack.length > 0) {
    const cur = stack.pop()!;
    order.push(cur);
    for (const child of importedBendFiles(cur)) {
      if (!visited.has(child)) { visited.add(child); stack.push(child); }
    }
  }
  return order;
}

function hashImportedLaws(importedFiles: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const f of importedFiles) {
    const h = sha256File(f);
    if (h) result[f] = h;
  }
  return result;
}

function classify(
  proof: ArtifactResult,
  reproof: ArtifactResult | null,
  counterexample: ArtifactResult | null,
  equivalence: ArtifactResult | null
): { classification: string; rationale: string[] } {
  if (proof.ok) {
    if (equivalence && equivalence.cert === false)
      return { classification: "SURVIVED/NON_EQUIVALENT", rationale: ["proof PASS", "EQUIV False"] };
    if (equivalence && equivalence.cert === true)
      return { classification: "SURVIVED/EQUIVALENT", rationale: ["proof PASS", "EQUIV True"] };
    return { classification: "UNRESOLVED", rationale: ["proof PASS, no EQUIV"] };
  }
  if (reproof && reproof.ok)
    return { classification: "PROOF_TERM_INVALIDATED", rationale: ["proof FAIL", "REPROOF PASS"] };
  if (counterexample && counterexample.cert === true)
    return { classification: "LAW_REFUTED", rationale: ["proof FAIL", "COUNTEREXAMPLE True"] };
  return { classification: "UNRESOLVED", rationale: ["proof FAIL, no positive artifact"] };
}

interface CertImportCheck {
  root: string;
  reachable: string[];
  failures: string[];
  hashes: Record<string, string>;
}

function checkCertImports(
  rootFile: string,
  lawBookSha: string,
  canonicalImplSha: string,
  mutatedMainSha: string | null
): CertImportCheck {
  const reachable = reachBendFiles([rootFile]);
  const hashes = hashImportedLaws(reachable);
  const failures: string[] = [];
  for (const [path, h] of Object.entries(hashes)) {
    const base = basename(path);
    // Match any file whose basename is exactly `LAWS.bend` or ends with
    // `LAWS.bend` (e.g. `TAMPERED_LAWS.bend`, `EVIL_LAWS.bend`).  These
    // are all candidate law books; each must match the canonical sha.
    if ((base === "LAWS.bend" || base.endsWith("LAWS.bend")) && h !== lawBookSha) {
      failures.push(`${basename(rootFile)} transitively imports ${path} with sha ${h} (expected canonical LAWS.bend sha ${lawBookSha})`);
    }
    if (base === "main.bend" && h !== canonicalImplSha && h !== mutatedMainSha) {
      failures.push(`${basename(rootFile)} transitively imports ${path} with sha ${h} (expected canonical ${canonicalImplSha} or mutated ${mutatedMainSha ?? "(none)"})`);
    }
  }
  return { root: rootFile, reachable, failures, hashes };
}

async function main() {
  const casesPath = resolve(ROOT, "lab/cases.json");
  const cases: Cases = JSON.parse(readFileSync(casesPath, "utf-8"));

  const lawBookPath = resolve(REPO, cases.law_book);
  const canonicalProofPath = resolve(REPO, cases.canonical_proof);
  const canonicalImplPath = resolve(REPO, cases.canonical_impl);
  const lawBookSha = sha256File(lawBookPath);
  const canonicalProofSha = sha256File(canonicalProofPath);
  const canonicalImplSha = sha256File(canonicalImplPath);
  if (!lawBookSha || !canonicalProofSha || !canonicalImplSha) {
    throw new Error("Could not hash canonical artifacts");
  }

  // If any mutation expects UNRESOLVED, an unexpected-UNRESOLVED exit is
  // suppressed: UNRESOLVED becomes an acceptable classification.  This
  // mirrors Bend's own gate semantics: `bend PROOF.bend` fails unless
  // its required claims are discharged, but a verifier can declare
  // that UNRESOLVED is acceptable.
  const anyExpectedUnresolved = cases.mutations.some((m) => m.expected_class === "UNRESOLVED");

  // CORRECTION03: support --include-binding-tests to opt into negative
  // binding fixtures (e.g. MUT-MRVN04-NESTED).  Without that flag the
  // canonical run is the green, expected-vs-observed-correct contract;
  // with the flag, negative tests are run and the gate is expected to
  // fail.  See verify_nested_test.ts for the negative invocation.
  const includeBindingTests = process.argv.includes("--include-binding-tests");
  const activeMutations = includeBindingTests
    ? cases.mutations
    : cases.mutations.filter((m) => m.id !== "MUT-MRVN04-NESTED");

  let authoritativeBindingFailures = 0;
  let expectedMismatchCount = 0;
  let unexpectedUnresolvedCount = 0;

  const results: any[] = [];
  for (const m of activeMutations) {
    const mutDir = resolve(REPO, `factory/qualify/ACT-MRVN-QUALIFY04/mutations/${m.id}`);
    const mainSha = sha256File(resolve(mutDir, "main.bend"));

    const mutLawsPath = resolve(mutDir, "LAWS.bend");
    const mutProofPath = resolve(mutDir, "PROOF.bend");
    const mutLawsSha = sha256File(mutLawsPath);
    const mutProofSha = sha256File(mutProofPath);
    const lawsMatchCanonical = mutLawsSha === lawBookSha;
    const proofMatchCanonical = mutProofSha === canonicalProofSha;

    const bindingFailure: string[] = [];
    if (!lawsMatchCanonical) {
      bindingFailure.push(`LAWS.bend sha mismatch (got ${mutLawsSha ?? "(missing)"}, expected ${lawBookSha})`);
    }
    if (!proofMatchCanonical) {
      bindingFailure.push(`PROOF.bend sha mismatch (got ${mutProofSha ?? "(missing)"}, expected ${canonicalProofSha})`);
    }

    // CORRECTION03: use the recursive reachability scanner.
    const checkCert = (file: string) =>
      checkCertImports(resolve(mutDir, file), lawBookSha, canonicalImplSha, mainSha);

    const proof = await runArtifact(mutProofPath);
    const reproof = fileExists(resolve(mutDir, "REPROOF.bend"))
      ? await runArtifact(resolve(mutDir, "REPROOF.bend"))
      : null;
    const counterexample = fileExists(resolve(mutDir, "COUNTEREXAMPLE.bend"))
      ? await runArtifact(resolve(mutDir, "COUNTEREXAMPLE.bend"))
      : null;
    const equivalence = fileExists(resolve(mutDir, "EQUIV.bend"))
      ? await runArtifact(resolve(mutDir, "EQUIV.bend"))
      : null;

    const reproofCheck = reproof ? checkCert("REPROOF.bend") : null;
    const counterCheck = counterexample ? checkCert("COUNTEREXAMPLE.bend") : null;
    const equivCheck = equivalence ? checkCert("EQUIV.bend") : null;

    const allImportFailures = [
      ...(reproofCheck?.failures ?? []),
      ...(counterCheck?.failures ?? []),
      ...(equivCheck?.failures ?? []),
    ];

    let classification: string;
    let rationale: string[];
    if (bindingFailure.length > 0 || allImportFailures.length > 0) {
      classification = "AUTHORITY_BINDING_FAILURE";
      rationale = [...bindingFailure, ...allImportFailures];
      authoritativeBindingFailures++;
    } else {
      const c = classify(proof, reproof, counterexample, equivalence);
      classification = c.classification;
      rationale = c.rationale;
    }

    const observedMatch = m.expected_class ? classification === m.expected_class : null;
    if (observedMatch === false) expectedMismatchCount++;
    if (classification === "UNRESOLVED" && m.expected_class !== "UNRESOLVED") {
      unexpectedUnresolvedCount++;
    }

    results.push({
      id: m.id,
      description: m.description,
      observed_class: classification,
      expected_class: m.expected_class ?? null,
      observed_matches_expected: observedMatch,
      rationale,
      byte_bindings: {
        law_book_sha256: lawBookSha,
        canonical_proof_sha256: canonicalProofSha,
        canonical_impl_sha256: canonicalImplSha,
        mutated_main_sha256: mainSha,
        mutated_laws_sha256: mutLawsSha,
        mutated_proof_sha256: mutProofSha,
        laws_match_canonical: lawsMatchCanonical,
        proof_match_canonical: proofMatchCanonical,
        proof_sha256: proof.sha256,
        reproof_sha256: reproof?.sha256 ?? null,
        counterexample_sha256: counterexample?.sha256 ?? null,
        equivalence_sha256: equivalence?.sha256 ?? null,
      },
      import_graphs: {
        reproof: reproofCheck
          ? { root: reproofCheck.root, reachable: reproofCheck.reachable, hashes: reproofCheck.hashes, failures: reproofCheck.failures }
          : null,
        counterexample: counterCheck
          ? { root: counterCheck.root, reachable: counterCheck.reachable, hashes: counterCheck.hashes, failures: counterCheck.failures }
          : null,
        equivalence: equivCheck
          ? { root: equivCheck.root, reachable: equivCheck.reachable, hashes: equivCheck.hashes, failures: equivCheck.failures }
          : null,
      },
      artifacts: {
        proof: { present: proof.present, ok: proof.ok, exit: proof.exit },
        reproof: reproof ? { present: reproof.present, ok: reproof.ok, exit: reproof.exit } : null,
        counterexample: counterexample
          ? { present: counterexample.present, ok: counterexample.ok, exit: counterexample.exit, emitted_bool: counterexample.cert }
          : null,
        equivalence: equivalence
          ? { present: equivalence.present, ok: equivalence.ok, exit: equivalence.exit, emitted_bool: equivalence.cert }
          : null,
      },
    });
  }

  const summary = {
    act: "ACT-MRVN-QUALIFY04-CORRECTION03",
    timestamp: new Date().toISOString(),
    law_book_sha256: lawBookSha,
    canonical_proof_sha256: canonicalProofSha,
    canonical_impl_sha256: canonicalImplSha,
    toolchain: {
      bend_runner: BEND,
      bend_runner_sha256: sha256File(BEND),
    },
    gate_contract: {
      exit_1_if_any_of: [
        "AUTHORITY_BINDING_FAILURE > 0",
        "expected_mismatch > 0",
        "UNRESOLVED > 0 and no mutation has expected_class=UNRESOLVED",
      ],
      any_expected_unresolved: anyExpectedUnresolved,
    },
    counts: {
      SURVIVED_EQUIVALENT: results.filter((r) => r.observed_class === "SURVIVED/EQUIVALENT").length,
      SURVIVED_NON_EQUIVALENT: results.filter((r) => r.observed_class === "SURVIVED/NON_EQUIVALENT").length,
      PROOF_TERM_INVALIDATED: results.filter((r) => r.observed_class === "PROOF_TERM_INVALIDATED").length,
      LAW_REFUTED: results.filter((r) => r.observed_class === "LAW_REFUTED").length,
      UNRESOLVED: results.filter((r) => r.observed_class === "UNRESOLVED").length,
      AUTHORITY_BINDING_FAILURE: results.filter((r) => r.observed_class === "AUTHORITY_BINDING_FAILURE").length,
      expected_match: results.filter((r) => r.observed_matches_expected === true).length,
      expected_mismatch: results.filter((r) => r.observed_matches_expected === false).length,
      unexpected_unresolved: unexpectedUnresolvedCount,
    },
    results,
  };

  const outPath = resolve(ROOT, "lab/results.json");
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log("=== ACT-MRVN-QUALIFY04-CORRECTION03 Mutation Classifier ===");
  console.log(`Output: ${outPath}`);
  console.log("");
  console.log("Law book sha256:    ", lawBookSha);
  console.log("Canonical proof sha:", canonicalProofSha);
  console.log("");
  console.log("ID              | Observed                  | Expected               | Match");
  console.log("----------------|---------------------------|------------------------|------");
  for (const r of results) {
    console.log(
      `${r.id.padEnd(15)} | ${r.observed_class.padEnd(25)} | ${(r.expected_class ?? "(none)").padEnd(22)} | ${
        r.observed_matches_expected === null ? "  - " : r.observed_matches_expected ? "YES" : "NO"
      }`
    );
  }
  console.log("");
  console.log("Counts:", JSON.stringify(summary.counts, null, 2));
  console.log("");
  console.log("Gate contract:", JSON.stringify(summary.gate_contract, null, 2));
  console.log("");

  // CORRECTION03: fail-closed on the expected-vs-observed contract.
  const failures: string[] = [];
  if (authoritativeBindingFailures > 0) {
    failures.push(`AUTHORITY_BINDING_FAILURE: ${authoritativeBindingFailures} mutant(s) failed hash binding precondition.`);
  }
  if (expectedMismatchCount > 0) {
    failures.push(`EXPECTED_MISMATCH: ${expectedMismatchCount} mutant(s) classified differently than expected.`);
  }
  if (unexpectedUnresolvedCount > 0 && !anyExpectedUnresolved) {
    failures.push(`UNEXPECTED_UNRESOLVED: ${unexpectedUnresolvedCount} mutant(s) classified UNRESOLVED but no mutation expects UNRESOLVED.`);
  }
  if (failures.length > 0) {
    for (const f of failures) console.error(f);
    console.error("");
    console.error(`MRVN-04 qualification FAILED: ${failures.length} gate(s) failed.`);
    process.exit(1);
  }
  console.log("MRVN-04 qualification PASS: 0 gates failed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
