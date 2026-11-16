"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import InvoiceStatusBadge from "@/components/invoice/InvoiceStatusBadge";
import InvoiceStatusActions from "@/components/invoice/InvoiceStatusActions";
import DeleteButton from "@/components/shared/DeleteButton";
import { openFile } from "@/lib/downloadFile";

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
  quotation_id: number;
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  branch_name: string;
  assigned_by: string | null;
  pr_number: string | null;
  subject: string | null;
  total_amount: number | string;
  payment_terms: string;
  status: string;
  items: InvoiceItem[];
};

const API_URL = "http://127.0.0.1:8000";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();

  const invoiceId = params.id;

  const [invoice, setInvoice] =
    useState<Invoice | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!invoiceId) return;

    loadInvoice();
  }, [invoiceId]);

  async function loadInvoice() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/invoices/${invoiceId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Invoice not found.");
        }

        throw new Error("Failed to load invoice.");
      }

      const data = await response.json();

      setInvoice(data);
    } catch (error) {
      console.error(
        "Failed to load invoice:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load invoice."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date: string) {
    const parts = date.split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function formatNumber(value: number | string) {
    return Number(value || 0).toLocaleString(
      "en-PK",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  function formatQty(value: number | string) {
    return Number(value).toString();
  }

  function handleDownloadPdf() {
    if (!invoice) return;

    openFile(`${API_URL}/invoices/${invoice.id}/pdf`);
  }

  function handleDownloadReceiving() {
    if (!invoice) return;

    openFile(
      `${API_URL}/invoices/${invoice.id}/receiving-pdf`
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Loading invoice...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !invoice) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8">
            <h1 className="text-lg font-semibold text-red-800">
              Unable to load invoice
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error || "Invoice not found."}
            </p>

            <Link
              href="/invoices"
              className="mt-5 inline-flex rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Back to Invoices
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/invoices"
              className="text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              ← Invoices
            </Link>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
              Invoice #{invoice.invoice_number}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Generated from quotation{" "}
              <Link
                href={`/quotations/${invoice.quotation_id}`}
                className="font-medium text-gray-700 hover:underline"
              >
                #{invoice.quotation_id}
              </Link>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Download PDF
            </button>

            <button
              type="button"
              onClick={handleDownloadReceiving}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Download Receiving
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/invoices/${invoice.id}/edit`
                )
              }
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Edit Invoice
            </button>

            <DeleteButton
              resource="invoices"
              id={invoice.id}
              label={`invoice #${invoice.invoice_number}`}
              redirectTo="/invoices"
            />
          </div>
        </div>

        {/* Status */}
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Current Status
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {invoice.status}
              </p>
            </div>

            <InvoiceStatusBadge status={invoice.status} />
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <InvoiceStatusActions
              invoiceId={invoice.id}
              currentStatus={invoice.status}
              onStatusChanged={(newStatus: string) =>
                setInvoice((previous) =>
                  previous
                    ? { ...previous, status: newStatus }
                    : previous
                )
              }
            />
          </div>
        </div>

        {/* Invoice Information */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Invoice Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Basic information associated with this invoice.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">

            <Info
              label="Invoice Number"
              value={invoice.invoice_number}
            />

            <Info
              label="Invoice Date"
              value={formatDate(invoice.invoice_date)}
            />

            <Info
              label="PR Number"
              value={invoice.pr_number || "—"}
            />

            <Info
              label="Customer"
              value={invoice.customer_name}
            />

            <Info
              label="Branch"
              value={invoice.branch_name}
            />

            <Info
              label="Assigned By"
              value={invoice.assigned_by || "—"}
            />

          </div>

          {invoice.subject && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Subject
              </p>

              <p className="mt-1 text-sm font-medium text-gray-900">
                {invoice.subject}
              </p>
            </div>
          )}

        </section>

        {/* Items */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-6 py-5 md:px-8">
            <h2 className="text-lg font-semibold text-gray-900">
              Invoice Items
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {invoice.items.length} item
              {invoice.items.length === 1
                ? ""
                : "s"} in this invoice.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">

              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">

                  <th className="w-16 px-4 py-3 text-left font-semibold text-gray-600">
                    Sr.
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Description
                  </th>

                  <th className="w-24 px-4 py-3 text-right font-semibold text-gray-600">
                    Qty
                  </th>

                  <th className="w-24 px-4 py-3 text-left font-semibold text-gray-600">
                    UOM
                  </th>

                  <th className="w-36 px-4 py-3 text-right font-semibold text-gray-600">
                    Unit Rate
                  </th>

                  <th className="w-40 px-4 py-3 text-right font-semibold text-gray-600">
                    Amount
                  </th>

                </tr>
              </thead>

              <tbody>
                {invoice.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 last:border-b-0"
                  >

                    <td className="px-4 py-4 text-gray-500">
                      {item.sr_no}
                    </td>

                    <td className="px-4 py-4 font-medium text-gray-800">
                      {item.description}
                    </td>

                    <td className="px-4 py-4 text-right text-gray-700">
                      {formatQty(item.qty)}
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {item.uom}
                    </td>

                    <td className="px-4 py-4 text-right text-gray-700">
                      Rs. {formatNumber(item.unit_rate)}
                    </td>

                    <td className="px-4 py-4 text-right font-medium text-gray-900">
                      Rs. {formatNumber(item.amount)}
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 px-6 py-5 md:px-8">
            <div className="flex justify-end">
              <div className="w-full max-w-sm">

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Grand Total
                  </span>

                  <span className="text-xl font-semibold text-gray-900">
                    Rs. {formatNumber(invoice.total_amount)}
                  </span>
                </div>

              </div>
            </div>
          </div>

        </section>

        {/* Commercial Terms */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

          <h2 className="text-lg font-semibold text-gray-900">
            Commercial Terms
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">

            <Info
              label="Payment Terms"
              value={invoice.payment_terms}
            />

          </div>

        </section>

      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-gray-900">
        {value}
      </p>
    </div>
  );
}