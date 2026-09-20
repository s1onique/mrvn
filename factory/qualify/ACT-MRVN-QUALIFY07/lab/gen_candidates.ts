#!/usr/bin/env bun
// ACT-MRVN-07 gen_candidates.ts
//
// Generate the full refactor corpus: descriptors + apply each refactor
// + classify each candidate.  Writes lab/results.json (aggregate
// classification results).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "bun";

const ROOT = resolve(import.meta.dir, "..");
const REPO = resolve(ROOT, "..", "..", "..");
const BEND = resolve(REPO, "bend2/main.ts");
const CANDIDATES_ROOT = resolve(ROOT, "candidates");
const ORACLE = resolve(ROOT, "baseline/oracle.json");
const CANONICAL_KERNEL = resolve(ROOT, "baseline");

interface Descriptor {
  candidate_id: string;
  family: string;
  description: string;
  parameters: any;
}

async function run(cmd: string[]): Promise<{ exit: number; out: string; err: string }> {
  const proc = spawn({ cmd, stdout: "pipe", stderr: "pipe" });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  await proc.exited;
  return { exit: proc.exitCode ?? 1, out, err };
}

function genDescriptors(): Descriptor[] {
  const descs: Descriptor[] = [];
  descs.push({
    candidate_id: "REF-MRVN07-CTRL-IDENT",
    family: "CONTROL",
    description: "Byte-identical control.",
    parameters: {},
  });
  descs.push({
    candidate_id: "REF-MRVN07-CTRL-WS",
    family: "CONTROL",
    description: "Whitespace-only control.",
    parameters: { mode: "whitespace" },
  });
  descs.push({
    candidate_id: "REF-MRVN07-CTRL-NEG",
    family: "NEGATIVE_SEMANTIC",
    description: "Negative semantic control: must classify SEMANTIC_DRIFT.",
    parameters: {},
  });
  descs.push({
    candidate_id: "REF-MRVN07-CTRL-PBREAK",
    family: "CONTROL_PBREAK",
    description: "CONTROL-03 (interface-binding control): rename `authorize` -> `do_authorize`.  Per ACT-MRVN-07-CORRECTION02, this control demonstrates INTERFACE_BINDING_RENAME: LAWS.bend references the renamed symbol by name, so the refactor simultaneously breaks the LAWS.  It is NOT a proof-shape specimen.",
    parameters: { operation: "rename_public_symbol", from: "authorize", to: "do_authorize" },
  });

  const aPerms = [
    { name: "A01", perm: ["Reviewer", "Automation", "Agent"], fn: "work_decision" },
    { name: "A02", perm: ["Automation", "Reviewer", "Agent"], fn: "halt_decision" },
    { name: "A03", perm: ["Reviewer", "Agent", "Automation"], fn: "freeze_decision" },
    { name: "A04", perm: ["Automation", "Agent", "Reviewer"], fn: "close_decision" },
    { name: "A05", perm: ["Agent", "Automation", "Reviewer"], fn: "work_decision" },
  ];
  for (const a of aPerms) {
    descs.push({
      candidate_id: `REF-MRVN07-${a.name}`,
      family: "A",
      description: `Branch reorder: ${a.fn} actor arms ${a.perm.join(", ")}.`,
      parameters: { function: a.fn, permutation: a.perm },
    });
  }
  return descs;
}

