from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ItemCreate(BaseModel):
    description: str
    uom: str
    default_rate: Decimal | None = None


class ItemUpdate(BaseModel):
    description: str | None = None
    uom: str | None = None
    default_rate: Decimal | None = None
    is_active: bool | None = None


class ItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    description: str
    uom: str
    default_rate: Decimal | None
    is_active: bool