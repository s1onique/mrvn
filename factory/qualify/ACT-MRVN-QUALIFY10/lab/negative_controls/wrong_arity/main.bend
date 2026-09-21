# Negative control: foreign def takes an argument it shouldn't.
# Expected: CHECKER_REJECTED (arity mismatch).

import Base

type Role is Data:
  Role.Agent{}

def read_role(x: U32) -> IO(Role):
  import "./wrong_arity.c"
  import "./wrong_arity.js"

def main() -> IO(Unit):
  do IO<Unit>:
    role : Role <- read_role(42)
    return Unit{}
