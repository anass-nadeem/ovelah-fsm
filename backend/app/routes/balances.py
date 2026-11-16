from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.invoice import Invoice
from app.models.credit import Credit
from app.models.customer import Customer
from app.schemas.balance import CustomerBalanceResponse


router = APIRouter(
    prefix="/balances",
    tags=["Balances"],
)


@router.get(
    "/customers",
    response_model=list[CustomerBalanceResponse],
)
def get_customer_balances(
    db: Session = Depends(get_db),
):
    """
    Auto-computed debt per customer: unpaid invoices plus open
    Credit records. Grouped by the real Customer record
    (invoice.customer_id) when known, falling back to the stored
    customer_name text only for older records that haven't been
    linked yet (see import/add_client_links.py). Credit records
    resolve party_name against the Customer table by exact name.
    """

    balances: dict[tuple[str, object], dict] = {}

    customers_by_name = {
        customer.name: customer
        for customer in db.scalars(select(Customer)).all()
    }

    def ensure(key: tuple[str, object], display_name: str) -> dict:
        if key not in balances:
            balances[key] = {
                "name": display_name,
                "unpaid_invoice_total": Decimal("0"),
                "manual_receivable": Decimal("0"),
                "manual_payable": Decimal("0"),
            }
        return balances[key]

    unpaid_invoices = db.scalars(
        select(Invoice).where(Invoice.status != "Paid")
    ).all()

    for invoice in unpaid_invoices:
        if invoice.customer_id is not None:
            key = ("id", invoice.customer_id)
        else:
            key = ("name", invoice.customer_name)

        row = ensure(key, invoice.customer_name)
        row["unpaid_invoice_total"] += invoice.total_amount

    open_credits = db.scalars(
        select(Credit).where(Credit.status == "Open")
    ).all()

    for credit in open_credits:
        matched_customer = customers_by_name.get(credit.party_name)

        if matched_customer is not None:
            key = ("id", matched_customer.id)
        else:
            key = ("name", credit.party_name)

        row = ensure(key, credit.party_name)

        if credit.direction == "Receivable":
            row["manual_receivable"] += credit.amount
        else:
            row["manual_payable"] += credit.amount

    results = []

    for row in balances.values():
        net = (
            row["unpaid_invoice_total"]
            + row["manual_receivable"]
            - row["manual_payable"]
        )

        results.append(
            CustomerBalanceResponse(
                name=row["name"],
                unpaid_invoice_total=row["unpaid_invoice_total"],
                manual_receivable=row["manual_receivable"],
                manual_payable=row["manual_payable"],
                net_balance=net,
            )
        )

    results.sort(key=lambda r: r.net_balance, reverse=True)

    return results