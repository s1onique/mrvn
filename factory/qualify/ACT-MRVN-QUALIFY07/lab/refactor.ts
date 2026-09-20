#!/usr/bin/env bun
// ACT-MRVN-07 refactor.ts
//
// The semantics-preserving refactor engine.  Given a refactor
// descriptor, applies ONE transformation family to a copy of the
// canonical main.bend and writes the result to a candidate directory.
//
// Families (per ACT §5):
//   A — branch reorder (in match arms: actor order)
//   B — catchall expansion / contraction
//   C — helper extraction (extract authorize decision logic)
//   D — helper inlining (inline already-extracted helpers)
//   E — wrapper introduction (identity wrapper around authorize)
//   F — data-pattern decomposition (whole-value vs decomposed matches)
//   G — condition factoring (extract predicates)
//   H — branch merging (merge arms with equal body)
//   I — recursion shape (step helper analogue)
//   J — declaration / function ordering
//   CONTROL — byte-identical or whitespace-only
//
// Discipline:
//   * Each descriptor produces a deterministic byte sequence from the
//     canonical impl bytes.
//   * The candidate LAWS.bend is a BYTE-IDENTICAL COPY of the canonical
//     LAWS.bend; refactors NEVER touch the law book.
//   * The candidate PROOF.bend is initially a BYTE-IDENTICAL COPY of
//     the canonical PROOF.bend.
//   * No @unsafe.  No foreign imports.  No ?TODO.  No checker mods.
//
// Usage:
//   bun lab/refactor.ts --descriptor candidates/REF-MRVN07-NNN/descriptor.json \
//     --canonical-impl baseline/main.bend \
//     --out candidates/REF-MRVN07-NNN/main.bend

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

interface RefactorDescriptor {
  candidate_id: string;
  family: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "CONTROL";
  description: string;
  parameters: any;
}

function parseArgs(argv: string[]): { descriptor: string; canonicalImpl: string; out: string } {
  const o: Partial<{ descriptor: string; canonicalImpl: string; out: string }> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const v = argv[++i];
    if (a === "--descriptor") o.descriptor = v;
    else if (a === "--canonical-impl") o.canonicalImpl = v;
    else if (a === "--out") o.out = v;
    else throw new Error("unknown flag: " + a);
  }
  if (!o.descriptor || !o.canonicalImpl || !o.out) {
    throw new Error("usage: --descriptor <path> --canonical-impl <path> --out <path>");
  }
  return o as { descriptor: string; canonicalImpl: string; out: string };
}

const args = parseArgs(process.argv.slice(2));
const desc: RefactorDescriptor = JSON.parse(readFileSync(args.descriptor, "utf-8"));
let candidateText = readFileSync(args.canonicalImpl, "utf-8");

function permuteActorArms(text: string, fnName: string, perm: string[]): string {
  const lines = text.split("\n");
  const fnLine = lines.findIndex((l) => new RegExp(`^def\\s+${fnName}\\s*\\(`).test(l));
  if (fnLine < 0) throw new Error(`function ${fnName} not found`);
  let fnEnd = lines.length;
  for (let i = fnLine + 1; i < lines.length; i++) {
    if (/^def\s+[A-Za-z_]/.test(lines[i])) { fnEnd = i; break; }
  }
  const outerMatchLine = fnLine + 1 + lines.slice(fnLine + 1, fnEnd).findIndex((l) => /^\s+match\s+\w+:\s*$/.test(l));
  const armStart = outerMatchLine + 1;
  const arms: { name: string; body: string[] }[] = [];
  let i = armStart;
  while (i < fnEnd) {
    const m = lines[i].match(/^\s+case\s+Actor\.(\w+)\{\}:\s*$/);
    if (!m) { i++; continue; }
    const armName = m[1];
    let j = i + 1;
    while (j < fnEnd && !/^\s+case\s+Actor\.\w+\{\}:\s*$/.test(lines[j])) j++;
    arms.push({ name: armName, body: lines.slice(i, j) });
    i = j;
  }
  if (arms.length !== 3) throw new Error(`expected 3 actor arms, got ${arms.length}`);
  const names = arms.map((a) => a.name).sort();
  const permNames = [...perm].sort();
  if (JSON.stringify(names) !== JSON.stringify(permNames)) {
    throw new Error(`permutation mismatch: arms=${names} perm=${permNames}`);
  }
  const reordered = perm.map((p) => arms.find((a) => a.name === p)!.body);
  const before = lines.slice(0, armStart);
  const after = lines.slice(i);
  return [...before, ...reordered.flat(), ...after].join("\n");
}

