from pydantic import BaseModel, ConfigDict


class BranchCreate(BaseModel):
    customer_id: int
    name: str
    address: str | None = None
    site_id: str | None = None


class BranchUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    site_id: str | None = None


class BranchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    name: str
    address: str | None
    site_id: str | None