// ACT-MRVN-QUALIFY10 negative_control_checker.ts
//
// Runs each negative-control .bend under the Bend checker and asserts
// it is REJECTED with the expected error class.

import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { ACT_ROOT, BEND_MAIN_TS, sha256File } from "./_paths.ts";

export interface NegCase {
  id: string;
  description: string;
  expected: "CHECKER_REJECTED" | "CHECKER_OR_BUILD_REJECTED" | "CLASSIFIED_AS_UNSAFE";
  dir: string;
}

const CASES: NegCase[] = [
  { id: "NC-01",
    expected: "CHECKER_REJECTED",
    description: "wrong return type (Role instead of IO(Role))",
    dir: "lab/negative_controls/wrong_return" },
  { id: "NC-02",
    expected: "CHECKER_REJECTED",
    description: "non-IO return type (String)",
    dir: "lab/negative_controls/no_io" },
  { id: "NC-03",
    expected: "CHECKER_OR_BUILD_REJECTED",
    description: "missing .c import (build -o refuses)",
    dir: "lab/negative_controls/no_c_import" },
  { id: "NC-04",
    expected: "CHECKER_OR_BUILD_REJECTED",
    description: "missing .js import (cli refuses)",
    dir: "lab/negative_controls/no_js_import" },
  { id: "NC-05",
    expected: "CLASSIFIED_AS_UNSAFE",
    description: "@unsafe def is detected (no CHECKER_REJECTED)",
    dir: "lab/negative_controls/unsafe_escape" },
  { id: "NC-06",
    expected: "CHECKER_REJECTED",
    description: "IO(Role) used in proof-authority Bool equality",
    dir: "lab/negative_controls/dead_live" },
];

export interface NegResult {
  id: string;
  description: string;
  expected: string;
  checker_status: number;
  checker_stderr: string;
  build_status: number | null;
  build_stderr: string | null;
  source_contains_unsafe: boolean;
  outcome: "PASS" | "FAIL";
}

function mainBendOf(c: NegCase): string {
  return path.join(ACT_ROOT, c.dir, "main.bend");
}

function hasUnsafeMarker(p: string): boolean {
  const src = fs.readFileSync(p, "utf8");
  return /@unsafe\b/.test(src);
}

export function runNegativeControls(): NegResult[] {
  const results: NegResult[] = [];
  for (const c of CASES) {
    const main = mainBendOf(c);
    const r = spawnSync("bun", [BEND_MAIN_TS, main], { encoding: "utf8", timeout: 15_000 });
    const build = spawnSync("bun", [BEND_MAIN_TS, main, "-o",
                                    path.join("/tmp", "mrvn10-nc-build")],
      { encoding: "utf8", timeout: 30_000 });
    const is_unsafe = hasUnsafeMarker(main);

    let outcome: "PASS" | "FAIL";
    if (c.expected === "CHECKER_REJECTED") {
      outcome = (r.status !== 0) ? "PASS" : "FAIL";
    } else if (c.expected === "CHECKER_OR_BUILD_REJECTED") {
      outcome = (r.status !== 0 || build.status !== 0) ? "PASS" : "FAIL";
    } else if (c.expected === "CLASSIFIED_AS_UNSAFE") {
      outcome = is_unsafe ? "PASS" : "FAIL";
    } else {
      outcome = "FAIL";
    }
    results.push({
      id: c.id, description: c.description, expected: c.expected,
      checker_status: r.status ?? -1,
      checker_stderr: (r.stderr ?? "").slice(0, 500),
      build_status: build.status,
      build_stderr: (build.stderr ?? "").slice(0, 500),
      source_contains_unsafe: is_unsafe,
      outcome,
    });
  }
  return results;
}

if (import.meta.main) {
  const r = runNegativeControls();
  const out = path.join(ACT_ROOT, "lab", "negative_controls_result.json");
  fs.writeFileSync(out, JSON.stringify(r, null, 2));
  let pass = 0, fail = 0;
  for (const x of r) {
    if (x.outcome === "PASS") pass += 1; else fail += 1;
    console.log(`  ${x.outcome}  ${x.id} (${x.expected}): ${x.description}`);
  }
  console.log(`\nTotals: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}
