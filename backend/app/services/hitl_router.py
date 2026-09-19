from typing import Any, Optional
from backend.app.core.config import settings
from backend.app.schemas.invoice import InvoiceExtraction, ExtractedField, BoundingBox
from backend.app.validator.pydantic_validator import ValidationResult


class HITLRouter:
    """
    Computes field-level confidence scores and dynamically routes extractions:
    - Overall confidence >= 90% and no validation errors -> AUTO_APPROVED
    - Overall confidence < 90% or validation errors -> NEEDS_REVIEW (routed to HITL queue)
    """

    def __init__(self, threshold: float = settings.AUTO_APPROVE_CONFIDENCE_THRESHOLD):
        self.threshold = threshold

    def evaluate_and_route(
        self,
        validation_result: ValidationResult
    ) -> tuple[str, float, list[dict[str, Any]]]:
        """
        Evaluates the validation result and returns:
        (routing_status, overall_confidence, list_of_field_records)
        """
        field_records: list[dict[str, Any]] = []

        if validation_result.is_valid and validation_result.validated_data:
            # Extract fields from validated Pydantic model
            invoice = validation_result.validated_data

            def add_field(name: str, field_obj: ExtractedField, page: int = 1, warning: Optional[str] = None):
                bbox = field_obj.bbox or BoundingBox(x_min=0, y_min=0, x_max=0, y_max=0)
                field_records.append({
                    "field_name": name,
                    "extracted_value": str(field_obj.value),
                    "normalized_value": str(field_obj.value),
                    "confidence_score": field_obj.confidence,
                    "page_number": field_obj.page or page,
                    "bbox_x_min": bbox.x_min,
                    "bbox_y_min": bbox.y_min,
                    "bbox_x_max": bbox.x_max,
                    "bbox_y_max": bbox.y_max,
                    "status": "WARNING" if (field_obj.confidence < self.threshold or warning) else "VALID",
                    "warning_message": warning or (f"Low confidence ({int(field_obj.confidence * 100)}%)" if field_obj.confidence < self.threshold else None)
                })

            add_field("invoice_number", invoice.invoice_number)
            add_field("invoice_date", invoice.invoice_date)
            if invoice.due_date:
                add_field("due_date", invoice.due_date)
            add_field("vendor_name", invoice.vendor_name)
            if invoice.vendor_address:
                add_field("vendor_address", invoice.vendor_address)
            add_field("customer_name", invoice.customer_name)
            if invoice.customer_address:
                add_field("customer_address", invoice.customer_address)

            for idx, item in enumerate(invoice.line_items):
                prefix = f"item_{idx + 1}"
                add_field(f"{prefix}_description", item.description)
                add_field(f"{prefix}_quantity", item.quantity)
                add_field(f"{prefix}_unit_price", item.unit_price)
                add_field(f"{prefix}_total", item.total)

            add_field("subtotal", invoice.subtotal)
            add_field("tax_amount", invoice.tax_amount)
            add_field("shipping_amount", invoice.shipping_amount)
            add_field("total_amount", invoice.total_amount)

            # Compute overall confidence
            scores = [f["confidence_score"] for f in field_records]
            overall_confidence = round(sum(scores) / len(scores), 3) if scores else 0.0

            # Route based on threshold
            if overall_confidence >= self.threshold:
                routing_status = "AUTO_APPROVED"
            else:
                routing_status = "NEEDS_REVIEW"

            return routing_status, overall_confidence, field_records

        else:
            # Document failed validation
            raw = validation_result.raw_output
            # Decompose raw dictionary into fields with warnings
            for key, val in raw.items():
                if isinstance(val, dict) and "value" in val:
                    bbox_dict = val.get("bbox", {})
                    field_records.append({
                        "field_name": key,
                        "extracted_value": str(val.get("value", "")),
                        "normalized_value": str(val.get("value", "")),
                        "confidence_score": min(val.get("confidence", 0.5), 0.65),  # Penalize unvalidated fields
                        "page_number": val.get("page", 1),
                        "bbox_x_min": bbox_dict.get("x_min", 0),
                        "bbox_y_min": bbox_dict.get("y_min", 0),
                        "bbox_x_max": bbox_dict.get("x_max", 0),
                        "bbox_y_max": bbox_dict.get("y_max", 0),
                        "status": "WARNING",
                        "warning_message": "Validation failed on document"
                    })

            overall_confidence = 0.50
            routing_status = "NEEDS_REVIEW"
            return routing_status, overall_confidence, field_records
