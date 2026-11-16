from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class QuotationRevision(Base):
    __tablename__ = "quotation_revisions"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    quotation_id: Mapped[int] = mapped_column(
        ForeignKey("quotations.id"),
        nullable=False,
        index=True,
    )

    revision_number: Mapped[int] = mapped_column(
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    quotation = relationship(
        "Quotation",
        back_populates="revisions",
    )