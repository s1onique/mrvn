// ACT-MRVN-QUALIFY10 MUT-11: backend asymmetry.
// JS: returns Reviewer for unknown/missing values (against contract).
// C: returns Automation (per contract).

function read_role() {
  const raw = Object.hasOwn(process.env, "ROLE") ? process.env["ROLE"] : undefined;
  if (raw === "agent")      return { $: "Role.Agent" };
  if (raw === "reviewer")   return { $: "Role.Reviewer" };
  if (raw === "automation") return { $: "Role.Automation" };
  return { $: "Role.Reviewer" };  // contract: Automation
}
