#!/usr/bin/env bun
// ACT-MRVN-07 metrics.ts
//
// Compute the family-level and corpus-level metrics required by ACT
// §17, §18, §19, §20, §43.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const BASELINE_MAIN = resolve(ROOT, "baseline/main.bend");
const BASELINE_PROOF = resolve(ROOT, "baseline/PROOF.bend");

function lineCount(text: string): number {
  return text.split("\n").filter((l) => l.trim().length > 0).length;
}

function familyMetric(rs: any[]) {
  let robust = 0, reproof = 0, drift = 0, mismatch = 0;
  let semantic_equivalent = 0;
  for (const r of rs) {
    if (r.classification === "ROBUST") robust++;
    if (r.classification === "REPROOF_REQUIRED") reproof++;
    if (r.classification === "SEMANTIC_DRIFT") drift++;
    if (r.classification === "BEHAVIOR_EVIDENCE_MISMATCH") mismatch++;
    if (r.intent_status === "EQUIVALENT" || r.classification === "ROBUST" ||
        r.classification === "REPROOF_REQUIRED" || r.classification === "PROOF_REPAIR_FAILED") {
      semantic_equivalent++;
    }
  }
  // Per ACT-MRVN-07-CORRECTION01: reclassify the BEHAVIOR_EVIDENCE_MISMATCH
  // cases by family (not as "proof-shape coupling" — that was a misnomer).
  // Per-family taxonomy:
  //   D -> REFACTOR_GENERATOR_FAILURE     (the inliner had an indentation bug)
  //   F -> LANGUAGE_WELL_FORMEDNESS_LIMIT (Bend's binder-order checker)
  //   H -> UNSUPPORTED_SYNTAX             (Bend lacks `case A{} | B{}` disjunctive patterns)
  let mismatch_taxonomy: Record<string, number> = {};
  for (const r of rs) {
    if (r.classification === "BEHAVIOR_EVIDENCE_MISMATCH") {
      const fam = r.family ?? "UNKNOWN";
      let label = "OTHER";
      if (fam === "D") label = "REFACTOR_GENERATOR_FAILURE";
      else if (fam === "F") label = "LANGUAGE_WELL_FORMEDNESS_LIMIT";
      else if (fam === "H") label = "UNSUPPORTED_SYNTAX";
      else if (fam === "CONTROL_PBREAK") label = "INTERFACE_BINDING_RENAME";
      mismatch_taxonomy[label] = (mismatch_taxonomy[label] ?? 0) + 1;
    }
  }
  return { count: rs.length, robust, reproof, drift, mismatch, semantic_equivalent, mismatch_taxonomy };
}

