"use client";

import { useEffect, useMemo, useState } from "react";

type Credit = {
  id: number;
  direction: "Payable" | "Receivable";
  party_name: string;
  amount: number | string;
  date: string;
  description: string | null;
  status: "Open" | "Settled";
};

const API_URL = "http://127.0.0.1:8000";

function money(value: number | string) {
  return Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(date: string) {
  const parts = date.split("-");
  if (parts.length !== 3) return date;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function CreditsPage() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [directionFilter, setDirectionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("Open");

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const [direction, setDirection] = useState<"Payable" | "Receivable">(
    "Payable"
  );
  const [partyName, setPartyName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadCredits();
  }, []);

  async function loadCredits() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/credits/`);

      if (!response.ok) {
        throw new Error("Failed to load records.");
      }

      setCredits(await response.json());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load records."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredCredits = useMemo(() => {
    return credits.filter((c) => {
      const matchesDirection =
        directionFilter === "All" || c.direction === directionFilter;
      const matchesStatus =
        statusFilter === "All" || c.status === statusFilter;
      return matchesDirection && matchesStatus;
    });
  }, [credits, directionFilter, statusFilter]);

  const totals = useMemo(() => {
    const open = credits.filter((c) => c.status === "Open");
    const payable = open
      .filter((c) => c.direction === "Payable")
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const receivable = open
      .filter((c) => c.direction === "Receivable")
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);
    return { payable, receivable };
  }, [credits]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!partyName.trim() || !amount || Number(amount) <= 0) {
      setFormError("Party name and a valid amount are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const response = await fetch(`${API_URL}/credits/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction,
          party_name: partyName.trim(),
          amount: Number(amount),
          date,
          description: description.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to add record.");
      }

      setCredits((prev) => [data, ...prev]);

      setPartyName("");
      setAmount("");
      setDate(today);
      setDescription("");
      setShowForm(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to add record."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function markSettled(creditId: number) {
    try {
      const response = await fetch(`${API_URL}/credits/${creditId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Settled" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update status.");
      }

      setCredits((prev) =>
        prev.map((c) => (c.id === creditId ? data : c))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update status."
      );
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Credits</p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              Credits &amp; Payables
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Money the company owes, and money owed to the company.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            {showForm ? "Cancel" : "+ Add Record"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              We Owe (Open)
            </p>
            <p className="mt-1 text-2xl font-semibold text-red-600">
              Rs. {money(totals.payable)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Owed To Us (Open)
            </p>
            <p className="mt-1 text-2xl font-semibold text-green-600">
              Rs. {money(totals.receivable)}
            </p>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Direction
                </label>
                <select
                  value={direction}
                  onChange={(e) =>
                    setDirection(e.target.value as "Payable" | "Receivable")
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                >
                  <option value="Payable">We owe them (Payable)</option>
                  <option value="Receivable">They owe us (Receivable)</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Party Name
                </label>
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g. AC Parts Supplier, Contractor Name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Amount (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Compressor units purchased on credit"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Record"}
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Direction
            </label>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
            >
              <option value="All">All</option>
              <option value="Payable">Payable (we owe)</option>
              <option value="Receivable">Receivable (owed to us)</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
            >
              <option value="All">All</option>
              <option value="Open">Open</option>
              <option value="Settled">Settled</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500">
              Loading...
            </div>
          ) : filteredCredits.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-gray-700">
                No records found.
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Direction
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Party
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Description
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
                {filteredCredits.map((credit) => (
                  <tr
                    key={credit.id}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          credit.direction === "Payable"
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {credit.direction}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-900">
                      {credit.party_name}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {formatDate(credit.date)}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {credit.description || "—"}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-gray-900">
                      Rs. {money(credit.amount)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          credit.status === "Open"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {credit.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {credit.status === "Open" && (
                        <button
                          type="button"
                          onClick={() => markSettled(credit.id)}
                          className="text-xs font-medium text-ies-blue hover:underline"
                        >
                          Mark Settled
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </main>
  );
}