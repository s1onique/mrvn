#!/usr/bin/env bun
// ACT-MRVN-06 build_manifest.ts
//
// Generates lab/candidates.json from a compact inline spec.

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const CANONICAL_LAWS_SHA = "2d380496421c5965819d2668f75e1b486fdf4a9d242cbf9b07185179be500dd9";
const INTENT_ORACLE_SHA = "a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9";

function sub(fn: string, a: string, lc: string, ev: string, from: string, to: string) {
  return { type: "DENY_REASON_SUBSTITUTE", function: fn, actor: a, lifecycle: lc, evidence: ev, from_reason: from, to_reason: to };
}
function allow2deny(fn: string, a: string, lc: string, ev: string, to: string) {
  return { type: "ALLOW_TO_DENY", function: fn, actor: a, lifecycle: lc, evidence: ev, to_reason: to };
}
function deny2allow(fn: string, a: string, lc: string, ev: string) {
  return { type: "DENY_TO_ALLOW", function: fn, actor: a, lifecycle: lc, evidence: ev };
}

interface Spec {
  candidate_id: string;
  family: string;
  description: string;
  expected_class?: string;
  law_refutation_witness?: string;
  law_refutation_expected?: string;
  mutations: any[];
}

const candidates: Spec[] = [];

// Controls.
candidates.push({ candidate_id: "CAND-MRVN06-CTRL-IDENT", family: "CONTROL",
  description: "Identical-implementation control.",
  expected_class: "EQUIVALENT_SURVIVOR", mutations: [] });
candidates.push({ candidate_id: "CAND-MRVN06-CTRL-NEG", family: "CONTROL",
  description: "Negative control: Agent + Freeze + Active + Live -> Allow (must be LAW_REFUTED).",
  expected_class: "LAW_REFUTED",
  law_refutation_witness: "Agent,Freeze,Active,Live",
  law_refutation_expected: "Deny{WrongActor}",
  mutations: [deny2allow("freeze_decision", "Agent", "Active", "Live")] });
candidates.push({ candidate_id: "CAND-MRVN06-CONTROL-KNOWN", family: "KNOWN_GAP_CONTROL",
  description: "Known-gap positive control (MRVN-04 MUT-08 shape).",
  expected_class: "SPECIFICATION_GAP",
  mutations: [sub("close_decision", "Reviewer", "Frozen", "Replay", "InsufficientEvidence", "Terminal")] });

// Family A.
candidates.push({ candidate_id: "CAND-MRVN06-A01", family: "DENY_REASON",
  description: "A.01: Reviewer + Halt + Active + None -> WrongActor.  Catches LAW-012 (halt_active_reviewer_none_yields_insufficient_evidence) — MUST be LAW_REFUTED.",
  expected_class: "LAW_REFUTED",
  law_refutation_witness: "Reviewer,Halt,Active,None",
  law_refutation_expected: "Deny{InsufficientEvidence}",
  mutations: [sub("halt_decision", "Reviewer", "Active", "None", "InsufficientEvidence", "WrongActor")] });
candidates.push({ candidate_id: "CAND-MRVN06-A02", family: "DENY_REASON",
  description: "A.02: Agent + Halt + Active + None -> InsufficientEvidence.  MUST be LAW_REFUTED.",
  expected_class: "LAW_REFUTED",
  law_refutation_witness: "Agent,Halt,Active,None",
  law_refutation_expected: "Deny{WrongActor}",
  mutations: [sub("halt_decision", "Agent", "Active", "None", "WrongActor", "InsufficientEvidence")] });
candidates.push({ candidate_id: "CAND-MRVN06-A03", family: "DENY_REASON",
  description: "A.03: Reviewer + Close + Frozen + None -> WrongLifecycle.",
  mutations: [sub("close_decision", "Reviewer", "Frozen", "None", "InsufficientEvidence", "WrongLifecycle")] });
candidates.push({ candidate_id: "CAND-MRVN06-A04", family: "DENY_REASON",
  description: "A.04: Reviewer + Freeze + Active + Replay -> WrongActor.",
  mutations: [sub("freeze_decision", "Reviewer", "Active", "Replay", "InsufficientEvidence", "WrongActor")] });
