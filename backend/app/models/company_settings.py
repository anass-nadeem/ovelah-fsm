from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CompanySettings(Base):
    __tablename__ = "company_settings"

    id: Mapped[int] = mapped_column(primary_key=True)

    company_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    ntn_number: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    address: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    phone: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    email: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    letterhead_path: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )