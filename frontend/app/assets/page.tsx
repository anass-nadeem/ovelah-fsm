"use client";

import { useEffect, useMemo, useState } from "react";

type Asset = {
  id: number;
  name: string;
  asset_type: string;
  value: number | string | null;
  purchase_date: string | null;
  notes: string | null;
};

const API_URL = "http://127.0.0.1:8000";

const ASSET_TYPES = ["Tool", "Vehicle", "Equipment", "Other"];

function money(value: number | string | null) {
  if (value === null || value === undefined) return "—";
  return `Rs. ${Number(value).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date: string | null) {
  if (!date) return "—";
  const parts = date.split("-");
  if (parts.length !== 3) return date;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState(ASSET_TYPES[0]);
  const [value, setValue] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/assets/`);

      if (!response.ok) {
        throw new Error("Failed to load assets.");
      }

      setAssets(await response.json());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load assets."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredAssets = useMemo(() => {
    if (typeFilter === "All") return assets;
    return assets.filter((a) => a.asset_type === typeFilter);
  }, [assets, typeFilter]);

  const totalValue = useMemo(
    () =>
      assets.reduce((sum, a) => sum + Number(a.value || 0), 0),
    [assets]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setFormError("Asset name is required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const response = await fetch(`${API_URL}/assets/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          asset_type: assetType,
          value: value ? Number(value) : null,
          purchase_date: purchaseDate || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to add asset.");
      }

      setAssets((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      );

      setName("");
      setAssetType(ASSET_TYPES[0]);
      setValue("");
      setPurchaseDate("");
      setNotes("");
      setShowForm(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to add asset."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(assetId: number) {
    try {
      const response = await fetch(`${API_URL}/assets/${assetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete asset.");
      }

      setAssets((prev) => prev.filter((a) => a.id !== assetId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete asset."
      );
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Assets</p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              Company Assets
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Tools, vehicles, and equipment the company owns.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            {showForm ? "Cancel" : "+ Add Asset"}
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Total Asset Value
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {money(totalValue)}
          </p>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Asset Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Suzuki Ravi (Van), Refrigerant Gauge Set"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                >
                  {ASSET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Value (Rs., optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Purchase Date (optional)
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
              {submitting ? "Saving..." : "Save Asset"}
            </button>
          </form>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Filter by Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 md:w-64"
          >
            <option value="All">All</option>
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
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
              Loading assets...
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-gray-700">
                No assets found.
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Purchase Date
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Value
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-4 font-medium text-gray-900">
                      {asset.name}
                      {asset.notes && (
                        <p className="text-xs font-normal text-gray-500">
                          {asset.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {asset.asset_type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {formatDate(asset.purchase_date)}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-gray-900">
                      {money(asset.value)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(asset.id)}
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