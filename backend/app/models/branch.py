from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Branch(Base):
    __tablename__ = "branches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    site_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    customer = relationship(
        "Customer",
        back_populates="branches",
    )

    jobs = relationship(
        "Job",
        back_populates="branch",
        cascade="all, delete-orphan",
    )