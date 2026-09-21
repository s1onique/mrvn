# TCB.md — Trusted Computing Base for ACT-MRVN-QUALIFY10

The TCB for MRVN-10 effectful proof-carrying artifacts is the union of
every authority layer that contributes to a `FULL_EFFECTFUL_VERIFY_PASS`
verdict.

Each layer is classified by exactly one of:

```text
HASH_BOUND      artifact_id derives from a sha256 of canonical bytes
PROOF_CHECKED   the Bend checker discharged all laws in PROOF.bend
RUNTIME_TESTED  observed behavior under the named backend/oracle
ASSUMED         external assumption, not verified
OUT_OF_SCOPE    the ACT does not address this layer at all
```

## Layers

### 1. Bend checker
**Classification:** `PROOF_CHECKED` + `HASH_BOUND`
**File:** `bend2/bend.ts`
**Why:** A passing `bun bend2/main.ts subject/PROOF.bend` proves the
laws; the file's SHA256 is in the artifact's `toolchain_closure`.
The frozen toolchain SHA matches `evidence/freeze.txt`.

### 2. Bend compiler/runtime
**Classification:** `PROOF_CHECKED` + `HASH_BOUND` (for build artifacts)
**File:** `bend2/comp.ts`, plus `bend2/main.ts` (CLI)
**Why:** Compiles and emits C/JS for foreign effects; its bytes are
frozen and bound in the artifact's toolchain closure.

### 3. Bend base library
**Classification:** `HASH_BOUND`
**File:** `bend2/base.bend`
**Why:** Its SHA is bound in the artifact's toolchain closure.

### 4. Base effect implementation
**Classification:** `HASH_BOUND` (closure aggregate)
**File:** `bend2/effs/*` (recursive)
**Why:** All built-in effects (`IO.print`, `IO.now`, etc.) implement
the Base layer.  The aggregate `effs_tree_sha256` is bound in the
artifact's toolchain closure.

### 5. Custom foreign effect implementation
**Classification:** `HASH_BOUND` + `RUNTIME_TESTED`
**Files:** `effect/read_role.c`, `effect/read_role.js`
**Why:** Each file's SHA is bound in the artifact's
`foreign_effects[]`.  The runtime contract test against the frozen
oracle exercises this layer per backend.

### 6. C compiler / JS runtime
**Classification:** `ASSUMED` (clang, bun/node)
**Why:** We capture versions in `toolchain_closure` and `host.txt`.
We do NOT capture transitive native deps.  See
`regression_hygiene_result.json` for verification cadence.

### 7. OS APIs (getenv, fs, network)
**Classification:** `ASSUMED`
**Why:** The OS is not bound by hash; only the foreign-effect bytes
that call into it are.  See `runtime_assumptions[]` in
`artifact-{js,c}/manifest.json` for the named assumptions.

### 8. External resources (env vars, FS state, network peer)
**Classification:** `RUNTIME_TESTED` (per case) or `OUT_OF_SCOPE`
**Why:** Each oracle case sets a specific env value; FS state is
controlled by tests.  Public network is `OUT_OF_SCOPE` (no public
network use; localhost allowed only when explicitly required).

### 9. Artifact verifier
**Classification:** `HASH_BOUND`
**File:** `lab/verify_artifact_v2.ts`
**Why:** The verifier is shipped in the artifact itself; its behavior
is reproducible from its bytes.

### 10. Runtime oracle
**Classification:** `HASH_BOUND` + `RUNTIME_TESTED`
**File:** `oracle/runtime_oracle.json`
**Why:** Frozen before mutations run.  Its SHA is bound in
`pure_payload.files[]` and verified at every check.

### 11. Effect contract
**Classification:** `HASH_BOUND` + `RUNTIME_TESTED`
**File:** `EFFECT_CONTRACT.md`
**Why:** Frozen.  Its SHA is bound per `foreign_effects[].contract_sha256`.
The contract is **not** a theorem; runtime tests assert observed-vs-
contract behavior.

### 12. Captured witness (canonical) + WITNESS-MRVN10-001
**Classification:** `HASH_BOUND` + `RUNTIME_TESTED`
**File:** `WITNESS-MRVN10-001/`
**Why:** Self-contained reproduction packet.  Demonstrates proof
survival and runtime-contract violation under foreign-byte substitution.

## What is OUT_OF_SCOPE

The following are explicitly excluded from MRVN-10:

* TLS implementation
* Public network governance
* Distributed system semantics
* GPU qualifier
* General C verifier (we only verify .c bytes bound by the artifact)
* General JS verifier (we only verify .js bytes bound by the artifact)
* OS formalization (we treat OS as `ASSUMED`)

See `REPORT.md` § scope-exclusions for the corresponding
discussion.
