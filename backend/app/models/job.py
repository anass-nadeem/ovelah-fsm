from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    branch_id: Mapped[int] = mapped_column(
        ForeignKey("branches.id"),
        nullable=False,
    )

    job_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )

    complaint_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    complaint_description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    pr_number: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="New",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    branch = relationship(
        "Branch",
        back_populates="jobs",
    )

    quotations = relationship(
        "Quotation",
        back_populates="job",
        cascade="all, delete-orphan",
    )