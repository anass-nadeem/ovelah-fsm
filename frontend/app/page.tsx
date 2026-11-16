"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Quotation = {
  id: number;
  reference_number: string;
  date: string;
  customer_name: string;
  branch_name: string;
  pr_number: string | null;
  total_amount: number | string;
  status: string;
};

type Invoice = {
  id: number;
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  branch_name: string;
  pr_number: string | null;
  total_amount: number | string;
  status: string;
};

type Job = {
  id: number;
  job_number: string;
  pr_number: string | null;
  status: string;
};

const API_URL = "http://127.0.0.1:8000";

function money(value: number | string) {
  return Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function HomePage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [quotationsRes, invoicesRes, jobsRes] = await Promise.all([
        fetch(`${API_URL}/quotations/`),
        fetch(`${API_URL}/invoices/`),
        fetch(`${API_URL}/jobs/`),
      ]);

      if (!quotationsRes.ok || !invoicesRes.ok || !jobsRes.ok) {
        throw new Error("Failed to load dashboard data.");
      }

      setQuotations(await quotationsRes.json());
      setInvoices(await invoicesRes.json());
      setJobs(await jobsRes.json());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }

  // "Sent" = Submitted, awaiting a decision. "Pending" here means
  // still sitting in Draft - created but not yet sent out.
  const quotationsSent = useMemo(
    () => quotations.filter((q) => q.status === "Submitted"),
    [quotations]
  );

  const quotationsPending = useMemo(
    () => quotations.filter((q) => q.status === "Draft"),
    [quotations]
  );

  const quotationsApprovedNotInvoiced = useMemo(
    () => quotations.filter((q) => q.status === "Approved"),
    [quotations]
  );

  // Invoices: "Sent" = handed to the customer, unpaid. "Pending" is
  // the same set (pending payment) - shown as one figure.
  const invoicesPendingPayment = useMemo(
    () => invoices.filter((inv) => inv.status === "Sent"),
    [invoices]
  );

  const invoicesPaid = useMemo(
    () => invoices.filter((inv) => inv.status === "Paid"),
    [invoices]
  );

  const outstandingAmount = useMemo(
    () =>
      invoices
        .filter((inv) => inv.status !== "Paid")
        .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0),
    [invoices]
  );

  // PR number is required by KFC on every document - missing ones
  // are a real follow-up item, not just a stat.
  const quotationsMissingPr = useMemo(
    () => quotations.filter((q) => !q.pr_number),
    [quotations]
  );

  const invoicesMissingPr = useMemo(
    () => invoices.filter((inv) => !inv.pr_number),
    [invoices]
  );

  const jobsNew = useMemo(
    () => jobs.filter((j) => j.status === "New"),
    [jobs]
  );

  const jobsQuotationSent = useMemo(
    () => jobs.filter((j) => j.status === "Quotation Sent"),
    [jobs]
  );

  const jobsMissingPr = useMemo(
    () => jobs.filter((j) => !j.pr_number),
    [jobs]
  );

  const missingPrTotal =
    quotationsMissingPr.length +
    invoicesMissingPr.length +
    jobsMissingPr.length;

  return (
    <main className="min-h-screen bg-ies-canvas p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-ies-muted">
              Overview
            </p>

            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-ies-ink">
              Dashboard
            </h1>
          </div>

          <div className="flex gap-3">
            <Link
              href="/quotations/new"
              className="rounded-lg bg-ies-blue px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-ies-blue-dark"
            >
              New Quotation
            </Link>

            <Link
              href="/jobs/new"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-ies-ink transition hover:bg-gray-50"
            >
              New Job
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Jobs row */}
        <Section title="Jobs">
          <StatTile
            label="New (Not Yet Quoted)"
            value={loading ? "—" : jobsNew.length}
            href="/jobs"
          />
          <StatTile
            label="Quotation Sent"
            value={loading ? "—" : jobsQuotationSent.length}
            href="/jobs"
          />
          <StatTile
            label="PR Missing"
            value={loading ? "—" : jobsMissingPr.length}
            href="/jobs"
            accent
          />
        </Section>

        {/* Quotations row */}
        <Section title="Quotations">
          <StatTile
            label="Pending (Draft)"
            value={loading ? "—" : quotationsPending.length}
            href="/quotations?status=Draft"
          />
          <StatTile
            label="Sent, Awaiting Decision"
            value={loading ? "—" : quotationsSent.length}
            href="/quotations?status=Submitted"
          />
          <StatTile
            label="Approved, Not Invoiced"
            value={loading ? "—" : quotationsApprovedNotInvoiced.length}
            href="/quotations?status=Approved"
            accent
          />
        </Section>

        {/* Invoices row */}
        <Section title="Invoices">
          <StatTile
            label="Pending Payment"
            value={loading ? "—" : invoicesPendingPayment.length}
            href="/invoices?status=Sent"
            accent
          />
          <StatTile
            label="Paid"
            value={loading ? "—" : invoicesPaid.length}
            href="/invoices?status=Paid"
          />
          <StatTile
            label="Outstanding Amount"
            value={loading ? "—" : `Rs. ${money(outstandingAmount)}`}
            href="/invoices"
          />
        </Section>

        {/* Needs attention: PR missing + pending items, actionable */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-ies-ink">
              Needs Attention
            </h2>
            <p className="mt-0.5 text-xs text-ies-muted">
              {missingPrTotal} document
              {missingPrTotal === 1 ? "" : "s"} missing a PR number.
            </p>
          </div>

          {loading ? (
            <p className="px-6 py-8 text-sm text-ies-muted">
              Loading...
            </p>
          ) : missingPrTotal === 0 ? (
            <p className="px-6 py-8 text-sm text-ies-muted">
              Nothing missing a PR number right now.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {quotationsMissingPr.map((q) => (
                <Link
                  key={`q-${q.id}`}
                  href={`/quotations/${q.id}`}
                  className="flex items-center justify-between px-6 py-3.5 transition hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ies-ink">
                      {q.reference_number}{" "}
                      <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                        Quotation · No PR
                      </span>
                    </p>
                    <p className="truncate text-xs text-ies-muted">
                      {q.customer_name} · {q.branch_name}
                    </p>
                  </div>

                  <p className="ml-4 shrink-0 text-sm text-ies-muted">
                    {q.status}
                  </p>
                </Link>
              ))}

              {invoicesMissingPr.map((inv) => (
                <Link
                  key={`inv-${inv.id}`}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between px-6 py-3.5 transition hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ies-ink">
                      {inv.invoice_number}{" "}
                      <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                        Invoice · No PR
                      </span>
                    </p>
                    <p className="truncate text-xs text-ies-muted">
                      {inv.customer_name} · {inv.branch_name}
                    </p>
                  </div>

                  <p className="ml-4 shrink-0 text-sm text-ies-muted">
                    {inv.status}
                  </p>
                </Link>
              ))}

              {jobsMissingPr.map((job) => (
                <Link
                  key={`job-${job.id}`}
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between px-6 py-3.5 transition hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ies-ink">
                      {job.job_number}{" "}
                      <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                        Job · No PR
                      </span>
                    </p>
                  </div>

                  <p className="ml-4 shrink-0 text-sm text-ies-muted">
                    {job.status}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-ies-ink">
        {title}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: string | number;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow"
    >
      <div
        className={`mb-3 h-1 w-8 rounded-full ${
          accent ? "bg-ies-red" : "bg-ies-blue"
        }`}
      />

      <p className="text-2xl font-semibold tracking-tight text-ies-ink">
        {value}
      </p>

      <p className="mt-1 text-sm text-ies-ink/70">{label}</p>
    </Link>
  );
}