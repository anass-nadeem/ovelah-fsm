type Props = {
  total: number;
};

export default function QuotationSummary({
  total,
}: Props) {
  return (
    <div className="flex justify-end">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-gray-50 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Total Amount
          </span>

          <span className="text-2xl font-semibold text-gray-900">
            Rs.{" "}
            {total.toLocaleString("en-PK", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}