candidates.push({ candidate_id: "CAND-MRVN06-A05", family: "DENY_REASON",
  description: "A.05: Agent + Close + Frozen + Live -> WrongLifecycle.",
  mutations: [sub("close_decision", "Agent", "Frozen", "Live", "WrongActor", "WrongLifecycle")] });
candidates.push({ candidate_id: "CAND-MRVN06-A06", family: "DENY_REASON",
  description: "A.06: Automation + Halt + Active + None -> WrongActor.",
  mutations: [sub("halt_decision", "Automation", "Active", "None", "InsufficientEvidence", "WrongActor")] });
candidates.push({ candidate_id: "CAND-MRVN06-A07", family: "DENY_REASON",
  description: "A.07: Agent + Work + Frozen + Live -> WrongActor.",
  mutations: [sub("work_decision", "Agent", "Frozen", "Live", "WrongLifecycle", "WrongActor")] });
candidates.push({ candidate_id: "CAND-MRVN06-A08", family: "DENY_REASON",
  description: "A.08: Reviewer + Freeze + Frozen + Live -> WrongLifecycle (no-op substitute).",
  mutations: [sub("freeze_decision", "Reviewer", "Frozen", "Live", "WrongLifecycle", "WrongLifecycle")] });

// Family B.
candidates.push({ candidate_id: "CAND-MRVN06-B01", family: "EVIDENCE",
  description: "B.01: Reviewer + Close + Frozen + Replay -> WrongActor.",
  mutations: [sub("close_decision", "Reviewer", "Frozen", "Replay", "InsufficientEvidence", "WrongActor")] });
candidates.push({ candidate_id: "CAND-MRVN06-B02", family: "EVIDENCE",
  description: "B.02: Reviewer + Close + Frozen + None -> WrongActor.",
  mutations: [sub("close_decision", "Reviewer", "Frozen", "None", "InsufficientEvidence", "WrongActor")] });
candidates.push({ candidate_id: "CAND-MRVN06-B03", family: "EVIDENCE",
  description: "B.03: Reviewer + Freeze + Active + None -> WrongLifecycle.",
  mutations: [sub("freeze_decision", "Reviewer", "Active", "None", "InsufficientEvidence", "WrongLifecycle")] });
candidates.push({ candidate_id: "CAND-MRVN06-B04", family: "EVIDENCE",
  description: "B.04: Reviewer + Freeze + Halted + None -> WrongLifecycle.",
  mutations: [sub("freeze_decision", "Reviewer", "Halted", "None", "InsufficientEvidence", "WrongLifecycle")] });

// Family C.
candidates.push({ candidate_id: "CAND-MRVN06-C01", family: "ACTOR",
  description: "C.01: Agent + Close + Frozen + Live -> WrongLifecycle.",
  mutations: [sub("close_decision", "Agent", "Frozen", "Live", "WrongActor", "WrongLifecycle")] });
candidates.push({ candidate_id: "CAND-MRVN06-C02", family: "ACTOR",
  description: "C.02: Automation + Freeze + Active + Live -> WrongLifecycle.",
  mutations: [sub("freeze_decision", "Automation", "Active", "Live", "WrongActor", "WrongLifecycle")] });
candidates.push({ candidate_id: "CAND-MRVN06-C03", family: "ACTOR",
  description: "C.03: Agent + Freeze + Halted + Live -> WrongLifecycle.",
  mutations: [sub("freeze_decision", "Agent", "Halted", "Live", "WrongActor", "WrongLifecycle")] });
candidates.push({ candidate_id: "CAND-MRVN06-C04", family: "ACTOR",
  description: "C.04: Automation + Close + Frozen + Live -> WrongLifecycle.",
  mutations: [sub("close_decision", "Automation", "Frozen", "Live", "WrongActor", "WrongLifecycle")] });

// Family D.
candidates.push({ candidate_id: "CAND-MRVN06-D01", family: "LIFECYCLE",
  description: "D.01: Agent + Work + Frozen + Live -> WrongActor.",
  mutations: [sub("work_decision", "Agent", "Frozen", "Live", "WrongLifecycle", "WrongActor")] });
candidates.push({ candidate_id: "CAND-MRVN06-D02", family: "LIFECYCLE",
  description: "D.02: Reviewer + Halt + Halted + Live -> InsufficientEvidence.",
  mutations: [sub("halt_decision", "Reviewer", "Halted", "Live", "WrongLifecycle", "InsufficientEvidence")] });
