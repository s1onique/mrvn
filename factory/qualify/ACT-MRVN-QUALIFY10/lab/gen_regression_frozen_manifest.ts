// ACT-MRVN-QUALIFY10 gen_regression_frozen_manifest.ts
//
// CORRECTION01: capture a whole-tree frozen manifest of every tracked
// file under factory/qualify/ACT-MRVN-QUALIFY{04..09}/.  This is the
// new regression-hygiene ground truth: not 8 sampled files, but the
// entire tree of each prior ACT.
//
// Run once at the start of MRVN-10 (after verifying git HEAD is on
// the freeze commit).  Any future drift = a prior ACT changed.
//
// We enumerate via `git ls-tree -r HEAD -- <dir>` for git-tracked
// files.  If git is unavailable, we fall back to walking the
// filesystem (less authoritative but still per-file content
// addressed).

import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { ACT_ROOT, REPO_ROOT } from "./_paths.ts";

interface WatchedFile {
  label: string;
  path: string;
  frozen_sha256: string;
}

const PRIOR_ACTS = [
  "factory/qualify/ACT-MRVN-QUALIFY04",
  "factory/qualify/ACT-MRVN-QUALIFY05",
  "factory/qualify/ACT-MRVN-QUALIFY06",
  "factory/qualify/ACT-MRVN-QUALIFY07",
  "factory/qualify/ACT-MRVN-QUALIFY08",
  "factory/qualify/ACT-MRVN-QUALIFY09",
];

function sha256File(p: string): string {
  return createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function listGitTrackedFiles(dir: string): string[] {
  try {
    const out = execFileSync("git", ["ls-tree", "-r", "HEAD", "--", dir],
      { cwd: REPO_ROOT, encoding: "utf8" });
    const lines = out.trim().split("\n").filter((l) => l.length > 0);
    return lines.map((l) => {
      const parts = l.split("\t");
      return parts[1];
    });
  } catch {
    return [];
  }
}

function listFsFiles(dir: string): string[] {
  const out: string[] = [];
  const abs = path.join(REPO_ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  const stack = [abs];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    const stat = fs.statSync(cur);
    if (stat.isDirectory()) {
      for (const child of fs.readdirSync(cur)) {
        stack.push(path.join(cur, child));
      }
    } else if (stat.isFile()) {
      out.push(path.relative(REPO_ROOT, cur));
    }
  }
  return out;
}

function main() {
  const all: WatchedFile[] = [];
  let gitOk = true;
  for (const dir of PRIOR_ACTS) {
    let files = listGitTrackedFiles(dir);
    if (files.length === 0) {
      gitOk = false;
      files = listFsFiles(dir);
    }
    for (const f of files.sort()) {
      const abs = path.join(REPO_ROOT, f);
      if (!fs.existsSync(abs)) continue;
      if (fs.statSync(abs).isDirectory()) continue;
      const sha = sha256File(abs);
      const label = f
        .replace(/^factory\/qualify\/ACT-MRVN-/, "MRVN-")
        .replace(/\//g, ".");
      all.push({ label, path: f, frozen_sha256: sha });
    }
  }

  const fm = {
    schema: "mrvn-regression-frozen-manifest-v1",
    act: "ACT-MRVN-QUALIFY10",
    captured_at: new Date().toISOString(),
    git_source: gitOk ? "git ls-tree -r HEAD" : "fs walk fallback (git unavailable)",
    prior_acts: PRIOR_ACTS,
    files: all,
  };

  const out = path.join(ACT_ROOT, "evidence", "regression_frozen_manifest.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(fm, null, 2));
  console.log(`Wrote ${out}`);
  console.log(`Captured ${all.length} files across ${PRIOR_ACTS.length} ACTs (git=${gitOk})`);
}

if (import.meta.main) main();
