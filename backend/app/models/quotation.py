from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Quotation(Base):
    __tablename__ = "quotations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    job_id: Mapped[int | None] = mapped_column(
        ForeignKey("jobs.id"),
        nullable=True,
    )

    reference_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )

    date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    
    ntn_number: Mapped[str | None] = mapped_column(
    String(50),
    nullable=True,
    )

    pr_number: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    customer_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    branch_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    # Real links to the Customer/Branch master records, added
    # alongside the text fields above rather than replacing them.
    # customer_name/branch_name stay as the historical record of
    # what the document actually said - these IDs are what let the
    # system reliably know WHICH real client/branch a quotation
    # belongs to (for balances, client-specific settings like
    # requires_pr_number, etc.) without relying on exact text
    # matching. Nullable because older quotations created before
    # this existed won't have it set until the backfill script runs.
    customer_id: Mapped[int | None] = mapped_column(
        ForeignKey("customers.id"),
        nullable=True,
    )

    branch_id: Mapped[int | None] = mapped_column(
        ForeignKey("branches.id"),
        nullable=True,
    )

    assigned_by: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    subject: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=0,
        nullable=False,
    )

    payment_terms: Mapped[str] = mapped_column(
        Text,
        default="As per KFC Policy.",
        nullable=False,
    )

    validity: Mapped[str] = mapped_column(
        String(100),
        default="15 Days.",
        nullable=False,
    )

    job_completion: Mapped[str] = mapped_column(
        String(200),
        default="within 2-3 working days.",
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="Draft",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    job = relationship(
        "Job",
        back_populates="quotations",
    )

    # One-directional (no back_populates) - Customer doesn't need a
    # reverse "all my quotations" list right now, this is purely so
    # code that has a Quotation can easily check something about its
    # linked Customer (e.g. requires_pr_number) without a separate
    # query.
    customer = relationship("Customer")

    items = relationship(
        "QuotationItem",
        back_populates="quotation",
        cascade="all, delete-orphan",
        order_by="QuotationItem.sr_no",
    )
    
    revisions = relationship(
        "QuotationRevision",
        back_populates="quotation",
        cascade="all, delete-orphan",
        order_by="QuotationRevision.revision_number",
    )
    
class QuotationItem(Base):
    __tablename__ = "quotation_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    quotation_id: Mapped[int] = mapped_column(
        ForeignKey("quotations.id"),
        nullable=False,
    )

    sr_no: Mapped[int] = mapped_column(
        nullable=False,
    )

    item_id: Mapped[int | None] = mapped_column(
        ForeignKey("items.id"),
        nullable=True,
    )

    description: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    qty: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    uom: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    unit_rate: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    quotation = relationship(
        "Quotation",
        back_populates="items",
    )

    item = relationship("Item")