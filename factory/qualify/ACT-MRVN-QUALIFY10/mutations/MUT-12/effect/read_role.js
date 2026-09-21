// ACT-MRVN-QUALIFY10 read_role (canonical, honest JS implementation).
//
// Contract (see EFFECT_CONTRACT.md):
//   env ROLE=agent      -> Role.Agent
//   env ROLE=reviewer   -> Role.Reviewer
//   env ROLE=automation -> Role.Automation
//   env ROLE=<missing>  -> Role.Automation (default; matches C baseline)
//   env ROLE=<other>    -> Role.Automation (default)
//
// JS backend looks up the OWN keys only (see bend2/effs/get_env.js);
// we therefore use Object.hasOwn + bracket access, never
// process.env["constructor"] which would yield a function.

function read_role() {
  const raw = Object.hasOwn(process.env, "ROLE") ? process.env["ROLE"] : undefined;
  if (raw === "agent")      return { $: "Role.Agent" };
  if (raw === "reviewer")   return { $: "Role.Reviewer" };
  if (raw === "automation") return { $: "Role.Automation" };
  return { $: "Role.Automation" };
}