function familyB_contractAutomation(
  text: string, p: any, lines: string[], _lcMatchLine: number,
  _lcStart: number, _lcEnd: number, fnLine: number,
): string {
  // Special: Automation arm's Draft/Active/Halted all -> Deny{WrongActor{}}.
  let fnEnd = lines.length;
  for (let i = fnLine + 1; i < lines.length; i++) {
    if (/^def\s+[A-Za-z_]/.test(lines[i])) { fnEnd = i; break; }
  }
  let automationArmStart = -1;
  let automationArmEnd = -1;
  for (let i = fnLine; i < fnEnd; i++) {
    if (/^\s+case\s+Actor\.Automation\{\}:\s*$/.test(lines[i])) {
      automationArmStart = i;
      for (let j = i + 1; j < fnEnd; j++) {
        if (/^\s+case\s+Actor\.\w+\{\}:\s*$/.test(lines[j])) { automationArmEnd = j; break; }
      }
      if (automationArmEnd < 0) automationArmEnd = fnEnd;
      break;
    }
  }
  if (automationArmStart < 0) throw new Error("no Automation arm");
  const target3 = ["Draft", "Active", "Halted"];
  const arms3: number[] = [];
  let armBody = "";
  for (let i = automationArmStart + 1; i < automationArmEnd; i++) {
    const l = lines[i];
    for (const n of target3) {
      const re2 = new RegExp(`^\\s+case\\s+Lifecycle\\.${n}{}:\\s*(.+)$`);
      const m = re2.exec(l);
      if (m) {
        arms3.push(i);
        if (!armBody) armBody = m[1].trim();
        else if (m[1].trim() !== armBody) throw new Error("different bodies in Automation arm");
        break;
      }
    }
  }
  if (arms3.length !== target3.length) throw new Error(`expected ${target3.length} arms, got ${arms3.length}`);
  const out: string[] = [];
  const drop3 = new Set(arms3.slice(1));
  for (let i = 0; i < lines.length; i++) {
    if (drop3.has(i)) continue;
    if (i === arms3[0]) {
      const indent3 = lines[i].match(/^(\s*)/)![1];
      out.push(`${indent3}case _:${armBody}`);
    } else {
      out.push(lines[i]);
    }
  }
  return out.join("\n");
}

function familyA(text: string, p: any): string {
  const perm: string[] = p.permutation;
  return permuteActorArms(text, p.function, perm);
}

