"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: number;
  name: string;
  requires_pr_number: boolean;
};

const API_URL = "http://127.0.0.1:8000";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [requiresPrNumber, setRequiresPrNumber] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editRequiresPrNumber, setEditRequiresPrNumber] =
    useState(true);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/customers/`);

      if (!response.ok) {
        throw new Error("Failed to load clients.");
      }

      setCustomers(await response.json());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load clients."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setFormError("Client name is required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
        const response = await fetch(`${API_URL}/customers/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          requires_pr_number: requiresPrNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to add client.");
      }

      setCustomers((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      );

      setName("");
      setRequiresPrNumber(true);
      setShowForm(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to add client."
      );
    } finally {
      setSubmitting(false);
    }
  }

    function startEdit(customer: Customer) {
    setEditingId(customer.id);
    setEditName(customer.name);
    setEditRequiresPrNumber(customer.requires_pr_number);
    setEditError("");
  }

  async function saveEdit(customerId: number) {
    if (!editName.trim()) {
      setEditError("Name is required.");
      return;
    }

    setEditSaving(true);
    setEditError("");

    try {
      const response = await fetch(
        `${API_URL}/customers/${customerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editName.trim(),
            requires_pr_number: editRequiresPrNumber,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update client.");
      }

      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? data : c))
      );

      setEditingId(null);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Failed to update client."
      );
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(customer: Customer) {
    const confirmed = window.confirm(
      `Delete client "${customer.name}"? This can't be undone.`
    );

    if (!confirmed) return;

    setDeletingId(customer.id);

    try {
      const response = await fetch(
        `${API_URL}/customers/${customer.id}`,
        { method: "DELETE" }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to delete client."
        );
      }

      setCustomers((prev) =>
        prev.filter((c) => c.id !== customer.id)
      );
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "Failed to delete client."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Clients</p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              Clients
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Customers that quotations, invoices, and branches are created against.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            {showForm ? "Cancel" : "+ Add Client"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
                        <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Client Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kentucky Fried Chicken"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={requiresPrNumber}
                onChange={(e) =>
                  setRequiresPrNumber(e.target.checked)
                }
              />
              Requires PR Number on quotations/invoices
            </label>

            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Client"}
            </button>
          </form>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500">
              Loading clients...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-gray-700">
                No clients found.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? "Try changing your search."
                  : "Add your first client to get started."}
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Client Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    PR Number
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) =>
                  editingId === customer.id ? (
                    <tr
                      key={customer.id}
                      className="border-b border-gray-100 bg-gray-50 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                          className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-gray-900"
                        />
                                                {editError && (
                          <p className="mt-1 text-xs text-red-600">
                            {editError}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={editRequiresPrNumber}
                            onChange={(e) =>
                              setEditRequiresPrNumber(
                                e.target.checked
                              )
                            }
                          />
                          Required
                        </label>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={editSaving}
                            onClick={() => saveEdit(customer.id)}
                            className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                          >
                            {editSaving ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={customer.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                                            <td className="px-4 py-4 font-medium text-gray-900">
                        {customer.name}
                      </td>
                      <td className="px-4 py-4">
                        {customer.requires_pr_number ? (
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            Required
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                            Not required
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(customer)}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={deletingId === customer.id}
                            onClick={() => handleDelete(customer)}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === customer.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </main>
  );
}