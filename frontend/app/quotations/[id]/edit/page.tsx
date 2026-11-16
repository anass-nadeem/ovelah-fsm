"use client";

import { useParams } from "next/navigation";
import EditQuotationForm from "@/components/quotation/EditQuotationForm";

export default function EditQuotationPage() {
  const params = useParams();

  const quotationId = Number(params.id);

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <EditQuotationForm quotationId={quotationId} />
    </main>
  );
}