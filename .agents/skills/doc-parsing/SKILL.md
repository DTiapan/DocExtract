---
name: doc-parsing
description: Instructions and guidelines for spatial document layout analysis, PDF image rendering, and coordinate normalization.
---

# Spatial Document Parsing Skill

This skill defines the spatial parsing pipeline for DocExtract:

1. **PDF Rendering**: Convert raw PDF document pages into normalized PNG/JPEG images at 150-300 DPI using PyMuPDF (`fitz`).
2. **Text Block Extraction**: Extract text spans along with their original PDF bounding boxes `(x0, y0, x1, y1)`.
3. **Coordinate Normalization**: Convert raw PDF coordinates to a standard `0-1000` bounding box integer scale:
   $$x_{norm} = \left\lfloor \frac{x}{width} \times 1000 \right\rfloor, \quad y_{norm} = \left\lfloor \frac{y}{height} \times 1000 \right\rfloor$$
4. **Layout Structuring**: Organize text blocks into reading order and format them for multimodal VLM prompts.
