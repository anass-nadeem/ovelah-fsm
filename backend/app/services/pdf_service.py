"""
Quotation & Invoice PDF generation service.

This renders the quotation as HTML/CSS (via Jinja2) and converts it
to PDF using WeasyPrint - a browser-grade layout engine, the same
family of engine used by Word/Chrome's own PDF export. This was
switched from the earlier reportlab-based approach specifically to
fix a text-selection bug: reportlab draws PDFs by placing raw glyphs
at exact coordinates with no real document structure, which caused
some PDF viewers (Edge/Chrome's built-in viewer in particular) to
mis-group table rows during click-drag text selection. WeasyPrint's
HTML/CSS-based rendering produces much more conventional per-row/
per-cell text runs, which selects cleanly - closer to a PDF exported
from Word.

Two ways WeasyPrint can run, tried in order:

1. As a Python library (`import weasyprint`) - works if WeasyPrint
   and its native dependencies (Pango/Cairo) are installed in this
   Python environment. Easy on Linux/Mac; on Windows this needs a
   GTK runtime installed separately.

2. As the official standalone Windows executable (no GTK/Python
   dependency install needed at all) - just download the .exe from
   WeasyPrint's GitHub releases and drop it in `backend/bin/`
   (see WEASYPRINT_EXE_CANDIDATES below), or point the
   WEASYPRINT_EXE_PATH environment variable at it directly. This is
   the recommended path for a plain Windows machine.

If neither is available, PDF generation raises a clear error instead
of failing silently.
"""

import os
import re
import shutil
import subprocess
import tempfile
from datetime import date
from decimal import Decimal
from io import BytesIO
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.models.quotation import Quotation
from app.models.invoice import Invoice

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
APP_DIR = BACKEND_DIR / "app"
ASSETS_DIR = APP_DIR / "assets"
TEMPLATES_DIR = APP_DIR / "templates"

HEADER_LOGO_PATH = ASSETS_DIR / "header_logo.png"
FOOTER_BAR_PATH = ASSETS_DIR / "footer_bar.png"
SIGNATURE_PATH = ASSETS_DIR / "signature.png"
STAMP_PATH = ASSETS_DIR / "stamp.png"

# Where to look for the standalone WeasyPrint executable, in order.
# Drop the downloaded .exe at backend/bin/weasyprint.exe and it will
# be picked up automatically - no other configuration needed.
WEASYPRINT_EXE_CANDIDATES = [
    BACKEND_DIR / "bin" / "weasyprint.exe",
    BACKEND_DIR / "bin" / "weasyprint",
]

# ---------------------------------------------------------
# Brand constants (from the real letterhead).
# Move these into Company Settings once that module is wired up.
# ---------------------------------------------------------

NTN_NUMBER = "I299711-2"
SERVICE_MANAGER_NAME = "Abdullah Nadeem"

_jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html"]),
)


def _fmt_amount(value) -> str:
    value = Decimal(value or 0)
    return f"{value:,.2f}"


def _fmt_qty(value) -> str:
    value = Decimal(value or 0)
    if value == value.to_integral_value():
        return str(int(value))
    return str(value.normalize())


def _fmt_date(value) -> str:
    try:
        return value.strftime("%d/%m/%Y")
    except AttributeError:
        return str(value)


def _fmt_date_for_filename(value) -> str:
    # Same date, but dash-separated instead of slash-separated -
    # slashes aren't safe inside a filename.
    try:
        return value.strftime("%d-%m-%Y")
    except AttributeError:
        return str(value)


_FILENAME_UNSAFE_CHARS = re.compile(r'[\\/:*?"<>|]')


def _sanitize_filename_part(value, fallback: str = "NA") -> str:
    """
    One segment of a " - "-joined download filename. Strips
    characters that aren't safe in a filename (a quotation reference
    number like "IES/QT/1002" has slashes in it, for example),
    collapses stray whitespace, and falls back to a placeholder
    instead of leaving a blank segment when the field is empty.
    """

    text = str(value or "").strip()
    text = _FILENAME_UNSAFE_CHARS.sub("-", text)
    text = re.sub(r"\s+", " ", text).strip()

    return text or fallback


