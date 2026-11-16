from pydantic import BaseModel, ConfigDict


class CustomerCreate(BaseModel):
    name: str
    requires_pr_number: bool = True


class CustomerUpdate(BaseModel):
    name: str | None = None
    requires_pr_number: bool | None = None


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    requires_pr_number: bool