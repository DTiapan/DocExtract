import shutil
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.db.models import Document, DocumentPage, Extraction, ExtractionField, AuditLog
from backend.app.schemas.extraction import (
    DocumentResponse,
    PageResponse,
    FieldResponse,
    ExtractionResponse,
    AuditLogResponse,
    FieldUpdatePayload,
    FieldBatchUpdatePayload,
)
from backend.app.parser.spatial_parser import SpatialDocumentParser
from backend.app.parser.vlm_extractor import VLMExtractor
from backend.app.validator.pydantic_validator import DocumentValidator
from backend.app.services.hitl_router import HITLRouter
from backend.app.services.audit_service import AuditService

router = APIRouter()
spatial_parser = SpatialDocumentParser()
vlm_extractor = VLMExtractor()
validator = DocumentValidator(vlm_extractor=vlm_extractor)
hitl_router = HITLRouter()


@router.post("/documents/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Uploads a PDF document, decomposes it into pages, runs spatial parsing,
    performs VLM extraction with self-correction reflection loops,
    and dynamically routes to Auto-Approve or HITL queue.
    """
    if not file.filename.lower().endswith((".pdf", ".png", ".jpg", ".jpeg")):
        raise HTTPException(status_code=400, detail="Only PDF and image documents are supported.")

    doc_id = str(uuid.uuid4())
    file_ext = Path(file.filename).suffix
    saved_pdf_path = settings.UPLOAD_DIR / f"{doc_id}{file_ext}"

    # Save uploaded file
    with open(saved_pdf_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create document record
    doc_record = Document(
        id=doc_id,
        filename=file.filename,
        file_path=str(saved_pdf_path),
        content_type=file.content_type or "application/pdf",
        status="PARSING",
    )
    db.add(doc_record)
    await db.commit()

    await AuditService.log_event(
        db, doc_id, action="DOCUMENT_UPLOADED", details={"filename": file.filename, "size": saved_pdf_path.stat().st_size}
    )

    try:
        # 1. Parse PDF pages & layout
        pages_data = spatial_parser.parse_pdf(saved_pdf_path, doc_id)
        doc_record.page_count = len(pages_data)

        for p in pages_data:
            page_rec = DocumentPage(
                document_id=doc_id,
                page_number=p["page_number"],
                image_path=p["image_path"],
                width=p["width"],
                height=p["height"],
                layout_data=p["text_blocks"]
            )
            db.add(page_rec)

        await db.commit()

        # 2. Run VLM extraction with reflection on the primary page
        primary_page = pages_data[0]
        validation_result = validator.extract_and_validate_with_reflection(
            image_path=Path(primary_page["image_path"]),
            page_number=primary_page["page_number"],
            layout_hint=primary_page["full_text"]
        )

        # 3. Dynamic HITL routing
        routing_status, overall_conf, field_records = hitl_router.evaluate_and_route(validation_result)

        # 4. Save Extraction
        extraction_rec = Extraction(
            document_id=doc_id,
            schema_type="INVOICE",
            raw_json=validation_result.raw_output,
            validated_json=validation_result.validated_data.model_dump() if validation_result.validated_data else None,
            overall_confidence=overall_conf,
            status=routing_status,
            retry_count=validation_result.retry_count,
            model_version=validation_result.model_version,
            validation_errors=validation_result.errors,
        )
        db.add(extraction_rec)
        await db.commit()
        await db.refresh(extraction_rec)

        # 5. Save fields
        for f in field_records:
            field_rec = ExtractionField(
                extraction_id=extraction_rec.id,
                page_number=f["page_number"],
                field_name=f["field_name"],
                extracted_value=f["extracted_value"],
                normalized_value=f["normalized_value"],
                confidence_score=f["confidence_score"],
                bbox_x_min=f["bbox_x_min"],
                bbox_y_min=f["bbox_y_min"],
                bbox_x_max=f["bbox_x_max"],
                bbox_y_max=f["bbox_y_max"],
                status=f["status"],
                warning_message=f["warning_message"],
            )
            db.add(field_rec)

        doc_record.status = "APPROVED" if routing_status == "AUTO_APPROVED" else "NEEDS_REVIEW"
        await db.commit()

        # 6. Audit Trail Logging
        await AuditService.log_event(
            db,
            doc_id,
            action="EXTRACTION_COMPLETED",
            extraction_id=extraction_rec.id,
            operator=f"engine:{validation_result.model_version}",
            details={
                "routing_status": routing_status,
                "overall_confidence": overall_conf,
                "retries": validation_result.retry_count,
                "errors": validation_result.errors,
            }
        )

        return await get_document_by_id(doc_id, db)

    except Exception as e:
        doc_record.status = "FAILED"
        await db.commit()
        await AuditService.log_event(
            db, doc_id, action="EXTRACTION_FAILED", details={"error": str(e)}
        )
        raise HTTPException(status_code=500, detail=f"Document parsing failed: {str(e)}")


@router.get("/documents", response_model=list[DocumentResponse])
async def list_documents(db: AsyncSession = Depends(get_db)):
    """Lists all documents sorted by newest first."""
    query = (
        select(Document)
        .options(
            selectinload(Document.pages),
            selectinload(Document.extractions).selectinload(Extraction.fields)
        )
        .order_by(desc(Document.created_at))
    )
    result = await db.execute(query)
    docs = result.scalars().all()

    response_list = []
    for doc in docs:
        response_list.append(format_document_response(doc))
    return response_list


@router.get("/documents/{doc_id}", response_model=DocumentResponse)
async def get_document_by_id(doc_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves single document with pages and extractions."""
    query = (
        select(Document)
        .where(Document.id == doc_id)
        .options(
            selectinload(Document.pages),
            selectinload(Document.extractions).selectinload(Extraction.fields)
        )
    )
    result = await db.execute(query)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    return format_document_response(doc)


@router.get("/extractions/queue", response_model=list[DocumentResponse])
async def get_hitl_queue(db: AsyncSession = Depends(get_db)):
    """Returns all documents currently pending Human-In-The-Loop review."""
    query = (
        select(Document)
        .where(Document.status == "NEEDS_REVIEW")
        .options(
            selectinload(Document.pages),
            selectinload(Document.extractions).selectinload(Extraction.fields)
        )
        .order_by(desc(Document.created_at))
    )
    result = await db.execute(query)
    docs = result.scalars().all()
    return [format_document_response(d) for d in docs]


@router.post("/extractions/{extraction_id}/approve", response_model=DocumentResponse)
async def approve_extraction(
    extraction_id: str,
    operator: str = Form("human_reviewer"),
    db: AsyncSession = Depends(get_db)
):
    """Human operator approves and commits the document extraction."""
    query = select(Extraction).where(Extraction.id == extraction_id)
    result = await db.execute(query)
    extraction = result.scalar_one_or_none()
    if not extraction:
        raise HTTPException(status_code=404, detail="Extraction not found.")

    extraction.status = "HUMAN_APPROVED"

    doc_query = select(Document).where(Document.id == extraction.document_id)
    doc_res = await db.execute(doc_query)
    doc = doc_res.scalar_one_or_none()
    if doc:
        doc.status = "APPROVED"

    await db.commit()

    await AuditService.log_event(
        db,
        document_id=extraction.document_id,
        extraction_id=extraction_id,
        action="EXTRACTION_HUMAN_APPROVED",
        operator=operator,
        details={"approved_confidence": extraction.overall_confidence}
    )

    return await get_document_by_id(extraction.document_id, db)


@router.put("/extractions/{extraction_id}/fields", response_model=DocumentResponse)
async def update_extraction_fields(
    extraction_id: str,
    payload: FieldBatchUpdatePayload,
    db: AsyncSession = Depends(get_db)
):
    """Allows human operator to manually override extracted field values with full audit trail."""
    query = select(Extraction).where(Extraction.id == extraction_id)
    res = await db.execute(query)
    extraction = res.scalar_one_or_none()
    if not extraction:
        raise HTTPException(status_code=404, detail="Extraction not found.")

    for update in payload.updates:
        f_query = select(ExtractionField).where(
            ExtractionField.id == update.field_id,
            ExtractionField.extraction_id == extraction_id
        )
        f_res = await db.execute(f_query)
        field_rec = f_res.scalar_one_or_none()
        if field_rec:
            old_val = field_rec.extracted_value
            field_rec.extracted_value = update.new_value
            field_rec.normalized_value = update.new_value
            field_rec.confidence_score = 1.0  # Human verified
            field_rec.status = "MANUAL_OVERRIDE"
            field_rec.warning_message = f"Manually verified by {update.operator}"

            await AuditService.log_event(
                db,
                document_id=extraction.document_id,
                extraction_id=extraction_id,
                action="OPERATOR_FIELD_EDIT",
                field_name=field_rec.field_name,
                old_value=old_val,
                new_value=update.new_value,
                operator=update.operator,
            )

    await db.commit()
    return await get_document_by_id(extraction.document_id, db)


@router.get("/audit/{doc_id}", response_model=list[AuditLogResponse])
async def get_document_audit_trail(doc_id: str, db: AsyncSession = Depends(get_db)):
    """Returns the complete immutable audit trail for a document."""
    query = select(AuditLog).where(AuditLog.document_id == doc_id).order_by(AuditLog.created_at.asc())
    res = await db.execute(query)
    logs = res.scalars().all()

    return [
        AuditLogResponse(
            id=log.id,
            action=log.action,
            field_name=log.field_name,
            old_value=log.old_value,
            new_value=log.new_value,
            operator=log.operator,
            details=log.details,
            created_at=log.created_at
        )
        for log in logs
    ]


@router.post("/documents/sample-demo", response_model=DocumentResponse)
async def generate_and_upload_sample_demo(
    db: AsyncSession = Depends(get_db)
):
    """
    Generates a high-quality sample enterprise PDF invoice and processes it.
    Ideal for 1-click test runs and instant demonstration!
    """
    from backend.sample_docs.generate_sample_pdf import create_enterprise_invoice_pdf

    sample_pdf_path = settings.DATA_DIR / "sample_enterprise_invoice.pdf"
    create_enterprise_invoice_pdf(sample_pdf_path)

    doc_id = str(uuid.uuid4())
    target_pdf = settings.UPLOAD_DIR / f"{doc_id}.pdf"
    shutil.copy(sample_pdf_path, target_pdf)

    doc_record = Document(
        id=doc_id,
        filename="Apex_Global_Enterprise_Invoice.pdf",
        file_path=str(target_pdf),
        content_type="application/pdf",
        status="PARSING",
    )
    db.add(doc_record)
    await db.commit()

    await AuditService.log_event(
        db, doc_id, action="SAMPLE_DEMO_GENERATED", details={"filename": doc_record.filename}
    )

    pages_data = spatial_parser.parse_pdf(target_pdf, doc_id)
    doc_record.page_count = len(pages_data)

    for p in pages_data:
        db.add(DocumentPage(
            document_id=doc_id,
            page_number=p["page_number"],
            image_path=p["image_path"],
            width=p["width"],
            height=p["height"],
            layout_data=p["text_blocks"]
        ))
    await db.commit()

    primary = pages_data[0]
    validation_result = validator.extract_and_validate_with_reflection(
        image_path=Path(primary["image_path"]),
        page_number=primary["page_number"],
        layout_hint=primary["full_text"]
    )

    routing_status, overall_conf, field_records = hitl_router.evaluate_and_route(validation_result)

    extraction_rec = Extraction(
        document_id=doc_id,
        schema_type="INVOICE",
        raw_json=validation_result.raw_output,
        validated_json=validation_result.validated_data.model_dump() if validation_result.validated_data else None,
        overall_confidence=overall_conf,
        status=routing_status,
        retry_count=validation_result.retry_count,
        model_version=validation_result.model_version,
        validation_errors=validation_result.errors,
    )
    db.add(extraction_rec)
    await db.commit()
    await db.refresh(extraction_rec)

    for f in field_records:
        db.add(ExtractionField(
            extraction_id=extraction_rec.id,
            page_number=f["page_number"],
            field_name=f["field_name"],
            extracted_value=f["extracted_value"],
            normalized_value=f["normalized_value"],
            confidence_score=f["confidence_score"],
            bbox_x_min=f["bbox_x_min"],
            bbox_y_min=f["bbox_y_min"],
            bbox_x_max=f["bbox_x_max"],
            bbox_y_max=f["bbox_y_max"],
            status=f["status"],
            warning_message=f["warning_message"],
        ))

    doc_record.status = "APPROVED" if routing_status == "AUTO_APPROVED" else "NEEDS_REVIEW"
    await db.commit()

    await AuditService.log_event(
        db,
        doc_id,
        action="EXTRACTION_COMPLETED",
        extraction_id=extraction_rec.id,
        operator=f"engine:{validation_result.model_version}",
        details={"routing_status": routing_status, "overall_confidence": overall_conf}
    )

    return await get_document_by_id(doc_id, db)


def format_document_response(doc: Document) -> DocumentResponse:
    latest_ext = doc.extractions[-1] if doc.extractions else None
    ext_resp = None
    if latest_ext:
        fields_resp = [
            FieldResponse(
                id=f.id,
                field_name=f.field_name,
                page_number=f.page_number,
                extracted_value=f.extracted_value,
                normalized_value=f.normalized_value,
                confidence_score=f.confidence_score,
                bbox_x_min=f.bbox_x_min,
                bbox_y_min=f.bbox_y_min,
                bbox_x_max=f.bbox_x_max,
                bbox_y_max=f.bbox_y_max,
                status=f.status,
                warning_message=f.warning_message,
            )
            for f in latest_ext.fields
        ]
        ext_resp = ExtractionResponse(
            id=latest_ext.id,
            document_id=latest_ext.document_id,
            schema_type=latest_ext.schema_type,
            overall_confidence=latest_ext.overall_confidence,
            status=latest_ext.status,
            retry_count=latest_ext.retry_count,
            model_version=latest_ext.model_version,
            validation_errors=latest_ext.validation_errors,
            fields=fields_resp,
            created_at=latest_ext.created_at,
            updated_at=latest_ext.updated_at,
        )

    pages_resp = [
        PageResponse(
            id=p.id,
            page_number=p.page_number,
            image_url=f"/static/renders/{doc.id}/page_{p.page_number}.png",
            width=p.width,
            height=p.height,
        )
        for p in doc.pages
    ]

    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        page_count=doc.page_count,
        status=doc.status,
        created_at=doc.created_at,
        pages=pages_resp,
        latest_extraction=ext_resp,
    )
