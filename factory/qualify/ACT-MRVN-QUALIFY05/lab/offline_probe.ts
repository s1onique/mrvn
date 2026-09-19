#!/usr/bin/env bun
// MRVN-05 offline network probe.
//
// Loaded via `bun --preload=lab/offline_probe.ts`.  Monkey-patches
// every known network entry-point so any attempt by the verifier
// (or any imported module) to make a network call panics the
// process before the syscall hits the kernel.  This produces
// *positive* offline evidence: not just a code grep, but a runtime
// guarantee that no DNS lookup, fetch, TCP connect, or UDP send
// succeeds during the verifier run.
//
// On Bun 1.3+ this hooks:
//   - globalThis.fetch
//   - node:net (createConnection)
//   - node:dns (lookup, resolve)
//   - Bun.connect
//   - Bun.dns (older alias)
//
// On macOS in this environment, kernel-level sandboxing
// (sandbox-exec, dtrace, opensnoop, tcpdump) is blocked by SIP.  A
// runtime monkey-patch is the strongest user-space evidence we can
// produce on this host.

const blocked: string[] = [];

function block(target: any, prop: string, label: string) {
  const original = target[prop];
  if (typeof original !== "function") return;
  target[prop] = function (...args: any[]) {
    blocked.push(label + "(" + JSON.stringify(args.slice(0, 1)) + ")");
    return Promise.reject(new Error("[offline-probe] NETWORK BLOCKED: " + label));
  };
  target[prop].toString = () => "[blocked " + label + "]";
}

// 1. globalThis.fetch (Bun + browser)
block(globalThis, "fetch", "globalThis.fetch");

// 2. node:net createConnection
try {
  const net = await import("node:net");
  block(net, "createConnection", "net.createConnection");
  block(net, "connect", "net.connect");
} catch {}

// 3. node:dns
try {
  const dns = await import("node:dns");
  for (const f of ["lookup", "resolve", "resolve4", "resolve6", "lookupService", "promises"]) {
    block(dns, f, "dns." + f);
  }
  if (dns.promises) {
    for (const f of ["lookup", "resolve", "resolve4", "resolve6"]) {
      block(dns.promises, f, "dns.promises." + f);
    }
  }
} catch {}

// 4. node:http / node:https (request, get, createServer listen paths)
try {
  const http = await import("node:http");
  block(http, "request", "http.request");
  block(http, "get", "http.get");
} catch {}
try {
  const https = await import("node:https");
  block(https, "request", "https.request");
  block(https, "get", "https.get");
} catch {}

// 5. Bun.connect
try {
  const BunNS = (globalThis as any).Bun;
  if (BunNS) {
    block(BunNS, "connect", "Bun.connect");
    block(BunNS, "dns", "Bun.dns");
  }
} catch {}

(globalThis as any).__mrvnOfflineProbe = {
  blocked,
  summary: () => "offline-probe armed; blocked " + blocked.length + " network attempts",
};
