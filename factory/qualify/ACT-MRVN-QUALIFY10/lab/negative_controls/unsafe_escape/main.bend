# Negative control: @unsafe present on a def.
# Expected: classified as UNSAFE_ESCAPE_HATCH.

import Base

type Role is Data:
  Role.Agent{}

@unsafe def read_role() -> IO(Role):
  import "./unsafe.c"
  import "./unsafe.js"

def main() -> IO(Unit):
  do IO<Unit>:
    Unit <- IO.print("unsafe")
    return Unit{}
