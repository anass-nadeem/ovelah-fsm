from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.company_settings import CompanySettings
from app.schemas.settings import (
    CompanySettingsResponse,
    CompanySettingsUpdate,
)


router = APIRouter(
    prefix="/settings",
    tags=["Settings"],
)


def get_or_create_settings(db: Session) -> CompanySettings:
    """
    Company settings are a single row - there's only ever one
    company. Auto-create it with sensible defaults (matching the
    real letterhead already used on generated PDFs) the first time
    anyone asks for it, instead of requiring a separate setup step.
    """

    settings = db.scalar(select(CompanySettings))

    if settings is None:
        settings = CompanySettings(
            company_name="Infinity Engineering Solutions",
            ntn_number="I299711-2",
            address=(
                "2nd floor CA 217, opposite bank Al Habib, "
                "Saidpur Road, Rawalpindi"
            ),
            phone="0344-1830738 / 0307-1771304",
            email="official.infinityengsolutions@gmail.com",
        )

        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


@router.get(
    "/",
    response_model=CompanySettingsResponse,
)
def get_settings(
    db: Session = Depends(get_db),
):
    return get_or_create_settings(db)


@router.put(
    "/",
    response_model=CompanySettingsResponse,
)
def update_settings(
    settings_data: CompanySettingsUpdate,
    db: Session = Depends(get_db),
):
    settings = get_or_create_settings(db)

    update_data = settings_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)

    return settings