from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.branch import Branch
from app.schemas.branch import (
    BranchCreate,
    BranchResponse,
    BranchUpdate,
)


router = APIRouter(
    prefix="/branches",
    tags=["Branches"],
)


@router.post(
    "/",
    response_model=BranchResponse,
)
def create_branch(
    branch_data: BranchCreate,
    db: Session = Depends(get_db),
):
    branch = Branch(
        customer_id=branch_data.customer_id,
        name=branch_data.name,
        address=branch_data.address,
        site_id=branch_data.site_id,
    )

    db.add(branch)
    db.commit()
    db.refresh(branch)

    return branch


@router.get(
    "/",
    response_model=list[BranchResponse],
)
def get_branches(
    customer_id: int | None = None,
    db: Session = Depends(get_db),
):
    statement = select(Branch)

    if customer_id is not None:
        statement = statement.where(
            Branch.customer_id == customer_id
        )

    statement = statement.order_by(Branch.name)

    return db.scalars(statement).all()


@router.get(
    "/{branch_id}",
    response_model=BranchResponse,
)
def get_branch(
    branch_id: int,
    db: Session = Depends(get_db),
):
    branch = db.get(Branch, branch_id)

    if not branch:
        raise HTTPException(
            status_code=404,
            detail="Branch not found",
        )

    return branch


@router.put(
    "/{branch_id}",
    response_model=BranchResponse,
)
def update_branch(
    branch_id: int,
    branch_data: BranchUpdate,
    db: Session = Depends(get_db),
):
    branch = db.get(Branch, branch_id)

    if not branch:
        raise HTTPException(
            status_code=404,
            detail="Branch not found",
        )

    update_data = branch_data.model_dump(
        exclude_unset=True,
    )

    for field, value in update_data.items():
        setattr(branch, field, value)

    db.commit()
    db.refresh(branch)

    return branch


@router.delete(
    "/{branch_id}",
)
def delete_branch(
    branch_id: int,
    db: Session = Depends(get_db),
):
    branch = db.get(Branch, branch_id)

    if not branch:
        raise HTTPException(
            status_code=404,
            detail="Branch not found",
        )

    if branch.jobs:
        raise HTTPException(
            status_code=409,
            detail=(
                "Can't delete this branch - it still has "
                f"{len(branch.jobs)} job(s) on file. You'd need "
                "to remove those jobs first."
            ),
        )

    db.delete(branch)
    db.commit()

    return {"detail": "Branch deleted"}