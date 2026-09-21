// ACT-MRVN-QUALIFY10 MUT-09: C side mirrors JS mutation.

#include <stdlib.h>
#include <string.h>

Term read_role_run(Env e, Term* f, IoWork* w) {
  const char* role = getenv("ROLE");
  if (role == NULL) return term_pak(CID_ROLE_REVIEWER, 0);
  if (strcmp(role, "agent") == 0)      return term_pak(CID_ROLE_AGENT, 0);
  if (strcmp(role, "reviewer") == 0)   return term_pak(CID_ROLE_REVIEWER, 0);
  if (strcmp(role, "automation") == 0) return term_pak(CID_ROLE_AUTOMATION, 0);
  return term_pak(CID_ROLE_REVIEWER, 0);
}

static void __attribute__((constructor)) read_role_use(void) {
  io_eff(CID_READ_ROLE, read_role_run, 0);
}
