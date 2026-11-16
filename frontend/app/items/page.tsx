"use client";

import { useEffect, useState } from "react";

type Item = {
  id: number;
  description: string;
  uom: string;
  default_rate: number | string | null;
  is_active: boolean;
};

const API_URL = "http://127.0.0.1:8000";

function money(value: number | string | null) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [description, setDescription] = useState("");
  const [uom, setUom] = useState("");
  const [defaultRate, setDefaultRate] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editUom, setEditUom] = useState("");
  const [editRate, setEditRate] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/items/`);

      if (!response.ok) {
        throw new Error("Failed to load items.");
      }

      setItems(await response.json());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load items."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = items.filter((item) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      item.description.toLowerCase().includes(query) ||
      item.uom.toLowerCase().includes(query)
    );
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!description.trim() || !uom.trim()) {
      setFormError("Description and UOM are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const response = await fetch(`${API_URL}/items/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          uom: uom.trim(),
          default_rate: defaultRate ? Number(defaultRate) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create item.");
      }

      setItems((prev) =>
        [...prev, data].sort((a, b) =>
          a.description.localeCompare(b.description)
        )
      );

      setDescription("");
      setUom("");
      setDefaultRate("");
      setShowForm(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create item."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditDescription(item.description);
    setEditUom(item.uom);
    setEditRate(
      item.default_rate === null ? "" : String(item.default_rate)
    );
    setEditActive(item.is_active);
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError("");
  }

  async function saveEdit(itemId: number) {
    if (!editDescription.trim() || !editUom.trim()) {
      setEditError("Description and UOM are required.");
      return;
    }

    setEditSaving(true);
    setEditError("");

    try {
      const response = await fetch(`${API_URL}/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editDescription.trim(),
          uom: editUom.trim(),
          default_rate: editRate ? Number(editRate) : null,
          is_active: editActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update item.");
      }

      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? data : item))
      );

      setEditingId(null);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Failed to update item."
      );
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(item: Item) {
    const confirmed = window.confirm(
      `Delete item "${item.description}"? This can't be undone.`
    );

    if (!confirmed) return;

    setDeletingId(item.id);

    try {
      const response = await fetch(
        `${API_URL}/items/${item.id}`,
        { method: "DELETE" }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to delete item."
        );
      }

      setItems((prev) =>
        prev.filter((i) => i.id !== item.id)
      );
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "Failed to delete item."
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
            <p className="text-sm font-medium text-gray-500">Items</p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              Item Master
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Reusable line items for quotations, with a default rate.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            {showForm ? "Cancel" : "+ Add Item"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 2 Ton AC R22 Gas Charging"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  UOM
                </label>

                <input
                  type="text"
                  value={uom}
                  onChange={(e) => setUom(e.target.value)}
                  placeholder="e.g. Kg, Job, Ea"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Default Rate (optional)
                </label>

                <input
                  type="number"
                  step="0.01"
                  value={defaultRate}
                  onChange={(e) => setDefaultRate(e.target.value)}
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
              {submitting ? "Saving..." : "Save Item"}
            </button>
          </form>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
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
              Loading items...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-gray-700">
                No items found.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? "Try changing your search."
                  : "Add your first item to get started."}
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    UOM
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Default Rate
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
                {filteredItems.map((item) =>
                  editingId === item.id ? (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 bg-gray-50 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) =>
                            setEditDescription(e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-gray-900"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editUom}
                          onChange={(e) => setEditUom(e.target.value)}
                          className="w-24 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-gray-900"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          value={editRate}
                          onChange={(e) => setEditRate(e.target.value)}
                          className="w-32 rounded-lg border border-gray-300 px-2.5 py-1.5 text-right text-sm outline-none focus:border-gray-900"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={editActive}
                            onChange={(e) =>
                              setEditActive(e.target.checked)
                            }
                          />
                          Active
                        </label>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={editSaving}
                            onClick={() => saveEdit(item.id)}
                            className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                          >
                            {editSaving ? "Saving..." : "Save"}
                          </button>

                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>

                        {editError && (
                          <p className="mt-1.5 text-right text-xs text-red-600">
                            {editError}
                          </p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 font-medium text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {item.uom}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-700">
                        {item.default_rate === null
                          ? "—"
                          : `Rs. ${money(item.default_rate)}`}
                      </td>
                      <td className="px-4 py-4">
                        {item.is_active ? (
                          <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item)}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === item.id
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