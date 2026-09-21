// Save self_test_results.json
import * as fs from "node:fs";
import * as path from "node:path";
import { ACT_ROOT } from "./_paths.ts";
const txt = fs.readFileSync(path.join(ACT_ROOT, "lab", "self_test_results.txt"), "utf8");
const lines = txt.split("\n");
const results: any[] = [];
for (const line of lines) {
  const m = /^\s*(PASS|FAIL)\s+(\d+\.[\w_]+)/.exec(line);
  if (m) results.push({ id: m[2], outcome: m[1] });
}
const pass = results.filter((r) => r.outcome === "PASS").length;
const fail = results.filter((r) => r.outcome === "FAIL").length;
const out = { act: "ACT-MRVN-QUALIFY10", total: results.length, pass, fail, results };
fs.writeFileSync(path.join(ACT_ROOT, "lab", "self_test_results.json"),
  JSON.stringify(out, null, 2));
console.log(`Wrote ${results.length} cases: ${pass} pass, ${fail} fail`);
