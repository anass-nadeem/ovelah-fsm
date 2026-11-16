"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type ItemRow = {
  description: string;
  qty: number;
  uom: string;
  unit_rate: number;
};

function emptyRow(): ItemRow {
  return { description: "", qty: 1, uom: "Job", unit_rate: 0 };
}

export default function NewDirectInvoicePage() {
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];

  const [invoiceDate, setInvoiceDate] = useState(today);
  const [customerName, setCustomerName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [prNumber, setPrNumber] = useState("");
  const [assignedBy, setAssignedBy] = useState("Mainte Department");
  const [subject, setSubject] = useState("");
  const [paymentTerms, setPaymentTerms] = useState(
    "As per KFC Policy."
  );

  const [rows, setRows] = useState<ItemRow[]>([emptyRow()]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const total = useMemo(() => {
    return rows.reduce(
      (sum, row) => sum + row.qty * row.unit_rate,
      0
    );
  }, [rows]);

  function updateRow(
    index: number,
    field: keyof ItemRow,
    value: string | number
  ) {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(index: number) {
    setRows((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!customerName.trim() || !branchName.trim()) {
      setError("Customer name and branch are required.");
      return;
    }

    const validRows = rows.filter(
      (row) => row.description.trim() && row.qty > 0
    );

    if (validRows.length === 0) {
      setError("Add at least one item with a description and quantity.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/invoices/direct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_date: invoiceDate,
          customer_name: customerName.trim(),
          branch_name: branchName.trim(),
          pr_number: prNumber.trim() || null,
          assigned_by: assignedBy.trim() || null,
          subject: subject.trim() || null,
          payment_terms: paymentTerms.trim() || "As per KFC Policy.",
          items: validRows.map((row) => ({
            description: row.description.trim(),
            qty: row.qty,
            uom: row.uom.trim() || "Job",
            unit_rate: row.unit_rate,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create invoice.");
      }

      router.push(`/invoices/${data.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create invoice."
      );
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">

        <div>
          <p className="text-sm font-medium text-gray-500">Invoices</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            New Invoice
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Create an invoice directly, without going through a
            quotation first. A matching record is created behind the
            scenes automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-lg font-semibold text-gray-900">
              Invoice Information
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Kentucky Fried Chicken"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Branch
                </label>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. F-10, Islamabad"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  PR Number (optional)
                </label>
                <input
                  type="text"
                  value={prNumber}
                  onChange={(e) => setPrNumber(e.target.value)}
                  placeholder="e.g. PR-054900"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Assigned By
                </label>
                <input
                  type="text"
                  value={assignedBy}
                  onChange={(e) => setAssignedBy(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. 2 Ton AC Servicing"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 md:px-8">
              <h2 className="text-lg font-semibold text-gray-900">
                Items
              </h2>

              <button
                type="button"
                onClick={addRow}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                + Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Description
                    </th>
                    <th className="w-24 px-4 py-3 text-right font-semibold text-gray-600">
                      Qty
                    </th>
                    <th className="w-24 px-4 py-3 text-left font-semibold text-gray-600">
                      UOM
                    </th>
                    <th className="w-36 px-4 py-3 text-right font-semibold text-gray-600">
                      Unit Rate
                    </th>
                    <th className="w-36 px-4 py-3 text-right font-semibold text-gray-600">
                      Amount
                    </th>
                    <th className="w-12 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) =>
                            updateRow(index, "description", e.target.value)
                          }
                          placeholder="e.g. AC Gas Charging"
                          className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-gray-900"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={row.qty}
                          onChange={(e) =>
                            updateRow(
                              index,
                              "qty",
                              Number(e.target.value)
                            )
                          }
                          className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-right text-sm outline-none focus:border-gray-900"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={row.uom}
                          onChange={(e) =>
                            updateRow(index, "uom", e.target.value)
                          }
                          className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-gray-900"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={row.unit_rate}
                          onChange={(e) =>
                            updateRow(
                              index,
                              "unit_rate",
                              Number(e.target.value)
                            )
                          }
                          className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-right text-sm outline-none focus:border-gray-900"
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">
                        Rs.{" "}
                        {(row.qty * row.unit_rate).toLocaleString(
                          "en-PK",
                          { minimumFractionDigits: 2 }
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          disabled={rows.length === 1}
                          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-30"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-200 px-6 py-5 md:px-8">
              <div className="flex justify-end">
                <div className="flex items-center justify-between gap-8">
                  <span className="text-sm font-medium text-gray-600">
                    Grand Total
                  </span>
                  <span className="text-xl font-semibold text-gray-900">
                    Rs.{" "}
                    {total.toLocaleString("en-PK", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Invoice"}
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}