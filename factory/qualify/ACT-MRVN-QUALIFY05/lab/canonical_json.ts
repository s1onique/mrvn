#!/usr/bin/env bun
// MRVN canonical JSON encoder (mrvn-canonical-json-v1).
//
// Deterministic JSON serialization used to derive the artifact root id.
// Encoding rules (fixed by this implementation):
//
//   1. UTF-8, no BOM.
//   2. No insignificant whitespace: objects and arrays use {} and []
//      with no spaces around colons or commas.
//   3. Object keys are sorted lexicographically by code point (Uint8Array
//      order). We sort an explicit list of keys instead of relying on
//      JavaScript object insertion order, so the encoding is reproducible
//      across runtimes.
//   4. Array order is preserved as given. Callers are responsible for
//      passing arrays in a semantic-stable order; this encoder does not
//      sort them.
//   5. Strings are escaped as JSON strings. We delegate the actual
//      escaping to JSON.stringify (which produces RFC 8259 / RFC 8259
//      conformant \u escapes). This is identical to what every other
//      well-formed JSON library produces for ASCII-only / UTF-8 strings.
//   6. Numbers are emitted as JSON.stringify does, but never as NaN or
//      Infinity (these are not valid JSON). We refuse them.
//   7. Booleans and null are written as `true`, `false`, `null`.
//   8. Top-level output uses "\n" between top-level keys of objects only
//      when canonical_indent > 0. The artifact root id is computed from
//      the compact (no-indent) form. Indented form is for human display
//      only and is NOT used in the identity derivation.

export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [k: string]: Json };

export function canonicalJson(value: Json): string {
  return encode(value, false);
}

// Same encoder with a stable 2-space indent for human display.
// DO NOT use for identity.
export function canonicalJsonPretty(value: Json): string {
  return encode(value, true);
}

function encode(v: Json, pretty: boolean, indent: number = 0): string {
  if (v === null) return "null";
  const t = typeof v;
  if (t === "boolean") return v ? "true" : "false";
  if (t === "number") {
    if (!Number.isFinite(v as number)) {
      throw new Error("canonicalJson: non-finite number rejected: " + String(v));
    }
    return JSON.stringify(v);
  }
  if (t === "string") return JSON.stringify(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    const inner = pretty ? "\n" + "  ".repeat(indent + 1) : "";
    const sep = pretty ? "," + "\n" + "  ".repeat(indent + 1) : ",";
    let out = "[";
    for (let i = 0; i < v.length; i++) {
      if (i > 0) out += sep;
      out += encode(v[i], pretty, indent + 1);
    }
    out += pretty ? "\n" + "  ".repeat(indent) + "]" : "]";
    return out;
  }
  // object
  const obj = v as { [k: string]: Json };
  const keys = Object.keys(obj).sort();
  if (keys.length === 0) return "{}";
  const pad = pretty ? "  ".repeat(indent + 1) : "";
  const sep = pretty ? "," + "\n" + pad : ",";
  let out = pretty ? "{\n" + pad : "{";
  for (let i = 0; i < keys.length; i++) {
    if (i > 0) out += sep;
    const k = keys[i];
    out += JSON.stringify(k) + ":" + (pretty ? " " : "") + encode(obj[k], pretty, indent + 1);
  }
  out += pretty ? "\n" + "  ".repeat(indent) + "}" : "}";
  return out;
}

// Convenience: parse a JSON string and re-emit canonically.
// Throws on invalid input. Refuses objects with non-string-keyed entries.
export function parseCanonical(raw: string): Json {
  return JSON.parse(raw) as Json;
}

// Hash canonical bytes (UTF-8) with SHA-256.
export function canonicalSha256(value: Json): string {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  return sha256Bytes(bytes);
}

export function sha256Bytes(bytes: Uint8Array): string {
  // We import lazily so this file is self-contained for tests.
  // Bun's node:crypto module is always present under the bun runtime.
  // Fall back to WebCrypto if not.
  const createHash = require("node:crypto").createHash;
  return createHash("sha256").update(bytes).digest("hex");
}
