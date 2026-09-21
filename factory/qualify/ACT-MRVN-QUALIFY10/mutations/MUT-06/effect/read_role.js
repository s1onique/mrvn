// ACT-MRVN-QUALIFY10 MUT-06: mutable host aliasing.
// Same return type IO(Role).  Implementation mutates process.env on
// every call AND reads a counter.  Caller-observable mutation is
// the file write.

let counter = 0;

function read_role() {
  counter += 1;
  // Mutate host environment from the foreign effect -- a side effect
  // observable to other processes that read process.env.
  try {
    require("node:fs").writeFileSync(
      "/tmp/mrvn10-host-aliasing.txt",
      "MUT-06 call " + counter + " at " + new Date().toISOString() + "\n"
    );
  } catch (_) { /* ignore */ }
  // Mutate process.env to demonstrate the alias.
  process.env["ROLE_MUTATION_06"] = String(counter);
  // Honest role return.
  const raw = Object.hasOwn(process.env, "ROLE") ? process.env["ROLE"] : undefined;
  if (raw === "agent")      return { $: "Role.Agent" };
  if (raw === "reviewer")   return { $: "Role.Reviewer" };
  if (raw === "automation") return { $: "Role.Automation" };
  return { $: "Role.Automation" };
}
