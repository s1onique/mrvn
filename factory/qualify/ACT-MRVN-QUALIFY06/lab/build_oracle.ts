#!/usr/bin/env bun
// ACT-MRVN-06 build_oracle.ts
//
// Deterministic finite projection of INTENT.md over the 3*4*5*3 = 180
// decision cells.  Produces intent/oracle.json.
//
// Discipline:
//   * Walk every cell in a fixed canonical order:
//     for actor in [Agent, Reviewer, Automation]
//       for capability in [Work, Halt, Freeze, Close]
//         for lifecycle in [Closed, Active, Halted, Draft, Frozen]
//           for evidence in [None, Replay, Live]
//   * Apply the intended policy EXACTLY as described in INTENT.md.
//   * No hash-based reasoning; no dependence on Bend; no dependence on
//     the canonical implementation.
//   * Output is byte-deterministic: keys sorted alphabetically,
//     indentation fixed, no trailing whitespace.
//
// Run:
//   bun factory/qualify/ACT-MRVN-QUALIFY06/lab/build_oracle.ts \
//     --out factory/qualify/ACT-MRVN-QUALIFY06/intent/oracle.json

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

// Canonical enumeration order.  FIXED across runs.
const ACTORS = ["Agent", "Reviewer", "Automation"] as const;
const CAPABILITIES = ["Work", "Halt", "Freeze", "Close"] as const;
const LIFECYCLES = ["Closed", "Active", "Halted", "Draft", "Frozen"] as const;
const EVIDENCES = ["None", "Replay", "Live"] as const;

type Actor = typeof ACTORS[number];
type Capability = typeof CAPABILITIES[number];
type Lifecycle = typeof LIFECYCLES[number];
type Evidence = typeof EVIDENCES[number];
type Reason = "Terminal" | "WrongActor" | "WrongLifecycle" | "InsufficientEvidence";
type Decision = { kind: "Allow" } | { kind: "Deny"; reason: Reason };

function decide(a: Actor, c: Capability, l: Lifecycle, e: Evidence): Decision {
  // Reason precedence: Terminal > WrongLifecycle > WrongActor > InsufficientEvidence.
  // (For Work, the precedence is Terminal > WrongLifecycle > WrongActor.)
  // Closed lifecycle is ALWAYS Terminal, regardless of other dimensions.
  if (l === "Closed") return { kind: "Deny", reason: "Terminal" };

  switch (c) {
    case "Work": {
      // Work is allowed iff actor in {Agent, Reviewer} AND lifecycle in {Draft, Active, Halted}.
      if (l === "Frozen") return { kind: "Deny", reason: "WrongLifecycle" };
      if (a === "Automation") return { kind: "Deny", reason: "WrongActor" };
      return { kind: "Allow" };
    }
    case "Halt": {
      // Halt is allowed iff lifecycle == Active AND actor in {Reviewer, Automation} AND evidence in {Replay, Live}.
      if (l !== "Active") return { kind: "Deny", reason: "WrongLifecycle" };
      if (a === "Agent") return { kind: "Deny", reason: "WrongActor" };
      if (e === "None") return { kind: "Deny", reason: "InsufficientEvidence" };
      return { kind: "Allow" };
    }
    case "Freeze": {
      // Freeze is allowed iff actor == Reviewer AND lifecycle in {Active, Halted} AND evidence == Live.
      // Precedence (per canonical impl): lifecycle, then actor, then evidence.
      if (l !== "Active" && l !== "Halted") return { kind: "Deny", reason: "WrongLifecycle" };
      if (a !== "Reviewer") return { kind: "Deny", reason: "WrongActor" };
      if (e !== "Live") return { kind: "Deny", reason: "InsufficientEvidence" };
      return { kind: "Allow" };
    }
    case "Close": {
      // Close is allowed iff actor == Reviewer AND lifecycle == Frozen AND evidence == Live.
      // Precedence (per canonical impl): lifecycle, then actor, then evidence.
      if (l !== "Frozen") return { kind: "Deny", reason: "WrongLifecycle" };
      if (a !== "Reviewer") return { kind: "Deny", reason: "WrongActor" };
      if (e !== "Live") return { kind: "Deny", reason: "InsufficientEvidence" };
      return { kind: "Allow" };
    }
  }
}

