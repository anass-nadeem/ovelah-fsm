"use client";

import { useEffect, useMemo, useState } from "react";

type Expense = {
  id: number;
  date: string;
  category: string;
  description: string | null;
  amount: number | string;
  paid_by: string | null;
};

const API_URL = "http://127.0.0.1:8000";

const CATEGORIES = [
  "Fuel",
  "Food",
  "Rent",
  "Supplies",
  "Utilities",
  "Salaries",
  "Maintenance",
  "Transport",
  "Other",
];

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

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/expenses/`);

      if (!response.ok) {
        throw new Error("Failed to load expenses.");
      }

      setExpenses(await response.json());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load expenses."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === "All") return expenses;
    return expenses.filter((e) => e.category === categoryFilter);
  }, [expenses, categoryFilter]);

  const currentMonthValue = new Date().toISOString().slice(0, 7);
  const [summaryMonth, setSummaryMonth] = useState(currentMonthValue);

  const monthlyBreakdown = useMemo(() => {
    const inMonth = expenses.filter((e) =>
      e.date.startsWith(summaryMonth)
    );

    const byCategory: Record<string, number> = {};

    for (const e of inMonth) {
      byCategory[e.category] =
        (byCategory[e.category] || 0) + Number(e.amount || 0);
    }

    const total = inMonth.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    );

    const rows = Object.entries(byCategory).sort(
      (a, b) => b[1] - a[1]
    );

    return { total, rows };
  }, [expenses, summaryMonth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      setFormError("A valid amount is required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const response = await fetch(`${API_URL}/expenses/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          category,
          description: description.trim() || null,
          amount: Number(amount),
          paid_by: paidBy.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to add expense.");
      }

      setExpenses((prev) =>
        [data, ...prev].sort((a, b) => (a.date < b.date ? 1 : -1))
      );

      setDate(today);
      setCategory(CATEGORIES[0]);
      setDescription("");
      setAmount("");
      setPaidBy("");
      setShowForm(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to add expense."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(expenseId: number) {
    try {
      const response = await fetch(`${API_URL}/expenses/${expenseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete expense.");
      }

      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete expense."
      );
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Expenses</p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              Daily Expenses
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              General company spending - fuel, rent, supplies, and more.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            {showForm ? "Cancel" : "+ Add Expense"}
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Monthly Breakdown
            </p>

            <input
              type="month"
              value={summaryMonth}
              onChange={(e) => setSummaryMonth(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-900"
            />
          </div>

          <p className="mt-2 text-2xl font-semibold text-gray-900">
            Rs. {money(monthlyBreakdown.total)}
          </p>

          {monthlyBreakdown.rows.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
              {monthlyBreakdown.rows.map(([category, amount]) => (
                <div
                  key={category}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600">{category}</span>
                  <span className="font-medium text-gray-900">
                    Rs. {money(amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
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
                  Paid By (optional)
                </label>
                <input
                  type="text"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
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
                  placeholder="e.g. Diesel for van, office rent for August"
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
              {submitting ? "Saving..." : "Save Expense"}
            </button>
          </form>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Filter by Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 md:w-64"
          >
            <option value="All">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500">
              Loading expenses...
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-gray-700">
                No expenses found.
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Paid By
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-4 text-gray-600">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {expense.description || "—"}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {expense.paid_by || "—"}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-gray-900">
                      Rs. {money(expense.amount)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(expense.id)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
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