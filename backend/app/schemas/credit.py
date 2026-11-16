from datetime import date as date_type
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict


class CreditDirection(str, Enum):
    PAYABLE = "Payable"
    RECEIVABLE = "Receivable"


class CreditStatus(str, Enum):
    OPEN = "Open"
    SETTLED = "Settled"


class CreditCreate(BaseModel):
    direction: CreditDirection
    party_name: str
    amount: Decimal
    date: date_type
    description: str | None = None


class CreditUpdate(BaseModel):
    party_name: str | None = None
    amount: Decimal | None = None
    date: date_type | None = None
    description: str | None = None
    status: CreditStatus | None = None


class CreditResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    direction: str
    party_name: str
    amount: Decimal
    date: date_type
    description: str | None
    status: str