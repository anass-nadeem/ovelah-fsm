"use client";

import { useEffect, useState } from "react";

type Settings = {
  id: number;
  company_name: string;
  ntn_number: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
};

const API_URL = "http://127.0.0.1:8000";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [ntnNumber, setNtnNumber] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/settings/`);

      if (!response.ok) {
        throw new Error("Failed to load settings.");
      }

      const data: Settings = await response.json();

      setSettings(data);
      setCompanyName(data.company_name || "");
      setNtnNumber(data.ntn_number || "");
      setAddress(data.address || "");
      setPhone(data.phone || "");
      setEmail(data.email || "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load settings."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/settings/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName.trim(),
          ntn_number: ntnNumber.trim() || null,
          address: address.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to save settings.");
      }

      setSettings(data);
      setMessage("Settings saved.");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-sm text-gray-500">Loading settings...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-2xl space-y-6">

        <div>
          <p className="text-sm font-medium text-gray-500">Settings</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            Company Settings
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            This information appears on every generated quotation and
            invoice PDF.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {settings && (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Company Name
              </label>

              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                NTN Number
              </label>

              <input
                type="text"
                value={ntnNumber}
                onChange={(e) => setNtnNumber(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Address
              </label>

              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone
                </label>

                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              {message && (
                <p className="text-sm text-gray-500">{message}</p>
              )}
            </div>
          </form>
        )}

        <p className="text-xs text-gray-400">
          Note: this doesn&apos;t yet control the PDF templates directly —
          the logo, signature, and stamp on generated documents are still
          fixed image assets. This just centralizes the text fields.
        </p>

      </div>
    </main>
  );
}