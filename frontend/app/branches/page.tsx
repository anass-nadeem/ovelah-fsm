"use client";

import { useEffect, useState } from "react";

type Branch = {
  id: number;
  customer_id: number;
  name: string;
  address: string | null;
  site_id: string | null;
};

type Customer = {
  id: number;
  name: string;
};

const API_URL = "http://127.0.0.1:8000";

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [siteId, setSiteId] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [branchesRes, customersRes] = await Promise.all([
        fetch(`${API_URL}/branches/`),
        fetch(`${API_URL}/customers/`),
      ]);

      if (!branchesRes.ok) {
        throw new Error("Failed to load branches.");
      }

      const branchesData = await branchesRes.json();
      const customersData = customersRes.ok
        ? await customersRes.json()
        : [];

      setBranches(branchesData);
      setCustomers(customersData);

      if (customersData.length > 0 && !customerId) {
        setCustomerId(String(customersData[0].id));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load branches."
      );
    } finally {
      setLoading(false);
    }
  }

  function customerName(id: number) {
    return customers.find((c) => c.id === id)?.name ?? "—";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!customerId || !name.trim()) {
      setFormError("Customer and branch name are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const response = await fetch(`${API_URL}/branches/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: Number(customerId),
          name: name.trim(),
          address: address.trim() || null,
          site_id: siteId.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create branch.");
      }

      setBranches((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      );

      setName("");
      setAddress("");
      setSiteId("");
      setShowForm(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create branch."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(branch: Branch) {
    const confirmed = window.confirm(
      `Delete branch "${branch.name}"? This can't be undone.`
    );

    if (!confirmed) return;

    setDeletingId(branch.id);

    try {
      const response = await fetch(
        `${API_URL}/branches/${branch.id}`,
        { method: "DELETE" }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to delete branch."
        );
      }

      setBranches((prev) =>
        prev.filter((b) => b.id !== branch.id)
      );
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "Failed to delete branch."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Branches</p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              Customer Branches
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Branch locations quotations and jobs are created against.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            {showForm ? "Cancel" : "+ Add Branch"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Customer
                </label>

                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                >
                  {customers.length === 0 && (
                    <option value="">No customers yet</option>
                  )}
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Branch Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. F-10, Islamabad"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Address (optional)
                </label>

                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Site ID (optional)
                </label>

                <input
                  type="text"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
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
              {submitting ? "Saving..." : "Save Branch"}
            </button>
          </form>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500">
              Loading branches...
            </div>
          ) : branches.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-gray-700">
                No branches yet.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Add your first branch to get started.
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Branch
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Address
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Site ID
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr
                    key={branch.id}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-4 font-medium text-gray-900">
                      {branch.name}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {customerName(branch.customer_id)}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {branch.address || "—"}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {branch.site_id || "—"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        disabled={deletingId === branch.id}
                        onClick={() => handleDelete(branch)}
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === branch.id
                          ? "Deleting..."
                          : "Delete"}
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