#!/usr/bin/env bun
// ACT-MRVN-06 make_counterexample.ts
//
// Generate a COUNTEREXAMPLE.bend that proves a candidate violates a
// specific law by checking `Gate.authorize(...) != expected_decision`
// at a known witness cell.
//
// Usage:
//   bun lab/make_counterexample.ts \
//     --witness <actor,cap,lc,ev> \
//     --expected <expected_decision_string> \
//     --out <path>
//
// Where <expected_decision_string> is e.g. "Deny{WrongActor}" or "Allow".

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, isAbsolute } from "node:path";

function parseArgs(argv: string[]): { witness: string; expected: string; out: string } {
  const o: Partial<{ witness: string; expected: string; out: string }> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--witness") o.witness = argv[++i];
    else if (a === "--expected") o.expected = argv[++i];
    else if (a === "--out") o.out = argv[++i];
    else throw new Error("unknown flag: " + a);
  }
  if (!o.witness || !o.expected || !o.out) {
    throw new Error("usage: --witness actor,cap,lc,ev --expected <Deny{Reason}|Allow> --out <path>");
  }
  return o as { witness: string; expected: string; out: string };
}

const args = parseArgs(process.argv.slice(2));
const parts = args.witness.split(",");
if (parts.length !== 4) throw new Error("--witness must be actor,cap,lc,ev");
const [actor, cap, lc, ev] = parts;

const expected = args.expected;
if (expected !== "Allow" && !/^Deny\{(Terminal|WrongActor|WrongLifecycle|InsufficientEvidence)\}$/.test(expected)) {
  throw new Error(`bad --expected: ${expected}`);
}

const isAllow = expected === "Allow";
const expectedTag = isAllow ? "Allow" : expected;

// Generate the COUNTEREXAMPLE.bend that:
//   * Calls Gate.authorize at the witness cell
//   * Compares to expected
//   * Returns True iff they differ (i.e., the law is refuted)
//
// This works because the LAW we're refuting is exactly:
//   `authorize(actor, cap, lc, ev) == <expected>` (e.g., LAW-012 says
//   Agent + Halt + Active + None -> WrongActor).
//
// When the candidate mutates away from <expected>, the result differs
// and the counterexample returns True.
const lines: string[] = [];
lines.push(`# ACT-MRVN-06 auto-generated COUNTEREXAMPLE.bend.`);
lines.push(`# Witness: ${args.witness}`);
lines.push(`# Expected (canonical): ${expected}`);
lines.push(``);
lines.push(`import Base`);
lines.push(`import ./main.bend as Gate`);
lines.push(``);
lines.push(`def expected_decision() -> Gate.Decision:`);
if (isAllow) {
  lines.push(`  Gate.Decision.Allow{}`);
} else {
  // expected = "Deny{Terminal}" / "Deny{WrongActor}" / etc.
  const reason = expectedTag.slice(5, -1);
  lines.push(`  Gate.Decision.Deny{Gate.DenyReason.${reason}{}}`);
}
lines.push(``);
lines.push(`def observed() -> Gate.Decision:`);
lines.push(`  Gate.authorize(`);
lines.push(`    Gate.Actor.${actor}{},`);
lines.push(`    Gate.Capability.${cap}{},`);
lines.push(`    Gate.Lifecycle.${lc}{},`);
lines.push(`    Gate.Evidence.${ev}{})`);
lines.push(``);

// Bend's affine discipline: match scrutinees must appear in binder order.
// We work around this by introducing a helper that takes the observed
// decision as a binder.
lines.push(`def differs(d: Gate.Decision) -> Bool:`);
lines.push(`  match d:`);
lines.push(`    case Gate.Decision.Allow{}:`);
if (isAllow) {
  lines.push(`      False{}`);
} else {
  lines.push(`      True{}`);
}
lines.push(`    case Gate.Decision.Deny{obs}:`);
lines.push(`      match obs:`);
if (isAllow) {
  lines.push(`        case Gate.DenyReason.Terminal{}: True{}`);
  lines.push(`        case Gate.DenyReason.WrongActor{}: True{}`);
  lines.push(`        case Gate.DenyReason.WrongLifecycle{}: True{}`);
  lines.push(`        case Gate.DenyReason.InsufficientEvidence{}: True{}`);
} else {
  const reason = expectedTag.slice(5, -1);
  if (reason === "Terminal") {
    lines.push(`        case Gate.DenyReason.Terminal{}: False{}`);
    lines.push(`        case Gate.DenyReason.WrongActor{}: True{}`);
    lines.push(`        case Gate.DenyReason.WrongLifecycle{}: True{}`);
    lines.push(`        case Gate.DenyReason.InsufficientEvidence{}: True{}`);
  } else if (reason === "WrongActor") {
    lines.push(`        case Gate.DenyReason.Terminal{}: True{}`);
    lines.push(`        case Gate.DenyReason.WrongActor{}: False{}`);
    lines.push(`        case Gate.DenyReason.WrongLifecycle{}: True{}`);
    lines.push(`        case Gate.DenyReason.InsufficientEvidence{}: True{}`);
  } else if (reason === "WrongLifecycle") {
    lines.push(`        case Gate.DenyReason.Terminal{}: True{}`);
    lines.push(`        case Gate.DenyReason.WrongActor{}: True{}`);
    lines.push(`        case Gate.DenyReason.WrongLifecycle{}: False{}`);
    lines.push(`        case Gate.DenyReason.InsufficientEvidence{}: True{}`);
  } else if (reason === "InsufficientEvidence") {
    lines.push(`        case Gate.DenyReason.Terminal{}: True{}`);
    lines.push(`        case Gate.DenyReason.WrongActor{}: True{}`);
    lines.push(`        case Gate.DenyReason.WrongLifecycle{}: True{}`);
    lines.push(`        case Gate.DenyReason.InsufficientEvidence{}: False{}`);
  }
}
lines.push(``);
lines.push(`def main() -> Bool:`);
lines.push(`  differs(observed())`);

writeFileSync(args.out, lines.join("\n") + "\n");
console.log(`wrote ${args.out}`);
