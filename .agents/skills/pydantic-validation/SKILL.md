---
name: pydantic-validation
description: Guidelines for building strict Pydantic v2 schemas, mathematical cross-validation rules, self-correction reflection loops, and field confidence scoring.
---

# Pydantic Validation & Self-Correction Skill

This skill defines the schema validation & self-correction strategy for DocExtract:

1. **Strict Pydantic v2 Models**: Define explicit target schemas (e.g. `Invoice`, `FinancialStatement`, `Contract`).
2. **Model Validators**: Add `@model_validator(mode='after')` methods to verify mathematical invariants:
   - `InvoiceTotal` must equal `Subtotal + Tax + Shipping`.
   - `LineItem.Amount` must equal `Quantity * UnitPrice`.
3. **Self-Correction Reflection Loop**:
   - If validation fails, capture `ValidationError.errors()`.
   - Construct a retry prompt containing the original page image, raw extraction attempt, and exact Pydantic validation error trace.
   - Execute up to 2 automated self-correction reflection retries before flagging for HITL.
4. **Field Confidence Scoring**: Calculate field confidence based on OCR matching, validation passes, and model logprobs. Scores $< 0.90$ trigger HITL review.
