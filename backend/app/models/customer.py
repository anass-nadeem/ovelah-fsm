from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    # Per-client document settings. Starts with just this one flag
    # (PR Number is only meaningful for some clients, e.g. KFC) -
    # defaults to True so every existing customer keeps behaving
    # exactly as before (PR Number shown/asked for) until someone
    # explicitly turns it off for a client that doesn't use it.
    # More flags like this can be added the same way as new
    # per-client differences come up.
    requires_pr_number: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="1",
    )

    branches = relationship(
        "Branch",
        back_populates="customer",
        cascade="all, delete-orphan",
    )