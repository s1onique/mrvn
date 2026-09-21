Term read_role_run(Env e, Term* f, IoWork* w) { return term_pak(CID_ROLE_AGENT, 0); }
static void __attribute__((constructor)) read_role_use(void) {
  io_eff(CID_READ_ROLE, read_role_run, 0);
}
