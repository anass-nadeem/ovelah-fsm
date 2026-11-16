
import re
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models.invoice import Invoice

from app.database import get_db
from app.models.quotation import Quotation, QuotationItem
from app.models.quotation_revision import QuotationRevision
from app.models.job import Job
from app.services.pdf_service import generate_quotation_pdf, build_quotation_filename

from app.schemas.quotation import (
    QuotationCreate,
    QuotationResponse,
    QuotationUpdate,
    QuotationRevisionResponse,
    QuotationStatusUpdate,
)


router = APIRouter(
    prefix="/quotations",
    tags=["Quotations"],
)


# ---------------------------------------------------------
# GENERATE REFERENCE NUMBER
# ---------------------------------------------------------

def generate_reference_number(db: Session) -> str:
    """
    Generate the next quotation reference number.

    Example:
        IES/QT/1001
        IES/QT/1002
        IES/QT/1003

    Looks at the numeric part of every existing reference number
    (not just whichever row happens to have the highest database id,
    which doesn't necessarily correspond to the highest number - and
    isn't safe against revision-style numbers like "IES/QT/1013(A)")
    and continues from the highest one found.
    """

    all_quotations = db.scalars(select(Quotation)).all()

    highest = 1000

    for quotation in all_quotations:
        match = re.search(r"(\d+)", quotation.reference_number or "")

        if match:
            highest = max(highest, int(match.group(1)))

    return f"IES/QT/{highest + 1}"


# ---------------------------------------------------------
# CREATE QUOTATION
# ---------------------------------------------------------

@router.post(
    "/",
    response_model=QuotationResponse,
)
def create_quotation(
    quotation_data: QuotationCreate,
    db: Session = Depends(get_db),
):
    reference_number = generate_reference_number(db)

    job = None

    if quotation_data.job_id is not None:
        job = db.get(Job, quotation_data.job_id)

        if not job:
            raise HTTPException(
                status_code=404,
                detail="Job not found",
            )

    # If the quotation didn't specify a PR number but the job it's
    # being created from already has one on file, use that instead
    # of asking the user to re-type it.
    pr_number = quotation_data.pr_number

    if not pr_number and job is not None:
        pr_number = job.pr_number

    quotation = Quotation(
        job_id=quotation_data.job_id,
        reference_number=reference_number,
        date=quotation_data.quotation_date,
        ntn_number=quotation_data.ntn_number,
        pr_number=pr_number,
        customer_name=quotation_data.customer_name,
        branch_name=quotation_data.branch_name,
        customer_id=quotation_data.customer_id,
        branch_id=quotation_data.branch_id,
        assigned_by=quotation_data.assigned_by,
        subject=quotation_data.subject,
        description=quotation_data.description,
        payment_terms=quotation_data.payment_terms,
        validity=quotation_data.validity,
        job_completion=quotation_data.job_completion,
        total_amount=Decimal("0.00"),
        status="Draft",
    )

    total = Decimal("0.00")

    for index, item_data in enumerate(
        quotation_data.items,
        start=1,
    ):
        amount = (
            item_data.qty
            * item_data.unit_rate
        )

        total += amount

        quotation_item = QuotationItem(
            sr_no=index,
            item_id=item_data.item_id,
            description=item_data.description,
            qty=item_data.qty,
            uom=item_data.uom,
            unit_rate=item_data.unit_rate,
            amount=amount,
        )

        quotation.items.append(
            quotation_item
        )

    quotation.total_amount = total

    db.add(quotation)

    # A quotation now exists for this job - move it out of "New"
    # so the dashboard reflects that work is underway. Only jobs
    # still sitting at the initial "New" stage are auto-advanced;
    # a job already further along (In Progress, etc.) isn't pulled
    # backward by this.
    if job is not None and job.status == "New":
        job.status = "Quotation Sent"

    # Two requests computing the same "next" reference number at
    # nearly the same time (a double-click, or a retry after a
    # dropped connection where the first attempt actually went
    # through) can collide on the unique reference_number. Retry
    # with a freshly recomputed number instead of hard-failing.
    max_attempts = 5

    for attempt in range(max_attempts):
        try:
            db.commit()
            break
        except IntegrityError as exc:
            db.rollback()

            if "reference_number" not in str(exc.orig) or attempt == max_attempts - 1:
                raise

            quotation.reference_number = generate_reference_number(db)
            db.add(quotation)

    db.refresh(quotation)

    return quotation


