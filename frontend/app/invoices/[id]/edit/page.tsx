"use client";

import { useParams } from "next/navigation";
import EditInvoiceForm from "@/components/invoice/EditInvoiceForm";

export default function EditInvoicePage() {
  const params = useParams();

  const invoiceId = Number(params.id);

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <EditInvoiceForm invoiceId={invoiceId} />
    </main>
  );
}