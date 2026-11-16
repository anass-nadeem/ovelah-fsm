"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import QuotationHeader from "./QuotationHeader";
import QuotationItemsTable, {
  QuotationRow,
} from "./QuotationItemsTable";
import QuotationSummary from "./QuotationSummary";

const API_URL = "http://127.0.0.1:8000";

export default function QuotationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobIdParam = searchParams.get("job_id");
  const jobId = jobIdParam ? Number(jobIdParam) : null;

  const [jobLoadError, setJobLoadError] = useState("");
  const today = new Date()
    .toISOString()
    .split("T")[0];

  const [quotationDate, setQuotationDate] =
    useState(today);

    const [customerName, setCustomerName] =
    useState("");

  const [customerId, setCustomerId] =
    useState<number | null>(null);

  const [branchName, setBranchName] =
    useState("");

  const [branchId, setBranchId] =
    useState<number | null>(null);

  const [assignedBy, setAssignedBy] =
    useState("Mainte Department");

  const [prNumber, setPrNumber] =
    useState("");

  const [ntnNumber, setNtnNumber] =
    useState("I299711-2");

  const [subject, setSubject] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [paymentTerms, setPaymentTerms] =
    useState("As per KFC Policy.");

  const [validity, setValidity] =
    useState("15 Days.");

  const [jobCompletion, setJobCompletion] =
    useState("within 2-3 working days.");

  const [rows, setRows] =
    useState<QuotationRow[]>([]);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  // If we arrived here from a Job (e.g. "Create Quotation" on a
  // job's page), pull the customer/branch/PR number from that job
  // instead of asking the user to re-enter them.
  useEffect(() => {
    if (!jobId) return;

    async function prefillFromJob() {
      try {
        const jobRes = await fetch(`${API_URL}/jobs/${jobId}`);

        if (!jobRes.ok) {
          throw new Error("Could not load the linked job.");
        }

        const job = await jobRes.json();

        if (job.pr_number) {
          setPrNumber(job.pr_number);
        }

        const branchRes = await fetch(
          `${API_URL}/branches/${job.branch_id}`
        );

        if (branchRes.ok) {
          const branch = await branchRes.json();
          setBranchName(branch.name);
          setBranchId(branch.id);

          const customerRes = await fetch(
            `${API_URL}/customers/${branch.customer_id}`
          );

          if (customerRes.ok) {
            const customer = await customerRes.json();
            setCustomerName(customer.name);
            setCustomerId(customer.id);
          }
        }
      } catch (error) {
        console.error("Failed to prefill from job:", error);
        setJobLoadError(
          "Couldn't load details from the linked job - please fill them in manually."
        );
      }
    }

    prefillFromJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const total = useMemo(() => {
    return rows.reduce(
      (sum, row) =>
        sum + row.qty * row.unit_rate,
      0
    );
  }, [rows]);

  async function saveQuotation() {
    setMessage("");

    if (!customerName) {
      setMessage("Please select a customer.");
      return;
    }

    if (!branchName) {
      setMessage("Please select a branch.");
      return;
    }

    if (!rows.length) {
      setMessage(
        "Please add at least one quotation item."
      );
      return;
    }

    const invalidRow = rows.find(
      (row) =>
        !row.description.trim() ||
        row.qty <= 0 ||
        row.unit_rate < 0
    );

    if (invalidRow) {
      setMessage(
        "Please complete all quotation rows correctly."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/quotations/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            job_id: jobId,

            quotation_date:
              quotationDate,

            ntn_number:
              ntnNumber || null,

            pr_number:
              prNumber || null,

            customer_name:
              customerName,

              branch_name:
              branchName,

            customer_id:
              customerId,

            branch_id:
              branchId,

            assigned_by:
              assignedBy || null,

            subject:
              subject || null,

            description:
              description || null,

            items: rows.map((row) => ({
              item_id:
                row.item_id,

              description:
                row.description,

              qty:
                row.qty,

              uom:
                row.uom,

              unit_rate:
                row.unit_rate,
            })),

            payment_terms:
              paymentTerms || null,

            validity:
              validity || null,

            job_completion:
              jobCompletion || null,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Failed to save quotation.";

        try {
          const error =
            await response.json();

          errorMessage =
            error.detail ||
            errorMessage;
        } catch {
          // Keep default error message
        }

        throw new Error(errorMessage);
      }

      const quotation =
        await response.json();

      router.push(`/quotations/${quotation.id}`);
    } catch (error) {
      console.error(
        "Failed to save quotation:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save quotation."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page heading */}
      <div>
        <p className="text-sm font-medium text-gray-500">
          Quotations
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
          New Quotation
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Create a quotation using your saved items or
          enter items manually.
        </p>
      </div>

      {jobId && !jobLoadError && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Customer, branch, and PR number have been filled in from
          the linked job where available.
        </div>
      )}

      {jobLoadError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {jobLoadError}
        </div>
      )}

      {/* Main form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

        {/* Quotation Header */}
          <QuotationHeader
          customerName={customerName}
          onCustomerIdChange={setCustomerId}
          branchName={branchName}
          onBranchIdChange={setBranchId}
          assignedBy={assignedBy}
          prNumber={prNumber}
          ntnNumber={ntnNumber}
          quotationDate={quotationDate}
          subject={subject}
          description={description}
          paymentTerms={paymentTerms}
          validity={validity}
          jobCompletion={jobCompletion}

          onCustomerChange={
            setCustomerName
          }

          onBranchChange={
            setBranchName
          }

          onAssignedByChange={
            setAssignedBy
          }

          onPrNumberChange={
            setPrNumber
          }

          onQuotationDateChange={
            setQuotationDate
          }

          onSubjectChange={
            setSubject
          }

          onDescriptionChange={
            setDescription
          }

          onPaymentTermsChange={
            setPaymentTerms
          }

          onValidityChange={
            setValidity
          }

          onJobCompletionChange={
            setJobCompletion
          }
        />

        <div className="my-8 border-t border-gray-200" />

        {/* Quotation Items */}
        <QuotationItemsTable
          rows={rows}
          onChange={setRows}
        />

        <div className="my-8 border-t border-gray-200" />

        {/* Summary */}
        <QuotationSummary
          total={total}
        />

        {/* Message */}
        {message && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            {message}
          </div>
        )}

        {/* Save */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={saveQuotation}
            disabled={saving}
            className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Quotation"}
          </button>
        </div>
      </div>
    </div>
  );
}