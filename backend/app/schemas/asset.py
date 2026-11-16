from datetime import date as date_type
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class AssetCreate(BaseModel):
    name: str
    asset_type: str
    value: Decimal | None = None
    purchase_date: date_type | None = None
    notes: str | None = None


class AssetUpdate(BaseModel):
    name: str | None = None
    asset_type: str | None = None
    value: Decimal | None = None
    purchase_date: date_type | None = None
    notes: str | None = None


class AssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    asset_type: str
    value: Decimal | None
    purchase_date: date_type | None
    notes: str | None