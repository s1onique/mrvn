# ACT-MRVN-QUALIFY01 authority / TCB map

This file inventories the trusted components relevant to a Bend proof
gate. It deliberately distinguishes five layers and does not collapse
them. It is an inventory of *where* authority lives; it is **not** a
proof of soundness.

## A. Specification authority

The specifications a Bend proof is checked against are the `LAWS.bend`
files at the root of an experiment or application. They are written
by the human (or AI acting as human) and parsed by the same parser
as ordinary code. There is no separate spec language.

Examples located in the tree:

| File                                     | Role                                       |
| ---------------------------------------- | ------------------------------------------ |
| `demos/proof_insertion_sort/LAWS.bend`   | Two laws (sortedness, permutation)         |
| `demos/app_triangle_2d/LAWS.bend`        | Three laws for an event-driven renderer    |
| `demos/app_win_is_bug_2d/LAWS.bend`      | "Winning is impossible" style invariants   |

`LAWS.bend` files have no privileged status at parse time: a law is
just a top-level `law` declaration (parsed in `bend2/bend.ts` lines
2592-2628) with the same syntax as a `def`. The checker's only
distinguishing act is to keep the entry's `v: null` until a `def`
fills it.

`bend2/base.bend` itself contains many bodiless `law` entries that
serve as axioms (e.g. `law Word:`, `law IO:`, `law Chan:`). These are
authoritative for *what the runtime can talk about*, not for user
code. They are tolerated by the CLI because `book_valid` treats the
first `base.order.length` entries as already-done and skips the open-
claim increment (see section B.1).

## B. Proof-checking authority

The proof-checking kernel is **`bend2/bend.ts`**. It is the parser,
the type checker, the equation checker, and the termination checker
in one file. `bend2/main.ts` invokes it through:

```
Bend.book_load(book, file, "", seen);
Bend.book_valid(book, base?.order.length ?? 0);
const hols = book.hols + book.open;
if (hols > 0) throw "Error: N TODOs found...";
```

(`bend2/main.ts` lines 430-436.)

### B.1 How an `assert` (law) is parsed

A `law` introduces a `Def` whose body is set to `null` at parse time
(`bend2/bend.ts` lines 2592-2628):

```
book.tlds[k] = { $: "Def", n: ..., T: term_higher(T), v: null };
```

A subsequent `def k(...): <body>` re-fills the same entry with `v`
non-null. `book_valid` then walks every entry (lines 3703-3711):

```
const dec: Def = { $: "Def", n: tld.n, T: tld.T, v: null, b: tld.b, u: tld.u };
if (i < done) {                       // i.e. an entry from Base
  seen.tlds[k] = fin ? tld : dec;
  continue;
}
if (fin && tld.v === null && tld.b !== true && !tld.i) {
  book.open += 1;
}
```

So the gate has *exactly one* criterion for "still open": a non-base,
non-foreign (`i`-array) def with `v === null`. There is no partial
proof, no per-axiom weight, no severity level. Either the entry's
`v` is non-null or the entry is in Base's prefix and is considered
done by virtue of position.

### B.2 How a `def` body becomes a proof

The body of a `def` that fills a law is type-checked and equation-
checked by `term_check` (`bend2/bend.ts` line 3725+). The term-check
is the only proof engine Bend ships. It is a bidirectional type
checker extended with one rewrite rule for equality (`%e : P; f`),
case-splitting by `match`, and recursion by descent on a strict
subterm. Termination is enforced at the same step.

The trusted claims (per `bend2/bend.ts` lines 222-225) are:

```
subject reduction (for by-value reduction)
progress
weak normalization of closed live terms
no closed live inhabitant of Empty
```

These are stated for *books that do not use @unsafe and do not use
holes (`?name` / `?TODO`)*. The relevant exclusion at line 226-230:

```
an @unsafe def opts out of the wall: its self-calls skip descent
and its binder domains form + at any kind, so the claims above do
not cover a book that uses one. a hole ?name fails every check,
shown against the goal; ?TODO alone checks at any goal and marks
the book incomplete.
```

### B.3 Holes and TODOs

- `?name` (e.g. `?help`) is a *loud* hole: the type checker refuses to
  fill it, producing an `Err` against the goal. (See
  `tests/check/hole_named.bend`.)
- `?TODO` is a *quiet* hole: it type-checks at any goal but increments
  `book.hols` at parse time (line 1956-1958 of `bend2/bend.ts`).
  After validation, `main.ts` refuses any book with `hols + open > 0`.

## C. Compilation authority

The compiler is **`bend2/comp.ts`** plus the four backend emitters
(C, Metal, CUDA, JavaScript). It reads the book after the checker
approves it. The C emitter is the largest single source of code in
the tree (per `README.md` line 239: "The compiler (not kernel) is
99% AI-written and has not been fully audited yet").

For ACT01 we do not need to invoke compilation; proof authority is
established entirely by the checker. The compiler is a separate
trusted component.

## D. Runtime authority

Bend has multiple runtimes:

| Backend       | Source                                           |
| ------------- | ------------------------------------------------ |
| C             | generated from `bend2/comp.ts`, plus `bend2/effs/*.c` |
| JavaScript    | generated from `bend2/comp.ts`, plus `bend2/effs/*.js` |
| Metal (GPU)   | generated from `bend2/comp.ts` (Apple GPU)       |
| CUDA (GPU)    | generated from `bend2/comp.ts` (NVIDIA GPU)      |

A "law is proven" verdict is independent of which runtime runs the
program, but the runtime determines what the program *actually does*
on real inputs. For ACT01 the verified kernel is pure (no IO, no
foreign imports), so the runtime authority is not exercised for the
kernel itself.

## E. External / environmental authority

Three environmental items affect what `bend` actually does:

| Item                              | Authority                        |
| --------------------------------- | -------------------------------- |
| `node` / `bun` runtime            | executes `bend2/main.ts` and friends |
| filesystem layout (where `base.bend` resolves) | controls which prelude is used   |
| upstream hub (`bend-lang.com`)    | used by `--publish`, not by check/run |

The `--checkup` and `--publish` paths also depend on a hash-and-nonce
proof of work (`bend2/main.ts` lines 60-64, `POW = 140000000`) but
that is only relevant to publishing.

## 3.2 Inventory of escape hatches

The ACT demands an explicit accounting of every escape hatch. The
following were located in this baseline:

### `@unsafe` (`bend2/bend.ts` lines 2540-2549)

```
if (parse_take(p, "@")) {
  if (!parse_word(p, "unsafe")) {
    parse_fail(p, "'unsafe' (the one decorator)");
  }
  parse_skip(p);
  if (!parse_at_word(p, "def")) {
    parse_fail(p, "'def' (@unsafe marks the def below it)");
  }
  parse_def(p, book, true);
  continue;
}
```

The third argument `true` is `unsafe`. `parse_def(p, book, true)` then
sets `u: true` on the Def (and the body of the def can call itself
without descent). Per the kernel comments (line 226-228):

> "an @unsafe def opts out of the wall: its self-calls skip descent
>  and its binder domains form + at any kind, so the claims above do
>  not cover a book that uses one."

Empirical handling at `book_valid` time: `book.open` is only
incremented for entries with `v === null && b !== true && !tld.i`
(line 3708), so an `@unsafe def` with a body is not counted as open.
But it is also not subject to termination, so any def that uses an
`@unsafe` def inherits its escape.

### Foreign imports

A `def` whose body is replaced by `import "..."` lines is a foreign
fill (`tests/parse/foreign_refill.bend`):

```
law f:
  IO(Unit)

def f():
  import "./nothing.js"
```

The `i: string[]` array on the Def holds the import paths. Such a
def's behavior at runtime is whatever the imported `.c`/`.js` does.
Per `tests/io/main_foreign.bend`, `main` may not be a foreign fill
(the runner refuses: `main must be a filled def: a foreign main
cannot anchor IO`), but auxiliary defs can be.

The checker does **not** model the imported code at all; the trust
boundary expands to whatever the imported code does. The test
`tests/io/foreign_arrow_arity.bend` pins that a foreign def's arity
must match its declared type, but the semantics of the imported code
itself are unchecked.

### Quiet holes `?TODO` (`bend2/bend.ts` line 1956-1958)

```
case "?": {
  parse_bump(p);
  const k = parse_name(p);
  if (k === "TODO") {
    p.book.hols += 1;
  }
  return Hol(k, parse_span(p, beg));
}
```

`?TODO` increments `book.hols` at parse time. After `book_valid`, the
CLI throws if `hols > 0`. So `?TODO` is a hard fail at the proof gate.

### Loud holes `?name`

`?foo` (any name other than `TODO`) returns `Hol("foo", ...)` without
incrementing `book.hols`. The type checker then refuses to fill it.
See `tests/check/hole_named.bend`.

### Compiler-generated artifacts

The compiler emits one C or JS file per Bend program. Generated code
is not checked by `bend.ts`; it is trusted to do what the book says.
The **interpreter** path (`term_snf`, `term_lower`, `term_show`) is
the only execution path that stays inside the checked-book regime.

### Summary table of escape hatches

| Escape hatch        | Theorem path? | Runtime effect? | Modelled? | Status     |
| ------------------- | ------------- | --------------- | --------- | ---------- |
| `@unsafe` def       | yes           | yes             | no (descent off, + at any kind) | UNCHECKED |
| Foreign `import`    | yes (host)    | yes             | no (imported code opaque) | UNCHECKED |
| `?TODO`             | yes           | no (refused)    | as a counter; not as code  | REFUSED    |
| `?name` (loud hole) | yes           | no (refused)    | as an Err                  | REFUSED    |
| Generated C/JS      | downstream    | yes             | no                         | UNCHECKED  |
| Compiled runtime    | downstream    | yes             | no                         | UNCHECKED  |

For ACT01's verified kernel, **none** of the unchecked rows may be
used. That is the basic precondition for this ACT.

## 3.3 Proof-gate semantics (empirical)

To pin what `bend PROOF.bend` accepts and rejects, four minimal
fixtures were run against the local toolchain. Their evidence is
preserved in `factory/qualify/ACT-MRVN-QUALIFY01/evidence/`.

| ID  | Fixture                                          | Expected                       | Observed (reproduced in this ACT)                                |
| --- | ------------------------------------------------ | ------------------------------ | --------------------------------------------------------------- |
| P-1 | Correct proof of `Nat.add(n, 0n) == n`           | exit 0                         | exit 0; no output (only `main` prints); the proof `{==}` for `Nat.add(0n, 0n)` reduces at the goal. |
| P-2 | A law with no proof (no def filling it)          | exit 1; "1 TODO found."        | exit 1; "Error: 1 TODO found." (matches `tests/grade/open_claim.bend`). |
| P-3 | A law with a deliberately false proof            | exit 1; checker Err            | exit 1; "expected : ... / observed : ..." error on the body.    |
| P-4 | An implementation change that breaks a law       | exit 1; checker Err            | exit 1; expected equality no longer matches; proof fails.       |

The exact commands and outputs are recorded in
`factory/qualify/ACT-MRVN-QUALIFY01/evidence/03-gate-semantics.txt`.

In addition, the two related escape-hatch behaviours were exercised
during this ACT:

| ID  | Fixture                                                | Expected               | Observed                                                      |
| --- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------- |
| H-1 | `?TODO` inside a `def` body                            | exit 1; "1 TODO found" | exit 1; "Error: 1 TODO found."                                |
| H-2 | `?name` inside a `def` body                            | exit 1; checker Err    | exit 1; "expected : ... / observed : ?name" error             |
| H-3 | `@unsafe` def whose body is a non-descending recursion | exit 0; accepted       | exit 0; accepted. The kernel comment is the source of the claim. |

The exact commands and outputs are recorded in
`factory/qualify/ACT-MRVN-QUALIFY01/evidence/09-escape-hatches.txt`.