function familyB(text: string, p: any): string {
  // Catchall expansion / contraction.
  const lines = text.split("\n");
  const fnLine = lines.findIndex((l) => new RegExp(`^def\\s+${p.function}\\s*\\(`).test(l));
  if (fnLine < 0) throw new Error(`function ${p.function} not found`);
  let lcMatchLine = -1;
  for (let i = fnLine + 1; i < lines.length; i++) {
    if (p.axis === "evidence" && /^\s+match\s+evidence:\s*$/.test(lines[i])) { lcMatchLine = i; break; }
    if (p.axis !== "evidence" && /^\s+match\s+lifecycle:\s*$/.test(lines[i])) { lcMatchLine = i; break; }
    if (/^def\s+/.test(lines[i])) { break; }
  }
  if (lcMatchLine < 0) throw new Error(`no lifecycle/evidence match in ${p.function}`);
  let armLine = lcMatchLine;
  while (armLine > fnLine && !/^\s+case\s+Actor\.\w+\{\}:\s*$/.test(lines[armLine])) armLine--;
  if (armLine <= fnLine) throw new Error(`no enclosing actor arm`);
  const lcStart = lcMatchLine + 1;
  let lcEnd = lines.length;
  for (let i = lcStart; i < lines.length; i++) {
    if (/^def\s+/.test(lines[i])) { lcEnd = i; break; }
    if (/^\s+case\s+Actor\.\w+\{\}:\s*$/.test(lines[i])) { lcEnd = i; break; }
  }
  const lcArms: { name: string; line: number }[] = [];
  const typePrefix = p.axis === "evidence" ? "Evidence" : "Lifecycle";
  for (let i = lcStart; i < lcEnd; i++) {
    const m = lines[i].match(new RegExp(`^\\s+case\\s+${typePrefix}\\.(\\w+){}:\\s*(.*)$`));
    if (m) lcArms.push({ name: m[1], line: i });
  }
  if (lcArms.length !== 5 && p.axis !== "evidence") throw new Error(`expected 5 lifecycle arms, got ${lcArms.length}`);
  if (lcArms.length !== 3 && p.axis === "evidence") throw new Error(`expected 3 evidence arms, got ${lcArms.length}`);
  if (p.target === "contract_automation_allow") {
    return familyB_contractAutomation(text, p, lines, lcMatchLine, lcStart, lcEnd, fnLine);
  }
  const same = (p.target_arms ?? []) as string[];
  if (same.length < 2) throw new Error(`target_arms must have >= 2 elements`);
  const bodies: string[] = [];
  for (const name of same) {
    const arm = lcArms.find((a) => a.name === name);
    if (!arm) throw new Error(`lifecycle arm ${name} not found`);
    const bodyText = lines[arm.line].match(/:\s*(.+)$/)![1].trim();
    bodies.push(bodyText);
  }
  if (new Set(bodies).size !== 1) {
    throw new Error(`target arms have different bodies: ${bodies.join("|")}`);
  }
  const body = bodies[0];
  if (p.target === "contract_automation_allow_dead") {
    // (dead code; the contract_automation_allow branch is handled above)
    throw new Error("unreachable");
  }
  if (p.target === "contract") {
    const sorted = same.map((n) => lcArms.find((a) => a.name === n)!).sort((a, b) => a.line - b.line);
    const first = sorted[0];
    const dropSet = new Set(sorted.slice(1).map((a) => a.line));
    const out: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (dropSet.has(i)) continue;
      if (i === first.line) {
        const indent = lines[i].match(/^(\s*)/)![1];
        out.push(`${indent}case _:${body}`);
      } else {
        out.push(lines[i]);
      }
    }
    return out.join("\n");
  } else if (p.target === "expand") {
    let cl = -1;
    for (let i = lcStart; i < lcEnd; i++) {
      if (/^\s+case\s+_:\s*/.test(lines[i])) { cl = i; break; }
    }
    if (cl < 0) throw new Error(`no 'case _:' to expand`);
    const indent = lines[cl].match(/^(\s*)/)![1];
    const out: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (i === cl) {
        for (const name of same) {
          out.push(`${indent}case ${typePrefix}.${name}{}: ${body}`);
        }
      } else {
        out.push(lines[i]);
      }
    }
    return out.join("\n");
  } else {
    throw new Error(`unknown target ${p.target}`);
  }
}

function familyC(text: string, p: any): string {
  if (p.helper !== "step") {
    throw new Error(`family C: only 'step' helper supported (got ${p.helper})`);
  }
  const lines = text.split("\n");
  let mainIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^def\s+main\s*\(/.test(lines[i])) { mainIdx = i; break; }
  }
  if (mainIdx < 0) throw new Error("no def main found");
  let stepDef: string[];
  if (p.reorder_args) {
    stepDef = [
      "",
      "# MRVN-07 family C: extracted step helper with reordered args.",
      "def step(",
      "  capability: Capability,",
      "  actor: Actor,",
      "  evidence: Evidence,",
      "  lifecycle: Lifecycle",
      ") -> Decision:",
      "  authorize(actor, capability, lifecycle, evidence)",
      "",
    ];
  } else if (p.comment_only) {
    stepDef = [
      "",
      "# MRVN-07 family C: def-only step helper (comment-only annotation).",
      "def step(",
      "  actor: Actor,",
      "  capability: Capability,",
      "  lifecycle: Lifecycle,",
      "  evidence: Evidence",
      ") -> Decision:",
      "  # Annotation: the original implementation already lives in authorize.",
      "  authorize(actor, capability, lifecycle, evidence)",
      "",
    ];
  } else {
    stepDef = [
      "",
      "# MRVN-07 family C: extracted step helper (identity wrapper).",
      "def step(",
      "  actor: Actor,",
      "  capability: Capability,",
      "  lifecycle: Lifecycle,",
      "  evidence: Evidence",
      ") -> Decision:",
      "  authorize(actor, capability, lifecycle, evidence)",
      "",
    ];
  }
  const before = lines.slice(0, mainIdx);
  const after = lines.slice(mainIdx);
  let newBody: string;
  if (p.comment_only) {
    // For comment-only mode, main() still calls authorize() unchanged.
    newBody = after[0];
  } else {
    newBody = after[0].replace(/authorize\(/, "step(");
  }
  return [...before, ...stepDef, newBody, ...after.slice(1)].join("\n");
}

