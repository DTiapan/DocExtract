from typing import Optional, Generic, TypeVar
from pydantic import BaseModel, Field, field_validator, model_validator

T = TypeVar("T")


class BoundingBox(BaseModel):
    x_min: int = Field(ge=0, le=1000, description="Normalized 0-1000 left coordinate")
    y_min: int = Field(ge=0, le=1000, description="Normalized 0-1000 top coordinate")
    x_max: int = Field(ge=0, le=1000, description="Normalized 0-1000 right coordinate")
    y_max: int = Field(ge=0, le=1000, description="Normalized 0-1000 bottom coordinate")

    @model_validator(mode="after")
    def validate_coordinates(self) -> "BoundingBox":
        if self.x_min > self.x_max:
            # Auto-correct inverted horizontal coordinates
            self.x_min, self.x_max = self.x_max, self.x_min
        if self.y_min > self.y_max:
            # Auto-correct inverted vertical coordinates
            self.y_min, self.y_max = self.y_max, self.y_min
        return self


class ExtractedField(BaseModel, Generic[T]):
    value: T
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    bbox: Optional[BoundingBox] = None
    page: int = Field(default=1, ge=1)
    warning: Optional[str] = None


class LineItem(BaseModel):
    description: ExtractedField[str]
    quantity: ExtractedField[float]
    unit_price: ExtractedField[float]
    total: ExtractedField[float]

    @model_validator(mode="after")
    def validate_item_math(self) -> "LineItem":
        qty = self.quantity.value
        price = self.unit_price.value
        item_total = self.total.value

        expected = round(qty * price, 2)
        actual = round(item_total, 2)

        if abs(expected - actual) > 0.05:
            raise ValueError(
                f"Line item math mismatch for '{self.description.value}': "
                f"quantity ({qty}) * unit_price ({price}) = {expected}, but total stated is {actual}."
            )
        return self


class InvoiceExtraction(BaseModel):
    invoice_number: ExtractedField[str]
    invoice_date: ExtractedField[str]
    due_date: Optional[ExtractedField[str]] = None
    vendor_name: ExtractedField[str]
    vendor_address: Optional[ExtractedField[str]] = None
    customer_name: ExtractedField[str]
    customer_address: Optional[ExtractedField[str]] = None
    line_items: list[LineItem] = Field(default_factory=list)
    subtotal: ExtractedField[float]
    tax_amount: ExtractedField[float] = Field(default_factory=lambda: ExtractedField(value=0.0, confidence=1.0))
    shipping_amount: ExtractedField[float] = Field(default_factory=lambda: ExtractedField(value=0.0, confidence=1.0))
    total_amount: ExtractedField[float]

    @model_validator(mode="after")
    def validate_invoice_totals(self) -> "InvoiceExtraction":
        # 1. Check line items sum vs subtotal
        if self.line_items:
            items_sum = round(sum(item.total.value for item in self.line_items), 2)
            stated_subtotal = round(self.subtotal.value, 2)
            if abs(items_sum - stated_subtotal) > 0.05:
                raise ValueError(
                    f"Subtotal mismatch: Sum of line items ({items_sum}) does not equal stated subtotal ({stated_subtotal})."
                )

        # 2. Check subtotal + tax + shipping vs total_amount
        calc_total = round(self.subtotal.value + self.tax_amount.value + self.shipping_amount.value, 2)
        stated_total = round(self.total_amount.value, 2)
        if abs(calc_total - stated_total) > 0.05:
            raise ValueError(
                f"Total amount mismatch: Subtotal ({self.subtotal.value}) + Tax ({self.tax_amount.value}) + "
                f"Shipping ({self.shipping_amount.value}) = {calc_total}, but stated total is {stated_total}."
            )

        return self
