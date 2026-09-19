# AGENTS.md — DocExtract Enterprise

Welcome agent! This file defines repository rules, operating principles, and workflow orchestration for DocExtract Enterprise.

## Craft (orchestration + ledger)

- Non-trivial work: read `docs/engineering-ledger/INDEX.md` first.
- Route phases via `using-craft` skill (reference-only — do not copy Addy skills into this repo).
- Append DR/LL/INDEX before ending substantive sessions.
- Irreversible forks: ADR in `docs/decisions/` per `documentation-and-adrs`.

## Engineering Core Principles

1. **Deterministic Validation**: Always combine VLM extraction with strict Pydantic mathematical and structural cross-validation.
2. **Immutable Audit Trails**: Track confidence scores, bounding box coordinates `(x_min, y_min, x_max, y_max)`, model versions, and human edits.
3. **Dynamic HITL Routing**: Route extractions with confidence < 90% or validation failures to the human review queue.
4. **Rich Dashboard Aesthetics**: Present side-by-side interactive document overlays and schema editing interfaces.
