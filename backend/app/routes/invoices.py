from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models.invoice import Invoice

from app.database import get_db
from app.models.invoice import Invoice, InvoiceItem
from app.models.quotation import Quotation
from app.services.pdf_service import generate_invoice_pdf, generate_receiving_pdf, build_invoice_filename

from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceResponse,
    InvoiceStatusUpdate,
    InvoiceUpdate,
)


router = APIRouter(
    prefix="/invoices",
    tags=["Invoices"],
)


# ---------------------------------------------------------
# GENERATE INVOICE NUMBER
# ---------------------------------------------------------

def invoice_number_from_reference(reference_number: str) -> str:
    """
    The invoice number must always match the quotation's reference
    number so a job stays traceable end-to-end - quotation
    "IES/QT/1046" produces invoice "1046", not some unrelated
    auto-incremented number. Reference numbers can carry a suffix
    (e.g. "IES/QT/1031(B)" for a revised quotation, or
    "IES/QT/1009-UNCONFIRMED"), and that suffix is preserved as-is
    since it's part of what makes the number unique and traceable.
    """

    return reference_number.rsplit("/", 1)[-1].strip()


# ---------------------------------------------------------
# CREATE INVOICE (from an Approved quotation)
# ---------------------------------------------------------

@router.post(
    "/",
    response_model=InvoiceResponse,
)
def create_invoice(
    invoice_data: InvoiceCreate,
    db: Session = Depends(get_db),
):
    quotation = db.scalar(
        select(Quotation)
        .options(selectinload(Quotation.items))
        .where(Quotation.id == invoice_data.quotation_id)
    )

    if not quotation:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found",
        )

    if quotation.status != "Approved":
        raise HTTPException(
            status_code=400,
            detail=(
                "Only an Approved quotation can be invoiced. "
                f"This quotation is currently '{quotation.status}'."
            ),
        )

    existing_invoice = db.scalar(
        select(Invoice).where(Invoice.quotation_id == quotation.id)
    )

    if existing_invoice:
        raise HTTPException(
            status_code=400,
            detail="This quotation has already been invoiced.",
        )

    invoice_number = invoice_number_from_reference(
        quotation.reference_number
    )

    conflicting_invoice = db.scalar(
        select(Invoice).where(Invoice.invoice_number == invoice_number)
    )

    if conflicting_invoice:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invoice number '{invoice_number}' (derived from this "
                "quotation's reference number) is already used by "
                f"invoice #{conflicting_invoice.id}. Check for a "
                "duplicate reference number before invoicing."
            ),
        )

    # Everything below is copied verbatim from the quotation - the
    # invoice is a locked snapshot, only the invoice date is entered
    # fresh. This matches the real IES workflow: nothing about the
    # customer, items, or pricing changes between quotation and
    # invoice.
    invoice = Invoice(
        quotation_id=quotation.id,
        invoice_number=invoice_number,
        invoice_date=invoice_data.invoice_date,
        customer_name=quotation.customer_name,
        branch_name=quotation.branch_name,
        customer_id=quotation.customer_id,
        branch_id=quotation.branch_id,
        assigned_by=quotation.assigned_by,
        pr_number=quotation.pr_number,
        subject=quotation.subject,
        total_amount=quotation.total_amount,
        payment_terms=quotation.payment_terms,
        status="Draft",
    )

    for item in quotation.items:
        invoice.items.append(
            InvoiceItem(
                sr_no=item.sr_no,
                description=item.description,
                qty=item.qty,
                uom=item.uom,
                unit_rate=item.unit_rate,
                amount=item.amount,
            )
        )

    db.add(invoice)

    # The quotation is now spent - move it to its terminal status so
    # it can't be invoiced again (also enforced above by the
    # one-invoice-per-quotation check).
    quotation.status = "Invoiced"

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=(
                f"Invoice number '{invoice_number}' conflicts with an "
                "existing invoice. This usually means two quotations "
                "share the same reference number."
            ),
        )


    db.refresh(invoice)

    return invoice


# ---------------------------------------------------------
# LIST INVOICES
# ---------------------------------------------------------

@router.get(
    "/",
    response_model=list[InvoiceResponse],
)
def list_invoices(
    status: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    query = select(Invoice).options(selectinload(Invoice.items))

    if status and status != "All":
        query = query.where(Invoice.status == status)

    if search:
        like = f"%{search}%"
        query = query.where(
            (Invoice.invoice_number.ilike(like))
            | (Invoice.customer_name.ilike(like))
            | (Invoice.branch_name.ilike(like))
            | (Invoice.pr_number.ilike(like))
        )

    query = query.order_by(Invoice.id.desc())

    return db.scalars(query).all()


# ---------------------------------------------------------
# GET SINGLE INVOICE
# ---------------------------------------------------------

@router.get(
    "/{invoice_id}",
    response_model=InvoiceResponse,
)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
):
    invoice = db.scalar(
        select(Invoice)
        .options(selectinload(Invoice.items))
        .where(Invoice.id == invoice_id)
    )

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    return invoice


