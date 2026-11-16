from datetime import date as date_type
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ExpenseCreate(BaseModel):
    date: date_type
    category: str
    description: str | None = None
    amount: Decimal
    paid_by: str | None = None


class ExpenseUpdate(BaseModel):
    date: date_type | None = None
    category: str | None = None
    description: str | None = None
    amount: Decimal | None = None
    paid_by: str | None = None


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: date_type
    category: str
    description: str | None
    amount: Decimal
    paid_by: str | None