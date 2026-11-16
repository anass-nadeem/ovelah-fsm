"use client";

import { useState } from "react";

type Props = {
  invoiceId: number;
  currentStatus: string;
  onStatusChanged: (status: string) => void;
};

const API_URL = "http://127.0.0.1:8000";

export default function InvoiceStatusActions({
  invoiceId,
  currentStatus,
  onStatusChanged,
}: Props) {
  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

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
        `${API_URL}/invoices/${invoiceId}/status`,
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
            "Failed to update invoice status."
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
              changeStatus("Sent")
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            Mark as Sent
          </button>
        )}

        {currentStatus === "Sent" && (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              changeStatus("Paid")
            }
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            Mark as Paid
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