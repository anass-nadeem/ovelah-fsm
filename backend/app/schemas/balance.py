from decimal import Decimal

from pydantic import BaseModel


class CustomerBalanceResponse(BaseModel):
    """
    One row per customer/party, combining:
    - auto-computed receivables from unpaid invoices
    - manually-entered Credit records (either direction) for the
      same name

    net_balance > 0 means the customer owes the company.
    net_balance < 0 means the company owes the customer.
    """

    name: str
    unpaid_invoice_total: Decimal
    manual_receivable: Decimal
    manual_payable: Decimal
    net_balance: Decimal