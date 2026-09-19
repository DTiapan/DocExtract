from typing import Optional, Any
from pathlib import Path
from pydantic import ValidationError

from backend.app.core.config import settings
from backend.app.schemas.invoice import InvoiceExtraction
from backend.app.parser.vlm_extractor import VLMExtractor


class ValidationResult:
    def __init__(
        self,
        is_valid: bool,
        validated_data: Optional[InvoiceExtraction] = None,
        errors: Optional[list[str]] = None,
        raw_output: Optional[dict[str, Any]] = None,
        retry_count: int = 0,
        model_version: str = "unknown"
    ):
        self.is_valid = is_valid
        self.validated_data = validated_data
        self.errors = errors or []
        self.raw_output = raw_output or {}
        self.retry_count = retry_count
        self.model_version = model_version


class DocumentValidator:
    """
    Validates document extractions against strict mathematical Pydantic schemas.
    Executes automated self-correction reflection retry loops when mathematical or
    structural invariants fail.
    """

    def __init__(
        self,
        vlm_extractor: Optional[VLMExtractor] = None,
        max_retries: int = settings.MAX_SELF_CORRECTION_RETRIES
    ):
        self.vlm_extractor = vlm_extractor or VLMExtractor()
        self.max_retries = max_retries

    @staticmethod
    def validate_invoice(raw_dict: dict[str, Any]) -> tuple[Optional[InvoiceExtraction], list[str]]:
        """
        Validates a raw dictionary against InvoiceExtraction schema.
        Returns (InvoiceExtraction, list_of_error_strings).
        """
        try:
            validated = InvoiceExtraction.model_validate(raw_dict)
            return validated, []
        except ValidationError as e:
            error_messages = []
            for err in e.errors():
                loc = " -> ".join(str(item) for item in err["loc"])
                msg = err["msg"]
                error_messages.append(f"Field '{loc}': {msg}")
            return None, error_messages
        except Exception as ex:
            return None, [f"Unexpected schema validation error: {str(ex)}"]

    def extract_and_validate_with_reflection(
        self,
        image_path: Path,
        page_number: int = 1,
        layout_hint: Optional[str] = None
    ) -> ValidationResult:
        """
        Runs multimodal VLM extraction. If mathematical validation fails,
        executes an automated reflection retry loop feeding exact validation errors
        back to the model up to max_retries.
        """
        retry_count = 0
        current_errors: list[str] = []
        raw_output: dict[str, Any] = {}
        model_version = "unknown"

        while retry_count <= self.max_retries:
            # First attempt or reflection retry attempt
            raw_output, model_version = self.vlm_extractor.extract_document_page(
                image_path=image_path,
                page_number=page_number,
                layout_hint=layout_hint,
                reflection_errors=current_errors if retry_count > 0 else None,
                previous_attempt=raw_output if retry_count > 0 else None
            )

            validated_data, errors = self.validate_invoice(raw_output)

            if validated_data:
                # Validation succeeded!
                return ValidationResult(
                    is_valid=True,
                    validated_data=validated_data,
                    errors=[],
                    raw_output=raw_output,
                    retry_count=retry_count,
                    model_version=model_version
                )

            # Validation failed, prepare reflection context for next retry
            current_errors = errors
            retry_count += 1
            print(f"[DocumentValidator] Attempt {retry_count} failed validation: {errors}. Retrying with reflection...")

        # If we exhausted retries without passing validation, return invalid state
        return ValidationResult(
            is_valid=False,
            validated_data=None,
            errors=current_errors,
            raw_output=raw_output,
            retry_count=retry_count - 1,
            model_version=model_version
        )