function familyD(text: string, p: any): string {
  const lines = text.split("\n");
  const targetFn = p.function;
  if (targetFn !== "work_decision") {
    throw new Error(`family D: only 'work_decision' inlining supported (got ${targetFn})`);
  }
  let wdStart = -1, wdEnd = -1;
  let authStart = -1, authEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^def\s+work_decision\s*\(/.test(lines[i])) wdStart = i;
    if (/^def\s+authorize\s*\(/.test(lines[i])) authStart = i;
  }
  if (wdStart < 0 || authStart < 0) throw new Error("work_decision or authorize missing");
  for (let i = wdStart + 1; i < lines.length; i++) {
    if (/^def\s+[A-Za-z_]/.test(lines[i])) { wdEnd = i; break; }
  }
  if (wdEnd < 0) wdEnd = lines.length;
  for (let i = authStart + 1; i < lines.length; i++) {
    if (/^def\s+[A-Za-z_]/.test(lines[i])) { authEnd = i; break; }
  }
  if (authEnd < 0) authEnd = lines.length;
  let wdBodyStart = wdStart + 1;
  while (wdBodyStart < wdEnd && lines[wdBodyStart].trim() === "") wdBodyStart++;
  let wdMatchLine = wdBodyStart;
  while (wdMatchLine < wdEnd && !/^\s+match\s+actor:\s*$/.test(lines[wdMatchLine])) wdMatchLine++;
  if (wdMatchLine >= wdEnd) throw new Error("work_decision body shape changed");
  const wdBody = lines.slice(wdMatchLine, wdEnd);
  // CORRECTED: inlining preserves RELATIVE indentation.  Each line in wdBody
  // keeps its existing whitespace, and we add a 2-space prefix (since the
  // wdBody currently sits at 2-space indent inside work_decision, and we
  // need it to sit at 4-space indent inside authorize's `case Work{}:` arm).
  const extraIndent = "  ";
  const inlinedBody = wdBody.map((l) => {
    if (l.trim() === "") return l;
    return extraIndent + l;
  });
  let workLineIdx = -1;
  for (let i = authStart; i < authEnd; i++) {
    if (/^\s+case\s+Capability\.Work\{\}:\s+work_decision\(/.test(lines[i])) {
      workLineIdx = i;
      break;
    }
  }
  if (workLineIdx < 0) throw new Error("work_decision call in authorize not found");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (i === workLineIdx) {
      for (const l of inlinedBody) out.push(l);
    } else if (i >= wdStart && i < wdEnd) {
      continue;
    } else {
      out.push(lines[i]);
    }
  }
  return out.join("\n");
}

