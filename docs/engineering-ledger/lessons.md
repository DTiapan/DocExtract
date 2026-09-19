# Lessons Learned (LL)

| ID | Date | Scope | Lesson | Context / Action |
|----|------|-------|--------|------------------|
| LL-001 | 2026-09-19 | universal | Craft reference-only dependency strategy avoids copying upstream skills | Keep `.agents/skills` uncluttered while relying on `craft.manifest.yaml` pins |
| LL-002 | 2026-09-20 | project | CSS grid items default to min-width: auto causing blowout with canvas images; regexes must guard against header token bleed | Always specify min-w-0 on CSS grid children containing scaled canvases/SVGs, and anchor field regexes to boundary indicators |
| LL-003 | 2026-09-20 | universal | Pitch-black dark mode with neon matrix wireframes feels like AI slop when viewing white documents | Documents are white paper; framing them on neutral light desk canvases (#f1f5f9) with crisp cobalt outlines (#3b82f6) and calm slate typography eliminates glare and creates authentic B2B SaaS authority |
