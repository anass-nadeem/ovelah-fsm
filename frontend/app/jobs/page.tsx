"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Job = {
  id: number;
  branch_id: number;
  job_number: string;
  complaint_date: string | null;
  complaint_description: string | null;
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

const STATUS_STYLES: Record<string, string> = {
  New: "bg-gray-100 text-gray-700 border-gray-200",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  Completed: "bg-green-50 text-green-700 border-green-200",
  Closed: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [jobsRes, branchesRes, customersRes] = await Promise.all([
        fetch(`${API_URL}/jobs/`),
        fetch(`${API_URL}/branches/`),
        fetch(`${API_URL}/customers/`),
      ]);

      if (!jobsRes.ok) {
        throw new Error("Failed to load jobs.");
      }

      setJobs(await jobsRes.json());
      setBranches(branchesRes.ok ? await branchesRes.json() : []);
      setCustomers(customersRes.ok ? await customersRes.json() : []);
    } catch (err) {
      console.error("Failed to load jobs:", err);

      setError(
        err instanceof Error ? err.message : "Failed to load jobs."
      );
    } finally {
      setLoading(false);
    }
  }

  const branchMap = useMemo(() => {
    const map = new Map<number, Branch>();
    branches.forEach((branch) => map.set(branch.id, branch));
    return map;
  }, [branches]);

  const customerMap = useMemo(() => {
    const map = new Map<number, string>();
    customers.forEach((customer) => map.set(customer.id, customer.name));
    return map;
  }, [customers]);

  function branchName(job: Job) {
    return branchMap.get(job.branch_id)?.name ?? "—";
  }

  function customerName(job: Job) {
    const branch = branchMap.get(job.branch_id);
    if (!branch) return "—";
    return customerMap.get(branch.customer_id) ?? "—";
  }

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        !query ||
        job.job_number.toLowerCase().includes(query) ||
        branchName(job).toLowerCase().includes(query) ||
        customerName(job).toLowerCase().includes(query) ||
        (job.complaint_description || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || job.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, search, statusFilter, branchMap, customerMap]);

  function formatDate(date: string | null) {
    if (!date) return "—";

    const parts = date.split("-");
    if (parts.length !== 3) return date;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Jobs</p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              All Jobs
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Track engineering jobs from complaint to completion.
            </p>
          </div>

          <Link
            href="/jobs/new"
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            + New Job
          </Link>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px]">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search job number, branch, customer..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
              >
                {["All", "New", "In Progress", "Completed", "Closed"].map(
                  (status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500">
              Loading jobs...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-gray-700">
                No jobs found.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? "Try changing your search."
                  : "Create your first job to get started."}
              </p>

              {!search && (
                <Link
                  href="/jobs/new"
                  className="mt-5 inline-flex rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                >
                  + New Job
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Job Number
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Customer
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Branch
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Complaint Date
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
                  {filteredJobs.map((job) => (
                    <tr
                      key={job.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-4">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {job.job_number}
                        </Link>
                      </td>

                      <td className="px-4 py-4 font-medium text-gray-800">
                        {customerName(job)}
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {branchName(job)}
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {formatDate(job.complaint_date)}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                            STATUS_STYLES[job.status] ??
                            "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Result count */}
        {!loading && jobs.length > 0 && (
          <p className="text-xs text-gray-500">
            Showing {filteredJobs.length} of {jobs.length} jobs
          </p>
        )}
      </div>
    </main>
  );
}