candidates.push({ candidate_id: "CAND-MRVN06-D03", family: "LIFECYCLE",
  description: "D.03: Automation + Halt + Draft + Live -> InsufficientEvidence.",
  mutations: [sub("halt_decision", "Automation", "Draft", "Live", "WrongLifecycle", "InsufficientEvidence")] });
candidates.push({ candidate_id: "CAND-MRVN06-D04", family: "LIFECYCLE",
  description: "D.04: Agent + Halt + Halted + Live -> InsufficientEvidence.",
  mutations: [sub("halt_decision", "Agent", "Halted", "Live", "WrongLifecycle", "InsufficientEvidence")] });

// Family E.
candidates.push({ candidate_id: "CAND-MRVN06-E01", family: "PRECEDENCE",
  description: "E.01: Reviewer + Halt + Active + Live -> Deny{WrongActor}.  MUST be LAW_REFUTED.",
  expected_class: "LAW_REFUTED",
  law_refutation_witness: "Reviewer,Halt,Active,Live",
  law_refutation_expected: "Allow",
  mutations: [allow2deny("halt_decision", "Reviewer", "Active", "Live", "WrongActor")] });
candidates.push({ candidate_id: "CAND-MRVN06-E02", family: "PRECEDENCE",
  description: "E.02: Agent + Halt + Active + Live -> Allow.  MUST be LAW_REFUTED.",
  expected_class: "LAW_REFUTED",
  law_refutation_witness: "Agent,Halt,Active,Live",
  law_refutation_expected: "Deny{WrongActor}",
  mutations: [deny2allow("halt_decision", "Agent", "Active", "Live")] });
candidates.push({ candidate_id: "CAND-MRVN06-E03", family: "PRECEDENCE",
  description: "E.03: Reviewer + Work + Frozen + Live -> Allow.  MUST be LAW_REFUTED.",
  expected_class: "LAW_REFUTED",
  law_refutation_witness: "Reviewer,Work,Frozen,Live",
  law_refutation_expected: "Deny{WrongLifecycle}",
  mutations: [deny2allow("work_decision", "Reviewer", "Frozen", "Live")] });
candidates.push({ candidate_id: "CAND-MRVN06-E04", family: "PRECEDENCE",
  description: "E.04: Reviewer + Close + Frozen + Replay -> Allow.  MUST be LAW_REFUTED.",
  expected_class: "LAW_REFUTED",
  law_refutation_witness: "Reviewer,Close,Frozen,Replay",
  law_refutation_expected: "Deny{InsufficientEvidence}",
  mutations: [deny2allow("close_decision", "Reviewer", "Frozen", "Replay")] });
candidates.push({ candidate_id: "CAND-MRVN06-E05", family: "PRECEDENCE",
  description: "E.05: Agent + Work + Active + Live -> Deny{WrongLifecycle}.  MUST be LAW_REFUTED.",
  expected_class: "LAW_REFUTED",
  law_refutation_witness: "Agent,Work,Active,Live",
  law_refutation_expected: "Allow",
  mutations: [allow2deny("work_decision", "Agent", "Active", "Live", "WrongLifecycle")] });

const manifest = {
  act: "ACT-MRVN-QUALIFY06",
  canonical_laws_sha256: CANONICAL_LAWS_SHA,
  intent_oracle_sha256: INTENT_ORACLE_SHA,
  notes: [
    "Every candidate uses LAWS.bend byte-identical to the canonical MRVN-04 law book.",
    "The manifest declares only mutation intent, NOT expected outcome (per ACT §20).",
    "Controls (CTRL-*) and the known-gap control carry expected_class.  Blind-search candidates do NOT.",
  ],
  candidates: candidates.map((c) => ({
    candidate_id: c.candidate_id,
    family: c.family,
    description: c.description,
    expected_class: c.expected_class,
    descriptor: {
      candidate_id: c.candidate_id,
      family: c.family,
      mutations: c.mutations,
      law_refutation_witness: c.law_refutation_witness,
      law_refutation_expected: c.law_refutation_expected,
    },
  })),
};

writeFileSync(resolve(ROOT, "lab/candidates.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`wrote candidates.json: ${candidates.length} candidates`);
console.log(`by family: ${JSON.stringify(
  candidates.reduce((acc: any, c) => { acc[c.family] = (acc[c.family] || 0) + 1; return acc; }, {})
)}`);
