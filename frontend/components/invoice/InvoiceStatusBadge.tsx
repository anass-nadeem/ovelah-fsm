type Props = {
  status: string;
};

export default function InvoiceStatusBadge({
  status,
}: Props) {
  const styles: Record<string, string> = {
    Draft:
      "bg-gray-100 text-gray-700 border-gray-200",

    Sent:
      "bg-blue-50 text-blue-700 border-blue-200",

    Paid:
      "bg-green-50 text-green-700 border-green-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
        styles[status] ??
        "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {status}
    </span>
  );
}