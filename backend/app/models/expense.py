from datetime import date as date_type
from decimal import Decimal

from sqlalchemy import String, Date, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    date: Mapped[date_type] = mapped_column(
        Date,
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    paid_by: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )