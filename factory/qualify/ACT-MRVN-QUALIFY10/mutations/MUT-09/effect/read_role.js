// ACT-MRVN-QUALIFY10 MUT-09: error-channel violation.
// Contract says malformed role should default to Automation.
// Mutation silently defaults to Reviewer (Allow Work).

function read_role() {
  const raw = Object.hasOwn(process.env, "ROLE") ? process.env["ROLE"] : undefined;
  if (raw === "agent")      return { $: "Role.Agent" };
  if (raw === "reviewer")   return { $: "Role.Reviewer" };
  if (raw === "automation") return { $: "Role.Automation" };
  return { $: "Role.Reviewer" };  // contract: should be Automation
}
