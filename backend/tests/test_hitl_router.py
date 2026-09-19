from backend.app.services.hitl_router import HITLRouter
from backend.app.validator.pydantic_validator import ValidationResult, DocumentValidator


def test_hitl_router_auto_approve_high_confidence():
    """High confidence (>=90%) with valid schema auto-routes to AUTO_APPROVED."""
    data = {
        "invoice_number": {"value": "INV-001", "confidence": 0.98},
        "invoice_date": {"value": "2026-09-15", "confidence": 0.99},
        "vendor_name": {"value": "Apex Systems", "confidence": 0.99},
        "customer_name": {"value": "Fortress Capital", "confidence": 0.98},
        "line_items": [
            {
                "description": {"value": "Cloud Infrastructure", "confidence": 0.98},
                "quantity": {"value": 1.0, "confidence": 0.99},
                "unit_price": {"value": 1000.0, "confidence": 0.98},
                "total": {"value": 1000.0, "confidence": 0.98},
            }
        ],
        "subtotal": {"value": 1000.0, "confidence": 0.99},
        "tax_amount": {"value": 80.0, "confidence": 0.96},
        "shipping_amount": {"value": 0.0, "confidence": 0.99},
        "total_amount": {"value": 1080.0, "confidence": 0.99},
    }

    validated, errors = DocumentValidator.validate_invoice(data)
    result = ValidationResult(
        is_valid=True,
        validated_data=validated,
        errors=[],
        raw_output=data,
        retry_count=0,
        model_version="test-model"
    )

    router = HITLRouter(threshold=0.90)
    status, conf, fields = router.evaluate_and_route(result)

    assert status == "AUTO_APPROVED"
    assert conf >= 0.90
    assert len(fields) > 0


def test_hitl_router_flags_low_confidence_for_review():
    """Low confidence (<90%) routes to NEEDS_REVIEW for human queue."""
    data = {
        "invoice_number": {"value": "INV-002", "confidence": 0.65},  # Low confidence
        "invoice_date": {"value": "2026-09-15", "confidence": 0.70},
        "vendor_name": {"value": "Apex Systems", "confidence": 0.75},
        "customer_name": {"value": "Fortress Capital", "confidence": 0.68},
        "line_items": [
            {
                "description": {"value": "Cloud Infrastructure", "confidence": 0.70},
                "quantity": {"value": 1.0, "confidence": 0.80},
                "unit_price": {"value": 1000.0, "confidence": 0.75},
                "total": {"value": 1000.0, "confidence": 0.75},
            }
        ],
        "subtotal": {"value": 1000.0, "confidence": 0.70},
        "tax_amount": {"value": 0.0, "confidence": 0.75},
        "shipping_amount": {"value": 0.0, "confidence": 0.80},
        "total_amount": {"value": 1000.0, "confidence": 0.72},
    }

    validated, errors = DocumentValidator.validate_invoice(data)
    result = ValidationResult(
        is_valid=True,
        validated_data=validated,
        errors=[],
        raw_output=data,
        retry_count=0,
        model_version="test-model"
    )

    router = HITLRouter(threshold=0.90)
    status, conf, fields = router.evaluate_and_route(result)

    assert status == "NEEDS_REVIEW"
    assert conf < 0.90
    # Field warning status should be set
    assert any(f["status"] == "WARNING" for f in fields)
