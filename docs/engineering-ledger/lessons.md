# Lessons Learned (LL)

| ID | Date | Scope | Lesson | Context / Action |
|----|------|-------|--------|------------------|
| LL-001 | 2026-09-19 | universal | Craft reference-only dependency strategy avoids copying upstream skills | Keep `.agents/skills` uncluttered while relying on `craft.manifest.yaml` pins |
| LL-002 | 2026-09-20 | project | CSS grid items default to min-width: auto causing blowout with canvas images; regexes must guard against header token bleed | Always specify min-w-0 on CSS grid children containing scaled canvases/SVGs, and anchor field regexes to boundary indicators |