# ---------------------------------------------------------
# GET ALL QUOTATIONS
# ---------------------------------------------------------

@router.get(
    "/",
    response_model=list[QuotationResponse],
)
def get_quotations(
    status: str | None = None,
    job_id: int | None = None,
    db: Session = Depends(get_db),
):
    statement = (
        select(Quotation)
        .options(
            selectinload(Quotation.items),
            selectinload(Quotation.revisions),
        )
    )

    if status:
        statement = statement.where(
            Quotation.status == status
        )

    if job_id is not None:
        statement = statement.where(
            Quotation.job_id == job_id
        )

    statement = statement.order_by(
        Quotation.id.desc()
    )

    return db.scalars(
        statement
    ).all()

# ---------------------------------------------------------
# UPDATE QUOTATION STATUS
# ---------------------------------------------------------

@router.patch(
    "/{quotation_id}/status",
    response_model=QuotationResponse,
)
def update_quotation_status(
    quotation_id: int,
    status_data: QuotationStatusUpdate,
    db: Session = Depends(get_db),
):
    quotation = db.scalar(
        select(Quotation)
        .options(
            selectinload(Quotation.items),
            selectinload(Quotation.revisions),
        )
        .where(
            Quotation.id == quotation_id
        )
    )

    if not quotation:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found",
        )

    quotation.status = status_data.status.value

    db.commit()
    db.refresh(quotation)

    return quotation

# ---------------------------------------------------------
# GET ONE QUOTATION
# ---------------------------------------------------------

@router.get(
    "/{quotation_id}",
    response_model=QuotationResponse,
)
def get_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
):
    quotation = db.scalar(
        select(Quotation)
        .options(
            selectinload(Quotation.items),
            selectinload(Quotation.revisions),
        )
        .where(
            Quotation.id == quotation_id
        )
    )

    if not quotation:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found",
        )

    return quotation


# ---------------------------------------------------------
# GENERATE QUOTATION PDF
# ---------------------------------------------------------

@router.get(
    "/{quotation_id}/pdf",
)
def get_quotation_pdf(
    quotation_id: int,
    db: Session = Depends(get_db),
):
    quotation = db.scalar(
        select(Quotation)
        .options(
            selectinload(Quotation.items),
        )
        .where(
            Quotation.id == quotation_id
        )
    )

    if not quotation:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found",
        )

    pdf_buffer = generate_quotation_pdf(quotation)

    # filename = quotation.reference_number.replace("/", "-") + ".pdf"
    filename = build_quotation_filename(quotation)

    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"'
        },
    )


# ---------------------------------------------------------
# UPDATE QUOTATION
# ---------------------------------------------------------

