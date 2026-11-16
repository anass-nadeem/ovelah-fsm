"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import QuotationStatusBadge from "@/components/quotation/QuotationStatusBadge";
import { openFile } from "@/lib/downloadFile";

type Quotation = {
  id: number;
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
};

const API_URL = "http://127.0.0.1:8000";

export default function QuotationsPage() {
  return (
    <Suspense fallback={null}>
      <QuotationsPageContent />
    </Suspense>
  );
}

function QuotationsPageContent() {
  const searchParams = useSearchParams();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "All"
  );

  useEffect(() => {
    loadQuotations();
  }, []);

  async function loadQuotations() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/quotations/`);

      if (!response.ok) {
        throw new Error("Failed to load quotations.");
      }

      const data = await response.json();

      setQuotations(data);
    } catch (error) {
      console.error("Failed to load quotations:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load quotations."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredQuotations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return quotations.filter((quotation) => {
      const matchesSearch =
        !query ||
        quotation.reference_number
          .toLowerCase()
          .includes(query) ||
        (quotation.pr_number || "")
          .toLowerCase()
          .includes(query) ||
        quotation.customer_name
          .toLowerCase()
          .includes(query) ||
        quotation.branch_name
          .toLowerCase()
          .includes(query) ||
        (quotation.subject || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        quotation.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotations, search, statusFilter]);

  // Fixed list matching the backend QuotationStatus enum, so all
  // statuses are filterable even before any quotation reaches them.
  const statuses = [
    "All",
    "Draft",
    "Submitted",
    "Approved",
    "Rejected",
    "Invoiced",
  ];

  function formatDate(date: string) {
    const parts = date.split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function formatAmount(amount: number | string) {
    return Number(amount || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Quotations
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              All Quotations
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              View and manage all quotations created in the ERP.
            </p>
          </div>

          <Link
            href="/quotations/new"
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            + New Quotation
          </Link>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px]">

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reference, PR number, customer, branch..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500">
              Loading quotations...
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="px-6 py-16 text-center">

              <p className="text-sm font-medium text-gray-700">
                No quotations found.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? "Try changing your search."
                  : "Create your first quotation to get started."}
              </p>

              {!search && (
                <Link
                  href="/quotations/new"
                  className="mt-5 inline-flex rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                >
                  + New Quotation
                </Link>
              )}

            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse text-sm">

                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">

                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Reference
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Date
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Customer
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Branch
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      PR Number
                    </th>

                    <th className="px-4 py-3 text-right font-semibold text-gray-600">
                      Amount
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Status
                    </th>

                    <th className="px-4 py-3 text-right font-semibold text-gray-600">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {filteredQuotations.map((quotation) => (
                    <tr
                      key={quotation.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >

                      <td className="px-4 py-4">
                        <Link
                          href={`/quotations/${quotation.id}`}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {quotation.reference_number}
                        </Link>
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {formatDate(quotation.date)}
                      </td>

                      <td className="px-4 py-4 font-medium text-gray-800">
                        {quotation.customer_name}
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {quotation.branch_name}
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {quotation.pr_number || "—"}
                      </td>

                      <td className="px-4 py-4 text-right font-medium text-gray-900">
                        Rs. {formatAmount(quotation.total_amount)}
                      </td>

                      <td className="px-4 py-4">
                        <QuotationStatusBadge status={quotation.status} />
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openFile(`${API_URL}/quotations/${quotation.id}/pdf`).catch(
                                (err: any) =>
                                  window.alert(
                                    err instanceof Error
                                      ? err.message
                                      : "Failed to download the PDF."
                                  )
                              )
                            }
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            PDF
                          </button>

                          <Link
                            href={`/quotations/${quotation.id}`}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            View
                          </Link>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </div>

        {/* Result count */}
        {!loading && quotations.length > 0 && (
          <p className="text-xs text-gray-500">
            Showing {filteredQuotations.length} of{" "}
            {quotations.length} quotations
          </p>
        )}

      </div>
    </main>
  );
}