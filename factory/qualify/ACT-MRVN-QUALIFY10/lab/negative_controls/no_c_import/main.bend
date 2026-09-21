# Negative control: only .js import, no .c.
# Expected: CHECKER_REJECTED (build fails).

import Base

type Role is Data:
  Role.Agent{}

def read_role() -> IO(Role):
  import "./no_c.js"

def main() -> IO(Unit):
  do IO<Unit>:
    role : Role <- read_role()
    return Unit{}
