from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.credit import Credit
from app.schemas.credit import (
    CreditCreate,
    CreditResponse,
    CreditUpdate,
)


router = APIRouter(
    prefix="/credits",
    tags=["Credits"],
)


@router.post(
    "/",
    response_model=CreditResponse,
)
def create_credit(
    credit_data: CreditCreate,
    db: Session = Depends(get_db),
):
    credit = Credit(
        direction=credit_data.direction.value,
        party_name=credit_data.party_name,
        amount=credit_data.amount,
        date=credit_data.date,
        description=credit_data.description,
        status="Open",
    )

    db.add(credit)
    db.commit()
    db.refresh(credit)

    return credit


@router.get(
    "/",
    response_model=list[CreditResponse],
)
def get_credits(
    direction: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    statement = select(Credit).order_by(Credit.date.desc())

    if direction and direction != "All":
        statement = statement.where(Credit.direction == direction)

    if status and status != "All":
        statement = statement.where(Credit.status == status)

    return db.scalars(statement).all()


@router.get(
    "/{credit_id}",
    response_model=CreditResponse,
)
def get_credit(
    credit_id: int,
    db: Session = Depends(get_db),
):
    credit = db.get(Credit, credit_id)

    if not credit:
        raise HTTPException(status_code=404, detail="Credit record not found")

    return credit


@router.put(
    "/{credit_id}",
    response_model=CreditResponse,
)
def update_credit(
    credit_id: int,
    credit_data: CreditUpdate,
    db: Session = Depends(get_db),
):
    credit = db.get(Credit, credit_id)

    if not credit:
        raise HTTPException(status_code=404, detail="Credit record not found")

    update_data = credit_data.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] is not None:
        update_data["status"] = update_data["status"].value

    for field, value in update_data.items():
        setattr(credit, field, value)

    db.commit()
    db.refresh(credit)

    return credit


@router.delete(
    "/{credit_id}",
)
def delete_credit(
    credit_id: int,
    db: Session = Depends(get_db),
):
    credit = db.get(Credit, credit_id)

    if not credit:
        raise HTTPException(status_code=404, detail="Credit record not found")

    db.delete(credit)
    db.commit()

    return {"detail": "Credit record deleted"}