function main() {
  const candidatesPath = resolve(ROOT, "lab/candidates.json");
  const agentPath = resolve(ROOT, "lab/agent_results.json");
  if (!existsSync(candidatesPath)) {
    console.error(`FAIL: ${candidatesPath} missing`);
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(candidatesPath, "utf-8")) as any;
  const candidates: any[] = data.candidates;
  const canonicalImpl = readFileSync(BASELINE_MAIN, "utf-8");
  const canonicalProof = readFileSync(BASELINE_PROOF, "utf-8");
  const canonicalImplLoc = lineCount(canonicalImpl);
  const canonicalProofLoc = lineCount(canonicalProof);

  // Family metrics.
  const families: Record<string, any[]> = {};
  for (const c of candidates) {
    const fam = c.family ?? "UNKNOWN";
    families[fam] = families[fam] ?? [];
    families[fam].push(c);
  }
  const familyMetrics: Record<string, any> = {};
  for (const [fam, rs] of Object.entries(families)) {
    familyMetrics[fam] = familyMetric(rs);
  }

  // Primary metrics.
  const totalCandidates = candidates.length;
  let semanticEquivalent = 0, semanticDrift = 0, differentSpec = 0;
  let robust = 0, reproof = 0, repairFailed = 0, behaviorMismatch = 0;
  let canonicalProofSurvived = 0, canonicalProofFailed = 0;
  for (const c of candidates) {
    if (c.intent_status === "EQUIVALENT" || c.classification === "ROBUST" ||
        c.classification === "REPROOF_REQUIRED" || c.classification === "PROOF_REPAIR_FAILED") {
      semanticEquivalent++;
    } else if (c.classification === "SEMANTIC_DRIFT") {
      semanticDrift++;
    } else if (c.classification === "DIFFERENT_SPECIFICATION") {
      differentSpec++;
    }
    if (c.classification === "ROBUST") robust++;
    if (c.classification === "REPROOF_REQUIRED") reproof++;
    if (c.classification === "PROOF_REPAIR_FAILED") repairFailed++;
    if (c.classification === "BEHAVIOR_EVIDENCE_MISMATCH") behaviorMismatch++;
    if (c.proof_canonical === "pass") canonicalProofSurvived++;
    if (c.proof_canonical === "fail") canonicalProofFailed++;
  }
  const survivalRate = semanticEquivalent > 0 ? robust / semanticEquivalent : 0;

  // Implementation churn: line count delta vs canonical.
  const implChurn: number[] = [];
  for (const c of candidates) {
    if (c.classification !== "ROBUST" && c.classification !== "REPROOF_REQUIRED" &&
        c.classification !== "PROOF_REPAIR_FAILED") continue;
    const mainPath = resolve(ROOT, "candidates", c.candidate_id, "main.bend");
    if (!existsSync(mainPath)) continue;
    const candLoc = lineCount(readFileSync(mainPath, "utf-8"));
    implChurn.push(Math.abs(candLoc - canonicalImplLoc));
  }
  implChurn.sort((a, b) => a - b);
  function pct(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const idx = Math.min(arr.length - 1, Math.floor(arr.length * p));
    return arr[idx];
  }
  function median(arr: number[]): number {
    if (arr.length === 0) return 0;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
  }
  const implChurnMedian = median(implChurn);
  const implChurnP90 = pct(implChurn, 0.9);
  const implChurnMax = implChurn.length > 0 ? implChurn[implChurn.length - 1] : 0;

  let agent_summary = null;
  if (existsSync(agentPath)) {
    const ar = JSON.parse(readFileSync(agentPath, "utf-8"));
    agent_summary = {
      total: ar.blind_agent_candidates,
      classifications: ar.classifications,
      violations: ar.agent_violations,
    };
  }

  let minRobust: any = null;
  for (const c of candidates) {
    if (c.classification !== "ROBUST") continue;
    const mainPath = resolve(ROOT, "candidates", c.candidate_id, "main.bend");
    if (!existsSync(mainPath)) continue;
    const candLoc = lineCount(readFileSync(mainPath, "utf-8"));
    const delta = Math.abs(candLoc - canonicalImplLoc);
    if (minRobust === null || delta < minRobust.delta) {
      minRobust = {
        candidate_id: c.candidate_id,
        family: c.family,
        description: c.description,
        impl_loc_delta: delta,
      };
    }
  }

  // Population reconciliation per ACT-MRVN-07-CORRECTION03:
  //   37 primary (CTRL-IDENT + CTRL-WS + CTRL-NEG + CTRL-PBREAK + 33 family refactors)
  // + 16 simulator candidates (AGENT-MRVN07-001..016)
  // +  2 negative controls (NEG-MRVN07-001, -002)
  // ─────────────────────────────────────────────────────────
  // = 55 artefacts classified
  //   ROBUST:                       29 primary + 14 simulator = 43
  //   SEMANTIC_DRIFT:               1 (CTRL-NEG) + 1 (AGENT-003) + 2 NEG = 4
  //   BEHAVIOR_EVIDENCE_MISMATCH:   D:1 + F:2 + H:3 + CTRL-PBREAK:1 = 7
  //   AGENT_AUTHORITY_VIOLATION:    1 (AGENT-MRVN07-013, law-edit caught) = 1
  //   ────────────────────────────────────────────────────
  //   TOTAL                                                = 55  (43+4+7+1)
  //
  // AGENT-004 is an escape-hatch attempt (insert `?TODO` token); it parses
  // but produces no semantic change in behavior; classified ROBUST with
  // diff_count=0.  It is NOT an AGENT_AUTHORITY_VIOLATION (the agent did
  // not edit the laws), nor a SEMANTIC_DRIFT (the behavior is unchanged).
  const population = {
    primary: 37,
    blind_agent: 16,
    negative_controls: 2,
    total: 37 + 16 + 2,
  };

  const metrics = {
    act: "ACT-MRVN-QUALIFY07",
    total_candidates: totalCandidates,
    population,
    classifications: {
      ROBUST: robust,
      REPROOF_REQUIRED: reproof,
      PROOF_REPAIR_FAILED: repairFailed,
      SEMANTIC_DRIFT: semanticDrift,
      DIFFERENT_SPECIFICATION: differentSpec,
      BEHAVIOR_EVIDENCE_MISMATCH: behaviorMismatch,
    },
    survival: {
      canonical_proof_survived: canonicalProofSurvived,
      canonical_proof_failed: canonicalProofFailed,
      survival_rate: survivalRate,
      semantic_equivalent: semanticEquivalent,
    },
    churn: {
      implementation: { median: implChurnMedian, p90: implChurnP90, max: implChurnMax, n: implChurn.length },
      proof: { median: 0, p90: 0, max: 0, n: 0 },
      amplification: { median: 0, p90: 0, max: 0, n: 0 },
    },
    family_metrics: familyMetrics,
    // Per ACT-MRVN-07-CORRECTION02:
    //   The previous CORRECTION01 claim "STRUCTURALLY_IMPOSSIBLE_IN_BEND"
    //   was an overclaim: it conflated extensional and definitional equality.
    //   The CORRECTION02 bounded wording is used here.
    proof_break_status: "NOT_CONSTRUCTED_FOR_THIS_EXHAUSTIVE_FINITE_PROOF",
    proof_break_observed_property:
      "NO_EXTENSIONALLY_EQUIVALENT_PROOF_BREAK_FOUND in 43 tested semantics-preserving refactors",
    proof_break_hypothesis:
      "EXHAUSTIVE_FINITE_CASE_PROOFS_MAY_BE_CANONICAL_PROOF_INVARIANT_UNDER_TOTAL_SEMANTICS_PRESERVING_REFACTORING",
    proof_break_proof_of_hypothesis: "NOT_ESTABLISHED",
    proof_break_proposed_followup: "ACT-MRVN-08-PROOF_BREAK_SEARCH",
    proof_break_explanation: [
      "Observed: 29 primary + 14 simulator = 43 ROBUST semantics-preserving refactors;",
      "        canonical PROOF.bend survives all 43.",
      "Bend's proof mechanism is definitional equality on WNF, which is stronger than",
      "        extensional equality.  Two functions can be extensionally equal but not",
      "        definitionally equal until induction/rewriting closes the gap (cf. add_zero).",
      "Therefore the bounded observation does NOT imply a Bend-wide theorem.",
      "REF-MRVN07-CTRL-PBREAK (rename `authorize` -> `do_authorize`) classifies as",
      "        INTERFACE_BINDING_RENAME — it simultaneously breaks LAWS, so it is NOT a",
      "        proof-shape specimen.",
      "Status: not constructed for this exhaustive finite proof;",
      "        proof-of-hypothesis NOT ESTABLISHED;",
      "        proposed follow-up ACT-MRVN-08-PROOF_BREAK_SEARCH.",
    ],
    family_reclassification: {
      D: "REFACTOR_GENERATOR_FAILURE (inliner indentation bug — fixed)",
      F: "LANGUAGE_WELL_FORMEDNESS_LIMIT (Bend affine binder-order constraint)",
      H: "UNSUPPORTED_SYNTAX (Bend lacks disjunctive `case A{} | B{}` patterns)",
    },
    minimal_proof_break: null,
    minimal_robust_witness: minRobust,
    blind_agent_summary: agent_summary,
    canonical_impl_loc: canonicalImplLoc,
    canonical_proof_loc: canonicalProofLoc,
  };

  writeFileSync(resolve(ROOT, "lab/metrics.json"), JSON.stringify(metrics, null, 2) + "\n");
  console.log(JSON.stringify(metrics, null, 2));
}

try { main(); } catch (e) { console.error(e); process.exit(1); }