function familyE(text: string, p: any): string {
  const lines = text.split("\n");
  let mainIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^def\s+main\s*\(/.test(lines[i])) { mainIdx = i; break; }
  }
  if (mainIdx < 0) throw new Error("no def main found");
  if (p.wrap === "top") {
    const wrapDef = [
      "",
      "# MRVN-07 family E: identity wrapper (def-only; main() still calls authorize).",
      "def authorize_top(",
      "  actor: Actor,",
      "  capability: Capability,",
      "  lifecycle: Lifecycle,",
      "  evidence: Evidence",
      ") -> Decision:",
      "  authorize(actor, capability, lifecycle, evidence)",
      "",
    ];
    const before = lines.slice(0, mainIdx);
    const after = lines.slice(mainIdx);
    return [...before, ...wrapDef, after[0], ...after.slice(1)].join("\n");
  }
  if (p.wrap === "chain") {
    const wrapDef = [
      "",
      "# MRVN-07 family E: two-level wrapper chain.",
      "def authorize_v2(",
      "  actor: Actor,",
      "  capability: Capability,",
      "  lifecycle: Lifecycle,",
      "  evidence: Evidence",
      ") -> Decision:",
      "  authorize(actor, capability, lifecycle, evidence)",
      "",
      "def authorize_wrapped(",
      "  actor: Actor,",
      "  capability: Capability,",
      "  lifecycle: Lifecycle,",
      "  evidence: Evidence",
      ") -> Decision:",
      "  authorize_v2(actor, capability, lifecycle, evidence)",
      "",
    ];
    const before = lines.slice(0, mainIdx);
    const after = lines.slice(mainIdx);
    const newBody = after[0].replace(/authorize\(/, "authorize_wrapped(");
    return [...before, ...wrapDef, newBody, ...after.slice(1)].join("\n");
  }
  // Default: simple authorize_wrapped wrapper, main() calls it.
  const wrapDef = [
    "",
    "# MRVN-07 family E: identity wrapper.",
    "def authorize_wrapped(",
    "  actor: Actor,",
    "  capability: Capability,",
    "  lifecycle: Lifecycle,",
    "  evidence: Evidence",
    ") -> Decision:",
    "  authorize(actor, capability, lifecycle, evidence)",
    "",
  ];
  const before = lines.slice(0, mainIdx);
  const after = lines.slice(mainIdx);
  const newBody = after[0].replace(/authorize\(/, "authorize_wrapped(");
  return [...before, ...wrapDef, newBody, ...after.slice(1)].join("\n");
}

function familyF(text: string, p: any): string {
  const lines = text.split("\n");
  const fnLine = lines.findIndex((l) => new RegExp(`^def\\s+${p.function}\\s*\\(`).test(l));
  if (fnLine < 0) throw new Error(`function ${p.function} not found`);
  if (p.mode === "decompose") {
    let fnEnd = lines.length;
    for (let i = fnLine + 1; i < lines.length; i++) {
      if (/^def\s+[A-Za-z_]/.test(lines[i])) { fnEnd = i; break; }
    }
    const wrapIndent = "  ";
    const innerIndent = "    ";
    const wrapped: string[] = [];
    wrapped.push(lines[fnLine]);
    for (let i = fnLine + 1; i < fnEnd; i++) {
      if (/^\s+match\s+actor:\s*$/.test(lines[i])) {
        wrapped.push(`${wrapIndent}match capability:`);
        wrapped.push(`${innerIndent}case Capability.Work{}:`);
        for (let j = i; j < fnEnd; j++) {
          wrapped.push(`${innerIndent}${lines[j]}`);
        }
        break;
      } else {
        wrapped.push(lines[i]);
      }
    }
    const before = lines.slice(0, fnLine);
    const after = lines.slice(fnEnd);
    return [...before, ...wrapped, ...after].join("\n");
  } else if (p.mode === "whole") {
    if (p.function !== "work_decision") throw new Error(`family F whole: only work_decision supported`);
    let fnEnd = lines.length;
    for (let i = fnLine + 1; i < lines.length; i++) {
      if (/^def\s+[A-Za-z_]/.test(lines[i])) { fnEnd = i; break; }
    }
    const out: string[] = [];
    let skipping = false;
    for (let i = fnLine; i < fnEnd; i++) {
      const l = lines[i];
      if (!skipping) {
        if (/^\s+match\s+capability:\s*$/.test(l) || /^\s+case\s+Capability\.Work\{\}:\s*$/.test(l)) {
          skipping = true;
          continue;
        }
        out.push(l);
      } else {
        if (l.length >= 4) out.push(l.slice(2));
        else out.push(l);
      }
    }
    const before = lines.slice(0, fnLine);
    const after = lines.slice(fnEnd);
    return [...before, ...out, ...after].join("\n");
  } else if (p.mode === "decompose_then_whole") {
    // Apply decompose then whole: remove the wrapper that decompose added.
    // For our canonical kernel, decompose adds `match capability:` /
    // `case Capability.Work{}:` and reindents.  whole removes them.
    // Round-trip should be byte-identical to the original.
    return familyF(familyF(text, { function: p.function, mode: "decompose" }),
      { function: p.function, mode: "whole" });
  } else {
    throw new Error(`unknown family F mode ${p.mode}`);
  }
}

function familyG(text: string, p: any): string {
  const lines = text.split("\n");
  let mainIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^def\s+main\s*\(/.test(lines[i])) { mainIdx = i; break; }
  }
  if (mainIdx < 0) throw new Error("no def main found");
  let helper: string[];
  if (p.helper === "is_reviewer_actor") {
    helper = [
      "",
      "# MRVN-07 family G: factored predicate (referenced for clarity, not used).",
      "def is_reviewer_actor(a: Actor) -> Bool:",
      "  match a:",
      "    case Actor.Reviewer{}: True{}",
      "    case _:                False{}",
      "",
    ];
  } else if (p.helper === "is_live_evidence") {
    helper = [
      "",
      "# MRVN-07 family G: factored predicate (referenced for clarity, not used).",
      "def is_live_evidence(e: Evidence) -> Bool:",
      "  match e:",
      "    case Evidence.Live{}: True{}",
      "    case _:               False{}",
      "",
    ];
  } else {
    helper = [
      "",
      "# MRVN-07 family G: factored predicate (referenced for clarity, not used).",
      "def is_terminal_lc(s: Lifecycle) -> Bool:",
      "  match s:",
      "    case Lifecycle.Closed{}: True{}",
      "    case _:                  False{}",
      "",
    ];
  }
  const before = lines.slice(0, mainIdx);
  const after = lines.slice(mainIdx);
  return [...before, ...helper, ...after].join("\n");
}

