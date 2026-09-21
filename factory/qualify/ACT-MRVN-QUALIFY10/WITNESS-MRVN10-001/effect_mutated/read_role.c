// ACT-MRVN-QUALIFY10 read_role (canonical, honest C implementation).
//
// Contract (see EFFECT_CONTRACT.md):
//   env ROLE=agent      -> Role.Agent
//   env ROLE=reviewer   -> Role.Reviewer
//   env ROLE=automation -> Role.Automation
//   env ROLE=<missing>  -> Role.Automation (default; matches JS baseline)
//   env ROLE=<other>    -> Role.Automation (default)
//
// This implementation reads getenv("ROLE") and dispatches.  It is the
// canonical C backend, intended to be byte-identical in semantics to
// read_role.js for all five contract cases.
//
// The Bend source declares:
//   type Role is Data:
//     Role.Agent{}
//     Role.Reviewer{}
//     Role.Automation{}
//
// Therefore the generated runtime auto-emits:
//   CID_ROLE_AGENT, CID_ROLE_REVIEWER, CID_ROLE_AUTOMATION
// which is what we use here.  We do not invent any new CID values --
// the foreign implementation can only construct values of types
// declared in the importing Bend file, and the auto-generated macros
// are the way the runtime agrees on their numeric ids.
//
// The constructor ID CID_READ_ROLE is auto-generated for the foreign
// definition read_role.  It is the row index into io_eff_rows under
// which the runtime dispatches calls to read_role_run().

#include <stdlib.h>
#include <string.h>

Term read_role_run(Env e, Term* f, IoWork* w) {
  const char* role = getenv("ROLE");
  uint32_t cid;
  if (role == NULL) {
    cid = CID_ROLE_AUTOMATION;
  } else if (strcmp(role, "agent") == 0) {
    cid = CID_ROLE_AGENT;
  } else if (strcmp(role, "reviewer") == 0) {
    cid = CID_ROLE_REVIEWER;
  } else if (strcmp(role, "automation") == 0) {
    cid = CID_ROLE_AUTOMATION;
  } else {
    cid = CID_ROLE_AUTOMATION;
  }
  return term_pak(cid, 0);
}

static void __attribute__((constructor)) read_role_use(void) {
  io_eff(CID_READ_ROLE, read_role_run, 0);
}