# ---------------------------------------------------------
# GET INVOICE BY QUOTATION ID
#
# Lets the quotation detail page check whether an invoice already
# exists for a given quotation, so it can show "View Invoice"
# instead of "Generate Invoice".
# ---------------------------------------------------------

@router.get(
    "/by-quotation/{quotation_id}",
    response_model=InvoiceResponse,
)
def get_invoice_by_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
):
    invoice = db.scalar(
        select(Invoice)
        .options(selectinload(Invoice.items))
        .where(Invoice.quotation_id == quotation_id)
    )

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="No invoice exists for this quotation yet",
        )

    return invoice


# ---------------------------------------------------------
# UPDATE INVOICE STATUS
# ---------------------------------------------------------

@router.patch(
    "/{invoice_id}/status",
    response_model=InvoiceResponse,
)
def update_invoice_status(
    invoice_id: int,
    status_data: InvoiceStatusUpdate,
    db: Session = Depends(get_db),
):
    invoice = db.scalar(
        select(Invoice)
        .options(selectinload(Invoice.items))
        .where(Invoice.id == invoice_id)
    )

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    invoice.status = status_data.status.value

    db.commit()
    db.refresh(invoice)

    return invoice


# ---------------------------------------------------------
# GENERATE INVOICE PDF
# ---------------------------------------------------------

@router.get(
    "/{invoice_id}/pdf",
)
def get_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
):
    invoice = db.scalar(
        select(Invoice)
        .options(selectinload(Invoice.items))
        .where(Invoice.id == invoice_id)
    )

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    pdf_buffer = generate_invoice_pdf(invoice)

    filename = build_invoice_filename(invoice)

    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"'
        },
    )


# ---------------------------------------------------------
# GENERATE RECEIVING PDF
#
# A separate, much simpler document: proof that a branch received
# the work on a given PR, with no pricing on it. Built from the same
# invoice, but only branch/PR/date/items are used.
# ---------------------------------------------------------

@router.get(
    "/{invoice_id}/receiving-pdf",
)
def get_receiving_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
):
    invoice = db.scalar(
        select(Invoice)
        .options(selectinload(Invoice.items))
        .where(Invoice.id == invoice_id)
    )

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    pdf_buffer = generate_receiving_pdf(invoice)

    filename = f"Receiving-{invoice.invoice_number}.pdf"

    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"'
        },
    )
    
    
    # ---------------------------------------------------------
    # UPDATE INVOICE
    # ---------------------------------------------------------

@router.put(
    "/{invoice_id}",
    response_model=InvoiceResponse,
)
def update_invoice(
    invoice_id: int,
    invoice_data: InvoiceUpdate,
    db: Session = Depends(get_db),
):
    invoice = db.scalar(
        select(Invoice)
        .options(selectinload(Invoice.items))
        .where(Invoice.id == invoice_id)
    )

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    invoice.invoice_date = invoice_data.invoice_date
    invoice.customer_name = invoice_data.customer_name
    invoice.branch_name = invoice_data.branch_name
    invoice.assigned_by = invoice_data.assigned_by
    invoice.pr_number = invoice_data.pr_number
    invoice.subject = invoice_data.subject
    invoice.payment_terms = invoice_data.payment_terms

    # Replace items wholesale, same approach as quotation edits.
    invoice.items.clear()

    total = Decimal("0.00")

    for index, item_data in enumerate(invoice_data.items, start=1):
        amount = item_data.qty * item_data.unit_rate
        total += amount

        invoice.items.append(
            InvoiceItem(
                sr_no=index,
                description=item_data.description,
                qty=item_data.qty,
                uom=item_data.uom,
                unit_rate=item_data.unit_rate,
                amount=amount,
            )
        )

    invoice.total_amount = total

    db.commit()
    db.refresh(invoice, attribute_names=["items"])

    return invoice


    # ---------------------------------------------------------
# DELETE INVOICE
# ---------------------------------------------------------
 
@router.delete(
    "/{invoice_id}",
)
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
):
    invoice = db.get(Invoice, invoice_id)
 
    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )
 
    # Put the quotation back to "Approved" so it's clear a new
    # invoice can be generated from it again - otherwise it would
    # be stuck showing "Invoiced" with no actual invoice behind it.
    quotation = db.get(Quotation, invoice.quotation_id)
 
    if quotation and quotation.status == "Invoiced":
        quotation.status = "Approved"
 
    db.delete(invoice)
    db.commit()
 
    return {"detail": "Invoice deleted"}