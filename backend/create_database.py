from app.database import Base, engine

from app.models import (
    Customer,
    Branch,
    Item,
    Job,
    Quotation,
    QuotationItem,
    Invoice,
    InvoiceItem,
    Document,
    Payment,
)


def create_database():
    Base.metadata.create_all(bind=engine)
    print("Database created successfully.")


if __name__ == "__main__":
    create_database()