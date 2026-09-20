#!/usr/bin/env bun
// ACT-MRVN-06 make_candidate.ts
//
// Generate a candidate main.bend from a mutation descriptor.
//
// Discipline:
//   * The candidate's LAWS.bend is BYTE-IDENTICAL to the canonical one.
//   * Mutation descriptor is small and deterministic.  Two runs of the
//     same descriptor on the same canonical main.bend produce the same
//     candidate main.bend.
//
// Mutation types supported:
//   DENY_REASON_SUBSTITUTE
//     { "type": "DENY_REASON_SUBSTITUTE",
//       "function": "close_decision",
//       "actor": "Reviewer", "lifecycle": "Frozen", "evidence": "Replay",
//       "from_reason": "InsufficientEvidence", "to_reason": "Terminal" }
//   ALLOW_TO_DENY
//     { "type": "ALLOW_TO_DENY",
//       "function": "work_decision",
//       "actor": "Agent", "lifecycle": "Active", "evidence": "Live",
//       "to_reason": "WrongLifecycle" }
//   DENY_TO_ALLOW
//     { "type": "DENY_TO_ALLOW",
//       "function": "halt_decision",
//       "actor": "Agent", "lifecycle": "Active", "evidence": "Live" }

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(import.meta.dir, "..");
const CANONICAL_IMPL = resolve(ROOT, "authority-kernel/main.bend");

interface Mutation {
  type: "DENY_REASON_SUBSTITUTE" | "ALLOW_TO_DENY" | "DENY_TO_ALLOW";
  function: string;
  actor: string;
  lifecycle: string;
  evidence?: string;
  from_reason?: string;
  to_reason?: string;
}

interface Descriptor {
  candidate_id: string;
  family: string;
  description: string;
  mutations: Mutation[];
}

function parseArgs(argv: string[]): { descriptor: string; out: string } {
  const o: Partial<{ descriptor: string; out: string }> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--descriptor") o.descriptor = argv[++i];
    else if (a === "--out") o.out = argv[++i];
    else throw new Error("unknown flag: " + a);
  }
  if (!o.descriptor || !o.out) {
    throw new Error("usage: --descriptor <path> --out <path>");
  }
  return o as { descriptor: string; out: string };
}

const args = parseArgs(process.argv.slice(2));
const desc: Descriptor = JSON.parse(readFileSync(args.descriptor, "utf-8"));

if (!existsSync(CANONICAL_IMPL)) {
  throw new Error(`canonical main.bend not found: ${CANONICAL_IMPL}`);
}

let candidateText = readFileSync(CANONICAL_IMPL, "utf-8");

function findFnBody(text: string, fnName: string): { startLine: number; endLine: number } | null {
  const lines = text.split("\n");
  let startLine = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(new RegExp(`^def\\s+${fnName}\\s*\\(`));
    if (m) {
      startLine = i;
      break;
    }
  }
  if (startLine < 0) return null;
  let endLine = lines.length;
  for (let i = startLine + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^def\s+[A-Za-z_]/.test(line)) {
      endLine = i;
      break;
    }
  }
  return { startLine, endLine };
}

// Locate (actor, lifecycle, evidence) decision line in the function body.
// Returns the index of the line containing the decision expression, or -1.
//
// IMPORTANT: scope the search to the current actor arm.  We must not
// bleed into a sibling actor's match arm when scanning for the
// lifecycle or evidence match.
function locateDecisionLine(
  text: string,
  fnName: string,
  actor: string,
  lifecycle: string,
  evidence: string | undefined,
): number {
  const body = findFnBody(text, fnName);
  if (!body) throw new Error(`function ${fnName} not found`);
  const lines = text.split("\n");

  // Find the actor arm: from the matching "case Actor.XXX{}:" line to
  // the next sibling "case Actor." line or end of body.
  let actorArmStart = -1;
  let actorArmEnd = body.endLine;
  for (let i = body.startLine; i < body.endLine; i++) {
    if (lines[i].includes(`case Actor.${actor}{}:`)) { actorArmStart = i; break; }
  }
  if (actorArmStart < 0) throw new Error(`actor ${actor} not found in ${fnName}`);
  for (let i = actorArmStart + 1; i < body.endLine; i++) {
    if (/^\s+case\s+Actor\./.test(lines[i])) { actorArmEnd = i; break; }
  }

  // Within the actor arm, find the lifecycle case.  Same scoping.
  let lcLine = -1;
  for (let i = actorArmStart + 1; i < actorArmEnd; i++) {
    if (lines[i].includes(`case Lifecycle.${lifecycle}{}`)) { lcLine = i; break; }
  }
  if (lcLine < 0) throw new Error(`lifecycle ${lifecycle} not found for ${actor} in ${fnName}`);

  // The lifecycle arm ends at the next sibling lifecycle case line.
  let lcArmEnd = actorArmEnd;
  for (let i = lcLine + 1; i < actorArmEnd; i++) {
    if (/^\s+case\s+Lifecycle\./.test(lines[i])) { lcArmEnd = i; break; }
  }

  // If we have an evidence argument and a nested evidence match within
  // the lifecycle arm, find it.  Otherwise the decision is on the
  // lifecycle case line itself.
  if (evidence !== undefined) {
    let evLine = -1;
    for (let i = lcLine + 1; i < lcArmEnd; i++) {
      if (lines[i].includes(`case Evidence.${evidence}{}`)) { evLine = i; break; }
    }
    if (evLine >= 0) {
      // Layout (a): decision on same line.
      if (lines[evLine].includes("Decision.")) return evLine;
      // Layout (b): decision on next line, before any sibling case.
      for (let i = evLine + 1; i < lcArmEnd; i++) {
        const l = lines[i];
        if (/^\s+case\s+/.test(l)) break;
        if (l.includes("Decision.")) return i;
      }
    }
    // No nested evidence match: decision is on the lifecycle line.
    if (lines[lcLine].includes("Decision.")) return lcLine;
    for (let i = lcLine + 1; i < lcArmEnd; i++) {
      const l = lines[i];
      if (/^\s+case\s+/.test(l)) break;
      if (l.includes("Decision.")) return i;
    }
  } else {
    if (lines[lcLine].includes("Decision.")) return lcLine;
    for (let i = lcLine + 1; i < lcArmEnd; i++) {
      const l = lines[i];
      if (/^\s+case\s+/.test(l)) break;
      if (l.includes("Decision.")) return i;
    }
  }
  return -1;
}

