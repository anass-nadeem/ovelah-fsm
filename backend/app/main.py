
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.auth import require_auth

from app.routes.auth import router as auth_router
from app.routes.items import router as items_router
from app.routes.customers import router as customers_router
from app.routes.branches import router as branches_router
from app.routes.jobs import router as jobs_router
from app.routes.quotations import router as quotations_router
from app.routes.invoices import router as invoices_router
from app.routes.settings import router as settings_router
from app.routes.expenses import router as expenses_router
from app.routes.assets import router as assets_router
from app.routes.credits import router as credits_router
from app.routes.balances import router as balances_router


# Import models so SQLAlchemy knows about all tables
from app.models import (
    Customer,
    Branch,
    Item,
    Job,
    Quotation,
    QuotationItem,
    QuotationRevision,
    Invoice,
    InvoiceItem,
    Document,
    Payment,
    CompanySettings,
)
from app.models.expense import Expense
from app.models.asset import Asset
from app.models.credit import Credit


app = FastAPI(
    title="Infinity Engineering Solutions ERP",
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Without this, the browser hides Content-Disposition from
    # JS on cross-origin responses (frontend:3000 -> backend:8000
    # counts as cross-origin) - the download helper needs to read
    # it to use the server-generated filename instead of a generic
    # fallback.
    expose_headers=["Content-Disposition"],
)


# ---------------------------------------------------------
# Routers
#
# Every router below requires a valid login (see app/auth.py) -
# applied centrally here via `dependencies=[Depends(require_auth)]`
# rather than touching every individual route function. The auth
# router itself is deliberately NOT protected - that's the login
# endpoint, you need to be able to call it before you have a token.
# ---------------------------------------------------------

app.include_router(auth_router)

protected = [Depends(require_auth)]

app.include_router(items_router, dependencies=protected)
app.include_router(customers_router, dependencies=protected)
app.include_router(branches_router, dependencies=protected)
app.include_router(jobs_router, dependencies=protected)
app.include_router(quotations_router, dependencies=protected)
app.include_router(invoices_router, dependencies=protected)
app.include_router(settings_router, dependencies=protected)
app.include_router(expenses_router, dependencies=protected)
app.include_router(assets_router, dependencies=protected)
app.include_router(credits_router, dependencies=protected)
app.include_router(balances_router, dependencies=protected)


# ---------------------------------------------------------
# Basic routes
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "Infinity Engineering Solutions ERP API",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }