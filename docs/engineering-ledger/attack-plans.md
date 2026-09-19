# Attack Plans

## AP-001: System Architecture & Initial Scaffolding

- **Owner**: Craft / Dev
- **Status**: in_progress (Build complete, Verification in progress)
- **Goal**: Establish core backend engine (FastAPI, PyMuPDF/VLM spatial parser, Pydantic self-correction validator, PostgreSQL ledger database), evaluation harness, scale/fallback handlers, and modern dark-mode React dashboard with interactive PDF visual overlay.

### Steps
1. [x] Adopt Craft framework in repository (`craft.project.yaml`, `AGENTS.md`, `docs/engineering-ledger/`).
2. [x] Copy project-local skills (54 skills including `system-design`, `doc-parsing`, `pydantic-validation`) into [`.agents/skills/`](file:///Users/ajas.bakran/Documents/personal/DocExtract/.agents/skills).
3. [x] Formulate comprehensive architecture covering Scale, Benchmarks, Failure Modes/Fallbacks, and HITL Routing in `implementation_plan.md`.
4. [x] Scaffold and build backend engine (`backend/app/core`, `backend/app/db`, `backend/app/parser`, `backend/app/validator`, `backend/app/services`, `backend/app/api`).
5. [x] Scaffold and build frontend dashboard with Vite + React + Tailwind + interactive SVG PDF bounding box canvas overlay.
6. [x] Implement end-to-end extraction pipeline with VLM prompts and self-reflection error correction.
7. [x] Implement evaluation benchmark harness (`NLD`, `TEDS`, `IoU`, latency).
8. [x] Implement dynamic HITL review workflow & immutable audit logging with database persistence.
9. [x] Verify all 10 automated unit, benchmark, and API integration tests pass.
10. [ ] Visual browser verification in user's browser.
