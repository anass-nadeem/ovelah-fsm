from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.asset import Asset
from app.schemas.asset import (
    AssetCreate,
    AssetResponse,
    AssetUpdate,
)


router = APIRouter(
    prefix="/assets",
    tags=["Assets"],
)


@router.post(
    "/",
    response_model=AssetResponse,
)
def create_asset(
    asset_data: AssetCreate,
    db: Session = Depends(get_db),
):
    asset = Asset(**asset_data.model_dump())

    db.add(asset)
    db.commit()
    db.refresh(asset)

    return asset


@router.get(
    "/",
    response_model=list[AssetResponse],
)
def get_assets(
    asset_type: str | None = None,
    db: Session = Depends(get_db),
):
    statement = select(Asset).order_by(Asset.name)

    if asset_type and asset_type != "All":
        statement = statement.where(Asset.asset_type == asset_type)

    return db.scalars(statement).all()


@router.get(
    "/{asset_id}",
    response_model=AssetResponse,
)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
):
    asset = db.get(Asset, asset_id)

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    return asset


@router.put(
    "/{asset_id}",
    response_model=AssetResponse,
)
def update_asset(
    asset_id: int,
    asset_data: AssetUpdate,
    db: Session = Depends(get_db),
):
    asset = db.get(Asset, asset_id)

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    update_data = asset_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(asset, field, value)

    db.commit()
    db.refresh(asset)

    return asset


@router.delete(
    "/{asset_id}",
)
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
):
    asset = db.get(Asset, asset_id)

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    db.delete(asset)
    db.commit()

    return {"detail": "Asset deleted"}