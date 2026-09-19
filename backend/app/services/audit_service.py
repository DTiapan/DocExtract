from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.models import AuditLog


class AuditService:
    @staticmethod
    async def log_event(
        db: AsyncSession,
        document_id: str,
        action: str,
        extraction_id: Optional[str] = None,
        field_name: Optional[str] = None,
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
        operator: str = "system",
        details: Optional[Any] = None,
    ) -> AuditLog:
        """
        Creates an immutable audit log record for document lineage and SOC2 compliance.
        """
        log_entry = AuditLog(
            document_id=document_id,
            extraction_id=extraction_id,
            action=action,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
            operator=operator,
            details=details,
        )
        db.add(log_entry)
        await db.commit()
        await db.refresh(log_entry)
        return log_entry
