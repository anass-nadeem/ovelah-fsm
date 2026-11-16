"use client";

import { useEffect, useState } from "react";

type Balance = {
  name: string;
  unpaid_invoice_total: number | string;
  manual_receivable: number | string;
  manual_payable: number | string;
  net_balance: number | string;
};

const API_URL = "http://127.0.0.1:8000";

function money(value: number | string) {
  return Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BalancesPage() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBalances();
  }, []);

  async function loadBalances() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/balances/customers`);

      if (!response.ok) {
        throw new Error("Failed to load balances.");
      }

      setBalances(await response.json());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load balances."
      );
    } finally {
      setLoading(false);
    }
  }

  const totalOwedToUs = balances.reduce(
    (sum, b) => sum + Math.max(0, Number(b.net_balance || 0)),
    0
  );

  const totalWeOwe = balances.reduce(
    (sum, b) => sum + Math.max(0, -Number(b.net_balance || 0)),
    0
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">

        <div>
          <p className="text-sm font-medium text-gray-500">Balances</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            Customer Debt
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Automatically calculated from unpaid invoices, combined with
            any manual entries from the Credits page.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Owed To Us (Total)
            </p>
            <p className="mt-1 text-2xl font-semibold text-green-600">
              Rs. {money(totalOwedToUs)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              We Owe (Total)
            </p>
            <p className="mt-1 text-2xl font-semibold text-red-600">
              Rs. {money(totalWeOwe)}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500">
              Loading balances...
            </div>
          ) : balances.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-gray-700">
                No outstanding balances.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Everything is settled - no unpaid invoices or open credit
                records right now.
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Unpaid Invoices
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Manual Adjustments
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Net Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {balances.map((b) => {
                  const net = Number(b.net_balance || 0);
                  const manualNet =
                    Number(b.manual_receivable || 0) -
                    Number(b.manual_payable || 0);

                  return (
                    <tr
                      key={b.name}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 font-medium text-gray-900">
                        {b.name}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-600">
                        Rs. {money(b.unpaid_invoice_total)}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-600">
                        {manualNet === 0
                          ? "—"
                          : `${manualNet > 0 ? "+" : "-"}Rs. ${money(
                              Math.abs(manualNet)
                            )}`}
                      </td>
                      <td
                        className={`px-4 py-4 text-right font-semibold ${
                          net > 0
                            ? "text-green-600"
                            : net < 0
                            ? "text-red-600"
                            : "text-gray-500"
                        }`}
                      >
                        {net === 0
                          ? "Settled"
                          : net > 0
                          ? `Owes us Rs. ${money(net)}`
                          : `We owe Rs. ${money(Math.abs(net))}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </main>
  );
}