# Engineering Ledger — Index

> Read this file before non-trivial work. Update at end of each substantive session.

**Active phase:** Build  
**Last updated:** 2026-09-20

## Current focus

Implemented DocExtract Enterprise — full end-to-end architecture with:
1. Spatial document layout parser (`PyMuPDF` rendering at 200 DPI, normalized 0-1000 coordinate system, bounding box IoU calculation).
2. Multimodal Vision Language Model extractor supporting Google Gemini Vision, fallback spatial engine, and self-correction reflection retry loops.
3. Strict Pydantic v2 schemas (`InvoiceExtraction`, `LineItem`, `BoundingBox`) enforcing mathematical cross-validation.
4. Dynamic HITL Router with field-level confidence scoring ($\ge 90\%$ Auto-Approve, $< 90\%$ Human Review Queue).
5. Immutable SOC2-compliant audit trail with database persistence.
6. Modern dark-mode side-by-side review dashboard (React, Vite, Tailwind CSS, SVG bounding box overlay).
7. Evaluation benchmark harness testing NLD accuracy, TEDS table score, IoU, and latency.

## Open attack plan

- [AP-001: System Architecture & Initial Scaffolding](attack-plans.md#ap-001-system-architecture--initial-scaffolding)

## Recent sessions

- **2026-09-20 (Session 2)**: Resolved bounding box coordinate alignment using PyMuPDF proximity sorting (`near_y`, `near_x`) across table cells and refined regex disambiguation. Fixed CSS grid blowout with `min-w-0` and responsive document container scaling. Regenerated clean enterprise demo in SQLite database.
- **2026-09-20 (Session 1)**: Completed Build phase: backend API + spatial parser + Pydantic reflection validator + HITL router + audit service + 10 passing tests + Vite/React dark-mode dashboard with shadcn/Linear aesthetic overhaul.
- **2026-09-19**: Bootstrapped Craft framework (`craft.project.yaml`, `AGENTS.md`, `docs/engineering-ledger/`, 54 project-local skills in `.agents/skills/`). Formulated comprehensive architecture covering Scale, Benchmarks, and Fallbacks.

## Quick links

- [Phases](phases.md)
- [Attack plans](attack-plans.md)
- [Decisions](decisions.md)
- [Lessons](lessons.md)
- [ADRs](../decisions/)
