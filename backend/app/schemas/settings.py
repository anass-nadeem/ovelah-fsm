from pydantic import BaseModel, ConfigDict


class CompanySettingsUpdate(BaseModel):
    company_name: str | None = None
    ntn_number: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None


class CompanySettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_name: str
    ntn_number: str | None
    address: str | None
    phone: str | None
    email: str | None 