#!/usr/bin/env bun
// ACT-MRVN-04 matrix_compare.ts
//
// Runs `bun bend2/main.ts matrix_dump.bend` to get the canonical Bend
// impl's 180-cell projection, parses the output, and compares against
// lab/matrix.json cell-by-cell.  Exits non-zero on any divergence.
//
// This is the only authoritative cross-check of matrix.ts against the
// canonical Bend impl.  Spot checks are not enough.

import { spawn } from "bun";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const QUALIFY = resolve(ROOT, "..");
const FACTORY = resolve(QUALIFY, "..");
const REPO = resolve(FACTORY, "..");
const BEND = resolve(REPO, "bend2/main.ts");

async function runBendDump(): Promise<string> {
  const proc = spawn({
    cmd: ["bun", BEND, resolve(ROOT, "lab/matrix_dump.bend")],
    stdout: "pipe",
    stderr: "pipe",
    cwd: REPO,
  });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  await proc.exited;
  if (proc.exitCode !== 0) {
    throw new Error(`bend dump failed: exit=${proc.exitCode}\n${err}`);
  }
  // The dump is printed as a quoted String literal.  Strip the wrapping
  // quotes (Bend prints Strings with leading/trailing double quotes).
  const text = (out + err).trim();
  if (text.startsWith('"') && text.endsWith('"')) {
    return text.slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"');
  }
  return text;
}

function loadMatrix(): Record<string, string> {
  const m = JSON.parse(readFileSync(resolve(ROOT, "lab/matrix.json"), "utf-8"));
  const map: Record<string, string> = {};
  for (const cell of m.matrix) {
    const key = `${cell.actor}|${cell.capability}|${cell.lifecycle}|${cell.evidence}`;
    map[key] = cell.decision;
  }
  return map;
}

async function main() {
  const bendOut = await runBendDump();
  const bendRows = bendOut.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
  if (bendRows.length !== 180) {
    console.error(`FAIL: bend dump has ${bendRows.length} rows, expected 180`);
    process.exit(1);
  }
  const tsMap = loadMatrix();

  let diffs: { cell: string; bend: string; ts: string }[] = [];
  for (const row of bendRows) {
    const eq = row.indexOf("=");
    if (eq < 0) continue;
    const key = row.slice(0, eq);
    const bendDecision = row.slice(eq + 1);
    const tsDecision = tsMap[key];
    if (tsDecision === undefined) {
      diffs.push({ cell: key, bend: bendDecision, ts: "(missing)" });
    } else if (tsDecision !== bendDecision) {
      diffs.push({ cell: key, bend: bendDecision, ts: tsDecision });
    }
  }
  for (const [k, v] of Object.entries(tsMap)) {
    if (!bendRows.find((r) => r.startsWith(k + "="))) {
      diffs.push({ cell: k, bend: "(missing)", ts: v });
    }
  }

  console.log(`BEND_MATRIX_CELLS = ${bendRows.length}`);
  console.log(`TS_MATRIX_CELLS   = ${Object.keys(tsMap).length}`);
  console.log(`DIFF_COUNT        = ${diffs.length}`);

  if (diffs.length > 0) {
    console.log("");
    console.log("Differences (cell | bend | matrix.ts):");
    for (const d of diffs) {
      console.log(`  ${d.cell}  bend=${d.bend}  ts=${d.ts}`);
    }
    process.exit(1);
  }
  console.log("");
  console.log("PASS: matrix.ts matches canonical Bend impl at all 180 cells.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
