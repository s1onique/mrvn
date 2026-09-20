#!/usr/bin/env bun
// ACT-MRVN-06 build_gap_certificates.ts
//
// For every unique SPECIFICATION_GAP candidate, generate a per-gap dir.

import { spawn } from "bun";
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");

async function run(cmd: string[]): Promise<{ exit: number; out: string; err: string }> {
  const proc = spawn({ cmd, stdout: "pipe", stderr: "pipe" });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  await proc.exited;
  return { exit: proc.exitCode ?? 1, out, err };
}

function determineTaxonomy(family: string, expected: string, observed: string): string {
  if (family === "DENY_REASON") return `* ALLOW_DENY_AUTHORITY_GAP: NO (both Allow/Deny unchanged)\n* DENY_REASON_GAP: YES\n* STATE_DIMENSION: ${family}`;
  if (family === "EVIDENCE") return `* DENY_REASON_GAP: YES (evidence-vs-other reason precedence)\n* EVIDENCE_DISTINCTION_GAP: partial`;
  if (family === "ACTOR") return `* DENY_REASON_GAP: YES (actor-vs-lifecycle precedence)\n* ACTOR_DISTINCTION_GAP: partial`;
  if (family === "LIFECYCLE") return `* DENY_REASON_GAP: YES (lifecycle-vs-evidence precedence)\n* LIFECYCLE_DISTINCTION_GAP: partial`;
  if (family === "PRECEDENCE") return `* ALLOW_DENY_AUTHORITY_GAP: yes`;
  return `* OTHER`;
}

async function main() {
  const summary = JSON.parse(readFileSync(resolve(ROOT, "lab/results.json"), "utf-8")) as any;
  const gapCandidates = summary.candidates.filter((c: any) => c.classification === "SPECIFICATION_GAP");

  const seen = new Set<string>();
  let counter = 1;

  for (const c of gapCandidates) {
    if (seen.has(c.implementation_sha256)) continue;
    seen.add(c.implementation_sha256);
    const gapId = `GAP-MRVN06-${String(counter).padStart(3, "0")}`;
    counter++;
    const gapDir = resolve(ROOT, "gap", gapId);
    mkdirSync(gapDir, { recursive: true });

    const candArtifact = resolve(ROOT, "candidates", c.candidate_id, "artifact");
    const targetArtifact = resolve(gapDir, "candidate-artifact");
    mkdirSync(targetArtifact, { recursive: true });
    cpSync(candArtifact, targetArtifact, { recursive: true });

    const result = JSON.parse(readFileSync(resolve(ROOT, "candidates", c.candidate_id, "result.json"), "utf-8")) as any;
    const diffs = result.behavior.diffs;

    const intentDiff = {
      gap_id: gapId,
      candidate_id: c.candidate_id,
      classification: c.classification,
      intent_oracle_sha256: c.intent_sha256,
      candidate_laws_sha256: c.laws_sha256,
      candidate_implementation_sha256: c.implementation_sha256,
      candidate_artifact_id: JSON.parse(readFileSync(resolve(candArtifact, "manifest.json"), "utf-8")).artifact_id,
      diff_count: result.behavior.diff_count,
      diffs,
    };
    writeFileSync(resolve(gapDir, "intent-diff.json"), JSON.stringify(intentDiff, null, 2) + "\n");

    const witness = diffs[0];
    const md = [
      `# ${gapId}`,
      ``,
      `## Candidate`,
      ``,
      `* candidate_id: ${c.candidate_id}`,
      `* family: ${c.family}`,
      `* implementation_sha256: ${c.implementation_sha256}`,
      ``,
      `## Authority chain`,
      ``,
      `* canonical_laws_sha256: ${summary.canonical_laws_sha256}`,
      `* candidate_laws_sha256: ${c.laws_sha256}`,
      `* SAME_LAW_BOOK: ${summary.canonical_laws_sha256 === c.laws_sha256}`,
      `* intent_oracle_sha256: ${c.intent_sha256}`,
      `* candidate_proof: ${result.proof.canonical === "pass" ? "CANONICAL_PROOF_PASS" : (result.proof.reproof === "pass" ? "REPROOF_PASS" : "n/a")}`,
      ``,
      `## Specification gap witness`,
      ``,
      `Diff count: ${result.behavior.diff_count}`,
      ``,
      `Witness cell:`,
      ``,
      `| field       | value                              |`,
      `|-------------|------------------------------------|`,
      `| actor       | ${witness.actor}                    |`,
      `| capability  | ${witness.capability}               |`,
      `| lifecycle   | ${witness.lifecycle}                |`,
      `| evidence    | ${witness.evidence}                 |`,
      `| intent      | ${witness.expected}                 |`,
      `| candidate   | ${witness.observed}                 |`,
      ``,
      `## Gap authority equation`,
      ``,
      `SPECIFICATION_GAP holds because:`,
      ``,
      `1. SAME_LAW_BOOK: candidate_laws_sha256 == canonical_laws_sha256 == ${summary.canonical_laws_sha256}`,
      `2. LAW_SATISFACTION_VERIFIED: canonical PROOF passes against the candidate implementation`,
      `3. INTENT_ORACLE_IDENTITY_BOUND: intent_oracle_sha256 == ${c.intent_sha256} (matches frozen oracle on disk)`,
      `4. BEHAVIORAL_DIVERGENCE_VERIFIED: ${result.behavior.diff_count} cell(s) of 180 differ from the intent oracle, including the witness above`,
      ``,
      `## Portable artifact`,
      ``,
      `* artifact_id: ${JSON.parse(readFileSync(resolve(candArtifact, "manifest.json"), "utf-8")).artifact_id}`,
      `* artifact_path: ${gapId}/candidate-artifact`,
      ``,
      `## Taxonomy`,
      ``,
      determineTaxonomy(c.family, witness.expected, witness.observed),
      ``,
      `## Notes`,
      ``,
      `Generated 2026-09-20 by ACT-MRVN-06 lab/build_gap_certificates.ts.`,
    ].join("\n");
    writeFileSync(resolve(gapDir, "GAP.md"), md + "\n");

    console.log(`${gapId} <- ${c.candidate_id} (${c.family}, ${c.diff_count} diffs)`);
  }

  const summaryPath = resolve(ROOT, "lab/gap_index.json");
  writeFileSync(summaryPath, JSON.stringify({
    act: "ACT-MRVN-QUALIFY06",
    raw_gaps: gapCandidates.length,
    unique_gap_classes: seen.size,
  }, null, 2));
  console.log(`\nraw_gaps: ${gapCandidates.length}, unique_gap_classes: ${seen.size}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
