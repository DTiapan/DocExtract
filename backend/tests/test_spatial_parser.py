from pathlib import Path
from backend.app.parser.spatial_parser import SpatialDocumentParser
from backend.sample_docs.generate_sample_pdf import create_enterprise_invoice_pdf


def test_spatial_parser_renders_and_normalizes_pdf(tmp_path: Path):
    """Verifies that PDF pages are rendered to disk and coordinates are 0-1000 normalized."""
    pdf_path = tmp_path / "test_invoice.pdf"
    create_enterprise_invoice_pdf(pdf_path)

    parser = SpatialDocumentParser(dpi=150)
    pages = parser.parse_pdf(pdf_path, doc_id="test-doc-123")

    assert len(pages) == 1
    page = pages[0]
    assert page["page_number"] == 1
    assert Path(page["image_path"]).exists()
    assert page["width"] > 0
    assert page["height"] > 0
    assert len(page["text_blocks"]) > 0

    # Test coordinate normalization boundaries (0 <= coord <= 1000)
    for block in page["text_blocks"]:
        bbox = block["bbox"]
        assert 0 <= bbox["x_min"] <= 1000
        assert 0 <= bbox["y_min"] <= 1000
        assert 0 <= bbox["x_max"] <= 1000
        assert 0 <= bbox["y_max"] <= 1000
        assert bbox["x_min"] <= bbox["x_max"]
        assert bbox["y_min"] <= bbox["y_max"]


def test_iou_calculation():
    """Tests bounding box intersection over union formula."""
    boxA = {"x_min": 100, "y_min": 100, "x_max": 200, "y_max": 200}
    boxB = {"x_min": 100, "y_min": 100, "x_max": 200, "y_max": 200}
    # Exactly identical boxes -> IoU = 1.0
    iou_identical = SpatialDocumentParser.calculate_iou(boxA, boxB)
    assert round(iou_identical, 2) == 1.0

    boxC = {"x_min": 300, "y_min": 300, "x_max": 400, "y_max": 400}
    # Disjoint boxes -> IoU = 0.0
    iou_disjoint = SpatialDocumentParser.calculate_iou(boxA, boxC)
    assert iou_disjoint == 0.0

    boxD = {"x_min": 150, "y_min": 100, "x_max": 250, "y_max": 200}
    # 50% horizontal overlap
    iou_partial = SpatialDocumentParser.calculate_iou(boxA, boxD)
    assert 0.0 < iou_partial < 1.0
