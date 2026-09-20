#!/usr/bin/env bun
// ACT-MRVN-07 gen_negative_controls.ts
//
// Build additional negative_controls/ candidates for the lab.  These
// are deliberate semantic-changing edits used to prove the equivalence
// gate detects drift.  They are NOT in the primary corpus and are
// excluded from proof-robustness statistics.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "bun";

const ROOT = resolve(import.meta.dir, "..");
const REPO = resolve(ROOT, "..", "..", "..");
const BEND = resolve(REPO, "bend2/main.ts");
const CANONICAL_IMPL = resolve(ROOT, "baseline/main.bend");
const CANONICAL_LAWS = resolve(ROOT, "baseline/LAWS.bend");
const CANONICAL_PROOF = resolve(ROOT, "baseline/PROOF.bend");
const ORACLE = resolve(ROOT, "baseline/oracle.json");
const CANONICAL_KERNEL = resolve(ROOT, "baseline");
const NEG_DIR = resolve(ROOT, "negative_controls");

interface NegCandidate {
  candidate_id: string;
  description: string;
  apply: (text: string) => string;
}

const NEG_CANDIDATES: NegCandidate[] = [
  {
    candidate_id: "NEG-MRVN07-001",
    description: "Agent+Work+Active+None: change Allow to Deny{WrongActor}.",
    apply: (text) => {
      // Find the Agent arm's Active lifecycle arm in work_decision and flip its decision.
      const lines = text.split("\n");
      let fnStart = -1;
      for (let i = 0; i < lines.length; i++) {
        if (/^def\s+work_decision\s*\(/.test(lines[i])) { fnStart = i; break; }
      }
      // Find the Agent arm.
      let agentStart = -1, agentEnd = -1;
      for (let i = fnStart; i < lines.length; i++) {
        if (/^\s+case\s+Actor\.Agent\{\}:\s*$/.test(lines[i])) { agentStart = i; break; }
      }
      for (let i = agentStart + 1; i < lines.length; i++) {
        if (/^\s+case\s+Actor\.\w+\{\}:\s*$/.test(lines[i])) { agentEnd = i; break; }
        if (/^def\s+/.test(lines[i])) { agentEnd = i; break; }
      }
      // Find the Active arm inside Agent (the line `case Lifecycle.Active{}: Decision.Allow{}`).
      for (let i = agentStart; i < agentEnd; i++) {
        if (/^\s+case\s+Lifecycle\.Active\{\}:\s+Decision\.Allow\{\}\s*$/.test(lines[i])) {
          lines[i] = lines[i].replace("Decision.Allow{}", "Decision.Deny{DenyReason.WrongActor{}}");
          break;
        }
      }
      return lines.join("\n");
    },
  },
  {
    candidate_id: "NEG-MRVN07-002",
    description: "Reviewer+Freeze+Draft: change Deny{WrongLifecycle} to Deny{WrongActor} (1 cell off).",
    apply: (text) => {
      const lines = text.split("\n");
      let fnStart = -1;
      for (let i = 0; i < lines.length; i++) {
        if (/^def\s+freeze_decision\s*\(/.test(lines[i])) { fnStart = i; break; }
      }
      let reviewStart = -1, reviewEnd = -1;
      for (let i = fnStart; i < lines.length; i++) {
        if (/^\s+case\s+Actor\.Reviewer\{\}:\s*$/.test(lines[i])) { reviewStart = i; break; }
      }
      for (let i = reviewStart + 1; i < lines.length; i++) {
        if (/^\s+case\s+Actor\.\w+\{\}:\s*$/.test(lines[i])) { reviewEnd = i; break; }
        if (/^def\s+/.test(lines[i])) { reviewEnd = i; break; }
      }
      for (let i = reviewStart; i < reviewEnd; i++) {
        if (/^\s+case\s+Lifecycle\.Draft\{\}:\s+Decision\.Deny\{DenyReason\.WrongLifecycle\{\}\}\s*$/.test(lines[i])) {
          lines[i] = lines[i].replace("WrongLifecycle", "WrongActor");
          break;
        }
      }
      return lines.join("\n");
    },
  },
];

async function main() {
  console.log(`=== ACT-MRVN-07 negative controls ===`);
  console.log(`candidates: ${NEG_CANDIDATES.length}`);
  if (!existsSync(NEG_DIR)) mkdirSync(NEG_DIR, { recursive: true });

  for (const nc of NEG_CANDIDATES) {
    const candDir = resolve(NEG_DIR, nc.candidate_id);
    if (!existsSync(candDir)) mkdirSync(candDir, { recursive: true });
    const newText = nc.apply(readFileSync(CANONICAL_IMPL, "utf-8"));
    writeFileSync(resolve(candDir, "main.bend"), newText);
    writeFileSync(resolve(candDir, "LAWS.bend"), readFileSync(CANONICAL_LAWS));
    writeFileSync(resolve(candDir, "PROOF.bend"), readFileSync(CANONICAL_PROOF));
    writeFileSync(resolve(candDir, "descriptor.json"), JSON.stringify({
      candidate_id: nc.candidate_id,
      family: "NEGATIVE_SEMANTIC",
      description: nc.description,
      negative_control: true,
    }, null, 2) + "\n");
    // Run classifier.
    const proc = spawn({
      cmd: ["bun", resolve(ROOT, "lab/classify.ts"),
            "--candidate", candDir,
            "--canonical-kernel", CANONICAL_KERNEL,
            "--oracle", ORACLE,
            "--bend-runner", BEND,
            "--results-out", resolve(candDir, "result.json")],
      stdout: "pipe", stderr: "pipe",
    });
    const out = await new Response(proc.stdout).text();
    const err = await new Response(proc.stderr).text();
    await proc.exited;
    console.log(`  ${nc.candidate_id}: exit=${proc.exitCode}`);
    if (proc.exitCode !== 0) {
      console.log(`    ${err.split("\n").slice(-5).join("\n    ")}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