export function familyH(text: string, p: any): string {
  const lines = text.split("\n");
  const fnLine = lines.findIndex((l) => new RegExp(`^def\\s+${p.function}\\s*\\(`).test(l));
  if (fnLine < 0) throw new Error(`function ${p.function} not found`);
  let fnEnd = lines.length;
  for (let i = fnLine + 1; i < lines.length; i++) {
    if (/^def\s+[A-Za-z_]/.test(lines[i])) { fnEnd = i; break; }
  }
  // Find the FIRST inner lifecycle/evidence match (i.e. nested inside the
  // first actor arm).  We do this so the merge only affects ONE actor arm's
  // inner match.
  let lcMatch = -1;
  for (let i = fnLine + 1; i < fnEnd; i++) {
    if (p.axis === "evidence" && /^\s+match\s+evidence:\s*$/.test(lines[i])) { lcMatch = i; break; }
    if (p.axis !== "evidence" && /^\s+match\s+lifecycle:\s*$/.test(lines[i])) { lcMatch = i; break; }
  }
  if (lcMatch < 0) throw new Error("no lifecycle/evidence match");
  const merge: string[] = p.merge;
  if (merge.length !== 2) throw new Error(`family H: merge must have exactly 2 names (got ${merge.length})`);
  const typePrefix = p.axis === "evidence" ? "Evidence" : "Lifecycle";
  const armRe = (name: string) => new RegExp(`^\\s+case\\s+${typePrefix}\\.${name}{}:\\s*(.+)$`);
  // Collect ALL matches within the FIRST inner match (i.e. until we hit a
  // sibling actor arm boundary).
  const armLines: number[] = [];
  let armEnd = fnEnd;
  for (let i = lcMatch + 1; i < fnEnd; i++) {
    if (/^\s+case\s+Actor\.\w+\{\}:\s*$/.test(lines[i])) { armEnd = i; break; }
  }
  for (let i = lcMatch + 1; i < armEnd; i++) {
    for (const name of merge) {
      if (armRe(name).test(lines[i])) {
        armLines.push(i);
        break;
      }
    }
  }
  if (armLines.length < 2) {
    throw new Error(`family H: could not find both arms ${merge.join(",")} (got ${armLines.length})`);
  }
  armLines.length = 2;
  const body1 = lines[armLines[0]].match(/:(.+)$/)![1];
  const body2 = lines[armLines[1]].match(/:(.+)$/)![1];
  if (body1.trim() !== body2.trim()) throw new Error(`family H: bodies differ: '${body1}' vs '${body2}'`);
  const mergedLine = lines[armLines[0]].replace(
    new RegExp(`case\\s+${typePrefix}\\.(\\w+){}:\\s*`),
    `case ${typePrefix}.${merge[0]}{} | ${typePrefix}.${merge[1]}{}: `,
  );
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (i === armLines[0]) out.push(mergedLine);
    else if (i === armLines[1]) continue;
    else out.push(lines[i]);
  }
  return out.join("\n");
}

