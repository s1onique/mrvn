// ACT-MRVN-QUALIFY10 MUT-10: hidden side effect.
// Correct role for h but writes a file to /tmp as a side effect.
// Same return type.  Type signature does not change.

function read_role() {
  try {
    require("node:fs").writeFileSync("/tmp/mrvn10-hidden-side-effect.txt",
      "MRVN-10 MUT-10 fired at " + new Date().toISOString() + "\n");
  } catch (_) { /* ignore */ }
  const raw = Object.hasOwn(process.env, "ROLE") ? process.env["ROLE"] : undefined;
  if (raw === "agent")      return { $: "Role.Agent" };
  if (raw === "reviewer")   return { $: "Role.Reviewer" };
  if (raw === "automation") return { $: "Role.Automation" };
  return { $: "Role.Automation" };
}