@router.put(
    "/{quotation_id}",
    response_model=QuotationResponse,
)
def update_quotation(
    quotation_id: int,
    quotation_data: QuotationUpdate,
    db: Session = Depends(get_db),
):
    quotation = db.scalar(
        select(Quotation)
        .options(
            selectinload(Quotation.items),
            selectinload(Quotation.revisions),
        )
        .where(
            Quotation.id == quotation_id
        )
    )

    if not quotation:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found",
        )

    # --------------------------------------------------
    # Validate revision description
    # --------------------------------------------------

    revision_description = (
        quotation_data.revision_description
        .strip()
    )

    if not revision_description:
        raise HTTPException(
            status_code=400,
            detail=(
                "Revision description is required "
                "when editing a quotation."
            ),
        )

    # --------------------------------------------------
    # Determine next revision number
    # --------------------------------------------------

    if quotation.revisions:
        next_revision_number = (
            max(
                revision.revision_number
                for revision in quotation.revisions
            )
            + 1
        )

    else:
        next_revision_number = 1

    # --------------------------------------------------
    # Update quotation header
    # --------------------------------------------------

    quotation.date = (
        quotation_data.quotation_date
    )

    quotation.ntn_number = (
        quotation_data.ntn_number
    )

    quotation.pr_number = (
        quotation_data.pr_number
    )

    quotation.customer_name = (
        quotation_data.customer_name
    )

    quotation.branch_name = (
        quotation_data.branch_name
    )

    quotation.customer_id = (
        quotation_data.customer_id
    )

    quotation.branch_id = (
        quotation_data.branch_id
    )

    quotation.assigned_by = (
        quotation_data.assigned_by
    )

    quotation.subject = (
        quotation_data.subject
    )

    quotation.description = (
        quotation_data.description
    )

    quotation.payment_terms = (
        quotation_data.payment_terms
    )

    quotation.validity = (
        quotation_data.validity
    )

    quotation.job_completion = (
        quotation_data.job_completion
    )

    # --------------------------------------------------
    # Remove old quotation items
    # --------------------------------------------------

    quotation.items.clear()

    # --------------------------------------------------
    # Add updated quotation items
    # --------------------------------------------------

    total = Decimal("0.00")

    for index, item_data in enumerate(
        quotation_data.items,
        start=1,
    ):
        amount = (
            item_data.qty
            * item_data.unit_rate
        )

        total += amount

        quotation_item = QuotationItem(
            sr_no=index,
            item_id=item_data.item_id,
            description=item_data.description,
            qty=item_data.qty,
            uom=item_data.uom,
            unit_rate=item_data.unit_rate,
            amount=amount,
        )

        quotation.items.append(
            quotation_item
        )

    # --------------------------------------------------
    # Update total amount
    # --------------------------------------------------

    quotation.total_amount = total

    # --------------------------------------------------
    # Create revision history record
    # --------------------------------------------------

    revision = QuotationRevision(
        quotation_id=quotation.id,
        revision_number=next_revision_number,
        description=revision_description,
    )

    quotation.revisions.append(
        revision
    )

    # --------------------------------------------------
    # Commit everything together
    # --------------------------------------------------

    db.commit()

    db.refresh(
        quotation,
        attribute_names=[
            "items",
            "revisions",
        ],
    )

    return quotation


# ---------------------------------------------------------
# GET REVISION HISTORY
# ---------------------------------------------------------

@router.get(
    "/{quotation_id}/revisions",
    response_model=list[QuotationRevisionResponse],
)
def get_quotation_revisions(
    quotation_id: int,
    db: Session = Depends(get_db),
):
    quotation = db.scalar(
        select(Quotation)
        .where(
            Quotation.id == quotation_id
        )
    )

    if not quotation:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found",
        )

    statement = (
        select(QuotationRevision)
        .where(
            QuotationRevision.quotation_id
            == quotation_id
        )
        .order_by(
            QuotationRevision.revision_number.asc()
        )
    )

    return db.scalars(
        statement
    ).all()
    
# ---------------------------------------------------------
# DELETE QUOTATION
# ---------------------------------------------------------
 
@router.delete(
    "/{quotation_id}",
)
def delete_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
):
    quotation = db.get(Quotation, quotation_id)
 
    if not quotation:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found",
        )
 
    linked_invoice = db.scalar(
        select(Invoice).where(Invoice.quotation_id == quotation_id)
    )
 
    if linked_invoice:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Can't delete this quotation - invoice "
                f"{linked_invoice.invoice_number} was generated from "
                f"it. Delete that invoice first."
            ),
        )
 
    db.delete(quotation)
    db.commit()
 
    return {"detail": "Quotation deleted"}