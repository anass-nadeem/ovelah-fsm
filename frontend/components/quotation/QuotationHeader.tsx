"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: number;
  name: string;
  requires_pr_number: boolean;
};

type Branch = {
  id: number;
  customer_id: number;
  name: string;
  address: string | null;
  site_id: string | null;
};

type Props = {
  customerName: string;
  branchName: string;
  assignedBy: string;
  prNumber: string;
  ntnNumber: string;
  quotationDate: string;
  subject: string;
  description: string;
  paymentTerms: string;
  validity: string;
  jobCompletion: string;

  onCustomerChange: (value: string) => void;
  onCustomerIdChange: (value: number | null) => void;
  onBranchChange: (value: string) => void;
  onBranchIdChange: (value: number | null) => void;
  onAssignedByChange: (value: string) => void;
  onPrNumberChange: (value: string) => void;
  onQuotationDateChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPaymentTermsChange: (value: string) => void;
  onValidityChange: (value: string) => void;
  onJobCompletionChange: (value: string) => void;
};

const API_URL = "http://127.0.0.1:8000";

export default function QuotationHeader({
  customerName,
  branchName,
  assignedBy,
  prNumber,
  ntnNumber,
  quotationDate,
  subject,
  description,
  paymentTerms,
  validity,
  jobCompletion,

  onCustomerChange,
  onCustomerIdChange,
  onBranchChange,
  onBranchIdChange,
  onAssignedByChange,
  onPrNumberChange,
  onQuotationDateChange,
  onSubjectChange,
  onDescriptionChange,
  onPaymentTermsChange,
  onValidityChange,
  onJobCompletionChange,
}: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/customers/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch customers");
        }
        return response.json();
      })
      .then((data) => setCustomers(data))
      .catch((error) => {
        console.error("Failed to load customers:", error);
      });
  }, []);

  useEffect(() => {
    const customer = customers.find(
      (item) => item.name === customerName
    );

    if (!customer) {
      setBranches([]);
      return;
    }

    fetch(`${API_URL}/branches/?customer_id=${customer.id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch branches");
        }
        return response.json();
      })
      .then((data) => setBranches(data))
      .catch((error) => {
        console.error("Failed to load branches:", error);
      });
  }, [customerName, customers]);

  const selectedCustomer = customers.find(
    (item) => item.name === customerName
  );

  const showPrNumber = selectedCustomer
    ? selectedCustomer.requires_pr_number
    : true;

  return (
    <div className="space-y-6">
      {/* Main quotation information */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Customer */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Customer
          </label>
          <select
            value={customerName}
            onChange={(e) => {
              const name = e.target.value;
              onCustomerChange(name);
              onBranchChange("");
              onBranchIdChange(null);
              const matched = customers.find(
                (item) => item.name === name
              );
              onCustomerIdChange(matched ? matched.id : null);
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
          >
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.name}>
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
            value={branchName}
            onChange={(e) => {
              const name = e.target.value;
              onBranchChange(name);
              const matched = branches.find(
                (item) => item.name === name
              );
              onBranchIdChange(matched ? matched.id : null);
            }}
            disabled={!customerName}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-900 disabled:bg-gray-100"
          >
            <option value="">
              {customerName
                ? "Select branch"
                : "Select customer first"}
            </option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.name}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        {/* PR Number */}
        {showPrNumber && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              PR Number
            </label>
            <input
              value={prNumber}
              onChange={(e) => onPrNumberChange(e.target.value)}
              placeholder="Enter PR number"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
            />
          </div>
        )}

        {/* NTN Number */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            NTN Number
          </label>
          <input
            value={ntnNumber}
            readOnly
            className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2.5 text-sm text-gray-600 outline-none"
          />
        </div>

        {/* Quotation Date */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Quotation Date
          </label>
          <input
            type="date"
            value={quotationDate}
            onChange={(e) =>
              onQuotationDateChange(e.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
          />
        </div>

        {/* Assigned By */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Assigned By
          </label>
          <select
            value={assignedBy}
            onChange={(e) =>
              onAssignedByChange(e.target.value)
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
          >
            <option value="">Select department</option>
            <option value="Mainte Department">
              Mainte Department
            </option>
          </select>
        </div>

        {/* Subject */}
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Subject
          </label>
          <input
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="Quotation subject"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          placeholder="Describe the work..."
          className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
        />
      </div>

      {/* Quotation Terms */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="mb-4 text-base font-semibold text-gray-900">
          Quotation Terms
        </h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Payment Terms */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Payment Terms
            </label>
            <input
              value={paymentTerms}
              onChange={(e) =>
                onPaymentTermsChange(e.target.value)
              }
              placeholder="Payment terms"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
            />
          </div>

          {/* Validity */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Validity
            </label>
            <input
              value={validity}
              onChange={(e) =>
                onValidityChange(e.target.value)
              }
              placeholder="15 Days."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
            />
          </div>

          {/* Job Completion */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Job Completion
            </label>
            <input
              value={jobCompletion}
              onChange={(e) =>
                onJobCompletionChange(e.target.value)
              }
              placeholder="within 2-3 working days."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
}