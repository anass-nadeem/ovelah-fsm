from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.expense import Expense
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseResponse,
    ExpenseUpdate,
)


router = APIRouter(
    prefix="/expenses",
    tags=["Expenses"],
)


@router.post(
    "/",
    response_model=ExpenseResponse,
)
def create_expense(
    expense_data: ExpenseCreate,
    db: Session = Depends(get_db),
):
    expense = Expense(**expense_data.model_dump())

    db.add(expense)
    db.commit()
    db.refresh(expense)

    return expense


@router.get(
    "/",
    response_model=list[ExpenseResponse],
)
def get_expenses(
    category: str | None = None,
    db: Session = Depends(get_db),
):
    statement = select(Expense).order_by(Expense.date.desc())

    if category and category != "All":
        statement = statement.where(Expense.category == category)

    return db.scalars(statement).all()


@router.get(
    "/{expense_id}",
    response_model=ExpenseResponse,
)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
):
    expense = db.get(Expense, expense_id)

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    return expense


@router.put(
    "/{expense_id}",
    response_model=ExpenseResponse,
)
def update_expense(
    expense_id: int,
    expense_data: ExpenseUpdate,
    db: Session = Depends(get_db),
):
    expense = db.get(Expense, expense_id)

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    update_data = expense_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)

    return expense


@router.delete(
    "/{expense_id}",
)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
):
    expense = db.get(Expense, expense_id)

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    db.delete(expense)
    db.commit()

    return {"detail": "Expense deleted"}