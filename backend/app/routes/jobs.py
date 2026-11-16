from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.quotation import Quotation

from app.database import get_db
from app.models.branch import Branch
from app.models.job import Job
from app.schemas.job import (
    JobCreate,
    JobResponse,
    JobUpdate,
)


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
)


def generate_job_number(db: Session) -> str:
    last_job = db.scalars(
        select(Job)
        .order_by(Job.id.desc())
    ).first()

    if last_job is None:
        next_number = 1
    else:
        next_number = last_job.id + 1

    return f"JOB-{next_number:04d}"


@router.post(
    "/",
    response_model=JobResponse,
)
def create_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
):
    branch = db.get(Branch, job_data.branch_id)

    if not branch:
        raise HTTPException(
            status_code=404,
            detail="Branch not found",
        )

    job = Job(
        branch_id=job_data.branch_id,
        job_number=generate_job_number(db),
        complaint_date=job_data.complaint_date,
        complaint_description=job_data.complaint_description,
        pr_number=job_data.pr_number,
        status="New",
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return job


@router.get(
    "/",
    response_model=list[JobResponse],
)
def get_jobs(
    branch_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    statement = select(Job)

    if branch_id is not None:
        statement = statement.where(
            Job.branch_id == branch_id
        )

    if status is not None:
        statement = statement.where(
            Job.status == status
        )

    statement = statement.order_by(Job.id.desc())

    return db.scalars(statement).all()


@router.get(
    "/{job_id}",
    response_model=JobResponse,
)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
):
    job = db.get(Job, job_id)

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    return job


@router.put(
    "/{job_id}",
    response_model=JobResponse,
)
def update_job(
    job_id: int,
    job_data: JobUpdate,
    db: Session = Depends(get_db),
):
    job = db.get(Job, job_id)

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    update_data = job_data.model_dump(
        exclude_unset=True,
    )

    for field, value in update_data.items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)

    return job

# ---------------------------------------------------------
# DELETE JOB
# ---------------------------------------------------------
 
@router.delete(
    "/{job_id}",
)
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
):
    job = db.get(Job, job_id)
 
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )
 
    linked_quotation = db.scalar(
        select(Quotation).where(Quotation.job_id == job_id)
    )
 
    if linked_quotation:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Can't delete this job - quotation "
                f"{linked_quotation.reference_number} was created "
                f"from it. Delete that quotation first."
            ),
        )
 
    db.delete(job)
    db.commit()
 
    return {"detail": "Job deleted"}