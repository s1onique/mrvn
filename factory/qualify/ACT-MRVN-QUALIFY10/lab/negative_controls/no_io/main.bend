# Negative control: foreign def returns String, not IO(...).
# Expected: CHECKER_REJECTED.

import Base

def read_role() -> String:
  import "./no_io.c"

def main() -> IO(Unit):
  do IO<Unit>:
    Unit <- IO.print("hi")
    return Unit{}
