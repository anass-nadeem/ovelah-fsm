from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    quotation_id: Mapped[int] = mapped_column(
        ForeignKey("quotations.id"),
        unique=True,
        nullable=False,
    )

    invoice_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )

    invoice_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    customer_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    branch_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    # Real links to the master records, alongside the text snapshot
    # fields. Copied from the source quotation at invoice time.
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

    pr_number: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    subject: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=0,
        nullable=False,
    )

    payment_terms: Mapped[str] = mapped_column(
        String(300),
        default="As per KFC Policy.",
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

    quotation = relationship(
        "Quotation",
    )

    customer = relationship("Customer")

    items = relationship(
        "InvoiceItem",
        back_populates="invoice",
        cascade="all, delete-orphan",
        order_by="InvoiceItem.sr_no",
    )


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    invoice_id: Mapped[int] = mapped_column(
        ForeignKey("invoices.id"),
        nullable=False,
    )

    sr_no: Mapped[int] = mapped_column(
        nullable=False,
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

    invoice = relationship(
        "Invoice",
        back_populates="items",
    )