from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel
from enum import Enum


class InvoiceStatus(str, Enum):
    DRAFT = "Draft"
    SENT = "Sent"
    PAID = "Paid"


class InvoiceStatusUpdate(BaseModel):
    status: InvoiceStatus


class InvoiceCreate(BaseModel):
    """
    Everything except the invoice date is copied straight from the
    source quotation (customer, branch, PR number, subject, items,
    amounts, payment terms) - the invoice is a snapshot of an
    Approved quotation, not a form the user fills in from scratch.
    """

    quotation_id: int
    invoice_date: date


class InvoiceItemInput(BaseModel):
    description: str
    qty: Decimal
    uom: str
    unit_rate: Decimal


class InvoiceUpdate(BaseModel):
    """
    Full edit of an already-created invoice - corrects mistakes made
    when it was generated (wrong date, a typo carried over from the
    quotation, a line item that needs adjusting) without touching the
    source quotation.
    """

    invoice_date: date

    customer_name: str
    branch_name: str
    customer_id: int | None
    branch_id: int | None
    assigned_by: str | None
    pr_number: str | None
    subject: str | None

    payment_terms: str

    items: list[InvoiceItemInput]


class InvoiceItemResponse(BaseModel):
    id: int
    sr_no: int
    description: str
    qty: Decimal
    uom: str
    unit_rate: Decimal
    amount: Decimal


class InvoiceResponse(BaseModel):
    id: int
    quotation_id: int

    invoice_number: str
    invoice_date: date

    customer_name: str
    branch_name: str
    assigned_by: str | None
    pr_number: str | None
    subject: str | None

    total_amount: Decimal
    payment_terms: str

    status: str

    items: list[InvoiceItemResponse]

    created_at: datetime