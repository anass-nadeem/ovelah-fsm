from app.database import Base, engine

# Import all models so SQLAlchemy knows about every table
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

print("Creating missing database tables...")

Base.metadata.create_all(bind=engine)

print("Database tables are ready.")