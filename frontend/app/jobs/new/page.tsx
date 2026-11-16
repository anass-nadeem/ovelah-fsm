"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  id: number;
  name: string;
};

type Branch = {
  id: number;
  customer_id: number;
  name: string;
  address: string | null;
  site_id: string | null;
};

const API_URL = "http://127.0.0.1:8000";

export default function NewJobPage() {
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [customerId, setCustomerId] = useState<number | "">("");
  const [branchId, setBranchId] = useState<number | "">("");
  const [complaintDate, setComplaintDate] = useState(today);
  const [complaintDescription, setComplaintDescription] = useState("");
  const [prNumber, setPrNumber] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/customers/`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch customers");
        return response.json();
      })
      .then((data) => setCustomers(data))
      .catch((error) => console.error("Failed to load customers:", error));
  }, []);

  useEffect(() => {
    if (!customerId) {
      setBranches([]);
      return;
    }

    fetch(`${API_URL}/branches/?customer_id=${customerId}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch branches");
        return response.json();
      })
      .then((data) => setBranches(data))
      .catch((error) => console.error("Failed to load branches:", error));
  }, [customerId]);

  async function saveJob() {
    setMessage("");

    if (!branchId) {
      setMessage("Please select a branch.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/jobs/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branch_id: branchId,
          complaint_date: complaintDate || null,
          complaint_description: complaintDescription || null,
          pr_number: prNumber.trim() || null,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create job.";

        try {
          const error = await response.json();
          errorMessage = error.detail || errorMessage;
        } catch {
          // keep default message
        }

        throw new Error(errorMessage);
      }

      const job = await response.json();

      router.push(`/jobs/${job.id}`);
    } catch (error) {
      console.error("Failed to create job:", error);

      setMessage(
        error instanceof Error ? error.message : "Failed to create job."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-3xl space-y-8">

        {/* Header */}
        <div>
          <p className="text-sm font-medium text-gray-500">Jobs</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            New Job
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Record a new engineering job for a customer branch.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* Customer */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Customer
              </label>

              <select
                value={customerId}
                onChange={(e) => {
                  setCustomerId(
                    e.target.value ? Number(e.target.value) : ""
                  );
                  setBranchId("");
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
              >
                <option value="">Select customer</option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Branch
              </label>

              <select
                value={branchId}
                onChange={(e) =>
                  setBranchId(e.target.value ? Number(e.target.value) : "")
                }
                disabled={!customerId}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-900 disabled:bg-gray-100"
              >
                <option value="">
                  {customerId ? "Select branch" : "Select customer first"}
                </option>

                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Complaint Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Complaint Date
              </label>

              <input
                type="date"
                value={complaintDate}
                onChange={(e) => setComplaintDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
              />
            </div>

            {/* PR Number */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                PR Number (if already provided)
              </label>

              <input
                type="text"
                value={prNumber}
                onChange={(e) => setPrNumber(e.target.value)}
                placeholder="e.g. PR-054900"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
              />

              <p className="mt-1.5 text-xs text-gray-500">
                Leave blank if not received yet - it&apos;ll carry over
                automatically once you create a quotation for this job.
              </p>
            </div>

            {/* Complaint Description */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Complaint Description
              </label>

              <textarea
                value={complaintDescription}
                onChange={(e) => setComplaintDescription(e.target.value)}
                rows={4}
                placeholder="Describe the reported issue..."
                className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
              />
            </div>
          </div>

          {message && (
            <p className="mt-5 text-sm text-red-600">{message}</p>
          )}

          <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              disabled={saving}
              onClick={saveJob}
              className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create Job"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}