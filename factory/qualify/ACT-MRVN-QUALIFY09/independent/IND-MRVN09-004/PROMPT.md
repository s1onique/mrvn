# MRVN-09 Independent-Agent Prompt -- IND-MRVN09-004

## Agent identity
- agent_instance: MiniMax-M3
- agent_model: MiniMax-M3
- agent_provider: MiniMax
- session_id: mrvn09-replication-2026-09-21

## Strategy
Per-leaf dummy-thunk wrapper

A helper wrap_with_dummy(Unit{}, d) is added before work_decision. Every leaf in every per-cap helper is wrapped with wrap_with_dummy(Unit{}, ...). Forces the canonical PROOF to discharge each leaf through an extra thunks-and-identity step.

## Goal
Construct a new `main.bend` that preserves byte-identical LAWS.bend,
matches the frozen 180-cell semantic oracle, remains valid stock Bend,
and changes implementation/reduction structure enough that the
canonical PROOF.bend may fail for a genuine proof/definitional
reason.

## Input bundle given to the agent
- INSTRUCTIONS.md (bounded task description)
- main.bend (canonical implementation, frozen)
- LAWS.bend (immutable specification)
- PROOF.bend (canonical proof)
- oracle.json (180-cell semantic oracle)
- INTENT.md (frozen intent text)
- guide_index.md (Bend proof-relevant guide summary)

## Forbidden
- Any modification to LAWS.bend, PROOF.bend, or the Bend checker
- ?TODO, ?name final-proof stubs, @unsafe, foreign imports
- Inspection of MRVN-08 J-SYNTHETIC-GENERATOR or K-LIVE-SAME-AGENT
  candidate implementations, descriptors, transformation recipes,
  or commentary

## Discovered
The constructed main.bend is structurally distinct from the canonical
(see strategy above).  The semantic behavior is byte-identical to the
oracle on all 180 cells.  The canonical PROOF.bend runs unchanged and
all terms check.  No law or checker edits were performed.