def build_quotation_filename(quotation: Quotation) -> str:
    parts = [
        _sanitize_filename_part(quotation.pr_number, "No-PR"),
        _sanitize_filename_part(quotation.reference_number, "No-Ref"),
        _sanitize_filename_part(quotation.branch_name, "No-Location"),
        _sanitize_filename_part(quotation.subject, "No-Subject"),
        _fmt_date_for_filename(quotation.date),
    ]

    return " - ".join(parts) + ".pdf"


def build_invoice_filename(invoice: Invoice) -> str:
    parts = [
        _sanitize_filename_part(invoice.pr_number, "No-PR"),
        _sanitize_filename_part(invoice.invoice_number, "No-Invoice"),
        _sanitize_filename_part(invoice.branch_name, "No-Location"),
        _sanitize_filename_part(invoice.subject, "No-Subject"),
    ]

    return " - ".join(parts) + ".pdf"


def _file_uri(path: Path) -> str:
    """Absolute file:// URI, works cross-platform (incl. Windows drive letters)."""
    return path.resolve().as_uri()


def _render_quotation_html(quotation: Quotation) -> str:
    template = _jinja_env.get_template("quotation.html")

    items = [
        {
            "sr_no": item.sr_no,
            "description": item.description,
            "qty_display": _fmt_qty(item.qty),
            "uom": item.uom,
            "unit_rate_display": _fmt_amount(item.unit_rate),
            "amount_display": _fmt_amount(item.amount),
        }
        for item in quotation.items
    ]

        # Defaults to shown (True) when there's no linked customer to
    # check yet - matches the behavior every quotation already had
    # before this setting existed, so nothing changes for records
    # that predate the customer link.
    show_pr_number = (
        quotation.customer.requires_pr_number
        if quotation.customer is not None
        else True
    )

    return template.render(
        document_title="Quotation",
        document_number_label="Reference Number",
        document_number=quotation.reference_number,
        document_date=_fmt_date(quotation.date),
        ntn_number=NTN_NUMBER,
        customer_name=quotation.customer_name,
        branch_name=quotation.branch_name,
        assigned_by=quotation.assigned_by,
        pr_number=quotation.pr_number,
        show_pr_number=show_pr_number,
        subject=quotation.subject,
        items=items,
        total_amount_display=_fmt_amount(quotation.total_amount),
        payment_terms=quotation.payment_terms,
        validity=quotation.validity,
        job_completion=quotation.job_completion,
        service_manager_name=SERVICE_MANAGER_NAME,
        header_logo_uri=_file_uri(HEADER_LOGO_PATH),
        footer_bar_uri=_file_uri(FOOTER_BAR_PATH),
        signature_uri=_file_uri(SIGNATURE_PATH),
        stamp_uri=_file_uri(STAMP_PATH),
    )


def _render_invoice_html(invoice: Invoice) -> str:
    template = _jinja_env.get_template("invoice.html")

    items = [
        {
            "sr_no": item.sr_no,
            "description": item.description,
            "qty_display": _fmt_qty(item.qty),
            "uom": item.uom,
            "unit_rate_display": _fmt_amount(item.unit_rate),
            "amount_display": _fmt_amount(item.amount),
        }
        for item in invoice.items
    ]

    show_pr_number = (
        invoice.customer.requires_pr_number
        if invoice.customer is not None
        else True
    )

    return template.render(
        document_title="Invoice",
        document_number_label="Invoice Number",
        document_number=invoice.invoice_number,
        document_date=_fmt_date(invoice.invoice_date),
        ntn_number=NTN_NUMBER,
        customer_name=invoice.customer_name,
        branch_name=invoice.branch_name,
        assigned_by=invoice.assigned_by,
        pr_number=invoice.pr_number,
        show_pr_number=show_pr_number,
        subject=invoice.subject,
        items=items,
        total_amount_display=_fmt_amount(invoice.total_amount),
        payment_terms=invoice.payment_terms,
        validity=None,
        job_completion=None,
        service_manager_name=SERVICE_MANAGER_NAME,
        header_logo_uri=_file_uri(HEADER_LOGO_PATH),
        footer_bar_uri=_file_uri(FOOTER_BAR_PATH),
        signature_uri=_file_uri(SIGNATURE_PATH),
        stamp_uri=_file_uri(STAMP_PATH),
    )


