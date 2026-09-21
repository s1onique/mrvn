// ACT-MRVN-QUALIFY10 MUT-05: ignored input.
// The declared type is IO(Role).  The implementation does not read
// ROLE at all and silently returns a default.  Different contract for
// every non-default env value.

function read_role() {
  return { $: "Role.Agent" };
}
