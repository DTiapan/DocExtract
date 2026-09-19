import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship

from backend.app.db.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(1024), nullable=False)
    content_type = Column(String(100), default="application/pdf")
    page_count = Column(Integer, default=0)
    status = Column(String(50), default="PENDING")  # PENDING, PARSING, PARSED, NEEDS_REVIEW, APPROVED, REJECTED, FAILED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    pages = relationship("DocumentPage", back_populates="document", cascade="all, delete-orphan")
    extractions = relationship("Extraction", back_populates="document", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="document", cascade="all, delete-orphan")


class DocumentPage(Base):
    __tablename__ = "document_pages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, nullable=False)
    image_path = Column(String(1024), nullable=False)
    width = Column(Integer, default=0)
    height = Column(Integer, default=0)
    layout_data = Column(JSON, nullable=True)  # PyMuPDF text spans and raw coordinates

    document = relationship("Document", back_populates="pages")


class Extraction(Base):
    __tablename__ = "extractions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    schema_type = Column(String(100), default="INVOICE")
    raw_json = Column(JSON, nullable=True)
    validated_json = Column(JSON, nullable=True)
    overall_confidence = Column(Float, default=0.0)
    status = Column(String(50), default="PENDING")  # AUTO_APPROVED, NEEDS_REVIEW, HUMAN_APPROVED, REJECTED
    retry_count = Column(Integer, default=0)
    model_version = Column(String(100), default="gemini-2.0-flash")
    validation_errors = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="extractions")
    fields = relationship("ExtractionField", back_populates="extraction", cascade="all, delete-orphan")


class ExtractionField(Base):
    __tablename__ = "extraction_fields"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    extraction_id = Column(String(36), ForeignKey("extractions.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, default=1)
    field_name = Column(String(255), nullable=False)
    extracted_value = Column(Text, nullable=True)
    normalized_value = Column(Text, nullable=True)
    confidence_score = Column(Float, default=0.0)
    bbox_x_min = Column(Integer, default=0)  # Normalized 0-1000
    bbox_y_min = Column(Integer, default=0)
    bbox_x_max = Column(Integer, default=0)
    bbox_y_max = Column(Integer, default=0)
    status = Column(String(50), default="VALID")  # VALID, WARNING, MANUAL_OVERRIDE
    warning_message = Column(Text, nullable=True)

    extraction = relationship("Extraction", back_populates="fields")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    extraction_id = Column(String(36), nullable=True)
    action = Column(String(100), nullable=False)
    field_name = Column(String(255), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    operator = Column(String(100), default="system")
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="audit_logs")
