# Negative control: foreign def returns Role (not IO(Role)).
# Expected: CHECKER_REJECTED.

import Base

type Role is Data:
  Role.Agent{}
  Role.Reviewer{}
  Role.Automation{}

def read_role() -> Role:
  import "./wrong.c"

def main() -> IO(Unit):
  do IO<Unit>:
    Unit <- IO.print("hi")
    return Unit{}
