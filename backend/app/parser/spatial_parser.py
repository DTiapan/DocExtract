from pathlib import Path
from typing import TypedDict, Any, Optional
import fitz  # PyMuPDF

from backend.app.core.config import settings


class NormalizedBox(TypedDict):
    x_min: int
    y_min: int
    x_max: int
    y_max: int


class RenderedPageData(TypedDict):
    page_number: int
    image_path: str
    relative_image_url: str
    width: int
    height: int
    text_blocks: list[dict[str, Any]]
    full_text: str


class SpatialDocumentParser:
    """
    Renders PDF pages to high-res images and extracts normalized spatial layout blocks.
    Coordinates are normalized to 0-1000 scale.
    """

    def __init__(self, dpi: int = settings.RENDER_DPI):
        self.dpi = dpi

    @staticmethod
    def normalize_coord(val: float, dimension: float) -> int:
        """Clamps and normalizes a coordinate to 0-1000 integer range."""
        if dimension <= 0:
            return 0
        norm = int(round((val / dimension) * 1000))
        return max(0, min(1000, norm))

    def parse_pdf(self, pdf_path: Path, doc_id: str) -> list[RenderedPageData]:
        """
        Extracts each page of the PDF into:
        1. High-res PNG image rendered to disk
        2. Normalized spatial text blocks with bounding boxes
        """
        doc = fitz.open(pdf_path)
        pages_data: list[RenderedPageData] = []
        target_dir = settings.RENDER_DIR / doc_id
        target_dir.mkdir(parents=True, exist_ok=True)

        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_num = page_idx + 1

            rect = page.rect
            page_width = rect.width
            page_height = rect.height

            # Render page to high-res pixmap
            zoom = self.dpi / 72.0
            matrix = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=matrix, alpha=False)

            image_filename = f"page_{page_num}.png"
            image_filepath = target_dir / image_filename
            pix.save(str(image_filepath))

            # Extract text blocks and coordinates
            raw_blocks = page.get_text("blocks")
            blocks: list[dict[str, Any]] = []
            full_page_text_parts: list[str] = []

            for b in raw_blocks:
                x0, y0, x1, y1, text, block_no, block_type = b
                cleaned_text = text.strip()
                if not cleaned_text:
                    continue

                norm_bbox = {
                    "x_min": self.normalize_coord(x0, page_width),
                    "y_min": self.normalize_coord(y0, page_height),
                    "x_max": self.normalize_coord(x1, page_width),
                    "y_max": self.normalize_coord(y1, page_height),
                }

                blocks.append({
                    "block_id": block_no,
                    "text": cleaned_text,
                    "bbox": norm_bbox,
                    "type": "text" if block_type == 0 else "image"
                })
                full_page_text_parts.append(cleaned_text)

            pages_data.append({
                "page_number": page_num,
                "image_path": str(image_filepath),
                "relative_image_url": f"/static/renders/{doc_id}/{image_filename}",
                "width": int(pix.width),
                "height": int(pix.height),
                "text_blocks": blocks,
                "full_text": "\n".join(full_page_text_parts)
            })

        doc.close()
        return pages_data

    @classmethod
    def locate_text_bbox(
        cls,
        pdf_path: Path,
        search_text: str,
        page_number: int = 1,
        occurrence_index: int = 0,
        near_y: Optional[int] = None,
        near_x: Optional[int] = None,
    ) -> Optional[dict[str, int]]:
        """
        Finds the exact normalized 0-1000 bounding box of a given text in the PDF.
        Supports proximity matching (near_y, near_x) to disambiguate identical values
        across multiple table rows or columns.
        """
        try:
            doc = fitz.open(pdf_path)
            if page_number > len(doc):
                doc.close()
                return None

            page = doc[page_number - 1]
            w, h = page.rect.width, page.rect.height

            # Search exact text
            rects = page.search_for(search_text)
            if not rects and search_text.startswith("$"):
                # Try searching without currency sign
                rects = page.search_for(search_text[1:])

            if not rects:
                # Try searching first significant word
                words = search_text.split()
                if words:
                    rects = page.search_for(words[0])

            doc.close()

            if rects:
                boxes = [
                    {
                        "x_min": cls.normalize_coord(r.x0, w),
                        "y_min": cls.normalize_coord(r.y0, h),
                        "x_max": cls.normalize_coord(r.x1, w),
                        "y_max": cls.normalize_coord(r.y1, h),
                    }
                    for r in rects
                ]

                # If proximity coordinates provided, pick closest box by euclidean distance
                if near_y is not None or near_x is not None:
                    def distance_sq(b: dict[str, int]) -> float:
                        cy = (b["y_min"] + b["y_max"]) / 2.0
                        cx = (b["x_min"] + b["x_max"]) / 2.0
                        dy = (cy - near_y) if near_y is not None else 0.0
                        dx = (cx - near_x) if near_x is not None else 0.0
                        return dy * dy + dx * dx

                    boxes.sort(key=distance_sq)
                    return boxes[0]

                idx = min(occurrence_index, len(boxes) - 1)
                return boxes[idx]
        except Exception as e:
            print(f"[locate_text_bbox] Error locating '{search_text}': {e}")

        return None

    @classmethod
    def snap_bbox_to_layout(
        cls,
        candidate_bbox: dict[str, int],
        layout_blocks: list[dict[str, Any]],
        iou_threshold: float = 0.2
    ) -> dict[str, int]:
        """
        Snaps a potentially hallucinated VLM bounding box to the closest true text block
        if an overlap exists, preventing bounding box drift.
        """
        if not layout_blocks:
            return candidate_bbox

        best_box = candidate_bbox
        best_iou = 0.0

        for block in layout_blocks:
            b = block["bbox"]
            iou = cls.calculate_iou(candidate_bbox, b)
            if iou > best_iou:
                best_iou = iou
                best_box = b

        if best_iou >= iou_threshold:
            return best_box
        return candidate_bbox

    @staticmethod
    def calculate_iou(boxA: dict[str, int], boxB: dict[str, int]) -> float:
        """Calculates Intersection over Union between two 0-1000 bounding boxes."""
        xA = max(boxA["x_min"], boxB["x_min"])
        yA = max(boxA["y_min"], boxB["y_min"])
        xB = min(boxA["x_max"], boxB["x_max"])
        yB = min(boxA["y_max"], boxB["y_max"])

        inter_width = max(0, xB - xA)
        inter_height = max(0, yB - yA)
        inter_area = inter_width * inter_height

        boxA_area = (boxA["x_max"] - boxA["x_min"]) * (boxA["y_max"] - boxA["y_min"])
        boxB_area = (boxB["x_max"] - boxB["x_min"]) * (boxB["y_max"] - boxB["y_min"])

        union_area = float(boxA_area + boxB_area - inter_area)
        if union_area <= 0:
            return 0.0

        return inter_area / union_area
