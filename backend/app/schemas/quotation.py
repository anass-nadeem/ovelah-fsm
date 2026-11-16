from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel
from enum import Enum


class QuotationStatus(str, Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    INVOICED = "Invoiced"


class QuotationStatusUpdate(BaseModel):
    status: QuotationStatus
    
class QuotationItemCreate(BaseModel):
    item_id: int | None = None
    description: str
    qty: Decimal
    uom: str
    unit_rate: Decimal


class QuotationItemUpdate(BaseModel):
    item_id: int | None = None
    description: str
    qty: Decimal
    uom: str
    unit_rate: Decimal


class QuotationCreate(BaseModel):
    job_id: int | None = None

    quotation_date: date
    ntn_number: str | None = None
    pr_number: str | None = None

    customer_name: str
    branch_name: str

    customer_id: int | None = None
    branch_id: int | None = None

    assigned_by: str | None = None

    subject: str | None = None
    description: str | None = None

    items: list[QuotationItemCreate]

    payment_terms: str = "As per KFC Policy."
    validity: str = "15 Days."
    job_completion: str = "within 2-3 working days."


class QuotationUpdate(BaseModel):
    quotation_date: date
    ntn_number: str | None = None
    pr_number: str | None = None

    customer_name: str
    branch_name: str

    customer_id: int | None = None
    branch_id: int | None = None

    assigned_by: str | None = None

    subject: str | None = None
    description: str | None = None

    items: list[QuotationItemUpdate]

    payment_terms: str = "As per KFC Policy."
    validity: str = "15 Days."
    job_completion: str = "within 2-3 working days."

    # Required whenever an existing quotation is edited
    revision_description: str


class QuotationItemResponse(BaseModel):
    id: int
    sr_no: int
    item_id: int | None
    description: str
    qty: Decimal
    uom: str
    unit_rate: Decimal
    amount: Decimal


class QuotationRevisionResponse(BaseModel):
    id: int
    quotation_id: int
    revision_number: int
    description: str
    created_at: datetime


class QuotationResponse(BaseModel):
    id: int
    job_id: int | None

    reference_number: str
    date: date

    ntn_number: str | None
    pr_number: str | None

    customer_name: str
    branch_name: str
    customer_id: int | None
    branch_id: int | None
    assigned_by: str | None

    subject: str | None
    description: str | None

    total_amount: Decimal

    payment_terms: str
    validity: str
    job_completion: str

    status: str

    items: list[QuotationItemResponse]

    revisions: list[QuotationRevisionResponse] = []