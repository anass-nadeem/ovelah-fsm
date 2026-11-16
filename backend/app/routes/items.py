from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemResponse, ItemUpdate


router = APIRouter(
    prefix="/items",
    tags=["Items"],
)


@router.post(
    "/",
    response_model=ItemResponse,
)
def create_item(
    item_data: ItemCreate,
    db: Session = Depends(get_db),
):
    item = Item(
        description=item_data.description,
        uom=item_data.uom,
        default_rate=item_data.default_rate,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@router.get(
    "/",
    response_model=list[ItemResponse],
)
def get_items(
    db: Session = Depends(get_db),
):
    statement = (
        select(Item)
        .where(Item.is_active == True)
        .order_by(Item.description)
    )

    return db.scalars(statement).all()


@router.get(
    "/{item_id}",
    response_model=ItemResponse,
)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
):
    item = db.get(Item, item_id)

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found",
        )

    return item


@router.put(
    "/{item_id}",
    response_model=ItemResponse,
)
def update_item(
    item_id: int,
    item_data: ItemUpdate,
    db: Session = Depends(get_db),
):
    item = db.get(Item, item_id)

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found",
        )

    update_data = item_data.model_dump(
        exclude_unset=True,
    )

    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)

    return item


@router.delete(
    "/{item_id}",
)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
):
    item = db.get(Item, item_id)

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found",
        )

    # Safe to delete unconditionally: past quotations/invoices that
    # used this item already have their own copy of the
    # description/uom/rate stored directly on the line item - they
    # don't look it up from the item master again, so nothing about
    # historical documents breaks.
    db.delete(item)
    db.commit()

    return {"detail": "Item deleted"}