from datetime import date as date_type
from decimal import Decimal

from sqlalchemy import String, Date, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Credit(Base):
    """
    Tracks money owed in either direction:
    - "Payable": the company owes this party (e.g. a supplier)
    - "Receivable": this party owes the company
    """

    __tablename__ = "credits"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    direction: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    party_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    date: Mapped[date_type] = mapped_column(
        Date,
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="Open",
    )