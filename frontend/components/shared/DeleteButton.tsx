"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type Props = {
  /** e.g. "quotations", "invoices", "jobs" */
  resource: string;
  id: number;
  /** Shown in the confirm dialog, e.g. "quotation IES/QT/1002" */
  label: string;
  /** Where to send the user after a successful delete */
  redirectTo: string;
};

export default function DeleteButton({
  resource,
  id,
  label,
  redirectTo,
}: Props) {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete ${label}? This can't be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const response = await fetch(
        `${API_URL}/${resource}/${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.detail ||
            `Failed to delete ${label}.`
        );
      }

      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : `Failed to delete ${label}.`
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}