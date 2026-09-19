import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.db.session import engine, Base


@pytest_asyncio.fixture(autouse=True)
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest.mark.asyncio
async def test_healthcheck_and_sample_demo_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Healthcheck
        health_res = await client.get("/health")
        assert health_res.status_code == 200
        assert health_res.json()["status"] == "healthy"

        # 2. Trigger sample enterprise demo creation & extraction
        demo_res = await client.post("/api/v1/documents/sample-demo")
        assert demo_res.status_code == 200
        doc_data = demo_res.json()

        doc_id = doc_data["id"]
        assert doc_data["page_count"] == 1
        assert doc_data["status"] in ["APPROVED", "NEEDS_REVIEW"]
        assert doc_data["latest_extraction"] is not None

        extraction_id = doc_data["latest_extraction"]["id"]
        fields = doc_data["latest_extraction"]["fields"]
        assert len(fields) > 0

        # Check field bounding box coordinates are normalized 0-1000
        for f in fields:
            assert 0 <= f["bbox_x_min"] <= 1000
            assert 0 <= f["bbox_y_min"] <= 1000
            assert 0 <= f["bbox_x_max"] <= 1000
            assert 0 <= f["bbox_y_max"] <= 1000

        # 3. Retrieve document by ID
        get_res = await client.get(f"/api/v1/documents/{doc_id}")
        assert get_res.status_code == 200
        assert get_res.json()["id"] == doc_id

        # 4. Operator field edit (Human-In-The-Loop override)
        first_field = fields[0]
        update_payload = {
            "updates": [
                {
                    "field_id": first_field["id"],
                    "new_value": "INV-MODIFIED-9999",
                    "operator": "lead_engineer_auditor"
                }
            ]
        }
        edit_res = await client.put(f"/api/v1/extractions/{extraction_id}/fields", json=update_payload)
        assert edit_res.status_code == 200
        updated_doc = edit_res.json()
        updated_field = next(f for f in updated_doc["latest_extraction"]["fields"] if f["id"] == first_field["id"])
        assert updated_field["extracted_value"] == "INV-MODIFIED-9999"
        assert updated_field["status"] == "MANUAL_OVERRIDE"

        # 5. Approve extraction
        approve_res = await client.post(f"/api/v1/extractions/{extraction_id}/approve", data={"operator": "lead_engineer_auditor"})
        assert approve_res.status_code == 200
        assert approve_res.json()["status"] == "APPROVED"

        # 6. Audit Trail verification
        audit_res = await client.get(f"/api/v1/audit/{doc_id}")
        assert audit_res.status_code == 200
        audit_logs = audit_res.json()
        assert len(audit_logs) >= 3
        actions = [log["action"] for log in audit_logs]
        assert "SAMPLE_DEMO_GENERATED" in actions
        assert "EXTRACTION_COMPLETED" in actions
        assert "OPERATOR_FIELD_EDIT" in actions
        assert "EXTRACTION_HUMAN_APPROVED" in actions