async function main() {
  const descs = genDescriptors();

  // ---- B: catchall contract/expand ----
  descs.push({
    candidate_id: "REF-MRVN07-B01",
    family: "B",
    description: "Catchall contract: work_decision Agent Draft+Active+Halted -> case _: Allow{}.",
    parameters: { function: "work_decision", target: "contract", target_arms: ["Draft", "Active", "Halted"] },
  });
  descs.push({
    candidate_id: "REF-MRVN07-B02",
    family: "B",
    description: "Catchall contract: work_decision Reviewer Draft+Active+Halted -> case _: Allow{}.",
    parameters: { function: "work_decision", target: "contract", target_arms: ["Draft", "Active", "Halted"] },
  });
  descs.push({
    candidate_id: "REF-MRVN07-B03",
    family: "B",
    description: "Catchall contract: work_decision Automation arm Draft+Active+Halted -> case _: Deny{WrongActor} (pre-validate).",
    parameters: { function: "work_decision", target: "contract_automation_allow" },
  });
  descs.push({
    candidate_id: "REF-MRVN07-B04",
    family: "B",
    description: "Catchall contract: halt_decision evidence Replay+Live -> case _: Allow{}.",
    parameters: { function: "halt_decision", axis: "evidence", target: "contract", target_arms: ["Replay", "Live"] },
  });

  descs.push({
    candidate_id: "REF-MRVN07-C01",
    family: "C",
    description: "Extract step(...) identity wrapper.",
    parameters: { helper: "step" },
  });
  descs.push({
    candidate_id: "REF-MRVN07-D01",
    family: "D",
    description: "Inline work_decision body into authorize.",
    parameters: { function: "work_decision" },
  });
  descs.push({
    candidate_id: "REF-MRVN07-E01",
    family: "E",
    description: "Introduce authorize_wrapped(...) identity wrapper.",
    parameters: {},
  });

  descs.push({
    candidate_id: "REF-MRVN07-F01",
    family: "F",
    description: "Decompose: wrap work_decision in 'match capability: case Capability.Work{}'.",
    parameters: { function: "work_decision", mode: "decompose" },
  });
  descs.push({
    candidate_id: "REF-MRVN07-F02",
    family: "F",
    description: "Whole-value: remove 'case Capability.Work{}' wrapper.",
    parameters: { function: "work_decision", mode: "whole" },
  });
  descs.push({
    candidate_id: "REF-MRVN07-F03",
    family: "F",
    description: "Decompose+Whole round-trip on work_decision.",
    parameters: { function: "work_decision", mode: "decompose_then_whole" },
  });

  descs.push({
    candidate_id: "REF-MRVN07-G01",
    family: "G",
    description: "Add is_terminal_lc(Lifecycle) helper (def-only).",
    parameters: { helper: "is_terminal" },
  });

  descs.push({
    candidate_id: "REF-MRVN07-H01",
    family: "H",
    description: "Merge Lifecycle.Draft | Halted in work_decision.",
    parameters: { function: "work_decision", merge: ["Draft", "Halted"] },
  });
  descs.push({
    candidate_id: "REF-MRVN07-H02",
    family: "H",
    description: "Merge Lifecycle.Draft | Active in work_decision.",
    parameters: { function: "work_decision", merge: ["Draft", "Active"] },
  });
  descs.push({
    candidate_id: "REF-MRVN07-H03",
    family: "H",
    description: "Merge Lifecycle.Active | Halted in freeze_decision Agent arm (both WrongActor).",
    parameters: { function: "freeze_decision", merge: ["Active", "Halted"] },
  });

  descs.push({
    candidate_id: "REF-MRVN07-I01",
    family: "I",
    description: "Rename authorize -> step; reintroduce authorize as wrapper.",
    parameters: {},
  });
  descs.push({
    candidate_id: "REF-MRVN07-J01",
    family: "J",
    description: "Swap order: close_decision before work_decision.",
    parameters: { swap_order: ["work_decision", "close_decision"] },
  });
  descs.push({
    candidate_id: "REF-MRVN07-J02",
    family: "J",
    description: "Swap order: halt_decision before work_decision.",
    parameters: { swap_order: ["work_decision", "halt_decision"] },
  });

  // Additional A: actor permutations across freeze/close.
  descs.push({
    candidate_id: "REF-MRVN07-A06",
    family: "A",
    description: "Branch reorder: freeze_decision actor arms Agent, Reviewer, Automation.",
    parameters: { function: "freeze_decision", permutation: ["Agent", "Reviewer", "Automation"] },
  });
  descs.push({
    candidate_id: "REF-MRVN07-A07",
    family: "A",
    description: "Branch reorder: close_decision actor arms Agent, Reviewer, Automation.",
    parameters: { function: "close_decision", permutation: ["Agent", "Reviewer", "Automation"] },
  });

  // Additional C: helper extraction variants.
  descs.push({
    candidate_id: "REF-MRVN07-C02",
    family: "C",
    description: "C-extract: introduce a redundant def call site that wraps authorize(...) (no behavior change).",
    parameters: { helper: "step" },
  });
  descs.push({
    candidate_id: "REF-MRVN07-C03",
    family: "C",
    description: "C-extract: introduce a wrapper that uses a different parameter name ordering (semantics identical).",
    parameters: { helper: "step", reorder_args: true },
  });
  descs.push({
    candidate_id: "REF-MRVN07-C04",
    family: "C",
    description: "C-extract: comment-only annotation around an unused helper (def-only, no body change).",
    parameters: { helper: "step", comment_only: true },
  });

  // Additional E: identity wrappers at different call sites.
  descs.push({
    candidate_id: "REF-MRVN07-E02",
    family: "E",
    description: "E-wrap: introduce authorize_top wrapper; main() still calls authorize() directly (def-only).",
    parameters: { wrap: "top" },
  });
  descs.push({
    candidate_id: "REF-MRVN07-E03",
    family: "E",
    description: "E-wrap: two-level wrapper chain authorize->authorize_v2->authorize.",
    parameters: { wrap: "chain" },
  });

  // Additional G: factored predicates (def-only).
  descs.push({
    candidate_id: "REF-MRVN07-G02",
    family: "G",
    description: "G-factor: add is_reviewer_actor(Actor) predicate helper (def-only).",
    parameters: { helper: "is_reviewer_actor" },
  });
  descs.push({
    candidate_id: "REF-MRVN07-G03",
    family: "G",
    description: "G-factor: add is_live_evidence(Evidence) predicate helper (def-only).",
    parameters: { helper: "is_live_evidence" },
  });

  // Additional I: rename variants.
  descs.push({
    candidate_id: "REF-MRVN07-I02",
    family: "I",
    description: "I-rename: rename work_decision -> compute_work (preserve semantics).",
    parameters: { rename: ["work_decision", "compute_work"] },
  });

  // Additional B: contract halt_decision lifecycle Draft+Frozen (both WrongLifecycle in Agent arm).
  descs.push({
    candidate_id: "REF-MRVN07-B05",
    family: "B",
    description: "B-contract: halt_decision lifecycle Draft+Frozen (both WrongLifecycle in Agent arm).",
    parameters: { function: "halt_decision", axis: "lifecycle", target: "contract", target_arms: ["Draft", "Frozen"] },
  });

  console.log(`=== ACT-MRVN-07 corpus generation ===`);
  console.log(`candidates: ${descs.length}`);
  return descs;
}

