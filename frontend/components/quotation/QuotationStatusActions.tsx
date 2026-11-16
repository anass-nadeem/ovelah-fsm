"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  quotationId: number;
  currentStatus: string;
  onStatusChanged: (status: string) => void;
};

const API_URL = "http://127.0.0.1:8000";

export default function QuotationStatusActions({
  quotationId,
  currentStatus,
  onStatusChanged,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [invoiceId, setInvoiceId] =
    useState<number | null>(null);

  // If this quotation has already been invoiced, look up the
  // invoice so we can link straight to it instead of showing a
  // dead-end "Invoiced" badge.
  useEffect(() => {
    if (currentStatus !== "Invoiced") {
      setInvoiceId(null);
      return;
    }

    fetch(
      `${API_URL}/invoices/by-quotation/${quotationId}`
    )
      .then((response) =>
        response.ok ? response.json() : null
      )
      .then((data) => {
        if (data) {
          setInvoiceId(data.id);
        }
      })
      .catch(() => {
        // Non-fatal: worst case the link just doesn't appear.
      });
  }, [currentStatus, quotationId]);

  async function generateInvoice() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/invoices/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quotation_id: quotationId,
            invoice_date:
              new Date().toISOString().split("T")[0],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to generate invoice."
        );
      }

      onStatusChanged("Invoiced");

      router.push(`/invoices/${data.id}`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to generate invoice."
      );
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(
    status: string
  ) {
    if (status === currentStatus) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/quotations/${quotationId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to update quotation status."
        );
      }

      onStatusChanged(data.status);

      setMessage(
        `Status changed to ${data.status}.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update status."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">

        {currentStatus === "Draft" && (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              changeStatus("Submitted")
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            Mark as Submitted
          </button>
        )}

        {currentStatus === "Submitted" && (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                changeStatus("Approved")
              }
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              Approve
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                changeStatus("Rejected")
              }
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}

        {currentStatus === "Approved" && (
          <button
            type="button"
            disabled={loading}
            onClick={generateInvoice}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            Generate Invoice
          </button>
        )}

        {currentStatus === "Invoiced" && invoiceId && (
          <button
            type="button"
            onClick={() =>
              router.push(`/invoices/${invoiceId}`)
            }
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
          >
            View Invoice
          </button>
        )}

        {currentStatus === "Rejected" && (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              changeStatus("Draft")
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Reopen as Draft
          </button>
        )}
      </div>

      {message && (
        <p className="text-sm text-gray-500">
          {message}
        </p>
      )}
    </div>
  );
}