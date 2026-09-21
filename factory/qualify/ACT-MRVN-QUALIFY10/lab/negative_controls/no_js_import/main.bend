# Negative control: only .c import, no .js.
# Expected: CHECKER_REJECTED at build (no JS handler).

import Base

type Role is Data:
  Role.Agent{}

def read_role() -> IO(Role):
  import "./no_js.c"

def main() -> IO(Unit):
  do IO<Unit>:
    role : Role <- read_role()
    return Unit{}
