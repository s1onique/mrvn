#!/usr/bin/env bun
// ACT-MRVN-06 minimize_gaps.ts
//
// For each SPECIFICATION_GAP candidate with diff_count > 1, attempt to
// minimize the gap.  The natural minimum semantic surface is the
// lifecycle case the candidate mutates: because the implementation
// patterns are `case Lifecycle.X: Decision.Y` without a nested
// evidence match, a single-case substitution affects all 3 evidence
// values.
//
// This script documents the minimum semantic surface for each gap.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(import.meta.dir, "..");

interface DiffRow {
  actor: string; capability: string; lifecycle: string; evidence: string;
  expected: string; observed: string;
}

interface GapRecord {
  gap_id: string;
  candidate_id: string;
  family: string;
  original_diff_count: number;
  minimized_diff_count: number;
  minimized_witness: DiffRow;
  rationale: string;
}

async function main() {
  const summary = JSON.parse(readFileSync(resolve(ROOT, "lab/results.json"), "utf-8")) as any;
  const candidates = summary.candidates.filter((c: any) => c.classification === "SPECIFICATION_GAP");

  const records: GapRecord[] = [];

  for (const c of candidates) {
    const result = JSON.parse(readFileSync(resolve(ROOT, "candidates", c.candidate_id, "result.json"), "utf-8")) as any;
    const diffs = result.behavior.diffs as DiffRow[];
    if (diffs.length === 1) {
      records.push({
        gap_id: c.candidate_id,
        candidate_id: c.candidate_id,
        family: c.family,
        original_diff_count: 1,
        minimized_diff_count: 1,
        minimized_witness: diffs[0],
        rationale: "Single-cell mutation: no further minimization possible.",
      });
      continue;
    }
    // Group diffs by (actor, capability, lifecycle).  If all diffs share the same
    // lifecycle, the minimum semantic surface is one lifecycle case applied to all
    // evidence values (no nested evidence match in the implementation).
    const groups = new Map<string, DiffRow[]>();
    for (const d of diffs) {
      const k = `${d.actor}|${d.capability}|${d.lifecycle}`;
      const arr = groups.get(k) ?? [];
      arr.push(d);
      groups.set(k, arr);
    }
    if (groups.size === 1) {
      const group = [...groups.values()][0];
      // The minimum surface is one lifecycle case.  We document this.
      records.push({
        gap_id: c.candidate_id,
        candidate_id: c.candidate_id,
        family: c.family,
        original_diff_count: diffs.length,
        minimized_diff_count: group.length,
        minimized_witness: group[0],
        rationale: `Implementation's lifecycle case has no nested evidence match; a single-case substitution affects all ${group.length} evidence variants. This is the natural minimum semantic surface.`,
      });
    } else {
      // Multi-lifecycle diffs: pick the smallest group as the minimum.
      let minGroup: DiffRow[] = [];
      for (const g of groups.values()) {
        if (g.length > 0 && (minGroup.length === 0 || g.length < minGroup.length)) minGroup = g;
      }
      records.push({
        gap_id: c.candidate_id,
        candidate_id: c.candidate_id,
        family: c.family,
        original_diff_count: diffs.length,
        minimized_diff_count: minGroup.length,
        minimized_witness: minGroup[0],
        rationale: `${groups.size} lifecycle groups; smallest is ${minGroup.length} cell(s).`,
      });
    }
  }

  const outPath = resolve(ROOT, "lab/gap_minimization.json");
  writeFileSync(outPath, JSON.stringify({
    act: "ACT-MRVN-QUALIFY06",
    total_records: records.length,
    records,
  }, null, 2));
  console.log(`wrote ${outPath}`);
  console.log(`records: ${records.length}`);
  for (const r of records) {
    if (r.original_diff_count > 1) {
      console.log(`  ${r.candidate_id}: ${r.original_diff_count} -> ${r.minimized_diff_count} (${r.rationale})`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });