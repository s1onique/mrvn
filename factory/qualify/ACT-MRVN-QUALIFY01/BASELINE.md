# ACT-MRVN-QUALIFY01 baseline observations

This document records the state of the `mrvn` working tree at the start
of ACT-MRVN-QUALIFY01, the toolchain available, and the most relevant
files in the repository. All facts are observed; nothing here is
asserted beyond what was directly inspected.

## Repository state

| Item                    | Value                                                        |
| ----------------------- | ------------------------------------------------------------ |
| HEAD                    | `0b7e2b11c1054f5d0f4eb955cadb47997ef1115d`                  |
| Branch                  | `main`                                                       |
| Working-tree status     | `?? factory/` (no tracked changes)                           |
| Remote                  | `origin = git@github.com:s1onique/mrvn.git` (fetch + push)   |
| Other branches          | only `main`; no other remotes                                |
| LICENSE                 | MIT (`LICENSE`, `11344` bytes)                               |

There is no `upstream` remote other than `origin`; this checkout is a
single remote fork, so the relationship to `bendlang/bend` is implied
only by repository identity and commit content.

Last commit:

```
0b7e2b11 The papers' AI disclosure ends with: Human paper soon™
46df6bef AGENTS.md: the map of the repo for agents
38ad3382 Bend 2.0.5: CUDA_HOME, strict TypeScript, CC fallback,
        the reservation probe, the guide's ! definition
```

## Toolchain available locally

| Tool               | Status                                                |
| ------------------ | ----------------------------------------------------- |
| `node`             | `v26.0.0` at `/opt/homebrew/bin/node`                 |
| `bun`              | `1.3.14` at `/opt/homebrew/bin/bun`                   |
| `gcc` / `clang`    | Apple clang `15.0.0 (clang-1500.0.40.1)`              |
| `python3`          | `3.12.14` (Nix profile)                               |
| `lean`             | not installed                                         |
| SSH to `cluster`   | not available (no bastion reachable from this host)   |
| `Bend` (via bun)   | `bend 2.0.5` (uses `bend2/main.ts`)                   |

PATH is not preconfigured for `node`/`bun`; this ACT sets
`PATH=/opt/homebrew/bin:$PATH` explicitly inside its scripts.

## Bend runtime and source layout (relevant subset)

The compiler is one TypeScript program. From `bend2/`:

| File              | Role                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------- |
| `main.ts`         | CLI entry point; loader for `.bend` files under bun and node                          |
| `bend.ts`         | Parser, theory, checker, interpreter. Self-described as Bend's trusted kernel.        |
| `comp.ts`         | Compiler: C emitter, Metal/CUDA/JS emitter, runtime                                    |
| `base.bend`       | Standard library (the prelude)                                                        |
| `bend.lean`       | Mechanization of the core in Lean                                                     |
| `effs/*.c,*.js`   | One file per IO effect, per backend                                                   |
| `pack/`           | `package.json`, `tsconfig.json`, `bun.lock` (Bun-only devDeps, `@types/bun`)          |

Test and gate infrastructure (read-only; not run in this ACT):

| File / dir          | Role                                                                                |
| ------------------- | ----------------------------------------------------------------------------------- |
| `tests/<ns>/*.bend` | ~22 namespaces of unit tests, each ending in `#|` golden output lines              |
| `gates/test.ts`     | Orchestrates the cluster-based test gate (requires SSH bastion + minis)             |
| `gates/perf.ts`     | Cluster-based perf gate against hardware pins                                       |
| `gates/repo.ts`     | Allow-list of files with per-file token caps                                        |
| `gates/_lib.ts`     | Cluster exec helpers, mini slot allocator                                           |

The cluster-based gates are unavailable in this environment
(SSH bastion not present). Reproducible local tests are limited to
individual `bend` invocations on single files.

## `bend --help` summary (verbatim from `bend2/main.ts`)

```
Bend 2.0.5: check, run, build and publish Bend programs.

usage:
  bend <file.bend>            check the file, then run main
  bend <file.bend> -o <out>   build a binary; <out>.c emits C, <out>.js JS
  bend <file.bend> --checkup  check and run each import alone
  bend <file.bend> --publish  publish the file and its imports to the hub
  bend <page.html> -o <dir>   bundle a page that imports .bend files
  bend base [--types|<name>]  print Base, its types, or a name and its subnames
  bend guide                  print the Bend guide
  bend --version              print the version
```

## Spec authorities located in the source tree

| Concern          | File(s)                                                                |
| ---------------- | ---------------------------------------------------------------------- |
| Laws / proofs    | User-level `LAWS.bend` files (e.g. `demos/proof_insertion_sort/`)      |
| Type theory      | `bend2/bend.ts` (parser + checker, comment block lines 5-230)          |
| Lean formalization | `bend2/bend.lean`                                                    |
| Compiler         | `bend2/comp.ts` and the four backend emitters                          |
| Runtime          | `bend2/effs/*` plus the C/JS/Metal/CUDA runtime in `comp.ts`           |

Per `bend2/bend.ts` line 1-3:

> "this file was 99% human-designed and audited. It includes Bend's
>  trusted kernel, including interpreter and checker. It has a bit of
>  AI slop, but it is the most robust file in the repo."

The README claims (README.md lines 222-247) include:

- "Recursion must be terminating. (Use `@unsafe` to disable this checker.)"
- "Sharing arrays with atomics across threads is experimental and needs `@unsafe`."
- "The compiler is young and has blind spots (unusually slow programs)."
- "The compiler (not kernel) is 99% AI-written and has not been fully audited yet."
- "The Lean formalization and bend.ts mismatch. Early consistency bugs may occur."

These claims are recorded here as upstream assertions, not verified
facts.

## Bend baseline test status (local, single-file)

The cluster-based `gates/test.ts` cannot be run in this environment.
Instead, individual sample files were run through `bend <file>` to
confirm the toolchain works at all:

| Probe                                                     | Command                                                                                                       | Exit |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---- |
| Bend version                                              | `bun bend2/main.ts --version`                                                                                 | 0    |
| Hello, world                                              | `bun bend2/main.ts /tmp/hello.bend`                                                                           | 0    |
| Existing demo (insert-sort proof): `tests/proof/dec_switch_induction.bend` | `bun bend2/main.ts tests/proof/dec_switch_induction.bend` | 0 (`51`) |
| `--checkup` on the same                                   | `bun bend2/main.ts tests/proof/dec_switch_induction.bend --checkup`                                           | 0    |

Classification: the local Bend toolchain runs; the cluster gate does
not, because the bastion is unreachable. This is `ENVIRONMENT_FAILURE`,
not `SOURCE_FAILURE`. The cluster gate is therefore marked as **not
executed** in this ACT.

## Bend baseline verdict

```
UPSTREAM_BASELINE_REPRODUCED = PARTIAL
```

Justification:

- `bend 2.0.5` is reproducible on this host (PATH set to `/opt/homebrew/bin`).
- Selected single-file tests under `tests/proof/` reproduce successfully.
- The full cluster-based `gates/test.ts` and `gates/perf.ts` are not
  reproducible here because the cluster bastion is unreachable.
- Therefore the strongest *practical* upstream verification available
  locally has been demonstrated, but full baseline reproduction has
  not.

## Notes on commands and convention

- All Bend invocations in this ACT use the local source tree:
  `bun bend2/main.ts <file>`. There is no system-wide `bend` binary;
  this ACT does not install one.
- Bend programs that import `Base` are run from the repository root,
  where `bend2/base.bend` resolves correctly under the `.bend` loader
  in `bend2/main.ts`.

