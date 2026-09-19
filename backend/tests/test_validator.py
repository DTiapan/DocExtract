import pytest
from backend.app.schemas.invoice import InvoiceExtraction, ExtractedField, LineItem, BoundingBox
from backend.app.validator.pydantic_validator import DocumentValidator


def test_valid_invoice_mathematical_invariants():
    """Tests that an invoice with exact arithmetic passes Pydantic validation."""
    data = {
        "invoice_number": {"value": "INV-001", "confidence": 0.98},
        "invoice_date": {"value": "2026-09-15", "confidence": 0.99},
        "vendor_name": {"value": "Apex Systems", "confidence": 0.99},
        "customer_name": {"value": "Fortress Capital", "confidence": 0.98},
        "line_items": [
            {
                "description": {"value": "Cloud GPU Cluster", "confidence": 0.99},
                "quantity": {"value": 2.0, "confidence": 0.99},
                "unit_price": {"value": 500.0, "confidence": 0.99},
                "total": {"value": 1000.0, "confidence": 0.99},
            },
            {
                "description": {"value": "Data Engineering", "confidence": 0.97},
                "quantity": {"value": 10.0, "confidence": 0.99},
                "unit_price": {"value": 150.0, "confidence": 0.98},
                "total": {"value": 1500.0, "confidence": 0.99},
            }
        ],
        "subtotal": {"value": 2500.0, "confidence": 0.99},
        "tax_amount": {"value": 200.0, "confidence": 0.95},
        "shipping_amount": {"value": 0.0, "confidence": 0.99},
        "total_amount": {"value": 2700.0, "confidence": 0.99},
    }

    validated, errors = DocumentValidator.validate_invoice(data)
    assert validated is not None
    assert len(errors) == 0
    assert validated.total_amount.value == 2700.0


def test_invalid_line_item_math():
    """Tests that quantity * unit_price != total raises a validation error."""
    data = {
        "invoice_number": {"value": "INV-002", "confidence": 0.98},
        "invoice_date": {"value": "2026-09-15", "confidence": 0.99},
        "vendor_name": {"value": "Apex Systems", "confidence": 0.99},
        "customer_name": {"value": "Fortress Capital", "confidence": 0.98},
        "line_items": [
            {
                "description": {"value": "Bad Line Item", "confidence": 0.99},
                "quantity": {"value": 3.0, "confidence": 0.99},
                "unit_price": {"value": 100.0, "confidence": 0.99},
                "total": {"value": 999.0, "confidence": 0.99},  # Mismatch: 3 * 100 != 999
            }
        ],
        "subtotal": {"value": 999.0, "confidence": 0.99},
        "tax_amount": {"value": 0.0, "confidence": 0.99},
        "shipping_amount": {"value": 0.0, "confidence": 0.99},
        "total_amount": {"value": 999.0, "confidence": 0.99},
    }

    validated, errors = DocumentValidator.validate_invoice(data)
    assert validated is None
    assert len(errors) > 0
    assert any("Line item math mismatch" in err for err in errors)


def test_invalid_subtotal_mismatch():
    """Tests that sum(line_items) != subtotal raises a validation error."""
    data = {
        "invoice_number": {"value": "INV-003", "confidence": 0.98},
        "invoice_date": {"value": "2026-09-15", "confidence": 0.99},
        "vendor_name": {"value": "Apex Systems", "confidence": 0.99},
        "customer_name": {"value": "Fortress Capital", "confidence": 0.98},
        "line_items": [
            {
                "description": {"value": "Item A", "confidence": 0.99},
                "quantity": {"value": 1.0, "confidence": 0.99},
                "unit_price": {"value": 100.0, "confidence": 0.99},
                "total": {"value": 100.0, "confidence": 0.99},
            }
        ],
        "subtotal": {"value": 500.0, "confidence": 0.99},  # Mismatch: 100 != 500
        "tax_amount": {"value": 0.0, "confidence": 0.99},
        "shipping_amount": {"value": 0.0, "confidence": 0.99},
        "total_amount": {"value": 500.0, "confidence": 0.99},
    }

    validated, errors = DocumentValidator.validate_invoice(data)
    assert validated is None
    assert any("Subtotal mismatch" in err for err in errors)


def test_bounding_box_normalization_and_clamping():
    """Tests coordinate range enforcement and inverted-coordinate auto-flip."""
    box = BoundingBox(x_min=800, y_min=500, x_max=200, y_max=100)
    # Coordinates were inverted; validator should flip them correctly
    assert box.x_min == 200
    assert box.x_max == 800
    assert box.y_min == 100
    assert box.y_max == 500
