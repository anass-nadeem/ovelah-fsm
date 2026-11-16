"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import QuotationHeader from "./QuotationHeader";
import QuotationItemsTable, {
  QuotationRow,
} from "./QuotationItemsTable";
import QuotationSummary from "./QuotationSummary";

const API_URL = "http://127.0.0.1:8000";

type QuotationItem = {
  id: number;
  sr_no: number;
  item_id: number | null;
  description: string;
  qty: number | string;
  uom: string;
  unit_rate: number | string;
  amount: number | string;
};

type Quotation = {
  id: number;
  job_id: number | null;
  reference_number: string;
  date: string;
  ntn_number: string | null;
  pr_number: string | null;
  customer_name: string;
  branch_name: string;
  customer_id: number | null;
  branch_id: number | null;
  assigned_by: string | null;
  subject: string | null;
  description: string | null;
  payment_terms: string;
  validity: string;
  job_completion: string;
  items: QuotationItem[];
};

type Props = {
  quotationId: number;
};

export default function EditQuotationForm({
  quotationId,
}: Props) {
  const router = useRouter();

  const [quotation, setQuotation] =
    useState<Quotation | null>(null);

  const [quotationDate, setQuotationDate] =
    useState("");

    const [customerName, setCustomerName] =
    useState("");

  const [customerId, setCustomerId] =
    useState<number | null>(null);

  const [branchName, setBranchName] =
    useState("");

  const [branchId, setBranchId] =
    useState<number | null>(null);

  const [assignedBy, setAssignedBy] =
    useState("");

  const [prNumber, setPrNumber] =
    useState("");

  const [ntnNumber, setNtnNumber] =
    useState("");

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

  const [revisionDescription, setRevisionDescription] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const total = useMemo(() => {
    return rows.reduce(
      (sum, row) =>
        sum + row.qty * row.unit_rate,
      0
    );
  }, [rows]);

  useEffect(() => {
    loadQuotation();
  }, [quotationId]);

  async function loadQuotation() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/quotations/${quotationId}`
      );

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "Quotation not found."
            : "Failed to load quotation."
        );
      }

      const data: Quotation =
        await response.json();

      setQuotation(data);

      setQuotationDate(data.date);
            setCustomerName(data.customer_name);
      setCustomerId(data.customer_id);
      setBranchName(data.branch_name);
      setBranchId(data.branch_id);
      setAssignedBy(data.assigned_by || "");
      setPrNumber(data.pr_number || "");
      setNtnNumber(data.ntn_number || "");
      setSubject(data.subject || "");
      setDescription(data.description || "");

      setPaymentTerms(
        data.payment_terms ||
          "As per KFC Policy."
      );

      setValidity(
        data.validity ||
          "15 Days."
      );

      setJobCompletion(
        data.job_completion ||
          "within 2-3 working days."
      );

      setRows(
        data.items.map((item) => ({
          id: crypto.randomUUID(),
          item_id: item.item_id,
          description: item.description,
          qty: Number(item.qty),
          uom: item.uom,
          unit_rate: Number(item.unit_rate),
        }))
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load quotation."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    setError("");

    if (!revisionDescription.trim()) {
      setError(
        "Please describe what you changed before saving."
      );
      return;
    }

    if (!customerName) {
      setError("Please select a customer.");
      return;
    }

    if (!branchName) {
      setError("Please select a branch.");
      return;
    }

    if (rows.length === 0) {
      setError(
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
      setError(
        "Please complete all quotation rows correctly."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/quotations/${quotationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quotation_date: quotationDate,
            ntn_number: ntnNumber,
            pr_number: prNumber || null,

                        customer_name: customerName,
            customer_id: customerId,
            branch_name: branchName,
            branch_id: branchId,

            assigned_by:
              assignedBy || null,

            subject:
              subject || null,

            description:
              description || null,

            payment_terms:
              paymentTerms,

            validity:
              validity,

            job_completion:
              jobCompletion,

            revision_description:
              revisionDescription.trim(),

            items: rows.map((row) => ({
              item_id: row.item_id,
              description:
                row.description,
              qty: row.qty,
              uom: row.uom,
              unit_rate:
                row.unit_rate,
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorData =
          await response.json();

        throw new Error(
          errorData.detail ||
            "Failed to update quotation."
        );
      }

      router.push(
        `/quotations/${quotationId}`
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update quotation."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Loading quotation...
          </p>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8">
          <h1 className="text-lg font-semibold text-red-800">
            Unable to load quotation
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {error || "Quotation not found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      {/* Page Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/quotations/${quotationId}`
              )
            }
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            ← Back to Quotation
          </button>

          <p className="mt-4 text-sm font-medium text-gray-500">
            Editing Quotation
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {quotation.reference_number}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Modify quotation details and record the reason
            for this revision.
          </p>
        </div>
      </div>

      {/* Form */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

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

          onCustomerChange={setCustomerName}
          onBranchChange={setBranchName}
          onAssignedByChange={setAssignedBy}
          onPrNumberChange={setPrNumber}
          onQuotationDateChange={setQuotationDate}
          onSubjectChange={setSubject}
          onDescriptionChange={setDescription}
          onPaymentTermsChange={setPaymentTerms}
          onValidityChange={setValidity}
          onJobCompletionChange={setJobCompletion}
        />

        <div className="my-8 border-t border-gray-200" />

        <QuotationItemsTable
          rows={rows}
          onChange={setRows}
        />

        <div className="my-8 border-t border-gray-200" />

        <QuotationSummary total={total} />

        {/* Revision Description */}

        <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-900">
              Revision Description
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Describe what you changed and why. This will
              be permanently recorded in the quotation's
              revision history.
            </p>
          </div>

          <textarea
            value={revisionDescription}
            onChange={(e) =>
              setRevisionDescription(
                e.target.value
              )
            }
            rows={4}
            placeholder="e.g. Updated R22 gas charging rate and changed compressor quantity from 1 to 2."
            className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
          />
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/quotations/${quotationId}`
              )
            }
            disabled={saving}
            className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={saveChanges}
            disabled={saving}
            className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving Revision..."
              : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
}