def _render_receiving_html(invoice: Invoice) -> str:
    """
    The "Receiving" slip is a much simpler document than the
    quotation/invoice: just proof that a given branch received the
    work described on a PR, with no pricing on it at all. It reuses
    the invoice's branch, PR number, date, and item descriptions/
    quantities - deliberately nothing else (no customer name, no
    NTN, no rates).
    """

    template = _jinja_env.get_template("receiving.html")

    items = [
        {
            "sr_no": item.sr_no,
            "description": item.description,
            "qty_display": _fmt_qty(item.qty),
        }
        for item in invoice.items
    ]

    return template.render(
        document_date=_fmt_date(date.today()),
        branch_name=invoice.branch_name,
        pr_number=invoice.pr_number,
        items=items,
        header_logo_uri=_file_uri(HEADER_LOGO_PATH),
        footer_bar_uri=_file_uri(FOOTER_BAR_PATH),
    )


def _find_weasyprint_executable() -> str | None:
    for candidate in WEASYPRINT_EXE_CANDIDATES:
        if candidate.exists():
            return str(candidate)

    env_path = os.environ.get("WEASYPRINT_EXE_PATH")
    if env_path and Path(env_path).exists():
        return env_path

    # Last resort: is "weasyprint" on PATH at all (e.g. installed via
    # pip's console-script entry point)?
    found = shutil.which("weasyprint")
    if found:
        return found

    return None


def _render_via_executable(html: str) -> bytes:
    exe = _find_weasyprint_executable()
    if not exe:
        raise RuntimeError(
            "WeasyPrint is not available: no Python library import "
            "worked, and no standalone executable was found. Download "
            "it from https://github.com/Kozea/WeasyPrint/releases and "
            "place it at backend/bin/weasyprint.exe (or set the "
            "WEASYPRINT_EXE_PATH environment variable to its path)."
        )

    with tempfile.TemporaryDirectory() as tmp_dir:
        html_path = Path(tmp_dir) / "document.html"
        pdf_path = Path(tmp_dir) / "document.pdf"
        html_path.write_text(html, encoding="utf-8")

        result = subprocess.run(
            [exe, "--pdf-tags", str(html_path), str(pdf_path)],
            capture_output=True,
            timeout=60,
        )

        if result.returncode != 0 or not pdf_path.exists():
            raise RuntimeError(
                "WeasyPrint executable failed to generate the PDF: "
                + result.stderr.decode("utf-8", errors="replace")
            )

        return pdf_path.read_bytes()


def _render_pdf_bytes(html: str) -> bytes:
    try:
        import weasyprint

        # pdf_tags=True embeds a real structure tree (/StructTreeRoot
        # with actual /Table, /TR, /TD tags) instead of leaving PDF
        # viewers to guess table structure from raw glyph coordinates.
        # This is the same mechanism a Word-exported PDF uses, and is
        # what actually fixes cross-row text-selection bugs in Edge/
        # Chrome - the earlier switch from reportlab to WeasyPrint
        # alone wasn't enough without this flag.
        return weasyprint.HTML(string=html).write_pdf(pdf_tags=True)
    except (ImportError, OSError):
        # ImportError: the weasyprint package itself isn't installed.
        # OSError: weasyprint is installed but its native Pango/Cairo/
        # GObject libraries aren't found on this machine (the common
        # case on a plain Windows install without GTK) - this is the
        # actual exception WeasyPrint raises in that situation, e.g.
        # "OSError: cannot load library 'gobject-2.0-0'".
        # Either way, fall back to the standalone executable, which
        # bundles everything it needs and requires no GTK install.
        return _render_via_executable(html)


def generate_quotation_pdf(quotation: Quotation) -> BytesIO:
    html = _render_quotation_html(quotation)
    pdf_bytes = _render_pdf_bytes(html)
    return BytesIO(pdf_bytes)


def generate_invoice_pdf(invoice: Invoice) -> BytesIO:
    html = _render_invoice_html(invoice)
    pdf_bytes = _render_pdf_bytes(html)
    return BytesIO(pdf_bytes)


def generate_receiving_pdf(invoice: Invoice) -> BytesIO:
    html = _render_receiving_html(invoice)
    pdf_bytes = _render_pdf_bytes(html)
    return BytesIO(pdf_bytes)