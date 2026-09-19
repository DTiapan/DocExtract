from pathlib import Path
import fitz  # PyMuPDF


def create_enterprise_invoice_pdf(output_path: Path):
    """
    Generates a clean, realistic enterprise invoice PDF using PyMuPDF.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4 size

    # Palette
    c_primary = (0.08, 0.18, 0.36)     # Deep Navy
    c_dark = (0.12, 0.12, 0.14)        # Charcoal Text
    c_muted = (0.45, 0.45, 0.50)       # Gray Muted
    c_line = (0.85, 0.87, 0.90)        # Border light gray
    c_bg_row = (0.96, 0.97, 0.99)      # Table header bg

    # Header Bar
    page.draw_rect(fitz.Rect(0, 0, 595, 12), color=c_primary, fill=c_primary)

    # Vendor Title
    page.insert_text((45, 60), "APEX GLOBAL ENTERPRISE", fontsize=18, fontname="helv", color=c_primary)
    page.insert_text((45, 76), "Mission-Critical AI & Data Systems", fontsize=9, fontname="helv", color=c_muted)
    page.insert_text((45, 92), "100 Montgomery St, Suite 2400, San Francisco, CA 94104", fontsize=8, fontname="helv", color=c_muted)

    # Invoice Metadata Box (Right aligned)
    page.insert_text((400, 55), "INVOICE", fontsize=20, fontname="helv", color=c_primary)
    page.insert_text((400, 75), "Invoice Number:", fontsize=8, fontname="helv", color=c_muted)
    page.insert_text((480, 75), "INV-2026-8894", fontsize=9, fontname="helv", color=c_dark)

    page.insert_text((400, 90), "Invoice Date:", fontsize=8, fontname="helv", color=c_muted)
    page.insert_text((480, 90), "2026-09-15", fontsize=9, fontname="helv", color=c_dark)

    page.insert_text((400, 105), "Payment Terms:", fontsize=8, fontname="helv", color=c_muted)
    page.insert_text((480, 105), "Net 30", fontsize=9, fontname="helv", color=c_dark)

    page.insert_text((400, 120), "Due Date:", fontsize=8, fontname="helv", color=c_muted)
    page.insert_text((480, 120), "2026-10-15", fontsize=9, fontname="helv", color=c_dark)

    # Divider line
    page.draw_line(fitz.Point(45, 140), fitz.Point(550, 140), color=c_line, width=1)

    # Bill To Section
    page.insert_text((45, 165), "BILLED TO:", fontsize=9, fontname="helv", color=c_muted)
    page.insert_text((45, 180), "Fortress Capital Management", fontsize=11, fontname="helv", color=c_dark)
    page.insert_text((45, 195), "Attn: Financial Technology Division", fontsize=9, fontname="helv", color=c_dark)
    page.insert_text((45, 210), "55 Wall Street, 18th Floor, New York, NY 10005", fontsize=8, fontname="helv", color=c_muted)

    # Table Header Box
    page.draw_rect(fitz.Rect(45, 240, 550, 262), color=c_line, fill=c_bg_row)
    page.insert_text((55, 255), "DESCRIPTION / SERVICE", fontsize=8, fontname="helv", color=c_primary)
    page.insert_text((330, 255), "QTY", fontsize=8, fontname="helv", color=c_primary)
    page.insert_text((400, 255), "UNIT PRICE", fontsize=8, fontname="helv", color=c_primary)
    page.insert_text((490, 255), "TOTAL AMOUNT", fontsize=8, fontname="helv", color=c_primary)

    # Line Items
    items = [
        ("DocExtract Enterprise Engine Core License", 1.0, 12500.00, 12500.00),
        ("High-Throughput VLM Multimodal OCR Cluster", 2.0, 3200.00, 6400.00),
        ("Dedicated SOC2 Immutable Audit Vault", 1.0, 1850.00, 1850.00),
        ("24/7 Enterprise Forward Deployment Support", 1.0, 4250.00, 4250.00),
    ]

    y = 285
    for desc, qty, unit, total in items:
        page.insert_text((55, y), desc, fontsize=9, fontname="helv", color=c_dark)
        page.insert_text((335, y), f"{qty:.1f}", fontsize=9, fontname="helv", color=c_dark)
        page.insert_text((400, y), f"${unit:,.2f}", fontsize=9, fontname="helv", color=c_dark)
        page.insert_text((490, y), f"${total:,.2f}", fontsize=9, fontname="helv", color=c_dark)
        page.draw_line(fitz.Point(45, y + 10), fitz.Point(550, y + 10), color=c_line, width=0.5)
        y += 28

    # Totals Summary Box
    subtotal = sum(item[3] for item in items)  # 25,000.00
    tax = round(subtotal * 0.08, 2)            # 2,000.00
    shipping = 0.00
    grand_total = subtotal + tax + shipping    # 27,000.00

    y_totals = y + 20
    page.insert_text((360, y_totals), "Subtotal:", fontsize=9, fontname="helv", color=c_muted)
    page.insert_text((485, y_totals), f"${subtotal:,.2f}", fontsize=9, fontname="helv", color=c_dark)

    page.insert_text((360, y_totals + 20), "Estimated Tax (8%):", fontsize=9, fontname="helv", color=c_muted)
    page.insert_text((485, y_totals + 20), f"${tax:,.2f}", fontsize=9, fontname="helv", color=c_dark)

    page.insert_text((360, y_totals + 40), "Shipping & Handling:", fontsize=9, fontname="helv", color=c_muted)
    page.insert_text((485, y_totals + 40), f"${shipping:,.2f}", fontsize=9, fontname="helv", color=c_dark)

    # Grand Total Highlight
    page.draw_rect(fitz.Rect(350, y_totals + 55, 550, y_totals + 85), color=c_primary, fill=c_primary)
    page.insert_text((360, y_totals + 74), "TOTAL DUE:", fontsize=11, fontname="helv", color=(1, 1, 1))
    page.insert_text((475, y_totals + 74), f"${grand_total:,.2f}", fontsize=12, fontname="helv", color=(1, 1, 1))

    # Payment & Wire Instructions Footer
    page.draw_line(fitz.Point(45, 750), fitz.Point(550, 750), color=c_line, width=1)
    page.insert_text((45, 768), "REMITTANCE & WIRE TRANSFER DETAILS", fontsize=8, fontname="helv", color=c_primary)
    page.insert_text((45, 782), "Bank: JPMorgan Chase NA  |  Routing (ABA): 021000021  |  Account: 9832-4412-00", fontsize=8, fontname="helv", color=c_muted)
    page.insert_text((45, 796), "Electronic Fund Transfers must reference Invoice Number INV-2026-8894", fontsize=7, fontname="helv", color=c_muted)

    doc.save(str(output_path))
    doc.close()
    return output_path


if __name__ == "__main__":
    test_path = Path("data/sample_enterprise_invoice.pdf")
    create_enterprise_invoice_pdf(test_path)
    print(f"Generated sample PDF at: {test_path}")
