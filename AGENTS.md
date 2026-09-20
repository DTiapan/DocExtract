# AGENTS.md — DocExtract Enterprise

Welcome agent! This file defines repository rules, operating principles, and workflow orchestration for DocExtract Enterprise.

## Craft (Orchestration, Skills & Ledger)

- **Read Ledger First**: Non-trivial work must read `docs/engineering-ledger/INDEX.md` and active phase in `phases.md` before taking action.
- **Mandatory Skill-First Routing**: Every discussion, architecture design, development, and debugging task **must flow through the corresponding skill** in `.agents/skills/`. Before executing any phase, cross-check installed skills and load the best domain skill:
  - *Ideation & Discovery*: Load `idea-refine` or `interview-me` to sharpen ambiguous requirements.
  - *System Architecture & Design*: Load `system-design` (stress-test failure modes, trade-offs, scaling, data models) along with building blocks (`api-design`, `architecture-diagram`, `caching`, `resilience-failure`, `data-storage`, `messaging-streaming`).
  - *Specification & Decisions*: Load `spec-driven-development`. For irreversible forks, create an ADR in `docs/decisions/` per `documentation-and-adrs`.
  - *Implementation & TDD*: Load `incremental-implementation` for thin slices and `test-driven-development` (Red-Green-Refactor).
  - *Debugging & Errors*: Load `debugging-and-error-recovery` (systematic root cause analysis, never guess).
  - *Verification & Quality*: Load `constraint-driven-development` and `code-review-and-quality` before completing features.
  - *UI / Frontend*: Load `ui-ux-pro-max` and `frontend-ui-engineering`.
- **Anti-Drift**: Use the single best skill for the active phase (via `using-craft`). Never bypass skills or invent ad-hoc processes when an established skill exists.
- **Durable Ledger Updates**: Append tactical decisions (`DR-###`) and lessons (`LL-###`) to `docs/engineering-ledger/`, and update `INDEX.md` before ending substantive sessions.

## Engineering Core Principles

1. **Deterministic Validation**: Always combine VLM extraction with strict Pydantic mathematical and structural cross-validation.
2. **Immutable Audit Trails**: Track confidence scores, bounding box coordinates `(x_min, y_min, x_max, y_max)`, model versions, and human edits.
3. **Dynamic HITL Routing**: Route extractions with confidence < 90% or validation failures to the human review queue.
4. **Rich Dashboard Aesthetics**: Present side-by-side interactive document overlays and schema editing interfaces.
