// ACT-MRVN-QUALIFY10 MUT-04: swapped constructors.
// Agent and Reviewer are swapped: "agent" returns Reviewer, "reviewer" returns Agent.
// Same type, wrong semantics.

function read_role() {
  const raw = Object.hasOwn(process.env, "ROLE") ? process.env["ROLE"] : undefined;
  if (raw === "agent")      return { $: "Role.Reviewer" };
  if (raw === "reviewer")   return { $: "Role.Agent" };
  if (raw === "automation") return { $: "Role.Automation" };
  return { $: "Role.Automation" };
}