function decideString(d: Decision): string {
  return d.kind === "Allow" ? "Allow" : `Deny{${d.reason}}`;
}

interface OracleRow {
  actor: Actor;
  capability: Capability;
  lifecycle: Lifecycle;
  evidence: Evidence;
  decision: string;
  decision_struct: Decision;
}

// Build all 180 rows in canonical order.
const rows: OracleRow[] = [];
for (const actor of ACTORS) {
  for (const cap of CAPABILITIES) {
    for (const lc of LIFECYCLES) {
      for (const ev of EVIDENCES) {
        const d = decide(actor, cap, lc, ev);
        rows.push({
          actor, capability: cap, lifecycle: lc, evidence: ev,
          decision: decideString(d),
          decision_struct: d,
        });
      }
    }
  }
}

if (rows.length !== 180) {
  throw new Error(`BUG: oracle has ${rows.length} rows, expected 180`);
}

// Counters for sanity / EVIDENCE.md E.2
let allowCount = 0;
const denyByReason: Record<Reason, number> = {
  Terminal: 0, WrongActor: 0, WrongLifecycle: 0, InsufficientEvidence: 0,
};
for (const r of rows) {
  if (r.decision_struct.kind === "Allow") allowCount++;
  else denyByReason[r.decision_struct.reason]++;
}

// ---------- CLI ----------

function parseArgs(argv: string[]): { out: string } {
  const out: Partial<{ out: string }> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") out.out = argv[++i];
    else throw new Error("unknown flag: " + a);
  }
  if (!out.out) throw new Error("missing --out");
  return out as { out: string };
}

const args = parseArgs(process.argv.slice(2));

// Build canonical-form JSON (no whitespace, keys sorted) for sha256.
function canonical(o: unknown): string {
  if (o === null) return "null";
  if (typeof o === "boolean") return o ? "true" : "false";
  if (typeof o === "number") return JSON.stringify(o);
  if (typeof o === "string") return JSON.stringify(o);
  if (Array.isArray(o)) return "[" + o.map((x) => canonical(x)).join(",") + "]";
  if (typeof o === "object") {
    const obj = o as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonical(obj[k])).join(",") + "}";
  }
  throw new Error("unsupported type: " + typeof o);
}

const intentTextPath = resolve(args.out, "..", "INTENT.md");
const oracle = {
  act: "ACT-MRVN-QUALIFY06",
  intent_file: "INTENT.md",
  intent_text_sha256: createHash("sha256").update(readFileSync(intentTextPath)).digest("hex"),
  cell_count: rows.length,
  allow_count: allowCount,
  deny_count: rows.length - allowCount,
  deny_by_reason: denyByReason,
  rows,
};

// Deterministic pretty output.
function pretty(o: unknown, indent: number = 0): string {
  const pad = "  ".repeat(indent);
  const inner = "  ".repeat(indent + 1);
  if (o === null) return "null";
  if (typeof o === "boolean" || typeof o === "number" || typeof o === "string") {
    return JSON.stringify(o);
  }
  if (Array.isArray(o)) {
    if (o.length === 0) return "[]";
    const items = o.map((x) => inner + pretty(x, indent + 1)).join(",\n");
    return "[\n" + items + "\n" + pad + "]";
  }
  if (typeof o === "object") {
    const obj = o as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const items = keys.map((k) =>
      inner + JSON.stringify(k) + ": " + pretty(obj[k], indent + 1)
    ).join(",\n");
    return "{\n" + items + "\n" + pad + "}";
  }
  return JSON.stringify(o);
}

writeFileSync(args.out, pretty(oracle) + "\n");

const oracleCanon = canonical(oracle);
const oracleSha = createHash("sha256").update(oracleCanon).digest("hex");

console.log("=== ACT-MRVN-06 oracle builder ===");
console.log(`out:           ${args.out}`);
console.log(`cells:         ${rows.length}`);
console.log(`allow_count:   ${allowCount}`);
console.log(`deny_by_reason: ${JSON.stringify(denyByReason)}`);
console.log(`intent_sha256: ${oracle.intent_text_sha256}`);
console.log(`oracle_sha256: ${oracleSha}`);
