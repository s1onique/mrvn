// ACT-MRVN-QUALIFY10 MUT-01: constant dishonest value (always Reviewer).
// Same Bend foreign type IO(Role).  Reads environment but ignores it.

function read_role() {
  return { $: "Role.Reviewer" };
}
