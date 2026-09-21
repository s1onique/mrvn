// ACT-MRVN-QUALIFY10 nondet_probe.ts
//
// The canonical main.bend uses Operation.Work{}, where Agent and
// Reviewer both yield Allow.  For MUT-07 (nondeterministic host) the
// Work decision is the same for both roles, so the printed label
// changes are not observable.  This probe runs a parallel Halt
// subject so Reviewer->Allow{Halt} and Agent->Deny{NoAgentHalt}
// distinguish.

import * as fs from "node:fs";
import * as path from "node:path";
import { runOnce, type Backend } from "./runner.ts";
import { BEND_MAIN_TS, MUTATIONS_DIR } from "./_paths.ts";

function buildHaltSubject(mid: string): string {
  return _buildHaltSubject(mid);
}

export function buildHaltSubjectFor(mid: string): string {
  return _buildHaltSubject(mid);
}

function _buildHaltSubject(mid: string): string {
  const dir = path.join(MUTATIONS_DIR, mid);
  const subj = path.join(dir, "halt_main.bend");
  if (!fs.existsSync(subj)) {
    fs.writeFileSync(subj, `import Base

type Role is Data:
  Role.Agent{}
  Role.Reviewer{}
  Role.Automation{}

type Operation is Data:
  Operation.Work{}
  Operation.Halt{}

type DenyReason is Data:
  DenyReason.NoAutomation{}
  DenyReason.NoAgentHalt{}
  DenyReason.NoAutomationHalt{}

type Decision is Data:
  Decision.Allow{}
  Decision.Deny{reason: DenyReason}

def read_role() -> IO(Role):
  import "./effect/read_role.c"
  import "./effect/read_role.js"

def authorize(role: Role, op: Operation) -> Decision:
  match role:
    case Role.Agent{}:
      match op:
        case Operation.Work{}: Decision.Allow{}
        case Operation.Halt{}: Decision.Deny{DenyReason.NoAgentHalt{}}
    case Role.Reviewer{}:
      match op:
        case Operation.Work{}: Decision.Allow{}
        case Operation.Halt{}: Decision.Allow{}
    case Role.Automation{}:
      match op:
        case Operation.Work{}: Decision.Deny{DenyReason.NoAutomation{}}
        case Operation.Halt{}: Decision.Deny{DenyReason.NoAutomationHalt{}}

def decision_label(d: Decision) -> String:
  match d:
    case Decision.Allow{}: "ALLOW"
    case Decision.Deny{reason}:
      match reason:
        case DenyReason.NoAutomation{}:    "DENY:no_automation_work"
        case DenyReason.NoAgentHalt{}:     "DENY:no_agent_halt"
        case DenyReason.NoAutomationHalt{}:"DENY:no_automation_halt"

def main() -> IO(Unit):
  do IO<Unit>:
    role : Role <- read_role()
    decision : Decision = authorize(role, Operation.Halt{})
    label : String = decision_label(decision)
    Unit <- IO.print(label)
    return Unit{}
`);
  }
  return subj;
}

export interface NondetProbeResult {
  mid: string;
  backend: Backend;
  labels: string[];
  distinct_label_count: number;
  nondeterministic: boolean;
}

export function probeNondet(mid: string, backend: Backend,
                            trials: number, tmpBase: string): NondetProbeResult {
  const subj = buildHaltSubject(mid);
  const labels: string[] = [];
  for (let i = 0; i < trials; i += 1) {
    const r = runOnce({
      bendRunnerArgs: [subj],
      env: { ROLE: "anything" },
      backend, bend_runner: BEND_MAIN_TS,
      js_out: path.join(tmpBase, `nondet_${mid}_${backend}_${i}.js`),
      binary_out: path.join(tmpBase, `nondet_${mid}_${backend}_${i}`),
    });
    labels.push(r.label);
  }
  const distinct = new Set(labels).size;
  return { mid, backend, labels, distinct_label_count: distinct,
    nondeterministic: distinct > 1 };
}

if (import.meta.main) {
  const tmpBase = fs.mkdtempSync(path.join("/tmp", "mrvn10-nondet-"));
  const r = probeNondet("MUT-07", "js", 20, tmpBase);
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.nondeterministic ? 0 : 1);
}
