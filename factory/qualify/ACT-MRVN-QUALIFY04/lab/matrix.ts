#!/usr/bin/env bun
// ACT-MRVN-04 policy matrix enumeration.
//
// Mirrors authority-kernel/main.bend EXACTLY.  Cross-verified by
// running the Bend impl through matrix_driver.bend and comparing.

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");

type Actor = "Agent" | "Reviewer" | "Automation";
type Capability = "Work" | "Halt" | "Freeze" | "Close";
type Lifecycle = "Closed" | "Active" | "Halted" | "Draft" | "Frozen";
type Evidence = "None" | "Replay" | "Live";

interface Allow {}
interface Deny { reason: "Terminal" | "WrongActor" | "WrongLifecycle" | "InsufficientEvidence"; }
type Decision = Allow | Deny;

function authorize(
  actor: Actor,
  cap: Capability,
  lc: Lifecycle,
  ev: Evidence
): Decision {
  // Mirrors authority-kernel/main.bend EXACTLY, line-for-line.
  // The reason precedence in each per-capability helper is:
  //   Terminal > WrongActor > WrongLifecycle > InsufficientEvidence.

  if (cap === "Work") {
    if (actor === "Agent") {
      if (lc === "Active" || lc === "Draft" || lc === "Halted") return {};
      if (lc === "Closed") return { reason: "Terminal" };
      return { reason: "WrongLifecycle" }; // Frozen
    }
    if (actor === "Reviewer") {
      if (lc === "Active" || lc === "Draft" || lc === "Halted") return {};
      if (lc === "Closed") return { reason: "Terminal" };
      return { reason: "WrongLifecycle" }; // Frozen
    }
    // Automation
    if (lc === "Closed") return { reason: "Terminal" };
    if (lc === "Frozen") return { reason: "WrongLifecycle" };
    return { reason: "WrongActor" }; // Active/Draft/Halted
  }

  if (cap === "Halt") {
    if (actor === "Agent") {
      if (lc === "Closed") return { reason: "Terminal" };
      if (lc === "Active") return { reason: "WrongActor" };
      return { reason: "WrongLifecycle" }; // Draft/Halted/Frozen
    }
    if (lc === "Closed") return { reason: "Terminal" };
    if (lc === "Active") {
      if (ev === "None") return { reason: "InsufficientEvidence" };
      return {}; // Replay/Live
    }
    return { reason: "WrongLifecycle" }; // Draft/Halted/Frozen
  }

  if (cap === "Freeze") {
    if (actor === "Agent") {
      if (lc === "Closed") return { reason: "Terminal" };
      if (lc === "Active" || lc === "Halted") return { reason: "WrongActor" };
      return { reason: "WrongLifecycle" }; // Draft/Frozen
    }
    if (actor === "Automation") {
      if (lc === "Closed") return { reason: "Terminal" };
      if (lc === "Active" || lc === "Halted") return { reason: "WrongActor" };
      return { reason: "WrongLifecycle" }; // Draft/Frozen
    }
    // Reviewer
    if (lc === "Closed") return { reason: "Terminal" };
    if (lc === "Active" || lc === "Halted") {
      if (ev === "Live") return {};
      return { reason: "InsufficientEvidence" };
    }
    return { reason: "WrongLifecycle" }; // Draft/Frozen
  }

  // Close
  if (actor === "Agent") {
    if (lc === "Closed") return { reason: "Terminal" };
    if (lc === "Frozen") return { reason: "WrongActor" };
    return { reason: "WrongLifecycle" }; // Draft/Active/Halted
  }
  if (actor === "Automation") {
    if (lc === "Closed") return { reason: "Terminal" };
    if (lc === "Frozen") return { reason: "WrongActor" };
    return { reason: "WrongLifecycle" }; // Draft/Active/Halted
  }
  // Reviewer
  if (lc === "Closed") return { reason: "Terminal" };
  if (lc === "Frozen") {
    if (ev === "Live") return {};
    return { reason: "InsufficientEvidence" };
  }
  return { reason: "WrongLifecycle" }; // Draft/Active/Halted
}

const ACTORS: Actor[] = ["Agent", "Reviewer", "Automation"];
const CAPS: Capability[] = ["Work", "Halt", "Freeze", "Close"];
const LIFECYCLES: Lifecycle[] = ["Closed", "Active", "Halted", "Draft", "Frozen"];
const EVIDENCES: Evidence[] = ["None", "Replay", "Live"];

const matrix: any[] = [];
let allowCount = 0;
const denyByReason: Record<string, number> = {
  Terminal: 0, WrongActor: 0, WrongLifecycle: 0, InsufficientEvidence: 0,
};

for (const a of ACTORS) {
  for (const c of CAPS) {
    for (const l of LIFECYCLES) {
      for (const e of EVIDENCES) {
        const d = authorize(a, c, l, e);
        const isAllow = !("reason" in d);
        if (isAllow) {
          allowCount++;
        } else {
          denyByReason[d.reason]++;
        }
        matrix.push({
          actor: a,
          capability: c,
          lifecycle: l,
          evidence: e,
          decision: isAllow ? "Allow" : `Deny{${d.reason}}`,
        });
      }
    }
  }
}

const out = {
  total_cells: matrix.length,
  allow_count: allowCount,
  deny_count: matrix.length - allowCount,
  deny_by_reason: denyByReason,
  matrix,
};

const outPath = resolve(ROOT, "lab/matrix.json");
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`180-cell matrix written to ${outPath}`);
console.log(`Allows: ${allowCount}, Denies: ${matrix.length - allowCount}`);
console.log(`By reason:`, JSON.stringify(denyByReason));
