#!/usr/bin/env bun
// ACT-MRVN-06 canonical_compare.ts
//
// Runs the canonical Bend impl (authority-kernel/main.bend) against
// the frozen oracle and reports any divergence.  Exits non-zero if
// canonical implementation disagrees with the intent baseline.
//
// Discipline:
//   * Use gen_behavior_driver.ts to produce the 180-row Bend dump.
//   * Run `bun bend2/main.ts <dump>` and capture stdout.
//   * Strip Bend's string quoting (leading/trailing ").
//   * Parse the rows into a map and compare to oracle rows.

import { spawn } from "bun";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(import.meta.dir, "..");
const FACTORY = resolve(ROOT, "..", "..");
const REPO = resolve(FACTORY, "..");
const BEND = resolve(REPO, "bend2/main.ts");
const IMPL = resolve(ROOT, "authority-kernel/main.bend");
const ORACLE = resolve(ROOT, "intent/oracle.json");
const DUMP = resolve(ROOT, "lab/_canonical_dump.bend");

interface OracleRow {
  actor: string; capability: string; lifecycle: string; evidence: string;
  decision: string;
}

async function main() {
  // Step 1: regenerate the dump.
  const gen = spawn({
    cmd: ["bun", resolve(ROOT, "lab/gen_behavior_driver.ts"), "--impl", IMPL, "--out", DUMP],
    stdout: "pipe", stderr: "pipe",
  });
  const genOut = await new Response(gen.stdout).text();
  const genErr = await new Response(gen.stderr).text();
  await gen.exited;
  if (gen.exitCode !== 0) {
    console.error("gen_behavior_driver failed:");
    console.error(genErr);
    process.exit(2);
  }

  // Step 2: run the Bend dump.
  const proc = spawn({
    cmd: ["bun", BEND, DUMP],
    stdout: "pipe", stderr: "pipe",
    cwd: REPO,
  });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  await proc.exited;
  if (proc.exitCode !== 0) {
    console.error("Bend dump failed:");
    console.error(err);
    process.exit(2);
  }
  const text = (out + err).trim();
  if (!(text.startsWith('"') && text.endsWith('"'))) {
    console.error("FAIL: dump output is not a quoted string literal");
    process.exit(2);
  }
  const body = text.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"');
  const rows = body.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
  if (rows.length !== 180) {
    console.error(`FAIL: dump has ${rows.length} rows, expected 180`);
    process.exit(2);
  }

  // Step 3: parse oracle.
  const oracle = JSON.parse(readFileSync(ORACLE, "utf-8")) as {
    rows: OracleRow[]; cell_count: number;
    intent_text_sha256: string; allow_count: number;
    deny_by_reason: Record<string, number>;
  };
  if (oracle.cell_count !== 180) {
    console.error(`FAIL: oracle has ${oracle.cell_count} cells, expected 180`);
    process.exit(2);
  }
  const oracleMap = new Map<string, string>();
  for (const r of oracle.rows) {
    oracleMap.set(`${r.actor}|${r.capability}|${r.lifecycle}|${r.evidence}`, r.decision);
  }

  // Step 4: parse dump and compare.
  const bendMap = new Map<string, string>();
  for (const row of rows) {
    const eq = row.indexOf("=");
    if (eq < 0) continue;
    const key = row.slice(0, eq);
    const dec = row.slice(eq + 1);
    bendMap.set(key, dec);
  }

  let diffCount = 0;
  const diffs: { key: string; oracle: string; bend: string }[] = [];
  for (const [k, oracleDec] of oracleMap) {
    const bendDec = bendMap.get(k);
    if (bendDec === undefined) {
      diffs.push({ key: k, oracle: oracleDec, bend: "(missing)" });
      diffCount++;
    } else if (bendDec !== oracleDec) {
      diffs.push({ key: k, oracle: oracleDec, bend: bendDec });
      diffCount++;
    }
  }
  for (const [k, bendDec] of bendMap) {
    if (!oracleMap.has(k)) {
      diffs.push({ key: k, oracle: "(missing)", bend: bendDec });
      diffCount++;
    }
  }

  console.log("=== ACT-MRVN-06 canonical vs intent baseline ===");
  console.log(`oracle_cells: ${oracle.cell_count}`);
  console.log(`bend_cells:   ${bendMap.size}`);
  console.log(`diff_count:   ${diffCount}`);
  console.log(`oracle_sha256: ${createHash("sha256").update(readFileSync(ORACLE)).digest("hex")}`);
  console.log(`intent_text_sha256: ${oracle.intent_text_sha256}`);
  console.log(`oracle allow:    ${oracle.allow_count}`);
  console.log(`oracle deny_by_reason: ${JSON.stringify(oracle.deny_by_reason)}`);

  if (diffCount > 0) {
    console.error("FAIL: canonical implementation disagrees with intent oracle.");
    for (const d of diffs.slice(0, 30)) {
      console.error(`  ${d.key}  oracle=${d.oracle}  bend=${d.bend}`);
    }
    if (diffs.length > 30) {
      console.error(`  ... and ${diffs.length - 30} more.`);
    }
    process.exit(1);
  }
  console.log("PASS: canonical implementation agrees with intent oracle at 180/180 cells.");
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
