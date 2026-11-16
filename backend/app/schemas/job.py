from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class JobCreate(BaseModel):
    branch_id: int
    complaint_date: date | None = None
    complaint_description: str | None = None
    pr_number: str | None = None


class JobUpdate(BaseModel):
    complaint_date: date | None = None
    complaint_description: str | None = None
    status: str | None = None
    pr_number: str | None = None


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    branch_id: int
    job_number: str
    complaint_date: date | None
    complaint_description: str | None
    pr_number: str | None
    status: str
    created_at: datetime