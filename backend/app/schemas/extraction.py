from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field


class PageResponse(BaseModel):
    id: str
    page_number: int
    image_url: str
    width: int
    height: int


class FieldResponse(BaseModel):
    id: str
    field_name: str
    page_number: int
    extracted_value: Optional[str]
    normalized_value: Optional[str]
    confidence_score: float
    bbox_x_min: int
    bbox_y_min: int
    bbox_x_max: int
    bbox_y_max: int
    status: str
    warning_message: Optional[str] = None


class ExtractionResponse(BaseModel):
    id: str
    document_id: str
    schema_type: str
    overall_confidence: float
    status: str
    retry_count: int
    model_version: str
    validation_errors: Optional[list[str]] = None
    fields: list[FieldResponse] = []
    created_at: datetime
    updated_at: datetime


class DocumentResponse(BaseModel):
    id: str
    filename: str
    page_count: int
    status: str
    created_at: datetime
    pages: list[PageResponse] = []
    latest_extraction: Optional[ExtractionResponse] = None


class AuditLogResponse(BaseModel):
    id: str
    action: str
    field_name: Optional[str]
    old_value: Optional[str]
    new_value: Optional[str]
    operator: str
    details: Optional[Any]
    created_at: datetime


class FieldUpdatePayload(BaseModel):
    field_id: str
    new_value: str
    operator: str = "human_operator"


class FieldBatchUpdatePayload(BaseModel):
    updates: list[FieldUpdatePayload]