function applyDenyReasonSubstitute(text: string, m: Mutation): string {
  if (!m.evidence || !m.from_reason || !m.to_reason) {
    throw new Error("DENY_REASON_SUBSTITUTE requires evidence, from_reason, to_reason");
  }
  const lines = text.split("\n");
  const idx = locateDecisionLine(text, m.function, m.actor, m.lifecycle, m.evidence);
  if (idx < 0) throw new Error(`deny decision line not found`);
  const targetLine = lines[idx];
  const re = new RegExp(`DenyReason\\.${m.from_reason}\\{\\}`);
  if (!re.test(targetLine)) {
    throw new Error(`from_reason ${m.from_reason} not present in target line: ${targetLine}`);
  }
  const newLine = targetLine.replace(re, `DenyReason.${m.to_reason}{}`);
  lines[idx] = newLine;
  return lines.join("\n");
}

function applyAllowToDeny(text: string, m: Mutation): string {
  if (!m.to_reason) throw new Error("ALLOW_TO_DENY requires to_reason");
  const lines = text.split("\n");
  const idx = locateDecisionLine(text, m.function, m.actor, m.lifecycle, m.evidence);
  if (idx < 0) throw new Error(`decision line not found`);
  if (!lines[idx].includes("Decision.Allow{}")) {
    throw new Error(`target line is not an Allow: ${lines[idx]}`);
  }
  // Preserve the case-prefix by replacing only `Decision.Allow{}` with the new Deny.
  // We need to keep the leading `case Lifecycle.X{}: ` (or `case Evidence.X{}: `).
  const newLine = lines[idx].replace(
    /Decision\.Allow\{\}/,
    `Decision.Deny{DenyReason.${m.to_reason}{}}`,
  );
  if (newLine === lines[idx]) {
    throw new Error(`substitute failed: ${lines[idx]}`);
  }
  lines[idx] = newLine;
  return lines.join("\n");
}

function applyDenyToAllow(text: string, m: Mutation): string {
  const lines = text.split("\n");
  const idx = locateDecisionLine(text, m.function, m.actor, m.lifecycle, m.evidence);
  if (idx < 0) throw new Error(`decision line not found`);
  if (!lines[idx].includes("Decision.Deny{")) {
    throw new Error(`target line is not a Deny: ${lines[idx]}`);
  }
  const newLine = lines[idx].replace(/Decision\.Deny\{[^{}]*\{\}\}/, "Decision.Allow{}");
  if (newLine === lines[idx]) {
    throw new Error(`substitute failed: ${lines[idx]}`);
  }
  lines[idx] = newLine;
  return lines.join("\n");
}

for (const mutation of desc.mutations) {
  switch (mutation.type) {
    case "DENY_REASON_SUBSTITUTE":
      candidateText = applyDenyReasonSubstitute(candidateText, mutation);
      break;
    case "ALLOW_TO_DENY":
      candidateText = applyAllowToDeny(candidateText, mutation);
      break;
    case "DENY_TO_ALLOW":
      candidateText = applyDenyToAllow(candidateText, mutation);
      break;
    default:
      throw new Error(`unknown mutation type: ${(mutation as any).type}`);
  }
}

writeFileSync(args.out, candidateText);

const sha = createHash("sha256").update(candidateText).digest("hex");
console.log(`wrote ${args.out} (sha256:${sha})`);
console.log(`descriptor: ${desc.candidate_id} family=${desc.family}`);
console.log(`mutations applied: ${desc.mutations.length}`);
