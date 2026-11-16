"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import DeleteButton from "@/components/shared/DeleteButton";

type Job = {
  id: number;
  branch_id: number;
  job_number: string;
  complaint_date: string | null;
  complaint_description: string | null;
  pr_number: string | null;
  status: string;
  created_at: string;
};

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

const STATUSES = ["New", "In Progress", "Completed", "Closed"];

const STATUS_STYLES: Record<string, string> = {
  New: "bg-gray-100 text-gray-700 border-gray-200",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  Completed: "bg-green-50 text-green-700 border-green-200",
  Closed: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id;

  const [job, setJob] = useState<Job | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");

  const [prDraft, setPrDraft] = useState("");
  const [editingPr, setEditingPr] = useState(false);
  const [savingPr, setSavingPr] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    loadJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  async function loadJob() {
    try {
      setLoading(true);
      setError("");

      const jobRes = await fetch(`${API_URL}/jobs/${jobId}`);

      if (!jobRes.ok) {
        throw new Error(
          jobRes.status === 404 ? "Job not found." : "Failed to load job."
        );
      }

      const jobData: Job = await jobRes.json();
      setJob(jobData);
      setPrDraft(jobData.pr_number || "");

      const branchRes = await fetch(
        `${API_URL}/branches/${jobData.branch_id}`
      );

      if (branchRes.ok) {
        const branchData: Branch = await branchRes.json();
        setBranch(branchData);

        const customerRes = await fetch(
          `${API_URL}/customers/${branchData.customer_id}`
        );

        if (customerRes.ok) {
          setCustomer(await customerRes.json());
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load job."
      );
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(status: string) {
    if (!job || status === job.status) return;

    setUpdating(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/jobs/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update status.");
      }

      setJob(data);
      setMessage(`Status changed to ${data.status}.`);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to update status."
      );
    } finally {
      setUpdating(false);
    }
  }

  async function savePrNumber() {
    if (!job) return;

    setSavingPr(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/jobs/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pr_number: prDraft.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to save PR number.");
      }

      setJob(data);
      setEditingPr(false);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to save PR number."
      );
    } finally {
      setSavingPr(false);
    }
  }

  function formatDate(date: string | null) {
    if (!date) return "—";
    const parts = date.split("-");
    if (parts.length !== 3) return date;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-sm text-gray-500">Loading job...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8">
            <h1 className="text-lg font-semibold text-red-800">
              Unable to load job
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error || "Job not found."}
            </p>

            <Link
              href="/jobs"
              className="mt-5 inline-flex rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Back to Jobs
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/jobs"
              className="text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              ← Jobs
            </Link>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
              {job.job_number}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Created {formatDate(job.created_at.split("T")[0])}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/quotations/new?job_id=${job.id}`}
              className="inline-flex items-center justify-center rounded-lg bg-ies-blue px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-ies-blue-dark"
            >
              Create Quotation
            </Link>

            <DeleteButton
              resource="jobs"
              id={job.id}
              label={`job ${job.job_number}`}
              redirectTo="/jobs"
            />
          </div>
        </div>

        {/* Status */}
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Current Status
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {job.status}
              </p>
            </div>

            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                STATUS_STYLES[job.status] ??
                "bg-gray-100 text-gray-700 border-gray-200"
              }`}
            >
              {job.status}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
            {STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                disabled={updating || status === job.status}
                onClick={() => changeStatus(status)}
                className={`rounded-lg px-3.5 py-2 text-xs font-medium transition disabled:opacity-40 ${
                  status === job.status
                    ? "bg-gray-900 text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {message && (
            <p className="mt-3 text-sm text-gray-500">{message}</p>
          )}
        </div>

        {/* Job Information */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-lg font-semibold text-gray-900">
            Job Information
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            <Info label="Customer" value={customer?.name || "—"} />
            <Info label="Branch" value={branch?.name || "—"} />
            <Info
              label="Complaint Date"
              value={formatDate(job.complaint_date)}
            />
            <Info label="Site ID" value={branch?.site_id || "—"} />

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                PR Number
              </p>

              {editingPr ? (
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="text"
                    value={prDraft}
                    onChange={(e) => setPrDraft(e.target.value)}
                    placeholder="e.g. PR-054900"
                    autoFocus
                    className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-gray-900"
                  />

                  <button
                    type="button"
                    disabled={savingPr}
                    onClick={savePrNumber}
                    className="shrink-0 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {savingPr ? "..." : "Save"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPrDraft(job.pr_number || "");
                      setEditingPr(false);
                    }}
                    className="shrink-0 text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    {job.pr_number || (
                      <span className="text-amber-600">
                        Not received yet
                      </span>
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={() => setEditingPr(true)}
                    className="text-xs font-medium text-ies-blue hover:underline"
                  >
                    {job.pr_number ? "Edit" : "Add"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {job.complaint_description && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Complaint Description
              </p>

              <p className="mt-1 text-sm text-gray-900">
                {job.complaint_description}
              </p>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}