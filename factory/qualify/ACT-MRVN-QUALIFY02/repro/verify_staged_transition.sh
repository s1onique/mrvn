#!/usr/bin/env bash
# ACT-MRVN-QUALIFY02-CORRECTION01: stage-transition verifier.
#
# This script verifies that the qualified state matches the frozen
# hashes documented in REPORT.md.  It does NOT execute the commit;
# it produces a verifier report the reviewer can audit before
# executing the lifecycle-binding command.
#
# Usage:  bash repro/verify_staged_transition.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$REPO_ROOT"

EXPECTED=(
  "factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/main.bend    f2f94e47aff2f288f2f164ac11e96d87ac3bb8a41907c9e69525aabf8e9f7b5f"
  "factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/LAWS.bend    e3600c99bac853fb8a90720bbc042f7388404238d2c0e671d6672b948daedd39"
  "factory/qualify/ACT-MRVN-QUALIFY01/verdict-kernel/PROOF.bend   0268db724a986ae7ab44f54750542b4a657dee8ea20a9f22817a01c02c96eb95"
  "factory/qualify/ACT-MRVN-QUALIFY02/reference/main_act01.bend   f37ea4127df6df15acb12bf876f38f36eb0e4ae8300bdcb3b653bf78349cdba3"
  "factory/qualify/ACT-MRVN-QUALIFY02/reference/LAWS-act01.bend   e3600c99bac853fb8a90720bbc042f7388404238d2c0e671d6672b948daedd39"
  "factory/qualify/ACT-MRVN-QUALIFY02/reference/PROOF-act01.bend  ed7f562d466dd2419f9f262e8748a9ffd9a7dd22ae9ecdc047337cc0fe274b18"
)

echo "===== ACT-MRVN-QUALIFY02 stage-transition verifier ====="
echo
echo "[1] Git status:"
git status --porcelain factory/
echo
echo "[2] Hash verification:"
PASS=0
FAIL=0
for entry in "${EXPECTED[@]}"; do
  file=$(echo "$entry" | awk '{print $1}')
  expected_hash=$(echo "$entry" | awk '{print $2}')
  actual_hash=$(sha256sum "$file" 2>/dev/null | awk '{print $1}')
  if [ "$actual_hash" = "$expected_hash" ]; then
    printf "  [PASS] %s\n" "$file"
    PASS=$((PASS + 1))
  else
    printf "  [FAIL] %s\n    expected: %s\n    actual:   %s\n" \
      "$file" "$expected_hash" "$actual_hash"
    FAIL=$((FAIL + 1))
  fi
done

echo
echo "[3] Summary: PASS=$PASS FAIL=$FAIL"
echo
echo "[4] Cleanup check (must be empty):"
ls /tmp/diff_test_act02/ 2>/dev/null && echo "  WARNING: /tmp/diff_test_act02/ still exists" || echo "  /tmp/diff_test_act02/ removed (clean)"

echo
echo "[5] Lifecycle state:"
echo "  LIFECYCLE_FREEZE              = unset (pending reviewer commit)"
echo "  LIFECYCLE_CLOSURE             = unset (pending reviewer commit)"
echo "  AUTHORITY_STATUS              = DirtyWorktree"
echo "  GENERATOR_AUTHORITATIVE_FOR_DIGEST = false"
echo "  state_binding                 = UNBOUND"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1