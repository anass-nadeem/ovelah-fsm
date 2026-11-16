"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import QuotationItemsTable, {
  QuotationRow,
} from "@/components/quotation/QuotationItemsTable";
import QuotationSummary from "@/components/quotation/QuotationSummary";

const API_URL = "http://127.0.0.1:8000";

type InvoiceItem = {
  id: number;
  sr_no: number;
  description: string;
  qty: number | string;
  uom: string;
  unit_rate: number | string;
  amount: number | string;
};

type Invoice = {
  id: number;
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  branch_name: string;
  assigned_by: string | null;
  pr_number: string | null;
  subject: string | null;
  payment_terms: string;
  items: InvoiceItem[];
};

type Props = {
  invoiceId: number;
};

export default function EditInvoiceForm({
  invoiceId,
}: Props) {
  const router = useRouter();

  const [invoice, setInvoice] =
    useState<Invoice | null>(null);

  const [invoiceDate, setInvoiceDate] =
    useState("");

  const [customerName, setCustomerName] =
    useState("");

  const [branchName, setBranchName] =
    useState("");

  const [assignedBy, setAssignedBy] =
    useState("");

  const [prNumber, setPrNumber] =
    useState("");

  const [subject, setSubject] =
    useState("");

  const [paymentTerms, setPaymentTerms] =
    useState("As per KFC Policy.");

  const [rows, setRows] =
    useState<QuotationRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const total = useMemo(() => {
    return rows.reduce(
      (sum, row) =>
        sum + row.qty * row.unit_rate,
      0
    );
  }, [rows]);

  useEffect(() => {
    loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  async function loadInvoice() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/invoices/${invoiceId}`
      );

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "Invoice not found."
            : "Failed to load invoice."
        );
      }

      const data: Invoice =
        await response.json();

      setInvoice(data);

      setInvoiceDate(data.invoice_date);
      setCustomerName(data.customer_name);
      setBranchName(data.branch_name);
      setAssignedBy(data.assigned_by || "");
      setPrNumber(data.pr_number || "");
      setSubject(data.subject || "");

      setPaymentTerms(
        data.payment_terms ||
          "As per KFC Policy."
      );

      setRows(
        data.items.map((item) => ({
          id: crypto.randomUUID(),
          item_id: null,
          description: item.description,
          qty: Number(item.qty),
          uom: item.uom,
          unit_rate: Number(item.unit_rate),
        }))
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load invoice."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    setError("");

    if (!customerName) {
      setError("Please enter a customer name.");
      return;
    }

    if (!branchName) {
      setError("Please enter a branch.");
      return;
    }

    if (rows.length === 0) {
      setError(
        "Please add at least one invoice item."
      );
      return;
    }

    const invalidRow = rows.find(
      (row) =>
        !row.description.trim() ||
        row.qty <= 0 ||
        row.unit_rate < 0
    );

    if (invalidRow) {
      setError(
        "Please complete all invoice rows correctly."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/invoices/${invoiceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invoice_date: invoiceDate,

            customer_name: customerName,
            branch_name: branchName,

            assigned_by:
              assignedBy || null,

            pr_number:
              prNumber || null,

            subject:
              subject || null,

            payment_terms:
              paymentTerms,

            items: rows.map((row) => ({
              description:
                row.description,
              qty: row.qty,
              uom: row.uom,
              unit_rate:
                row.unit_rate,
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorData =
          await response.json();

        throw new Error(
          errorData.detail ||
            "Failed to update invoice."
        );
      }

      router.push(
        `/invoices/${invoiceId}`
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update invoice."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Loading invoice...
          </p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8">
          <h1 className="text-lg font-semibold text-red-800">
            Unable to load invoice
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {error || "Invoice not found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      {/* Page Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/invoices/${invoiceId}`
              )
            }
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            ← Back to Invoice
          </button>

          <p className="mt-4 text-sm font-medium text-gray-500">
            Editing Invoice
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            Invoice #{invoice.invoice_number}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Correct invoice details and item amounts.
          </p>
        </div>
      </div>

      {/* Form */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

          <Field label="Invoice Date">
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) =>
                setInvoiceDate(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
            />
          </Field>

          <Field label="PR Number">
            <input
              type="text"
              value={prNumber}
              onChange={(e) =>
                setPrNumber(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
            />
          </Field>

          <Field label="Assigned By">
            <input
              type="text"
              value={assignedBy}
              onChange={(e) =>
                setAssignedBy(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
            />
          </Field>

          <Field label="Customer">
            <input
              type="text"
              value={customerName}
              onChange={(e) =>
                setCustomerName(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
            />
          </Field>

          <Field label="Branch">
            <input
              type="text"
              value={branchName}
              onChange={(e) =>
                setBranchName(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
            />
          </Field>

          <Field label="Payment Terms">
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) =>
                setPaymentTerms(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
            />
          </Field>

        </div>

        <div className="mt-5">
          <Field label="Subject">
            <input
              type="text"
              value={subject}
              onChange={(e) =>
                setSubject(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
            />
          </Field>
        </div>

        <div className="my-8 border-t border-gray-200" />

        <QuotationItemsTable
          rows={rows}
          onChange={setRows}
          title="Invoice Items"
          subtitle="Search an existing item or enter a manual item."
        />

        <div className="my-8 border-t border-gray-200" />

        <QuotationSummary total={total} />

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/invoices/${invoiceId}`
              )
            }
            disabled={saving}
            className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={saveChanges}
            disabled={saving}
            className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </label>

      {children}
    </div>
  );
}