import { Suspense } from "react";
import QuotationForm from "@/components/quotation/QuotationForm";

export default function NewQuotationPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <Suspense fallback={null}>
        <QuotationForm />
      </Suspense>
    </main>
  );
}