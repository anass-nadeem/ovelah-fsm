"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import QuotationStatusBadge from "@/components/quotation/QuotationStatusBadge";
import QuotationStatusActions from "@/components/quotation/QuotationStatusActions";
import DeleteButton from "@/components/shared/DeleteButton";
import { openFile } from "@/lib/downloadFile";

type QuotationItem = {
  id: number;
  sr_no: number;
  item_id: number | null;
  description: string;
  qty: number | string;
  uom: string;
  unit_rate: number | string;
  amount: number | string;
};

type QuotationRevision = {
  id: number;
  quotation_id: number;
  revision_number: number;
  description: string;
  created_at: string;
};

type Quotation = {
  id: number;
  job_id: number | null;
  reference_number: string;
  date: string;
  ntn_number: string | null;
  pr_number: string | null;
  customer_name: string;
  branch_name: string;
  assigned_by: string | null;
  subject: string | null;
  description: string | null;
  total_amount: number | string;
  payment_terms: string;
  validity: string;
  job_completion: string;
  status: string;
  items: QuotationItem[];
};

const API_URL = "http://127.0.0.1:8000";

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();

  const quotationId = params.id;

  const [quotation, setQuotation] =
    useState<Quotation | null>(null);

  const [revisions, setRevisions] =
    useState<QuotationRevision[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!quotationId) return;

    loadQuotation();
  }, [quotationId]);

  async function loadQuotation() {
    try {
      setLoading(true);
      setError("");

      const quotationResponse = await fetch(
        `${API_URL}/quotations/${quotationId}`
      );

      if (!quotationResponse.ok) {
        if (quotationResponse.status === 404) {
          throw new Error("Quotation not found.");
        }

        throw new Error(
          "Failed to load quotation."
        );
      }

      const quotationData =
        await quotationResponse.json();

      setQuotation(quotationData);

      const revisionsResponse = await fetch(
        `${API_URL}/quotations/${quotationId}/revisions`
      );

      if (revisionsResponse.ok) {
        const revisionsData =
          await revisionsResponse.json();

        setRevisions(revisionsData);
      }
    } catch (error) {
      console.error(
        "Failed to load quotation:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load quotation."
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
    const number = Number(value);

    if (Number.isInteger(number)) {
      return number.toString();
    }

    return number.toString();
  }

  function handleDownloadPdf() {
    if (!quotation) return;

    openFile(`${API_URL}/quotations/${quotation.id}/pdf`);
  }

  function formatRevisionDate(dateString: string) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Loading quotation...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !quotation) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8">
            <h1 className="text-lg font-semibold text-red-800">
              Unable to load quotation
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error || "Quotation not found."}
            </p>

            <Link
              href="/quotations"
              className="mt-5 inline-flex rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Back to Quotations
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
              href="/quotations"
              className="text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              ← Quotations
            </Link>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
              {quotation.reference_number}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Quotation details and item breakdown
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
              onClick={() =>
                router.push(
                  `/quotations/${quotation.id}/edit`
                )
              }
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Edit Quotation
            </button>

            <DeleteButton
              resource="quotations"
              id={quotation.id}
              label={`quotation ${quotation.reference_number}`}
              redirectTo="/quotations"
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
                {quotation.status}
              </p>
            </div>

            <QuotationStatusBadge status={quotation.status} />
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <QuotationStatusActions
              quotationId={quotation.id}
              currentStatus={quotation.status}
              onStatusChanged={(newStatus) =>
                setQuotation((previous) =>
                  previous
                    ? { ...previous, status: newStatus }
                    : previous
                )
              }
            />
          </div>
        </div>

        {/* Quotation Information */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Quotation Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Basic information associated with this quotation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">

            <Info
              label="Reference Number"
              value={quotation.reference_number}
            />

            <Info
              label="Quotation Date"
              value={formatDate(quotation.date)}
            />

            <Info
              label="PR Number"
              value={quotation.pr_number || "—"}
            />

            <Info
              label="Customer"
              value={quotation.customer_name}
            />

            <Info
              label="Branch"
              value={quotation.branch_name}
            />

            <Info
              label="Assigned By"
              value={quotation.assigned_by || "—"}
            />

            <Info
              label="NTN Number"
              value={quotation.ntn_number || "—"}
            />

          </div>

          {(quotation.subject ||
            quotation.description) && (
            <div className="mt-8 border-t border-gray-200 pt-6">

              {quotation.subject && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Subject
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {quotation.subject}
                  </p>
                </div>
              )}

              {quotation.description && (
                <div className="mt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Description
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {quotation.description}
                  </p>
                </div>
              )}

            </div>
          )}

        </section>

        {/* Items */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-6 py-5 md:px-8">
            <h2 className="text-lg font-semibold text-gray-900">
              Quotation Items
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {quotation.items.length} item
              {quotation.items.length === 1
                ? ""
                : "s"} in this quotation.
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
                {quotation.items.map((item) => (
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
                    Rs. {formatNumber(quotation.total_amount)}
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
              value={quotation.payment_terms}
            />

            <Info
              label="Validity"
              value={quotation.validity}
            />

            <Info
              label="Job Completion"
              value={quotation.job_completion}
            />

          </div>

        </section>

        {/* Revision History */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Revision History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Record of changes made to this quotation.
            </p>
          </div>

          {revisions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 px-5 py-8 text-center">
              <p className="text-sm text-gray-500">
                No revisions have been made yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">

              {revisions.map((revision) => (
                <div
                  key={revision.id}
                  className="rounded-xl border border-gray-200 p-5"
                >

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
                        Revision {revision.revision_number}
                      </span>

                      <span className="text-xs text-gray-400">
                        {formatRevisionDate(
                          revision.created_at
                        )}
                      </span>
                    </div>

                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {revision.description}
                  </p>

                </div>
              ))}

            </div>
          )}

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