function familyI(text: string, p: any): string {
  if (p.rename && Array.isArray(p.rename) && p.rename.length === 2) {
    // Generic rename: rename work_decision -> <new> (and update callers).
    const [oldName, newName] = p.rename;
    let renamed = text.split("\n").map((l) => l.replace(new RegExp(`\\b${oldName}\\(`, "g"), `${newName}(`)).join("\n");
    renamed = renamed.replace(new RegExp(`^def\\s+${oldName}\\(`, "m"), `def ${newName}(`);
    return renamed;
  }
  // Default: rename authorize -> step; reintroduce authorize as a thin wrapper.
  let renamed = text.split("\n").map((l) => l.replace(/\bauthorize\(/g, "step(")).join("\n");
  renamed = renamed.replace(/^def\s+authorize\(/m, "def step(");
  const rlines = renamed.split("\n");
  let mainIdx = -1;
  for (let i = 0; i < rlines.length; i++) {
    if (/^def\s+main\s*\(/.test(rlines[i])) { mainIdx = i; break; }
  }
  if (mainIdx < 0) throw new Error("no def main found");
  const wrap = [
    "",
    "def authorize(",
    "  actor: Actor,",
    "  capability: Capability,",
    "  lifecycle: Lifecycle,",
    "  evidence: Evidence",
    ") -> Decision:",
    "  step(actor, capability, lifecycle, evidence)",
    "",
  ];
  const before = rlines.slice(0, mainIdx);
  const after = rlines.slice(mainIdx);
  return [...before, ...wrap, ...after].join("\n");
}

function familyJ(text: string, p: any): string {
  const lines = text.split("\n");
  const defBounds: { name: string; start: number; end: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
    if (m) {
      const name = m[1];
      let end = lines.length;
      for (let j = i + 1; j < lines.length; j++) {
        if (/^def\s+[A-Za-z_]/.test(lines[j])) { end = j; break; }
      }
      defBounds.push({ name, start: i, end });
    }
  }
  if (defBounds.length < 5) throw new Error("not enough defs");
  const order = p.swap_order as string[];
  if (order.length < 2) throw new Error("family J: swap_order required");
  const a = defBounds.find((d) => d.name === order[0]);
  const b = defBounds.find((d) => d.name === order[1]);
  if (!a || !b) throw new Error("family J: swap names not found");
  if (a.start >= b.start) throw new Error("family J: a must come before b for canonical swap");
  const blockA = lines.slice(a.start, a.end);
  const blockB = lines.slice(b.start, b.end);
  const out: string[] = [];
  out.push(...lines.slice(0, a.start));
  out.push(...blockB);
  out.push(...lines.slice(a.end, b.start));
  out.push(...blockA);
  out.push(...lines.slice(b.end));
  return out.join("\n");
}

function familyControlIdent(text: string, p: any): string {
  if (p && p.mode === "whitespace") {
    return text.replace(/\n*$/, "\n\n# MRVN-07 control: whitespace-only edit (CONTROL-02).\n");
  }
  return text;
}

function familyControlPBreak(text: string, p: any): string {
  // CONTROL-03: rename public symbol that LAWS reference.
  // Implementation is byte-identical except for the rename.
  // Under Bend's def-based proof model, this is the ONLY way to break the
  // canonical proof (but it ALSO breaks the LAWS, so it's not a
  // proof-shape-sensitive case — it's DIFFERENT_SPECIFICATION).
  const from = p.from ?? "authorize";
  const to = p.to ?? "do_authorize";
  return text.replace(new RegExp(`\\b${from}\\(`, "g"), `${to}(`);
}

function applyRefactor(text: string, desc: RefactorDescriptor): string {
  switch (desc.family) {
    case "A": return familyA(text, desc.parameters);
    case "B": return familyB(text, desc.parameters);
    case "C": return familyC(text, desc.parameters);
    case "D": return familyD(text, desc.parameters);
    case "E": return familyE(text, desc.parameters);
    case "F": return familyF(text, desc.parameters);
    case "G": return familyG(text, desc.parameters);
    case "H": return familyH(text, desc.parameters);
    case "I": return familyI(text, desc.parameters);
    case "J": return familyJ(text, desc.parameters);
    case "CONTROL": return familyControlIdent(text, desc.parameters);
    case "CONTROL_PBREAK": return familyControlPBreak(text, desc.parameters);
    default: throw new Error(`unknown family ${desc.family}`);
  }
}

const result = applyRefactor(candidateText, desc);
writeFileSync(args.out, result);

const sha = createHash("sha256").update(result).digest("hex");
console.log(`wrote ${args.out} (sha256:${sha})`);
console.log(`family: ${desc.family} candidate_id: ${desc.candidate_id}`);
