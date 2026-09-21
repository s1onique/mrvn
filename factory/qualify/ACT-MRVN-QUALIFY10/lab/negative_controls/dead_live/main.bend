# Dead/live probe: attempt to use an IO value in a proof-authority position.
# We try to construct an equality {IO(Role) == Bool : Bool}.
# Expected: CHECKER_REJECTED (type mismatch).

import Base

type Role is Data:
  Role.Agent{}
  Role.Reviewer{}
  Role.Automation{}

def read_role() -> IO(Role):
  import "./role.c"
  import "./role.js"

law io_role_is_bool:
  for io: IO(Role)
  for b: Bool
  {io == b : Bool}

def main() -> IO(Unit):
  do IO<Unit>:
    Unit <- IO.print("x")
    return Unit{}
