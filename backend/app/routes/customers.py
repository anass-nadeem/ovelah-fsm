from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.customer import Customer
from app.schemas.customer import (
    CustomerCreate,
    CustomerResponse,
    CustomerUpdate,
)


router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


@router.post(
    "/",
    response_model=CustomerResponse,
)
def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
):
    customer = Customer(
        name=customer_data.name,
        requires_pr_number=customer_data.requires_pr_number,
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


@router.get(
    "/",
    response_model=list[CustomerResponse],
)
def get_customers(
    db: Session = Depends(get_db),
):
    statement = select(Customer).order_by(Customer.name)

    return db.scalars(statement).all()


@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
):
    customer = db.get(Customer, customer_id)

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    return customer


@router.put(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db),
):
    customer = db.get(Customer, customer_id)

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    update_data = customer_data.model_dump(
        exclude_unset=True,
    )

    for field, value in update_data.items():
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)

    return customer


@router.delete(
    "/{customer_id}",
)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
):
    customer = db.get(Customer, customer_id)

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    if customer.branches:
        raise HTTPException(
            status_code=409,
            detail=(
                "Can't delete this customer - it still has "
                f"{len(customer.branches)} branch(es) on file. "
                "You'd need to remove those branches first."
            ),
        )

    db.delete(customer)
    db.commit()

    return {"detail": "Customer deleted"}