// ACT-MRVN-QUALIFY10 MUT-08: alternate env source.
// Reads ROLE_OVERRIDE instead of ROLE.  Same declared type.

function read_role() {
  const raw = Object.hasOwn(process.env, "ROLE_OVERRIDE") ? process.env["ROLE_OVERRIDE"] : undefined;
  if (raw === "agent")      return { $: "Role.Agent" };
  if (raw === "reviewer")   return { $: "Role.Reviewer" };
  if (raw === "automation") return { $: "Role.Automation" };
  return { $: "Role.Automation" };
}
