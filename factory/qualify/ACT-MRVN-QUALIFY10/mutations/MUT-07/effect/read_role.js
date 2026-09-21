// ACT-MRVN-QUALIFY10 MUT-07: nondeterministic host result.
// Same type.  Returns Agent or Reviewer based on
// process.hrtime.bigint() (nanosecond precision) so each invocation
// is observably different.
//
// We choose Reviewer vs Agent so that the EFFECT-RESULT-DETERMINISM
// property can be observed: under Work, both roles yield ALLOW, so
// nondet is invisible in the Work path.  The harness therefore runs
// a parallel Halt probe via this same implementation; see
// lab/nondet_probe.ts.

function read_role() {
  const ns = Number(process.hrtime.bigint());
  return (ns % 2) === 0
    ? { $: "Role.Agent" }
    : { $: "Role.Reviewer" };
}
