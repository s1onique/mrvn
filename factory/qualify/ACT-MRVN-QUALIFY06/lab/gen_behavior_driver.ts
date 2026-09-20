#!/usr/bin/env bun
// ACT-MRVN-06 gen_behavior_driver.ts
//
// Generates a Bend file that calls Gate.authorize(...) on every
// (actor, capability, lifecycle, evidence) cell and prints the result
// as a newline-separated list of "actor|cap|lc|ev=decision" tokens.
//
// This driver is generated deterministically from the canonical
// enumeration order so that the same Bend file is produced on every
// invocation.  A consumer (canonical_compare.ts, classify.ts) parses
// the stdout and uses it as the candidate's observed behavior.
//
// Usage:
//   bun lab/gen_behavior_driver.ts \
//     --impl <path/to/main.bend> \
//     --out  <path/to/_behavior_dump.bend>
//
// The generated file imports the impl as `Gate` and prints one row per
// cell.

import { writeFileSync } from "node:fs";
import { resolve, isAbsolute } from "node:path";

const ACTORS = ["Agent", "Reviewer", "Automation"] as const;
const CAPABILITIES = ["Work", "Halt", "Freeze", "Close"] as const;
const LIFECYCLES = ["Closed", "Active", "Halted", "Draft", "Frozen"] as const;
const EVIDENCES = ["None", "Replay", "Live"] as const;

function parseArgs(argv: string[]): { impl: string; out: string } {
  const o: Partial<{ impl: string; out: string }> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--impl") o.impl = argv[++i];
    else if (a === "--out") o.out = argv[++i];
    else throw new Error("unknown flag: " + a);
  }
  if (!o.impl || !o.out) throw new Error("usage: --impl <main.bend> --out <dump.bend>");
  return o as { impl: string; out: string };
}

const args = parseArgs(process.argv.slice(2));
const implPath = isAbsolute(args.impl) ? args.impl : resolve(args.impl);

function cellRow(actor: string, cap: string, lc: string, ev: string): string {
  // Build a single row expression.  Note: Bend uses ++ for String concat.
  // Use the same identifier names consistently to keep the affine
  // checker happy (each constructor must be consumed exactly once).
  return (
    `row("${actor}", "${cap}", "${lc}", "${ev}", ` +
    `Gate.Actor.${actor}{}, Gate.Capability.${cap}{}, ` +
    `Gate.Lifecycle.${lc}{}, Gate.Evidence.${ev}{}) ++ "\\n"`
  );
}

const lines: string[] = [];
lines.push(`# ACT-MRVN-06 auto-generated behavior dump.`);
lines.push(`# Generated from ${implPath}.`);
lines.push(`# DO NOT EDIT BY HAND.  Re-run gen_behavior_driver.ts to regenerate.`);
lines.push(``);
lines.push(`import Base`);
lines.push(`import ${implPath} as Gate`);
lines.push(``);
lines.push(`def decision_tag(d: Gate.Decision) -> String:`);
lines.push(`  match d:`);
lines.push(`    case Gate.Decision.Allow{}:`);
lines.push(`      "Allow"`);
lines.push(`    case Gate.Decision.Deny{Gate.DenyReason.Terminal{}}:`);
lines.push(`      "Deny{Terminal}"`);
lines.push(`    case Gate.Decision.Deny{Gate.DenyReason.WrongActor{}}:`);
lines.push(`      "Deny{WrongActor}"`);
lines.push(`    case Gate.Decision.Deny{Gate.DenyReason.WrongLifecycle{}}:`);
lines.push(`      "Deny{WrongLifecycle}"`);
lines.push(`    case Gate.Decision.Deny{Gate.DenyReason.InsufficientEvidence{}}:`);
lines.push(`      "Deny{InsufficientEvidence}"`);
lines.push(``);
lines.push(`def row(as_: String, cs: String, ls: String, es: String,`);
lines.push(`          a: Gate.Actor, c: Gate.Capability, l: Gate.Lifecycle, e: Gate.Evidence) -> String:`);
lines.push(`  as_ ++ "|" ++ cs ++ "|" ++ ls ++ "|" ++ es ++ "=" ++ decision_tag(Gate.authorize(a, c, l, e))`);
lines.push(``);
lines.push(`def all_rows() -> String:`);

const cellLines: string[] = [];
for (const actor of ACTORS) {
  for (const cap of CAPABILITIES) {
    for (const lc of LIFECYCLES) {
      for (const ev of EVIDENCES) {
        cellLines.push("  " + cellRow(actor, cap, lc, ev) + " ++");
      }
    }
  }
}
// Last line should not have ++ but should still concatenate to a final "".
if (cellLines.length > 0) {
  cellLines[cellLines.length - 1] = cellLines[cellLines.length - 1].replace(/ \+\+$/, "");
}
lines.push(cellLines.join("\n"));
lines.push(``);
lines.push(`def main() -> String:`);
lines.push(`  all_rows()`);
lines.push(``);

writeFileSync(args.out, lines.join("\n"));
console.log(`wrote ${args.out} (${cellLines.length} cells)`);
