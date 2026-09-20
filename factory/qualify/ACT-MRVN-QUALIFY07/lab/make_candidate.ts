#!/usr/bin/env bun
// ACT-MRVN-07 make_candidate.ts
//
// Given a refactor descriptor, generates a candidate directory with:
//   descriptor.json
//   main.bend        (from refactor.ts)
//   LAWS.bend        (byte-identical canonical)
//   PROOF.bend       (byte-identical canonical initially)
//   _behavior/       (left empty; classify.ts fills it)
//
// Usage:
//   bun lab/make_candidate.ts --descriptor candidates/REF-MRVN07-NNN/descriptor.json

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "bun";

const ROOT = resolve(import.meta.dir, "..");
const CANONICAL_IMPL = resolve(ROOT, "baseline/main.bend");
const CANONICAL_LAWS = resolve(ROOT, "baseline/LAWS.bend");
const CANONICAL_PROOF = resolve(ROOT, "baseline/PROOF.bend");

interface Descriptor {
  candidate_id: string;
  family: string;
  description: string;
  parameters: any;
}

function parseArgs(argv: string[]): { descriptor: string } {
  const o: Partial<{ descriptor: string }> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const v = argv[++i];
    if (a === "--descriptor") o.descriptor = v;
    else throw new Error("unknown flag: " + a);
  }
  if (!o.descriptor) throw new Error("usage: --descriptor <path>");
  return o as { descriptor: string };
}

const args = parseArgs(process.argv.slice(2));
const desc: Descriptor = JSON.parse(readFileSync(args.descriptor, "utf-8"));

const candDir = resolve(args.descriptor, "..");
if (!existsSync(candDir)) mkdirSync(candDir, { recursive: true });

// Run refactor.ts to produce candidate main.bend.
const proc = spawn({
  cmd: [
    "bun", resolve(ROOT, "lab/refactor.ts"),
    "--descriptor", args.descriptor,
    "--canonical-impl", CANONICAL_IMPL,
    "--out", resolve(candDir, "main.bend"),
  ],
  stdout: "pipe", stderr: "pipe",
});
const out = await new Response(proc.stdout).text();
const err = await new Response(proc.stderr).text();
await proc.exited;
if (proc.exitCode !== 0) {
  console.error(`refactor.ts failed for ${desc.candidate_id}:`);
  console.error(err);
  process.exit(1);
}
console.log(out.trim());

// Copy canonical LAWS.bend and PROOF.bend.
copyFileSync(CANONICAL_LAWS, resolve(candDir, "LAWS.bend"));
copyFileSync(CANONICAL_PROOF, resolve(candDir, "PROOF.bend"));

console.log(`candidate ${desc.candidate_id} created at ${candDir}`);