async function orchestrate() {
  const descs = await main();

  // Write descriptors and apply each refactor.
  for (const d of descs) {
    const candDir = resolve(CANDIDATES_ROOT, d.candidate_id);
    if (!existsSync(candDir)) mkdirSync(candDir, { recursive: true });
    writeFileSync(resolve(candDir, "descriptor.json"), JSON.stringify(d, null, 2) + "\n");
    if (d.family === "NEGATIVE_SEMANTIC") continue;
    const mk = await run([
      "bun", resolve(ROOT, "lab/make_candidate.ts"),
      "--descriptor", resolve(candDir, "descriptor.json"),
    ]);
    if (mk.exit !== 0) console.error(`make_candidate failed for ${d.candidate_id}: ${mk.err}`);
  }

  // Build the negative semantic control by direct mutation.
  const ctrlDir = resolve(CANDIDATES_ROOT, "REF-MRVN07-CTRL-NEG");
  const canonicalImpl = readFileSync(resolve(CANONICAL_KERNEL, "main.bend"), "utf-8");
  const lines = canonicalImpl.split("\n");
  let cdStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^def\s+close_decision\s*\(/.test(lines[i])) { cdStart = i; break; }
  }
  let changed = false;
  for (let i = cdStart; i < lines.length; i++) {
    if (/^def\s+/.test(lines[i]) && i !== cdStart) break;
    if (/^\s+case\s+Evidence\.Replay\{\}:\s+Decision\.Deny\{DenyReason\.InsufficientEvidence\{\}\}\s*$/.test(lines[i])) {
      if (!changed) {
        lines[i] = lines[i].replace("InsufficientEvidence", "Terminal");
        changed = true;
      }
    }
  }
  if (!changed) throw new Error("could not find target line for negative control");
  writeFileSync(resolve(ctrlDir, "main.bend"), lines.join("\n"));
  writeFileSync(resolve(ctrlDir, "LAWS.bend"), readFileSync(resolve(CANONICAL_KERNEL, "LAWS.bend")));
  writeFileSync(resolve(ctrlDir, "PROOF.bend"), readFileSync(resolve(CANONICAL_KERNEL, "PROOF.bend")));

  // Pre-write candidates.json so the classifier's auto-build path can find
  // each candidate_id via build_artifact.ts --candidate <id>.
  writeFileSync(resolve(ROOT, "lab/candidates.json"), JSON.stringify({
    act: "ACT-MRVN-QUALIFY07",
    canonical_impl_sha256: "eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb",
    canonical_laws_sha256: "0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8",
    canonical_proof_sha256: "c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8",
    intent_oracle_sha256: "a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9",
    notes: ["Pre-classify stub; final classifications appended below."],
    candidates: descs.map((d) => ({
      candidate_id: d.candidate_id,
      family: d.family,
      description: d.description,
      classification: "PENDING",
    })),
  }, null, 2) + "\n");

  // Run classifier for each candidate.  Update candidates.json incrementally
  // after each classify so that subsequent build_artifact.ts --candidate calls
  // (driven by classify's auto-build path) can find the candidate.
  const candidatesJsonPath = resolve(ROOT, "lab/candidates.json");
  for (const d of descs) {
    const candDir = resolve(CANDIDATES_ROOT, d.candidate_id);
    const r = await run([
      "bun", resolve(ROOT, "lab/classify.ts"),
      "--candidate", candDir,
      "--canonical-kernel", CANONICAL_KERNEL,
      "--oracle", ORACLE,
      "--bend-runner", BEND,
      "--results-out", resolve(candDir, "result.json"),
    ]);
    console.log(`  ${d.candidate_id}: exit=${r.exit}`);
    // Append the result to candidates.json incrementally.
    if (existsSync(resolve(candDir, "result.json"))) {
      const rj = JSON.parse(readFileSync(resolve(candDir, "result.json"), "utf-8"));
      const current = JSON.parse(readFileSync(candidatesJsonPath, "utf-8"));
      const idx = current.candidates.findIndex((c: any) => c.candidate_id === d.candidate_id);
      const entry = {
        candidate_id: d.candidate_id,
        family: d.family,
        description: d.description,
        classification: rj.classification,
        intended_classification: rj.intended_classification ?? null,
        intent_status: rj.intent_status,
        diff_count: rj.behavior?.diff_count ?? -1,
        implementation_sha256: rj.implementation_sha256,
        laws_sha256: rj.laws_sha256,
        intent_sha256: rj.intent_sha256,
        proof_canonical: rj.proof?.canonical,
        proof_reproof: rj.proof?.reproof,
        canonical_sha256: rj.proof?.canonical_sha256,
        reproof_sha256: rj.proof?.reproof_sha256,
      };
      if (idx >= 0) current.candidates[idx] = entry;
      else current.candidates.push(entry);
      writeFileSync(candidatesJsonPath, JSON.stringify(current, null, 2) + "\n");
    }
  }

  // Aggregate results.json
  const summary: any = {
    act: "ACT-MRVN-QUALIFY07",
    total_candidates: descs.length,
    classifications: {},
    candidates: [],
  };
  for (const d of descs) {
    const rpath = resolve(CANDIDATES_ROOT, d.candidate_id, "result.json");
    if (!existsSync(rpath)) continue;
    const r = JSON.parse(readFileSync(rpath, "utf-8"));
    summary.classifications[r.classification] = (summary.classifications[r.classification] ?? 0) + 1;
    summary.candidates.push({
      candidate_id: d.candidate_id,
      family: d.family,
      description: d.description,
      classification: r.classification,
      intent_status: r.intent_status,
      diff_count: r.behavior.diff_count,
      implementation_sha256: r.implementation_sha256,
      proof_canonical: r.proof.canonical,
      proof_reproof: r.proof.reproof,
      canonical_sha256: r.proof.canonical_sha256,
      reproof_sha256: r.proof.reproof_sha256,
    });
  }
  writeFileSync(resolve(ROOT, "lab/results.json"), JSON.stringify(summary, null, 2) + "\n");
  // Also write lab/candidates.json as the canonical candidate registry.
  writeFileSync(resolve(ROOT, "lab/candidates.json"), JSON.stringify({
    act: "ACT-MRVN-QUALIFY07",
    canonical_impl_sha256: "eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb",
    canonical_laws_sha256: "0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8",
    canonical_proof_sha256: "c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8",
    intent_oracle_sha256: "a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9",
    notes: [
      "Every candidate uses LAWS.bend byte-identical to the canonical MRVN-04 law book.",
      "Refactor families A-J produce variants of main.bend; PROOF.bend is initially canonical.",
      "Classifications are determined by classify.ts per ACT §10.",
    ],
    candidates: summary.candidates,
  }, null, 2) + "\n");
  console.log(`\nclassifications: ${JSON.stringify(summary.classifications)}`);
}

orchestrate().catch((e) => { console.error(e); process.exit(1); });


