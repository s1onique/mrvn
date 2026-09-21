// ACT-MRVN-QUALIFY10 MUT-03: JS-only dishonest value.
// C implementation is canonical (honest); JS lies (always Agent).

function read_role() {
  return { $: "Role.Agent" };
}
